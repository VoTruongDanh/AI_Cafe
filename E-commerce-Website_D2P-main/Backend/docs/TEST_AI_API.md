# API Test AI Với Món Không Rõ Ràng

## 🎯 Mục Đích

Test để xem AI có hoạt động không bằng cách sử dụng các sản phẩm **không có keyword rõ ràng** (không có "đá", "nóng", "lạnh"...).

---

## 📡 API Endpoints

### 1. Phân Loại Từ Payload (POST)

**URL:** `http://localhost:8000/api/products/classify-temperature`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (Sản phẩm không rõ ràng):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Món đặc biệt của quán",
      "category": {
        "name": "Đồ uống"
      }
    },
    {
      "id": 2,
      "name": "Bánh ngọt thơm ngon",
      "category": {
        "name": "Bánh ngọt"
      }
    },
    {
      "id": 3,
      "name": "Đồ uống giải khát",
      "category": {
        "name": "Đồ uống"
      }
    }
  ]
}
```

**Response Mong Đợi (AI Hoạt Động):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Món đặc biệt của quán",
      "categoryName": "Đồ uống",
      "temperature": "HOT",
      "confidence": 0.75,
      "source": "LOCAL_AI",
      "reason": "Phân loại bởi Local AI Model"
    },
    {
      "id": 2,
      "name": "Bánh ngọt thơm ngon",
      "categoryName": "Bánh ngọt",
      "temperature": "UNKNOWN",
      "confidence": 0.50,
      "source": "RULE",
      "reason": "Không đủ dấu hiệu để phân loại nhiệt độ"
    }
  ],
  "total": 2
}
```

**Kiểm Tra:**
- ✅ `"source": "LOCAL_AI"` → AI đã hoạt động!
- ⚠️ `"source": "RULE"` → Chỉ dùng rule-based
- ⚠️ `"source": "NO_MODEL"` → Chưa có model (cần train)

---

### 2. Phân Loại Từ Database (GET)

**URL:** `http://localhost:8000/api/products/classify-temperature?limit=10`

**Method:** `GET`

**Query Parameters:**
- `limit`: Số lượng sản phẩm (mặc định: 10)
- `category_id`: Lọc theo danh mục (tùy chọn)
- `search`: Tìm kiếm (tùy chọn)

**Ví Dụ:**
```
http://localhost:8000/api/products/classify-temperature?limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Cà phê đặc biệt",
      "categoryName": "Cà phê",
      "temperature": "HOT",
      "confidence": 0.85,
      "source": "LOCAL_AI",
      "reason": "Phân loại bởi Local AI Model"
    }
  ],
  "total": 1
}
```

---

### 3. Gợi Ý Theo Nhiệt Độ (GET)

**URL:** `http://localhost:8000/api/products/suggest-by-temperature`

**Method:** `GET`

**Query Parameters:**
- `temperature`: `HOT` hoặc `COLD` (bắt buộc)
- `limit`: Số lượng sản phẩm (mặc định: 10)
- `min_confidence`: Độ tin cậy tối thiểu (mặc định: 0.6)
- `category_id`: Lọc theo danh mục (tùy chọn)

**Ví Dụ:**
```
http://localhost:8000/api/products/suggest-by-temperature?temperature=HOT&limit=5&min_confidence=0.5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Cà phê đen nóng",
      "temperature": "HOT",
      "confidence": 0.9,
      "source": "RULE",
      "reason": "Tìm thấy keyword nóng trong tên/danh mục"
    },
    {
      "id": 10,
      "name": "Món đặc biệt",
      "temperature": "HOT",
      "confidence": 0.75,
      "source": "LOCAL_AI",
      "reason": "Phân loại bởi Local AI Model"
    }
  ],
  "total": 2
}
```

---

## 🧪 Test Cases

### Test Case 1: Sản Phẩm Hoàn Toàn Mơ Hồ

**Request:**
```json
POST http://localhost:8000/api/products/classify-temperature
Content-Type: application/json

{
  "data": [
    {
      "id": 1,
      "name": "Món đặc biệt",
      "category": {"name": "Đồ uống"}
    }
  ]
}
```

**Kết Quả Mong Đợi:**
- Rule-Based: `"source": "UNKNOWN"` hoặc confidence < 0.8
- Local AI: `"source": "LOCAL_AI"` (nếu có model)
- Final: `"source": "LOCAL_AI"` → ✅ AI hoạt động!

---

### Test Case 2: Sản Phẩm Có Từ Mơ Hồ

**Request:**
```json
{
  "data": [
    {
      "id": 2,
      "name": "Bánh thơm ngon",
      "category": {"name": "Bánh ngọt"}
    }
  ]
}
```

**Kết Quả:**
- Rule-Based: Không tìm thấy keyword rõ ràng
- Local AI: Phân tích và trả về kết quả
- Final: `"source": "LOCAL_AI"` → ✅ AI hoạt động!

---

