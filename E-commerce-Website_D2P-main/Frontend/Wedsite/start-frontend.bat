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

echo ========================================
echo Frontend URL: http://localhost:5173
echo Backend API: http://localhost:8000/api
echo ========================================
echo.
echo Nhan Ctrl+C de dung server
echo.

call npm run dev

pause
