@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Start All Servers with HTTPS
echo ========================================
echo KHOI DONG TAT CA SERVERS VOI HTTPS
echo ========================================
echo.

REM Kiem tra certificates
if not exist "Backend\certificates\localhost.pem" (
    echo [WARNING] Certificates chua duoc tao!
    echo.
    echo Dang tu dong setup HTTPS...
    echo.
    call auto-setup-https.bat
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Setup HTTPS that bai!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Setup HTTPS hoan tat!
    echo.
)

REM Kiem tra PHP
set "PHP_PATH="
if exist "C:\xampp\php\php.exe" (
    set "PHP_PATH=C:\xampp\php\php.exe"
) else if exist "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" (
    set "PHP_PATH=C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe"
) else if exist "C:\wamp64\bin\php\php8.1.0\php.exe" (
    set "PHP_PATH=C:\wamp64\bin\php\php8.1.0\php.exe"
)

if "!PHP_PATH!"=="" (
    echo [ERROR] Khong tim thay PHP!
    echo Vui long cai dat XAMPP, Laragon hoac WAMP
    pause
    exit /b 1
)

echo [INFO] Tim thay PHP tai: !PHP_PATH!
echo.

REM Kiem tra Node.js
where node >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] Khong tim thay Node.js!
    echo Vui long cai dat Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Tim thay Node.js
echo.

echo ========================================
echo DANG KHOI DONG SERVERS...
echo ========================================
echo.
echo AI Service: https://127.0.0.1:9009
echo Backend: http://localhost:8000
echo Frontend: https://localhost:5173
echo.
echo [LUU Y] Trinh duyet se canh bao ve certificate!
echo   Chrome/Edge: Click Advanced - Proceed to localhost
echo   Firefox: Click Advanced - Accept the Risk
echo.
echo Nhan Ctrl+C trong moi terminal de dung server
echo.

REM Khoi dong AI Service
set "AI_DIR=%~dp0Backend\ai-temp-local"
start "AI Service HTTPS" cmd /k "cd /d %~dp0Backend\ai-temp-local && 1-start-ai-service.bat"

REM Doi mot chut
timeout /t 2 /nobreak >nul

REM Khoi dong Backend
start "Backend HTTP" cmd /k "cd /d %~dp0Backend && "!PHP_PATH!" artisan serve --host=localhost --port=8000"

REM Doi mot chut
timeout /t 3 /nobreak >nul

REM Khoi dong Frontend
start "Frontend HTTPS" cmd /k "cd /d %~dp0Frontend\Website && npm run dev"

echo.
echo [OK] Da khoi dong Backend va Frontend!
echo.
echo Dang mo browser...
timeout /t 2 /nobreak >nul

REM Mo browser
start https://localhost:5173

echo.
echo ========================================
echo SERVERS DA DUOC KHOI DONG!
echo ========================================
echo.
echo AI Service: https://127.0.0.1:9009
echo Backend: http://localhost:8000
echo Frontend: https://localhost:5173
echo.
echo Dang mo trong browser...
echo.
echo [TIP] De dung servers, dong cac cua so terminal
echo.
pause
