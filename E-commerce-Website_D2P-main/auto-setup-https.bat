@echo off
setlocal enabledelayedexpansion
title Auto Setup HTTPS
echo ========================================
echo TU DONG SETUP HTTPS CHO LOCAL DEVELOPMENT
echo ========================================
echo.

REM Lưu đường dẫn hiện tại
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=!SCRIPT_DIR:~0,-1!"

REM Kiểm tra mkcert
echo [1/6] Kiem tra mkcert...
set "MKCERT_CMD="
set "MKCERT_FOUND=0"

REM Kiểm tra mkcert trong PATH
where mkcert >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    set "MKCERT_CMD=mkcert"
    set "MKCERT_FOUND=1"
    echo [OK] mkcert da duoc cai dat trong PATH
)

REM Kiểm tra mkcert trong thư mục project
if !MKCERT_FOUND! EQU 0 (
    if exist "!SCRIPT_DIR!\mkcert.exe" (
        set "MKCERT_CMD=!SCRIPT_DIR!\mkcert.exe"
        set "MKCERT_FOUND=1"
        echo [OK] Tim thay mkcert trong thu muc project
    )
)

REM Nếu chưa có, thử cài đặt
if !MKCERT_FOUND! EQU 0 (
    echo [WARNING] mkcert chua duoc cai dat!
    echo.
    echo Dang thu cai dat mkcert...
    echo.
    
    REM Thử cài qua Chocolatey
    where choco >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [INFO] Tim thay Chocolatey, dang cai dat mkcert...
        choco install mkcert -y >nul 2>&1
        where mkcert >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            set "MKCERT_CMD=mkcert"
            set "MKCERT_FOUND=1"
            echo [OK] mkcert da duoc cai dat qua Chocolatey!
        )
    )
    
    REM Thử cài qua Scoop
    if !MKCERT_FOUND! EQU 0 (
        where scoop >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            echo [INFO] Tim thay Scoop, dang cai dat mkcert...
            scoop install mkcert >nul 2>&1
            where mkcert >nul 2>&1
            if !ERRORLEVEL! EQU 0 (
                set "MKCERT_CMD=mkcert"
                set "MKCERT_FOUND=1"
                echo [OK] mkcert da duoc cai dat qua Scoop!
            )
        )
    )
    
    REM Thử download từ GitHub
    if !MKCERT_FOUND! EQU 0 (
        echo [INFO] Dang thu download mkcert tu GitHub...
        echo.
        
        REM Kiểm tra kiến trúc CPU
        set "ARCH=amd64"
        if "%PROCESSOR_ARCHITECTURE%"=="x86" (
            set "ARCH=386"
            echo [INFO] Phat hien he thong 32-bit, se download phien ban 32-bit
        ) else (
            echo [INFO] Phat hien he thong 64-bit, se download phien ban 64-bit
        )
        
        set "TEMP_DIR=%TEMP%\mkcert-setup"
        if not exist "!TEMP_DIR!" mkdir "!TEMP_DIR!"
        
        cd /d "!TEMP_DIR!"
        
        echo [INFO] Dang download mkcert-v1.4.4-windows-!ARCH!.exe...
        powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $ProgressPreference = 'SilentlyContinue'; $url = 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-!ARCH!.exe'; Invoke-WebRequest -Uri $url -OutFile 'mkcert.exe' -UseBasicParsing; if (Test-Path 'mkcert.exe') { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
        
        if exist "mkcert.exe" (
            echo [OK] Da download mkcert thanh cong!
            copy /Y "mkcert.exe" "!SCRIPT_DIR!\mkcert.exe" >nul 2>&1
            
            if exist "!SCRIPT_DIR!\mkcert.exe" (
                REM Kiểm tra file có chạy được không
                "!SCRIPT_DIR!\mkcert.exe" -version >nul 2>&1
                if !ERRORLEVEL! EQU 0 (
                    set "MKCERT_CMD=!SCRIPT_DIR!\mkcert.exe"
                    set "MKCERT_FOUND=1"
                    echo [OK] mkcert da duoc cai dat thanh cong!
                ) else (
                    echo [WARNING] mkcert khong the chay (co the khong tuong thich)
                    echo [TIP] Thu download phien ban khac hoac cai dat thu cong
                )
            )
        ) else (
            echo [WARNING] Khong the download mkcert tu GitHub
            echo [TIP] Co the do ket noi mang hoac GitHub khong truy cap duoc
        )
        
        cd /d "!SCRIPT_DIR!"
        if exist "!TEMP_DIR!" rmdir /s /q "!TEMP_DIR!" >nul 2>&1
    )
    
    REM Kiểm tra lại
    if !MKCERT_FOUND! EQU 0 (
        if exist "!SCRIPT_DIR!\mkcert.exe" (
            set "MKCERT_CMD=!SCRIPT_DIR!\mkcert.exe"
            set "MKCERT_FOUND=1"
        ) else (
            echo.
            echo [ERROR] Khong the tu dong cai dat mkcert!
            echo.
            echo ========================================
            echo HUONG DAN CAI DAT THU CONG:
            echo ========================================
            echo.
            echo Cach 1: Download truc tiep
            echo   1. Mo: https://github.com/FiloSottile/mkcert/releases/latest
            echo   2. Download: mkcert-v1.4.4-windows-amd64.exe
            echo   3. Doi ten thanh: mkcert.exe
            echo   4. Copy vao thu muc: !SCRIPT_DIR!
            echo   5. Chay lai script nay
            echo.
            echo Hoac chay: download-mkcert.bat
            echo.
            pause
            exit /b 1
        )
    )
)

