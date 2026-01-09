@echo off
echo ========================================
echo   Seed Face Recognition Test Users
echo ========================================
echo.
echo Dang tao users voi avatar tu anh nguoi that online...
echo.

cd /d "%~dp0"
php artisan db:seed --class=FaceRecognitionTestSeeder

echo.
echo ========================================
echo   Hoan thanh!
echo ========================================
pause
