# Dữ Liệu Mẫu API Sản Phẩm

## 1. GET /api/products - Danh sách sản phẩm (có phân trang)

### Response mẫu:

```json
{
  "data": [
    {
      "id": 1,
      "category_id": 3,
      "name": "Cà phê đen đá",
      "slug": "ca-phe-den-da",
      "sku": "CF-DEN-DA",
      "thumbnail": "/uploads/products/coffee-black-ice.jpg",
      "price": 25000.00,
      "original_price": 15000.00,
      "quantity": 1000,
      "status": "published",
      "is_featured": true,
      "sold_count": 450,
      "published_at": "2024-01-15T10:30:00.000000Z",
      "created_at": "2024-01-15T10:30:00.000000Z",
      "updated_at": "2024-01-15T10:30:00.000000Z",
      "effective_price": 20000.00,
      "has_active_promotion": true,
      "active_promotion_info": {
        "id": 5,
        "name": "Giảm 20% cho cà phê",
        "promotion_type": "percentage",
        "value": 20,
        "is_active": true,
        "starts_at": "2024-01-01T00:00:00.000000Z",
        "ends_at": "2024-01-31T23:59:59.000000Z",
        "pivot": {
          "product_id": 1,
          "promotion_id": 5,
          "priority": 1,
          "created_at": "2024-01-10T08:00:00.000000Z",
          "updated_at": "2024-01-10T08:00:00.000000Z"
        }
      },
      "category": {
        "id": 3,
        "name": "Cà phê",
        "slug": "coffee"
      },
      "promotions": [
        {
          "id": 5,
          "name": "Giảm 20% cho cà phê",
          "promotion_type": "percentage",
          "value": 20,
          "is_active": true,
          "starts_at": "2024-01-01T00:00:00.000000Z",
          "ends_at": "2024-01-31T23:59:59.000000Z"
        }
      ]
    },
    {
      "id": 2,
      "category_id": 4,
      "name": "Trà sữa trân châu",
      "slug": "tra-sua-tran-chau",
      "sku": "TS-TC-001",
      "thumbnail": "/uploads/products/milk-tea-bubble.jpg",
      "price": 35000.00,
      "original_price": 20000.00,
      "quantity": 500,
      "status": "published",
      "is_featured": false,
      "sold_count": 320,
      "published_at": "2024-01-14T09:15:00.000000Z",
      "created_at": "2024-01-14T09:15:00.000000Z",
      "updated_at": "2024-01-14T09:15:00.000000Z",
      "effective_price": 35000.00,
      "has_active_promotion": false,
      "active_promotion_info": null,
      "category": {
        "id": 4,
        "name": "Trà",
        "slug": "tea"
      },
      "promotions": []
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/products?page=1",
    "last": "http://localhost:8000/api/products?page=3",
    "prev": null,
    "next": "http://localhost:8000/api/products?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "path": "http://localhost:8000/api/products",
    "per_page": 15,
    "to": 15,
    "total": 35
  }
}
```

### Query Parameters:

- `search`: Tìm kiếm theo tên, SKU, mô tả
- `category_id`: Lọc theo danh mục
- `price_min`: Giá tối thiểu
- `price_max`: Giá tối đa
- `only_featured`: Chỉ lấy sản phẩm nổi bật (boolean)
- `per_page` hoặc `limit`: Số sản phẩm mỗi trang (mặc định: 15)
- `sort`: Sắp xếp (`latest`, `price_asc`, `price_desc`, `bestseller`)
- `filter[has_promotion]`: Lọc sản phẩm có khuyến mãi
- `filter[is_flash_sale]`: Lọc sản phẩm Flash Sale

---

## 2. GET /api/products/{id} - Chi tiết sản phẩm

### Response mẫu:

