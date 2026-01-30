"""
Temperature Classification API Router
"""
from fastapi import APIRouter
from pathlib import Path
from api.models import CollectItem, PredictRequest, PredictItem
from ai_service.temperature import TemperatureClassifier

router = APIRouter(prefix="/temperature", tags=["temperature"])

# Initialize classifier (can be configured via environment variables)
DATASET_PATH = Path("dataset.jsonl")
MODEL_PATH = Path("model.joblib")
classifier = TemperatureClassifier(dataset_path=DATASET_PATH, model_path=MODEL_PATH)


@router.get("/")
def root():
    """Root endpoint"""
    return {
        "service": "Temperature Classification",
        "status": "running",
        "hasModel": classifier.model is not None
    }


@router.get("/stats")
def stats():
    """Get dataset statistics"""
    return classifier.get_stats()


@router.post("/collect")
def collect(item: CollectItem):
    """Collect training sample"""
    classifier.collect_sample(
        name=item.name,
        category_name=item.categoryName,
        label=item.label,
        source=item.source,
        confidence=item.confidence
    )
    return {"ok": True, "message": "Sample collected"}


@router.post("/predict")
def predict(req: PredictRequest):
    """Predict temperature for items"""
    results = []
    for item in req.items:
        result = classifier.predict(item.name, item.categoryName)
        results.append({"id": item.id, **result})
    return results


@router.post("/reload-model")
def reload_model():
    """Reload ML model"""
    success = classifier.reload_model()
    return {"ok": success, "hasModel": classifier.model is not None}
