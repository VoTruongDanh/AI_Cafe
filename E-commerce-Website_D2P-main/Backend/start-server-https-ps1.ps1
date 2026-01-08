# Script PowerShell để khởi động Laravel server với HTTPS
# Sử dụng: .\start-server-https-ps1.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Khoi dong Laravel Development Server voi HTTPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra certificates
$certPath = Join-Path $PSScriptRoot "certificates\localhost.pem"
$keyPath = Join-Path $PSScriptRoot "certificates\localhost-key.pem"

if (-not (Test-Path $certPath) -or -not (Test-Path $keyPath)) {
    Write-Host "[WARNING] Certificates chua duoc tao!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Vui long chay:" -ForegroundColor Yellow
    Write-Host "  cd .." -ForegroundColor Cyan
    Write-Host "  setup-https-simple.bat" -ForegroundColor Cyan
    Write-Host "  hoac" -ForegroundColor Yellow
    Write-Host "  auto-setup-https.bat" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
}

# Tìm PHP
$phpPath = & "$PSScriptRoot\find-php.ps1"

if (-not $phpPath) {
    Write-Host "[ERROR] Khong the tim thay PHP!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vui long:" -ForegroundColor Yellow
    Write-Host "  1. Cai dat XAMPP, Laragon, hoac WAMP" -ForegroundColor Yellow
    Write-Host "  2. Hoac them PHP vao PATH" -ForegroundColor Yellow
    Write-Host "  3. Hoac su dung script batch: start-web-https.bat" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Chuyển đến thư mục Backend
Set-Location $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server URL: https://localhost:8000" -ForegroundColor Green
Write-Host "API URL: https://localhost:8000/api" -ForegroundColor Green
Write-Host "Swagger Docs: https://localhost:8000/api/documentation" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[LUU Y] Trinh duyet se canh bao ve certificate!" -ForegroundColor Yellow
Write-Host "  - Chrome/Edge: Click 'Advanced' -> 'Proceed to localhost'" -ForegroundColor Yellow
Write-Host "  - Firefox: Click 'Advanced' -> 'Accept the Risk and Continue'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Nhan Ctrl+C de dung server" -ForegroundColor Yellow
Write-Host ""

# Chạy Laravel server với HTTPS
$certRelative = "certificates\localhost.pem"
$keyRelative = "certificates\localhost-key.pem"

& $phpPath artisan serve --host=localhost --port=8000 --tls-cert=$certRelative --tls-key=$keyRelative
