@echo off
title Frontend Development Server
echo ========================================
echo Khoi dong Frontend Development Server
echo ========================================
echo.

REM Kiem tra node_modules
if not exist "node_modules" (
    echo Dang cai dat dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Cai dat dependencies that bai!
        pause
        exit /b 1
    )
    echo.
)

REM Kiem tra certificates
set HAS_HTTPS=0
if exist "..\Backend\certificates\localhost.pem" (
    if exist "..\Backend\certificates\localhost-key.pem" (
        set HAS_HTTPS=1
    )
)

if %HAS_HTTPS%==1 (
    echo [INFO] HTTPS da duoc kich hoat!
    echo ========================================
    echo Frontend URL: https://localhost:5173
    echo Backend API: https://localhost:8000/api
    echo ========================================
    echo.
    echo [LUU Y] Trinh duyet se canh bao ve certificate!
    echo   - Chrome/Edge: Click "Advanced" -^> "Proceed to localhost"
    echo   - Firefox: Click "Advanced" -^> "Accept the Risk and Continue"
    echo.
) else (
    echo [WARNING] HTTPS chua duoc cau hinh!
    echo ========================================
    echo Frontend URL: http://localhost:5173
    echo Backend API: http://localhost:8000/api
    echo ========================================
    echo.
    echo [TIP] De enable HTTPS, chay: cd ..\Backend ^&^& setup-https.bat
    echo.
)

echo Nhan Ctrl+C de dung server
echo.

call npm run dev

pause
