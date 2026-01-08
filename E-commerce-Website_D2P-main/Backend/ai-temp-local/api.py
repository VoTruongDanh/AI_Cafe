import json
import re
import unicodedata
import datetime
import base64
import tempfile
import os
from pathlib import Path
from typing import Optional, List

import joblib
import requests
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# =============================================================================
# FACENET-PYTORCH SETUP - Fast & Accurate Face Recognition
# =============================================================================
FACENET_AVAILABLE = False
MTCNN_DETECTOR = None
FACENET_MODEL = None

try:
    import torch
    from facenet_pytorch import MTCNN, InceptionResnetV1
    from PIL import Image
    
    print("[INFO] Loading FaceNet-PyTorch models...")
    
    # Sử dụng CPU
    device = torch.device('cpu')
    
    # MTCNN để detect khuôn mặt (nhanh hơn nhiều so với DeepFace)
    MTCNN_DETECTOR = MTCNN(
        image_size=160,
        margin=20,
        min_face_size=40,
        thresholds=[0.6, 0.7, 0.7],  # Ngưỡng thấp hơn = nhạy hơn
        factor=0.709,
        post_process=True,
        device=device,
        keep_all=False  # Chỉ lấy face lớn nhất
    )
    
    # FaceNet model đã pre-trained trên VGGFace2
    FACENET_MODEL = InceptionResnetV1(pretrained='vggface2').eval().to(device)
    
    FACENET_AVAILABLE = True
    print("[INFO] FaceNet-PyTorch loaded successfully! Ready for fast face recognition.")
    
except ImportError as e:
    print(f"[WARNING] FaceNet-PyTorch not installed: {e}")
    print("[TIP] Run: pip install facenet-pytorch torch torchvision")
except Exception as e:
    print(f"[ERROR] Error loading FaceNet-PyTorch: {e}")

DATASET_PATH = Path("dataset.jsonl")
MODEL_PATH = Path("model.joblib")

app = FastAPI(title="Local AI Temperature Classifier + Face Recognition")

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

def remove_vietnamese_accents(s: str) -> str:
    """Bỏ dấu tiếng Việt"""
    accents = {
        'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
        'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
        'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
        'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
        'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
        'đ': 'd', 'Đ': 'd'
    }
    result = ""
    for char in s:
        result += accents.get(char, char)
    return result

def contains_any(text: str, keywords: List[str]) -> bool:
    """Kiểm tra text có chứa bất kỳ keyword nào không"""
    for kw in keywords:
        kw = kw.strip()
        if not kw:
            continue
        
        # Phrase có khoảng trắng => tìm exact match
        if ' ' in kw:
            if kw in text:
                return True
            continue
        
        # Match theo word boundary để giảm false positive
        pattern = r'(^|\W)' + re.escape(kw) + r'(\W|$)'
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

