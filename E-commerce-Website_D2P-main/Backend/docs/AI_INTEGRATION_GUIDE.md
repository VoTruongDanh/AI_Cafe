

## 📊 So Sánh: Rule-Based vs AI

### ❌ Hiện Tại (Rule-Based - Keyword Matching)
- **Cách hoạt động**: So khớp từ khóa trong tên sản phẩm
- **Ví dụ**: "Trà xanh đá" → tìm thấy "đá" → COLD
- **Hạn chế**:
  - Không hiểu ngữ nghĩa
  - Không xử lý được tên sáng tạo
  - Phải cập nhật thủ công keywords
  - Không học được từ dữ liệu

### ✅ AI Thực Sự (LLM - Large Language Model)
- **Cách hoạt động**: Phân tích ngữ nghĩa bằng AI
- **Ví dụ**: "Trà xanh đá" → AI hiểu "đá" = lạnh → COLD
- **Ưu điểm**:
  - Hiểu ngữ nghĩa và ngữ cảnh
  - Xử lý được tên sáng tạo, mô tả
  - Tự động học từ dữ liệu
  - Có thể phân tích mô tả sản phẩm

---

## 🚀 Cài Đặt AI Classifier

### Bước 1: Thêm OpenAI API Key vào `.env`

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_ENABLED=true
OPENAI_MODEL=gpt-3.5-turbo
```

**Lưu ý**: 
- Cần tạo tài khoản tại [OpenAI](https://platform.openai.com/)
- Có thể dùng `gpt-3.5-turbo` (rẻ hơn) hoặc `gpt-4` (chính xác hơn)
- API key có dạng: `sk-...`

### Bước 2: Kiểm Tra Cấu Hình

File `config/services.php` đã được cập nhật:

```php
'openai' => [
    'api_key' => env('OPENAI_API_KEY'),
    'enabled' => env('OPENAI_ENABLED', false),
    'model' => env('OPENAI_MODEL', 'gpt-3.5-turbo'),
],
```

### Bước 3: Sử Dụng

Controller đã tự động sử dụng AI nếu có API key:

```php
// Nếu có OPENAI_API_KEY → dùng AITemperatureClassifier
// Nếu không có → dùng TemperatureClassifier (rule-based)
```

---

## 🔄 Cách Hoạt Động

### Hybrid Approach (Kết Hợp)

1. **Kiểm tra Attributes** (ưu tiên cao nhất)
   - Nếu có `attributes.temperature` → dùng ngay

2. **Thử AI** (nếu có API key)
   - Gọi OpenAI API để phân tích
   - Cache kết quả 24h
   - Confidence > 0.7 → dùng kết quả AI

3. **Fallback Rule-Based**
   - Nếu AI không khả dụng hoặc confidence thấp
   - Dùng keyword matching như cũ

### Ví Dụ:

```php
// Sản phẩm: "Cà phê đặc biệt của quán"
// Rule-based: UNKNOWN (không có keyword)
// AI: HOT (phân tích ngữ cảnh "cà phê" thường nóng)
```

---

## 📝 API Response Format

### Với AI:

```json
{
  "temperature": "COLD",
  "confidence": 0.92,
  "source": "AI",
  "reason": "Sản phẩm có từ 'đá' và thuộc danh mục đồ uống lạnh"
}
```

### Với Rule-Based:

```json
{
  "temperature": "COLD",
  "confidence": 0.95,
  "source": "RULE",
  "reason": "Tìm thấy keyword lạnh trong tên/danh mục"
}
```

---

## 💰 Chi Phí

### OpenAI Pricing (2024):

- **GPT-3.5-turbo**: ~$0.0015 / 1K tokens
- **GPT-4**: ~$0.03 / 1K tokens

**Ước tính**:
- Mỗi request: ~150 tokens
- 1000 requests = ~150K tokens = ~$0.23 (GPT-3.5)
- Cache 24h → giảm 80-90% requests

**Tối ưu**:
- Chỉ dùng AI cho sản phẩm mới/chưa có trong cache
- Cache kết quả 24h
- Fallback về rule-based cho sản phẩm có keyword rõ ràng

---

## 🧪 Test AI

### Test với cURL:

```bash
curl -X GET "http://localhost:8000/api/products/classify-temperature?limit=5" \
  -H "Accept: application/json"
```

### Kiểm tra source trong response:

```json
{
  "source": "AI"  // ← Nếu thấy "AI" = đang dùng AI thực sự
}
```

---

## 🔧 Tùy Chỉnh

### Thay đổi Model:

```env
OPENAI_MODEL=gpt-4  # Chính xác hơn nhưng đắt hơn
```

### Tắt AI (chỉ dùng rule-based):

```env
OPENAI_ENABLED=false
```

### Thay đổi Cache Time:

Trong `AITemperatureClassifier.php`:

```php
Cache::put($cacheKey, $result, now()->addHours(24)); // Đổi 24 thành số giờ khác
```

---

## 📊 So Sánh Kết Quả

| Sản phẩm | Rule-Based | AI |
|----------|-----------|-----|
| "Trà xanh đá" | ✅ COLD (95%) | ✅ COLD (92%) |
| "Cà phê đặc biệt" | ❌ UNKNOWN (50%) | ✅ HOT (85%) |
| "Sinh tố mix trái cây" | ✅ COLD (95%) | ✅ COLD (90%) |
| "Đồ uống giải nhiệt" | ❌ UNKNOWN (50%) | ✅ COLD (88%) |

---

## 🎯 Kết Luận

- **Rule-Based**: Nhanh, miễn phí, nhưng hạn chế
- **AI**: Thông minh hơn, hiểu ngữ nghĩa, nhưng có chi phí
- **Hybrid**: Tốt nhất - kết hợp cả hai

**Khuyến nghị**: 
- Dùng AI cho sản phẩm mới/chưa rõ ràng
- Dùng rule-based cho sản phẩm có keyword rõ ràng
- Cache kết quả để tối ưu chi phí
