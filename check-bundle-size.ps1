# Bundle Size Checker Script
Write-Host "=== BUNDLE SIZE ANALYSIS ===" -ForegroundColor Cyan
Write-Host ""

# Check if .next exists
if (Test-Path ".next") {
    $nextSize = (Get-ChildItem -Path .next -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Write-Host ".next folder: $([math]::Round($nextSize / 1MB, 2)) MB ($($nextSize) bytes)" -ForegroundColor Yellow
} else {
    Write-Host ".next folder: Not found (run 'npm run build' first)" -ForegroundColor Red
}

Write-Host ""

# Node modules total
$nodeModulesSize = (Get-ChildItem -Path node_modules -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Write-Host "node_modules total: $([math]::Round($nodeModulesSize / 1MB, 2)) MB ($($nodeModulesSize) bytes)" -ForegroundColor Yellow

Write-Host ""

# Prisma specific
Write-Host "--- Prisma Sizes ---" -ForegroundColor Green
if (Test-Path "node_modules\.prisma") {
    $prismaClientSize = (Get-ChildItem -Path "node_modules\.prisma" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Write-Host ".prisma folder: $([math]::Round($prismaClientSize / 1MB, 2)) MB ($($prismaClientSize) bytes)"
}

if (Test-Path "node_modules\@prisma") {
    $prismaEnginesSize = (Get-ChildItem -Path "node_modules\@prisma" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Write-Host "@prisma folder: $([math]::Round($prismaEnginesSize / 1MB, 2)) MB ($($prismaEnginesSize) bytes)"
}

# Check for specific Prisma engine
$rhelEngine = "node_modules\.prisma\client\libquery_engine-rhel-openssl-3.0.x.so.node"
if (Test-Path $rhelEngine) {
    $engineSize = (Get-Item $rhelEngine).Length
    Write-Host "RHEL Engine (included): $([math]::Round($engineSize / 1MB, 2)) MB ($($engineSize) bytes)" -ForegroundColor Cyan
}

Write-Host ""

# Large dependencies
Write-Host "--- Large Dependencies (Externalized) ---" -ForegroundColor Green
$largeDeps = @(
    @{Name='exceljs'; Path='node_modules\exceljs'},
    @{Name='pdf-parse'; Path='node_modules\pdf-parse'},
    @{Name='jspdf'; Path='node_modules\jspdf'},
    @{Name='jsdom'; Path='node_modules\jsdom'},
    @{Name='cloudinary'; Path='node_modules\cloudinary'},
    @{Name='@aws-sdk/client-s3'; Path='node_modules\@aws-sdk\client-s3'},
    @{Name='@aws-sdk/s3-request-presigner'; Path='node_modules\@aws-sdk\s3-request-presigner'},
    @{Name='twilio'; Path='node_modules\twilio'},
    @{Name='@upstash/redis'; Path='node_modules\@upstash\redis'},
    @{Name='@upstash/ratelimit'; Path='node_modules\@upstash\ratelimit'}
)

foreach ($dep in $largeDeps) {
    if (Test-Path $dep.Path) {
        $size = (Get-ChildItem -Path $dep.Path -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        Write-Host "$($dep.Name): $([math]::Round($size / 1MB, 2)) MB ($($size) bytes)"
    }
}

Write-Host ""

# Source code
Write-Host "--- Source Code ---" -ForegroundColor Green
$srcSize = (Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Write-Host "src folder: $([math]::Round($srcSize / 1MB, 2)) MB ($($srcSize) bytes)"

Write-Host ""

# Estimated Netlify function size (what would be bundled)
Write-Host "=== ESTIMATED NETLIFY FUNCTION SIZE ===" -ForegroundColor Cyan
Write-Host "Note: This is an estimate. Actual size depends on what Netlify bundles." -ForegroundColor Gray
Write-Host ""

if (Test-Path ".next") {
    # Check .next/server directory (what gets bundled)
    if (Test-Path ".next\server") {
        $serverSize = (Get-ChildItem -Path ".next\server" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        Write-Host ".next/server (core): $([math]::Round($serverSize / 1MB, 2)) MB ($($serverSize) bytes)" -ForegroundColor Yellow
        
        # Add Prisma RHEL engine if it exists
        if (Test-Path $rhelEngine) {
            $engineSize = (Get-Item $rhelEngine).Length
            $estimatedTotal = $serverSize + $engineSize
            Write-Host "+ Prisma RHEL Engine: $([math]::Round($engineSize / 1MB, 2)) MB ($($engineSize) bytes)" -ForegroundColor Yellow
            Write-Host "Estimated Total: $([math]::Round($estimatedTotal / 1MB, 2)) MB ($($estimatedTotal) bytes)" -ForegroundColor $(if ($estimatedTotal -gt 250MB) { "Red" } else { "Green" })
        }
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Netlify Limit: 250 MB" -ForegroundColor $(if ($estimatedTotal -gt 250MB) { "Red" } else { "Green" })
Write-Host ""