```json
{
  "id": 1,
  "category_id": 3,
  "supplier_id": 2,
  "sku": "CF-DEN-DA",
  "name": "Cà phê đen đá",
  "slug": "ca-phe-den-da",
  "thumbnail": "/uploads/products/coffee-black-ice.jpg",
  "short_description": "Cà phê đen đá truyền thống, đậm đà hương vị.",
  "description": "Cà phê đen đá được pha từ hạt cà phê rang xay, phục vụ với đá viên, vị đắng đậm đà đặc trưng của cà phê Việt Nam.",
  "attributes": {
    "type": "Đồ uống lạnh",
    "size": "Vừa",
    "temperature": "Lạnh"
  },
  "original_price": 15000.00,
  "price": 25000.00,
  "quantity": 1000,
  "reorder_point": 50,
  "sold_count": 450,
  "view_count": 1200,
  "is_featured": true,
  "status": "published",
  "warranty_months": 0,
  "weight": null,
  "dimensions": null,
  "published_at": "2024-01-15T10:30:00.000000Z",
  "created_at": "2024-01-15T10:30:00.000000Z",
  "updated_at": "2024-01-15T10:30:00.000000Z",
  "deleted_at": null,
  "effective_price": 20000.00,
  "has_active_promotion": true,
  "category": {
    "id": 3,
    "name": "Cà phê",
    "slug": "coffee",
    "description": "Các loại cà phê truyền thống và hiện đại.",
    "parent_id": 2,
    "is_active": true,
    "position": 1,
    "created_at": "2024-01-01T00:00:00.000000Z",
    "updated_at": "2024-01-01T00:00:00.000000Z",
    "deleted_at": null
  },
  "supplier": {
    "id": 2,
    "name": "Nhà cung cấp cà phê",
    "email": "supplier@example.com",
    "phone": "0901234567",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "created_at": "2024-01-01T00:00:00.000000Z",
    "updated_at": "2024-01-01T00:00:00.000000Z"
  },
  "images": [
    {
      "id": 1,
      "product_id": 1,
      "path": "/uploads/products/coffee-black-ice.jpg",
      "is_primary": true,
      "position": 0,
      "created_at": "2024-01-15T10:30:00.000000Z",
      "updated_at": "2024-01-15T10:30:00.000000Z"
    },
    {
      "id": 2,
      "product_id": 1,
      "path": "/uploads/products/coffee-black-ice-2.jpg",
      "is_primary": false,
      "position": 1,
      "created_at": "2024-01-15T10:30:00.000000Z",
      "updated_at": "2024-01-15T10:30:00.000000Z"
    }
  ],
  "promotions": [
    {
      "id": 5,
      "name": "Giảm 20% cho cà phê",
      "promotion_type": "percentage",
      "value": 20,
      "is_active": true,
      "starts_at": "2024-01-01T00:00:00.000000Z",
      "ends_at": "2024-01-31T23:59:59.000000Z",
      "pivot": {
        "product_id": 1,
        "promotion_id": 5,
        "priority": 1,
        "created_at": "2024-01-10T08:00:00.000000Z",
        "updated_at": "2024-01-10T08:00:00.000000Z"
      }
    }
  ]
}
```

---

## 3. GET /api/products/all - Tất cả sản phẩm (không phân trang)

### Response mẫu:

```json
{
  "data": [
    {
      "id": 1,
      "category_id": 3,
      "supplier_id": 2,
      "sku": "CF-DEN-DA",
      "name": "Cà phê đen đá",
      "slug": "ca-phe-den-da",
      "thumbnail": "/uploads/products/coffee-black-ice.jpg",
      "short_description": "Cà phê đen đá truyền thống, đậm đà hương vị.",
      "description": "Cà phê đen đá được pha từ hạt cà phê rang xay, phục vụ với đá viên, vị đắng đậm đà đặc trưng của cà phê Việt Nam.",
      "attributes": {
        "type": "Đồ uống lạnh",
        "size": "Vừa",
        "temperature": "Lạnh"
      },
      "original_price": 15000.00,
      "price": 25000.00,
      "quantity": 1000,
      "reorder_point": 50,
      "sold_count": 450,
      "view_count": 1200,
      "is_featured": true,
      "status": "published",
      "warranty_months": 0,
      "weight": null,
      "dimensions": null,
      "published_at": "2024-01-15T10:30:00.000000Z",
      "created_at": "2024-01-15T10:30:00.000000Z",
      "updated_at": "2024-01-15T10:30:00.000000Z",
      "deleted_at": null,
      "effective_price": 20000.00,
      "has_active_promotion": true,
      "active_promotion_info": {
        "id": 5,
        "name": "Giảm 20% cho cà phê",
        "promotion_type": "percentage",
        "value": 20,
        "is_active": true,
        "starts_at": "2024-01-01T00:00:00.000000Z",
        "ends_at": "2024-01-31T23:59:59.000000Z"
      },
      "category": {
        "id": 3,
        "name": "Cà phê",
        "slug": "coffee"
      },
      "supplier": {
        "id": 2,
        "name": "Nhà cung cấp cà phê"
      },
      "images": [
        {
          "id": 1,
          "product_id": 1,
          "path": "/uploads/products/coffee-black-ice.jpg",
          "is_primary": true,
          "position": 0,
          "created_at": "2024-01-15T10:30:00.000000Z",
          "updated_at": "2024-01-15T10:30:00.000000Z"
        }
      ],
      "promotions": [
        {
          "id": 5,
          "name": "Giảm 20% cho cà phê",
          "promotion_type": "percentage",
          "value": 20,
          "is_active": true,
          "starts_at": "2024-01-01T00:00:00.000000Z",
          "ends_at": "2024-01-31T23:59:59.000000Z"
        }
      ]
    }
    // ... các sản phẩm khác
  ],
  "total": 35
}
```

---

## 4. Giải thích các trường dữ liệu

