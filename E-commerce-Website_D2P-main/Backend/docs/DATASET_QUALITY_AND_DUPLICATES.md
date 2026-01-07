# Vấn Đề Dữ Liệu Trùng Lặp và Ảnh Hưởng Đến Model

> 📌 **Tóm tắt nhanh**: Xem file [DATASET_DUPLICATES_SUMMARY.md](./DATASET_DUPLICATES_SUMMARY.md) để hiểu ngắn gọn.

## ⚠️ Vấn Đề

### Có ảnh hưởng không?

**CÓ, rất ảnh hưởng!** Dữ liệu trùng lặp với nhãn khác nhau sẽ làm model bị **confuse** và giảm độ chính xác.

### Ví dụ thực tế:

Trong `dataset.jsonl` hiện tại có:
```json
{"text": "espresso | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0}  ✅ ĐÚNG
{"text": "espresso | ca phe", "label": null, "source": "UNKNOWN", "confidence": 0.5}  ❌ RÁC (7 lần)
```

**Nếu có conflict nghiêm trọng hơn:**
```json
{"text": "espresso | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0}  ✅
{"text": "espresso | ca phe", "label": "COLD", "source": "RULE", "confidence": 0.75}  ❌ SAI
```

→ Model sẽ bị confuse: "espresso" là HOT hay COLD?

---

## 🔍 Ảnh Hưởng Cụ Thể

### 1. **Giảm độ chính xác (Accuracy)**

**Ví dụ:**
- 1 mẫu đúng: "espresso" → HOT
- 5 mẫu sai: "espresso" → COLD
- Model sẽ học: "espresso" có 83% là COLD (5/6) ❌

### 2. **Confusion trong training**

Logistic Regression sẽ cố gắng fit cả hai label cho cùng một text:
- Loss function tăng
- Model không hội tụ tốt
- Confidence thấp

### 3. **Training accuracy giảm**

Nếu có nhiều conflict:
- Training accuracy có thể giảm từ 97% → 70-80%
- Model không tự tin khi predict

### 4. **Overfitting hoặc Underfitting**

- **Overfitting**: Model học thuộc lòng các mẫu conflict
- **Underfitting**: Model không học được pattern rõ ràng

---

## 🛠️ Giải Pháp

### 1. **Script làm sạch dataset** (`clean-dataset.py`)

Script này sẽ:
- ✅ Xóa duplicate (giữ lại 1 mẫu tốt nhất)
- ✅ Xử lý conflict (chọn label theo priority)
- ✅ Backup dataset trước khi clean
- ✅ Thống kê chi tiết

**Cách sử dụng:**

```bash
# Xem thống kê trước (không ghi file)
python clean-dataset.py --dry-run

# Làm sạch thực sự
python clean-dataset.py
```

**Priority khi xử lý conflict:**
1. **MANUAL** (cao nhất) - Nhãn thủ công, chính xác nhất
2. **ATTRIBUTE** - Từ attributes của sản phẩm
3. **RULE** - Từ rule-based classifier
4. **LOCAL_AI / MODEL / AI** - Từ AI model
5. **UNKNOWN** (thấp nhất) - Không có nhãn

**Nếu cùng source:** Ưu tiên confidence cao hơn

### 2. **Cải thiện `train.py`**

`train.py` đã được cải thiện để:
- ✅ Tự động xử lý duplicate khi train
- ✅ Cảnh báo nếu phát hiện conflict
- ✅ Chọn mẫu tốt nhất cho mỗi text

**Cách hoạt động:**
1. Nhóm tất cả rows theo `text`
2. Nếu có duplicate → chọn row tốt nhất (theo priority)
3. Cảnh báo nếu có conflict
4. Train với dữ liệu đã clean

---

## 📊 Ví Dụ Thực Tế

### Trước khi clean:

```jsonl
{"text": "espresso | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0}
{"text": "espresso | ca phe", "label": null, "source": "UNKNOWN", "confidence": 0.5}
{"text": "espresso | ca phe", "label": null, "source": "UNKNOWN", "confidence": 0.5}
{"text": "espresso | ca phe", "label": null, "source": "UNKNOWN", "confidence": 0.5}
... (7 dòng duplicate)
```

**Kết quả:**
- Tổng: 8 dòng
- Unique: 1 text
- Duplicate: 7 dòng rác

### Sau khi clean:

```jsonl
{"text": "espresso | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0}
```

