# Giải Thích File dataset.jsonl

## 📄 dataset.jsonl Là Gì?

`dataset.jsonl` là file lưu trữ dữ liệu training cho Local AI Model. Mỗi dòng là một JSON object chứa thông tin về một mẫu học.

---

## 🤖 Tự Động Tạo Hay Thủ Công?

### ✅ **TỰ ĐỘNG TẠO** (Khuyến Nghị)

File `dataset.jsonl` được tạo **tự động** khi:

1. **Laravel gọi `/collect` endpoint**
   - Khi `LocalAITemperatureClassifier` phân loại sản phẩm
   - Tự động gửi mẫu đến AI Service
   - AI Service tự động ghi vào `dataset.jsonl`

2. **Bootstrap script chạy**
   - Khi chạy `2-bootstrap-and-train.bat` hoặc `bootstrap-data.py`
   - Script tự động lấy sản phẩm từ Laravel API
   - Phân loại bằng rule-based
   - Gửi các mẫu có confidence >= 0.8 vào `/collect`
   - Tự động tạo file `dataset.jsonl`

---

## 📝 Format Của dataset.jsonl

Mỗi dòng là một JSON object:

```json
{"text":"ca phe den da | ca phe","label":"COLD","source":"RULE","confidence":0.95,"ts":"2026-01-07T10:00:00+07:00"}
{"text":"ca phe sua nong | ca phe","label":"HOT","source":"RULE","confidence":0.9,"ts":"2026-01-07T10:01:00+07:00"}
{"text":"espresso | ca phe","label":null,"source":"UNKNOWN","confidence":0.5,"ts":"2026-01-07T10:02:00+07:00"}
```

**Giải thích các field:**
- `text`: Text đã chuẩn hóa (name | categoryName)
- `label`: Nhãn (`HOT`, `COLD`, hoặc `null` nếu chưa có nhãn)
- `source`: Nguồn nhãn (`RULE`, `ATTRIBUTE`, `UNKNOWN`, `MANUAL`)
- `confidence`: Độ tin cậy (0.0-1.0)
- `ts`: Timestamp

---

## 🔄 Quy Trình Tự Động

### 1. **Khi Người Dùng Sử Dụng Hệ Thống**

```
User request → Laravel API
    ↓
ProductTemperatureController
    ↓
LocalAITemperatureClassifier
    ↓
Rule-Based phân loại
    ↓
Nếu confidence >= 0.8 → Gửi /collect với label
    ↓
AI Service nhận request
    ↓
Tự động append vào dataset.jsonl ✅
```

### 2. **Khi Chạy Bootstrap**

```
Chạy bootstrap-data.py
    ↓
Lấy sản phẩm từ Laravel API
    ↓
Phân loại bằng rule-based
    ↓
Nếu confidence >= 0.8 → Gửi /collect
    ↓
Tự động tạo/append vào dataset.jsonl ✅
```

---

## ✏️ Có Thể Tạo/Chỉnh Sửa Thủ Công Không?

### ✅ **CÓ THỂ** (Nhưng Không Khuyến Nghị)

Bạn có thể:

1. **Tạo file thủ công:**
   ```bash
   # Tạo file mới
   echo '{"text":"espresso | ca phe","label":"HOT","source":"MANUAL","confidence":1.0,"ts":"2026-01-07T10:00:00+07:00"}' > dataset.jsonl
   ```

2. **Thêm dòng thủ công:**
   ```bash
   # Append thêm dòng
   echo '{"text":"cappuccino | ca phe","label":"HOT","source":"MANUAL","confidence":1.0,"ts":"2026-01-07T10:01:00+07:00"}' >> dataset.jsonl
   ```

3. **Chỉnh sửa bằng text editor:**
   - Mở file `dataset.jsonl` bằng Notepad/VSCode
   - Thêm/sửa/xóa dòng
   - Lưu file

**Lưu ý:**
- Mỗi dòng phải là JSON hợp lệ
- Format phải đúng (không có dấu phẩy cuối)
- Timestamp nên đúng format ISO

---

## 🎯 Khi Nào Cần Tạo/Chỉnh Sửa Thủ Công?

### 1. **Thêm Mẫu Có Nhãn Chắc Chắn**

Nếu bạn biết chắc một sản phẩm là HOT hoặc COLD:

