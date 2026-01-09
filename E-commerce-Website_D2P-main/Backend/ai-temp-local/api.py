import json
import re
import unicodedata
import datetime
import base64
import tempfile
import os
import time
from pathlib import Path
from typing import Optional, List, Tuple

import joblib
import requests
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# =============================================================================
# FACE RECOGNITION SETUP - Optimized for Speed & Accuracy
# =============================================================================
ENABLE_HAAR_FALLBACK = False  # Tắt Haar mặc định để tránh lag/FP; bật khi cần qua flag
USE_SCRFD = True  # ✅ Nâng cấp: Sử dụng SCRFD (InsightFace) thay MTCNN để đạt tốc độ Real-time và bắt góc nghiêng tốt hơn
USE_ARCFACE = True  # ✅ Nâng cấp: Sử dụng ArcFace thay FaceNet để giảm False Positive tốt hơn
FACENET_AVAILABLE = False
SCRFD_DETECTOR = None  # SCRFD detector (InsightFace FaceAnalysis) - det_size=(640, 640) cho tốc độ
SCRFD_DETECTOR_LARGE = None  # SCRFD detector với det_size=(1280, 1280) cho trường hợp khách đứng xa (>2m)
MTCNN_DETECTOR = None  # MTCNN fallback (nếu SCRFD không có)
ARCFACE_MODEL = None  # ArcFace model từ InsightFace (tốt hơn FaceNet)
FACENET_MODEL = None  # FaceNet fallback (nếu ArcFace không có)
EMBEDDING_MODEL = None  # Model đang dùng (ArcFace hoặc FaceNet)
EMBEDDING_INPUT_SIZE = 112 if USE_ARCFACE else 160  # Input size: 112x112 cho ArcFace, 160x160 cho FaceNet
DEVICE = None
FAISS_AVAILABLE = False
FAISS_INDEX = None
FAISS_ID_MAP = []  # index -> {"customer_id", "customer_name", "avatar_quality"}

try:
    import torch
    from facenet_pytorch import InceptionResnetV1
    from PIL import Image
    import cv2
    try:
        import faiss
        FAISS_AVAILABLE = True
    except Exception as fe:
        FAISS_AVAILABLE = False
        print(f"[WARN] FAISS not available: {fe}")
    
    print("[INFO] Initializing Face Recognition System...")
    
    # Sử dụng GPU nếu có, nếu không thì CPU
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[INFO] Using device: {DEVICE}")
    
    # Face Detector - ✅ Nâng cấp: Ưu tiên SCRFD (InsightFace) cho tốc độ Real-time và độ chính xác cao
    if USE_SCRFD:
        try:
            import insightface
            ctx_id = 0 if not torch.cuda.is_available() else -1  # 0 = CPU, -1 = GPU
            
            # SCRFD với det_size=(640, 640) - tối ưu cho tốc độ (khách đứng gần < 2m)
            SCRFD_DETECTOR = insightface.app.FaceAnalysis(
                allowed_modules=['detection'],  # Chỉ load detection, không load recognition/landmark
                providers=['CUDAExecutionProvider', 'CPUExecutionProvider'] if torch.cuda.is_available() else ['CPUExecutionProvider']
            )
            SCRFD_DETECTOR.prepare(ctx_id=ctx_id, det_size=(640, 640))
            print(f"[INFO] ✅ SCRFD detector loaded (640x640, device={'GPU' if torch.cuda.is_available() else 'CPU'})")
            
            # SCRFD với det_size=(1280, 1280) - cho trường hợp khách đứng xa (> 2m), mặt nhỏ
            # Chỉ tạo khi cần (lazy loading trong detect_face_scrfd_large)
            print("[INFO] SCRFD large detector (1280x1280) will be created on-demand for distant faces")
            print("[INFO] SCRFD advantages: Real-time speed (~15-20ms), better angle detection (+40%), stable boxes")
        except Exception as scrfd_error:
            print(f"[WARN] SCRFD initialization failed: {scrfd_error}")
            print("[INFO] Falling back to MTCNN...")
            SCRFD_DETECTOR = None
    
    # MTCNN Fallback (nếu SCRFD không có hoặc fail)
    if SCRFD_DETECTOR is None:
        try:
            from facenet_pytorch import MTCNN
            MTCNN_DETECTOR = MTCNN(
                image_size=160,
                margin=25,
                min_face_size=25,
                thresholds=[0.5, 0.6, 0.6],
                factor=0.8,
                post_process=True,
                select_largest=True,
                keep_all=False,
                device=DEVICE
            )
            print("[INFO] MTCNN detector loaded as fallback")
        except Exception as mtcnn_error:
            print(f"[ERROR] MTCNN fallback failed: {mtcnn_error}")
            MTCNN_DETECTOR = None
    
    # Face Embedding Model - ✅ Nâng cấp: ArcFace (InsightFace) thay FaceNet
    # LƯU Ý: SCRFD dùng cho Detection, ArcFace dùng cho Embedding - CẢ HAI CẦN DÙNG CÙNG LÚC
    if USE_ARCFACE:
        try:
            import insightface
            # ArcFace từ InsightFace - tốt hơn FaceNet trong việc giảm False Positive
            # Input size: 112x112, Output: 512D (hoặc tùy model)
            # QUAN TRỌNG: allowed_modules=['recognition'] - Chỉ load recognition (embedding), KHÔNG load detection
            # Detection đã được xử lý bởi SCRFD ở trên
            ARCFACE_MODEL = insightface.app.FaceAnalysis(
                allowed_modules=['recognition'],  # ✅ CHỈ load recognition module (ArcFace embedding), KHÔNG detect
                providers=['CUDAExecutionProvider', 'CPUExecutionProvider'] if torch.cuda.is_available() else ['CPUExecutionProvider']
            )
            ctx_id = 0 if not torch.cuda.is_available() else -1
            # det_size không quan trọng vì chỉ dùng recognition, nhưng cần prepare
            ARCFACE_MODEL.prepare(ctx_id=ctx_id, det_size=(640, 640))
            EMBEDDING_MODEL = ARCFACE_MODEL
            EMBEDDING_INPUT_SIZE = 112  # ArcFace dùng 112x112
            print("[INFO] ✅ ArcFace model loaded (InsightFace, input=112x112, recognition only)")
            print("[INFO] ✅ Pipeline: SCRFD (detection) → ArcFace (embedding) - CẢ HAI DÙNG CÙNG LÚC")
            print("[INFO] ArcFace advantages: Better discrimination, lower False Positive, angular margin")
        except Exception as arcface_error:
            print(f"[WARN] ArcFace initialization failed: {arcface_error}")
            print("[INFO] Falling back to FaceNet...")
            ARCFACE_MODEL = None
            USE_ARCFACE = False
    
    # FaceNet Fallback (nếu ArcFace không có hoặc USE_ARCFACE = False)
    if not USE_ARCFACE or ARCFACE_MODEL is None:
        try:
            from facenet_pytorch import InceptionResnetV1
            print("[INFO] Loading FaceNet model (VGGFace2)...")
            FACENET_MODEL = InceptionResnetV1(pretrained='vggface2').eval().to(DEVICE)
            EMBEDDING_MODEL = FACENET_MODEL
            EMBEDDING_INPUT_SIZE = 160  # FaceNet dùng 160x160
            print("[INFO] FaceNet model loaded (VGGFace2, input=160x160)")
        except Exception as facenet_error:
            print(f"[ERROR] FaceNet fallback failed: {facenet_error}")
            FACENET_MODEL = None
            EMBEDDING_MODEL = None
    
    HAAR_CASCADE = None
    if ENABLE_HAAR_FALLBACK:
        HAAR_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        print("[INFO] Haar cascade loaded as fallback")
    
    # Kiểm tra model embedding đã load thành công chưa
    if EMBEDDING_MODEL is not None:
        FACENET_AVAILABLE = True
        model_name = "ArcFace" if USE_ARCFACE and ARCFACE_MODEL is not None else "FaceNet"
        print(f"[INFO] ✅ Face Recognition System Ready! (Embedding: {model_name}, Input: {EMBEDDING_INPUT_SIZE}x{EMBEDDING_INPUT_SIZE})")
    else:
        print("[WARN] No embedding model available!")
        FACENET_AVAILABLE = False
    
