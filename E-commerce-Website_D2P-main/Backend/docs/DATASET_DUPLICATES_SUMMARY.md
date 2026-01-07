# Tóm Tắt: Dữ Liệu Trùng Lặp và Ảnh Hưởng

## ❓ Có ảnh hưởng không?

**CÓ, rất ảnh hưởng!** 

Nếu cùng một sản phẩm có nhiều nhãn khác nhau → Model sẽ bị **confuse** và học sai.

---

## 📝 Ví Dụ Đơn Giản

### ❌ Trường hợp xấu:
```
"espresso" → HOT (1 lần) ✅
"espresso" → COLD (5 lần) ❌
```
→ Model học: "espresso" là COLD (sai!)

### ✅ Trường hợp tốt:
```
"espresso" → HOT (1 lần) ✅
```
→ Model học: "espresso" là HOT (đúng!)

---

## 🔍 Ảnh Hưởng Cụ Thể

| Vấn đề | Kết quả |
|--------|---------|
| **Nhiều duplicate** | Model học sai pattern |
| **Label conflict** | Model không chắc chắn |
| **Dữ liệu rác** | Accuracy giảm (97% → 70%) |

---

## 🛠️ Giải Pháp

### Script làm sạch: `clean-dataset.py`

**Làm gì:**
- ✅ Xóa duplicate (giữ 1 mẫu tốt nhất)
- ✅ Xử lý conflict (chọn label đúng)
- ✅ Backup tự động

**Cách dùng:**
```bash
# Xem trước (không ghi file)
python clean-dataset.py --dry-run

# Làm sạch thực sự
python clean-dataset.py
```

**Priority (ưu tiên):**
1. **MANUAL** ← Chính xác nhất (nhãn thủ công)
2. ATTRIBUTE
3. RULE
4. AI/MODEL
5. UNKNOWN ← Không đáng tin

---

## 📊 Workflow Khuyến Nghị

```bash
1. Thêm mẫu mới
   → python add-manual-samples.py

2. Làm sạch dataset (QUAN TRỌNG!)
   → python clean-dataset.py

3. Train model
   → python train.py

4. Reload model
   → python -c "import requests; requests.post('http://127.0.0.1:9009/reload-model')"
```

---

## ✅ Kết Quả

| Trước | Sau |
|-------|-----|
| 133 dòng (nhiều duplicate) | ~50 dòng (sạch) |
| Accuracy: 70-85% | Accuracy: 95-98% |
| Model không chắc chắn | Model chắc chắn |

---

## 💡 Lưu Ý

1. **Chạy clean-dataset.py định kỳ** sau khi thêm dữ liệu
2. **Ưu tiên dữ liệu MANUAL** - chính xác nhất
3. **Kiểm tra conflict** trước khi train

---

## 🎯 Tóm Tắt 1 Câu

**Dữ liệu trùng lặp với nhãn khác → Model học sai → Cần clean dataset trước khi train!**