```json
{"text":"espresso | ca phe","label":"HOT","source":"MANUAL","confidence":1.0,"ts":"2026-01-07T10:00:00+07:00"}
{"text":"cheesecake | banh ngot","label":"COLD","source":"MANUAL","confidence":1.0,"ts":"2026-01-07T10:01:00+07:00"}
```

### 2. **Sửa Nhãn Sai**

Nếu phát hiện nhãn sai trong dataset:

```bash
# Xóa dòng sai
# Thêm dòng đúng
```

### 3. **Thêm Mẫu Đặc Biệt**

Các mẫu mà rule-based không thể phân loại:

```json
{"text":"mon dac biet | do uong","label":"HOT","source":"MANUAL","confidence":0.9,"ts":"2026-01-07T10:00:00+07:00"}
```

---

## 📊 Kiểm Tra dataset.jsonl

### Xem Nội Dung:

**Windows:**
```bash
type dataset.jsonl
```

**PowerShell:**
```powershell
Get-Content dataset.jsonl
```

**Python:**
```python
import json
with open('dataset.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        print(json.loads(line))
```

### Đếm Số Mẫu:

**PowerShell:**
```powershell
(Get-Content dataset.jsonl | Measure-Object -Line).Lines
```

**Python:**
```python
with open('dataset.jsonl', 'r', encoding='utf-8') as f:
    count = sum(1 for line in f if line.strip())
print(f"Total samples: {count}")
```

### Đếm Theo Label:

**Python:**
```python
import json
hot_count = 0
cold_count = 0
unknown_count = 0

with open('dataset.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        if line.strip():
            data = json.loads(line)
            label = data.get('label')
            if label == 'HOT':
                hot_count += 1
            elif label == 'COLD':
                cold_count += 1
            else:
                unknown_count += 1

print(f"HOT: {hot_count}, COLD: {cold_count}, UNKNOWN: {unknown_count}")
```

---

## 🔧 Quản Lý dataset.jsonl

### 1. **Backup Trước Khi Chỉnh Sửa**

```bash
copy dataset.jsonl dataset.jsonl.backup
```

### 2. **Xóa File Để Bắt Đầu Lại**

```bash
del dataset.jsonl
# Hoặc
rm dataset.jsonl
```

Sau đó chạy lại bootstrap để tạo file mới.

### 3. **Merge Nhiều File**

Nếu có nhiều file dataset:

```bash
# Windows
type dataset1.jsonl dataset2.jsonl > dataset_merged.jsonl

# Linux/Mac
cat dataset1.jsonl dataset2.jsonl > dataset_merged.jsonl
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. **File Tự Động Tạo**

- File `dataset.jsonl` **tự động được tạo** khi lần đầu gọi `/collect`
- Không cần tạo file thủ công trước
- Nếu file không tồn tại, AI Service sẽ tự tạo

### 2. **Append-Only**

- File chỉ **append** (thêm vào cuối), không ghi đè
- Mỗi lần gọi `/collect` → thêm 1 dòng mới
- Không tự động xóa dòng cũ

### 3. **Encoding**

- File phải dùng **UTF-8 encoding**
- Khi chỉnh sửa thủ công, đảm bảo lưu với UTF-8

### 4. **Format**

- Mỗi dòng phải là JSON hợp lệ
- Không có dấu phẩy cuối
- Không có dòng trống (trừ dòng cuối)

---

## 🎯 Tóm Tắt

### ✅ **Tự Động:**
- File được tạo tự động khi gọi `/collect`
- Dữ liệu được thêm tự động khi hệ thống hoạt động
- Bootstrap script tự động tạo file ban đầu

### ✏️ **Có Thể Thủ Công:**
- Có thể chỉnh sửa thủ công nếu cần
- Có thể thêm mẫu đặc biệt
- Có thể sửa nhãn sai

### 📝 **Khuyến Nghị:**
- **Để hệ thống tự động** thu thập dữ liệu
- **Chỉ chỉnh sửa thủ công** khi cần thêm mẫu đặc biệt hoặc sửa lỗi
- **Backup file** trước khi chỉnh sửa

---

## 🔍 Kiểm Tra File Hiện Tại

**Vị trí:** `ai-temp-local/dataset.jsonl`

**Kiểm tra:**
```bash
cd ai-temp-local
type dataset.jsonl
```

**Nếu file không tồn tại:**
- Chạy `2-bootstrap-and-train.bat` để tạo file tự động
- Hoặc gọi `/collect` endpoint để tạo file
