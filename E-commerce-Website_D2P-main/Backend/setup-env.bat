@echo off
echo ========================================
echo Tao file .env va cau hinh database
echo ========================================

REM Kiem tra file .env da ton tai chua
if exist ".env" (
    echo File .env da ton tai!
    echo Ban co muon ghi de? (Y/N)
    set /p overwrite=
    if /i not "%overwrite%"=="Y" (
        echo Huy bo.
        exit /b 0
    )
)

REM Tao file .env
(
echo APP_NAME=Laravel
echo APP_ENV=local
echo APP_KEY=
echo APP_DEBUG=true
echo APP_URL=http://localhost
echo.
echo LOG_CHANNEL=stack
echo LOG_LEVEL=debug
echo.
echo DB_CONNECTION=mysql
echo DB_HOST=127.0.0.1
echo DB_PORT=3306
echo DB_DATABASE=quanlycuahangcafe
echo DB_USERNAME=root
echo DB_PASSWORD=
echo.
echo BROADCAST_DRIVER=log
echo CACHE_DRIVER=file
echo FILESYSTEM_DISK=local
echo QUEUE_CONNECTION=sync
echo SESSION_DRIVER=file
echo SESSION_LIFETIME=120
echo.
echo MEMCACHED_HOST=127.0.0.1
echo.
echo REDIS_HOST=127.0.0.1
echo REDIS_PASSWORD=null
echo REDIS_PORT=6379
echo.
echo MAIL_MAILER=smtp
echo MAIL_HOST=mailpit
echo MAIL_PORT=1025
echo MAIL_USERNAME=null
echo MAIL_PASSWORD=null
echo MAIL_ENCRYPTION=null
echo MAIL_FROM_ADDRESS="hello@example.com"
echo MAIL_FROM_NAME="${APP_NAME}"
echo.
echo AWS_ACCESS_KEY_ID=
echo AWS_SECRET_ACCESS_KEY=
echo AWS_DEFAULT_REGION=us-east-1
echo AWS_BUCKET=
echo AWS_USE_PATH_STYLE_ENDPOINT=false
echo.
echo VITE_APP_NAME="${APP_NAME}"
) > .env

echo Da tao file .env!
echo.
echo ========================================
echo Vui long:
echo 1. Kiem tra database "quanlycuahangcafe" da duoc tao trong phpMyAdmin
echo 2. Neu chua, tao database moi trong phpMyAdmin: http://localhost/phpmyadmin/
echo 3. Sau do chay: run-migrations-seed.bat
echo ========================================
pause
