"""
Script để thêm mẫu thủ công vào dataset.jsonl với kiến thức mở rộng
Chạy script này để thêm các mẫu có nhãn chính xác từ kiến thức domain
"""
import json
import datetime
import re
import unicodedata
from pathlib import Path
from typing import Dict, List, Optional

DATASET_PATH = Path("dataset.jsonl")

def normalize_vi(s: str) -> str:
    """Chuẩn hóa text tiếng Việt: bỏ dấu, lowercase"""
    if not s:
        return ""
    s = str(s).strip().lower()
    s = s.replace("đ", "d").replace("Đ", "d")
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"\s+", " ", s).strip()
    return s

# Kiến thức domain: Từ khóa và pattern để phân loại
DOMAIN_KNOWLEDGE = {
    "HOT": {
        "keywords": [
            # Cà phê nóng
            "espresso", "cappuccino", "latte", "americano", "macchiato", "mocha",
            "ca phe nong", "ca phe den nong", "ca phe sua nong",
            # Trà nóng
            "tra nong", "tra den nong", "tra xanh nong",
            # Món ăn nóng
            "pho", "bun", "mi", "lau", "sup", "chao", "com", "pasta", "spaghetti",
            "ga ran", "khoai tay chien", "burger", "pizza", "banh mi nuong",
            "com ga nuong", "com suon nuong", "thit nuong",
            # Bánh nóng
            "croissant", "banh mi", "banh quy nong", "banh nuong",
        ],
        "categories": ["ca phe", "coffee", "tra", "tea", "mon chinh", "mon an nhanh", "banh man"],
        "patterns": [
            r".*\bnong\b.*",
            r".*\bhot\b.*",
            r".*\bam\b.*",
            r".*\bwarm\b.*",
            r".*\bsteaming\b.*",
        ]
    },
    "COLD": {
        "keywords": [
            # Cà phê lạnh
            "ca phe da", "ca phe sua da", "ca phe den da",
            # Trà lạnh
            "tra da", "tra xanh da", "tra den da", "tra sua",
            # Nước ép & sinh tố
            "nuoc ep", "sinh to", "smoothie", "juice",
            # Nước ngọt
            "coca cola", "pepsi", "7up", "nuoc ngot", "soda",
            # Bánh lạnh
            "cheesecake", "tiramisu", "mousse", "banh kem", "ice cream", "kem",
        ],
        "categories": ["nuoc ep", "sinh to", "juice", "nuoc ngot", "soft drinks", "banh ngot", "cakes"],
        "patterns": [
            r".*\bda\b.*",
            r".*\bice\b.*",
            r".*\biced\b.*",
            r".*\blanh\b.*",
            r".*\bcold\b.*",
            r".*\bfrozen\b.*",
        ]
    }
}

def classify_by_knowledge(text: str, category: str = "") -> Optional[tuple]:
    """
    Phân loại dựa trên kiến thức domain
    Returns: (label, confidence) hoặc None
    """
    text_lower = normalize_vi(text)
    category_lower = normalize_vi(category)
    combined = f"{text_lower} | {category_lower}"
    
    # Kiểm tra từng class
    for label, knowledge in DOMAIN_KNOWLEDGE.items():
        score = 0.0
        max_score = 0.0
        
        # Kiểm tra keywords
        for keyword in knowledge["keywords"]:
            keyword_norm = normalize_vi(keyword)
            if keyword_norm in text_lower or keyword_norm in combined:
                score += 1.0
                max_score += 1.0
        
        # Kiểm tra categories
        for cat in knowledge["categories"]:
            if cat in category_lower:
                score += 0.5
                max_score += 0.5
        
        # Kiểm tra patterns
        for pattern in knowledge["patterns"]:
            if re.search(pattern, text_lower) or re.search(pattern, combined):
                score += 0.8
                max_score += 0.8
        
        # Nếu có điểm số đáng kể
        if score > 0:
            confidence = min(1.0, score / max(max_score, 1.0))
            if confidence >= 0.6:  # Ngưỡng tối thiểu
                return (label, confidence)
    
    return None

