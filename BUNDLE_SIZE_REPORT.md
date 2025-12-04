# Bundle Size Report

## Current Configuration
- **Node.js Version**: 20.x
- **Platform**: Netlify
- **Prisma Binary Target**: `rhel-openssl-3.0.x` (for Netlify)

## To Get Exact Bundle Sizes

Run the following PowerShell command in your terminal:

```powershell
# Check .next build size
if (Test-Path '.next') {
    $nextSize = (Get-ChildItem .next -Recurse -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    Write-Host ".next folder: $([math]::Round($nextSize / 1MB, 2)) MB ($($nextSize) bytes)"
} else {
    Write-Host ".next folder: Not found - run 'npm run build' first"
}

# Check node_modules size
$nodeModulesSize = (Get-ChildItem node_modules -Recurse -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
Write-Host "node_modules: $([math]::Round($nodeModulesSize / 1MB, 2)) MB ($($nodeModulesSize) bytes)"

# Check Prisma RHEL engine size
if (Test-Path 'node_modules\.prisma\client\libquery_engine-rhel-openssl-3.0.x.so.node') {
    $engineSize = (Get-Item 'node_modules\.prisma\client\libquery_engine-rhel-openssl-3.0.x.so.node').Length
    Write-Host "Prisma RHEL Engine: $([math]::Round($engineSize / 1MB, 2)) MB ($($engineSize) bytes)"
}

# Check .next/server size (what Netlify bundles)
if (Test-Path '.next\server') {
    $serverSize = (Get-ChildItem .next\server -Recurse -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    Write-Host ".next/server: $([math]::Round($serverSize / 1MB, 2)) MB ($($serverSize) bytes)"
    
    # Estimated Netlify function size
    if (Test-Path 'node_modules\.prisma\client\libquery_engine-rhel-openssl-3.0.x.so.node') {
        $engineSize = (Get-Item 'node_modules\.prisma\client\libquery_engine-rhel-openssl-3.0.x.so.node').Length
        $estimatedTotal = $serverSize + $engineSize
        Write-Host "Estimated Netlify Function Size: $([math]::Round($estimatedTotal / 1MB, 2)) MB ($($estimatedTotal) bytes)"
        Write-Host "Netlify Limit: 250 MB"
        if ($estimatedTotal -gt 250MB) {
            Write-Host "Status: EXCEEDS LIMIT" -ForegroundColor Red
        } else {
            Write-Host "Status: WITHIN LIMIT" -ForegroundColor Green
        }
    }
}
```

## Large Dependencies (Externalized in netlify.toml)

These dependencies are **NOT bundled** into the Netlify function (they're externalized):

- `@prisma/client` - Externalized
- `prisma` - Externalized  
- `pg` - Externalized
- `bcryptjs` - Externalized
- `jsonwebtoken` - Externalized
- `nodemailer` - Externalized
- `@aws-sdk/client-s3` - Externalized
- `@aws-sdk/s3-request-presigner` - Externalized
- `cloudinary` - Externalized
- `pdf-parse` - Externalized
- `exceljs` - Externalized (dynamically imported in code)
- `jspdf` - Externalized
- `jsdom` - Externalized
- `isomorphic-dompurify` - Externalized
- `twilio` - Externalized
- `csv-parser` - Externalized
- `@upstash/ratelimit` - Externalized
- `@upstash/redis` - Externalized

## What Gets Bundled

1. **.next/server** - Next.js server build output
2. **Prisma RHEL Engine** - `libquery_engine-rhel-openssl-3.0.x.so.node` (included via `included_files`)

## Notes

- The actual Netlify function size depends on what Netlify's bundler includes
- With `external_node_modules` configured, heavy dependencies are loaded from `node_modules` at runtime
- The Prisma RHEL engine (~40-50 MB) is the largest single file that must be included
- ExcelJS is dynamically imported in `export-insights/route.ts` and `export/route.ts` to reduce initial bundle size

