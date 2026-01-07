@echo off
chcp 65001 >nul
title AI Local Temperature Classifier Service
color 0A

echo ============================================================
echo    AI Local Temperature Classifier Service
echo ============================================================
echo.
echo [INFO] Dang khoi dong AI Service...
echo [INFO] Service se chay tai: http://127.0.0.1:9009
echo [INFO] Nhan Ctrl+C de dung
echo.
echo ============================================================
echo.

cd /d "%~dp0"

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

REM Chay AI Service
echo [OK] Dang khoi dong service...
echo.
uvicorn api:app --host 127.0.0.1 --port 9009

pause
