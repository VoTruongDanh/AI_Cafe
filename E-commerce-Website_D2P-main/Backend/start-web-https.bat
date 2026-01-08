@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Laravel Development Server (HTTPS)
echo ========================================
echo Khoi dong Laravel Development Server voi HTTPS
echo ========================================
echo.

REM Kiem tra certificates
if not exist "certificates\localhost.pem" (
    echo [WARNING] Certificates chua duoc tao!
    echo.
    echo Vui long chay: setup-https.bat
    echo.
    pause
    exit /b 1
)

REM Tim PHP (kiem tra PATH truoc, sau do cac thu muc pho bien)
set PHP_PATH=
where php >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    REM PHP có trong PATH
    set PHP_PATH=php
) else (
    REM Tìm trong các thư mục phổ biến
    if exist "C:\xampp\php\php.exe" (
        set PHP_PATH=C:\xampp\php\php.exe
    ) else if exist "C:\xampp74\php\php.exe" (
        set PHP_PATH=C:\xampp74\php\php.exe
    ) else if exist "C:\xampp80\php\php.exe" (
        set PHP_PATH=C:\xampp80\php\php.exe
    ) else if exist "C:\xampp81\php\php.exe" (
        set PHP_PATH=C:\xampp81\php\php.exe
    ) else if exist "C:\laragon\bin\php\php-8.3.0-Win32-vs16-x64\php.exe" (
        set PHP_PATH=C:\laragon\bin\php\php-8.3.0-Win32-vs16-x64\php.exe
    ) else if exist "C:\laragon\bin\php\php-8.2.0-Win32-vs16-x64\php.exe" (
        set PHP_PATH=C:\laragon\bin\php\php-8.2.0-Win32-vs16-x64\php.exe
    ) else if exist "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" (
        set PHP_PATH=C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe
    ) else if exist "C:\wamp64\bin\php\php8.3.0\php.exe" (
        set PHP_PATH=C:\wamp64\bin\php\php8.3.0\php.exe
    ) else if exist "C:\wamp64\bin\php\php8.2.0\php.exe" (
        set PHP_PATH=C:\wamp64\bin\php\php8.2.0\php.exe
    ) else if exist "C:\wamp64\bin\php\php8.1.0\php.exe" (
        set PHP_PATH=C:\wamp64\bin\php\php8.1.0\php.exe
    ) else if exist "C:\php\php.exe" (
        set PHP_PATH=C:\php\php.exe
    )
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
echo Server URL: http://localhost:8000 (HTTP)
echo API URL: https://localhost:5173/api (proxied via Frontend HTTPS)
echo Swagger Docs: http://localhost:8000/api/documentation
echo ========================================
echo.
echo [INFO] Laravel artisan serve khong ho tro HTTPS truc tiep.
echo [INFO] Backend chay HTTP, Frontend se proxy requests qua HTTPS.
echo [INFO] Khong co van de Mixed Content vi Frontend proxy la server-side.
echo.
echo Nhan Ctrl+C de dung server
echo.

REM Chay Laravel voi HTTP (Frontend se proxy qua HTTPS)
REM Dung 127.0.0.1 thay vi localhost de tranh IPv6
%PHP_PATH% artisan serve --host=127.0.0.1 --port=8000

pause
