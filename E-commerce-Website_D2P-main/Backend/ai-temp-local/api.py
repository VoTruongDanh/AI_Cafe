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
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# DeepFace import và preload model
DEEPFACE_AVAILABLE = False
FACE_MODEL_LOADED = False

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    print("[INFO] DeepFace imported successfully")
    
    # Preload model khi khởi động để tránh chậm lần đầu
    print("[INFO] Preloading Facenet model (this may take a moment)...")
    try:
        DeepFace.build_model("Facenet")
        FACE_MODEL_LOADED = True
        print("[INFO] Facenet model preloaded successfully!")
    except Exception as e:
        print(f"[WARNING] Could not preload model: {e}")
        
except ImportError:
    print("[WARNING] DeepFace not installed. Face recognition will not be available.")
    print("[TIP] Run: pip install deepface tensorflow")

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
        "service": "Local AI Temperature Classifier + Face Recognition",
        "status": "running",
        "hasModel": MODEL is not None,
        "deepface_available": DEEPFACE_AVAILABLE,
        "face_model_loaded": FACE_MODEL_LOADED,
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
# FACE RECOGNITION ENDPOINTS
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
    print(f"[DEBUG] get_avatar_path called with avatar_url={avatar_url}, avatar_path={avatar_path}")
    
    # Nếu có avatar_path (đường dẫn relative), đọc trực tiếp từ disk
    if avatar_path:
        # avatar_path dạng: /uploads/avatars/xxx.jpg hoặc uploads/avatars/xxx.jpg
        clean_path = avatar_path.lstrip('/').lstrip('\\')
        local_path = LARAVEL_PUBLIC_PATH / clean_path
        print(f"[DEBUG] Trying local path: {local_path}")
        
        if local_path.exists():
            print(f"[INFO] Found avatar at: {local_path}")
            return str(local_path)
        else:
            print(f"[WARNING] Avatar not found at: {local_path}")
    
    # Thử extract path từ URL và đọc từ disk
    if avatar_url:
        # URL dạng: http://xxx/uploads/avatars/xxx.jpg hoặc /uploads/avatars/xxx.jpg
        import re
        match = re.search(r'[/\\]?(uploads[/\\]avatars[/\\][^?]+)', avatar_url)
        if match:
            relative_path = match.group(1).replace('\\', '/')
            local_path = LARAVEL_PUBLIC_PATH / relative_path
            print(f"[DEBUG] Trying from URL, local path: {local_path}")
            
            if local_path.exists():
                print(f"[INFO] Found avatar at: {local_path}")
                return str(local_path)
            else:
                print(f"[WARNING] Avatar from URL not found at: {local_path}")
        
        # Fallback: download từ URL (có thể chậm hoặc fail)
        print(f"[INFO] Falling back to download from URL: {avatar_url}")
        return download_image(avatar_url)
    
    print(f"[WARNING] No avatar_url or avatar_path provided")
    return None

def download_image(url: str) -> str:
    """Download ảnh từ URL và lưu thành file tạm (fallback)"""
    try:
        print(f"[INFO] Downloading image from: {url}")
        response = requests.get(url, timeout=10, verify=False)
        if response.status_code == 200:
            fd, temp_path = tempfile.mkstemp(suffix='.jpg', prefix='avatar_')
            os.close(fd)
            with open(temp_path, 'wb') as f:
                f.write(response.content)
            return temp_path
    except Exception as e:
        print(f"[ERROR] Download image failed: {e}")
    return None

@app.get("/face/status")
def face_status():
    """Kiểm tra trạng thái Face Recognition service"""
    return {
        "service": "Face Recognition",
        "deepface_ready": DEEPFACE_AVAILABLE,
        "model_loaded": FACE_MODEL_LOADED,
        "message": "DeepFace ready, model loaded" if FACE_MODEL_LOADED else ("DeepFace ready" if DEEPFACE_AVAILABLE else "DeepFace not installed")
    }