### Test Case 3: Sản Phẩm Có Keyword Rõ Ràng (Để So Sánh)

**Request:**
```json
{
  "data": [
    {
      "id": 3,
      "name": "Cà phê đen đá",
      "category": {"name": "Cà phê"}
    }
  ]
}
```

**Kết Quả:**
- Rule-Based: Tìm thấy keyword "đá" → Confidence: 0.95
- Local AI: Không được gọi (vì rule-based đã chắc chắn)
- Final: `"source": "RULE"` → Đúng logic (không cần AI)

---

## 🔧 Cách Test Bằng Công Cụ

### 1. Dùng Trình Duyệt (Chỉ GET)

```
http://localhost:8000/api/products/classify-temperature?limit=5
```

### 2. Dùng PowerShell (POST)

```powershell
$body = @{
    data = @(
        @{
            id = 1
            name = "Món đặc biệt của quán"
            category = @{
                name = "Đồ uống"
            }
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-WebRequest `
    -Uri "http://localhost:8000/api/products/classify-temperature" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    | Select-Object -ExpandProperty Content
```

### 3. Dùng curl (Nếu Có)

```bash
curl -X POST http://localhost:8000/api/products/classify-temperature \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {
        "id": 1,
        "name": "Món đặc biệt",
        "category": {"name": "Đồ uống"}
      }
    ]
  }'
```

### 4. Dùng Postman/Insomnia

1. **Method:** `POST`
2. **URL:** `http://localhost:8000/api/products/classify-temperature`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "data": [
       {
         "id": 1,
         "name": "Món đặc biệt của quán",
         "category": {"name": "Đồ uống"}
       }
     ]
   }
   ```

---

## 📊 Kiểm Tra Kết Quả

### ✅ AI Hoạt Động Khi:

```json
{
  "source": "LOCAL_AI",
  "confidence": 0.75,
  "reason": "Phân loại bởi Local AI Model"
}
```

### ⚠️ AI Chưa Hoạt Động Khi:

```json
{
  "source": "RULE",
  "confidence": 0.95,
  "reason": "Tìm thấy keyword..."
}
```
→ Đúng logic (rule-based đã đủ tốt)

```json
{
  "source": "NO_MODEL",
  "confidence": 0.0,
  "reason": "..."
}
```
→ Chưa có model (cần train)

---

## 🎯 Danh Sách Sản Phẩm Test

### Sản Phẩm Mơ Hồ (Để Test AI):

1. **"Món đặc biệt của quán"** - Không có keyword
2. **"Bánh ngọt thơm ngon"** - Không có keyword
3. **"Đồ uống giải khát"** - Không có keyword
4. **"Cà phê đặc biệt"** - Không có "đá"/"nóng"
5. **"Trà thơm"** - Không có keyword
6. **"Bánh kem"** - Không có keyword
7. **"Nước ép"** - Không có "đá"/"lạnh" (nhưng có thể suy luận)

### Sản Phẩm Rõ Ràng (Để So Sánh):

1. **"Cà phê đen đá"** - Có keyword "đá" → Rule-Based
2. **"Trà nóng"** - Có keyword "nóng" → Rule-Based
3. **"Sinh tố dâu"** - Có keyword "sinh tố" → Rule-Based

---

## 🔍 Debug Tips

### Nếu Luôn Thấy `"source": "RULE"`:

1. **Kiểm tra model có tồn tại:**
   ```bash
   ls ai-temp-local/model.joblib
   ```

2. **Kiểm tra Local AI Service:**
   ```
   http://127.0.0.1:9009/docs
   ```

3. **Test trực tiếp Local AI:**
   ```powershell
   $body = @{
       items = @(
           @{
               name = "Món đặc biệt"
               categoryName = "Đồ uống"
           }
       )
   } | ConvertTo-Json -Depth 10

   Invoke-WebRequest `
       -Uri "http://127.0.0.1:9009/predict" `
       -Method POST `
       -Body $body `
       -ContentType "application/json" `
       | Select-Object -ExpandProperty Content
   ```

---

## ✅ Checklist

- [ ] Local AI Service đang chạy (`http://127.0.0.1:9009/docs`)
- [ ] Có file `model.joblib` (nếu không → chạy `2-bootstrap-and-train.bat`)
- [ ] Test với sản phẩm không có keyword
- [ ] Kiểm tra `source` trong response
- [ ] Nếu `source: "LOCAL_AI"` → ✅ AI hoạt động!

---

## 📝 Tóm Tắt

**Đường dẫn API chính:**
- `POST /api/products/classify-temperature` - Phân loại từ payload
- `GET /api/products/classify-temperature` - Phân loại từ database
- `GET /api/products/suggest-by-temperature` - Gợi ý theo nhiệt độ

**Cách test:**
1. Dùng sản phẩm **không có keyword rõ ràng**
2. Kiểm tra field `source` trong response
3. Nếu `"source": "LOCAL_AI"` → ✅ AI đã hoạt động!
