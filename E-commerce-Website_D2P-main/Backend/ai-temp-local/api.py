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
FACENET_AVAILABLE = False
MTCNN_DETECTOR = None
FACENET_MODEL = None
DEVICE = None

try:
    import torch
    from facenet_pytorch import MTCNN, InceptionResnetV1
    from PIL import Image
    import cv2
    
    print("[INFO] Initializing Face Recognition System...")
    
    # Sử dụng GPU nếu có, nếu không thì CPU
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[INFO] Using device: {DEVICE}")
    
    # MTCNN để detect khuôn mặt - Cấu hình RẤT NHẠY
    MTCNN_DETECTOR = MTCNN(
        image_size=160,
        margin=30,
        min_face_size=20,  # Detect mặt rất nhỏ
        thresholds=[0.4, 0.5, 0.5],  # Ngưỡng RẤT THẤP để nhạy hơn
        factor=0.709,
        post_process=True,
        select_largest=False,  # Lấy tất cả faces
        keep_all=True,  # Giữ tất cả để chọn best
        device=DEVICE
    )
    
    # FaceNet model - VGGFace2 pretrained (chính xác cao cho nhận diện)
    print("[INFO] Loading FaceNet model (VGGFace2)...")
    FACENET_MODEL = InceptionResnetV1(pretrained='vggface2').eval().to(DEVICE)
    
    # Load OpenCV Haar cascade làm fallback
    HAAR_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    print("[INFO] Haar cascade loaded as fallback")
    
    FACENET_AVAILABLE = True
    print("[INFO] Face Recognition System Ready!")
    
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
    customers: List[CustomerFace]

LARAVEL_PUBLIC_PATH = Path(__file__).parent.parent / "public"

# Cache embeddings với metadata
EMBEDDING_CACHE = {}  # {path: {"embedding": np.array, "timestamp": float}}
CACHE_EXPIRY = 3600  # 1 giờ

# Ngưỡng nhận diện - ĐÃ TINH CHỈNH
SIMILARITY_THRESHOLD = 0.55  # Cosine similarity >= 0.55 = match (giảm từ 0.6)
DISTANCE_THRESHOLD = 0.9     # Euclidean distance < 0.9 = match (backup metric)


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


