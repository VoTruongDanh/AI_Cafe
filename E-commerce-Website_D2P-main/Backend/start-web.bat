@echo off
title Laravel Development Server
echo ========================================
echo Khoi dong Laravel Development Server
echo ========================================
echo.

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
echo.
echo ========================================
echo Server URL: http://localhost:8000
echo API URL: http://localhost:8000/api
echo Swagger Docs: http://localhost:8000/api/documentation
echo ========================================
echo.
echo Nhan Ctrl+C de dung server
echo.

%PHP_PATH% artisan serve

pause
