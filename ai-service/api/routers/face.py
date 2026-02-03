"""
Face Recognition API Router
"""
import os
import time
import numpy as np
from fastapi import APIRouter
from pathlib import Path
from typing import Optional
from api.models import (
    FaceRecognizeRequest,
    CustomerCacheRequest,
    FaceDetectRequest,
    CustomerFace
)
import ai_service.face_recognition as face_recognition
from ai_service.face_recognition import v2_arcface  # Direct import to access mutable globals
from ai_service.face_recognition import (
    init_arcface_v2_system,
    extract_arcface_v2_embedding_from_camera,
    cache_customers_v2_embeddings,
    add_customer_v2_embedding,
    search_faiss_v2_candidates,
    compute_similarity_v2,
    similarity_to_confidence
)
from ai_service.utils import save_base64_image, get_avatar_path

router = APIRouter(prefix="/face", tags=["face"])

# Configuration
LARAVEL_PUBLIC_PATH = Path(__file__).parent.parent.parent / "public"  # Default path, can be configured
SUSPECTED_THRESHOLD = 0.42  # Lower threshold for suspected matches (e.g., mask)


def get_avatar_path_wrapper(avatar_url: Optional[str], avatar_path: Optional[str]) -> Optional[str]:
    """Wrapper for get_avatar_path with default public path"""
    return get_avatar_path(avatar_url, avatar_path, LARAVEL_PUBLIC_PATH)


@router.get(
    "/status",
    summary="Trạng thái Service (General)",
    description="Kiểm tra trạng thái chung của module nhận diện khuôn mặt.",
    response_description="Trạng thái hoạt động và các thông số cache hiện tại."
)
def face_status():
    """Get face recognition service status"""
    return {
        "service": "Face Recognition",
        "version": "v2",
        "available": v2_arcface.ARCFACE_V2_MODEL is not None,
        "model_loaded": v2_arcface.ARCFACE_V2_MODEL is not None,
        "customer_cache_size": len(v2_arcface.CUSTOMER_V2_CACHE.get("customers", [])),
        "customer_cache_version": v2_arcface.CUSTOMER_V2_CACHE.get("version", 0),
        "faiss_available": v2_arcface.FAISS_V2_INDEX is not None,
        "faiss_index_size": len(v2_arcface.FAISS_V2_ID_MAP),
        "similarity_threshold": v2_arcface.SIMILARITY_V2_THRESHOLD,
        "message": "Ready" if v2_arcface.ARCFACE_V2_MODEL is not None else "Not initialized"
    }


@router.get(
    "/v2/status",
    summary="Trạng thái V2 (ArcFace)",
    description="Kiểm tra chi tiết trạng thái của model ArcFace V2 và FAISS Index.",
    response_description="JSON chứa thông tin version, trạng thái model, và số lượng khách hàng đã cache."
)
def face_v2_status():
    """Get V2 face recognition status"""
    return {
        "version": "v2",
        "available": v2_arcface.ARCFACE_V2_MODEL is not None,
        "ai_service": "online",
        "model_loaded": v2_arcface.ARCFACE_V2_MODEL is not None,
        "faiss_available": v2_arcface.FAISS_V2_INDEX is not None,
        "customer_cache_size": len(v2_arcface.CUSTOMER_V2_CACHE.get("customers", [])),
        "similarity_threshold": v2_arcface.SIMILARITY_V2_THRESHOLD,
        "message": "Ready (V2 - ArcFace)" if v2_arcface.ARCFACE_V2_MODEL is not None else "Not initialized"
    }


@router.post(
    "/v2/cache-customers",
    summary="Cache Dữ liệu Khách hàng",
    description="Nhận danh sách khách hàng (ID, Tên, Avatar URL) từ Backend và tính toán embedding vector để lưu vào bộ nhớ RAM.",
    response_description="Kết quả cache (số lượng khách đã lưu)."
)
def face_v2_cache_customers(payload: CustomerCacheRequest):
    """Cache customer embeddings"""
    # Lazy initialization check
    if v2_arcface.ARCFACE_V2_MODEL is None:
        print("[INFO] V2 Model is None. Triggering LAZY INITIALIZATION for Cache...")
        init_arcface_v2_system()

    if v2_arcface.ARCFACE_V2_MODEL is None:
        error_msg = f"Face Recognition V2 chưa sẵn sàng. Lỗi: {v2_arcface.LAST_INIT_ERROR}" if v2_arcface.LAST_INIT_ERROR else "Face Recognition V2 chưa sẵn sàng"
        return {"ok": False, "message": error_msg}
    
    try:
        customers_data = [
            {
                "id": c.id,
                "name": c.name,
                "avatar_url": c.avatar_url,
                "avatar_path": c.avatar_path
            }
            for c in payload.customers
        ]
        
        success = cache_customers_v2_embeddings(
            customers_data,
            get_avatar_path_func=get_avatar_path_wrapper
        )
        
        return {
            "ok": success,
            "cached": len(v2_arcface.CUSTOMER_V2_CACHE.get("customers", [])),
            "cache_version": v2_arcface.CUSTOMER_V2_CACHE.get("version", 0),
            "message": f"Đã cache {len(v2_arcface.CUSTOMER_V2_CACHE.get('customers', []))} customers cho V2"
        }
    except Exception as e:
        print(f"[ERROR] Cache V2 customers failed: {e}")
        import traceback
        traceback.print_exc()
        return {"ok": False, "message": str(e)}


