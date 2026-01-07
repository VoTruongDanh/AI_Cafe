"""
Script để cập nhật label cho các mẫu đã có trong dataset.jsonl
Thay thế các mẫu có label = null bằng label chính xác
"""
import json
import datetime
from pathlib import Path

DATASET_PATH = Path("dataset.jsonl")

# Mapping: text -> label chính xác
label_mapping = {
    "espresso | ca phe": "HOT",
    "cappuccino | ca phe": "HOT",
    "latte | ca phe": "HOT",
    "cheesecake | banh ngot": "COLD",
    "tiramisu | banh ngot": "COLD",
    "banh mousse dau | banh ngot": "COLD",
    "khoai tay chien | mon an nhanh": "HOT",
    "ga ran | mon an nhanh": "HOT",
    "burger bo | mon an nhanh": "HOT",
    "com ga nuong | mon chinh": "HOT",
    "pasta carbonara | mon chinh": "HOT",
    "tra thao moc | tra": "COLD",
    "croissant | banh man": "HOT",
}

def update_labels():
    """Cập nhật label cho các mẫu đã có"""
    print("=" * 60)
    print("Cap nhat label cho cac mau trong dataset.jsonl")
    print("=" * 60)
    print()
    
    if not DATASET_PATH.exists():
        print("[ERROR] File dataset.jsonl khong ton tai!")
        return
    
    # Đọc tất cả dòng
    lines = []
    updated_count = 0
    added_count = 0
    
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            try:
                row = json.loads(line)
                text = row.get('text', '')
                current_label = row.get('label')
                
                # Nếu text có trong mapping và label hiện tại là null hoặc khác
                if text in label_mapping:
                    expected_label = label_mapping[text]
                    if current_label != expected_label:
                        # Cập nhật label
                        row['label'] = expected_label
                        row['source'] = 'MANUAL'
                        row['confidence'] = 1.0
                        row['ts'] = datetime.datetime.now(
                            datetime.timezone(datetime.timedelta(hours=7))
                        ).isoformat()
                        updated_count += 1
                        print(f"  [UPDATE] {text} -> {expected_label}")
                    else:
                        print(f"  [OK] {text} -> {expected_label} (da dung)")
                
                lines.append(row)
            except Exception as e:
                print(f"  [ERROR] Khong parse duoc dong: {e}")
                continue
    
    # Thêm các mẫu mới nếu chưa có
    existing_texts = {row.get('text', '') for row in lines}
    for text, label in label_mapping.items():
        if text not in existing_texts:
            new_row = {
                "text": text,
                "label": label,
                "source": "MANUAL",
                "confidence": 1.0,
                "ts": datetime.datetime.now(
                    datetime.timezone(datetime.timedelta(hours=7))
                ).isoformat()
            }
            lines.append(new_row)
            added_count += 1
            print(f"  [ADD] {text} -> {label}")
    
    # Ghi lại file
    with open(DATASET_PATH, 'w', encoding='utf-8') as f:
        for row in lines:
            f.write(json.dumps(row, ensure_ascii=False) + '\n')
    
    print()
    print("=" * 60)
    print(f"[OK] Da cap nhat {updated_count} mau")
    print(f"[OK] Da them {added_count} mau moi")
    print()
    print("Buoc tiep theo:")
    print("   1. Chay: python train.py")
    print("   2. Sau do: python -c \"import requests; requests.post('http://127.0.0.1:9009/reload-model')\"")
    print("=" * 60)

if __name__ == "__main__":
    update_labels()
