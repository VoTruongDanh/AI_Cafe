@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Restart Laravel API
color 0B

echo ============================================================
echo    Restart Laravel API
echo ============================================================
echo.

echo [INFO] Dang tim process Laravel tren port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    set "PID=%%a"
    echo [INFO] Tim thay process PID: !PID!
    echo [INFO] Dang dong process...
    taskkill /PID !PID! /F >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Khong the dong process !PID!
    ) else (
        echo [OK] Da dong process !PID!
    )
)
echo.

echo [INFO] Cho 2 giay de process dong hoan toan...
timeout /t 2 /nobreak >nul
echo.

echo [INFO] Khoi dong lai Laravel API voi IPv4 (127.0.0.1)...
echo [INFO] Laravel se chay tren: http://127.0.0.1:8000
echo.
echo [INFO] Nhan Ctrl+C de dung server
echo.

REM Tim PHP
set PHP_PATH=
where php >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PHP_PATH=php
) else (
    if exist "C:\xampp\php\php.exe" (
        set PHP_PATH=C:\xampp\php\php.exe
    ) else if exist "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" (
        set PHP_PATH=C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe
    ) else if exist "C:\wamp64\bin\php\php8.1.0\php.exe" (
        set PHP_PATH=C:\wamp64\bin\php\php8.1.0\php.exe
    )
)

if "%PHP_PATH%"=="" (
    echo [ERROR] Khong tim thay PHP!
    pause
    exit /b 1
)

REM Khoi dong Laravel voi IPv4
%PHP_PATH% artisan serve --host=127.0.0.1 --port=8000

pause