@router.post(
    "/v2/add-customer",
    summary="Thêm 1 Khách hàng mới (Incremental Cache)",
    description="Thêm một khách hàng mới vào cache hiện tại mà KHÔNG cần reload toàn bộ. Dùng khi vừa đăng ký thành viên mới.",
    response_description="Kết quả thêm vào cache."
)
def face_v2_add_customer(customer: CustomerFace):
    """Add single customer to cache"""
    # Lazy initialization check
    if v2_arcface.ARCFACE_V2_MODEL is None:
        init_arcface_v2_system()

    if v2_arcface.ARCFACE_V2_MODEL is None:
        return {"ok": False, "message": "Face Recognition V2 chưa sẵn sàng"}
    
    try:
        customer_data = {
            "id": customer.id,
            "name": customer.name,
            "avatar_url": customer.avatar_url,
            "avatar_path": customer.avatar_path
        }
        
        success = add_customer_v2_embedding(
            customer_data,
            get_avatar_path_func=get_avatar_path_wrapper
        )
        
        return {
            "ok": success,
            "cached_total": len(v2_arcface.CUSTOMER_V2_CACHE.get("customers", [])),
            "message": f"Đã thêm khách hàng {customer.name} vào cache V2" if success else "Thêm thất bại"
        }
    except Exception as e:
        print(f"[ERROR] Add V2 customer failed: {e}")
        return {"ok": False, "message": str(e)}


