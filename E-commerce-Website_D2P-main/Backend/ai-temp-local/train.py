import json
import sys
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Fix encoding cho Windows console
if sys.platform == 'win32':
    try:
        import codecs
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except Exception:
        pass  # Ignore encoding errors

DATASET_PATH = Path("dataset.jsonl")
MODEL_PATH = Path("model.joblib")

def read_labeled():
    """Đọc dataset và lấy các mẫu có nhãn HOT/COLD (xử lý duplicate)"""
    from collections import defaultdict
    
    # Thứ tự ưu tiên source
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
    
    def get_priority(row):
        source = row.get('source', 'UNKNOWN')
        confidence = row.get('confidence', 0.0) or 0.0
        return (SOURCE_PRIORITY.get(source, 0), confidence)
    
    # Nhóm theo text để xử lý duplicate
    text_to_rows = defaultdict(list)
    
    if not DATASET_PATH.exists():
        return [], []
    
    for line in DATASET_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
            label = row.get("label")
            text = row.get("text", "")

            # Chỉ train HOT/COLD (bỏ qua UNKNOWN và null)
            if label in ("HOT", "COLD") and text:
                text_to_rows[text].append(row)
        except Exception as e:
            print(f"[WARN] Error parsing line: {e}")
            continue
    
    # Xử lý duplicate: chọn row tốt nhất cho mỗi text
    X, y = [], []
    conflicts = []
    
    for text, rows in text_to_rows.items():
        if len(rows) == 1:
            # Không duplicate
            X.append(text)
            y.append(rows[0].get("label"))
        else:
            # Có duplicate - chọn row tốt nhất
            rows_sorted = sorted(rows, key=get_priority, reverse=True)
            best_row = rows_sorted[0]
            
            # Kiểm tra conflict
            labels = [r.get("label") for r in rows]
            unique_labels = set(labels)
            
            if len(unique_labels) > 1:
                # Có conflict - log để cảnh báo
                conflicts.append({
                    "text": text,
                    "labels": list(unique_labels),
                    "chosen": best_row.get("label"),
                    "source": best_row.get("source"),
                    "count": len(rows)
                })
            
            X.append(text)
            y.append(best_row.get("label"))
    
    # Cảnh báo nếu có conflict
    if conflicts:
        print(f"[WARN] Phát hiện {len(conflicts)} text có label conflict:")
        for conflict in conflicts[:5]:  # Chỉ hiển thị 5 đầu tiên
            print(f"  - {conflict['text']}: {conflict['labels']} → Chọn {conflict['chosen']} ({conflict['source']})")
        if len(conflicts) > 5:
            print(f"  ... và {len(conflicts) - 5} conflict khác")
        print(f"[TIP] Chạy 'python clean-dataset.py' để làm sạch dataset")
        print()
    
    return X, y

def main():
    """Train model từ dataset.jsonl"""
    X, y = read_labeled()
    
    if len(X) < 10:
        print(f"[!] Chua du mau co nhan HOT/COLD de train (hien {len(X)}). Can toi thieu 10 mau.")
        print("[TIP] Hay thu thap them du lieu bang cach goi /collect voi label HOT hoac COLD.")
        sys.exit(1)

    print(f"[INFO] Training voi {len(X)} mau...")
    print(f"   - HOT: {y.count('HOT')} mau")
    print(f"   - COLD: {y.count('COLD')} mau")

    # Pipeline: TF-IDF vectorizer + Logistic Regression
    model = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),  # Unigram và bigram
            min_df=1,  # Từ xuất hiện ít nhất 1 lần
            max_features=5000  # Giới hạn số features
        )),
        ("clf", LogisticRegression(
            max_iter=2000,
            random_state=42
        ))
    ])
    
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    
    print(f"[OK] Model da duoc luu: {MODEL_PATH}")
    print(f"[INFO] So mau train: {len(X)}")
    
    # Test accuracy
    score = model.score(X, y)
    print(f"[INFO] Training accuracy: {score:.2%}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[!] Bi huy boi nguoi dung (Ctrl+C)")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Loi khi train model: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
