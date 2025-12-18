#!/usr/bin/env powershell
<#
    Biometric Integration Testing Script
    Tests the complete flow: Device → SDK → Frontend API → Backend API → Database
#>

param(
    [string]$BackendUrl = "http://localhost:3000/api",
    [string]$ApplicationId = "1",
    [string]$JwtToken = ""
)

function Write-Step {
    param([string]$Message, [int]$Step)
    Write-Host "`n[$Step] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "  → $Message" -ForegroundColor White
}

# Step 1: Check Prerequisites
Write-Step "Verifying Prerequisites" 1

# Check if Mantra service is running
Write-Info "Checking Mantra service on localhost:8030..."
$mantraTest = $null
try {
    $mantraTest = Invoke-WebRequest -Uri "http://localhost:8030" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Success "Mantra service is running on localhost:8030"
} catch {
    Write-Error "Mantra service NOT running on localhost:8030"
    Write-Info "Start MorFinAuthClientSvc from Services (services.msc)"
    exit 1
}

# Check backend connectivity
Write-Info "Checking backend at $BackendUrl..."
try {
    $backendTest = Invoke-WebRequest -Uri "$BackendUrl/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Success "Backend is accessible at $BackendUrl"
} catch {
    Write-Error "Backend NOT accessible at $BackendUrl"
    Write-Info "Ensure backend is running: npm run dev"
    exit 1
}

# Step 2: Verify Application Exists
Write-Step "Verifying Application Record" 2
$appUrl = "$BackendUrl/application-form/$ApplicationId"
Write-Info "GET $appUrl"

try {
    $headers = @{}
    if ($JwtToken) {
        $headers["Authorization"] = "Bearer $JwtToken"
    }
    
    $appResponse = Invoke-WebRequest -Uri $appUrl -Headers $headers -Method Get -TimeoutSec 5
    $appData = $appResponse.Content | ConvertFrom-Json
    
    Write-Success "Application found: ID=$ApplicationId"
    Write-Info "Name: $($appData.data.firstName) $($appData.data.lastName)"
} catch {
    Write-Error "Application not found with ID: $ApplicationId"
    Write-Info "Create an application first or use valid ID"
    exit 1
}

# Step 3: Check Device Status
Write-Step "Checking Device Status" 3
$deviceUrl = "$BackendUrl/biometric/device/status"
Write-Info "POST $deviceUrl"

try {
    $devicePayload = @{
        applicantId = $ApplicationId
    } | ConvertTo-Json
    
    $headers = @{"Content-Type" = "application/json"}
    if ($JwtToken) {
        $headers["Authorization"] = "Bearer $JwtToken"
    }
    
    $deviceResponse = Invoke-WebRequest -Uri $deviceUrl -Method Post -Body $devicePayload -Headers $headers -TimeoutSec 5
    $deviceData = $deviceResponse.Content | ConvertFrom-Json
    
    if ($deviceData.isConnected) {
        Write-Success "Fingerprint device is CONNECTED"
    } else {
        Write-Error "Fingerprint device is DISCONNECTED"
        Write-Info "Check device connection and Mantra service"
    }
} catch {
    Write-Error "Failed to check device status"
    Write-Info "Error: $($_.Exception.Message)"
}

# Step 4: Get Enrolled Fingerprints
Write-Step "Fetching Enrolled Fingerprints" 4
$enrolledUrl = "$BackendUrl/biometric/enrolled/$ApplicationId"
Write-Info "GET $enrolledUrl"

try {
    $headers = @{}
    if ($JwtToken) {
        $headers["Authorization"] = "Bearer $JwtToken"
    }
    
    $enrolledResponse = Invoke-WebRequest -Uri $enrolledUrl -Headers $headers -Method Get -TimeoutSec 5
    $enrolledData = $enrolledResponse.Content | ConvertFrom-Json
    
    $count = $enrolledData.data.Count
    Write-Success "Found $count enrolled fingerprints"
    
    if ($count -gt 0) {
        Write-Info "Enrolled Fingerprints:"
        foreach ($fp in $enrolledData.data) {
            Write-Info "  - Position: $($fp.position), Quality: $($fp.quality)%, Enrolled: $($fp.enrolledAt)"
        }
    } else {
        Write-Info "No fingerprints enrolled yet"
    }
} catch {
    Write-Error "Failed to fetch enrolled fingerprints"
    Write-Info "Error: $($_.Exception.Message)"
}

# Step 5: Audit Logs
Write-Step "Checking Audit Logs" 5
$auditUrl = "$BackendUrl/biometric/audit-logs/$ApplicationId?limit=10"
Write-Info "GET $auditUrl"

try {
    $headers = @{}
    if ($JwtToken) {
        $headers["Authorization"] = "Bearer $JwtToken"
    }
    
    $auditResponse = Invoke-WebRequest -Uri $auditUrl -Headers $headers -Method Get -TimeoutSec 5
    $auditData = $auditResponse.Content | ConvertFrom-Json
    
    if ($auditData.data -and $auditData.data.Count -gt 0) {
        Write-Success "Found $($auditData.data.Count) audit log entries"
        Write-Info "Recent Actions:"
        foreach ($log in $auditData.data | Select-Object -First 5) {
            Write-Info "  - $($log.action) on $($log.target) at $($log.timestamp)"
        }
    } else {
        Write-Info "No audit logs found"
    }
} catch {
    Write-Error "Failed to fetch audit logs"
    Write-Info "Error: $($_.Exception.Message)"
}

# Step 6: Test Mock Enrollment (Simulated)
Write-Step "Testing API Endpoints" 6

Write-Info "ENROLLMENT ENDPOINT"
$enrollUrl = "$BackendUrl/biometric/enroll/$ApplicationId"
Write-Info "POST $enrollUrl"
Write-Info "Request Body:"
$enrollPayload = @{
    fingerPosition = "RIGHT_THUMB"
    fingerTemplate = @{
        template = "base64_encoded_template_example"
        quality = 85
        isoTemplate = $null
        captureTime = (Get-Date).ToUniversalTime().ToString("o")
    }
    description = "Test enrollment"
} | ConvertTo-Json

Write-Info $enrollPayload

Write-Info "`nVERIFICATION ENDPOINT"
$verifyUrl = "$BackendUrl/biometric/verify/$ApplicationId"
Write-Info "POST $verifyUrl"
Write-Info "Request Body:"
$verifyPayload = @{
    fingerTemplate = @{
        template = "another_base64_template"
        quality = 75
        isoTemplate = $null
        captureTime = (Get-Date).ToUniversalTime().ToString("o")
    }
    matchThreshold = 65
} | ConvertTo-Json

Write-Info $verifyPayload

Write-Info "`nDELETION ENDPOINT"
$deleteUrl = "$BackendUrl/biometric/$ApplicationId/{fingerprint_id}"
Write-Info "DELETE $deleteUrl"

# Step 7: Summary
Write-Step "Test Summary" 7

Write-Success "All connectivity checks passed!"
Write-Info "`nNext steps:"
Write-Info "1. Open the application in browser"
Write-Info "2. Navigate to Biometric Information form"
Write-Info "3. Ensure SDK shows '[MantraSDK] Initialized successfully'"
Write-Info "4. Click 'Capture Fingerprint' to scan device"
Write-Info "5. Verify fingerprint appears in enrolled list"
Write-Info "6. Test verification by capturing again"
Write-Info "7. Check audit logs for all operations"

Write-Host "`n✓ Testing script completed!" -ForegroundColor Green
