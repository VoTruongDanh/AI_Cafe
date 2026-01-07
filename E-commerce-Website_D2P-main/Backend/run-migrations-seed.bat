@echo off
echo ========================================
echo Chay migrations va seeders...
echo ========================================

REM Tim PHP
set PHP_PATH=
if exist "C:\xampp\php\php.exe" (
    set PHP_PATH=C:\xampp\php\php.exe
) else if exist "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" (
    set PHP_PATH=C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe
) else if exist "C:\wamp64\bin\php\php8.1.0\php.exe" (
    set PHP_PATH=C:\wamp64\bin\php\php8.1.0\php.exe
)

if "%PHP_PATH%"=="" (
    echo ERROR: Khong tim thay PHP!
    echo Vui long cai dat XAMPP, Laragon hoac WAMP
    pause
    exit /b 1
)

echo Tim thay PHP tai: %PHP_PATH%

REM Kiem tra vendor folder
if not exist "vendor" (
    echo ========================================
    echo Cai dat dependencies...
    echo ========================================
    
    REM Tim Composer
    set COMPOSER_CMD=composer
    where composer >nul 2>&1
    if errorlevel 1 (
        if exist "C:\xampp\php\composer.bat" (
            set COMPOSER_CMD=C:\xampp\php\composer.bat
        ) else (
            echo ERROR: Khong tim thay Composer!
            echo Vui long cai dat Composer hoac chay: php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
            pause
            exit /b 1
        )
    )
    
    %COMPOSER_CMD% install
    if errorlevel 1 (
        echo ERROR: Cai dat dependencies that bai!
        pause
        exit /b 1
    )
)

echo ========================================
echo Chay migrations va seeders...
echo ========================================
%PHP_PATH% artisan migrate:fresh --seed

if errorlevel 1 (
    echo.
    echo ERROR: Chay migrations that bai!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Hoan thanh! Database da duoc cap nhat voi du lieu quan ca phe.
echo ========================================
echo.
echo Ban co the xem du lieu tai: http://localhost/phpmyadmin/
echo.
pause
