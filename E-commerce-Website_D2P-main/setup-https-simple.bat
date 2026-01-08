@echo off
setlocal enabledelayedexpansion
title Setup HTTPS (Simple - Skip CA)
echo ========================================
echo SETUP HTTPS DON GIAN (BO QUA CAI CA)
echo ========================================
echo.
echo Script nay se:
echo   - Tao certificates (khong can cai CA)
echo   - Cau hinh Frontend
echo.
echo [LUU Y] Browser se canh bao certificate lan dau
echo   (chi can click "Advanced" -^> "Proceed to localhost" 1 lan)
echo.
pause

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=!SCRIPT_DIR:~0,-1!"

REM Tìm mkcert
set "MKCERT_CMD="
where mkcert >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    set "MKCERT_CMD=mkcert"
) else (
    if exist "!SCRIPT_DIR!\mkcert.exe" (
        set "MKCERT_CMD=!SCRIPT_DIR!\mkcert.exe"
    ) else (
        echo [ERROR] Khong tim thay mkcert!
        echo.
        echo Vui long chay: download-mkcert.bat
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Tim thay mkcert: !MKCERT_CMD!
echo.

REM Tạo certificates (bỏ qua cài CA)
echo [1/3] Dang tao certificates...
set "BACKEND_DIR=!SCRIPT_DIR!\Backend"
if not exist "!BACKEND_DIR!" (
    echo [ERROR] Thu muc Backend khong ton tai!
    pause
    exit /b 1
)

cd /d "!BACKEND_DIR!"
if not exist "certificates" mkdir certificates

echo [INFO] Dang tao certificates (bo qua cai CA)...
"!MKCERT_CMD!" -key-file certificates\localhost-key.pem -cert-file certificates\localhost.pem localhost 127.0.0.1 ::1
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] Khong the tao certificates!
    cd /d "!SCRIPT_DIR!"
    pause
    exit /b 1
)

echo [OK] Certificates da duoc tao!
cd /d "!SCRIPT_DIR!"

REM Cấu hình Frontend
echo.
echo [2/3] Dang cau hinh Frontend...
set "FRONTEND_DIR=!SCRIPT_DIR!\Frontend\Wedsite"
if exist "!FRONTEND_DIR!" (
    cd /d "!FRONTEND_DIR!"
    
    if not exist ".env" (
        echo VITE_API_URL=https://localhost:8000/api > .env
        echo [OK] Da tao file .env
    ) else (
        findstr /C:"VITE_API_URL" .env >nul 2>&1
        if !ERRORLEVEL! NEQ 0 (
            echo VITE_API_URL=https://localhost:8000/api >> .env
            echo [OK] Da them VITE_API_URL vao .env
        ) else (
            powershell -NoProfile -ExecutionPolicy Bypass -Command "try { (Get-Content .env) -replace 'VITE_API_URL=http://', 'VITE_API_URL=https://' | Set-Content .env; exit 0 } catch { exit 1 }" >nul 2>&1
            echo [OK] Da cap nhat .env sang HTTPS
        )
    )
    
    cd /d "!SCRIPT_DIR!"
) else (
    echo [WARNING] Thu muc Frontend\Wedsite khong ton tai, bo qua
)

REM Kiểm tra
echo.
echo [3/3] Dang kiem tra...
if not exist "!BACKEND_DIR!\certificates\localhost.pem" (
    echo [ERROR] Certificates khong duoc tao!
    pause
    exit /b 1
)
if not exist "!BACKEND_DIR!\certificates\localhost-key.pem" (
    echo [ERROR] Private key khong duoc tao!
    pause
    exit /b 1
)

echo.
echo ========================================
echo SETUP HTTPS HOAN TAT!
echo ========================================
echo.
echo Certificates da duoc tao tai:
echo   - Backend\certificates\localhost.pem
echo   - Backend\certificates\localhost-key.pem
echo.
echo ========================================
echo CAC BUOC TIEP THEO:
echo ========================================
echo.
echo 1. Khoi dong Backend (HTTPS):
echo    cd Backend
echo    start-web-https.bat
echo.
echo 2. Khoi dong Frontend (HTTPS tu dong):
echo    cd Frontend\Wedsite
echo    start-frontend.bat
echo.
echo 3. Truy cap: https://localhost:5173
echo.
echo 4. Browser se canh bao certificate lan dau:
echo    - Click "Advanced" hoac "Nang cao"
echo    - Click "Proceed to localhost" hoac "Tiep tuc den localhost"
echo    - Chi can lam 1 lan, sau do se nho!
echo.
echo 5. Test GPS tai: https://localhost:5173/AI
echo.
echo ========================================
pause