def classify_rule_based(name: str, category_name: Optional[str] = None) -> dict:
    """Rule-based classification (tích hợp từ TemperatureClassifier.php)"""
    # Keywords cho đồ uống/món ăn lạnh
    cold_keywords = [
        'da', 'iced', 'ice', 'lanh', 'frozen', 'smoothie', 'sinh to',
        'kem', 'tra sua', 'nuoc ep', 'juice', 'cold', 'freeze',
        'ca phe da', 'tra da', 'nuoc ngot', 'soft drink', 'soda'
    ]
    
    # Keywords cho đồ uống/món ăn nóng
    hot_keywords = [
        'nong', 'hot', 'am', 'warm', 'steaming', 'boiling',
        'ca phe nong', 'tra nong', 'soup', 'lau', 'sup',
        'pho', 'bun', 'mi', 'noodle soup'
    ]
    
    # Chuẩn hóa text
    text = normalize_vi(f"{name} | {category_name or ''}")
    
    # Kiểm tra keywords lạnh
    if contains_any(text, cold_keywords):
        return {
            'temperature': 'COLD',
            'confidence': 0.95,
            'source': 'RULE',
            'reason': 'Tìm thấy keyword lạnh trong tên/danh mục'
        }
    
    # Kiểm tra keywords nóng
    if contains_any(text, hot_keywords):
        return {
            'temperature': 'HOT',
            'confidence': 0.90,
            'source': 'RULE',
            'reason': 'Tìm thấy keyword nóng trong tên/danh mục'
        }
    
    # Suy luận từ danh mục
    category_lower = (category_name or '').lower()
    text_lower = text.lower()
    
    # Kiểm tra danh mục cà phê
    if 'ca phe' in category_lower or 'coffee' in category_lower or \
       'ca phe' in text_lower or 'coffee' in text_lower:
        # Mặc định cà phê là nóng, trừ khi có "đá" hoặc "ice"
        if 'da' in text_lower or 'ice' in text_lower or 'iced' in text_lower:
            return {
                'temperature': 'COLD',
                'confidence': 0.85,
                'source': 'RULE',
                'reason': 'Cà phê có đá'
            }
        # Các loại cà phê đặc biệt (Espresso, Cappuccino, Latte, Americano) đều là nóng
        # Confidence thấp (0.5) để ưu tiên AI model
        if any(kw in text_lower for kw in ['espresso', 'cappuccino', 'latte', 'americano', 'macchiato', 'mocha']):
            return {
                'temperature': 'HOT',
                'confidence': 0.50,
                'source': 'RULE',
                'reason': 'Cà phê đặc biệt (Espresso, Cappuccino, Latte, etc.) - để AI model phân loại chính xác'
            }
        return {
            'temperature': 'HOT',
            'confidence': 0.50,
            'source': 'RULE',
            'reason': 'Cà phê mặc định là nóng - để AI model phân loại chính xác'
        }
    
    # Suy luận từ món ăn nóng
    if any(kw in text for kw in ['lau', 'sup', 'pho', 'bun']):
        return {
            'temperature': 'HOT',
            'confidence': 0.70,
            'source': 'RULE',
            'reason': 'Món ăn nóng (lẩu, súp, phở, bún)'
        }
    
    # Mặc định: không xác định
    return {
        'temperature': 'UNKNOWN',
        'confidence': 0.50,
        'source': 'UNKNOWN',
        'reason': 'Không đủ dấu hiệu để phân loại nhiệt độ'
    }

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
        "service": "Local AI Temperature Classifier + Face Recognition (FaceNet-PyTorch)",
        "status": "running",
        "hasModel": MODEL is not None,
        "facenet_available": FACENET_AVAILABLE,
        "endpoints": ["/collect", "/predict", "/reload-model", "/stats", "/face/status", "/face/recognize"]
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
    """Dự đoán nhiệt độ cho danh sách sản phẩm
    Ưu tiên: Rule-based trước → AI Model sau
    """
    global MODEL
    
    out = []
    for it in req.items:
        # Bước 1: Rule-based classification trước (nhanh, không cần model)
        rule_result = classify_rule_based(it.name, it.categoryName)
        
        # Nếu rule-based có kết quả chắc chắn (confidence >= 0.8)
        if rule_result['confidence'] >= 0.8 and rule_result['temperature'] in ['HOT', 'COLD']:
            out.append({
                "id": it.id,
                "temperature": rule_result['temperature'],
                "confidence": rule_result['confidence'],
                "source": rule_result['source'],
                "reason": rule_result['reason']
            })
            continue  # Bỏ qua AI Model, trả về ngay
        
        # Bước 2: Nếu rule-based không chắc chắn, thử dùng AI Model
        if MODEL is None:
            # Chưa có model thì trả về kết quả rule-based (có thể là UNKNOWN)
            out.append({
                "id": it.id,
                "temperature": rule_result['temperature'],
                "confidence": rule_result['confidence'],
                "source": "NO_MODEL",
                "reason": f"Model chưa được train. {rule_result['reason']}"
            })
            continue
        
        # Có model, thử dự đoán
        text = normalize_vi(f"{it.name} | {it.categoryName or ''}")
        try:
            proba = MODEL.predict_proba([text])[0]
            classes = MODEL.classes_
            best = int(proba.argmax())
            label = str(classes[best])
            conf = float(proba[best])

            # Ngưỡng an toàn: confidence < 0.60 => UNKNOWN
            if conf < 0.60:
                # Model không chắc, trả về kết quả rule-based (có thể tốt hơn)
                out.append({
                    "id": it.id,
                    "temperature": rule_result['temperature'],
                    "confidence": rule_result['confidence'],
                    "source": rule_result['source'],
                    "reason": f"Model confidence thấp ({conf:.2f}). {rule_result['reason']}"
                })
            else:
                # Model có kết quả tốt, so sánh với rule-based
                # Ưu tiên model nếu confidence cao hơn hoặc rule-based là UNKNOWN
                if conf > rule_result['confidence'] or rule_result['temperature'] == 'UNKNOWN':
                    out.append({
                        "id": it.id,
                        "temperature": label,
                        "confidence": conf,
                        "source": "MODEL",
                        "reason": f"Model dự đoán với confidence {conf:.2f}"
                    })
                else:
                    # Rule-based tốt hơn
                    out.append({
                        "id": it.id,
                        "temperature": rule_result['temperature'],
                        "confidence": rule_result['confidence'],
                        "source": rule_result['source'],
                        "reason": rule_result['reason']
                    })
        except Exception as e:
            # Lỗi model, trả về kết quả rule-based
            out.append({
                "id": it.id,
                "temperature": rule_result['temperature'],
                "confidence": rule_result['confidence'],
                "source": "MODEL_ERROR",
                "reason": f"Lỗi model: {str(e)}. {rule_result['reason']}"
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


# =============================================================================
# FACE RECOGNITION ENDPOINTS - FaceNet-PyTorch (Fast & Accurate)
# =============================================================================

class CustomerFace(BaseModel):
    id: int
    name: str
    avatar_url: Optional[str] = None
    avatar_path: Optional[str] = None  # Đường dẫn file local (relative)

class FaceRecognizeRequest(BaseModel):
    image_base64: str
    customers: List[CustomerFace]

# Đường dẫn đến thư mục public của Laravel
LARAVEL_PUBLIC_PATH = Path(__file__).parent.parent / "public"
print(f"[INFO] Laravel public path: {LARAVEL_PUBLIC_PATH}")
print(f"[INFO] Public path exists: {LARAVEL_PUBLIC_PATH.exists()}")

# Cache embeddings để tăng tốc độ nhận diện
EMBEDDING_CACHE = {}

def compute_cosine_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """Tính cosine similarity giữa 2 embedding vectors"""
    emb1 = emb1.flatten()
    emb2 = emb2.flatten()
    return float(np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2)))