def get_face_with_box(image_input, use_cache: bool = True, cache_key: str = None, enhance: bool = True) -> Tuple[Optional[np.ndarray], Optional[dict]]:
    """
    Lấy face embedding + bounding box + quality score
    Sử dụng MTCNN + OpenCV Haar cascade fallback
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
        
        # Enhance ảnh nếu cần
        if enhance:
            img_cv_original = img_cv.copy()
            img_cv = enhance_image(img_cv)
            was_enhanced = not np.array_equal(img_cv, img_cv_original)
        
        img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(img_rgb)
        
        # === TRY 1: MTCNN Detection ===
        boxes, probs = MTCNN_DETECTOR.detect(img)
        
        # === TRY 2: Haar cascade (nhanh hơn MTCNN) ===
        if boxes is None or len(boxes) == 0:
            print("[INFO] MTCNN failed, trying Haar cascade...")
            haar_box = detect_face_opencv(img_cv)
            if haar_box is not None:
                boxes = np.array([haar_box])
                probs = np.array([0.8])
                detection_method = "haar"
        
        # === TRY 3: Ảnh sáng hơn + MTCNN ===
        if boxes is None or len(boxes) == 0:
            print("[INFO] Trying brighter image + MTCNN...")
            img_bright = cv2.convertScaleAbs(img_cv, alpha=1.4, beta=40)
            img_bright_rgb = cv2.cvtColor(img_bright, cv2.COLOR_BGR2RGB)
            img_bright_pil = Image.fromarray(img_bright_rgb)
            boxes, probs = MTCNN_DETECTOR.detect(img_bright_pil)
            if boxes is not None and len(boxes) > 0:
                was_enhanced = True
                img = img_bright_pil
                img_cv = img_bright
                detection_method = "mtcnn_bright"
        
        # === TRY 4: Ảnh sáng hơn + Haar cascade ===
        if boxes is None or len(boxes) == 0:
            print("[INFO] Trying brighter image + Haar...")
            if not was_enhanced:
                img_bright = cv2.convertScaleAbs(img_cv, alpha=1.4, beta=40)
            haar_box = detect_face_opencv(img_bright if was_enhanced else cv2.convertScaleAbs(img_cv, alpha=1.4, beta=40))
            if haar_box is not None:
                boxes = np.array([haar_box])
                probs = np.array([0.7])
                detection_method = "haar_bright"
        
        # === TRY 5: Histogram equalization + Haar ===
        if boxes is None or len(boxes) == 0:
            print("[INFO] Trying histogram equalization...")
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            equalized = cv2.equalizeHist(gray)
            equalized_bgr = cv2.cvtColor(equalized, cv2.COLOR_GRAY2BGR)
            haar_box = detect_face_opencv(equalized_bgr)
            if haar_box is not None:
                boxes = np.array([haar_box])
                probs = np.array([0.6])
                detection_method = "haar_eq"
        
        # === TRY 6: Resize nhỏ hơn + Haar (detect mặt xa camera) ===
        if boxes is None or len(boxes) == 0:
            print("[INFO] Trying resized image...")
            scale = 0.5
            small = cv2.resize(img_cv, None, fx=scale, fy=scale)
            haar_box = detect_face_opencv(small)
            if haar_box is not None:
                # Scale box back
                x1, y1, x2, y2 = haar_box
                boxes = np.array([[x1/scale, y1/scale, x2/scale, y2/scale]])
                probs = np.array([0.6])
                detection_method = "haar_resized"
        
        if boxes is None or len(boxes) == 0:
            print("[WARNING] No face detected after 6 attempts")
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
        margin = 30
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
        
        # Lấy embedding - dùng face tensor từ MTCNN
        face_tensors = MTCNN_DETECTOR(img)
        
        if face_tensors is None:
            # Fallback: dùng cropped face
            print("[INFO] Using cropped face for embedding")
            face_aligned = face_crop.resize((160, 160), Image.LANCZOS)
            face_np = np.array(face_aligned).astype(np.float32)
            face_np = (face_np - 127.5) / 128.0
            face_tensor = torch.from_numpy(face_np).permute(2, 0, 1).unsqueeze(0).float()
        else:
            if len(face_tensors.shape) == 3:
                face_tensor = face_tensors.unsqueeze(0)
            elif len(face_tensors.shape) == 4:
                face_tensor = face_tensors[best_idx:best_idx+1]
            else:
                face_tensor = face_tensors
        
        # Lấy embedding
        with torch.no_grad():
            face_tensor = face_tensor.to(DEVICE)
            embedding = FACENET_MODEL(face_tensor)
            embedding = embedding.cpu().numpy()
            if len(embedding.shape) > 1:
                embedding = embedding[0]
            embedding = embedding / np.linalg.norm(embedding)
        
        face_info = {
            "confidence": float(prob),
            "box": [x1, y1, x2, y2],
            "quality_score": best_quality,
            "face_size": {"width": x2 - x1, "height": y2 - y1},
            "cropped_face_base64": f"data:image/jpeg;base64,{cropped_face_base64}",
            "enhanced": was_enhanced,
            "detection_method": detection_method
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
        
        if camera_embedding is None:
            for f in temp_files:
                try: os.remove(f)
                except: pass
            return {
                "matched": False,
                "face_detected": False,
                "message": "Không phát hiện khuôn mặt. Hãy đảm bảo khuôn mặt rõ ràng trong khung hình.",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        
        quality_score = camera_face_info.get('quality_score', 0)
        print(f"[INFO] Camera face detected (confidence: {camera_face_info.get('confidence', 0):.2f}, quality: {quality_score:.1f})")
        
        # 3. So sánh với từng customer
        matches = []
        
        for customer in req.customers:
            avatar_file_path = get_avatar_path(customer.avatar_url, customer.avatar_path)
            if not avatar_file_path:
                continue
            
            # Lấy embedding từ avatar (có cache)
            avatar_embedding, avatar_face_info = get_face_with_box(
                avatar_file_path,
                use_cache=True,
                cache_key=avatar_file_path
            )
            
            if avatar_embedding is None:
                print(f"[WARNING] No face in avatar for customer {customer.id}: {customer.name}")
                continue
            
            # Tính similarity
            similarity = compute_similarity(camera_embedding, avatar_embedding)
            
            print(f"[DEBUG] Customer {customer.id} ({customer.name}): "
                  f"cosine={similarity['cosine_similarity']:.4f}, "
                  f"euclidean={similarity['euclidean_distance']:.4f}, "
                  f"match={similarity['is_match']}")
            
            if similarity['is_match']:
                matches.append({
                    "customer_id": customer.id,
                    "customer_name": customer.name,
                    "cosine_similarity": similarity['cosine_similarity'],
                    "euclidean_distance": similarity['euclidean_distance'],
                    "confidence": round(similarity['cosine_similarity'] * 100, 1)
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
            
            print(f"[SUCCESS] Matched: {best_match['customer_name']} "
                  f"(confidence: {best_match['confidence']}%) "
                  f"in {processing_time}ms")
            
            return {
                **base_response,
                "matched": True,
                "customer_id": best_match["customer_id"],
                "confidence": best_match["confidence"],
                "cosine_similarity": round(best_match["cosine_similarity"], 4),
                "message": f"Đã nhận diện: {best_match['customer_name']}",
                "all_matches": matches[:3],
            }
        
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
        
        # Detect với MTCNN
        boxes, probs = MTCNN_DETECTOR.detect(img)
        
        if temp_path:
            os.remove(temp_path)
        
        if boxes is None:
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
