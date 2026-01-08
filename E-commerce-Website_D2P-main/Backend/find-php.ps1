# Script tìm PHP tự động
# Sử dụng: .\find-php.ps1

$phpPaths = @(
    # Kiểm tra trong PATH trước
    "php",
    
    # XAMPP (nhiều phiên bản)
    "C:\xampp\php\php.exe",
    "C:\xampp74\php\php.exe",
    "C:\xampp80\php\php.exe",
    "C:\xampp81\php\php.exe",
    
    # Laragon (nhiều phiên bản)
    "C:\laragon\bin\php\php-8.3.0-Win32-vs16-x64\php.exe",
    "C:\laragon\bin\php\php-8.2.0-Win32-vs16-x64\php.exe",
    "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe",
    "C:\laragon\bin\php\php-8.0.0-Win32-vs16-x64\php.exe",
    "C:\laragon\bin\php\php-7.4.33-Win32-vc15-x64\php.exe",
    
    # WAMP
    "C:\wamp64\bin\php\php8.3.0\php.exe",
    "C:\wamp64\bin\php\php8.2.0\php.exe",
    "C:\wamp64\bin\php\php8.1.0\php.exe",
    "C:\wamp64\bin\php\php8.0.0\php.exe",
    "C:\wamp64\bin\php\php7.4.33\php.exe",
    "C:\wamp\bin\php\php8.3.0\php.exe",
    "C:\wamp\bin\php\php8.2.0\php.exe",
    "C:\wamp\bin\php\php8.1.0\php.exe",
    
    # Laragon - tìm động trong thư mục
    (Get-ChildItem "C:\laragon\bin\php" -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Sort-Object Name -Descending | Select-Object -First 1 | ForEach-Object { Join-Path $_.FullName "php.exe" }),
    
    # WAMP - tìm động trong thư mục
    (Get-ChildItem "C:\wamp64\bin\php" -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Sort-Object Name -Descending | Select-Object -First 1 | ForEach-Object { Join-Path $_.FullName "php.exe" }),
    
    # PHP standalone
    "C:\php\php.exe",
    "C:\Program Files\PHP\php.exe",
    "C:\Program Files (x86)\PHP\php.exe"
)

$foundPhp = $null

foreach ($path in $phpPaths) {
    if ($path -eq "php") {
        # Kiểm tra trong PATH
        try {
            $result = Get-Command php -ErrorAction Stop
            $foundPhp = $result.Source
            break
        } catch {
            continue
        }
    } elseif ($path -and (Test-Path $path)) {
        $foundPhp = $path
        break
    }
}

if ($foundPhp) {
    Write-Host "[OK] Tim thay PHP: $foundPhp" -ForegroundColor Green
    Write-Host ""
    
    # Hiển thị phiên bản
    $version = & $foundPhp -v 2>&1 | Select-Object -First 1
    Write-Host "Version: $version" -ForegroundColor Cyan
    Write-Host ""
    
    return $foundPhp
} else {
    Write-Host "[ERROR] Khong tim thay PHP!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vui long:" -ForegroundColor Yellow
    Write-Host "  1. Cai dat XAMPP, Laragon, hoac WAMP" -ForegroundColor Yellow
    Write-Host "  2. Hoac them PHP vao PATH" -ForegroundColor Yellow
    Write-Host "  3. Hoac su dung script batch: start-web.bat hoac start-web-https.bat" -ForegroundColor Yellow
    Write-Host ""
    
    return $null
}
