# Script PowerShell để khởi động Laravel server
# Sử dụng: .\start-server-ps1.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Khoi dong Laravel Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tìm PHP
$phpPath = & "$PSScriptRoot\find-php.ps1"

if (-not $phpPath) {
    Write-Host "[ERROR] Khong the tim thay PHP!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vui long:" -ForegroundColor Yellow
    Write-Host "  1. Cai dat XAMPP, Laragon, hoac WAMP" -ForegroundColor Yellow
    Write-Host "  2. Hoac them PHP vao PATH" -ForegroundColor Yellow
    Write-Host "  3. Hoac su dung script batch: start-web.bat" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Chuyển đến thư mục Backend
Set-Location $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server URL: http://localhost:8000" -ForegroundColor Green
Write-Host "API URL: http://localhost:8000/api" -ForegroundColor Green
Write-Host "Swagger Docs: http://localhost:8000/api/documentation" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nhan Ctrl+C de dung server" -ForegroundColor Yellow
Write-Host ""

# Chạy Laravel server
& $phpPath artisan serve