# Mẫu thủ công với kiến thức domain (mở rộng)
MANUAL_SAMPLES = [
    # ========== CÀ PHÊ - HOT ==========
    {"text": "espresso | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "cappuccino | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "latte | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "americano | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "macchiato | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "mocha | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "ca phe dac biet cua quan | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 0.9},
    
    # ========== CÀ PHÊ - COLD ==========
    {"text": "ca phe den da | ca phe", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "ca phe sua da | ca phe", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "ca phe den nong | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "ca phe sua nong | ca phe", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    
    # ========== TRÀ - HOT ==========
    {"text": "tra den nong | tra", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "tra xanh nong | tra", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "tra thao moc nong | tra", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    
    # ========== TRÀ - COLD ==========
    {"text": "tra den da | tra", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "tra xanh da | tra", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "tra sua | tra", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "tra thao moc | tra", "label": "COLD", "source": "MANUAL", "confidence": 0.9},
    
    # ========== NƯỚC ÉP & SINH TỐ - COLD ==========
    {"text": "nuoc ep cam | nuoc ep & sinh to", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "nuoc ep dua hau | nuoc ep & sinh to", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "sinh to bo | nuoc ep & sinh to", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "sinh to dau tay | nuoc ep & sinh to", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "sinh to xoai | nuoc ep & sinh to", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "smoothie | nuoc ep & sinh to", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    
    # ========== NƯỚC NGỌT - COLD ==========
    {"text": "coca cola | nuoc ngot & nuoc co ga", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "pepsi | nuoc ngot & nuoc co ga", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "7up | nuoc ngot & nuoc co ga", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    
    # ========== BÁNH NGỌT - COLD ==========
    {"text": "banh kem chocolate | banh ngot", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "cheesecake | banh ngot", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "tiramisu | banh ngot", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "banh mousse dau | banh ngot", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "ice cream | banh ngot", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    {"text": "kem | banh ngot", "label": "COLD", "source": "MANUAL", "confidence": 1.0},
    
    # ========== BÁNH MẶN - HOT ==========
    {"text": "banh mi sandwich thit nguoi | banh man", "label": "HOT", "source": "MANUAL", "confidence": 0.9},
    {"text": "banh mi nuong bo toi | banh man", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "croissant | banh man", "label": "HOT", "source": "MANUAL", "confidence": 0.9},
    {"text": "banh quy nong | banh man", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    
    # ========== MÓN ĂN NHANH - HOT ==========
    {"text": "khoai tay chien | mon an nhanh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "ga ran | mon an nhanh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "burger bo | mon an nhanh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "pizza | mon an nhanh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "hot dog | mon an nhanh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    
    # ========== MÓN CHÍNH - HOT ==========
    {"text": "pho bo | mon chinh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "bun bo | mon chinh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "mi quang | mon chinh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "com ga nuong | mon chinh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "com suon nuong | mon chinh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "pasta carbonara | mon chinh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "spaghetti | mon chinh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "lau | mon chinh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "sup | mon chinh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
    {"text": "chao | mon chinh", "label": "HOT", "source": "MANUAL", "confidence": 1.0},
]

def read_existing_dataset() -> Dict[str, dict]:
    """Đọc dataset hiện có và trả về dict {text: row}"""
    existing = {}
    if DATASET_PATH.exists():
        with open(DATASET_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    try:
                        row = json.loads(line)
                        text = row.get('text', '')
                        if text:
                            existing[text] = row
                    except:
                        continue
    return existing

def add_samples(update_existing: bool = False, use_knowledge: bool = True):
    """
    Thêm mẫu vào dataset.jsonl
    
    Args:
        update_existing: Nếu True, cập nhật label cho mẫu đã có nếu label khác
        use_knowledge: Nếu True, sử dụng kiến thức domain để tự động phân loại
    """
    print("=" * 70)
    print("🚀 Thêm Mẫu Thủ Công Vào Dataset (Với Kiến Thức Domain)")
    print("=" * 70)
    print()
    
    if not DATASET_PATH.exists():
        print("[INFO] Tạo file dataset.jsonl mới...")
        DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Đọc dataset hiện có
    existing = read_existing_dataset()
    print(f"[INFO] Đã có {len(existing)} mẫu trong dataset")
    print()
    
    # Thống kê
    stats = {
        "added": 0,
        "updated": 0,
        "skipped": 0,
        "auto_classified": 0,
        "by_label": {"HOT": 0, "COLD": 0}
    }
    
    # Xử lý mẫu thủ công
    samples_to_write = []
    
    for sample in MANUAL_SAMPLES:
        text = sample['text']
        label = sample['label']
        confidence = sample.get('confidence', 1.0)
        
        if text in existing:
            existing_row = existing[text]
            existing_label = existing_row.get('label')
            
            if existing_label == label:
                print(f"  [SKIP] {text} -> {label} (đã tồn tại với label đúng)")
                stats["skipped"] += 1
                continue
            elif update_existing and existing_label != label:
                print(f"  [UPDATE] {text} -> {label} (thay đổi từ {existing_label})")
                stats["updated"] += 1
                # Cập nhật label
                existing_row['label'] = label
                existing_row['source'] = sample.get('source', 'MANUAL')
                existing_row['confidence'] = confidence
                existing_row['ts'] = datetime.datetime.now(
                    datetime.timezone(datetime.timedelta(hours=7))
                ).isoformat()
                samples_to_write.append(existing_row)
                stats["by_label"][label] += 1
            else:
                print(f"  [SKIP] {text} -> {label} (đã tồn tại với label khác: {existing_label})")
                stats["skipped"] += 1
                continue
        else:
            # Thêm mẫu mới
            new_row = {
                "text": text,
                "label": label,
                "source": sample.get('source', 'MANUAL'),
                "confidence": confidence,
                "ts": datetime.datetime.now(
                    datetime.timezone(datetime.timedelta(hours=7))
                ).isoformat()
            }
            samples_to_write.append(new_row)
            print(f"  [ADD] {text} -> {label} (confidence: {confidence:.2f})")
            stats["added"] += 1
            stats["by_label"][label] += 1
    
    # Tự động phân loại các mẫu chưa có nhãn (nếu bật)
    if use_knowledge:
        print()
        print("[INFO] Đang tự động phân loại các mẫu chưa có nhãn...")
        for text, row in existing.items():
            if not row.get('label') or row.get('label') == 'UNKNOWN':
                # Thử phân loại bằng kiến thức domain
                parts = text.split(' | ')
                name = parts[0] if len(parts) > 0 else ""
                category = parts[1] if len(parts) > 1 else ""
                
                result = classify_by_knowledge(name, category)
                if result:
                    label, conf = result
                    if conf >= 0.7:  # Chỉ cập nhật nếu confidence cao
                        print(f"  [AUTO] {text} -> {label} (confidence: {conf:.2f})")
                        row['label'] = label
                        row['source'] = 'KNOWLEDGE'
                        row['confidence'] = conf
                        row['ts'] = datetime.datetime.now(
                            datetime.timezone(datetime.timedelta(hours=7))
                        ).isoformat()
                        samples_to_write.append(row)
                        stats["auto_classified"] += 1
                        stats["by_label"][label] += 1
    
    # Ghi vào file
    if samples_to_write:
        with open(DATASET_PATH, 'a', encoding='utf-8') as f:
            for row in samples_to_write:
                f.write(json.dumps(row, ensure_ascii=False) + '\n')
    
    # In thống kê
    print()
    print("=" * 70)
    print("📊 THỐNG KÊ")
    print("=" * 70)
    print(f"  ✅ Đã thêm: {stats['added']} mẫu")
    print(f"  🔄 Đã cập nhật: {stats['updated']} mẫu")
    print(f"  🤖 Tự động phân loại: {stats['auto_classified']} mẫu")
    print(f"  ⏭️  Đã bỏ qua: {stats['skipped']} mẫu")
    print()
    print("  📈 Phân bố theo label:")
    print(f"     - HOT: {stats['by_label']['HOT']} mẫu")
    print(f"     - COLD: {stats['by_label']['COLD']} mẫu")
    print()
    
    # Đếm tổng sau khi thêm
    final_count = len(read_existing_dataset())
    print(f"  📦 Tổng số mẫu trong dataset: {final_count}")
    print()
    
    print("=" * 70)
    print("📝 BƯỚC TIẾP THEO")
    print("=" * 70)
    print("   1. Chạy: python train.py")
    print("   2. Sau đó: python -c \"import requests; requests.post('http://127.0.0.1:9009/reload-model')\"")
    print("=" * 70)

if __name__ == "__main__":
    import sys
    
    # Parse arguments
    update_existing = "--update" in sys.argv
    no_auto = "--no-auto" in sys.argv
    
    if update_existing:
        print("[INFO] Chế độ cập nhật: Sẽ cập nhật label cho mẫu đã có")
    if no_auto:
        print("[INFO] Tắt tự động phân loại")
    
    add_samples(update_existing=update_existing, use_knowledge=not no_auto)