if "!MKCERT_CMD!"=="" (
    echo [ERROR] Khong tim thay mkcert!
    pause
    exit /b 1
)

echo.
echo [2/6] Dang install local CA...
echo [INFO] Kiem tra quyen Admin...

REM Kiểm tra quyền Admin
net session >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo [WARNING] Khong co quyen Admin!
    echo.
    echo [INFO] Dang thu cai dat local CA (co the that bai neu khong co quyen Admin)...
    "!MKCERT_CMD!" -install >nul 2>&1
    set "CA_INSTALL_RESULT=!ERRORLEVEL!"
    
    if !CA_INSTALL_RESULT! NEQ 0 (
        echo [WARNING] Khong the install local CA (can quyen Admin hoac da duoc cai roi)
        echo.
        echo ========================================
        echo [QUAN TRONG] LOCAL CA KHONG BAT BUOC!
        echo ========================================
        echo.
        echo Ban VAN CO THE:
        echo   - Tao certificates (khong can CA)
        echo   - Su dung HTTPS binh thuong
        echo   - GPS van hoat dong
        echo.
        echo Chi khac: Browser se canh bao certificate lan dau
        echo   (chi can click "Advanced" -^> "Proceed to localhost" 1 lan)
        echo.
        echo Tiep tuc voi buoc tao certificates...
    ) else (
        echo [OK] Local CA da duoc install (co the da duoc cai truoc do)
    )
) else (
    echo [OK] Co quyen Admin, dang cai dat local CA...
    "!MKCERT_CMD!" -install >nul 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo [WARNING] Khong the install local CA (co the da duoc cai roi)
    ) else (
        echo [OK] Local CA da duoc install thanh cong!
    )
)

echo.
echo [3/6] Dang tao certificates...
set "BACKEND_DIR=!SCRIPT_DIR!\Backend"
if not exist "!BACKEND_DIR!" (
    echo [ERROR] Thu muc Backend khong ton tai: !BACKEND_DIR!
    pause
    exit /b 1
)

cd /d "!BACKEND_DIR!"

if not exist "certificates" mkdir certificates

echo [INFO] Dang tao certificates...
"!MKCERT_CMD!" -key-file certificates\localhost-key.pem -cert-file certificates\localhost.pem localhost 127.0.0.1 ::1
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] Khong the tao certificates!
    cd /d "!SCRIPT_DIR!"
    pause
    exit /b 1
)

echo [OK] Certificates da duoc tao
cd /d "!SCRIPT_DIR!"

echo.
echo [4/6] Dang cau hinh Frontend...
set "FRONTEND_DIR=!SCRIPT_DIR!\Frontend\Wedsite"
if not exist "!FRONTEND_DIR!" (
    echo [WARNING] Thu muc Frontend\Wedsite khong ton tai, bo qua cau hinh .env
) else (
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
)

echo.
echo [5/6] Dang kiem tra lai...
if not exist "!BACKEND_DIR!\certificates\localhost.pem" (
    echo [ERROR] Certificates khong duoc tao thanh cong!
    pause
    exit /b 1
)
if not exist "!BACKEND_DIR!\certificates\localhost-key.pem" (
    echo [ERROR] Private key khong duoc tao thanh cong!
    pause
    exit /b 1
)

echo.
echo [6/6] Hoan thanh!
echo.
echo ========================================
echo SETUP HTTPS HOAN TAT!
echo ========================================
echo.
echo Certificates da duoc tao tai:
echo   - Backend\certificates\localhost.pem
echo   - Backend\certificates\localhost-key.pem
echo.
if exist "!FRONTEND_DIR!\.env" (
    echo Frontend da duoc cau hinh:
    echo   - .env: VITE_API_URL=https://localhost:8000/api
    echo.
)
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
echo 3. Truy cap:
echo    - Frontend: https://localhost:5173
echo    - Backend: https://localhost:8000
echo.
echo 4. Chap nhan certificate trong browser
echo.
echo 5. Test GPS tai: https://localhost:5173/AI
echo.
echo ========================================
pause