### Trường cơ bản:

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | integer | ID sản phẩm |
| `category_id` | integer | ID danh mục |
| `supplier_id` | integer \| null | ID nhà cung cấp |
| `sku` | string | Mã SKU duy nhất |
| `name` | string | Tên sản phẩm |
| `slug` | string | URL-friendly name |
| `thumbnail` | string | Đường dẫn ảnh đại diện |
| `short_description` | string \| null | Mô tả ngắn |
| `description` | string \| null | Mô tả chi tiết |
| `attributes` | object \| null | Thuộc tính sản phẩm (JSON) |
| `original_price` | float \| null | Giá nhập (từ nhà cung cấp) |
| `price` | float | Giá bán |
| `quantity` | integer | Số lượng tồn kho |
| `reorder_point` | integer | Mức tồn kho tối thiểu |
| `sold_count` | integer | Số lượng đã bán |
| `view_count` | integer | Số lượt xem |
| `is_featured` | boolean | Sản phẩm nổi bật |
| `status` | string | Trạng thái (`published`, `draft`, `discontinued`) |
| `warranty_months` | integer | Thời gian bảo hành (tháng) |
| `weight` | float \| null | Trọng lượng |
| `dimensions` | string \| null | Kích thước |
| `published_at` | datetime \| null | Ngày xuất bản |
| `created_at` | datetime | Ngày tạo |
| `updated_at` | datetime | Ngày cập nhật |
| `deleted_at` | datetime \| null | Ngày xóa (soft delete) |

### Trường tính toán (Computed Attributes):

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `effective_price` | float | Giá sau khi áp dụng khuyến mãi |
| `has_active_promotion` | boolean | Có khuyến mãi đang hoạt động không |
| `active_promotion_info` | object \| null | Thông tin khuyến mãi đang áp dụng |

### Quan hệ (Relationships):

#### `category`:
```json
{
  "id": 3,
  "name": "Cà phê",
  "slug": "coffee",
  "description": "Các loại cà phê truyền thống và hiện đại.",
  "parent_id": 2,
  "is_active": true,
  "position": 1
}
```

#### `supplier`:
```json
{
  "id": 2,
  "name": "Nhà cung cấp cà phê",
  "email": "supplier@example.com",
  "phone": "0901234567"
}
```

#### `images`:
```json
[
  {
    "id": 1,
    "product_id": 1,
    "path": "/uploads/products/coffee-black-ice.jpg",
    "is_primary": true,
    "position": 0
  }
]
```

#### `promotions`:
```json
[
  {
    "id": 5,
    "name": "Giảm 20% cho cà phê",
    "promotion_type": "percentage",
    "value": 20,
    "is_active": true,
    "starts_at": "2024-01-01T00:00:00.000000Z",
    "ends_at": "2024-01-31T23:59:59.000000Z"
  }
]
```

---

## 5. Ví dụ sản phẩm quán cà phê

### Sản phẩm món nước:

```json
{
  "id": 1,
  "name": "Cà phê đen đá",
  "sku": "CF-DEN-DA",
  "category": {
    "name": "Cà phê",
    "slug": "coffee"
  },
  "price": 25000.00,
  "effective_price": 20000.00,
  "quantity": 1000,
  "attributes": {
    "type": "Đồ uống lạnh",
    "size": "Vừa",
    "temperature": "Lạnh"
  }
}
```

### Sản phẩm món ăn:

```json
{
  "id": 15,
  "name": "Bánh Tiramisu",
  "sku": "BN-TIRAMISU",
  "category": {
    "name": "Bánh ngọt",
    "slug": "cakes"
  },
  "price": 45000.00,
  "effective_price": 45000.00,
  "quantity": 50,
  "attributes": {
    "type": "Bánh ngọt",
    "size": "1 phần",
    "serving": "1 người"
  }
}
```

---

## 6. Lưu ý quan trọng

1. **Giá sản phẩm**:
   - `price`: Giá bán (giá khách hàng trả)
   - `original_price`: Giá nhập (từ nhà cung cấp)
   - `effective_price`: Giá sau khuyến mãi (tính từ `price`)

2. **Khuyến mãi**:
   - Chỉ hiển thị khuyến mãi đang hoạt động (trong thời gian `starts_at` - `ends_at`)
   - Ưu tiên Flash Sale trước, sau đó mới đến Special Offer
   - `has_active_promotion` = `true` khi có khuyến mãi đang áp dụng

3. **Trạng thái sản phẩm**:
   - `published`: Đã xuất bản (hiển thị trên website)
   - `draft`: Bản nháp (chỉ admin xem được)
   - `discontinued`: Ngừng kinh doanh

4. **Phân trang**:
   - Endpoint `/api/products` có phân trang (mặc định 15 sản phẩm/trang)
   - Endpoint `/api/products/all` trả về tất cả không phân trang

5. **Soft Delete**:
   - Sản phẩm bị xóa sẽ có `deleted_at` khác `null`
   - Mặc định không hiển thị sản phẩm đã xóa (trừ khi có `with_trashed=true`)