@app.post("/face/recognize")
def face_recognize(req: FaceRecognizeRequest):
    """Nhận diện khuôn mặt từ ảnh camera và so sánh với database khách hàng"""
    if not DEEPFACE_AVAILABLE:
        return {
            "matched": False,
            "message": "DeepFace chưa được cài đặt. Vui lòng chạy: pip install deepface tensorflow"
        }
    
    temp_files = []
    
    try:
        # Lưu ảnh camera thành file tạm
        camera_image_path = save_base64_image(req.image_base64, "camera")
        temp_files.append(camera_image_path)
        
        best_match = None
        best_distance = float('inf')
        threshold = 0.4  # Ngưỡng cho Facenet + cosine (khắt khe hơn để chính xác)
        
        print(f"[INFO] Camera image saved: {camera_image_path}")
        print(f"[INFO] Processing {len(req.customers)} customers...")
        
        for customer in req.customers:
            try:
                # Lấy đường dẫn avatar (ưu tiên đọc từ disk)
                avatar_file_path = get_avatar_path(customer.avatar_url, customer.avatar_path)
                if not avatar_file_path:
                    print(f"[WARNING] No avatar found for customer {customer.id}: {customer.name}")
                    continue
                
                # Nếu là file tạm (từ download), thêm vào danh sách để xóa sau
                if str(avatar_file_path).startswith(str(tempfile.gettempdir())):
                    temp_files.append(avatar_file_path)
                
                print(f"[INFO] Comparing with customer {customer.id}: {customer.name} (avatar: {avatar_file_path})")
                
                # So sánh khuôn mặt với DeepFace (tối ưu tốc độ)
                result = DeepFace.verify(
                    img1_path=camera_image_path,
                    img2_path=avatar_file_path,
                    model_name="Facenet",  # Nhanh hơn Facenet512, vẫn chính xác
                    detector_backend="opencv",  # Nhanh nhất, đủ tốt cho indoor
                    distance_metric="cosine",
                    enforce_detection=False  # Không báo lỗi nếu không tìm thấy khuôn mặt
                )
                
                distance = result.get('distance', 1.0)
                verified = result.get('verified', False)
                
                print(f"[DEBUG] Customer {customer.name}: distance={distance}, verified={verified}")
                
                if distance < best_distance:
                    best_distance = distance
                    if verified or distance < threshold:
                        best_match = {
                            "customer_id": customer.id,
                            "customer_name": customer.name,
                            "distance": distance,
                            "confidence": max(0, min(100, (1 - distance) * 100))
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
            print(f"[SUCCESS] Found match: {best_match['customer_name']} (confidence: {best_match['confidence']:.1f}%)")
            return {
                "matched": True,
                "customer_id": best_match["customer_id"],
                "confidence": round(best_match["confidence"], 2),
                "distance": round(best_match["distance"], 4),
                "message": f"Đã nhận diện: {best_match['customer_name']}"
            }
        
        print(f"[INFO] No match found. Best distance: {best_distance:.4f}" if best_distance < float('inf') else "[INFO] No customers to compare")
        return {
            "matched": False,
            "message": "Không tìm thấy khách hàng phù hợp trong hệ thống",
            "best_distance": round(best_distance, 4) if best_distance < float('inf') else None
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

@app.post("/face/verify")
def face_verify_single(image1_base64: str, image2_base64: str):
    """So sánh 2 ảnh xem có phải cùng 1 người không"""
    if not DEEPFACE_AVAILABLE:
        return {
            "verified": False,
            "message": "DeepFace chưa được cài đặt"
        }
    
    temp_files = []
    
    try:
        img1_path = save_base64_image(image1_base64, "img1")
        img2_path = save_base64_image(image2_base64, "img2")
        temp_files.extend([img1_path, img2_path])
        
        result = DeepFace.verify(
            img1_path=img1_path,
            img2_path=img2_path,
            model_name="Facenet",  # Nhanh hơn
            detector_backend="opencv",  # Nhanh nhất
            distance_metric="cosine",
            enforce_detection=False
        )
        
        # Dọn dẹp
        for temp_file in temp_files:
            try:
                os.remove(temp_file)
            except:
                pass
        
        return {
            "verified": result.get('verified', False),
            "distance": round(result.get('distance', 1.0), 4),
            "confidence": round(max(0, (1 - result.get('distance', 1.0)) * 100), 2),
            "threshold": result.get('threshold', 0.4)
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
