@echo off
title Install Local CA (Manual)
echo ========================================
echo CAI DAT LOCAL CA THU CONG
echo ========================================
echo.

REM Kiểm tra quyền Admin
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Script nay can quyen Administrator!
    echo.
    echo [HUONG DAN] De chay voi quyen Admin:
    echo   1. Right-click vao file nay
    echo   2. Chon "Run as administrator"
    echo   3. Hoac mo Command Prompt voi quyen Admin va chay script
    echo.
    pause
    exit /b 1
)

echo [OK] Co quyen Admin
echo.
echo Script nay se cai dat local CA de mkcert hoat dong.
echo.
echo [LUU Y] Neu local CA da duoc cai roi, se khong co loi.
echo.
pause

REM Tìm mkcert
set "MKCERT_CMD="
where mkcert >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "MKCERT_CMD=mkcert"
) else (
    if exist "%~dp0mkcert.exe" (
        set "MKCERT_CMD=%~dp0mkcert.exe"
    ) else (
        echo [ERROR] Khong tim thay mkcert!
        echo.
        echo Vui long:
        echo   1. Cai dat mkcert truoc
        echo   2. Hoac chay: download-mkcert.bat
        echo.
        pause
        exit /b 1
    )
)

echo [INFO] Tim thay mkcert: %MKCERT_CMD%
echo.

REM Kiểm tra mkcert có chạy được không
echo [INFO] Dang kiem tra mkcert...
"%MKCERT_CMD%" -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] mkcert khong the chay!
    echo.
    echo Co the do:
    echo   - File mkcert.exe bi corrupt hoac khong tuong thich
    echo   - Windows chặn file khong duoc ky
    echo   - Antivirus chặn file
    echo.
    echo [GIAI PHAP] Thu download lai mkcert:
    echo   1. Xoa file mkcert.exe hien tai
    echo   2. Chay: download-mkcert.bat
    echo   3. Chay lai script nay
    echo.
    pause
    exit /b 1
)

echo [OK] mkcert co the chay duoc
echo.
echo [INFO] Dang cai dat local CA...
echo.

REM Thử cài với output để xem lỗi chi tiết
"%MKCERT_CMD%" -install
set "INSTALL_RESULT=!ERRORLEVEL!"

if !INSTALL_RESULT! EQU 0 (
    echo.
    echo [OK] Local CA da duoc cai dat thanh cong!
    echo.
    echo [INFO] Browser se tu dong tin tuong certificates tu gio!
) else (
    echo.
    echo [WARNING] Khong the cai dat local CA!
    echo.
    echo Co the do:
    echo   1. Windows chặn file khong duoc ky (SmartScreen)
    echo   2. Antivirus chặn thay doi Certificate Store
    echo   3. Local CA da duoc cai roi (khong sao)
    echo   4. Quyen Admin chua duoc cap dung cach
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
    echo [TIP] Neu muon bo qua canh bao, thu:
    echo   1. Tat SmartScreen tam thoi
    echo   2. Tat Antivirus tam thoi
    echo   3. Hoac chi can accept canh bao 1 lan la xong
    echo.
)

echo.
pause
