# 🚀 Tự Động Setup HTTPS (1 Click)

## Cách sử dụng siêu đơn giản

### Cách 1: Tự động setup + Khởi động (Khuyến nghị)
```bash
start-all-https.bat
```
**Script này sẽ:**
1. ✅ Tự động kiểm tra và cài mkcert (nếu chưa có)
2. ✅ Tự động tạo certificates
3. ✅ Tự động cấu hình Frontend
4. ✅ Tự động khởi động Backend + Frontend với HTTPS
5. ✅ Tự động mở browser

---

### Cách 2: Chỉ setup HTTPS
```bash
auto-setup-https.bat
```
**Sau đó khởi động thủ công:**
```bash
# Terminal 1: Backend
cd Backend
start-web-https.bat

# Terminal 2: Frontend
cd Frontend/Wedsite
start-frontend.bat
```

---

## Yêu cầu

### Bắt buộc:
- ✅ **PHP** (XAMPP, Laragon, hoặc WAMP)
- ✅ **Node.js** (https://nodejs.org/)

### Tự động cài (nếu có):
- ✅ **mkcert** - Script sẽ tự động cài qua Chocolatey hoặc Scoop

### Nếu không có Chocolatey/Scoop:
1. Download mkcert: https://github.com/FiloSottile/mkcert/releases
2. Giải nén và thêm vào PATH
3. Hoặc cài Chocolatey: https://chocolatey.org/install

---

## Sau khi chạy script

### 1. Chấp nhận Certificate
Browser sẽ cảnh báo → Click **"Advanced"** → **"Proceed to localhost"**

### 2. Truy cập
- **Frontend**: `https://localhost:5173`
- **Backend**: `https://localhost:8000`

### 3. Test GPS
1. Mở `https://localhost:5173/AI`
2. Bật **"Tự động"** (GPS)
3. GPS sẽ hoạt động! 🎉

---

## Troubleshooting

### Lỗi: "mkcert is not recognized"
**Giải pháp:**
1. Chạy `auto-setup-https.bat` lại
2. Hoặc cài mkcert thủ công (xem trên)

### Lỗi: "Certificate not found"
**Giải pháp:**
1. Chạy `auto-setup-https.bat` lại
2. Kiểm tra thư mục `Backend/certificates/`

### GPS vẫn không hoạt động
**Kiểm tra:**
1. URL có `https://` không? (phải là HTTPS!)
2. Đã chấp nhận certificate chưa?
3. Browser console có lỗi gì không?

---

## Files được tạo

- `Backend/certificates/localhost.pem` - Certificate
- `Backend/certificates/localhost-key.pem` - Private key
- `Frontend/Wedsite/.env` - Cấu hình API URL (HTTPS)

---

## Lưu ý

- ⚠️ **Chỉ dùng cho local development**
- ⚠️ **Không dùng cho production**
- ✅ **Trust certificate lần đầu** - Browser sẽ cảnh báo, cần accept

---

## Tắt HTTPS (nếu cần)

1. Xóa thư mục `Backend/certificates/`
2. Sửa `Frontend/Wedsite/.env`: `VITE_API_URL=http://localhost:8000/api`
3. Khởi động lại servers
