# Hướng dẫn Setup HTTPS cho Local Development

## Vấn đề
Geolocation API yêu cầu HTTPS (hoặc localhost) để hoạt động. Nếu website chạy trên HTTP, GPS sẽ không hoạt động.

## Giải pháp
Sử dụng **mkcert** để tạo self-signed certificates cho local development.

---

## Bước 1: Cài đặt mkcert

### Windows (Chocolatey):
```bash
choco install mkcert
```

### Windows (Scoop):
```bash
scoop install mkcert
```

### Windows (Manual):
1. Download từ: https://github.com/FiloSottile/mkcert/releases
2. Giải nén và thêm vào PATH

### macOS:
```bash
brew install mkcert
```

### Linux:
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

---

## Bước 2: Tạo Certificates

Chạy script tự động:
```bash
cd Backend
setup-https.bat
```

Hoặc thủ công:
```bash
# Install local CA
mkcert -install

# Tạo certificates
cd Backend
mkdir certificates
mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1
```

---

## Bước 3: Cấu hình Frontend

### Tự động (đã được cấu hình):
Vite sẽ tự động detect certificates và enable HTTPS.

### Thủ công:
Tạo file `.env` trong `Frontend/Wedsite/`:
```env
VITE_API_URL=https://localhost:8000/api
```

---

## Bước 4: Khởi động Servers

### Backend (HTTPS):
```bash
cd Backend
start-web-https.bat
```

### Frontend (HTTPS):
```bash
cd Frontend/Wedsite
npm run dev
```

Frontend sẽ tự động chạy HTTPS nếu có certificates.

---

## Bước 5: Chấp nhận Certificate trong Browser

### Chrome/Edge:
1. Truy cập: `https://localhost:5173`
2. Click "Advanced" hoặc "Nâng cao"
3. Click "Proceed to localhost (unsafe)" hoặc "Tiếp tục đến localhost (không an toàn)"

### Firefox:
1. Truy cập: `https://localhost:5173`
2. Click "Advanced" hoặc "Nâng cao"
3. Click "Accept the Risk and Continue" hoặc "Chấp nhận rủi ro và tiếp tục"

---

## Kiểm tra

1. **Frontend**: `https://localhost:5173` (HTTPS)
2. **Backend**: `https://localhost:8000` (HTTPS)
3. **GPS**: Bật "Tự động" trên trang `/AI` → GPS sẽ hoạt động!

---

## Troubleshooting

### Lỗi: "mkcert is not recognized"
- Đảm bảo mkcert đã được cài đặt và có trong PATH
- Thử restart terminal/command prompt

### Lỗi: "Certificate not found"
- Chạy lại `setup-https.bat`
- Kiểm tra thư mục `Backend/certificates/` có 2 files:
  - `localhost.pem`
  - `localhost-key.pem`

### Lỗi: "NET::ERR_CERT_AUTHORITY_INVALID"
- Đảm bảo đã chạy `mkcert -install`
- Thử restart browser

### GPS vẫn không hoạt động:
- Kiểm tra URL có `https://` không
- Kiểm tra browser console có lỗi gì không
- Thử trên browser khác (Chrome, Firefox, Edge)

---

## Lưu ý

- **Chỉ dùng cho local development**: Certificates này chỉ hợp lệ cho localhost
- **Không dùng cho production**: Cần certificates từ CA hợp lệ (Let's Encrypt, etc.)
- **Trust certificate**: Browser sẽ cảnh báo lần đầu, cần accept để tiếp tục

---

## Tắt HTTPS (nếu cần)

1. Xóa hoặc đổi tên thư mục `Backend/certificates/`
2. Cập nhật `.env`: `VITE_API_URL=http://localhost:8000/api`
3. Khởi động lại servers
