# Quick Start Guide

## 🚀 Chạy Service Nhanh

### 1. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 2. Chạy service

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Hoặc trực tiếp:**
```bash
python main.py
```

Service sẽ chạy tại: `http://127.0.0.1:9009`

## 📡 Test API

### Temperature Classification

```bash
# Predict temperature
curl -X POST "http://127.0.0.1:9009/temperature/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": 1, "name": "Cà phê đá", "categoryName": "Đồ uống"}
    ]
  }'

# Get stats
curl "http://127.0.0.1:9009/temperature/stats"
```

### Face Recognition

```bash
# Check status
curl "http://127.0.0.1:9009/face/v2/status"

# Recognize face (cần base64 image)
curl -X POST "http://127.0.0.1:9009/face/v2/recognize" \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "data:image/jpeg;base64,..."
  }'
```

## 💻 Sử Dụng Như Module

### Import trong code Python

```python
# Temperature Classification
from ai_service.temperature import TemperatureClassifier
from pathlib import Path

classifier = TemperatureClassifier()
result = classifier.predict("Cà phê đá", "Đồ uống")
print(result)

# Face Recognition
from ai_service.face_recognition import init_arcface_v2_system

init_arcface_v2_system()
```

## 📦 Tích Hợp Vào Project Khác

1. Copy thư mục `ai-service` vào project của bạn
2. Install dependencies: `pip install -r requirements.txt`
3. Import và sử dụng như module hoặc chạy như service độc lập

## 🔧 Cấu Hình

- **Port**: Mặc định `9009`, có thể sửa trong `main.py`
- **Dataset path**: Mặc định `dataset.jsonl` trong thư mục hiện tại
- **Model path**: Mặc định `model.joblib` trong thư mục hiện tại

## 📚 Xem Thêm

- `README.md` - Tài liệu chi tiết
- `example_usage.py` - Ví dụ sử dụng module
