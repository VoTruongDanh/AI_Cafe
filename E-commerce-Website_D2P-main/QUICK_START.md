# 🚀 Quick Start Guide

## Vấn đề: Lỗi "Could not read package.json"

**Nguyên nhân:** Bạn đang ở thư mục `Frontend` nhưng `package.json` nằm ở `Frontend\Wedsite`

**Giải pháp:** Chuyển vào thư mục đúng:
```bash
cd Frontend\Wedsite
npm run dev
```

---

## Các lệnh cơ bản

### 1. Backend (Laravel)

**HTTP:**
```bash
cd Backend
php artisan serve
```

**HTTPS:**
```bash
cd Backend
php artisan serve --host=localhost --port=8000 --tls-cert=certificates\localhost.pem --tls-key=certificates\localhost-key.pem
```

**Hoặc dùng script:**
```bash
cd Backend
start-web.bat          # HTTP
start-web-https.bat    # HTTPS
```

### 2. Frontend (React)

```bash
cd Frontend\Wedsite
npm run dev
```

**Hoặc dùng script:**
```bash
cd Frontend\Wedsite
start-frontend.bat
```

### 3. AI Service (Python)

```bash
cd Backend\ai-temp-local
python api.py
```

**Hoặc dùng script:**
```bash
cd Backend\ai-temp-local
1-start-ai-service.bat
```

---

## Setup HTTPS (lần đầu)

```bash
# Từ thư mục gốc
auto-setup-https.bat
# hoặc
setup-https-simple.bat
```

---

## Khởi động tất cả (HTTPS)

```bash
# Từ thư mục gốc
start-all-https.bat
```

---

## Lưu ý

1. **Frontend:** Luôn chạy từ `Frontend\Wedsite` (không phải `Frontend`)
2. **Backend:** Chạy từ `Backend`
3. **AI Service:** Chạy từ `Backend\ai-temp-local`

---

## Troubleshooting

### PHP không tìm thấy
```bash
# Xem: Backend\README_PHP.md
# Hoặc dùng script batch (tự động tìm PHP)
cd Backend
start-web.bat
```

### Certificates chưa có
```bash
# Từ thư mục gốc
setup-https-simple.bat
```

### Port đã được sử dụng
```bash
# Backend: Đổi port trong lệnh serve
php artisan serve --port=8001

# Frontend: Sửa trong vite.config.js hoặc dùng biến môi trường
```
