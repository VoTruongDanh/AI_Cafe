# =============================================================================
# FACE RECOGNITION V2 - ArcFace Implementation với Best Practices
# =============================================================================
# File này chứa implementation V2 với ArcFace theo best practices
# Được tích hợp vào api.py bằng cách import và thêm routes
# =============================================================================

import numpy as np
import cv2
import time
from typing import Optional, List, Tuple, Union
from pathlib import Path
import base64

def crop_face_to_base64(img_cv, bbox, margin=20):
    """
    Helper: Crop face từ ảnh và convert sang base64 để hiển thị trên UI
    """
    try:
        h, w = img_cv.shape[:2]
        x1, y1, x2, y2 = [int(val) for val in bbox]
        
        # Add margin to make avatar look better
        x1 = max(0, x1 - margin)
        y1 = max(0, y1 - margin)
        x2 = min(w, x2 + margin)
        y2 = min(h, y2 + margin)
        
        face_img = img_cv[y1:y2, x1:x2]
        if face_img.size == 0: return None
        
        _, buffer = cv2.imencode('.jpg', face_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        print(f"[ERROR] Failed to crop face to base64: {e}")
        return None

# Global variables cho V2
ARCFACE_V2_MODEL = None  # Main model với det_size=(640,640) cho camera images
ARCFACE_V2_MODEL_SMALL = None  # Small model với det_size=(256,256) cho avatars nhỏ
ARCFACE_V2_RECOGNIZER = None  # Recognition model riêng (không có detection)
SCRFD_V2_DETECTOR = None  # SCRFD detector riêng cho V2 (như V1)
FAISS_V2_INDEX = None
FAISS_V2_ID_MAP = []
CUSTOMER_V2_CACHE = {"version": 0, "updated_at": 0, "customers": []}
# ============== THRESHOLDS TỐI ƯU CHO TỐC ĐỘ NHANH ==============
# Mục tiêu: 1-2 giây tổng từ khi đưa mặt vào đến khi nhận diện xong
SIMILARITY_V2_THRESHOLD = 0.55  # Ngưỡng match cơ bản
INSTANT_MATCH_THRESHOLD = 0.60  # Giảm từ 0.70 xuống 0.60 để instant nhanh hơn
VOTING_STREAK_REQUIRED = 2      # Giảm từ 3 xuống 2 - chỉ cần 2 matches liên tiếp
MAX_SCANS_BEFORE_NEW_CUSTOMER = 4
MIN_DET_SCORE = 0.60
MIN_AREA_RATIO = 0.02
MAX_AREA_RATIO = 0.40


def initialize_arcface_v2():
    """Initialize ArcFace V2 model theo best practices với multi-scale detection"""
    global ARCFACE_V2_MODEL, ARCFACE_V2_MODEL_SMALL, FAISS_V2_INDEX, FAISS_V2_ID_MAP, SCRFD_V2_DETECTOR
    
    print("[INFO] Initializing ArcFace V2 System (High Accuracy Mode)...")
    
    try:
        import insightface
        
        # ==== TỐI ƯU TỐC ĐỘ: Chỉ load detection + recognition (bỏ landmark, genderage) ====
        # Điều này giảm đáng kể thời gian load và inference
        model_name = 'buffalo_l'
        
        print(f"[INFO] Loading OPTIMIZED ArcFace model: {model_name} (detection + recognition only)...")
        
        # CPU Execution Provider
        providers = ['CPUExecutionProvider']
        ctx_id = 0
        
        # CHỈ load detection + recognition, BỎ landmark và genderage để tăng tốc
        ARCFACE_V2_MODEL = insightface.app.FaceAnalysis(
            name=model_name, 
            providers=providers,
            allowed_modules=['detection', 'recognition']  # CHỈ load 2 modules cần thiết
        )
        ARCFACE_V2_MODEL.prepare(ctx_id=ctx_id, det_size=(256, 256))
        print(f"[INFO] [OK] ArcFace V2 FAST model loaded (Model: {model_name}, det_size=256x256, modules=det+rec only)")
        
        # Small model: Không cần
        ARCFACE_V2_MODEL_SMALL = None
        print("[INFO] Small model DISABLED")
        
        print("[INFO] [OK] OPTIMIZED: Skipped landmark_3d_68, landmark_2d_106, genderage modules")
        print(f"[INFO] [OK] Threshold: {SIMILARITY_V2_THRESHOLD} (match), {INSTANT_MATCH_THRESHOLD} (instant)")
        print("[INFO] [OK] Expected speed: < 500ms per recognition")
        
        return True
    except Exception as e:
        print(f"[ERROR] ArcFace V2 initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def init_arcface_v2_system():
    """
    Khởi tạo hệ thống ArcFace V2 và CLEAR cache cũ.
    Gọi hàm này khi server khởi động để đảm bảo embeddings được extract bằng model mới.
    """
    global CUSTOMER_V2_CACHE, FAISS_V2_INDEX, FAISS_V2_ID_MAP
    
    print("[INFO] ============================================")
    print("[INFO] Initializing ArcFace V2 System...")
    print("[INFO] ============================================")
    
    # 1. Clear cache cũ (embeddings từ model cũ không tương thích)
    CUSTOMER_V2_CACHE = {"version": 0, "updated_at": 0, "customers": []}
    FAISS_V2_INDEX = None
    FAISS_V2_ID_MAP = []
    print("[INFO] Cleared old cache (embeddings will be re-extracted with new model)")
    
    # 2. Initialize model
    success = initialize_arcface_v2()
    
    if success:
        print("[INFO] ============================================")
        print("[INFO] ArcFace V2 System READY!")
        print(f"[INFO] Threshold: {SIMILARITY_V2_THRESHOLD} (match), {INSTANT_MATCH_THRESHOLD} (instant)")
        print("[INFO] ============================================")
    
    return success


def enhance_image_clahe(img_cv):
    """
    CLAHE (Contrast Limited Adaptive Histogram Equalization) enhancement
    Best practice cho ảnh camera trong điều kiện ánh sáng yếu
    """
    try:
        # Chuyển sang LAB color space
        lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE chỉ trên kênh L (luminance)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l)
        
        # Merge lại và convert về BGR
        lab_enhanced = cv2.merge([l_enhanced, a, b])
        enhanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
        
        return enhanced
    except Exception as e:
        print(f"[WARN] CLAHE enhancement failed: {e}")
        return img_cv


def enhance_image_gamma(img_cv, gamma=1.4):
    """
    Gamma correction để làm sáng ảnh tối
    """
    try:
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        return cv2.LUT(img_cv, table)
    except Exception as e:
        print(f"[WARN] Gamma correction failed: {e}")
        return img_cv


def crop_face_to_base64(img_cv, bbox, margin=20):
    """
    Crop face từ ảnh và convert thành base64
    """
    import base64
    import io
    from PIL import Image
    
    try:
        h, w = img_cv.shape[:2]
        x1, y1, x2, y2 = [int(coord) for coord in bbox]
        
        # Add margin
        x1_crop = max(0, x1 - margin)
        y1_crop = max(0, y1 - margin)
        x2_crop = min(w, x2 + margin)
        y2_crop = min(h, y2 + margin)
        
        # Crop và resize về 200x200 (chuẩn avatar)
        face_crop = img_cv[y1_crop:y2_crop, x1_crop:x2_crop]
        face_crop_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
        face_pil = Image.fromarray(face_crop_rgb)
        face_pil_resized = face_pil.resize((200, 200), Image.LANCZOS)
        
        # Convert to base64
        buffer = io.BytesIO()
        face_pil_resized.save(buffer, format='JPEG', quality=90)
        face_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/jpeg;base64,{face_base64}"
    except Exception as e:
        print(f"[WARN] Face crop to base64 failed: {e}")
        return None


def extract_arcface_v2_embedding(image_path: str) -> Tuple[Optional[np.ndarray], Optional[dict]]:
    """
    Extract ArcFace V2 embedding từ image path (cho avatar - dùng model nhỏ)
    BEST PRACTICE: Dùng full image, ArcFace tự detect và align
    """
    global ARCFACE_V2_MODEL_SMALL, ARCFACE_V2_MODEL
    
    # Ưu tiên dùng small model cho avatar, fallback sang main model
    # FIX: Luôn dùng ARCFACE_V2_MODEL (Main Model) để đảm bảo consistency với Camera Embedding
    # Nếu dùng mixed models (small cho avatar, main cho camera) sẽ bị lệch vector space -> Similarity thấp
    model = ARCFACE_V2_MODEL
    # model = ARCFACE_V2_MODEL_SMALL if ARCFACE_V2_MODEL_SMALL is not None else ARCFACE_V2_MODEL
    
    if model is None:
        return None, None
    
    try:
        # Load image (full image, không crop trước)
        img_cv = cv2.imread(image_path)
        if img_cv is None:
            print(f"[WARN] Failed to load image: {image_path}")
            return None, None
        
        # BEST PRACTICE: Dùng full image, ArcFace tự detect và align
        faces_detected = model.get(img_cv)
        
        # Fallback: Thử model lớn hơn nếu small model không detect được
        if (faces_detected is None or len(faces_detected) == 0) and model == ARCFACE_V2_MODEL_SMALL and ARCFACE_V2_MODEL is not None:
            print(f"[INFO] Small model failed, trying main model for: {image_path}")
            faces_detected = ARCFACE_V2_MODEL.get(img_cv)
        
        if faces_detected is None or len(faces_detected) == 0:
            print(f"[WARN] No faces detected in image: {image_path}")
            return None, None
        
        # Lấy face có det_score cao nhất
        best_face = max(faces_detected, key=lambda f: f.det_score if hasattr(f, 'det_score') else 0)
        
        # Lấy embedding và normalize (LUÔN normalize lại để đảm bảo L2 norm = 1)
        if hasattr(best_face, 'embedding') and best_face.embedding is not None:
            embedding = np.array(best_face.embedding, dtype=np.float32)
        elif hasattr(best_face, 'norm_embedding') and best_face.norm_embedding is not None:
            embedding = np.array(best_face.norm_embedding, dtype=np.float32)
        else:
            return None, None
        
        # LUÔN normalize lại để đảm bảo L2 norm = 1 (best practice cho cosine similarity)
        embedding_norm = np.linalg.norm(embedding)
        if embedding_norm > 0:
            embedding = embedding / embedding_norm
        else:
            return None, None
        
        embedding = np.array(embedding, dtype=np.float32)
        
        # Face info
        face_info = {
            "bbox": best_face.bbox.tolist() if hasattr(best_face, 'bbox') else None,
            "det_score": float(best_face.det_score) if hasattr(best_face, 'det_score') else 0.0,
            "embedding_size": len(embedding),
            "embedding_norm": float(np.linalg.norm(embedding))
        }
        
        return embedding, face_info
        
    except Exception as e:
        print(f"[ERROR] ArcFace V2 embedding extraction failed: {e}")
        print(f"[ERROR] Image path: {image_path}")
        import traceback
        traceback.print_exc()
        return None, None


def extract_arcface_v2_embedding_from_camera(image_input: Union[str, np.ndarray]) -> Tuple[Optional[np.ndarray], Optional[dict]]:
    """
    Extract ArcFace V2 embedding từ ảnh camera (path hoặc numpy array)
    """
    global ARCFACE_V2_MODEL, ARCFACE_V2_MODEL_SMALL
    
    if ARCFACE_V2_MODEL is None:
        print("[ERROR] ArcFace V2 model not initialized")
        return None, None
    
    try:
        # Load image
        img_cv = None
        input_desc = "memory_matrix"
        
        if isinstance(image_input, str):
            img_cv = cv2.imread(image_input)
            input_desc = image_input
        elif isinstance(image_input, np.ndarray):
            img_cv = image_input
            
        if img_cv is None:
            print(f"[WARN] Failed to load image: {input_desc}")
            return None, None
        
        h, w = img_cv.shape[:2]
        img_area = h * w
        print(f"[INFO] V2 Camera image: {w}x{h}")
        
        # ========== STEP 1: Main model buffalo_s (det_size=256x256) - OPTIMIZED ========== 
        faces_detected = ARCFACE_V2_MODEL.get(img_cv)
        detection_method = "arcface_256"
        enhanced = False
        
        # ========== STEP 2: Fallback - CLAHE only (OPTIMIZED: removed Gamma + Small model) ========== 
        if faces_detected is None or len(faces_detected) == 0:
            print("[INFO] V2 Main model failed, trying CLAHE enhancement...")
            img_enhanced = enhance_image_clahe(img_cv)
            faces_detected = ARCFACE_V2_MODEL.get(img_enhanced)
            if faces_detected and len(faces_detected) > 0:
                detection_method = "arcface_256_clahe"
                enhanced = True
                img_cv = img_enhanced  # Dùng ảnh đã enhance cho crop
        
        # ========== REMOVED: Gamma correction fallback - không cần, CLAHE đủ tốt ==========
        # ========== REMOVED: Small model fallback - đã dùng buffalo_s làm main ==========
        
        # ========== NO FACE DETECTED ========== 
        if faces_detected is None or len(faces_detected) == 0:
            print(f"[WARN] V2 No faces detected in camera image: {input_desc}")
            return None, {
                "face_detected": False,
                "message": "Không phát hiện khuôn mặt sau nhiều lần thử"
            }
        
        # ========== SELECT BEST FACE ========== 
        # Chọn face có det_score cao nhất VÀ area hợp lệ
        valid_faces = []
        for face in faces_detected:
            det_score = face.det_score if hasattr(face, 'det_score') else 0
            bbox = face.bbox if hasattr(face, 'bbox') else None
            
            if bbox is not None and det_score >= MIN_DET_SCORE:
                x1, y1, x2, y2 = bbox
                face_area = (x2 - x1) * (y2 - y1)
                area_ratio = face_area / img_area
                
                if MIN_AREA_RATIO <= area_ratio <= MAX_AREA_RATIO:
                    valid_faces.append((face, det_score, area_ratio))
        
        if len(valid_faces) == 0:
            print(f"[WARN] V2 No valid faces (quality/size criteria not met)")
            # Nếu có face nhưng không đạt quality → vẫn trả về thông tin để frontend biết
            if len(faces_detected) > 0:
                face = faces_detected[0]
                bbox = face.bbox.tolist() if hasattr(face, 'bbox') else None
                det_score = float(face.det_score) if hasattr(face, 'det_score') else 0.0
                return None, {
                    "face_detected": True,
                    "bbox": bbox,
                    "det_score": det_score,
                    "quality_insufficient": True,
                    "message": f"Chất lượng mặt không đủ (det_score={det_score:.2f}, cần >= {MIN_DET_SCORE})"
                }
            return None, None
        
        # Chọn face tốt nhất
        best_face, best_score, best_ratio = max(valid_faces, key=lambda x: x[1])
        
        # ========== EXTRACT EMBEDDING ========== 
        if hasattr(best_face, 'embedding') and best_face.embedding is not None:
            embedding = np.array(best_face.embedding, dtype=np.float32)
        elif hasattr(best_face, 'norm_embedding') and best_face.norm_embedding is not None:
            embedding = np.array(best_face.norm_embedding, dtype=np.float32)
        else:
            print("[WARN] V2 Face detected but no embedding available")
            return None, None
        
        # LUÔN normalize embedding
        embedding_norm = np.linalg.norm(embedding)
        if embedding_norm > 0:
            embedding = embedding / embedding_norm
        else:
            return None, None
        
        embedding = np.array(embedding, dtype=np.float32)
        
        # ========== CROP FACE TO BASE64 ========== 
        bbox = best_face.bbox.tolist() if hasattr(best_face, 'bbox') else None
        cropped_face_base64 = None
        if bbox is not None:
            cropped_face_base64 = crop_face_to_base64(img_cv, bbox, margin=25)
        
        # ========== FACE INFO ========== 
        face_info = {
            "face_detected": True,
            "bbox": bbox,
            "det_score": float(best_score),
            "area_ratio": float(best_ratio),
            "face_size": {
                "width": int(bbox[2] - bbox[0]) if bbox else 0,
                "height": int(bbox[3] - bbox[1]) if bbox else 0
            },
            "image_size": {"width": w, "height": h},
            "embedding_size": len(embedding),
            "embedding_norm": float(np.linalg.norm(embedding)),
            "detection_method": detection_method,
            "enhanced": enhanced,
            "cropped_face_base64": cropped_face_base64
        }
        
        print(f"[INFO] V2 Face extracted: det_score={best_score:.2f}, area_ratio={best_ratio:.3f}, method={detection_method}")
        
        return embedding, face_info
        
    except Exception as e:
        print(f"[ERROR] ArcFace V2 camera embedding extraction failed: {e}")
        import traceback
        traceback.print_exc()
        return None, None


def cache_customers_v2_embeddings(customers_data: List[dict], get_avatar_path_func=None) -> bool:
    """
    Cache customers embeddings vào RAM cho V2
    """
    global CUSTOMER_V2_CACHE, FAISS_V2_INDEX, FAISS_V2_ID_MAP
    
    try:
        import faiss
        
        cached_list = []
        faiss_vectors = []
        
        for customer in customers_data:
            # Dùng get_avatar_path_func nếu có (từ api.py)
            if get_avatar_path_func:
                avatar_path = get_avatar_path_func(
                    customer.get("avatar_url"),
                    customer.get("avatar_path")
                )
            else:
                avatar_path = customer.get("avatar_path") or customer.get("avatar_url")
                if avatar_path and not Path(avatar_path).is_absolute():
                    # Fallback: convert relative path
                    avatar_path = str(Path("../../public").joinpath(avatar_path.lstrip("/")).resolve())
            
            if not avatar_path or not Path(avatar_path).exists():
                print(f"[WARN] Avatar not found for {customer.get('name')}: {avatar_path}")
                continue
            
            # Extract embedding
            embedding, face_info = extract_arcface_v2_embedding(avatar_path)
            if embedding is None:
                print(f"[WARN] Failed to extract embedding for {customer.get('name')} (avatar_path: {avatar_path})")
                continue
            
            print(f"[DEBUG] Caching customer: {customer.get('name')} (ID: {customer.get('id')}) - Quality: {face_info.get('det_score', 0.0) * 100:.1f}")
            
            cached_list.append({
                "customer_id": customer.get("id"),
                "customer_name": customer.get("name"),
                "embedding": embedding.tolist(),
                "avatar_quality": face_info.get("det_score", 0.0) * 100 if face_info else 0.0
            })
            
            # Normalize và add vào FAISS (embeddings đã normalize trong extract_arcface_v2_embedding, nhưng đảm bảo normalize lại)
            vec_normalized = embedding.astype(np.float32)
            vec_norm = np.linalg.norm(vec_normalized)
            if vec_norm > 0:
                vec_normalized = vec_normalized / vec_norm
            vec_normalized = vec_normalized.astype(np.float32)
            faiss_vectors.append((vec_normalized, {
                "customer_id": customer.get("id"),
                "customer_name": customer.get("name"),
                "avatar_quality": face_info.get("det_score", 0.0) * 100 if face_info else 0.0
            }))
        
        # Update cache
        CUSTOMER_V2_CACHE = {
            "version": CUSTOMER_V2_CACHE.get("version", 0) + 1,
            "updated_at": time.time(),
            "customers": cached_list
        }
        
        # Build FAISS index
        FAISS_V2_INDEX = None
        FAISS_V2_ID_MAP = []
        
        if len(faiss_vectors) > 0:
            dim = faiss_vectors[0][0].shape[0]
            # IndexFlatIP cho cosine similarity (với normalized vectors)
            index = faiss.IndexFlatIP(dim)
            vectors = np.array([vec for vec, _ in faiss_vectors], dtype=np.float32)
            index.add(vectors)
            
            FAISS_V2_INDEX = index
            FAISS_V2_ID_MAP = [meta for _, meta in faiss_vectors]
            
            print(f"[INFO] FAISS V2 IndexFlatIP built with {len(faiss_vectors)} vectors (normalized, inner product = cosine similarity)")
        
        print(f"[INFO] Cached V2 embeddings for {len(cached_list)} customers (version={CUSTOMER_V2_CACHE['version']})")
        return True
        
    except Exception as e:
        print(f"[ERROR] Cache V2 embeddings failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def search_faiss_v2_candidates(query_embedding: np.ndarray, top_k: int = 50) -> List[Tuple[int, float]]:
    """
    Search FAISS V2 candidates
    """
    global FAISS_V2_INDEX, FAISS_V2_ID_MAP
    
    if FAISS_V2_INDEX is None or len(FAISS_V2_ID_MAP) == 0:
        return []
    
    try:
        # Normalize query embedding
        query_normalized = query_embedding.astype(np.float32)
        query_normalized = query_normalized / np.linalg.norm(query_normalized)
        query_normalized = query_normalized.reshape(1, -1)
        
        # Search
        distances, indices = FAISS_V2_INDEX.search(query_normalized, min(top_k, len(FAISS_V2_ID_MAP)))
        
        # Return (index, similarity) pairs (với IndexFlatIP, distance = cosine similarity)
        results = []
        for i, idx in enumerate(indices[0]):
            if idx >= 0 and idx < len(FAISS_V2_ID_MAP):
                similarity = float(distances[0][i])  # Cosine similarity (với normalized vectors)
                results.append((int(idx), similarity))
        
        return results
        
    except Exception as e:
        print(f"[ERROR] FAISS V2 search failed: {e}")
        return []


def compute_similarity_v2(emb1: np.ndarray, emb2: np.ndarray) -> dict:
    """
    Compute similarity giữa 2 embeddings (V2)
    """
    try:
        # Normalize embeddings
        emb1_norm = emb1 / np.linalg.norm(emb1)
        emb2_norm = emb2 / np.linalg.norm(emb2)
        
        # Cosine similarity
        cosine_sim = np.dot(emb1_norm, emb2_norm)
        
        # Euclidean distance
        euclidean_dist = np.linalg.norm(emb1 - emb2)
        
        return {
            "cosine_similarity": float(cosine_sim),
            "euclidean_distance": float(euclidean_dist),
            "is_match": cosine_sim >= SIMILARITY_V2_THRESHOLD
        }
        
    except Exception as e:
        print(f"[ERROR] Compute similarity V2 failed: {e}")
        return {
            "cosine_similarity": 0.0,
            "euclidean_distance": float('inf'),
            "is_match": False
        }


def similarity_to_confidence(similarity: float) -> float:
    """
    Chuyển đổi cosine similarity thành độ tin cậy % thân thiện người dùng.
    
    Ánh xạ:
    - similarity = 0.40 (threshold min) → confidence ~75%
    - similarity = 0.50 → confidence ~85%
    - similarity = 0.60 → confidence ~92%
    - similarity = 0.70 → confidence ~96%
    - similarity = 0.80+ → confidence ~99%
    
    Công thức: Sử dụng hàm sigmoid-like để ánh xạ [0.4, 0.8] → [75%, 99%]
    """
    if similarity < SIMILARITY_V2_THRESHOLD:
        # Dưới threshold → không match, trả về confidence thấp
        return max(0, similarity * 100)
    
    # Ánh xạ [0.55, 0.85] → [80, 99] - threshold cao hơn = confidence bắt đầu từ 80%
    min_sim = 0.55  # Match SIMILARITY_V2_THRESHOLD
    max_sim = 0.85
    min_conf = 80.0  # Bắt đầu từ 80% khi vượt threshold
    max_conf = 99.0
    
    # Clamp similarity vào range
    sim_clamped = max(min_sim, min(max_sim, similarity))
    
    # Linear interpolation
    ratio = (sim_clamped - min_sim) / (max_sim - min_sim)
    
    # Áp dụng curve để làm confidence tăng nhanh hơn ở đầu
    # sqrt curve: confidence tăng nhanh từ 75% lên 90%, chậm dần về 99%
    ratio_curved = ratio ** 0.6
    
    confidence = min_conf + ratio_curved * (max_conf - min_conf)
    
    return round(confidence, 1)