**Kết quả:**
- Tổng: 1 dòng
- Unique: 1 text
- Duplicate: 0

---

## 🎯 Best Practices

### 1. **Chạy clean-dataset.py định kỳ**

Sau khi:
- Thêm nhiều mẫu mới
- Chạy bootstrap-data.py
- Thêm mẫu thủ công

```bash
python clean-dataset.py
python train.py
```

### 2. **Kiểm tra conflict trước khi train**

```bash
# Xem thống kê
python clean-dataset.py --dry-run

# Nếu có conflict → clean
python clean-dataset.py
```

### 3. **Ưu tiên dữ liệu chất lượng**

- ✅ **MANUAL**: Nhãn thủ công, chính xác nhất
- ✅ **ATTRIBUTE**: Từ database, đáng tin cậy
- ⚠️ **RULE**: Có thể sai với edge cases
- ⚠️ **AI**: Có thể sai nếu model chưa tốt

### 4. **Tránh duplicate khi collect**

Trong `api.py`, có thể thêm logic kiểm tra duplicate trước khi append:

```python
# (Tùy chọn) Kiểm tra duplicate trước khi append
# Nhưng hiện tại để đơn giản, dùng clean-dataset.py sau
```

---

## 📈 Kết Quả Mong Đợi

### Trước khi clean:
- Training accuracy: 70-85% (nếu có nhiều conflict)
- Model confidence: Thấp, không chắc chắn
- Predictions: Không nhất quán

### Sau khi clean:
- Training accuracy: 95-98% (dữ liệu sạch)
- Model confidence: Cao, chắc chắn
- Predictions: Nhất quán và chính xác

---

## 🔧 Troubleshooting

### Vấn đề: Có nhiều conflict

**Triệu chứng**: `train.py` cảnh báo nhiều conflict

**Giải pháp**:
```bash
# 1. Xem conflict
python clean-dataset.py --dry-run

# 2. Clean dataset
python clean-dataset.py

# 3. Train lại
python train.py
```

### Vấn đề: Mất dữ liệu sau khi clean

**Giải pháp**: 
- File backup: `dataset.jsonl.backup`
- Khôi phục: `cp dataset.jsonl.backup dataset.jsonl`

### Vấn đề: Conflict vẫn còn sau khi clean

**Nguyên nhân**: Có thể có nhiều mẫu MANUAL với label khác nhau

**Giải pháp**: 
- Kiểm tra thủ công trong `dataset.jsonl`
- Xóa mẫu sai thủ công
- Hoặc chỉnh sửa `clean-dataset.py` để xử lý đặc biệt

---

## 📝 Tóm Tắt

### ✅ Có ảnh hưởng không?
**CÓ** - Dữ liệu trùng lặp với nhãn khác sẽ:
- Làm model confuse
- Giảm accuracy
- Giảm confidence
- Predictions không nhất quán

### ✅ Giải pháp:
1. **Chạy `clean-dataset.py`** định kỳ để làm sạch
2. **`train.py` đã được cải thiện** để tự xử lý duplicate
3. **Ưu tiên dữ liệu chất lượng** (MANUAL > ATTRIBUTE > RULE > AI)

### ✅ Workflow khuyến nghị:
```bash
# 1. Thêm mẫu mới
python add-manual-samples.py

# 2. Clean dataset
python clean-dataset.py

# 3. Train model
python train.py

# 4. Reload model
python -c "import requests; requests.post('http://127.0.0.1:9009/reload-model')"
```

---

## 🎓 Kiến Thức Bổ Sung

### Tại sao duplicate ảnh hưởng?

1. **Logistic Regression** học từ tất cả mẫu
   - Nếu "espresso" xuất hiện 5 lần với label COLD và 1 lần với label HOT
   - Model sẽ học: "espresso" có 83% là COLD ❌

2. **Loss function** bị ảnh hưởng
   - Model cố gắng fit cả hai label
   - Loss không giảm tốt
   - Model không hội tụ

3. **Confidence thấp**
   - Model không chắc chắn
   - Predictions không nhất quán

### Tại sao cần priority?

- **MANUAL**: Người dùng xác nhận, chính xác nhất
- **ATTRIBUTE**: Từ database, đáng tin cậy
- **RULE**: Có thể sai với edge cases
- **AI**: Phụ thuộc vào model, có thể sai

→ Ưu tiên nguồn đáng tin cậy hơn khi có conflict.