def save_base64_image(base64_str: str, prefix: str = "face") -> str:
    """Lưu ảnh base64 thành file tạm và trả về đường dẫn"""
    # Xử lý base64 string
    if base64_str.startswith('data:image'):
        # Remove data URL prefix
        base64_str = base64_str.split(',')[1]
    
    image_data = base64.b64decode(base64_str)
    
    # Tạo file tạm
    fd, temp_path = tempfile.mkstemp(suffix='.jpg', prefix=prefix + '_')
    os.close(fd)
    
    with open(temp_path, 'wb') as f:
        f.write(image_data)
    
    return temp_path

def get_avatar_path(avatar_url: Optional[str] = None, avatar_path: Optional[str] = None) -> Optional[str]:
    """Lấy đường dẫn file avatar - ưu tiên đọc từ disk"""
    # Nếu có avatar_path (đường dẫn relative), đọc trực tiếp từ disk
    if avatar_path:
        clean_path = avatar_path.lstrip('/').lstrip('\\')
        local_path = LARAVEL_PUBLIC_PATH / clean_path
        
        if local_path.exists():
            return str(local_path)
    
    # Thử extract path từ URL và đọc từ disk
    if avatar_url:
        match = re.search(r'[/\\]?(uploads[/\\]avatars[/\\][^?]+)', avatar_url)
        if match:
            relative_path = match.group(1).replace('\\', '/')
            local_path = LARAVEL_PUBLIC_PATH / relative_path
            
            if local_path.exists():
                return str(local_path)
    
    return None

