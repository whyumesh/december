@echo off
copy "public\electkms favicon.png" "src\app\icon.png" /Y
if %errorlevel% equ 0 (
    echo Successfully copied favicon to src/app/icon.png
) else (
    echo Failed to copy favicon
    exit /b 1
)

