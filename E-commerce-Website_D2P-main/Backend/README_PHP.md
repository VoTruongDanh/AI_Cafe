# 🔧 Hướng dẫn sử dụng PHP trong PowerShell

## Vấn đề
Khi chạy `php artisan serve` trong PowerShell, gặp lỗi:
```
php : The term 'php' is not recognized...
```

## Giải pháp

### ✅ Giải pháp 1: Sử dụng script batch (Khuyến nghị)
Script batch tự động tìm PHP ở các vị trí phổ biến:

**HTTP:**
```bash
start-web.bat
```

**HTTPS:**
```bash
start-web-https.bat
```

### ✅ Giải pháp 2: Sử dụng script PowerShell
Script PowerShell tự động tìm PHP:

**HTTP:**
```powershell
.\start-server-ps1.ps1
```

**HTTPS:**
```powershell
.\start-server-https-ps1.ps1
```

### ✅ Giải pháp 3: Thêm PHP vào PATH

#### Cách 1: Thêm tạm thời (chỉ cho session hiện tại)
```powershell
# XAMPP
$env:Path += ";C:\xampp\php"

# Laragon (thay đổi phiên bản theo của bạn)
$env:Path += ";C:\laragon\bin\php\php-8.3.0-Win32-vs16-x64"

# WAMP
$env:Path += ";C:\wamp64\bin\php\php8.3.0"
```

#### Cách 2: Thêm vĩnh viễn (cho tất cả session)
1. Mở **System Properties** → **Environment Variables**
2. Trong **System variables**, tìm `Path` → **Edit**
3. Click **New** → Thêm đường dẫn đến PHP:
   - XAMPP: `C:\xampp\php`
   - Laragon: `C:\laragon\bin\php\php-8.3.0-Win32-vs16-x64` (thay đổi phiên bản)
   - WAMP: `C:\wamp64\bin\php\php8.3.0` (thay đổi phiên bản)
4. Click **OK** → **OK** → **OK**
5. **Đóng và mở lại PowerShell**

### ✅ Giải pháp 4: Tìm PHP tự động
Chạy script để tìm PHP:
```powershell
.\find-php.ps1
```

Script sẽ hiển thị đường dẫn PHP nếu tìm thấy.

## Kiểm tra PHP đã được cài đặt chưa

### Cách 1: Kiểm tra trong PATH
```powershell
php -v
```

### Cách 2: Kiểm tra các vị trí phổ biến
```powershell
# XAMPP
Test-Path "C:\xampp\php\php.exe"

# Laragon
Test-Path "C:\laragon\bin\php\php-8.3.0-Win32-vs16-x64\php.exe"

# WAMP
Test-Path "C:\wamp64\bin\php\php8.3.0\php.exe"
```

## Cài đặt PHP (nếu chưa có)

### Option 1: XAMPP (Khuyến nghị cho người mới)
1. Download: https://www.apachefriends.org/
2. Cài đặt
3. PHP sẽ ở: `C:\xampp\php\php.exe`

### Option 2: Laragon (Khuyến nghị cho developer)
1. Download: https://laragon.org/
2. Cài đặt
3. PHP sẽ ở: `C:\laragon\bin\php\php-{version}\php.exe`

### Option 3: WAMP
1. Download: https://www.wampserver.com/
2. Cài đặt
3. PHP sẽ ở: `C:\wamp64\bin\php\php{version}\php.exe`

### Option 4: PHP Standalone
1. Download: https://windows.php.net/download/
2. Giải nén vào `C:\php`
3. Thêm `C:\php` vào PATH

## Tóm tắt

**Nhanh nhất:**
```bash
# Sử dụng script batch (tự động tìm PHP)
start-web.bat          # HTTP
start-web-https.bat    # HTTPS
```

**Nếu muốn dùng PowerShell:**
```powershell
# Thêm PHP vào PATH tạm thời
$env:Path += ";C:\xampp\php"  # Thay đổi theo vị trí PHP của bạn

# Sau đó chạy bình thường
php artisan serve
```