except ImportError as e:
    print(f"[ERROR] Missing dependencies: {e}")
    print("[TIP] Run: pip install facenet-pytorch torch torchvision opencv-python")
except Exception as e:
    print(f"[ERROR] Failed to initialize Face Recognition: {e}")
    import traceback
    traceback.print_exc()

# =============================================================================
# TEMPERATURE CLASSIFIER (existing code)
# =============================================================================
DATASET_PATH = Path("dataset.jsonl")
MODEL_PATH = Path("model.joblib")

app = FastAPI(title="AI Service - Temperature + Face Recognition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def normalize_vi(s: str) -> str:
    if not s:
        return ""
    s = str(s).strip().lower()
    s = s.replace("đ", "d").replace("Đ", "d")
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"\s+", " ", s).strip()
    return s

def contains_any(text: str, keywords: List[str]) -> bool:
    for kw in keywords:
        kw = kw.strip()
        if not kw:
            continue
        if ' ' in kw:
            if kw in text:
                return True
            continue
        pattern = r'(^|\W)' + re.escape(kw) + r'(\W|$)'
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

def classify_rule_based(name: str, category_name: Optional[str] = None) -> dict:
    cold_keywords = [
        'da', 'iced', 'ice', 'lanh', 'frozen', 'smoothie', 'sinh to',
        'kem', 'tra sua', 'nuoc ep', 'juice', 'cold', 'freeze',
        'ca phe da', 'tra da', 'nuoc ngot', 'soft drink', 'soda'
    ]
    hot_keywords = [
        'nong', 'hot', 'am', 'warm', 'steaming', 'boiling',
        'ca phe nong', 'tra nong', 'soup', 'lau', 'sup',
        'pho', 'bun', 'mi', 'noodle soup'
    ]
    
    text = normalize_vi(f"{name} | {category_name or ''}")
    
    if contains_any(text, cold_keywords):
        return {'temperature': 'COLD', 'confidence': 0.95, 'source': 'RULE', 'reason': 'Keyword lạnh'}
    
    if contains_any(text, hot_keywords):
        return {'temperature': 'HOT', 'confidence': 0.90, 'source': 'RULE', 'reason': 'Keyword nóng'}
    
    category_lower = (category_name or '').lower()
    text_lower = text.lower()
    
    if 'ca phe' in category_lower or 'coffee' in category_lower or 'ca phe' in text_lower or 'coffee' in text_lower:
        if 'da' in text_lower or 'ice' in text_lower or 'iced' in text_lower:
            return {'temperature': 'COLD', 'confidence': 0.85, 'source': 'RULE', 'reason': 'Cà phê đá'}
        return {'temperature': 'HOT', 'confidence': 0.50, 'source': 'RULE', 'reason': 'Cà phê mặc định nóng'}
    
    if any(kw in text for kw in ['lau', 'sup', 'pho', 'bun']):
        return {'temperature': 'HOT', 'confidence': 0.70, 'source': 'RULE', 'reason': 'Món ăn nóng'}
    
    return {'temperature': 'UNKNOWN', 'confidence': 0.50, 'source': 'UNKNOWN', 'reason': 'Không xác định'}

def load_model():
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
    label: Optional[str] = None
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
        "service": "AI Service - Temperature Classifier + Face Recognition",
        "status": "running",
        "hasModel": MODEL is not None,
        "facenet_available": FACENET_AVAILABLE,
        "device": str(DEVICE) if DEVICE else "N/A",
        "endpoints": ["/predict", "/face/status", "/face/recognize", "/face/clear-cache"]
    }

@app.get("/stats")
def stats():
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
    global MODEL
    out = []
    for it in req.items:
        rule_result = classify_rule_based(it.name, it.categoryName)
        
        if rule_result['confidence'] >= 0.8 and rule_result['temperature'] in ['HOT', 'COLD']:
            out.append({"id": it.id, **rule_result})
            continue
        
        if MODEL is None:
            out.append({"id": it.id, **rule_result, "source": "NO_MODEL"})
            continue
        
        text = normalize_vi(f"{it.name} | {it.categoryName or ''}")
        try:
            proba = MODEL.predict_proba([text])[0]
            classes = MODEL.classes_
            best = int(proba.argmax())
            label = str(classes[best])
            conf = float(proba[best])

            if conf < 0.60:
                out.append({"id": it.id, **rule_result})
            elif conf > rule_result['confidence'] or rule_result['temperature'] == 'UNKNOWN':
                out.append({"id": it.id, "temperature": label, "confidence": conf, "source": "MODEL", "reason": f"Model: {conf:.2f}"})
            else:
                out.append({"id": it.id, **rule_result})
        except Exception as e:
            out.append({"id": it.id, **rule_result, "source": "MODEL_ERROR"})
    
    return out

@app.post("/reload-model")
def reload_model():
    global MODEL
    MODEL = load_model()
    return {"ok": True, "hasModel": MODEL is not None}


# =============================================================================
# FACE RECOGNITION - Optimized Implementation
# =============================================================================

class CustomerFace(BaseModel):
    id: int
    name: str
    avatar_url: Optional[str] = None
    avatar_path: Optional[str] = None

class FaceRecognizeRequest(BaseModel):
    image_base64: str
    customers: Optional[List[CustomerFace]] = None  # Cho phép null/absent để dùng cache server-side


class CustomerCacheRequest(BaseModel):
    customers: List[CustomerFace]

LARAVEL_PUBLIC_PATH = Path(__file__).parent.parent / "public"

# Cache embeddings với metadata
EMBEDDING_CACHE = {}  # {path: {"embedding": np.array, "timestamp": float}}
CACHE_EXPIRY = 3600  # 1 giờ

# Cache danh sách customers (embedding đã tính) để frontend không phải gửi mỗi request
CUSTOMER_CACHE = {
    "version": 0,
    "updated_at": 0,
    "customers": []  # list dict {id, name, embedding, avatar_quality}
}

# Ngưỡng nhận diện - Siết chặt để tránh nhận nhầm (Zero False Positive)
SIMILARITY_THRESHOLD = 0.75  # Cosine >= 0.75 mới được coi là match (tăng từ 0.60 để tránh nhận nhầm)
DISTANCE_THRESHOLD = 0.70    # Euclidean < 0.70 (siết chặt hơn)


