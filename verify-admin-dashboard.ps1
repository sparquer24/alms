#!/usr/bin/env pwsh
# Admin Dashboard Navigation Verification Script
# Run this to verify all admin pages are accessible and working correctly

Write-Host "🔍 Admin Dashboard Navigation Verification" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Colors
$SUCCESS = "Green"
$ERROR = "Red"
$INFO = "Yellow"

# Verify files exist
Write-Host "`n📁 Checking required files..." -ForegroundColor $INFO

$requiredFiles = @(
    "frontend/src/config/adminMenuService.ts",
    "frontend/src/context/AdminMenuContext.tsx",
    "frontend/src/utils/adminPagePreloader.ts",
    "frontend/src/app/admin/layout.tsx",
    "frontend/src/app/admin/userManagement/page.tsx",
    "frontend/src/app/admin/roleMapping/page.tsx",
    "frontend/src/app/admin/analytics/page.tsx",
    "frontend/src/app/admin/flowMapping/page.tsx"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor $SUCCESS
    }
    else {
        Write-Host "✗ $file - MISSING!" -ForegroundColor $ERROR
        $allFilesExist = $false
    }
}

# Verify config updates
Write-Host "`n🔧 Checking configuration updates..." -ForegroundColor $INFO

$configFiles = @{
    "frontend/src/config/menuMeta.tsx"          = @("roleMapping", "flowMapping")
    "frontend/src/config/roles.ts"              = @("getAdminMenuItems", "getMenuItemsForAdminRole")
    "frontend/src/components/RootProviders.tsx" = @("AdminMenuProvider")
}

foreach ($file in $configFiles.Keys) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        foreach ($keyword in $configFiles[$file]) {
            if ($content -like "*$keyword*") {
                Write-Host "✓ $file contains '$keyword'" -ForegroundColor $SUCCESS
            }
            else {
                Write-Host "✗ $file missing '$keyword'" -ForegroundColor $ERROR
            }
        }
    }
}

# Verify backend seed updates
Write-Host "`n📊 Checking backend seed files..." -ForegroundColor $INFO

$backendFiles = @(
    "backend/prisma/seed.ts",
    "backend/prisma/update-roles.ts"
)

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -like "*flowMapping*") {
            Write-Host "✓ $file has flowMapping in ADMIN role" -ForegroundColor $SUCCESS
        }
        else {
            Write-Host "⚠ $file may need flowMapping update" -ForegroundColor $ERROR
        }
    }
}

# Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
if ($allFilesExist) {
    Write-Host "✓ All required files are in place!" -ForegroundColor $SUCCESS
}
else {
    Write-Host "✗ Some required files are missing!" -ForegroundColor $ERROR
}

Write-Host "`nNext steps:" -ForegroundColor $INFO
Write-Host "1. Rebuild backend if you updated seed.ts files"
Write-Host "2. Run 'npm install' in frontend directory"
Write-Host "3. Start the dev server"
Write-Host "4. Log in as admin and verify menu items appear"
Write-Host "5. Click each menu item to verify navigation"
Write-Host "6. Refresh page and verify menu state persists"
