# AI Phân Loại Nhiệt Độ Sản Phẩm - Cách Hoạt Động

## 🎯 Tại sao "Trà xanh đá" được phân loại là COLD (Lạnh)?

### Quy trình phân loại:

1. **Input**: 
   - Tên sản phẩm: "Trà xanh đá"
   - Danh mục: "Trà" (nếu có)

2. **Bước 1: Chuẩn hóa text**
   ```
   "Trà xanh đá" → "tra xanh da"
   ```
   - Chuyển thành chữ thường
   - Bỏ dấu tiếng Việt: "Trà" → "tra", "đá" → "da"
   - Gộp khoảng trắng

3. **Bước 2: Kiểm tra keywords lạnh**
   - Danh sách keywords lạnh: `['da', 'iced', 'ice', 'lanh', ...]`
   - Tìm thấy keyword **"da"** trong text "tra xanh da"
   - ✅ Match thành công!

4. **Kết quả**:
   ```json
   {
     "temperature": "COLD",
     "confidence": 0.95,
     "source": "RULE",
     "reason": "Tìm thấy keyword lạnh trong tên/danh mục"
   }
   ```

---

## 🤖 Cách AI TemperatureClassifier Hoạt Động

### 1. Kiến trúc Phân Loại (Theo thứ tự ưu tiên)

```
┌─────────────────────────────────────────┐
│  BƯỚC 1: Kiểm tra Attributes           │
│  (Ưu tiên cao nhất - Confidence: 1.0)  │
│  Nếu có attributes['temperature']       │
│  → Trả về ngay lập tức                  │
└─────────────────────────────────────────┘
              ↓ (Không có)
┌─────────────────────────────────────────┐
│  BƯỚC 2: Phân tích Keywords            │
│  (Confidence: 0.90 - 0.95)              │
│  - Tìm keywords lạnh: "da", "ice"...    │
│  - Tìm keywords nóng: "nong", "hot"...  │
└─────────────────────────────────────────┘
              ↓ (Không tìm thấy)
┌─────────────────────────────────────────┐
│  BƯỚC 3: Suy luận từ Danh mục          │
│  (Confidence: 0.75 - 0.85)              │
│  - Cà phê → mặc định nóng               │
│  - Cà phê + "đá" → lạnh                 │
└─────────────────────────────────────────┘
              ↓ (Không áp dụng)
┌─────────────────────────────────────────┐
│  BƯỚC 4: Suy luận từ Món ăn            │
│  (Confidence: 0.70)                     │
│  - Lẩu, súp, phở, bún → nóng            │
└─────────────────────────────────────────┘
              ↓ (Không áp dụng)
┌─────────────────────────────────────────┐
│  BƯỚC 5: Không xác định                 │
│  (Confidence: 0.50)                      │
│  → UNKNOWN                               │
└─────────────────────────────────────────┘
```

---

### 2. Danh Sách Keywords

#### Keywords Lạnh (COLD):
```php
[
    'da',           // đá
    'iced',         // ướp lạnh
    'ice',          // đá
    'lanh',         // lạnh
    'frozen',       // đông lạnh
    'smoothie',     // sinh tố
    'sinh to',      // sinh tố
    'kem',          // kem
    'tra sua',      // trà sữa
    'nuoc ep',      // nước ép
    'juice',        // nước ép
    'cold',         // lạnh
    'freeze',       // đông
    'ca phe da',    // cà phê đá
    'tra da',       // trà đá
    'nuoc ngot',    // nước ngọt
    'soft drink',   // nước ngọt
    'soda'          // soda
]
```

#### Keywords Nóng (HOT):
```php
[
    'nong',         // nóng
    'hot',          // nóng
    'am',           // ấm
    'warm',         // ấm
    'steaming',     // bốc hơi
    'boiling',      // sôi
    'ca phe nong',  // cà phê nóng
    'tra nong',     // trà nóng
    'soup',         // súp
    'lau',          // lẩu
    'sup',          // súp
    'pho',          // phở
    'bun',          // bún
    'mi',           // mì
    'noodle soup'   // mì nước
]
```

---

### 3. Quy Trình Chuẩn Hóa Text