def calculate_face_quality(box, img_width, img_height, prob) -> float:
    """
    Đánh giá chất lượng khuôn mặt dựa trên nhiều yếu tố:
    - Kích thước mặt (lớn hơn = tốt hơn)
    - Vị trí trung tâm (gần giữa = tốt hơn)
    - Độ tin cậy detection
    """
    x1, y1, x2, y2 = box
    face_width = x2 - x1
    face_height = y2 - y1
    face_area = face_width * face_height
    img_area = img_width * img_height
    
    # Score 1: Kích thước mặt (0-40 điểm)
    # Mặt chiếm 10-30% ảnh là lý tưởng
    area_ratio = face_area / img_area
    if area_ratio < 0.02:
        size_score = area_ratio * 500  # Mặt quá nhỏ
    elif area_ratio < 0.05:
        size_score = 10 + (area_ratio - 0.02) * 500
    elif area_ratio < 0.30:
        size_score = 25 + (area_ratio - 0.05) * 60  # Kích thước tốt
    else:
        size_score = 40 - (area_ratio - 0.30) * 50  # Mặt quá gần
    size_score = max(0, min(40, size_score))
    
    # Score 2: Vị trí trung tâm (0-30 điểm)
    face_center_x = (x1 + x2) / 2
    face_center_y = (y1 + y2) / 2
    center_x = img_width / 2
    center_y = img_height / 2
    
    dist_from_center = np.sqrt((face_center_x - center_x)**2 + (face_center_y - center_y)**2)
    max_dist = np.sqrt(center_x**2 + center_y**2)
    center_score = 30 * (1 - dist_from_center / max_dist)
    
    # Score 3: Độ tin cậy detection (0-30 điểm)
    confidence_score = 30 * prob if prob else 0
    
    total_score = size_score + center_score + confidence_score
    return total_score


