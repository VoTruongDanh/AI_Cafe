@echo off
echo ========================================
echo Chay migrations va seeders...
echo ========================================
php artisan migrate:fresh --seed

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo LOI: Khong the chay migrations!
    echo Vui long kiem tra:
    echo 1. PHP da duoc cai dat va co trong PATH
    echo 2. Database da duoc cau hinh trong file .env
    echo 3. Composer dependencies da duoc cai dat (chay: composer install)
    pause
    exit /b 1
)

echo.
echo ========================================
echo Khoi dong backend server...
echo ========================================
echo Server se chay tai: http://localhost:8000
echo Nhan Ctrl+C de dung server
echo.
php artisan serve