@router.post(
    "/v2/recognize",
    summary="Nhận diện Khuôn mặt",
    description="""
    **Nhận diện khuôn mặt từ ảnh Base64.**
    
    API hỗ trợ 2 chế độ:
    1. **Có Cache (Khuyên dùng):** So khớp với database đã cache trước (qua API `/cache-customers`).
    2. **Không Cache (Stateless - Test/New User):** Gửi kèm danh sách `customers` ngay trong request để nhận diện mà không cần cache trước.
    
    **Quy trình xử lý:**
    1. Decode Base64 & Xử lý ảnh (Resize/Crop).
    2. Detect khuôn mặt (InsightFace - Buffalo_L).
    3. Trích xuất đặc trưng (Embedding Vector).
    4. So khớp Cosine Similarity với Cache V2 hoặc danh sách gửi kèm.
    """,
    response_description="Kết quả nhận diện: thông tin khách hàng, độ tin cậy (confidence), và cảnh báo nghi ngờ (nếu có)."
)
def face_v2_recognize(req: FaceRecognizeRequest):
    """Recognize face using V2 ArcFace"""
    start_time = time.time()
    
    # Lazy initialization check
    if v2_arcface.ARCFACE_V2_MODEL is None:
        print("[INFO] V2 Model is None. Triggering LAZY INITIALIZATION...")
        init_arcface_v2_system()
    
    if v2_arcface.ARCFACE_V2_MODEL is None:
        return {
            "success": False,
            "matched": False,
            "message": "Face Recognition V2 chưa sẵn sàng"
        }
    
    temp_files = []
    
    try:
        # Save base64 image
        camera_image_path = save_base64_image(req.image_base64, "camera_v2")
        temp_files.append(camera_image_path)
        
        # Extract embedding
        camera_embedding, camera_face_info = extract_arcface_v2_embedding_from_camera(camera_image_path)
        
        # Handle no face detected
        if camera_embedding is None:
            for f in temp_files:
                try:
                    os.remove(f)
                except:
                    pass
            
            if camera_face_info and camera_face_info.get("quality_insufficient"):
                return {
                    "success": True,
                    "matched": False,
                    "face_detected": True,
                    "face_quality": camera_face_info.get("det_score", 0) * 100,
                    "face_box": camera_face_info.get("bbox"),
                    "message": camera_face_info.get("message", "Chất lượng mặt không đủ"),
                    "processing_time_ms": int((time.time() - start_time) * 1000)
                }
            
            return {
                "success": True,
                "matched": False,
                "face_detected": False,
                "message": camera_face_info.get("message", "Không phát hiện khuôn mặt") if camera_face_info else "Không phát hiện khuôn mặt",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        
        # Cache customers if provided
        if req.customers and len(req.customers) > 0:
            customers_data = [
                {
                    "id": c.id,
                    "name": c.name,
                    "avatar_url": c.avatar_url,
                    "avatar_path": c.avatar_path
                }
                for c in req.customers
            ]
            cache_customers_v2_embeddings(customers_data, get_avatar_path_func=get_avatar_path_wrapper)
        
        # Search for matches
        best_match = None
        best_similarity = 0.0
        best_customer_name = None
        
        if v2_arcface.FAISS_V2_INDEX is not None and len(v2_arcface.FAISS_V2_ID_MAP) > 0:
            # Use FAISS
            candidates = search_faiss_v2_candidates(camera_embedding, top_k=50)
            for idx, similarity in candidates:
                if similarity > best_similarity:
                    best_similarity = similarity
                    meta = v2_arcface.FAISS_V2_ID_MAP[idx]
                    best_match = {
                        "customer_id": meta["customer_id"],
                        "customer_name": meta["customer_name"],
                        "cosine_similarity": similarity,
                        "avatar_quality": meta.get("avatar_quality", 0.0)
                    }
                    best_customer_name = meta["customer_name"]
        else:
            # Fallback: linear search
            for customer_data in v2_arcface.CUSTOMER_V2_CACHE.get("customers", []):
                avatar_emb = np.array(customer_data["embedding"], dtype=np.float32)
                similarity_result = compute_similarity_v2(camera_embedding, avatar_emb)
                similarity = similarity_result["cosine_similarity"]
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = {
                        "customer_id": customer_data["customer_id"],
                        "customer_name": customer_data["customer_name"],
                        "cosine_similarity": similarity,
                        "avatar_quality": customer_data.get("avatar_quality", 0.0)
                    }
                    best_customer_name = customer_data["customer_name"]
        
        # Check threshold
        processing_time = int((time.time() - start_time) * 1000)
        quality_score = camera_face_info.get("det_score", 0.0) * 100 if camera_face_info else 0.0
        cropped_face = camera_face_info.get("cropped_face_base64") if camera_face_info else None
        
        # Check if match
        if best_match and (best_similarity >= v2_arcface.SIMILARITY_V2_THRESHOLD or best_similarity >= SUSPECTED_THRESHOLD):
            for f in temp_files:
                try:
                    os.remove(f)
                except:
                    pass
            
            is_suspected = best_similarity < v2_arcface.SIMILARITY_V2_THRESHOLD
            confidence = similarity_to_confidence(best_similarity)
            
            return {
                "success": True,
                "matched": True,
                "is_suspected": is_suspected,
                "face_detected": True,
                "customer_id": best_match["customer_id"],
                "customer_name": best_match["customer_name"],
                "confidence": confidence,
                "confidence_display": f"{confidence}%",
                "similarity": round(best_similarity, 4),
                "similarity_percent": round(best_similarity * 100, 2),
                "face_quality": round(quality_score, 1),
                "face_box": camera_face_info.get("bbox"),
                "cropped_face": cropped_face,
                "similarity_threshold": v2_arcface.SIMILARITY_V2_THRESHOLD,
                "processing_time_ms": processing_time,
                "detection_method": camera_face_info.get("detection_method"),
                "enhanced": camera_face_info.get("enhanced", False),
                "message": "Có thể là khách hàng (cần xác thực)" if is_suspected else "Nhận diện thành công"
            }
        else:
            for f in temp_files:
                try:
                    os.remove(f)
                except:
                    pass
            
            return {
                "success": True,
                "matched": False,
                "face_detected": True,
                "face_quality": round(quality_score, 1),
                "face_box": camera_face_info.get("bbox"),
                "cropped_face": cropped_face,
                "best_similarity": round(best_similarity, 4) if best_match else 0.0,
                "best_customer_name": best_customer_name if best_match else None,
                "similarity_threshold": v2_arcface.SIMILARITY_V2_THRESHOLD,
                "message": f"Không tìm thấy khách hàng phù hợp (độ tương đồng tốt nhất: {best_similarity:.1%}, ngưỡng: {v2_arcface.SIMILARITY_V2_THRESHOLD:.1%})",
                "processing_time_ms": processing_time,
                "detection_method": camera_face_info.get("detection_method"),
                "enhanced": camera_face_info.get("enhanced", False)
            }
    
    except Exception as e:
        for f in temp_files:
            try:
                os.remove(f)
            except:
                pass
        print(f"[ERROR] V2 Recognition failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "matched": False,
            "message": f"Lỗi: {str(e)}",
            "processing_time_ms": int((time.time() - start_time) * 1000)
        }