#### Ví dụ với "Trà xanh đá":

**Bước 1: Lowercase**
```
"Trà xanh đá" → "trà xanh đá"
```

**Bước 2: Bỏ dấu tiếng Việt**
```
"trà xanh đá" → "tra xanh da"
```

**Bước 3: Normalize spaces**
```
"tra xanh da" → "tra xanh da" (giữ nguyên)
```

**Bước 4: Kết hợp với danh mục**
```
"tra xanh da | tra" → "tra xanh da | tra"
```

**Bước 5: Tìm keywords**
```
Tìm "da" trong "tra xanh da | tra" → ✅ Tìm thấy!
```

---

### 4. Confidence Score (Độ Tin Cậy)

| Nguồn | Confidence | Mô tả |
|-------|-----------|-------|
| **ATTRIBUTE** | 1.0 (100%) | Nhiệt độ được chỉ định rõ trong attributes |
| **RULE (Keywords lạnh)** | 0.95 (95%) | Tìm thấy keyword lạnh trong tên/danh mục |
| **RULE (Keywords nóng)** | 0.90 (90%) | Tìm thấy keyword nóng trong tên/danh mục |
| **RULE (Cà phê có đá)** | 0.85 (85%) | Cà phê có từ "đá" hoặc "ice" |
| **RULE (Cà phê mặc định)** | 0.75 (75%) | Cà phê không có đá → mặc định nóng |
| **RULE (Món ăn nóng)** | 0.70 (70%) | Lẩu, súp, phở, bún |
| **UNKNOWN** | 0.50 (50%) | Không đủ dấu hiệu để phân loại |

---

### 5. Ví Dụ Phân Loại

#### Ví dụ 1: "Trà xanh đá"
```
Input: "Trà xanh đá" | "Trà"
↓
Normalize: "tra xanh da | tra"
↓
Tìm keywords: "da" ✅
↓
Kết quả: COLD (95%)
```

#### Ví dụ 2: "Cà phê đen nóng"
```
Input: "Cà phê đen nóng" | "Cà phê"
↓
Normalize: "ca phe den nong | ca phe"
↓
Tìm keywords: "nong" ✅
↓
Kết quả: HOT (90%)
```

#### Ví dụ 3: "Cà phê đen" (không có đá/nóng)
```
Input: "Cà phê đen" | "Cà phê"
↓
Normalize: "ca phe den | ca phe"
↓
Không tìm thấy keywords
↓
Suy luận: Danh mục "Cà phê" → mặc định nóng
↓
Kết quả: HOT (75%)
```

#### Ví dụ 4: "Phở bò"
```
Input: "Phở bò" | "Món chính"
↓
Normalize: "pho bo | mon chinh"
↓
Tìm keywords: "pho" ✅
↓
Kết quả: HOT (70%)
```

---

### 6. Tối Ưu Hóa

#### Word Boundary Matching
Để tránh false positive, AI sử dụng regex với word boundary:
```php
preg_match('/(^|\W)da(\W|$)/ui', $text)
```

**Ví dụ:**
- ✅ "tra xanh da" → Match "da"
- ✅ "ca phe da" → Match "da"
- ❌ "dang" → Không match "da" (vì "da" là phần của "dang")

#### Phrase Matching
Với cụm từ có khoảng trắng, tìm exact match:
```php
'tra da' → Tìm exact "tra da" trong text
```

---

### 7. API Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Trà xanh đá",
      "categoryName": "Trà",
      "temperature": "COLD",
      "confidence": 0.95,
      "source": "RULE",
      "reason": "Tìm thấy keyword lạnh trong tên/danh mục"
    }
  ],
  "total": 1
}
```

---

## 📊 Tóm Tắt

**"Trà xanh đá" được phân loại là COLD vì:**
1. ✅ Từ "đá" (sau khi bỏ dấu → "da") nằm trong danh sách keywords lạnh
2. ✅ AI tìm thấy keyword này trong tên sản phẩm
3. ✅ Confidence: 95% (rất cao)
4. ✅ Source: RULE (dựa trên quy tắc keywords)

**Đây là phân loại chính xác** vì "Trà xanh đá" thực sự là đồ uống lạnh! 🧊