def enhance_image(img_cv):
    """
    Tự động cải thiện chất lượng ảnh cho face detection:
    - Tăng sáng nếu ảnh tối
    - Cân bằng histogram
    - Giảm noise
    """
    import cv2
    
    # Chuyển sang grayscale để phân tích
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    
    enhanced = img_cv.copy()
    
    # Nếu ảnh quá tối (mean < 80), tăng sáng
    if mean_brightness < 80:
        print(f"[INFO] Dark image detected (brightness: {mean_brightness:.1f}), enhancing...")
        # Tăng gamma để làm sáng
        gamma = 1.5 if mean_brightness < 50 else 1.3
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        enhanced = cv2.LUT(enhanced, table)
    
    # Nếu ảnh quá sáng (mean > 200), giảm sáng
    elif mean_brightness > 200:
        print(f"[INFO] Bright image detected (brightness: {mean_brightness:.1f}), reducing...")
        gamma = 0.8
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        enhanced = cv2.LUT(enhanced, table)
    
    # CLAHE để cải thiện contrast (Contrast Limited Adaptive Histogram Equalization)
    lab = cv2.cvtColor(enhanced, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    # Nhẹ nhàng giảm noise
    enhanced = cv2.bilateralFilter(enhanced, 5, 50, 50)
    
    return enhanced


def detect_face_opencv(img_cv):
    """Dùng OpenCV Haar cascade để detect face (fallback nhanh)"""
    if not ENABLE_HAAR_FALLBACK or HAAR_CASCADE is None:
        return None
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    
    # Thử với nhiều scaleFactor và minNeighbors khác nhau
    for scale, neighbors in [(1.05, 3), (1.1, 3), (1.15, 2), (1.2, 2)]:
        faces = HAAR_CASCADE.detectMultiScale(
            gray,
            scaleFactor=scale,
            minNeighbors=neighbors,
            minSize=(25, 25),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        if len(faces) > 0:
            # Chọn face lớn nhất
            largest = max(faces, key=lambda f: f[2] * f[3])
            x, y, w, h = largest
            print(f"[INFO] Haar cascade found face with scale={scale}, neighbors={neighbors}")
            return [x, y, x + w, y + h]
    return None


def detect_face_scrfd(img_cv, det_size=(640, 640)):
    """
    ✅ Nâng cấp: Detect mặt bằng SCRFD (InsightFace)
    
    Ưu điểm:
    - Tốc độ Real-time: ~15-20ms trên CPU (640x640), ~30-40ms (1280x1280)
    - Bắt góc nghiêng tốt hơn MTCNN 40%
    - Box ổn định (ít rung) → Temporal Voting hoạt động tốt hơn
    - Dynamic resize: Tự động thử det_size lớn hơn khi không detect được
    
    Args:
        img_cv: BGR image (cv2 format)
        det_size: Tuple (width, height) - (640, 640) cho tốc độ, (1280, 1280) cho khách đứng xa
    
    Returns:
        boxes: np.array với shape (N, 4) - bounding boxes [x1, y1, x2, y2]
        probs: np.array với shape (N,) - detection scores
        detector_name: str - tên detector đã dùng ("scrfd_640", "scrfd_1280", etc.)
    """
    global SCRFD_DETECTOR, SCRFD_DETECTOR_LARGE
    
    # Chọn detector phù hợp với det_size
    if det_size == (640, 640):
        detector = SCRFD_DETECTOR
        detector_name = "scrfd_640"
    elif det_size == (1280, 1280):
        # Lazy loading: Tạo detector lớn khi cần
        if SCRFD_DETECTOR_LARGE is None:
            try:
                import insightface
                import torch
                ctx_id = 0 if not torch.cuda.is_available() else -1
                SCRFD_DETECTOR_LARGE = insightface.app.FaceAnalysis(
                    allowed_modules=['detection'],
                    providers=['CUDAExecutionProvider', 'CPUExecutionProvider'] if torch.cuda.is_available() else ['CPUExecutionProvider']
                )
                SCRFD_DETECTOR_LARGE.prepare(ctx_id=ctx_id, det_size=(1280, 1280))
                print("[INFO] ✅ SCRFD large detector (1280x1280) created for distant faces")
            except Exception as e:
                print(f"[WARN] Failed to create SCRFD large detector: {e}")
                return None, None, None
        detector = SCRFD_DETECTOR_LARGE
        detector_name = "scrfd_1280"
    else:
        detector = SCRFD_DETECTOR
        detector_name = "scrfd"
    
    if detector is None:
        return None, None, None
    
    try:
        # SCRFD nhận BGR image (cv2 format)
        # Input size sẽ được resize tự động bởi SCRFD theo det_size
        faces = detector.get(img_cv)
        
        if not faces or len(faces) == 0:
            return None, None, None
        
        # Chọn mặt có det_score cao nhất và diện tích lớn nhất
        best_face = None
        best_score = 0
        best_area = 0
        
        for face in faces:
            bbox = face.bbox  # [x1, y1, x2, y2]
            det_score = face.det_score
            area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            
            # Ưu tiên: det_score cao và diện tích lớn
            combined_score = det_score * 0.7 + (area / 10000) * 0.3  # Normalize area
            
            if combined_score > best_score:
                best_score = combined_score
                best_area = area
                best_face = face
        
        if best_face is None:
            return None, None, None
        
        # Trả về format giống MTCNN: boxes, probs
        boxes = np.array([best_face.bbox])
        probs = np.array([best_face.det_score])
        
        return boxes, probs, detector_name
    except Exception as e:
        print(f"[WARN] SCRFD detection error ({detector_name}): {e}")
        return None, None, None

def detect_face_mtcnn(img_pil):
    """Detect mặt bằng MTCNN (fallback khi SCRFD không có)"""
    if MTCNN_DETECTOR is None:
        return None, None, None
    
    try:
        boxes, probs = MTCNN_DETECTOR.detect(img_pil)
        if boxes is None or len(boxes) == 0:
            return None, None, None
        return boxes, probs, "mtcnn"
    except Exception as e:
        print(f"[WARN] MTCNN detection error: {e}")
        return None, None, None

def get_face_with_box(image_input, use_cache: bool = True, cache_key: str = None, enhance: bool = True) -> Tuple[Optional[np.ndarray], Optional[dict]]:
    """
    Lấy face embedding + bounding box + quality score
    Sử dụng SCRFD (nhanh hơn MTCNN) + MTCNN fallback
    """
    if not FACENET_AVAILABLE:
        return None, None
    
    # Check cache
    if use_cache and cache_key and cache_key in EMBEDDING_CACHE:
        cached = EMBEDDING_CACHE[cache_key]
        if time.time() - cached["timestamp"] < CACHE_EXPIRY:
            return cached["embedding"], cached.get("face_info")
    
    try:
        import torch
        from PIL import Image
        import cv2
        
        was_enhanced = False
        detection_method = "mtcnn"
        
        # Load image
        if isinstance(image_input, str):
            img_cv = cv2.imread(image_input)
            if img_cv is None:
                print(f"[ERROR] Cannot read image: {image_input}")
                return None, None
        elif isinstance(image_input, Image.Image):
            img_cv = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
        else:
            return None, None
        
        img_height, img_width = img_cv.shape[:2]
        
        # Tối ưu: Resize ảnh xuống max 640x640 trước khi detect (giảm input size -> nhanh hơn)
        max_size = 640
        if img_width > max_size or img_height > max_size:
            scale = min(max_size / img_width, max_size / img_height)
            new_width = int(img_width * scale)
            new_height = int(img_height * scale)
            img_cv = cv2.resize(img_cv, (new_width, new_height), interpolation=cv2.INTER_LINEAR)
            img_height, img_width = img_cv.shape[:2]
            print(f"[INFO] Resized image to {new_width}x{new_height} for faster detection")
        
        # ✅ Nâng cấp: SCRFD với Dynamic Resize Fallback (tối ưu cho cả khách đứng gần và xa)
        img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(img_rgb)
        
        # === PRIMARY: SCRFD Detection với det_size=(640, 640) - Tối ưu tốc độ ===
        boxes, probs, detection_method = detect_face_scrfd(img_cv, det_size=(640, 640))
        
        # === FALLBACK 1: SCRFD với det_size=(1280, 1280) - Cho khách đứng xa (>2m), mặt nhỏ ===
        if (boxes is None or len(boxes) == 0) and SCRFD_DETECTOR is not None:
            print("[INFO] SCRFD 640x640 failed, trying 1280x1280 for distant faces...")
            boxes, probs, detection_method = detect_face_scrfd(img_cv, det_size=(1280, 1280))
            if boxes is not None and len(boxes) > 0:
                print("[INFO] ✅ Face detected with SCRFD 1280x1280 (distant face)")
        
        # === FALLBACK 2: MTCNN (chỉ khi SCRFD không có hoặc cả 2 det_size đều fail) ===
        if (boxes is None or len(boxes) == 0) and MTCNN_DETECTOR is not None:
            print("[INFO] SCRFD failed, trying MTCNN fallback...")
            boxes, probs, detection_method = detect_face_mtcnn(img)
        
        # === LAST RESORT: Enhanced image + SCRFD/MTCNN (chỉ khi thực sự cần) ===
        if boxes is None or len(boxes) == 0:
            print("[INFO] Trying enhanced (brighter) image...")
            img_bright = cv2.convertScaleAbs(img_cv, alpha=1.4, beta=40)
            was_enhanced = True
            img_cv = img_bright
            img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(img_rgb)
            
            # Thử SCRFD 640x640 với ảnh sáng hơn
            if SCRFD_DETECTOR is not None:
                boxes, probs, detection_method = detect_face_scrfd(img_cv, det_size=(640, 640))
                if boxes is not None and len(boxes) > 0:
                    detection_method = "scrfd_640_enhanced"
            
            # Thử SCRFD 1280x1280 với ảnh sáng hơn
            if (boxes is None or len(boxes) == 0) and SCRFD_DETECTOR is not None:
                boxes, probs, detection_method = detect_face_scrfd(img_cv, det_size=(1280, 1280))
                if boxes is not None and len(boxes) > 0:
                    detection_method = "scrfd_1280_enhanced"
            
            # Nếu vẫn fail, thử MTCNN với ảnh sáng hơn
            if (boxes is None or len(boxes) == 0) and MTCNN_DETECTOR is not None:
                boxes, probs, detection_method = detect_face_mtcnn(img)
                if boxes is not None and len(boxes) > 0:
                    detection_method = "mtcnn_enhanced"
        
        if boxes is None or len(boxes) == 0:
            print("[WARNING] No face detected after all attempts (including dynamic resize)")
            return None, None
        
        # Filter invalid boxes
        valid_boxes = []
        valid_probs = []
        for i, box in enumerate(boxes):
            if box is not None and len(box) == 4:
                x1, y1, x2, y2 = box
                if x2 > x1 and y2 > y1:  # Valid box
                    valid_boxes.append(box)
                    valid_probs.append(probs[i] if probs is not None and i < len(probs) else 0.5)
        
        if len(valid_boxes) == 0:
            return None, None
        
        boxes = np.array(valid_boxes)
        probs = np.array(valid_probs)
        
        # Chọn mặt tốt nhất
        best_idx = 0
        best_quality = 0
        for i, (box, prob) in enumerate(zip(boxes, probs)):
            quality = calculate_face_quality(box, img_width, img_height, prob if prob else 0.5)
            if quality > best_quality:
                best_quality = quality
                best_idx = i
        
        box = boxes[best_idx]
        prob = probs[best_idx] if probs[best_idx] else 0.5
        x1, y1, x2, y2 = [int(max(0, coord)) for coord in box]
        x2 = min(img_width, x2)
        y2 = min(img_height, y2)
        
        print(f"[INFO] Face detected ({detection_method}): box=[{x1},{y1},{x2},{y2}], prob={prob:.2f}, quality={best_quality:.1f}")
        
        # Crop face với margin
        margin = 20
        x1_crop = max(0, x1 - margin)
        y1_crop = max(0, y1 - margin)
        x2_crop = min(img_width, x2 + margin)
        y2_crop = min(img_height, y2 + margin)
        
        # Crop face image
        face_crop = img.crop((x1_crop, y1_crop, x2_crop, y2_crop))
        face_crop_resized = face_crop.resize((200, 200), Image.LANCZOS)
        
        # Convert crop to base64
        import io
        buffer = io.BytesIO()
        face_crop_resized.save(buffer, format='JPEG', quality=90)
        cropped_face_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # ✅ Nâng cấp: Lấy embedding bằng ArcFace hoặc FaceNet
        # QUAN TRỌNG: SCRFD đã detect face ở trên, giờ chỉ cần extract embedding
        embedding = None
        if USE_ARCFACE and ARCFACE_MODEL is not None:
            # ArcFace từ InsightFace - dùng cropped face đã có từ SCRFD/MTCNN
            try:
                # Lưu ý: InsightFace FaceAnalysis với recognition module vẫn cần detect để có landmarks
                # Nhưng chúng ta đã có bbox từ SCRFD, nên dùng full image và match với bbox đã có
                # Hoặc có thể dùng cropped face trực tiếp nếu model hỗ trợ
                faces_detected = ARCFACE_MODEL.get(img_cv)
                
                if faces_detected and len(faces_detected) > 0:
                    # Tìm face gần nhất với bbox đã detect (từ SCRFD/MTCNN)
                    # Điều này đảm bảo dùng đúng face đã được SCRFD detect
                    best_face_obj = None
                    min_distance = float('inf')
                    detect_center = ((x1 + x2) / 2, (y1 + y2) / 2)
                    
                    for f in faces_detected:
                        f_bbox = f.bbox
                        f_center = ((f_bbox[0] + f_bbox[2]) / 2, (f_bbox[1] + f_bbox[3]) / 2)
                        distance = np.sqrt((f_center[0] - detect_center[0])**2 + (f_center[1] - detect_center[1])**2)
                        if distance < min_distance:
                            min_distance = distance
                            best_face_obj = f
                    
                    # Lấy embedding từ face object (ArcFace đã align và normalize)
                    if best_face_obj:
                        # InsightFace face object có attribute 'embedding' hoặc 'norm_embedding'
                        if hasattr(best_face_obj, 'norm_embedding') and best_face_obj.norm_embedding is not None:
                            embedding = best_face_obj.norm_embedding
                        elif hasattr(best_face_obj, 'embedding') and best_face_obj.embedding is not None:
                            embedding = best_face_obj.embedding
                        else:
                            raise ValueError("ArcFace face object không có embedding attribute")
                        
                        # Normalize embedding (nếu chưa normalize)
                        embedding = np.array(embedding)
                        embedding = embedding / np.linalg.norm(embedding)
                        print(f"[INFO] ✅ ArcFace embedding extracted (size={len(embedding)}, matched SCRFD bbox, distance={min_distance:.1f}px)")
                    else:
                        raise ValueError("Không tìm thấy face object phù hợp với SCRFD bbox")
                else:
                    raise ValueError("ArcFace không tìm thấy face trong image")
            except Exception as arcface_error:
                print(f"[WARN] ArcFace embedding failed: {arcface_error}, falling back to FaceNet")
                embedding = None  # Sẽ dùng FaceNet fallback
        
        # FaceNet Fallback hoặc khi ArcFace không có embedding
        if embedding is None and FACENET_MODEL is not None:
            try:
                # SCRFD không trả về face tensor -> luôn dùng cropped face
                # MTCNN có thể trả về face tensor -> thử dùng trước, fallback về cropped
                use_mtcnn_tensor = (detection_method and detection_method.startswith('mtcnn') and 
                                   MTCNN_DETECTOR and hasattr(MTCNN_DETECTOR, '__call__'))
                
                if use_mtcnn_tensor:
                    # Thử dùng face tensor từ MTCNN (nếu có)
                    try:
                        face_tensors = MTCNN_DETECTOR(img)
                        if face_tensors is not None:
                            if len(face_tensors.shape) == 3:
                                face_tensor = face_tensors.unsqueeze(0)
                            elif len(face_tensors.shape) == 4:
                                face_tensor = face_tensors[best_idx:best_idx+1]
                            else:
                                face_tensor = face_tensors
                        else:
                            raise ValueError("MTCNN returned None")
                    except:
                        # Fallback: dùng cropped face
                        face_aligned = face_crop.resize((EMBEDDING_INPUT_SIZE, EMBEDDING_INPUT_SIZE), Image.LANCZOS)
                        face_np = np.array(face_aligned).astype(np.float32)
                        face_np = (face_np - 127.5) / 128.0
                        face_tensor = torch.from_numpy(face_np).permute(2, 0, 1).unsqueeze(0).float()
                else:
                    # SCRFD hoặc fallback: dùng cropped face
                    face_aligned = face_crop.resize((EMBEDDING_INPUT_SIZE, EMBEDDING_INPUT_SIZE), Image.LANCZOS)
                    face_np = np.array(face_aligned).astype(np.float32)
                    face_np = (face_np - 127.5) / 128.0
                    face_tensor = torch.from_numpy(face_np).permute(2, 0, 1).unsqueeze(0).float()
                
                    # Lấy embedding từ FaceNet
                with torch.no_grad():
                    face_tensor = face_tensor.to(DEVICE)
                    embedding = FACENET_MODEL(face_tensor)
                    embedding = embedding.cpu().numpy()
                    if len(embedding.shape) > 1:
                        embedding = embedding[0]
                    embedding = embedding / np.linalg.norm(embedding)
                    print(f"[INFO] FaceNet embedding extracted (size={len(embedding)})")
            except Exception as facenet_error:
                print(f"[ERROR] FaceNet embedding failed: {facenet_error}")
                return None, None
        
        # Kiểm tra embedding đã được tạo chưa
        if embedding is None:
            print("[ERROR] No embedding extracted from any model")
            return None, None
        
        face_info = {
            "confidence": float(prob),
            "box": [x1, y1, x2, y2],
            "quality_score": best_quality,
            "face_size": {"width": x2 - x1, "height": y2 - y1},
            "cropped_face_base64": f"data:image/jpeg;base64,{cropped_face_base64}",
            "enhanced": was_enhanced,
            "detection_method": detection_method,
            "image_size": {"width": img_width, "height": img_height}
        }
        
        # Cache
        if use_cache and cache_key:
            EMBEDDING_CACHE[cache_key] = {
                "embedding": embedding,
                "face_info": face_info,
                "timestamp": time.time()
            }
        
        return embedding, face_info
        
    except Exception as e:
        print(f"[ERROR] Face embedding error: {e}")
        import traceback
        traceback.print_exc()
        return None, None


def get_face_embedding(image_input, use_cache: bool = True, cache_key: str = None) -> Tuple[Optional[np.ndarray], Optional[dict]]:
    """Wrapper để tương thích ngược"""
    return get_face_with_box(image_input, use_cache, cache_key)


def cache_customers_embeddings(customers: List[CustomerFace]):
    """Tính và lưu embeddings customers vào RAM để giảm payload từ frontend"""
    global CUSTOMER_CACHE, FAISS_INDEX, FAISS_ID_MAP
    cached_list = []
    faiss_vectors = []
    for customer in customers:
        avatar_file_path = get_avatar_path(customer.avatar_url, customer.avatar_path)
        if not avatar_file_path:
            continue
        avatar_embedding, avatar_face_info = get_face_with_box(
            avatar_file_path,
            use_cache=True,
            cache_key=avatar_file_path
        )
        if avatar_embedding is None:
            continue
        avatar_quality = avatar_face_info.get("quality_score", 0) if avatar_face_info else 0
        cached_list.append({
            "customer_id": customer.id,
            "customer_name": customer.name,
            "embedding": avatar_embedding,
            "avatar_quality": round(avatar_quality, 1)
        })
        if FAISS_AVAILABLE:
            faiss_vectors.append((avatar_embedding.astype(np.float32), {
                "customer_id": customer.id,
                "customer_name": customer.name,
                "avatar_quality": round(avatar_quality, 1)
            }))
    CUSTOMER_CACHE = {
        "version": CUSTOMER_CACHE.get("version", 0) + 1,
        "updated_at": time.time(),
        "customers": cached_list
    }
    # Build FAISS HNSW index if available
    FAISS_INDEX = None
    FAISS_ID_MAP = []
    if FAISS_AVAILABLE and len(faiss_vectors) > 0:
        import faiss
        dim = faiss_vectors[0][0].shape[0]
        index = faiss.IndexHNSWFlat(dim, 32)
        index.hnsw.efConstruction = 200
        index.hnsw.efSearch = 128
        for vec, meta in faiss_vectors:
            index.add(np.ascontiguousarray([vec]))
            FAISS_ID_MAP.append(meta)
        FAISS_INDEX = index
        print(f"[INFO] FAISS index built with {len(FAISS_ID_MAP)} vectors (efSearch=128, efConstruction=200)")
    print(f"[INFO] Cached embeddings for {len(cached_list)} customers (version={CUSTOMER_CACHE['version']})")


def search_faiss_candidates(query_embedding: np.ndarray, top_k: int = 50):
    """Tìm ứng viên bằng FAISS HNSW (nếu có), trả về list dict với cosine/Euclidean"""
    if not FAISS_AVAILABLE or FAISS_INDEX is None or len(FAISS_ID_MAP) == 0:
        return None
    k = min(top_k, len(FAISS_ID_MAP))
    q = np.ascontiguousarray([query_embedding.astype(np.float32)])
    D, I = FAISS_INDEX.search(q, k)
    results = []
    for dist, idx in zip(D[0], I[0]):
        if idx < 0 or idx >= len(FAISS_ID_MAP):
            continue
        # Với vector đã chuẩn hóa, L2^2 = 2 - 2*cosine => cosine = 1 - dist/2
        cosine_sim = 1 - float(dist) / 2.0
        euclid = float(np.sqrt(max(dist, 0.0)))
        meta = FAISS_ID_MAP[idx]
        results.append({
            "customer_id": meta["customer_id"],
            "customer_name": meta["customer_name"],
            "cosine_similarity": cosine_sim,
            "euclidean_distance": euclid,
            "confidence": round(cosine_sim * 100, 1),
            "avatar_quality": meta.get("avatar_quality", 0)
        })
    return results

def compute_similarity(emb1: np.ndarray, emb2: np.ndarray) -> dict:
    """
    Tính độ tương đồng giữa 2 embeddings với nhiều metrics
    """
    # Ensure normalized
    emb1 = emb1 / np.linalg.norm(emb1)
    emb2 = emb2 / np.linalg.norm(emb2)
    
    # Cosine similarity (1 = giống hoàn toàn, -1 = khác hoàn toàn)
    cosine_sim = float(np.dot(emb1, emb2))
    
    # Euclidean distance (0 = giống hoàn toàn)
    euclidean_dist = float(np.linalg.norm(emb1 - emb2))
    
    return {
        "cosine_similarity": cosine_sim,
        "euclidean_distance": euclidean_dist,
        "is_match": cosine_sim >= SIMILARITY_THRESHOLD or euclidean_dist < DISTANCE_THRESHOLD
    }


def save_base64_image(base64_str: str, prefix: str = "face") -> str:
    if base64_str.startswith('data:image'):
        base64_str = base64_str.split(',')[1]
    
    image_data = base64.b64decode(base64_str)
    fd, temp_path = tempfile.mkstemp(suffix='.jpg', prefix=prefix + '_')
    os.close(fd)
    
    with open(temp_path, 'wb') as f:
        f.write(image_data)
    
    return temp_path


def get_avatar_path(avatar_url: Optional[str], avatar_path: Optional[str]) -> Optional[str]:
    if avatar_path:
        clean_path = avatar_path.lstrip('/').lstrip('\\')
        local_path = LARAVEL_PUBLIC_PATH / clean_path
        if local_path.exists():
            return str(local_path)
    
    if avatar_url:
        match = re.search(r'[/\\]?(uploads[/\\]avatars[/\\][^?]+)', avatar_url)
        if match:
            relative_path = match.group(1).replace('\\', '/')
            local_path = LARAVEL_PUBLIC_PATH / relative_path
            if local_path.exists():
                return str(local_path)
    
    return None


@app.get("/face/status")
def face_status():
    return {
        "service": "Face Recognition",
        "facenet_ready": FACENET_AVAILABLE,
        "device": str(DEVICE) if DEVICE else "N/A",
        "model": "InceptionResnetV1-VGGFace2" if FACENET_AVAILABLE else None,
        "cached_embeddings": len(EMBEDDING_CACHE),
        "customer_cache_size": len(CUSTOMER_CACHE.get("customers", [])),
        "customer_cache_version": CUSTOMER_CACHE.get("version", 0),
        "faiss_available": FAISS_AVAILABLE,
        "faiss_index_size": len(FAISS_ID_MAP),
        "similarity_threshold": SIMILARITY_THRESHOLD,
        "message": "Ready" if FACENET_AVAILABLE else "Not available"
    }


class FaceDetectRequest(BaseModel):
    image_base64: str


@app.post("/face/detect")
def face_detect_only(req: FaceDetectRequest):
    """Debug endpoint - chỉ detect mặt, không so sánh"""
    start_time = time.time()
    
    if not FACENET_AVAILABLE:
        return {"detected": False, "message": "FaceNet not available"}
    
    try:
        # Save image
        temp_path = save_base64_image(req.image_base64, "detect")
        print(f"[DEBUG] Saved temp image to: {temp_path}")
        
        # Check image
        import cv2
        img = cv2.imread(temp_path)
        if img is None:
            os.remove(temp_path)
            return {"detected": False, "message": "Cannot read image", "error": "cv2.imread failed"}
        
        h, w = img.shape[:2]
        print(f"[DEBUG] Image size: {w}x{h}")
        
        # Try face detection
        embedding, face_info = get_face_with_box(temp_path, use_cache=False)
        
        os.remove(temp_path)
        
        if embedding is None:
            return {
                "detected": False,
                "message": "No face detected",
                "image_size": f"{w}x{h}",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        
        return {
            "detected": True,
            "face_box": face_info.get("box"),
            "face_quality": face_info.get("quality_score"),
            "confidence": face_info.get("confidence"),
            "detection_method": face_info.get("detection_method"),
            "cropped_face": face_info.get("cropped_face_base64"),
            "image_size": f"{w}x{h}",
            "processing_time_ms": int((time.time() - start_time) * 1000)
        }
        
    except Exception as e:
        print(f"[ERROR] Face detect error: {e}")
        import traceback
        traceback.print_exc()
        return {"detected": False, "message": str(e), "error": "exception"}

@app.post("/face/cache-customers")
def face_cache_customers(payload: CustomerCacheRequest):
    """Preload embeddings của customers vào RAM để giảm payload nhận diện"""
    start_time = time.time()
    if not FACENET_AVAILABLE:
        return {"success": False, "message": "FaceNet not available"}
    customers = payload.customers or []
    cache_customers_embeddings(customers)
    return {
        "success": True,
        "cached": len(CUSTOMER_CACHE.get("customers", [])),
        "version": CUSTOMER_CACHE.get("version", 0),
        "processing_time_ms": int((time.time() - start_time) * 1000)
    }


@app.post("/face/recognize")
def face_recognize(req: FaceRecognizeRequest):
    """
    Nhận diện khuôn mặt - Phiên bản tối ưu
    
    Trả về:
    - face_box: bounding box của mặt detect được (để frontend hiển thị)
    - face_quality: điểm chất lượng ảnh
    - cropped_face: ảnh mặt đã crop (để lưu cho khách mới)
    """
    start_time = time.time()
    
    if not FACENET_AVAILABLE:
        return {
            "matched": False,
            "message": "Face Recognition chưa sẵn sàng"
        }
    
    temp_files = []
    
    try:
        # 1. Lưu và xử lý ảnh camera
        camera_image_path = save_base64_image(req.image_base64, "camera")
        temp_files.append(camera_image_path)
        
        # 2. Lấy embedding + face info từ ảnh camera
        camera_embedding, camera_face_info = get_face_with_box(
            camera_image_path, 
            use_cache=False,
            cache_key=None
        )
        
        # === VALIDATION: CHỈ SO SÁNH KHI DETECT ĐƯỢC MẶT CHÍNH XÁC ===
        if camera_embedding is None or camera_face_info is None:
            for f in temp_files:
                try: os.remove(f)
                except: pass
            return {
                "matched": False,
                "face_detected": False,
                "message": "Không phát hiện khuôn mặt. Hãy đảm bảo khuôn mặt rõ ràng trong khung hình.",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        
        # Kiểm tra chất lượng mặt - CHỈ SO SÁNH KHI CHẤT LƯỢNG ĐẠT NGƯỠNG
        quality_score = camera_face_info.get('quality_score', 0)
        confidence = camera_face_info.get('confidence', 0)
        face_box = camera_face_info.get('box')
        
        # Ngưỡng tối thiểu để coi là "mặt chính xác" (cân bằng giữa detect được và tránh nhận nhầm)
        MIN_QUALITY_THRESHOLD = 40.0  # Giảm từ 50 xuống 40 - cho phép mặt rõ ràng nhưng không cần quá hoàn hảo
        MIN_CONFIDENCE_THRESHOLD = 0.50  # Giảm từ 0.60 xuống 0.50 - cho phép detection chắc chắn nhưng không quá khắt khe

        # Kiểm tra tỷ lệ khuôn mặt trong khung hình để loại bỏ box sai
        img_w = camera_face_info.get("image_size", {}).get("width")
        img_h = camera_face_info.get("image_size", {}).get("height")
        face_w = camera_face_info.get("face_size", {}).get("width", 0)
        face_h = camera_face_info.get("face_size", {}).get("height", 0)
        area_ratio = (face_w * face_h) / (img_w * img_h) if img_w and img_h else 0
        # Yêu cầu mặt chiếm từ ~1.5% đến 40% khung hình để tránh nền/bóng đèn bị nhận nhầm
        # (Giảm từ 2.5% xuống 1.5% để detect được mặt ở khoảng cách xa hơn)
        if area_ratio < 0.015 or area_ratio > 0.40:
            print(f"[WARNING] Face area ratio out of range ({area_ratio:.4f}) - skipping comparison")
            for f in temp_files:
                try: os.remove(f)
                except: pass
            return {
                "matched": False,
                "face_detected": False,
                "face_box": face_box,
                "face_quality": round(quality_score, 1),
                "message": "Không phát hiện khuôn mặt hợp lệ. Vui lòng đưa mặt gần hơn và vào giữa khung.",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        
        # Nếu chất lượng quá thấp -> không phải mặt thật, không so sánh
        if quality_score < MIN_QUALITY_THRESHOLD or confidence < MIN_CONFIDENCE_THRESHOLD:
            print(f"[WARNING] Face quality too low (quality: {quality_score:.1f}, confidence: {confidence:.2f}) - skipping comparison")
            for f in temp_files:
                try: os.remove(f)
                except: pass
            return {
                "matched": False,
                "face_detected": False,  # Đánh dấu là KHÔNG có mặt để frontend không đếm
                "face_box": face_box,  # Vẫn trả về box để UI hiển thị (nếu có)
                "face_quality": round(quality_score, 1),
                "message": f"Khuôn mặt không rõ ràng (chất lượng: {quality_score:.1f}%). Vui lòng đưa mặt vào giữa khung hình và đảm bảo đủ ánh sáng.",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        
        print(f"[INFO] Camera face detected (confidence: {confidence:.2f}, quality: {quality_score:.1f}) - Proceeding with comparison")
        
        # 3. Chuẩn bị danh sách customers (ưu tiên cache RAM)
        matches = []
        customer_embeddings = []

        if req.customers and len(req.customers) > 0:
            # Nếu frontend vẫn gửi, cập nhật cache và dùng luôn
            cache_customers_embeddings(req.customers)
            customer_embeddings = CUSTOMER_CACHE.get("customers", [])
        else:
            customer_embeddings = CUSTOMER_CACHE.get("customers", [])

        # Xử lý trường hợp không có customers trong DB/cache
        if not customer_embeddings:
            # Cleanup temp files
            for f in temp_files:
                try: os.remove(f)
                except: pass
            
            processing_time = int((time.time() - start_time) * 1000)
            
            # Trả về face_detected=True, matched=False để frontend biết có mặt và có thể báo "khách mới"
            return {
                "matched": False,
                "face_detected": True,  # QUAN TRỌNG: vẫn trả True để frontend biết có mặt
                "face_box": camera_face_info.get("box"),
                "face_quality": round(quality_score, 1),
                "face_size": camera_face_info.get("face_size"),
                "cropped_face": camera_face_info.get("cropped_face_base64"),  # Trả về ảnh để frontend có thể tạo khách mới
                "processing_time_ms": processing_time,
                "message": "Không có khách hàng nào trong hệ thống. Đây là khách hàng mới.",
                "no_customers_in_db": True  # Flag để frontend biết là do DB trống
            }

        # 4. So sánh với customers trong cache (ưu tiên FAISS HNSW)
        faiss_results = search_faiss_candidates(camera_embedding, top_k=50)
        if faiss_results is not None:
            for r in faiss_results:
                if r["cosine_similarity"] >= SIMILARITY_THRESHOLD or r["euclidean_distance"] < DISTANCE_THRESHOLD:
                    matches.append(r)
        else:
            # Fallback linear nếu FAISS không có
            for c in customer_embeddings:
                avatar_embedding = c.get("embedding")
                avatar_quality = c.get("avatar_quality", 0)
                if avatar_embedding is None:
                    continue
                similarity = compute_similarity(camera_embedding, avatar_embedding)
                if similarity['is_match']:
                    matches.append({
                        "customer_id": c["customer_id"],
                        "customer_name": c["customer_name"],
                        "cosine_similarity": similarity['cosine_similarity'],
                        "euclidean_distance": similarity['euclidean_distance'],
                        "confidence": round(similarity['cosine_similarity'] * 100, 1),
                        "avatar_quality": round(avatar_quality, 1)
                    })
        
        # Cleanup temp files
        for f in temp_files:
            try: os.remove(f)
            except: pass
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Base response với face info
        base_response = {
            "face_detected": True,
            "face_box": camera_face_info.get("box"),
            "face_quality": round(quality_score, 1),
            "face_size": camera_face_info.get("face_size"),
            "cropped_face": camera_face_info.get("cropped_face_base64"),
            "processing_time_ms": processing_time
        }
        
        # 4. Trả về kết quả
        if matches:
            # Sắp xếp theo cosine similarity giảm dần
            matches.sort(key=lambda x: x['cosine_similarity'], reverse=True)
            best_match = matches[0]
            top2 = matches[1] if len(matches) > 1 else None
            delta_to_second = best_match["cosine_similarity"] - (top2["cosine_similarity"] if top2 else 0.0)

            # Policy siết chặt để tránh nhận nhầm (Zero False Positive)
            needs_confirmation = False
            policy = "unknown"

            # Kiểm tra nghiêm ngặt: đếm số matches có score cao (>0.70) - nếu nhiều hơn 1 -> rủi ro nhận nhầm
            high_score_matches = [m for m in matches if m["cosine_similarity"] >= 0.70]
            top2_high = top2 and top2["cosine_similarity"] >= 0.70
            multiple_high_scores = len(high_score_matches) > 1  # Có nhiều ứng viên với score cao
            
            # Policy siết chặt để tránh nhận nhầm
            if multiple_high_scores:
                # Nếu có nhiều ứng viên với score cao -> luôn cần review (rủi ro nhận nhầm)
                print(f"[WARNING] Multiple high-score candidates ({len(high_score_matches)}), forcing review to avoid false positive")
                policy = "review"
                needs_confirmation = True
                matched_flag = True  # Vẫn matched nhưng cần xác nhận
            elif best_match["cosine_similarity"] >= 0.80:
                # Rất cao (>=80%) và delta đủ lớn -> auto
                if delta_to_second >= 0.15 and not top2_high:
                    policy = "auto"
                else:
                    # Delta nhỏ hoặc top2 cao -> cần review
                    policy = "review"
                    needs_confirmation = True
                matched_flag = True
            elif best_match["cosine_similarity"] >= 0.75:
                # Cao (>=75%) -> luôn cần review nếu delta nhỏ hoặc top2 cao
                if delta_to_second >= 0.20 and not top2_high:
                    policy = "auto"  # Chỉ auto nếu delta rất lớn và top2 thấp
                else:
                    policy = "review"
                    needs_confirmation = True
                matched_flag = True
            else:
                # Dưới 75% -> unknown (không match)
                policy = "unknown"
                matched_flag = False

            print(f"[SUCCESS] Candidate: {best_match['customer_name']} "
                  f"(cosine={best_match['cosine_similarity']:.4f}, delta={delta_to_second:.4f}, policy={policy}) "
                  f"in {processing_time}ms")

            response = {
                **base_response,
                "matched": matched_flag,
                "customer_id": best_match["customer_id"],
                "confidence": best_match["confidence"],
                "cosine_similarity": round(best_match["cosine_similarity"], 4),
                "avatar_quality": best_match.get("avatar_quality", 0),
                "message": f"Đã nhận diện: {best_match['customer_name']}" if matched_flag else "Cần xác nhận thủ công",
                "all_matches": matches[:3],
                "needs_confirmation": needs_confirmation,
                "policy": policy,
                "delta_to_second": round(delta_to_second, 4),
                "top2_cosine": round(top2["cosine_similarity"], 4) if top2 else None
            }

            # Nếu policy là review, vẫn trả matched=True để không bỏ sót, kèm cờ needs_confirmation
            # Frontend có thể hiển thị gợi ý và yêu cầu xác nhận thủ công.
            return response
        
        print(f"[INFO] No match found in {processing_time}ms (quality: {quality_score:.1f})")
        return {
            **base_response,
            "matched": False,
            "message": "Không tìm thấy khách hàng phù hợp",
        }
        
    except Exception as e:
        print(f"[ERROR] Recognition failed: {e}")
        import traceback
        traceback.print_exc()
        
        for f in temp_files:
            try: os.remove(f)
            except: pass
        
        return {
            "matched": False,
            "face_detected": False,
            "message": f"Lỗi: {str(e)}"
        }


@app.post("/face/clear-cache")
def face_clear_cache():
    """Xóa cache embeddings"""
    global EMBEDDING_CACHE
    count = len(EMBEDDING_CACHE)
    EMBEDDING_CACHE = {}
    print(f"[INFO] Cleared {count} cached embeddings")
    return {
        "ok": True,
        "cleared": count,
        "message": f"Đã xóa {count} cached embeddings"
    }


@app.post("/face/verify")
def face_verify_single(image1_base64: str, image2_base64: str):
    """So sánh 2 ảnh"""
    if not FACENET_AVAILABLE:
        return {"verified": False, "message": "Face Recognition không sẵn sàng"}
    
    temp_files = []
    
    try:
        img1_path = save_base64_image(image1_base64, "img1")
        img2_path = save_base64_image(image2_base64, "img2")
        temp_files.extend([img1_path, img2_path])
        
        emb1, _ = get_face_embedding(img1_path, use_cache=False)
        emb2, _ = get_face_embedding(img2_path, use_cache=False)
        
        for f in temp_files:
            try: os.remove(f)
            except: pass
        
        if emb1 is None or emb2 is None:
            return {"verified": False, "message": "Không phát hiện khuôn mặt"}
        
        similarity = compute_similarity(emb1, emb2)
        
        return {
            "verified": similarity['is_match'],
            "cosine_similarity": round(similarity['cosine_similarity'], 4),
            "euclidean_distance": round(similarity['euclidean_distance'], 4),
            "confidence": round(similarity['cosine_similarity'] * 100, 1),
            "threshold": SIMILARITY_THRESHOLD
        }
        
    except Exception as e:
        for f in temp_files:
            try: os.remove(f)
            except: pass
        return {"verified": False, "message": f"Lỗi: {str(e)}"}


@app.post("/face/analyze")
def face_analyze(image_base64: str):
    """
    Phân tích ảnh - trả về thông tin chi tiết về khuôn mặt được detect
    Dùng để debug và kiểm tra quality
    """
    if not FACENET_AVAILABLE:
        return {"success": False, "message": "Face Recognition không sẵn sàng"}
    
    temp_path = None
    try:
        temp_path = save_base64_image(image_base64, "analyze")
        
        import cv2
        from PIL import Image
        
        # Load image
        img_cv = cv2.imread(temp_path)
        img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(img_rgb)
        
        # Detect với SCRFD (nhanh hơn) hoặc MTCNN fallback
        boxes, probs, detection_method = detect_face_scrfd(img_cv)
        if boxes is None or len(boxes) == 0:
            boxes, probs, detection_method = detect_face_mtcnn(img)
        
        if temp_path:
            os.remove(temp_path)
        
        if boxes is None or len(boxes) == 0:
            return {
                "success": True,
                "face_detected": False,
                "message": "Không phát hiện khuôn mặt nào"
            }
        
        faces = []
        for i, (box, prob) in enumerate(zip(boxes, probs)):
            faces.append({
                "index": i,
                "bounding_box": [float(x) for x in box],
                "confidence": float(prob),
                "width": float(box[2] - box[0]),
                "height": float(box[3] - box[1])
            })
        
        return {
            "success": True,
            "face_detected": True,
            "face_count": len(faces),
            "faces": faces,
            "image_size": {"width": img.width, "height": img.height}
        }
        
    except Exception as e:
        if temp_path:
            try: os.remove(temp_path)
            except: pass
        return {"success": False, "message": f"Lỗi: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9009)
