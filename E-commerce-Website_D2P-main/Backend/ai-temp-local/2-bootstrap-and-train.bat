@echo off
chcp 65001 >nul
title Bootstrap Data and Train Model
color 0B

echo ============================================================
echo    Bootstrap Data va Train Model
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

REM Kiem tra AI Service co dang chay khong
echo [INFO] Kiem tra AI Service...
python -c "import requests; requests.get('http://127.0.0.1:9009/docs', timeout=2)" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] AI Service khong chay!
    echo [INFO] Vui long chay file "1-start-ai-service.bat" truoc!
    echo.
    pause
    exit /b 1
)
echo [OK] AI Service dang chay
echo.

REM Kiem tra Laravel API co dang chay khong
echo [INFO] Kiem tra Laravel API...
python -c "import requests; requests.get('http://127.0.0.1:8000/api/products/classify-temperature?limit=1', timeout=2)" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Laravel API khong chay!
    echo [INFO] Vui long chay "php artisan serve" truoc!
    echo.
    pause
    exit /b 1
)
echo [OK] Laravel API dang chay
echo.

REM Buoc 1: Bootstrap data
echo ============================================================
echo Buoc 1: Thu thap du lieu (Bootstrap)
echo ============================================================
echo.
python bootstrap-data.py
if errorlevel 1 (
    echo [ERROR] Bootstrap that bai!
    pause
    exit /b 1
)
echo.

REM Buoc 2: Train model
echo ============================================================
echo Buoc 2: Train model
echo ============================================================
echo.
python train.py
if errorlevel 1 (
    echo [ERROR] Train that bai!
    pause
    exit /b 1
)
echo.

REM Buoc 3: Reload model
echo ============================================================
echo Buoc 3: Reload model trong AI Service
echo ============================================================
echo.
python -c "import requests; r = requests.post('http://127.0.0.1:9009/reload-model'); print('[OK]', r.json())"
if errorlevel 1 (
    echo [WARNING] Khong the reload model! Co the AI Service khong chay.
) else (
    echo [OK] Model da duoc reload thanh cong!
)
echo.

echo ============================================================
echo [OK] Hoan tat! Model da san sang su dung.
echo ============================================================
echo.

pause
