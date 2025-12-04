@echo off
REM Netlify Deployment Optimization Script (Windows Batch)
REM This script optimizes the Next.js + Prisma deployment to stay under Netlify's 250MB limit
REM
REM Usage: scripts\optimize-for-netlify.bat

setlocal enabledelayedexpansion

echo 🚀 Starting Netlify deployment optimization...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Step 1: Clean previous builds and caches
echo ℹ️  Step 1: Cleaning previous builds and caches...
if exist ".next" rmdir /s /q ".next"
if exist "node_modules" rmdir /s /q "node_modules"
if exist ".cache" rmdir /s /q ".cache"
if exist ".turbo" rmdir /s /q ".turbo"
npm cache clean --force >nul 2>&1
echo ✅ Cleanup completed

REM Step 2: Install only production dependencies
echo ℹ️  Step 2: Installing production dependencies only...
set NODE_ENV=production
call npm ci --only=production --legacy-peer-deps
if errorlevel 1 (
    echo ❌ Failed to install production dependencies
    pause
    exit /b 1
)
echo ✅ Production dependencies installed

REM Step 3: Generate Prisma client
echo ℹ️  Step 3: Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✅ Prisma client generated

REM Step 4: Remove unnecessary Prisma binaries
echo ℹ️  Step 4: Removing unnecessary Prisma binaries...
echo    Note: Windows batch script has limited binary removal capabilities.
echo    For full optimization, use the .sh script in Git Bash or WSL.
echo    Or run this on Netlify where the shell script will be executed.

REM Note: Windows cmd.exe doesn't have good tools for recursive file operations
REM The full optimization will happen when Netlify runs the .sh script
echo ⚠️  Binary cleanup will be performed during Netlify build

REM Step 5: Build Next.js for production
echo ℹ️  Step 5: Building Next.js application...
set NODE_ENV=production
set NEXT_TELEMETRY_DISABLED=1
call npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Next.js build completed

echo.
echo ✅ Optimization script completed!
echo.
echo 📊 Note: For full binary cleanup, Netlify will run the .sh script during deployment.
echo    The Windows batch script performs basic optimization.
echo.
echo ✅ Ready for Netlify deployment!
pause

