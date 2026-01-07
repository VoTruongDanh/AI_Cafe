# Hướng Dẫn Cấu Hình Google Gemini API

## 🚀 Cài Đặt Nhanh

### Bước 1: Thêm API Key vào `.env`

Thêm dòng sau vào file `.env`:

```env
GEMINI_API_KEY=AIzaSyDD5ksjYxA-5Qfr4EJfhF8ToDBeNiCZ6Gk
GEMINI_ENABLED=true
GEMINI_MODEL=gemini-pro
```

### Bước 2: Clear Config Cache

```bash
php artisan config:clear
```

### Bước 3: Test

Hệ thống sẽ tự động sử dụng Gemini AI nếu có API key!

---

## 📝 Chi Tiết Cấu Hình

### Các biến môi trường:

- **GEMINI_API_KEY**: API key từ Google AI Studio
- **GEMINI_ENABLED**: Bật/tắt AI (true/false)
- **GEMINI_MODEL**: Model sử dụng (mặc định: `gemini-pro`)

### Các model có sẵn:

- `gemini-pro` - Model chính (khuyến nghị)
- `gemini-pro-vision` - Hỗ trợ hình ảnh (nếu cần)

---

## 🔍 Kiểm Tra AI Đang Hoạt Động

### Kiểm tra trong response API:

```json
{
  "temperature": "COLD",
  "confidence": 0.92,
  "source": "AI",  // ← Nếu thấy "AI" = đang dùng Gemini
  "reason": "..."
}
```

### Kiểm tra logs:

```bash
tail -f storage/logs/laravel.log | grep "Gemini"
```

---

## 💰 Chi Phí

### Google Gemini Pricing:

- **Miễn phí**: 60 requests/phút
- **Paid**: $0.00025 / 1K characters input
- **Rất rẻ** so với OpenAI!

### Tối ưu:

- Cache kết quả 24h → giảm 80-90% requests
- Chỉ dùng AI cho sản phẩm mới/chưa rõ ràng
- Fallback về rule-based cho sản phẩm có keyword rõ ràng

---

## 🧪 Test API

### Test với cURL:

```bash
curl -X GET "http://localhost:8000/api/products/classify-temperature?limit=5" \
  -H "Accept: application/json"
```

### Kiểm tra source:

Response sẽ có `"source": "AI"` nếu đang dùng Gemini.

---

## ⚙️ Tùy Chỉnh

### Tắt AI (chỉ dùng rule-based):

```env
GEMINI_ENABLED=false
```

### Thay đổi model:

```env
GEMINI_MODEL=gemini-pro-vision
```

### Thay đổi cache time:

Trong `AITemperatureClassifier.php`:

```php
Cache::put($cacheKey, $result, now()->addHours(24)); // Đổi 24 thành số giờ khác
```

---

## 🐛 Troubleshooting

### Lỗi: "API key không hợp lệ"

- Kiểm tra API key trong `.env`
- Đảm bảo không có khoảng trắng thừa
- Chạy `php artisan config:clear`

### Lỗi: "Rate limit exceeded"

- Gemini miễn phí có giới hạn 60 requests/phút
- Tăng cache time để giảm requests
- Hoặc nâng cấp lên paid plan

### AI không hoạt động

- Kiểm tra `GEMINI_ENABLED=true`
- Kiểm tra API key có đúng không
- Xem logs trong `storage/logs/laravel.log`

---

## 📊 So Sánh với OpenAI

| Tính năng | Gemini | OpenAI |
|-----------|--------|--------|
| **Miễn phí** | ✅ 60 req/min | ❌ Có phí |
| **Chi phí** | $0.00025/1K chars | $0.0015/1K tokens |
| **Tốc độ** | Nhanh | Nhanh |
| **Chất lượng** | Tốt | Rất tốt |
| **Tiếng Việt** | ✅ Tốt | ✅ Tốt |

**Kết luận**: Gemini rẻ hơn và có free tier tốt!

---

## ✅ Hoàn Tất

Sau khi cấu hình, hệ thống sẽ:
1. ✅ Tự động dùng Gemini AI nếu có API key
2. ✅ Fallback về rule-based nếu AI không khả dụng
3. ✅ Cache kết quả để tối ưu chi phí
4. ✅ Log lỗi để debug

**Chúc bạn sử dụng thành công!** 🎉
