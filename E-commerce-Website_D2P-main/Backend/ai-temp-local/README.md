# AI Local Temperature Classifier

Hệ thống AI local để phân loại nhiệt độ sản phẩm, hoàn toàn tách biệt khỏi database.

## 🏗️ Kiến Trúc

```
ai-temp-local/
├── api.py           # FastAPI service (collect, predict, reload-model)
├── train.py         # Script train model từ dataset
├── dataset.jsonl    # File lưu mẫu học (tự động tạo)
├── model.joblib     # Model đã train (tự động tạo sau khi train)
├── requirements.txt # Python dependencies
└── README.md        # File này
```

## 🚀 Cài Đặt & Sử Dụng

### 1. Cài đặt Python dependencies (chỉ lần đầu)

```bash
cd ai-temp-local
pip install -r requirements.txt
```

### 2. Chạy AI Service

**Windows**: Double-click `1-start-ai-service.bat`

Hoặc chạy thủ công:
```bash
uvicorn api:app --host 127.0.0.1 --port 9009
```

Service sẽ chạy tại: `http://127.0.0.1:9009`

### 3. Bootstrap Dữ Liệu & Train Model (Lần Đầu Tiên)

**Windows**: Double-click `2-bootstrap-and-train.bat`

Script này sẽ:
1. Thu thập dữ liệu từ Laravel API
2. Train model
3. Reload model trong AI Service

**Lưu ý**: Cần chạy AI Service và Laravel API trước!

## 📡 API Endpoints

### 1. GET `/` - Health check
```bash
curl http://127.0.0.1:9009/
```

### 2. GET `/stats` - Thống kê dataset
```bash
curl http://127.0.0.1:9009/stats
```

### 3. POST `/collect` - Thu thập mẫu
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

### 4. POST `/predict` - Dự đoán nhiệt độ
```bash
curl -X POST http://127.0.0.1:9009/predict \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": 1, "name": "Cà phê đặc biệt", "categoryName": "Cà phê"},
      {"id": 2, "name": "Trà xanh đá", "categoryName": "Trà"}
    ]
  }'
```

### 5. POST `/reload-model` - Reload model sau khi train
```bash
curl -X POST http://127.0.0.1:9009/reload-model
```

## 🎓 Train Model

### Bước 1: Bootstrap Dữ Liệu Ban Đầu (Lần Đầu Tiên)

Nếu dataset trống (0 mẫu), bạn cần thu thập dữ liệu ban đầu:

```bash
# Đảm bảo AI Service đang chạy
uvicorn api:app --host 127.0.0.1 --port 9009

# Đảm bảo Laravel API đang chạy
php artisan serve

# Chạy script bootstrap (Windows)
bootstrap-data.bat

# Hoặc chạy trực tiếp (Linux/Mac)
python bootstrap-data.py
```

Script này sẽ:
- Lấy tất cả sản phẩm từ Laravel API
- Phân loại bằng rule-based
- Gửi các mẫu có confidence >= 0.8 vào `/collect`

### Bước 2: Train Model

```bash
python train.py
```

### Bước 3: Reload Model

```bash
curl -X POST http://127.0.0.1:9009/reload-model
```

Hoặc dùng batch file:
```bash
train-model.bat
```

**Lưu ý**: Cần tối thiểu 10 mẫu có nhãn (HOT/COLD) để train.

## 📊 Dataset Format (JSONL)

Mỗi dòng là một JSON:

```json
{"text":"ca phe sua | ca phe","label":"HOT","source":"RULE","confidence":0.9,"ts":"2026-01-07T10:00:00+07:00"}
{"text":"tra xanh da | tra","label":"COLD","source":"RULE","confidence":0.95,"ts":"2026-01-07T10:01:00+07:00"}
{"text":"ca phe dac biet | ca phe","label":null,"source":"UNKNOWN","confidence":0.5,"ts":"2026-01-07T10:02:00+07:00"}
```

- `text`: Text đã chuẩn hóa (name | categoryName)
- `label`: `HOT`, `COLD`, hoặc `null` (chưa có nhãn)
- `source`: Nguồn nhãn (`RULE`, `AI`, `UNKNOWN`)
- `confidence`: Độ tin cậy (0.0-1.0)
- `ts`: Timestamp

## 🔄 Workflow

1. **Laravel Rule-Based** phân loại sản phẩm
   - Nếu có keyword rõ → gán nhãn HOT/COLD → gửi `/collect` với label
   - Nếu không rõ → gửi `/collect` với `label=null`

2. **AI Service** thu thập mẫu vào `dataset.jsonl`

3. **Định kỳ train** (cron/scheduler):
   ```bash
   python train.py
   curl -X POST http://127.0.0.1:9009/reload-model
   ```

4. **Laravel gọi `/predict`** cho sản phẩm không rõ ràng

## ⚙️ Tích Hợp với Laravel

Xem file: `app/Services/LocalAITemperatureClassifier.php`

## 📝 Lưu ý

- Model cần tối thiểu 10 mẫu có nhãn để train
- Dataset tự động append, không ghi đè
- Model được cache trong memory, reload khi cần
- Không cần database, tất cả lưu trong file
