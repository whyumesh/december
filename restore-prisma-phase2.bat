@echo off
REM Phase 2: Restore Prisma Functionality
REM Run this script to restore Prisma after Phase 1 deployment

echo === Phase 2: Restoring Prisma ===
echo.

REM Backup current db.ts (stub version)
echo 1. Backing up stub db.ts...
copy src\lib\db.ts src\lib\db.ts.phase1-backup

REM Restore db.ts from git history
echo 2. Restoring original db.ts from git...
git checkout HEAD~1 -- src/lib/db.ts 2>nul
if errorlevel 1 (
    echo    Warning: Could not restore from git. Please restore manually from backup.
    echo    Original db.ts should be in git history or your backup.
)

echo.
echo === Manual Steps Required ===
echo 1. Edit package.json:
echo    - Add "@prisma/client": "^5.22.0" to dependencies
echo    - Change postinstall to: "prisma generate"
echo.
echo 2. Edit netlify.toml:
echo    - Add "npx prisma generate" to build command
echo    - Add "@prisma/client" and "prisma" to external_node_modules
echo    - Add Prisma engine paths to included_files
echo.
echo 3. Test locally:
echo    npm install
echo    npx prisma generate
echo    npm run build
echo.
echo 4. Commit and push:
echo    git add .
echo    git commit -m "Phase 2: Restore Prisma"
echo    git push origin main
echo.
echo === Done ===
pause

