"""
Temperature Classification API Router
"""
from fastapi import APIRouter
from pathlib import Path
from api.models import CollectItem, PredictRequest, PredictItem, MenuCacheRequest, RecommendRequest
from ai_service.temperature import TemperatureClassifier

router = APIRouter(prefix="/temperature", tags=["temperature"])

# Initialize classifier (can be configured via environment variables)
DATASET_PATH = Path("dataset.jsonl")
MODEL_PATH = Path("model.joblib")
classifier = TemperatureClassifier(dataset_path=DATASET_PATH, model_path=MODEL_PATH)


@router.get(
    "/",
    summary="Trạng thái Module Temperature",
    description="Kiểm tra trạng thái của module phân loại nhiệt độ và model ML.",
    response_description="Trạng thái hoạt động và trạng thái load model."
)
def root():
    """Root endpoint"""
    return {
        "service": "Temperature Classification",
        "status": "running",
        "hasModel": classifier.model is not None
    }


@router.get(
    "/stats",
    summary="Thống kê Dataset",
    description="Lấy thống kê về số lượng mẫu training trong dataset (hot/cold/total).",
    response_description="JSON chứa thống kê chi tiết."
)
def stats():
    """Get dataset statistics"""
    return classifier.get_stats()





@router.post(
    "/reload-model",
    summary="Tải lại Model",
    description="Huấn luyện lại model từ dataset hiện tại và reload vào bộ nhớ.",
    response_description="Kết quả reload."
)
def reload_model():
    """Reload ML model"""
    success = classifier.reload_model()

@router.post(
    "/cache-menu",
    summary="Cache Menu Món ăn",
    description="Gửi danh sách menu để AI phân loại sẵn Nóng/Lạnh và lưu vào cache.",
    response_description="Số lượng món đã cache."
)
def cache_menu(req: MenuCacheRequest):
    """Cache menu for recommendation"""
    count = classifier.cache_menu([item.dict() for item in req.items])
    return {"ok": True, "cached_count": count, "message": f"Cached {count} menu items"}


@router.post(
    "/recommend",
    summary="Gợi ý món theo Thời tiết",
    description="""
    Gợi ý món ăn dựa trên nhiệt độ môi trường.
    - Temp >= Threshold: Gợi ý món Lạnh (COLD).
    - Temp < Threshold: Gợi ý món Nóng (HOT).
    """,
    response_description="Danh sách món được gợi ý (sắp xếp theo độ tin cậy)."
)
def recommend(req: RecommendRequest):
    """Recommend based on temperature"""
    recommendations = classifier.recommend(req.temperature, req.threshold)
    return recommendations

