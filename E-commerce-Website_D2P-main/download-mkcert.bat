@echo off
title Download mkcert
echo ========================================
echo DOWNLOAD MKCERT TU GITHUB
echo ========================================
echo.

echo [INFO] Dang download mkcert-v1.4.4-windows-amd64.exe...
echo.

REM Download mkcert
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe' -OutFile 'mkcert.exe'"

if exist "mkcert.exe" (
    echo [OK] Da download mkcert thanh cong!
    echo.
    echo File: %CD%\mkcert.exe
    echo.
    echo Ban co the:
    echo   1. Chay lai: auto-setup-https.bat
    echo   2. Hoac them vao PATH de dung o bat ky dau
    echo.
) else (
    echo [ERROR] Khong the download mkcert!
    echo.
    echo Vui long download thu cong:
    echo   https://github.com/FiloSottile/mkcert/releases/latest
    echo.
)

pause
