# AI Service - Modular AI Services

AI Service module độc lập cho **Temperature Classification** và **Face Recognition**, có thể tái sử dụng trong nhiều ứng dụng khác nhau.

## 📁 Cấu Trúc

```
ai-service/
├── ai_service/              # Core AI modules
│   ├── face_recognition/   # Face recognition module
│   │   ├── v2_arcface.py   # ArcFace V2 implementation
│   │   └── __init__.py
│   ├── temperature/        # Temperature classification module
│   │   ├── classifier.py   # Temperature classifier
│   │   └── __init__.py
│   └── utils/              # Utility functions
│       ├── image_utils.py  # Image processing utilities
│       └── __init__.py
├── api/                    # FastAPI application
│   ├── routers/           # API routers
│   │   ├── face.py        # Face recognition endpoints
│   │   └── temperature.py # Temperature endpoints
│   ├── models.py          # Pydantic models
│   └── __init__.py
├── main.py                # FastAPI app entry point
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## 🚀 Cài Đặt

### 1. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 2. Chạy service

```bash
python main.py
```

Hoặc với uvicorn:

```bash
uvicorn main:app --host 127.0.0.1 --port 9009 --reload
```

Service sẽ chạy tại: `http://127.0.0.1:9009`

## 📡 API Endpoints

### Temperature Classification

- `GET /temperature/` - Service status
- `GET /temperature/stats` - Dataset statistics
- `POST /temperature/collect` - Collect training sample
- `POST /temperature/predict` - Predict temperature
- `POST /temperature/reload-model` - Reload ML model

### Face Recognition

- `GET /face/status` - Service status
- `GET /face/v2/status` - V2 service status
- `POST /face/v2/cache-customers` - Cache customer embeddings
- `POST /face/v2/recognize` - Recognize face

## 💻 Sử Dụng Module Trong Code Khác

### Temperature Classifier

```python
from ai_service.temperature import TemperatureClassifier
from pathlib import Path

# Initialize
classifier = TemperatureClassifier(
    dataset_path=Path("dataset.jsonl"),
    model_path=Path("model.joblib")
)

# Predict
result = classifier.predict("Cà phê đá", "Đồ uống")
print(result)
# {'temperature': 'COLD', 'confidence': 0.95, 'source': 'RULE', 'reason': 'Keyword lạnh'}

# Collect sample
classifier.collect_sample(
    name="Trà xanh đá",
    category_name="Đồ uống",
    label="COLD",
    source="MANUAL",
    confidence=1.0
)
```

### Face Recognition

```python
from ai_service.face_recognition import (
    init_arcface_v2_system,
    extract_arcface_v2_embedding_from_camera,
    cache_customers_v2_embeddings
)

# Initialize
init_arcface_v2_system()

# Extract embedding from image
embedding, face_info = extract_arcface_v2_embedding_from_camera("path/to/image.jpg")

# Cache customers
customers_data = [
    {
        "id": 1,
        "name": "John Doe",
        "avatar_path": "path/to/avatar.jpg"
    }
]
cache_customers_v2_embeddings(customers_data)
```

## 🔧 Cấu Hình

### Environment Variables (Optional)

Có thể cấu hình qua environment variables hoặc sửa trực tiếp trong code:

- `DATASET_PATH`: Đường dẫn đến dataset.jsonl (mặc định: `dataset.jsonl`)
- `MODEL_PATH`: Đường dẫn đến model.joblib (mặc định: `model.joblib`)
- `PUBLIC_PATH`: Đường dẫn đến thư mục public (cho Laravel projects)

## 📦 Tích Hợp Vào Ứng Dụng Khác

### 1. Copy thư mục `ai-service` vào project của bạn

### 2. Install dependencies

```bash
cd ai-service
pip install -r requirements.txt
```

### 3. Import và sử dụng

```python
# Sử dụng như module
from ai_service.temperature import TemperatureClassifier
from ai_service.face_recognition import init_arcface_v2_system

# Hoặc chạy như service độc lập
python main.py
```

### 4. Tích hợp FastAPI vào app hiện có

```python
from fastapi import FastAPI
from api.routers import temperature, face

app = FastAPI()
app.include_router(temperature.router)
app.include_router(face.router)
```

## 📝 Notes

- **Temperature Classifier**: Sử dụng rule-based + ML model hybrid approach
- **Face Recognition**: Sử dụng ArcFace V2 (InsightFace) với FAISS cho similarity search
- **Dataset**: Tự động lưu vào `dataset.jsonl` khi collect samples
- **Model**: Tự động load từ `model.joblib` nếu có

## 🐛 Troubleshooting

### Face Recognition không khởi tạo được

- Kiểm tra đã cài đặt `insightface` và `onnxruntime-gpu` (hoặc `onnxruntime`)
- Kiểm tra model `buffalo_l` đã được download (tự động download lần đầu)

### Temperature Model không load được

- Kiểm tra file `model.joblib` có tồn tại
- Chạy training script để tạo model từ dataset

## 📄 License

Tùy theo license của project chính.