def get_face_embedding_facenet(image_path: str, use_cache: bool = True) -> Optional[np.ndarray]:
    """Lấy face embedding từ ảnh sử dụng FaceNet-PyTorch - NHANH và CHÍNH XÁC"""
    if not FACENET_AVAILABLE or MTCNN_DETECTOR is None or FACENET_MODEL is None:
        return None
    
    # Check cache
    if use_cache and image_path in EMBEDDING_CACHE:
        return EMBEDDING_CACHE[image_path]
    
    try:
        from PIL import Image
        import torch
        
        # Đọc ảnh
        img = Image.open(image_path).convert('RGB')
        
        # Detect và crop face bằng MTCNN (rất nhanh!)
        face_tensor = MTCNN_DETECTOR(img)
        
        if face_tensor is None:
            print(f"[WARNING] No face detected in: {image_path}")
            return None
        
        # Chuẩn hóa và lấy embedding
        with torch.no_grad():
            # face_tensor đã được MTCNN resize và normalize
            if len(face_tensor.shape) == 3:
                face_tensor = face_tensor.unsqueeze(0)  # Add batch dimension
            
            embedding = FACENET_MODEL(face_tensor)
            embedding = embedding.cpu().numpy()[0]  # Convert to numpy array
        
        # Cache embedding cho avatar
        if use_cache and 'uploads' in image_path:
            EMBEDDING_CACHE[image_path] = embedding
        
        return embedding
        
    except Exception as e:
        print(f"[ERROR] Error getting face embedding: {e}")
        import traceback
        traceback.print_exc()
        return None

@app.get("/face/status")
def face_status():
    """Kiểm tra trạng thái Face Recognition service"""
    return {
        "service": "Face Recognition (FaceNet-PyTorch)",
        "facenet_ready": FACENET_AVAILABLE,
        "model": "InceptionResnetV1-VGGFace2" if FACENET_AVAILABLE else None,
        "cached_embeddings": len(EMBEDDING_CACHE),
        "message": "FaceNet-PyTorch ready - Fast & Accurate!" if FACENET_AVAILABLE else "FaceNet-PyTorch not installed"
    }

