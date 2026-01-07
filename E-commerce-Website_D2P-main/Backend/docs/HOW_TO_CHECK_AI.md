# Cách Kiểm Tra AI Có Đang Hoạt Động

## 🎯 Cách 1: Sử Dụng Endpoint Kiểm Tra (Khuyến Nghị)

### Test Endpoint:

```bash
GET http://localhost:8000/api/products/ai-status
```

### Response Nếu AI Đang Hoạt Động:

```json
{
  "success": true,
  "ai_status": {
    "enabled": true,
    "api_key_set": true,
    "api_key_preview": "AIzaSyDD5k...",
    "model": "gemini-pro",
    "classifier_type": "AITemperatureClassifier (Gemini)"
  },
  "test_result": {
    "product": {
      "name": "Cà phê đặc biệt của quán",
      "categoryName": "Cà phê"
    },
    "classification": {
      "temperature": "HOT",
      "confidence": 0.85,
      "source": "AI",  // ← Quan trọng: "AI" = đang dùng Gemini
      "reason": "..."
    },
    "is_using_ai": true  // ← true = đang dùng AI
  }
}
```

### Response Nếu Chỉ Dùng Rule-Based:

```json
{
  "ai_status": {
    "enabled": false,  // ← false = không dùng AI
    "classifier_type": "TemperatureClassifier (Rule-Based)"
  },
  "test_result": {
    "classification": {
      "source": "RULE"  // ← "RULE" = chỉ dùng keyword matching
    },
    "is_using_ai": false
  }
}
```

---

## 🎯 Cách 2: Kiểm Tra Trong Response API Thông Thường

### Test Endpoint Phân Loại:

```bash
GET http://localhost:8000/api/products/classify-temperature?limit=5
```

### Kiểm Tra Field `source`:

```json
{
  "data": [
    {
      "name": "Trà xanh đá",
      "temperature": "COLD",
      "source": "AI",  // ← "AI" = đang dùng Gemini
      "confidence": 0.92,
      "reason": "..."
    }
  ]
}
```

**Giải thích:**
- `"source": "AI"` → ✅ Đang dùng Gemini AI
- `"source": "RULE"` → ❌ Chỉ dùng keyword matching
- `"source": "ATTRIBUTE"` → Dùng từ attributes (không liên quan AI)

---

## 🎯 Cách 3: Kiểm Tra Logs

### Xem Logs:

```bash
tail -f storage/logs/laravel.log | grep -i "gemini\|ai"
```

### Nếu Thấy Logs:

```
[INFO] Calling Gemini API for classification...
[INFO] Gemini API response received
```

→ ✅ AI đang hoạt động

### Nếu Không Thấy Logs:

→ ❌ Có thể đang dùng rule-based hoặc có lỗi

---

## 🎯 Cách 4: Test Với Sản Phẩm Không Có Keyword

### Test Case:

Sản phẩm: **"Cà phê đặc biệt của quán"**

- **Rule-Based**: `UNKNOWN` (không có keyword "đá", "nóng"...)
- **AI**: `HOT` (phân tích ngữ cảnh "cà phê" thường nóng)

### Test:

```bash
POST http://localhost:8000/api/products/classify-temperature
Content-Type: application/json

{
  "data": [
    {
      "id": 1,
      "name": "Cà phê đặc biệt của quán",
      "category": {"name": "Cà phê"}
    }
  ]
}
```

### Kết Quả:

- Nếu `temperature: "HOT"` và `source: "AI"` → ✅ AI hoạt động
- Nếu `temperature: "UNKNOWN"` và `source: "RULE"` → ❌ Chỉ dùng rule-based

---

## 🎯 Cách 5: Kiểm Tra Config

### Kiểm Tra Config:

```bash
php artisan tinker
```

Trong tinker:

```php
config('services.gemini.enabled')  // Phải là true
config('services.gemini.api_key')  // Phải có giá trị
```

---

## 🔍 Troubleshooting

### AI Không Hoạt Động?

1. **Kiểm tra .env:**
   ```env
   GEMINI_API_KEY=AIzaSyDD5ksjYxA-5Qfr4EJfhF8ToDBeNiCZ6Gk
   GEMINI_ENABLED=true
   ```

2. **Clear cache:**
   ```bash
   php artisan config:clear
   ```

3. **Kiểm tra API key:**
   - Đảm bảo API key đúng
   - Không có khoảng trắng thừa

4. **Xem logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

### Lỗi "Rate limit exceeded"?

- Gemini free tier: 60 requests/phút
- Giải pháp: Tăng cache time hoặc đợi 1 phút

---

## ✅ Checklist

- [ ] Gọi `/api/products/ai-status` → `ai_status.enabled = true`
- [ ] Response có `source: "AI"` trong classification
- [ ] Test với sản phẩm không có keyword → AI phân tích được
- [ ] Logs có thông tin về Gemini API calls

---

## 📝 Tóm Tắt

**Cách nhanh nhất:** Gọi `GET /api/products/ai-status`

**Cách đơn giản:** Kiểm tra field `source` trong response API:
- `"source": "AI"` → ✅ Đang dùng AI
- `"source": "RULE"` → ❌ Chỉ dùng rule-based
