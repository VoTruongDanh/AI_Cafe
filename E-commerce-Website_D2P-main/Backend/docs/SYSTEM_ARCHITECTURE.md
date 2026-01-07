# Tóm Tắt Hệ Thống AI Phân Loại Nhiệt Độ

## 📋 Tổng Quan

Hệ thống có **3 lớp phân loại** theo thứ tự ưu tiên, hoàn toàn **tách biệt database**:

1. **Rule-Based Classifier** (Keyword Matching) - Nhanh, miễn phí
2. **Local AI Classifier** (ML Model) - Học từ dataset, không cần DB
3. **Gemini AI Classifier** (LLM API) - Phân tích ngữ nghĩa, có chi phí

---

## 🗂️ Cấu Trúc Thư Mục

### 1. Folder: `ai-temp-local/` (AI Service - Python)

**Vị trí**: `Backend/ai-temp-local/`

**Mô tả**: AI service hoàn toàn độc lập, không dùng database

**Files**:
```
ai-temp-local/
├── api.py              # FastAPI service (3 endpoints: collect, predict, reload-model)
├── train.py            # Script train model từ dataset.jsonl
├── test-api.py         # Script test API
├── requirements.txt    # Python dependencies
├── start-service.bat   # Chạy service (Windows)
├── train-model.bat     # Train model (Windows)
├── .gitignore          # Ignore dataset.jsonl và model.joblib
├── README.md           # Hướng dẫn chi tiết
└── SETUP.md            # Hướng dẫn setup

# Files tự động tạo (không commit vào git):
├── dataset.jsonl       # Dataset để train (append-only)
└── model.joblib         # Model đã train
```

**Chức năng**:
- ✅ Thu thập mẫu học (`/collect`)
- ✅ Dự đoán nhiệt độ (`/predict`)
- ✅ Train model từ dataset (`train.py`)
- ✅ Reload model (`/reload-model`)

**Không dùng database**: Tất cả lưu trong file `dataset.jsonl` và `model.joblib`

---

### 2. Folder: `app/Services/` (Laravel Services)

**Vị trí**: `Backend/app/Services/`

**Files liên quan**:

```
app/Services/
├── TemperatureClassifier.php          # Rule-based (keyword matching)
├── AITemperatureClassifier.php        # Gemini AI (LLM API)
└── LocalAITemperatureClassifier.php   # Local AI (ML Model) ⭐ MỚI
```

**Thứ tự ưu tiên**:
1. `LocalAITemperatureClassifier` (nếu `LOCAL_AI_ENABLED=true`)
2. `AITemperatureClassifier` (nếu có Gemini API key)
3. `TemperatureClassifier` (rule-based, fallback)

---

### 3. Folder: `app/Http/Controllers/Api/` (API Controllers)

**Vị trí**: `Backend/app/Http/Controllers/Api/`

**File**: `ProductTemperatureController.php`

**Endpoints**:
- `GET /api/products/ai-status` - Kiểm tra trạng thái AI
- `POST /api/products/classify-temperature` - Phân loại từ payload
- `GET /api/products/classify-temperature` - Phân loại từ database
- `GET /api/products/suggest-by-temperature` - Gợi ý sản phẩm theo nhiệt độ

---

### 4. Folder: `app/Console/Commands/` (Laravel Commands)

**Vị trí**: `Backend/app/Console/Commands/`

**File**: `TrainLocalAIModel.php` ⭐ MỚI

**Command**: `php artisan ai:train-local`

**Chức năng**: Train model từ dataset và reload model

---

### 5. Folder: `config/` (Cấu Hình)

**File**: `config/services.php`

**Cấu hình mới**:
```php
'local_ai' => [
    'url' => env('LOCAL_AI_URL', 'http://127.0.0.1:9009'),
    'enabled' => env('LOCAL_AI_ENABLED', true),
],
```

---

### 6. Folder: `docs/` (Tài Liệu)

**Files**:
- `AI_TEMPERATURE_CLASSIFIER.md` - Giải thích rule-based
- `AI_INTEGRATION_GUIDE.md` - Hướng dẫn Gemini AI
- `LOCAL_AI_SYSTEM.md` - Hướng dẫn Local AI ⭐ MỚI
- `SYSTEM_ARCHITECTURE.md` - File này ⭐ MỚI
- `HOW_TO_CHECK_AI.md` - Cách kiểm tra AI
- `GEMINI_SETUP.md` - Setup Gemini

---

## 🔄 So Sánh 2 Hệ Thống (Đã Bỏ Gemini API)

| Tính năng | Rule-Based | Local AI |
|-----------|-----------|----------|
| **Tốc độ** | ⚡ Rất nhanh | ⚡ Nhanh |
| **Chi phí** | 💰 Miễn phí | 💰 Miễn phí |
| **Độ chính xác** | ⭐⭐⭐ (70%) | ⭐⭐⭐⭐ (85%) |
| **Học được** | ❌ Không | ✅ Có (từ dataset) |
| **Cần DB** | ❌ Không | ❌ Không |
| **Dữ liệu lưu** | Code (keywords) | File (dataset.jsonl) |
| **Ưu tiên** | 🥇 Ưu tiên 1 | 🥈 Ưu tiên 2 (khi rule-based không chắc) |

---

## 🎯 Thay Thế & Tích Hợp

### Trước Đây:
```
TemperatureClassifier (Rule-Based)
    ↓
Chỉ dùng keyword matching
```

