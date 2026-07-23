# =========================================================================================
# ALMS Frontend - S3 & CloudFront Deployment Script (Standalone + Static Assets)
# =========================================================================================
# Architecture:
#   CloudFront serves:
#     /_next/static/*  -> S3 (static assets, edge-cached)
#     /public/*        -> S3 (public files, edge-cached)
#     /*               -> EC2 (Next.js standalone server for SSR, middleware, rewrites)
#     /api/*           -> EC2 (Backend Docker on port 3001)
# =========================================================================================

# --- CONFIGURATION ----------------------------------------------------------------------
$S3BucketName             = "alms-frontend-prod-bucket"
$CloudFrontDistributionId = ""
$AWSRegion                = "ap-south-1"
$FrontendDir              = $PSScriptRoot

# --- AWS CREDENTIALS --------------------------------------------------------------------
# Do NOT hardcode credentials! Provide via:
#   - Environment variables:  $env:AWS_ACCESS_KEY_ID, $env:AWS_SECRET_ACCESS_KEY
#   - AWS CLI profile:        $env:AWS_PROFILE = "your-profile"
#   - IAM instance role:      (recommended)
if (-not $env:AWS_ACCESS_KEY_ID -and -not $env:AWS_PROFILE) {
    Write-Host "[WARN] AWS credentials not found." -ForegroundColor Yellow
}
$env:AWS_DEFAULT_REGION = $AWSRegion
# ----------------------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Type = "Info")
    $dt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Type) {
        "Success" { Write-Host "[$dt] [OK] $Message" -ForegroundColor Green }
        "Warning" { Write-Host "[$dt] [WARN] $Message" -ForegroundColor Yellow }
        "Error"   { Write-Host "[$dt] [FAIL] $Message" -ForegroundColor Red }
        "Debug"   { Write-Host "[$dt] [-] $Message" -ForegroundColor DarkGray }
        Default   { Write-Host "[$dt] [INFO] $Message" -ForegroundColor Cyan }
    }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Log "ALMS Frontend - S3 & CloudFront Deployment" -Type "Info"
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Verify CLI tools
foreach ($cmd in @("node", "npm", "aws")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "Missing: $cmd" }
}
Write-Log "All CLI tools verified." -Type "Success"

# 2. Build the app (standalone mode - no config modification)
Write-Log "Building Next.js app (output: standalone)..." -Type "Info"
Push-Location $FrontendDir
try {
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
    Write-Log "Build completed successfully." -Type "Success"
} catch {
    Pop-Location; throw $_
}
Pop-Location

# 3. Validate build output
$StaticDir    = Join-Path $FrontendDir ".next\static"
$PublicDir    = Join-Path $FrontendDir "public"
$StandaloneDir = Join-Path $FrontendDir ".next\standalone"

if (-not (Test-Path $StaticDir))     { throw "Build output missing: $StaticDir" }
if (-not (Test-Path $StandaloneDir)) { throw "Standalone server missing: $StandaloneDir" }
Write-Log "Build artifacts validated." -Type "Success"

# 4. Ensure S3 bucket exists
Write-Log "Checking S3 bucket '$S3BucketName'..." -Type "Info"
$bucketExists = $true
$PrevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
    $null = aws s3api head-bucket --bucket $S3BucketName 2>&1
    if ($LASTEXITCODE -ne 0) { $bucketExists = $false }
} catch { $bucketExists = $false }
$ErrorActionPreference = $PrevEAP

if (-not $bucketExists) {
    Write-Log "Creating S3 bucket '$S3BucketName'..." -Type "Warning"
    $createArgs = @("s3api", "create-bucket", "--bucket", $S3BucketName, "--region", $AWSRegion)
    if ($AWSRegion -ne "us-east-1") {
        $createArgs += @("--create-bucket-configuration", "LocationConstraint=$AWSRegion")
    }
    $null = aws $createArgs
    if ($LASTEXITCODE -ne 0) { throw "Failed to create S3 bucket" }
    $null = aws s3api put-public-access-block --bucket $S3BucketName --public-access-block-configuration `
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    Write-Log "S3 bucket created and secured." -Type "Success"
} else {
    Write-Log "S3 bucket exists." -Type "Success"
}

# 5. Apply CloudFront OAC bucket policy (if distribution ID is set)
if (-not [string]::IsNullOrWhiteSpace($CloudFrontDistributionId)) {
    Write-Log "Applying CloudFront OAC policy..." -Type "Info"
    $policy = @"
{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "AllowCloudFrontOAC",
        "Effect": "Allow",
        "Principal": { "Service": "cloudfront.amazonaws.com" },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::$S3BucketName/*",
        "Condition": {
            "StringEquals": {
                "AWS:SourceArn": "arn:aws:cloudfront::*:distribution/$CloudFrontDistributionId"
            }
        }
    }]
}
"@
    $tmpFile = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $tmpFile -Value $policy -Encoding UTF8
    $null = aws s3api put-bucket-policy --bucket $S3BucketName --policy "file://$tmpFile" --region $AWSRegion
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
    Write-Log "OAC policy applied." -Type "Success"
} else {
    Write-Log "CloudFront Distribution ID not set. Skipping OAC policy." -Type "Warning"
}

# 6. Upload static assets to S3 (NOT the entire site - only cacheable static files)
Write-Log "Uploading static assets to S3..." -Type "Info"
$null = aws s3 sync "$StaticDir" "s3://$S3BucketName/_next/static/" --delete --region $AWSRegion
if ($LASTEXITCODE -ne 0) { throw "Static assets upload failed" }
if (Test-Path $PublicDir) {
    $null = aws s3 sync "$PublicDir" "s3://$S3BucketName/" --delete --region $AWSRegion --exclude ".gitkeep"
    if ($LASTEXITCODE -ne 0) { throw "Public assets upload failed" }
}
Write-Log "Static assets uploaded to S3." -Type "Success"

# 7. Cache invalidation
if (-not [string]::IsNullOrWhiteSpace($CloudFrontDistributionId)) {
    Write-Log "Invalidating CloudFront cache..." -Type "Info"
    $result = aws cloudfront create-invalidation --distribution-id $CloudFrontDistributionId --paths "/*" --region $AWSRegion 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Cache invalidation failed: $result" -Type "Warning"
    } else {
        Write-Log "Cache invalidation initiated." -Type "Success"
    }
} else {
    Write-Log "Skipping cache invalidation (no CloudFront Distro ID)." -Type "Info"
}

# 8. Summary
Write-Host "================================================================" -ForegroundColor Green
Write-Log "Deployment Complete!" -Type "Success"
Write-Log "Static assets -> s3://$S3BucketName/" -Type "Info"
Write-Log "" -Type "Info"
Write-Log "NEXT STEP: Deploy standalone server to EC2:" -Type "Info"
Write-Log "  Copy to EC2:" -Type "Info"
Write-Log "    .next/standalone/   -> /home/alms/frontend/" -Type "Info"
Write-Log "    .next/static/       -> /home/alms/frontend/.next/static/" -Type "Info"
Write-Log "    public/             -> /home/alms/frontend/public/" -Type "Info"
Write-Log "    package.json        -> /home/alms/frontend/" -Type "Info"
Write-Log "" -Type "Info"
Write-Log "  Then on EC2:" -Type "Info"
Write-Log "    cd /home/alms/frontend" -Type "Info"
Write-Log "    PORT=5001 NODE_ENV=production node server.js" -Type "Info"
Write-Host "================================================================" -ForegroundColor Green
