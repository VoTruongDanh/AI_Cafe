"""
Pydantic models for API requests/responses
"""
from typing import Optional, List
from pydantic import BaseModel, Field


# Temperature Classifier Models
class CollectItem(BaseModel):
    name: str = Field(..., description="Tên món ăn/đồ uống", example="Cà phê sữa đá")
    categoryName: Optional[str] = Field(None, description="Tên danh mục", example="Cà phê")
    label: Optional[str] = Field(None, description="Nhãn nhiệt độ (HOT/COLD)", example="COLD")
    source: str = Field("UNKNOWN", description="Nguồn dữ liệu (MANUAL/AUTO)", example="MANUAL")
    confidence: Optional[float] = Field(None, description="Độ tin cậy (0.0 - 1.0)", example=1.0)


class PredictItem(BaseModel):
    id: Optional[int] = Field(None, description="ID món ăn của hệ thống POS", example=101)
    name: str = Field(..., description="Tên món ăn cần dự đoán", example="Lẩu thái chua cay")
    categoryName: Optional[str] = Field(None, description="Tên danh mục", example="Món ăn")



class MenuCacheRequest(BaseModel):
    items: List[PredictItem] = Field(..., description="Danh sách món ăn để cache", example=[{"id": 1, "name": "Cà phê đá", "categoryName": "Cà phê"}])

class RecommendRequest(BaseModel):
    temperature: float = Field(..., description="Nhiệt độ môi trường hiện tại (°C)", example=32.5)
    threshold: Optional[float] = Field(30.0, description="Ngưỡng nhiệt độ phân chia Nóng/Lạnh (Mặc định 30°C)", example=30.0)

class PredictRequest(BaseModel):
    items: List[PredictItem] = Field(..., description="Danh sách món ăn cần phân loại")


# Face Recognition Models
class CustomerFace(BaseModel):
    id: int = Field(..., description="ID khách hàng từ hệ thống POS/Laravel", example=123)
    name: str = Field(..., description="Tên khách hàng", example="Nguyen Van A")
    avatar_url: Optional[str] = Field(None, description="URL ảnh đại diện (nếu có)", example="http://localhost:8000/uploads/avatars/1.jpg")
    avatar_path: Optional[str] = Field(None, description="Đường dẫn file nội bộ (nếu backend chung server)", example="/uploads/avatars/1.jpg")


class FaceRecognizeRequest(BaseModel):
    image_base64: str = Field(..., description="Chuỗi Base64 của ảnh chụp từ Camera", example="data:image/jpeg;base64,/9j/4AAQSkZJRg...")
    customers: Optional[List[CustomerFace]] = Field(None, description="Danh sách khách hàng để cache nóng (tùy chọn)")


class CustomerCacheRequest(BaseModel):
    customers: List[CustomerFace] = Field(..., description="Danh sách khách hàng cần cache vào hệ thống AI")


class FaceDetectRequest(BaseModel):
    image_base64: str = Field(..., description="Chuỗi Base64 ảnh cần detect")
