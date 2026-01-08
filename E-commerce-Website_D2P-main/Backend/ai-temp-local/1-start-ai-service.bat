@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title AI Service HTTPS
color 0A

echo ============================================================
echo    AI Temperature Classifier Service HTTPS
echo ============================================================
echo.

cd /d "%~dp0"

REM Kiem tra certificates
set "CERT_DIR=..\certificates"
if not exist "!CERT_DIR!\localhost.pem" (
    echo [WARNING] Certificates chua duoc tao!
    echo.
    echo Vui long chay: auto-setup-https.bat truoc
    echo.
    pause
    exit /b 1
)

echo [OK] Tim thay certificates
echo.

REM Kiem tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python khong tim thay! Vui long cai dat Python.
    pause
    exit /b 1
)

REM Kiem tra dependencies
python -c "import fastapi, uvicorn" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Dependencies chua duoc cai dat!
    echo [INFO] Dang cai dat dependencies...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Khong the cai dat dependencies!
        pause
        exit /b 1
    )
)

REM Chay AI Service voi HTTPS
echo ============================================================
echo [INFO] Dang khoi dong AI Service voi HTTPS...
echo [INFO] Service se chay tai: https://127.0.0.1:9009
echo [INFO] Nhan Ctrl+C de dung
echo ============================================================
echo.
echo [OK] Dang khoi dong service...
echo.

uvicorn api:app --host 127.0.0.1 --port 9009 --ssl-keyfile "!CERT_DIR!\localhost-key.pem" --ssl-certfile "!CERT_DIR!\localhost.pem"

pause
