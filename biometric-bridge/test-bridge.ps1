# Test Biometric Bridge Server APIs
# Run this script to verify all endpoints are working

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         Biometric Bridge API Testing Script               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3030"
$allPassed = $true

# Test 1: Enhanced Health Check
Write-Host "1. Testing Enhanced Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
    if ($health.status -eq "ok") {
        Write-Host "   ✓ PASS: Server is healthy" -ForegroundColor Green
        Write-Host "   Service: $($health.service)" -ForegroundColor Gray
        Write-Host "" -ForegroundColor Gray
        
        # RDService Status
        if ($health.rdservice.connected) {
            Write-Host "   ✓ RDService: Connected" -ForegroundColor Green
            Write-Host "     URL: $($health.rdservice.url)" -ForegroundColor Gray
            Write-Host "     Response Time: $($health.rdservice.responseTime)ms" -ForegroundColor Gray
        } else {
            Write-Host "   ✗ RDService: Disconnected" -ForegroundColor Red
            Write-Host "     Error: $($health.rdservice.error)" -ForegroundColor Gray
        }
        Write-Host "" -ForegroundColor Gray
        
        # Fingerprint Device Status
        Write-Host "   📱 Fingerprint Device:" -ForegroundColor Cyan
        if ($health.devices.fingerprint.available) {
            Write-Host "     ✓ Available" -ForegroundColor Green
            Write-Host "     Manufacturer: $($health.devices.fingerprint.manufacturer)" -ForegroundColor Gray
            Write-Host "     Model: $($health.devices.fingerprint.model)" -ForegroundColor Gray
            Write-Host "     Status: $($health.devices.fingerprint.status)" -ForegroundColor Gray
            if ($health.devices.fingerprint.vendor) {
                Write-Host "     Vendor: $($health.devices.fingerprint.vendor)" -ForegroundColor Gray
            }
        } else {
            Write-Host "     ✗ Not Available" -ForegroundColor Red
            Write-Host "     Status: $($health.devices.fingerprint.status)" -ForegroundColor Gray
        }
        Write-Host "" -ForegroundColor Gray
        
        # Iris Device Status
        Write-Host "   👁️  Iris Device:" -ForegroundColor Cyan
        if ($health.devices.iris.available) {
            Write-Host "     ✓ Available" -ForegroundColor Green
            Write-Host "     Status: $($health.devices.iris.status)" -ForegroundColor Gray
        } else {
            Write-Host "     ✗ Not Available" -ForegroundColor Red
        }
        Write-Host "" -ForegroundColor Gray
        
        # Photograph Device Status
        Write-Host "   📷 Photograph Device:" -ForegroundColor Cyan
        if ($health.devices.photograph.available) {
            Write-Host "     ✓ Available" -ForegroundColor Green
        } else {
            Write-Host "     ✗ Not Available" -ForegroundColor Red
        }
        
    } else {
        Write-Host "   ✗ FAIL: Unexpected status" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ✗ FAIL: Cannot connect to bridge server" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

# Test 2: RDService Status
Write-Host "`n2. Testing RDService Status..." -ForegroundColor Yellow
try {
    $rdservice = Invoke-RestMethod -Uri "$baseUrl/api/rdservice/status" -Method Get -ErrorAction Stop
    if ($rdservice.connected) {
        Write-Host "   ✓ PASS: RDService is connected" -ForegroundColor Green
        Write-Host "   URL: $($rdservice.rdserviceUrl)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠ WARNING: RDService not connected (expected without devices)" -ForegroundColor Yellow
        Write-Host "   URL: $($rdservice.rdserviceUrl)" -ForegroundColor Gray
        Write-Host "   Error: $($rdservice.error)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ FAIL: Cannot check RDService status" -ForegroundColor Red
    $allPassed = $false
}

# Test 3: Device Info
Write-Host "`n3. Testing Device Info..." -ForegroundColor Yellow
try {
    $deviceInfo = Invoke-RestMethod -Uri "$baseUrl/api/deviceInfo" -Method Get -ErrorAction Stop
    if ($deviceInfo.success) {
        Write-Host "   ✓ PASS: Device info retrieved" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ WARNING: Cannot get device info (expected without RDService)" -ForegroundColor Yellow
        Write-Host "   Error: $($deviceInfo.error)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠ WARNING: Device info request failed (expected without RDService)" -ForegroundColor Yellow
}

# Test 4: Fingerprint Capture (without device, expect error)
Write-Host "`n4. Testing Fingerprint Capture Endpoint..." -ForegroundColor Yellow
try {
    $fingerprint = Invoke-RestMethod -Uri "$baseUrl/api/captureFingerprint" -Method Get -ErrorAction Stop
    if ($fingerprint.success) {
        Write-Host "   ✓ PASS: Fingerprint captured successfully!" -ForegroundColor Green
        Write-Host "   Quality Score: $($fingerprint.qScore)%" -ForegroundColor Gray
        Write-Host "   Device: $($fingerprint.deviceInfo.model)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠ INFO: Capture failed (expected without physical device)" -ForegroundColor Yellow
        Write-Host "   Error Code: $($fingerprint.errorCode)" -ForegroundColor Gray
        Write-Host "   Message: $($fingerprint.errorMessage)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠ WARNING: Capture endpoint error (expected without RDService)" -ForegroundColor Yellow
}

# Test 5: Iris Capture (without device, expect error)
Write-Host "`n5. Testing Iris Capture Endpoint..." -ForegroundColor Yellow
try {
    $iris = Invoke-RestMethod -Uri "$baseUrl/api/captureIris" -Method Get -ErrorAction Stop
    if ($iris.success) {
        Write-Host "   ✓ PASS: Iris captured successfully!" -ForegroundColor Green
        Write-Host "   Quality Score: $($iris.qScore)%" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠ INFO: Capture failed (expected without physical device)" -ForegroundColor Yellow
        Write-Host "   Error Code: $($iris.errorCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠ WARNING: Capture endpoint error" -ForegroundColor Yellow
}

# Test 6: Photograph Capture (without device, expect error)
Write-Host "`n6. Testing Photograph Capture Endpoint..." -ForegroundColor Yellow
try {
    $photo = Invoke-RestMethod -Uri "$baseUrl/api/capturePhotograph" -Method Get -ErrorAction Stop
    if ($photo.success) {
        Write-Host "   ✓ PASS: Photograph captured successfully!" -ForegroundColor Green
        Write-Host "   Quality Score: $($photo.qScore)%" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠ INFO: Capture failed (expected without physical device)" -ForegroundColor Yellow
        Write-Host "   Error Code: $($photo.errorCode)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠ WARNING: Capture endpoint error" -ForegroundColor Yellow
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                        Summary                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "`n✅ All critical tests passed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Install RDService from device manufacturer" -ForegroundColor Gray
    Write-Host "  2. Connect biometric devices" -ForegroundColor Gray
    Write-Host "  3. Run this test again to verify device capture" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Some tests failed!" -ForegroundColor Red
    Write-Host "Check if bridge server is running on port 3030" -ForegroundColor Yellow
}

Write-Host "`n📚 View API Documentation: http://localhost:3030/api-docs" -ForegroundColor Cyan
Write-Host ""