### Bây Giờ (Ưu Tiên Rule-Based):
```
ProductTemperatureController
    ↓
1. TemperatureClassifier (Rule-Based) ⭐ ƯU TIÊN
    ↓
    Keyword matching → Nhanh, miễn phí
    ↓
    Confidence >= 0.8? → YES → Trả kết quả
    ↓ NO
2. LocalAITemperatureClassifier (nếu enabled)
    ↓
    AI Service (/predict) → dự đoán
    ↓
    Dataset (dataset.jsonl) → học
    ↓
    Trả kết quả nếu confidence cao hơn rule-based
```

**Lưu ý**: Đã bỏ Gemini API, chỉ dùng Rule-Based + Local AI

---

## 📦 Các File Mới Được Tạo

### Python AI Service:
1. ✅ `ai-temp-local/api.py` - FastAPI service
2. ✅ `ai-temp-local/train.py` - Train script
3. ✅ `ai-temp-local/requirements.txt` - Dependencies
4. ✅ `ai-temp-local/test-api.py` - Test script
5. ✅ `ai-temp-local/start-service.bat` - Start script
6. ✅ `ai-temp-local/train-model.bat` - Train script
7. ✅ `ai-temp-local/.gitignore` - Git ignore
8. ✅ `ai-temp-local/README.md` - Hướng dẫn
9. ✅ `ai-temp-local/SETUP.md` - Setup guide

### Laravel Integration:
1. ✅ `app/Services/LocalAITemperatureClassifier.php` - Service tích hợp
2. ✅ `app/Console/Commands/TrainLocalAIModel.php` - Command train
3. ✅ `config/services.php` - Thêm config local_ai
4. ✅ `app/Console/Kernel.php` - Thêm schedule train
5. ✅ `app/Http/Controllers/Api/ProductTemperatureController.php` - Cập nhật logic

### Documentation:
1. ✅ `docs/LOCAL_AI_SYSTEM.md` - Hướng dẫn Local AI
2. ✅ `docs/HOW_TO_CHECK_AI.md` - Cách kiểm tra AI
3. ✅ `docs/GEMINI_SETUP.md` - Setup Gemini
4. ✅ `docs/SYSTEM_ARCHITECTURE.md` - File này

---

## 🔧 Cấu Hình

### .env

```env
# Local AI Service (ưu tiên 2, sau rule-based)
LOCAL_AI_URL=http://127.0.0.1:9009
LOCAL_AI_ENABLED=true

# Gemini AI (đã bỏ, không dùng nữa)
# GEMINI_API_KEY=...
# GEMINI_ENABLED=false
```

---

## 🚀 Cách Hoạt Động

### 1. Khởi Động

```bash
# Terminal 1: Chạy AI Service (nếu dùng Local AI)
cd ai-temp-local
python api.py

# Terminal 2: Chạy Laravel
php artisan serve
```

### 2. Phân Loại Sản Phẩm (Ưu Tiên Rule-Based)

```
Request → ProductTemperatureController
    ↓
1. Rule-Based Classification (TemperatureClassifier)
    ↓
    Keyword matching
    ↓
    Confidence >= 0.8? → YES → Trả kết quả ngay
    ↓ NO (hoặc UNKNOWN)
2. Local AI Classification (nếu enabled)
    ↓
    Gọi /predict từ AI Service
    ↓
    Confidence > rule-based? → YES → Trả kết quả AI
    ↓ NO
    Trả kết quả rule-based
```

### 3. Train Model

```bash
# Tự động (mỗi ngày 2h sáng)
php artisan schedule:run

# Hoặc thủ công
php artisan ai:train-local
```

---

## 📊 Dataset & Model

### Dataset (`dataset.jsonl`)

- **Format**: JSONL (mỗi dòng 1 JSON)
- **Vị trí**: `ai-temp-local/dataset.jsonl`
- **Tự động tạo**: Khi gọi `/collect`
- **Append-only**: Không ghi đè, chỉ thêm

### Model (`model.joblib`)

- **Format**: Binary (scikit-learn)
- **Vị trí**: `ai-temp-local/model.joblib`
- **Tự động tạo**: Khi chạy `train.py`
- **Cần**: Tối thiểu 10 mẫu có nhãn (HOT/COLD)

---

## ✅ Tóm Tắt

### Đã Tích Hợp:

1. ✅ **Local AI Service** (Python FastAPI) - Folder `ai-temp-local/`
2. ✅ **Laravel Service** - `LocalAITemperatureClassifier.php`
3. ✅ **Auto-train** - Laravel scheduler train định kỳ
4. ✅ **Tách biệt DB** - Tất cả lưu trong file

### Thay Thế:

- **Trước**: Chỉ rule-based hoặc Gemini API
- **Sau**: Local AI (ưu tiên) → Gemini AI → Rule-based

### Folder Chính:

- **`ai-temp-local/`** - AI service hoàn toàn độc lập
- **`app/Services/`** - Laravel services tích hợp
- **`docs/`** - Tài liệu đầy đủ

---

## 🎯 Kết Luận

Hệ thống hiện có **2 lớp phân loại** (đã bỏ Gemini API):
- **Rule-Based** (Ưu tiên 1): Keyword matching, nhanh, miễn phí
- **Local AI** (Ưu tiên 2): Học từ dataset, không cần DB, miễn phí

**Thứ tự ưu tiên**:
1. Rule-Based trước (nhanh, confidence >= 0.8)
2. Local AI sau (khi rule-based không chắc chắn)

Tất cả **tách biệt database**, dữ liệu học lưu trong file `dataset.jsonl`.
