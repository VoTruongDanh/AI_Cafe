"""
Script để làm sạch dataset.jsonl: xóa duplicate và xử lý conflict label
Ưu tiên: MANUAL > RULE > AI > UNKNOWN
Ưu tiên confidence cao hơn nếu cùng source
"""
import json
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, List

# Fix encoding cho Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

DATASET_PATH = Path("dataset.jsonl")
BACKUP_PATH = Path("dataset.jsonl.backup")

# Thứ tự ưu tiên source (cao hơn = ưu tiên hơn)
SOURCE_PRIORITY = {
    "MANUAL": 4,
    "ATTRIBUTE": 3,
    "RULE": 2,
    "LOCAL_AI": 1,
    "MODEL": 1,
    "AI": 1,
    "UNKNOWN": 0,
    None: 0,
}

def get_priority(row: dict) -> tuple:
    """Tính điểm ưu tiên cho một row"""
    source = row.get('source', 'UNKNOWN')
    confidence = row.get('confidence', 0.0) or 0.0
    label = row.get('label')
    
    # Ưu tiên source
    source_priority = SOURCE_PRIORITY.get(source, 0)
    
    # Ưu tiên có label hơn không có label
    has_label = 1 if label in ('HOT', 'COLD') else 0
    
    # Ưu tiên confidence cao hơn
    confidence_score = confidence
    
    return (has_label, source_priority, confidence_score)

def clean_dataset(dry_run: bool = False) -> Dict:
    """
    Làm sạch dataset: xóa duplicate và xử lý conflict
    
    Args:
        dry_run: Nếu True, chỉ hiển thị thống kê, không ghi file
    
    Returns:
        Dict với thống kê
    """
    print("=" * 70)
    print("🧹 Làm Sạch Dataset (Xóa Duplicate & Xử Lý Conflict)")
    print("=" * 70)
    print()
    
    if not DATASET_PATH.exists():
        print("[ERROR] File dataset.jsonl không tồn tại!")
        return {}
    
    # Backup
    if not dry_run:
        import shutil
        shutil.copy(DATASET_PATH, BACKUP_PATH)
        print(f"[INFO] Đã backup dataset.jsonl → dataset.jsonl.backup")
        print()
    
    # Đọc tất cả rows
    all_rows = []
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
                row['_line_num'] = line_num  # Lưu số dòng để debug
                all_rows.append(row)
            except Exception as e:
                print(f"[WARN] Dòng {line_num}: Không parse được - {e}")
                continue
    
    print(f"[INFO] Tổng số dòng trong file: {len(all_rows)}")
    print()
    
    # Nhóm theo text
    text_groups = defaultdict(list)
    for row in all_rows:
        text = row.get('text', '').strip()
        if text:
            text_groups[text].append(row)
    
    print(f"[INFO] Số text unique: {len(text_groups)}")
    print()
    
    # Thống kê
    stats = {
        "total_rows": len(all_rows),
        "unique_texts": len(text_groups),
        "duplicates_removed": 0,
        "conflicts_resolved": 0,
        "by_label": defaultdict(int),
        "by_source": defaultdict(int),
        "conflicts": []
    }
    
    # Xử lý từng nhóm
    cleaned_rows = []
    
    for text, rows in text_groups.items():
        if len(rows) == 1:
            # Không duplicate
            cleaned_rows.append(rows[0])
            label = rows[0].get('label')
            source = rows[0].get('source', 'UNKNOWN')
            if label in ('HOT', 'COLD'):
                stats["by_label"][label] += 1
            stats["by_source"][source] += 1
        else:
            # Có duplicate - chọn row tốt nhất
            stats["duplicates_removed"] += len(rows) - 1
            
            # Sắp xếp theo priority
            rows_sorted = sorted(rows, key=get_priority, reverse=True)
            best_row = rows_sorted[0]
            
            # Kiểm tra conflict (cùng text nhưng label khác nhau)
            labels = [r.get('label') for r in rows if r.get('label') in ('HOT', 'COLD')]
            unique_labels = set(labels)
            
            if len(unique_labels) > 1:
                # Có conflict
                stats["conflicts_resolved"] += 1
                conflict_info = {
                    "text": text,
                    "labels": list(unique_labels),
                    "chosen": best_row.get('label'),
                    "chosen_source": best_row.get('source'),
                    "chosen_confidence": best_row.get('confidence'),
                    "count": len(rows)
                }
                stats["conflicts"].append(conflict_info)
                
                print(f"  [CONFLICT] {text}")
                print(f"            Labels: {list(unique_labels)}")
                print(f"            Chọn: {best_row.get('label')} (source: {best_row.get('source')}, confidence: {best_row.get('confidence')})")
                print()
            
            # Thêm row tốt nhất
            cleaned_rows.append(best_row)
            label = best_row.get('label')
            source = best_row.get('source', 'UNKNOWN')
            if label in ('HOT', 'COLD'):
                stats["by_label"][label] += 1
            stats["by_source"][source] += 1
    
    # Ghi file mới
    if not dry_run:
        with open(DATASET_PATH, 'w', encoding='utf-8') as f:
            for row in cleaned_rows:
                # Xóa _line_num trước khi ghi
                row_clean = {k: v for k, v in row.items() if k != '_line_num'}
                f.write(json.dumps(row_clean, ensure_ascii=False) + '\n')
    
    # In thống kê
    print("=" * 70)
    print("📊 THỐNG KÊ")
    print("=" * 70)
    print(f"  📦 Tổng số dòng ban đầu: {stats['total_rows']}")
    print(f"  ✨ Số text unique: {stats['unique_texts']}")
    print(f"  🗑️  Đã xóa duplicate: {stats['duplicates_removed']} dòng")
    print(f"  ⚠️  Đã xử lý conflict: {stats['conflicts_resolved']} text")
    print()
    
    print("  📈 Phân bố theo label:")
    for label in ['HOT', 'COLD']:
        count = stats['by_label'][label]
        print(f"     - {label}: {count} mẫu")
    print()
    
    print("  📊 Phân bố theo source:")
    for source in sorted(stats['by_source'].keys(), key=lambda x: SOURCE_PRIORITY.get(x, 0), reverse=True):
        count = stats['by_source'][source]
        print(f"     - {source}: {count} mẫu")
    print()
    
    if stats['conflicts']:
        print("  ⚠️  CONFLICTS ĐÃ XỬ LÝ:")
        for conflict in stats['conflicts']:
            print(f"     - {conflict['text']}")
            print(f"       Labels: {conflict['labels']} → Chọn: {conflict['chosen']} ({conflict['chosen_source']})")
        print()
    
    print(f"  ✅ Số dòng sau khi clean: {len(cleaned_rows)}")
    print(f"  💾 Giảm: {stats['total_rows'] - len(cleaned_rows)} dòng ({((stats['total_rows'] - len(cleaned_rows)) / stats['total_rows'] * 100):.1f}%)")
    print()
    
    if dry_run:
        print("=" * 70)
        print("ℹ️  DRY RUN - Không ghi file. Chạy lại không có --dry-run để áp dụng.")
        print("=" * 70)
    else:
        print("=" * 70)
        print("✅ Đã làm sạch dataset!")
        print(f"💾 Backup: {BACKUP_PATH}")
        print("=" * 70)
    
    return stats

if __name__ == "__main__":
    import sys
    
    dry_run = "--dry-run" in sys.argv or "-d" in sys.argv
    
    if dry_run:
        print("[INFO] Chế độ DRY RUN - Chỉ hiển thị thống kê, không ghi file")
        print()
    
    clean_dataset(dry_run=dry_run)
