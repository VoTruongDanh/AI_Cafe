"""
Pydantic models for API requests/responses
"""
from typing import Optional, List
from pydantic import BaseModel


# Temperature Classifier Models
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


# Face Recognition Models
class CustomerFace(BaseModel):
    id: int
    name: str
    avatar_url: Optional[str] = None
    avatar_path: Optional[str] = None


class FaceRecognizeRequest(BaseModel):
    image_base64: str
    customers: Optional[List[CustomerFace]] = None


class CustomerCacheRequest(BaseModel):
    customers: List[CustomerFace]


class FaceDetectRequest(BaseModel):
    image_base64: str
