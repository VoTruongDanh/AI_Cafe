# Hệ Thống AI Local - Hoàn Toàn Tách Biệt Database

## 🎯 Tổng Quan

Hệ thống AI local để phân loại nhiệt độ sản phẩm, **hoàn toàn không dùng database**. Tất cả dữ liệu học và model được lưu trong file.

## 📁 Cấu Trúc

```
Backend/
├── ai-temp-local/          # AI Service (Python)
│   ├── api.py              # FastAPI service
│   ├── train.py             # Script train model
│   ├── dataset.jsonl        # Dataset (tự động tạo)
│   ├── model.joblib         # Model đã train (tự động tạo)
│   ├── requirements.txt    # Python dependencies
│   ├── start-service.bat   # Script chạy service (Windows)
│   ├── train-model.bat      # Script train model (Windows)
│   └── README.md            # Hướng dẫn chi tiết
│
└── app/Services/
    └── LocalAITemperatureClassifier.php  # Laravel service gọi AI local
```

## 🔄 Workflow

### 1. Phân Loại Sản Phẩm

```
Laravel Request
    ↓
Rule-Based Classifier (nhanh)
    ↓
Có keyword rõ? → YES → Gửi /collect với label HOT/COLD
    ↓ NO
Gửi /collect với label=null
    ↓
Gọi /predict để AI dự đoán
    ↓
Trả kết quả
```

### 2. Thu Thập Dữ Liệu

- **Rule-based** tạo nhãn tự động:
  - "đá/ice" → COLD
  - "nóng/hot" → HOT
- Gửi đến `/collect` → lưu vào `dataset.jsonl`

### 3. Train Model

- Định kỳ chạy `train.py` từ `dataset.jsonl`
- Tạo `model.joblib`
- Reload model: `POST /reload-model`

## 🚀 Cài Đặt

### Bước 1: Cài Python Dependencies

```bash
cd ai-temp-local
pip install -r requirements.txt
```

### Bước 2: Chạy AI Service

```bash
# Windows
start-service.bat

# Hoặc
python api.py
```

Service chạy tại: `http://127.0.0.1:9009`

### Bước 3: Cấu Hình Laravel

Thêm vào `.env`:

```env
LOCAL_AI_URL=http://127.0.0.1:9009
LOCAL_AI_ENABLED=true
```

Clear config:
```bash
php artisan config:clear
```

## 🎓 Train Model

### Lần Đầu (Cần ít nhất 10 mẫu có nhãn)

```bash
# Windows
train-model.bat

# Linux/Mac
python train.py
curl -X POST http://127.0.0.1:9009/reload-model
```

### Từ Laravel

```bash
php artisan ai:train-local
```

### Định Kỳ (Tự Động)

Laravel scheduler sẽ train mỗi ngày lúc 2h sáng (nếu bật).

## 📊 Dataset Format (JSONL)

Mỗi dòng là một JSON:

```json
{"text":"ca phe sua | ca phe","label":"HOT","source":"RULE","confidence":0.9,"ts":"2026-01-07T10:00:00+07:00"}
{"text":"tra xanh da | tra","label":"COLD","source":"RULE","confidence":0.95,"ts":"2026-01-07T10:01:00+07:00"}
{"text":"ca phe dac biet | ca phe","label":null,"source":"UNKNOWN","confidence":0.5,"ts":"2026-01-07T10:02:00+07:00"}
```

- `text`: Text đã chuẩn hóa
- `label`: `HOT`, `COLD`, hoặc `null`
- `source`: Nguồn nhãn
- `confidence`: Độ tin cậy
- `ts`: Timestamp

## 🔌 API Endpoints

### GET `/` - Health check
```bash
curl http://127.0.0.1:9009/
```

### GET `/stats` - Thống kê
```bash
curl http://127.0.0.1:9009/stats
```

### POST `/collect` - Thu thập mẫu
```bash
curl -X POST http://127.0.0.1:9009/collect \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cà phê đặc biệt",
    "categoryName": "Cà phê",
    "label": "HOT",
    "source": "RULE",
    "confidence": 0.9
  }'
```

### POST `/predict` - Dự đoán
```bash
curl -X POST http://127.0.0.1:9009/predict \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": 1, "name": "Cà phê đặc biệt", "categoryName": "Cà phê"}
    ]
  }'
```

### POST `/reload-model` - Reload model
```bash
curl -X POST http://127.0.0.1:9009/reload-model
```

## 🧪 Test

### Test Python Service

```bash
cd ai-temp-local
python test-api.py
```

### Test từ Laravel

```bash
GET http://localhost:8000/api/products/ai-status
```

Kiểm tra `classifier_type` có phải `LocalAITemperatureClassifier` không.

## ⚙️ Tích Hợp

Laravel tự động chọn classifier theo thứ tự:

1. **LocalAITemperatureClassifier** (nếu `LOCAL_AI_ENABLED=true`)
2. **AITemperatureClassifier** (nếu có Gemini API key)
3. **TemperatureClassifier** (rule-based, fallback)

## 📝 Lưu Ý

- ✅ **Không dùng database** - tất cả lưu trong file
- ✅ **Tự động học** - rule-based tạo nhãn tự động
- ✅ **Train định kỳ** - model tự cập nhật
- ✅ **Tách biệt hoàn toàn** - có thể chạy trên server riêng

## 🐛 Troubleshooting

### Service không chạy

```bash
# Kiểm tra port 9009 có bị chiếm không
netstat -an | findstr 9009

# Hoặc đổi port trong api.py
```

### Model không train được

- Cần tối thiểu 10 mẫu có nhãn (HOT/COLD)
- Kiểm tra `dataset.jsonl` có dữ liệu không
- Xem logs: `python train.py`

### Laravel không kết nối được

- Kiểm tra `LOCAL_AI_URL` trong `.env`
- Kiểm tra service có đang chạy không
- Test bằng curl trước
