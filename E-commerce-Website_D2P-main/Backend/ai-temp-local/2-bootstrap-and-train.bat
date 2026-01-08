@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Bootstrap Data and Train Model
color 0B

echo ============================================================
echo    Bootstrap Data va Train Model
echo ============================================================
echo.

cd /d "%~dp0"
echo [INFO] Thu muc hien tai: %CD%
echo.

REM Kiem tra Python
echo [INFO] Kiem tra Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python khong tim thay!
    pause
    exit /b 1
)
python --version
echo [OK] Python da duoc tim thay
echo.

REM Kiem tra AI Service
echo [INFO] Kiem tra AI Service...
python -c "import requests; import urllib3; urllib3.disable_warnings(); requests.get('https://127.0.0.1:9009/docs', timeout=2, verify=False)" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] AI Service khong chay!
    echo [INFO] Vui long chay: 1-start-ai-service.bat
    pause
    exit /b 1
)
echo [OK] AI Service dang chay
echo.

REM Bo qua kiem tra Laravel API - de bootstrap-data.py tu xu ly
echo [INFO] Bat dau Bootstrap...
echo.

REM Buoc 1: Bootstrap
echo ============================================================
echo Buoc 1: Bootstrap Data
echo ============================================================
echo.

if not exist "bootstrap-data.py" (
    echo [ERROR] Khong tim thay bootstrap-data.py!
    pause
    exit /b 1
)

echo [INFO] Dang chay bootstrap-data.py...
echo.

python bootstrap-data.py
if errorlevel 1 (
    echo.
    echo [ERROR] Bootstrap that bai!
    echo [INFO] Kiem tra Laravel API co dang chay khong:
    echo   cd ..
    echo   php artisan serve --host=127.0.0.1 --port=8000
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Bootstrap hoan tat!
echo.

REM Buoc 2: Train
echo ============================================================
echo Buoc 2: Train Model
echo ============================================================
echo.

if not exist "train.py" (
    echo [ERROR] Khong tim thay train.py!
    pause
    exit /b 1
)

echo [INFO] Dang chay train.py...
echo.

python train.py
if errorlevel 1 (
    echo.
    echo [ERROR] Train that bai!
    pause
    exit /b 1
)

echo.
echo [OK] Train hoan tat!
echo.

REM Buoc 3: Reload
echo ============================================================
echo Buoc 3: Reload Model
echo ============================================================
echo.

echo [INFO] Dang reload model...
python -c "import requests; import urllib3; urllib3.disable_warnings(); r = requests.post('https://127.0.0.1:9009/reload-model', verify=False, timeout=5); print(r.json().get('message', 'OK'))" 2>nul
echo.

echo ============================================================
echo [OK] Hoan tat!
echo ============================================================
echo.
pause
