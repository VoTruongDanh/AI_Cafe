import json
import re
import unicodedata
import datetime
from pathlib import Path
from typing import Optional, List

import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATASET_PATH = Path("dataset.jsonl")
MODEL_PATH = Path("model.joblib")

app = FastAPI(title="Local AI Temperature Classifier")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

def load_model():
    """Load model từ file"""
    if MODEL_PATH.exists():
        try:
            return joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Error loading model: {e}")
            return None
    return None

MODEL = load_model()

class CollectItem(BaseModel):
    name: str
    categoryName: Optional[str] = None
    label: Optional[str] = None  # HOT/COLD/UNKNOWN hoặc null
    source: str = "UNKNOWN"
    confidence: Optional[float] = None

class PredictItem(BaseModel):
    id: Optional[int] = None
    name: str
    categoryName: Optional[str] = None

class PredictRequest(BaseModel):
    items: List[PredictItem]

@app.get("/")
def root():
    return {
        "service": "Local AI Temperature Classifier",
        "status": "running",
        "hasModel": MODEL is not None,
        "endpoints": ["/collect", "/predict", "/reload-model", "/stats"]
    }

@app.get("/stats")
def stats():
    """Thống kê dataset"""
    count = 0
    labeled_count = 0
    hot_count = 0
    cold_count = 0
    
    if DATASET_PATH.exists():
        for line in DATASET_PATH.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                row = json.loads(line)
                count += 1
                label = row.get("label")
                if label:
                    labeled_count += 1
                    if label == "HOT":
                        hot_count += 1
                    elif label == "COLD":
                        cold_count += 1
            except:
                continue
    
    return {
        "total_samples": count,
        "labeled_samples": labeled_count,
        "hot_samples": hot_count,
        "cold_samples": cold_count,
        "has_model": MODEL is not None
    }

@app.post("/collect")
def collect(item: CollectItem):
    """Thu thập mẫu để train (append vào dataset.jsonl)"""
    text = normalize_vi(f"{item.name} | {item.categoryName or ''}")
    row = {
        "text": text,
        "label": item.label,
        "source": item.source,
        "confidence": item.confidence,
        "ts": datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).isoformat()
    }
    DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DATASET_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
    return {"ok": True, "message": "Sample collected"}

@app.post("/predict")
def predict(req: PredictRequest):
    """Dự đoán nhiệt độ cho danh sách sản phẩm"""
    global MODEL
    
    if MODEL is None:
        # Chưa có model thì trả UNKNOWN hết
        return [
            {
                "id": it.id,
                "temperature": "UNKNOWN",
                "confidence": 0.0,
                "source": "NO_MODEL",
                "reason": "Model chưa được train"
            }
            for it in req.items
        ]

    out = []
    for it in req.items:
        text = normalize_vi(f"{it.name} | {it.categoryName or ''}")
        try:
            proba = MODEL.predict_proba([text])[0]
            classes = MODEL.classes_
            best = int(proba.argmax())
            label = str(classes[best])
            conf = float(proba[best])

            # Ngưỡng an toàn: confidence < 0.60 => UNKNOWN
            # Hạ xuống 0.60 vì model đã được train với accuracy 97.14%
            if conf < 0.60:
                out.append({
                    "id": it.id,
                    "temperature": "UNKNOWN",
                    "confidence": conf,
                    "source": "MODEL",
                    "reason": f"Model confidence thấp ({conf:.2f})"
                })
            else:
                out.append({
                    "id": it.id,
                    "temperature": label,
                    "confidence": conf,
                    "source": "MODEL",
                    "reason": f"Model dự đoán với confidence {conf:.2f}"
                })
        except Exception as e:
            out.append({
                "id": it.id,
                "temperature": "UNKNOWN",
                "confidence": 0.0,
                "source": "MODEL_ERROR",
                "reason": str(e)
            })
    
    return out

@app.post("/reload-model")
def reload_model():
    """Reload model từ file (sau khi train)"""
    global MODEL
    MODEL = load_model()
    return {
        "ok": True,
        "hasModel": MODEL is not None,
        "message": "Model reloaded" if MODEL else "No model found"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9009)
