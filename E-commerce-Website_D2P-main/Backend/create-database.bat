@echo off
echo ========================================
echo Tao database quanlycuahangcafe
echo ========================================

REM Tim MySQL
set MYSQL_PATH=
if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
) else if exist "C:\laragon\bin\mysql\mysql-8.0.30\bin\mysql.exe" (
    set MYSQL_PATH=C:\laragon\bin\mysql\mysql-8.0.30\bin\mysql.exe
) else if exist "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe" (
    set MYSQL_PATH=C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe
)

if "%MYSQL_PATH%"=="" (
    echo ERROR: Khong tim thay MySQL!
    echo.
    echo Vui long tao database thủ cong:
    echo 1. Mo phpMyAdmin: http://localhost/phpmyadmin/
    echo 2. Click "New" de tao database moi
    echo 3. Dat ten: quanlycuahangcafe
    echo 4. Chon Collation: utf8mb4_unicode_ci
    echo 5. Click "Create"
    echo.
    pause
    exit /b 1
)

echo Tim thay MySQL tai: %MYSQL_PATH%
echo.
echo Dang tao database...
echo.

REM Tao database
%MYSQL_PATH% -u root -e "CREATE DATABASE IF NOT EXISTS quanlycuahangcafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if errorlevel 1 (
    echo.
    echo ERROR: Khong the tao database!
    echo Vui long tao database thủ cong trong phpMyAdmin.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database da duoc tao thanh cong!
echo ========================================
echo.
echo Ban co the xem database tai: http://localhost/phpmyadmin/
echo.
pause
