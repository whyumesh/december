@echo off
echo === BUNDLE SIZE ANALYSIS ===
echo.

echo Checking .next folder...
if exist .next (
    for /f %%i in ('powershell -Command "(Get-ChildItem .next -Recurse -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum"') do set NEXT_SIZE=%%i
    for /f %%i in ('powershell -Command "[math]::Round(%NEXT_SIZE% / 1MB, 2)"') do echo .next folder: %%i MB ^(%NEXT_SIZE% bytes^)
) else (
    echo .next folder: Not found - run npm run build first
)

echo.
echo Checking node_modules...
for /f %%i in ('powershell -Command "(Get-ChildItem node_modules -Recurse -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum"') do set NODE_MODULES_SIZE=%%i
for /f %%i in ('powershell -Command "[math]::Round(%NODE_MODULES_SIZE% / 1MB, 2)"') do echo node_modules: %%i MB ^(%NODE_MODULES_SIZE% bytes^)

echo.
echo Checking Prisma RHEL engine...
if exist "node_modules\.prisma\client\libquery_engine-rhel-openssl-3.0.x.so.node" (
    for /f %%i in ('powershell -Command "(Get-Item 'node_modules\.prisma\client\libquery_engine-rhel-openssl-3.0.x.so.node').Length"') do set ENGINE_SIZE=%%i
    for /f %%i in ('powershell -Command "[math]::Round(%ENGINE_SIZE% / 1MB, 2)"') do echo Prisma RHEL Engine: %%i MB ^(%ENGINE_SIZE% bytes^)
) else (
    echo Prisma RHEL Engine: Not found
)

echo.
echo Checking .next/server (what Netlify bundles)...
if exist .next\server (
    for /f %%i in ('powershell -Command "(Get-ChildItem .next\server -Recurse -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum"') do set SERVER_SIZE=%%i
    for /f %%i in ('powershell -Command "[math]::Round(%SERVER_SIZE% / 1MB, 2)"') do echo .next/server: %%i MB ^(%SERVER_SIZE% bytes^)
    
    if exist "node_modules\.prisma\client\libquery_engine-rhel-openssl-3.0.x.so.node" (
        for /f %%i in ('powershell -Command "[math]::Round((%SERVER_SIZE% + %ENGINE_SIZE%) / 1MB, 2)"') do echo Estimated Netlify Function Size: %%i MB
    )
) else (
    echo .next/server: Not found
)

echo.
pause

