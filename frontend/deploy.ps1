# =========================================================================================
# ALMS Frontend S3 & CloudFront Production Deployment Script
# Consolidated & Parser-Safe Edition
# =========================================================================================

# ─── CONFIGURATION ───────────────────────────────────────────────────────────────────────
$S3BucketName             = "alms-frontend-prod-bucket"  # Replace with your S3 Bucket Name
$CloudFrontDistributionId = ""                            # Replace with your CloudFront Distribution ID (Leave empty if creating new)
$AWSRegion                = "ap-south-1"                  # Target AWS Region
$AWSProfile               = "default"                     # AWS CLI Named Profile
$FrontendDir              = $PSScriptRoot
# ─────────────────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

# Helper Function: Structured Logging (Using safe ASCII tags to prevent console parsing errors)
function Write-Log {
    param (
        [Parameter(Mandatory=$true)] [string]$Message,
        [Parameter(Mandatory=$false)] [string]$Type = "Info"
    )
    $DateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Type) {
        "Success" { Write-Host "[$DateTime] [OK] $Message" -ForegroundColor Green }
        "Warning" { Write-Host "[$DateTime] [WARN] $Message" -ForegroundColor Yellow }
        "Error"   { Write-Host "[$DateTime] [FAIL] $Message" -ForegroundColor Red }
        "Debug"   { Write-Host "[$DateTime] [-] $Message" -ForegroundColor DarkGray }
        Default   { Write-Host "[$DateTime] [INFO] $Message" -ForegroundColor Cyan }
    }
}

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Log "Starting Production ALMS Frontend Deployment Pipeline" -Type "Info"
Write-Host "=====================================================================" -ForegroundColor Cyan

# 1. Pipeline Dependency Verification
Write-Log "Verifying local development and deployment environment..." -Type "Info"

$RequiredCommands = @{
    "node" = "Node.js runtime environment is missing."
    "npm"  = "Node Package Manager (npm) is missing."
    "aws"  = "AWS CLI v2 is missing. Please install and configure credentials."
}

foreach ($Cmd in $RequiredCommands.Keys) {
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        Write-Log $RequiredCommands[$Cmd] -Type "Error"
        throw "Prerequisite Check Failed: Missing command line tool: $Cmd"
    }
}
Write-Log "All required CLI systems validated." -Type "Success"

# 2. Prepare next.config.js for Idempotent Static Export
Write-Log "Validating Next.js configuration for production static optimization..." -Type "Info"
$ConfigPath = Join-Path $FrontendDir "next.config.js"
$BackupPath = Join-Path $FrontendDir "next.config.js.bak"

if (-not (Test-Path $ConfigPath)) {
    Write-Log "Failed to find critical project file: $ConfigPath" -Type "Error"
    throw "Build Aborted: next.config.js must exist at root."
}

# Safeguard: Backup original next.config.js configuration
Copy-Item $ConfigPath $BackupPath -Force
Write-Log "Temporary workspace backup created at: $BackupPath" -Type "Debug"

