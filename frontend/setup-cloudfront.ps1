# =========================================================================================
# ALMS Frontend - One-time CloudFront setup for the static S3 site
# =========================================================================================
# Run this ONCE to create:
#   1. A CloudFront Origin Access Control (OAC) so the S3 bucket can stay private
#   2. A CloudFront Function that maps clean URLs to the .html files Next's static
#      export produces (e.g. /login -> /login.html, / -> /index.html) — S3/CloudFront
#      don't do this mapping on their own
#   3. The CloudFront Distribution itself, using the default *.cloudfront.net domain
#      (no custom domain/ACM cert configured — add one later if needed)
#
# After this finishes, copy the printed Distribution ID into $CloudFrontDistributionId
# in deploy.ps1, then run .\deploy.ps1 to upload the site and it will start serving.
# =========================================================================================

$S3BucketName = "alms-frontend-static-651200558244"
$AWSRegion    = "ap-south-1"
$FunctionName = "alms-frontend-url-rewrite"

$ErrorActionPreference = "Stop"

# aws CLI's JSON parser chokes on a UTF-8 BOM, which Set-Content -Encoding UTF8
# writes by default in Windows PowerShell 5.1 — write files without one.
function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

function Write-Log {
    param([string]$Message, [string]$Type = "Info")
    $dt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Type) {
        "Success" { Write-Host "[$dt] [OK] $Message" -ForegroundColor Green }
        "Warning" { Write-Host "[$dt] [WARN] $Message" -ForegroundColor Yellow }
        "Error"   { Write-Host "[$dt] [FAIL] $Message" -ForegroundColor Red }
        Default   { Write-Host "[$dt] [INFO] $Message" -ForegroundColor Cyan }
    }
}

foreach ($cmd in @("aws")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "Missing: $cmd" }
}

$tmpDir = Join-Path $env:TEMP "alms-cf-setup"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

# 1. Ensure the S3 bucket exists (deploy.ps1 also creates it, but this script can run first)
Write-Log "Checking S3 bucket '$S3BucketName'..." -Type "Info"
$PrevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$null = aws s3api head-bucket --bucket $S3BucketName 2>&1
$bucketExists = ($LASTEXITCODE -eq 0)
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

$accountId = aws sts get-caller-identity --query Account --output text
if ($LASTEXITCODE -ne 0) { throw "Failed to resolve AWS account ID (check credentials)" }
$s3OriginDomain = "$S3BucketName.s3.$AWSRegion.amazonaws.com"

# 2. Create the Origin Access Control (reuse it if a previous run already created one)
$oacName = "$S3BucketName-oac"
Write-Log "Checking for existing Origin Access Control..." -Type "Info"
$existingOacs = aws cloudfront list-origin-access-controls | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw "Failed to list Origin Access Controls" }
$existingOac = $existingOacs.OriginAccessControlList.Items | Where-Object { $_.Name -eq $oacName } | Select-Object -First 1

if ($existingOac) {
    $oacId = $existingOac.Id
    Write-Log "Reusing existing Origin Access Control: $oacId" -Type "Success"
} else {
    Write-Log "Creating Origin Access Control..." -Type "Info"
    $oacConfigFile = Join-Path $tmpDir "oac-config.json"
    $oacConfig = @{
        Name = $oacName
        OriginAccessControlOriginType = "s3"
        SigningBehavior = "always"
        SigningProtocol = "sigv4"
    } | ConvertTo-Json
    Write-Utf8NoBom -Path $oacConfigFile -Content $oacConfig

    $oacResult = aws cloudfront create-origin-access-control --origin-access-control-config "file://$oacConfigFile" | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) { throw "Failed to create Origin Access Control" }
    $oacId = $oacResult.OriginAccessControl.Id
    Write-Log "Origin Access Control created: $oacId" -Type "Success"
}

# 3. Create the CloudFront Function that rewrites clean URLs to their .html file
Write-Log "Creating CloudFront Function '$FunctionName'..." -Type "Info"
$functionCode = @'
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
    } else if (!uri.includes('.')) {
        request.uri = uri + '.html';
    }

    return request;
}
'@
$functionCodeFile = Join-Path $tmpDir "url-rewrite.js"
Write-Utf8NoBom -Path $functionCodeFile -Content $functionCode

$PrevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$null = aws cloudfront describe-function --name $FunctionName 2>&1
$functionExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $PrevEAP

