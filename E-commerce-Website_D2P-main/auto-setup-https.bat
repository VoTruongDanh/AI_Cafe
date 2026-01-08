@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Auto Setup HTTPS
echo ========================================
echo TU DONG SETUP HTTPS CHO LOCAL DEVELOPMENT
echo ========================================
echo.

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=!SCRIPT_DIR:~0,-1!"

REM Tim mkcert
echo [1/5] Kiem tra mkcert...
set "MKCERT_CMD="

where mkcert >nul 2>&1
if errorlevel 0 (
    set "MKCERT_CMD=mkcert"
    echo [OK] mkcert da duoc cai dat trong PATH
    goto :found_mkcert
)

if exist "!SCRIPT_DIR!\mkcert.exe" (
    set "MKCERT_CMD=!SCRIPT_DIR!\mkcert.exe"
    echo [OK] Tim thay mkcert trong thu muc project
    goto :found_mkcert
)

echo [INFO] Dang download mkcert tu GitHub...
set "ARCH=amd64"
if "%PROCESSOR_ARCHITECTURE%"=="x86" set "ARCH=386"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-%ARCH%.exe' -OutFile '!SCRIPT_DIR!\mkcert.exe' -UseBasicParsing" 2>nul

if exist "!SCRIPT_DIR!\mkcert.exe" (
    set "MKCERT_CMD=!SCRIPT_DIR!\mkcert.exe"
    echo [OK] Da download mkcert thanh cong!
) else (
    echo [ERROR] Khong the download mkcert!
    echo Vui long download thu cong tu: https://github.com/FiloSottile/mkcert/releases
    pause
    exit /b 1
)

:found_mkcert
echo.
echo [2/5] Cai dat local CA...
"%MKCERT_CMD%" -install 2>nul
echo [OK] Local CA da xu ly

echo.
echo [3/5] Lay IP cua may...

REM Lay IP LAN
set "LOCAL_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "TMP=%%a"
    set "TMP=!TMP: =!"
    if "!LOCAL_IP!"=="" (
        echo !TMP! | findstr /b "192." >nul && set "LOCAL_IP=!TMP!"
    )
    if "!LOCAL_IP!"=="" (
        echo !TMP! | findstr /b "10." >nul && set "LOCAL_IP=!TMP!"
    )
)

if "!LOCAL_IP!"=="" (
    echo [WARNING] Khong tim thay IP LAN
    set "CERT_HOSTS=localhost 127.0.0.1"
) else (
    echo [OK] IP LAN: !LOCAL_IP!
    set "CERT_HOSTS=localhost 127.0.0.1 !LOCAL_IP!"
)

echo.
echo [4/5] Tao certificates...
set "BACKEND_DIR=!SCRIPT_DIR!\Backend"
set "CERT_DIR=!BACKEND_DIR!\certificates"

if not exist "!CERT_DIR!" mkdir "!CERT_DIR!"

echo [INFO] Tao cert cho: !CERT_HOSTS!
"!MKCERT_CMD!" -key-file "!CERT_DIR!\localhost-key.pem" -cert-file "!CERT_DIR!\localhost.pem" !CERT_HOSTS!

if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] Khong the tao certificates!
    pause
    exit /b 1
)

echo [OK] Certificates da tao thanh cong!

echo.
echo [5/5] Hoan thanh!
echo.
echo ========================================
echo SETUP HTTPS THANH CONG!
echo ========================================
echo.
echo Certificates:
echo   !BACKEND_DIR!\certificates\localhost.pem
echo   !BACKEND_DIR!\certificates\localhost-key.pem
echo.
echo ========================================
echo TRUY CAP TU MAY TINH:
echo ========================================
echo   Frontend: https://localhost:5173
echo   Backend:  http://localhost:8000
echo.
if not "!LOCAL_IP!"=="" (
echo ========================================
echo TRUY CAP TU DIEN THOAI:
echo ========================================
echo.
echo   1. Ket noi dien thoai cung mang WiFi
echo   2. Mo trinh duyet tren dien thoai
echo   3. Truy cap: https://!LOCAL_IP!:5173
echo   4. Chap nhan canh bao certificate
echo   5. Test GPS: https://!LOCAL_IP!:5173/AI
echo.
echo   [GPS chi hoat dong voi HTTPS + cap quyen vi tri]
echo.
)
echo ========================================
echo KHOI DONG:
echo ========================================
echo   1. cd Backend and start-web-https.bat
echo   2. cd Frontend\Website and npm run dev
echo.
pause