@app.post("/face/recognize")
def face_recognize(req: FaceRecognizeRequest):
    """Nhận diện khuôn mặt từ ảnh camera và so sánh với database khách hàng
    Sử dụng FaceNet-PyTorch - nhanh và chính xác hơn DeepFace
    """
    if not FACENET_AVAILABLE:
        return {
            "matched": False,
            "message": "FaceNet-PyTorch chưa được cài đặt. Vui lòng chạy: pip install facenet-pytorch torch torchvision"
        }
    
    temp_files = []
    
    try:
        # Lưu ảnh camera thành file tạm
        camera_image_path = save_base64_image(req.image_base64, "camera")
        temp_files.append(camera_image_path)
        
        # Lấy embedding từ ảnh camera
        camera_embedding = get_face_embedding_facenet(camera_image_path, use_cache=False)
        
        if camera_embedding is None:
            # Dọn dẹp
            for f in temp_files:
                try: os.remove(f)
                except: pass
            return {
                "matched": False,
                "message": "Không phát hiện khuôn mặt trong ảnh camera"
            }
        
        best_match = None
        best_similarity = 0.0
        similarity_threshold = 0.6  # FaceNet: cosine similarity > 0.6 là match
        
        print(f"[INFO] Processing {len(req.customers)} customers...")
        
        for customer in req.customers:
            try:
                # Lấy đường dẫn avatar
                avatar_file_path = get_avatar_path(customer.avatar_url, customer.avatar_path)
                if not avatar_file_path:
                    continue
                
                # Lấy embedding từ avatar (có cache)
                avatar_embedding = get_face_embedding_facenet(avatar_file_path, use_cache=True)
                if avatar_embedding is None:
                    continue
                
                # Tính cosine similarity
                similarity = compute_cosine_similarity(camera_embedding, avatar_embedding)
                
                print(f"[DEBUG] Customer {customer.name} (ID: {customer.id}): similarity={similarity:.4f}")
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    if similarity >= similarity_threshold:
                        best_match = {
                            "customer_id": customer.id,
                            "customer_name": customer.name,
                            "similarity": similarity,
                            "confidence": round(similarity * 100, 2)
                        }
                        
            except Exception as e:
                print(f"[WARNING] Error comparing with customer {customer.id}: {e}")
                continue
        
        # Dọn dẹp file tạm
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except:
                pass
        
        if best_match:
            print(f"[SUCCESS] Found match: {best_match['customer_name']} (confidence: {best_match['confidence']}%)")
            return {
                "matched": True,
                "customer_id": best_match["customer_id"],
                "confidence": best_match["confidence"],
                "similarity": round(best_match["similarity"], 4),
                "message": f"Đã nhận diện: {best_match['customer_name']}"
            }
        
        print(f"[INFO] No match found. Best similarity: {best_similarity:.4f}")
        return {
            "matched": False,
            "message": "Không tìm thấy khách hàng phù hợp trong hệ thống",
            "best_similarity": round(best_similarity, 4) if best_similarity > 0 else None
        }
        
    except Exception as e:
        print(f"[ERROR] Recognition error: {e}")
        import traceback
        traceback.print_exc()
        
        # Dọn dẹp file tạm khi có lỗi
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except:
                pass
        
        return {
            "matched": False,
            "message": f"Lỗi nhận diện: {str(e)}"
        }

@app.post("/face/clear-cache")
def face_clear_cache():
    """Xóa cache embeddings (khi avatar được cập nhật)"""
    global EMBEDDING_CACHE
    count = len(EMBEDDING_CACHE)
    EMBEDDING_CACHE = {}
    return {
        "ok": True,
        "cleared": count,
        "message": f"Đã xóa {count} cached embeddings"
    }

@app.post("/face/verify")
def face_verify_single(image1_base64: str, image2_base64: str):
    """So sánh 2 ảnh xem có phải cùng 1 người không"""
    if not FACENET_AVAILABLE:
        return {
            "verified": False,
            "message": "FaceNet-PyTorch chưa được cài đặt"
        }
    
    temp_files = []
    
    try:
        img1_path = save_base64_image(image1_base64, "img1")
        img2_path = save_base64_image(image2_base64, "img2")
        temp_files.extend([img1_path, img2_path])
        
        emb1 = get_face_embedding_facenet(img1_path, use_cache=False)
        emb2 = get_face_embedding_facenet(img2_path, use_cache=False)
        
        # Dọn dẹp
        for temp_file in temp_files:
            try:
                os.remove(temp_file)
            except:
                pass
        
        if emb1 is None or emb2 is None:
            return {
                "verified": False,
                "message": "Không phát hiện khuôn mặt trong một hoặc cả hai ảnh"
            }
        
        similarity = compute_cosine_similarity(emb1, emb2)
        
        return {
            "verified": similarity >= 0.6,
            "similarity": round(similarity, 4),
            "confidence": round(similarity * 100, 2),
            "threshold": 0.6
        }
        
    except Exception as e:
        for temp_file in temp_files:
            try:
                os.remove(temp_file)
            except:
                pass
        return {
            "verified": False,
            "message": f"Lỗi: {str(e)}"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9009)