if ($functionExists) {
    Write-Log "Function '$FunctionName' already exists, updating it." -Type "Warning"
    $etag = (aws cloudfront describe-function --name $FunctionName | ConvertFrom-Json).ETag
    $null = aws cloudfront update-function --name $FunctionName --if-match $etag `
        --function-config "Comment=Rewrite clean URLs to .html,Runtime=cloudfront-js-2.0" `
        --function-code "fileb://$functionCodeFile"
} else {
    $null = aws cloudfront create-function --name $FunctionName `
        --function-config "Comment=Rewrite clean URLs to .html,Runtime=cloudfront-js-2.0" `
        --function-code "fileb://$functionCodeFile"
}
if ($LASTEXITCODE -ne 0) { throw "Failed to create/update CloudFront Function" }

$etag = (aws cloudfront describe-function --name $FunctionName | ConvertFrom-Json).ETag
$publishResult = aws cloudfront publish-function --name $FunctionName --if-match $etag | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw "Failed to publish CloudFront Function" }
$functionArn = $publishResult.FunctionSummary.FunctionMetadata.FunctionARN
Write-Log "Function published: $functionArn" -Type "Success"

# 4. Create the CloudFront Distribution
Write-Log "Creating CloudFront Distribution..." -Type "Info"
$callerRef = "alms-frontend-$(Get-Date -Format 'yyyyMMddHHmmss')"
$distConfig = @{
    CallerReference = $callerRef
    Comment = "ALMS frontend static site"
    Enabled = $true
    DefaultRootObject = "index.html"
    Origins = @{
        Quantity = 1
        Items = @(
            @{
                Id = "s3-origin"
                DomainName = $s3OriginDomain
                OriginAccessControlId = $oacId
                S3OriginConfig = @{ OriginAccessIdentity = "" }
            }
        )
    }
    DefaultCacheBehavior = @{
        TargetOriginId = "s3-origin"
        ViewerProtocolPolicy = "redirect-to-https"
        AllowedMethods = @{
            Quantity = 2
            Items = @("GET", "HEAD")
        }
        CachePolicyId = "658327ea-f89d-4fab-a63d-7e88639e58f6" # AWS managed: CachingOptimized
        FunctionAssociations = @{
            Quantity = 1
            Items = @(
                @{
                    EventType = "viewer-request"
                    FunctionARN = $functionArn
                }
            )
        }
    }
    CustomErrorResponses = @{
        Quantity = 1
        Items = @(
            @{
                ErrorCode = 404
                ResponsePagePath = "/404.html"
                ResponseCode = "404"
                ErrorCachingMinTTL = 10
            }
        )
    }
    PriceClass = "PriceClass_All"
} | ConvertTo-Json -Depth 10

$distConfigFile = Join-Path $tmpDir "distribution-config.json"
Write-Utf8NoBom -Path $distConfigFile -Content $distConfig

$distResult = aws cloudfront create-distribution --distribution-config "file://$distConfigFile" | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw "Failed to create CloudFront distribution" }
$distId = $distResult.Distribution.Id
$distDomain = $distResult.Distribution.DomainName

# 5. Apply the OAC bucket policy so CloudFront can read from the (private) bucket
Write-Log "Applying S3 bucket policy for OAC..." -Type "Info"
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
                "AWS:SourceArn": "arn:aws:cloudfront::${accountId}:distribution/$distId"
            }
        }
    }]
}
"@
$policyFile = Join-Path $tmpDir "bucket-policy.json"
Write-Utf8NoBom -Path $policyFile -Content $policy
$null = aws s3api put-bucket-policy --bucket $S3BucketName --policy "file://$policyFile" --region $AWSRegion
if ($LASTEXITCODE -ne 0) { throw "Failed to apply bucket policy" }

Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue

Write-Host "================================================================" -ForegroundColor Green
Write-Log "CloudFront distribution created." -Type "Success"
Write-Log "Distribution ID:     $distId" -Type "Info"
Write-Log "Distribution domain: https://$distDomain" -Type "Info"
Write-Log "" -Type "Info"
Write-Log "It takes ~5-15 minutes to fully deploy. Next steps:" -Type "Info"
Write-Log "  1. Set `$CloudFrontDistributionId = `"$distId`" in deploy.ps1" -Type "Info"
Write-Log "  2. Run .\deploy.ps1 to build and upload the site" -Type "Info"
Write-Host "================================================================" -ForegroundColor Green