try {
    $ConfigContent = Get-Content $ConfigPath -Raw

    # Dynamically structure output: 'export' if not explicitly defined (Safe wildcard match)
    if ($ConfigContent -notlike "*output:*export*" -and $ConfigContent -notlike "*output:*'export'*" -and $ConfigContent -notlike "*output:*`"export`"*") {
        $ConfigContent = $ConfigContent -replace "const nextConfig = \{", "const nextConfig = {`r`n  output: 'export',"
    }
    
    # Enforce mandatory unoptimized images constraint for isolated static hosting
    if ($ConfigContent -like "*unoptimized:*false*") {
        $ConfigContent = $ConfigContent -replace "unoptimized:\s*false", "unoptimized: true"
    } elseif ($ConfigContent -notlike "*unoptimized:*true*") {
        $ConfigContent = $ConfigContent -replace "images:\s*\{", "images: {`r`n    unoptimized: true,"
    }

    Set-Content $ConfigPath $ConfigContent -NoNewline
    Write-Log "next.config.js optimized for static artifact creation." -Type "Success"
}
catch {
    if (Test-Path $BackupPath) { Move-Item $BackupPath $ConfigPath -Force }
    Write-Log "Failed to parse or re-write Next.js compilation variables." -Type "Error"
    throw $_
}
# 3. Compile Production Bundle
try {
    Write-Log "Initializing project dependency tree and building production target..." -Type "Info"
    Push-Location $FrontendDir

    Write-Log "Running cleaner dependency tree installation..." -Type "Debug"
    # Using explicit .cmd extension to prevent PowerShell ampersand call parsing glitches
    npm.cmd install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }

    Write-Log "Compiling production static assets via Next lifecycle hooks..." -Type "Debug"
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }

    Pop-Location
    Write-Log "Production application target built successfully." -Type "Success"
    
    if (Test-Path $BackupPath) {
        Move-Item $BackupPath $ConfigPath -Force
        Write-Log "Restored original workspace environment configurations." -Type "Debug"
    }
}
catch {
    Pop-Location
    if (Test-Path $BackupPath) { Move-Item $BackupPath $ConfigPath -Force }
    Write-Log "Compilation processing routine experienced a critical error." -Type "Error"
    throw $_
}

# Validate production export target structure
$OutputDir = Join-Path $FrontendDir "out"
if (-not (Test-Path $OutputDir)) {
    Write-Log "Build lifecycle passed but deployment target artifact directory '$OutputDir' is absent." -Type "Error"
    throw "Deployment Aborted: Static asset generation path missing."
}

# 4. Storage Infrastructure Orchestration & OAC Security Hardening
Write-Log "Evaluating S3 destination infrastructure for '$S3BucketName'..." -Type "Info"

$AwsArgs = @()
if ($AWSProfile) { $AwsArgs += @("--profile", $AWSProfile) }

$BucketExists = $true
$Null = aws s3api head-bucket --bucket $S3BucketName $AwsArgs 2>&1
if ($LASTEXITCODE -ne 0) {
    $BucketExists = $false
}

if (-not $BucketExists) {
    Write-Log "S3 bucket '$S3BucketName' does not exist. Initializing provisioning lifecycle..." -Type "Warning"
    
    $CreateArgs = @("s3api", "create-bucket", "--bucket", $S3BucketName, "--region", $AWSRegion) + $AwsArgs
    if ($AWSRegion -ne "us-east-1") {
        $CreateArgs += @("--create-bucket-configuration", "LocationConstraint=$AWSRegion")
    }
    
    Write-Log "Creating S3 bucket in region '$AWSRegion'..." -Type "Debug"
    $Null = aws $CreateArgs
    if ($LASTEXITCODE -ne 0) { throw "Failed to create S3 bucket '$S3BucketName'." }
    Write-Log "S3 bucket created successfully." -Type "Success"

    Write-Log "Enforcing explicit Public Access Blocks on bucket..." -Type "Debug"
    $BlockArgs = @(
        "s3api", "put-public-access-block", 
        "--bucket", $S3BucketName, 
        "--region", $AWSRegion,
        "--public-access-block-configuration", "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    ) + $AwsArgs
    $Null = aws $BlockArgs
    if ($LASTEXITCODE -ne 0) { throw "Failed to apply Public Access Block configurations." }
    Write-Log "Public access block successfully applied and sealed." -Type "Success"
} else {
    Write-Log "S3 bucket '$S3BucketName' verified to exist. Skipping creation." -Type "Success"
}

if (-not [string]::IsNullOrWhiteSpace($CloudFrontDistributionId)) {
    Write-Log "Injecting authoritative Origin Access Control (OAC) policy for Distribution: $CloudFrontDistributionId" -Type "Info"
    
    $BucketArn = "arn:aws:s3:::$S3BucketName"
    
    $OacPolicyJson = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipalReadOnly",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "$BucketArn/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::*:distribution/$CloudFrontDistributionId"
                }
            }
        }
    ]
}
"@

    $TempPolicyFile = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $TempPolicyFile -Value $OacPolicyJson -Encoding UTF8
    
    Write-Log "Applying IAM Policy updates to target bucket..." -Type "Debug"
    $PolicyArgs = @("s3api", "put-bucket-policy", "--bucket", $S3BucketName, "--policy", "file://$TempPolicyFile", "--region", $AWSRegion) + $AwsArgs
    $Null = aws $PolicyArgs
    
    Remove-Item $TempPolicyFile -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -ne 0) { throw "Failed to apply CloudFront OAC S3 Bucket Policy permissions." }
    Write-Log "S3 Bucket policy updated. Content restricted solely to CloudFront OAC." -Type "Success"
} else {
    Write-Log "CloudFront Distribution ID is currently unassigned. Skipping OAC bucket policy modification." -Type "Warning"
}

# 5. Delta Synchronization to S3 Storage Core
Write-Log "Initializing edge file synchronization to S3 bucket target..." -Type "Info"

$SyncArgs = @("s3", "sync", "$OutputDir", "s3://$S3BucketName", "--delete", "--region", $AWSRegion) + $AwsArgs
Write-Log "Executing operational command: aws $($SyncArgs -join ' ')" -Type "Debug"

& aws $SyncArgs
if ($LASTEXITCODE -ne 0) { 
    throw "Deployment Aborted: Static asset upload failed during S3 synchronization cycle." 
}
Write-Log "Static content delta fully synchronized to S3 storage engine (-delete enabled)." -Type "Success"

# 6. Edge Caching & Distribution Cache Invalidation Lifecycle
if ([string]::IsNullOrWhiteSpace($CloudFrontDistributionId)) {
    Write-Host "---------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Log "Deployment Notice: CloudFront Distribution ID is unconfigured or blank." -Type "Warning"
    Write-Log "Skipping cache invalidation step." -Type "Info"
    Write-Log "Your frontend build outputs are safely sitting inside your private S3 bucket." -Type "Success"
    Write-Host "---------------------------------------------------------------------" -ForegroundColor Yellow
} else {
    Write-Log "Initiating cache eviction cascade across edge nodes for CDN Distribution ID: $CloudFrontDistributionId" -Type "Info"
    
    $InvalidationArgs = @("cloudfront", "create-invalidation", "--distribution-id", $CloudFrontDistributionId, "--paths", "/*", "--region", $AWSRegion) + $AwsArgs
    Write-Log "Executing operational command: aws $($InvalidationArgs -join ' ')" -Type "Debug"

    $InvalidationRaw = & aws $InvalidationArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Failed to execute CloudFront cache eviction: $InvalidationRaw" -Type "Error"
        throw "Deployment Pipeline Interrupted: CloudFront invalidation request rejected."
    }

    try {
        $InvalidationResult = $InvalidationRaw | ConvertFrom-Json
        $InvalidationId = $InvalidationResult.Invalidation.Id
        Write-Log "Cache invalidation successfully acknowledged by AWS Edge (ID: $InvalidationId)." -Type "Success"
    }
    catch {
        Write-Log "Successfully initiated invalidation but parsing edge status code response failed." -Type "Warning"
    }
}

# ─── PIPELINE CLEANUP & VALIDATION METRICS ────────────────────────────────────────────────
Write-Host "=====================================================================" -ForegroundColor Green
Write-Log "ALMS Frontend Production Pipeline Executed Successfully!" -Type "Success"
Write-Log "Target Deployment S3 Bucket: s3://$S3BucketName" -Type "Info"
if (-not [string]::IsNullOrWhiteSpace($CloudFrontDistributionId)) {
    Write-Log "Target Distribution ID:     $CloudFrontDistributionId" -Type "Info"
}
Write-Host "=====================================================================" -ForegroundColor Green