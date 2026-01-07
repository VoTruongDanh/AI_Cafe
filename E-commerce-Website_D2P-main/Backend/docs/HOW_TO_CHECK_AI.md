# Cách Kiểm Tra AI Có Hoạt Động Không

## 🎯 Cách 1: Kiểm Tra Qua API Endpoint (Nhanh Nhất)

### Bước 1: Gọi API `/api/products/ai-status`

**URL**: `http://localhost:8000/api/products/ai-status`

**Cách 1: Dùng trình duyệt**
```
http://localhost:8000/api/products/ai-status
```

**Cách 2: Dùng curl (PowerShell)**
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/api/products/ai-status" | Select-Object -ExpandProperty Content
```

**Cách 3: Dùng Postman/Insomnia**
- Method: `GET`
- URL: `http://localhost:8000/api/products/ai-status`

### Bước 2: Kiểm Tra Response

Response sẽ có dạng:
```json
{
  "success": true,
  "ai_status": {
    "local_ai": {
      "enabled": true,
      "url": "http://127.0.0.1:9009"
    },
    "active_classifier_type": "Rule-Based + LocalAITemperatureClassifier (ML Model)",
    "priority_order": [
      "1. Rule-Based (TemperatureClassifier)",
      "2. Local AI (LocalAITemperatureClassifier) - chỉ khi rule-based không chắc chắn"
    ]
  },
  "test_result": {
    "product": {
      "name": "Cà phê đặc biệt của quán",
      "categoryName": "Cà phê"
    },
    "rule_based": {
      "temperature": "HOT",
      "confidence": 0.75,
      "source": "RULE",
      "reason": "Cà phê mặc định là nóng"
    },
    "local_ai": {
      "temperature": "HOT",
      "confidence": 0.85,
      "source": "LOCAL_AI",
      "reason": "Phân loại bởi Local AI Model"
    },
    "final_classification": {
      "temperature": "HOT",
      "confidence": 0.85,
      "source": "LOCAL_AI",
      "reason": "Phân loại bởi Local AI Model"
    }
  }
}
```

### Bước 3: Xác Định AI Có Hoạt Động

**Kiểm tra field `source` trong `final_classification`:**

- ✅ `"source": "LOCAL_AI"` → **Đang dùng Local AI Model** (AI hoạt động!)
- ✅ `"source": "RULE"` → Đang dùng Rule-Based (chưa cần AI vì rule-based đã chắc chắn)
- ⚠️ `"source": "NO_MODEL"` → Local AI chưa có model (cần train)
- ⚠️ `"source": "LOCAL_AI_ERROR"` → Lỗi khi gọi Local AI Service

---

## 🎯 Cách 2: Kiểm Tra Qua API Gợi Ý Sản Phẩm

### Gọi API: `/api/products/suggest-by-temperature`

**URL**: `http://localhost:8000/api/products/suggest-by-temperature?temperature=HOT&limit=5`

**Response mẫu:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Cà phê đen nóng",
      "temperature": "HOT",
      "confidence": 0.9,
      "source": "RULE",  // ← Kiểm tra field này
      "reason": "Tìm thấy keyword nóng trong tên/danh mục"
    },
    {
      "id": 4,
      "name": "Cà phê sữa nóng",
      "temperature": "HOT",
      "confidence": 0.9,
      "source": "RULE",  // ← Kiểm tra field này
      "reason": "Tìm thấy keyword nóng trong tên/danh mục"
    }
  ]
}
```

**Giải thích:**
- `"source": "RULE"` → Rule-based đã phân loại được (confidence >= 0.8), không cần AI
- `"source": "LOCAL_AI"` → AI đã được sử dụng để phân loại
- `"source": "UNKNOWN"` → Không phân loại được (cần AI nhưng chưa có model hoặc lỗi)

---

## 🎯 Cách 3: Kiểm Tra Trong Frontend (Trang /AI)

### Bước 1: Mở trang AI
```
http://localhost:5173/AI
```

### Bước 2: Mở Developer Tools (F12)
- Tab **Console**: Xem log
- Tab **Network**: Xem API calls

### Bước 3: Kiểm Tra Response
1. Nhập nhiệt độ (ví dụ: 35°C)
2. Xem request đến `/api/products/suggest-by-temperature`
3. Kiểm tra response, tìm field `source` trong mỗi sản phẩm

---

## 🎯 Cách 4: Kiểm Tra Local AI Service

### Bước 1: Kiểm Tra Service Có Chạy Không

**URL**: `http://127.0.0.1:9009/docs`

