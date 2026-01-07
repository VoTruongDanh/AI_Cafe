@echo off
echo Chay migrations va seeders...
php artisan migrate:fresh --seed
pause
