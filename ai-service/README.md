# AI Service API Documentation

Service cung cấp 2 tính năng chính: **Nhận diện khuôn mặt (Face Recognition V2)** và **Phân loại nhiệt độ món (Temperature Classification)**.

## 🚀 Cài đặt & Chạy

1.  **Cài đặt**: `pip install -r requirements.txt`
2.  **Khởi chạy**: `python main.py`
    -   Server: `http://127.0.0.1:9009`
    -   Docs: `http://127.0.0.1:9009/docs`

---

## 👤 Hướng dẫn Face Recognition (V2)

Luồng hoạt động theo cơ chế **Push & Cache**: Backend đẩy dữ liệu khách sang AI -> AI lưu RAM -> Camera so khớp.

### Bước 1: Cache Dữ liệu Khách hàng (Backend -> AI)
Gọi API này khi khởi động Backend hoặc khi có khách hàng mới/cập nhật avatar.

-   **API**: `POST /face/v2/cache-customers`
-   **Body**:
    ```json
    {
      "customers": [
        {
          "id": 1,
          "name": "Nguyen Van A",
          "avatar_path": "/uploads/avatars/user1.jpg" // Đường dẫn file trên server
        }
      ]
    }
    ```
-   **Response**: `{"ok": true, "message": "Đã cache 1 customers..."}`

### Bước 2: Nhận diện (Frontend -> AI)
Frontend hoặc Camera gửi ảnh Base64 lên để nhận diện.

-   **API**: `POST /face/v2/recognize`
-   **Body**:
    ```json
    {
      "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
      "customers": [] // Optional: Gửi kèm list khách nếu muốn cache nóng ngay lập tức
    }
    ```
-   **Response** (Quan trọng nhất):

    **✅ Có người quen (Match)**
    ```json
    {
        "success": true,
        "matched": true,
        "customer_id": 1,
        "customer_name": "Nguyen Van A",
        "confidence": 98.5,      // Độ tin cậy (0-100%)
        "similarity": 0.78,      // Điểm tương đồng (0.0-1.0, ngưỡng > 0.55)
        "face_detected": true
    }
    ```

    **❌ Người lạ (No Match)**
    ```json
    {
        "success": true,
        "matched": false,
        "message": "Không tìm thấy khách hàng phù hợp",
        "face_detected": true
    }
    ```

---

## 🌡️ Hướng dẫn Temperature (Phân loại Nóng/Lạnh)

Luồng hoạt động **Hybrid**: Ưu tiên check **Từ khóa (Rule)** -> Nếu không ra mới dùng **AI Model**.

### 1. Dự đoán (Predict)
Dùng để xác định món in ra Bếp (Nóng) hay Pha chế (Lạnh).

-   **API**: `POST /temperature/predict`
-   **Body**:
    ```json
    {
      "items": [
        { "id": 1, "name": "Cà phê sữa đá", "categoryName": "Cà phê" }
      ]
    }
    ```
-   **Response**:
    ```json
    [
      {
        "id": 1,
        "temperature": "COLD", // hoặc HOT
        "source": "RULE",      // RULE (từ khóa) hoặc MODEL (AI dự đoán)
        "confidence": 0.95
      }
    ]
    ```

### 2. Dạy AI (Collect Data)
Khi nhân viên sửa lại loại nhiệt độ đungs trên phần mềm, gọi API này để AI học.

-   **API**: `POST /temperature/collect`
-   **Body**:
    ```json
    {
      "name": "Trà đào lạ",
      "categoryName": "Trà",
      "label": "COLD"
    }
    ```

---

## 🛠️ Cấu trúc thư mục (Tham khảo)

-   `ai_service/face_recognition/`: Module nhận diện mặt.
-   `ai_service/temperature/`: Module nhiệt độ.
-   `api/routers/`: Các file định nghĩa API Endpoint.
-   `dataset.jsonl`: Dữ liệu AI tự học (Temperature).