Nếu mở được Swagger UI → Service đang chạy ✅

### Bước 2: Test API Trực Tiếp

**Test `/predict` endpoint:**
```bash
# PowerShell
$body = @{
    items = @(
        @{
            name = "Cà phê đặc biệt"
            categoryName = "Cà phê"
        }
    )
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://127.0.0.1:9009/predict" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content
```

**Response mong đợi:**
```json
[
  {
    "temperature": "HOT",
    "confidence": 0.85,
    "source": "MODEL"
  }
]
```

Nếu `"source": "NO_MODEL"` → Chưa có model, cần train!

---

## 🎯 Cách 5: Kiểm Tra Logs

### Laravel Logs
```bash
# Windows PowerShell
Get-Content "storage\logs\laravel.log" -Tail 50
```

Tìm các dòng:
- `Local AI classification result` → AI đã được gọi
- `Local AI predict failed` → Lỗi khi gọi AI
- `Rule-based classification result` → Chỉ dùng rule-based

### Python AI Service Logs
Xem terminal đang chạy `1-start-ai-service.bat` để xem logs.

---

## 📊 Bảng Tóm Tắt

| Source | Ý Nghĩa | AI Hoạt Động? |
|--------|---------|---------------|
| `LOCAL_AI` | Đang dùng Local AI Model | ✅ **Có** |
| `RULE` | Đang dùng Rule-Based | ❌ Chưa (nhưng đúng logic) |
| `ATTRIBUTE` | Lấy từ attributes | ❌ Không cần |
| `NO_MODEL` | Chưa có model | ⚠️ Cần train |
| `LOCAL_AI_ERROR` | Lỗi khi gọi AI | ❌ Lỗi |
| `UNKNOWN` | Không phân loại được | ⚠️ Cần AI nhưng chưa có |

---

## 🔍 Kiểm Tra Nhanh (1 Phút)

### Checklist:

1. ✅ **Local AI Service đang chạy?**
   - Mở: `http://127.0.0.1:9009/docs`
   - Nếu không mở được → Chạy `1-start-ai-service.bat`

2. ✅ **Có model chưa?**
   - Kiểm tra file: `ai-temp-local/model.joblib`
   - Nếu không có → Chạy `2-bootstrap-and-train.bat`

3. ✅ **Config đúng chưa?**
   - Kiểm tra `.env`: `LOCAL_AI_ENABLED=true`
   - Chạy: `php artisan config:clear`

4. ✅ **Test API:**
   - Gọi: `http://localhost:8000/api/products/ai-status`
   - Kiểm tra `source` trong response

---

## 🐛 Troubleshooting

### Vấn Đề: Luôn thấy `"source": "RULE"`

**Nguyên nhân:**
- Rule-based đã phân loại được với confidence >= 0.8
- Đây là **hành vi đúng** (ưu tiên rule-based)

**Cách test AI:**
- Tìm sản phẩm không có keyword rõ ràng (ví dụ: "Cà phê đặc biệt")
- Hoặc sửa tạm threshold trong code để force dùng AI

### Vấn Đề: `"source": "NO_MODEL"`

**Giải pháp:**
```bash
cd ai-temp-local
python 2-bootstrap-and-train.bat
```

### Vấn Đề: `"source": "LOCAL_AI_ERROR"`

**Kiểm tra:**
1. Local AI Service có chạy không?
2. URL trong config đúng chưa?
3. Xem logs trong terminal của AI Service

---

## ✅ Kết Luận

**AI hoạt động khi:**
- `"source": "LOCAL_AI"` xuất hiện trong response
- Local AI Service đang chạy
- Có file `model.joblib`

**AI không hoạt động (nhưng đúng logic) khi:**
- `"source": "RULE"` → Rule-based đã đủ tốt, không cần AI
- Đây là **hành vi mong muốn** (tiết kiệm tài nguyên)
