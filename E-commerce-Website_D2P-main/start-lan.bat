@echo off
chcp 65001 >nul
title Start All Services for LAN Access
color 0A

echo ============================================================
echo    KHOI DONG TAT CA SERVICES CHO LAN ACCESS
echo ============================================================
echo.

REM Lay IP LAN
echo [INFO] Dang lay IP LAN...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /i "192. 10. 172."') do (
    set "LOCAL_IP=%%a"
    set "LOCAL_IP=!LOCAL_IP: =!"
    goto :found_ip
)
:found_ip
setlocal enabledelayedexpansion
if "!LOCAL_IP!"=="" (
    echo [WARNING] Khong tim thay IP LAN, su dung localhost
    set "LOCAL_IP=localhost"
)
echo [OK] IP LAN: !LOCAL_IP!
echo.

REM Kiem tra certificates
if not exist "Backend\certificates\localhost.pem" (
    echo [INFO] Tao certificates...
    call auto-setup-https.bat
)

echo ============================================================
echo    THONG TIN TRUY CAP
echo ============================================================
echo.
echo TU MAY TINH:
echo   https://localhost:5173
echo.
echo TU DIEN THOAI (cung mang WiFi):
echo   https://!LOCAL_IP!:5173
echo.
echo [LUU Y] Chap nhan canh bao certificate tren trinh duyet
echo ============================================================
echo.

REM Khoi dong AI Service
echo [INFO] Dang khoi dong AI Service...
start "AI Service" cmd /k "cd /d "%~dp0Backend\ai-temp-local" && python -m uvicorn api:app --host 0.0.0.0 --port 9009 --ssl-keyfile "..\certificates\localhost-key.pem" --ssl-certfile "..\certificates\localhost.pem""

timeout /t 2 /nobreak >nul

REM Khoi dong Laravel Backend - KHONG dung --host, de mac dinh localhost
echo [INFO] Dang khoi dong Laravel Backend...
start "Laravel Backend" cmd /k "cd /d "%~dp0Backend" && php artisan serve"

timeout /t 3 /nobreak >nul

REM Khoi dong Frontend
echo [INFO] Dang khoi dong Frontend...
start "Frontend" cmd /k "cd /d "%~dp0Frontend\Website" && npm run dev -- --host"

timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo [OK] TAT CA SERVICES DA KHOI DONG!
echo ============================================================
echo.
echo Truy cap tu dien thoai: https://!LOCAL_IP!:5173
echo.
echo Nhan phim bat ky de mo browser...
pause >nul

start https://localhost:5173

echo.
echo De dung services, dong cac cua so terminal
pause
