#!/usr/bin/env python3
"""
Script để test Laravel API endpoint
"""
import requests
import sys

# Thử IPv4 trước, nếu không được thì thử localhost (IPv6)
API_URLS = [
    "http://127.0.0.1:8000/api/products/classify-temperature",
    "http://localhost:8000/api/products/classify-temperature"
]

print("=" * 60)
print("Test Laravel API Endpoint")
print("=" * 60)
print()

for API_URL in API_URLS:
    print(f"[INFO] Testing: {API_URL}")
    print()
    
    try:
        # Test với limit=1
        print(f"[INFO] Test: GET với limit=1")
        response = requests.get(API_URL, params={'limit': 1}, timeout=10)
        print(f"   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {data}")
            print(f"[OK] Endpoint hoạt động qua {API_URL}!")
            sys.exit(0)
        else:
            print(f"   Response: {response.text[:200]}")
            print(f"[ERROR] Status code: {response.status_code}")
            sys.exit(1)
            
    except requests.exceptions.ConnectionError as e:
        print(f"[WARNING] Không thể kết nối đến {API_URL}")
        print(f"   Chi tiết: {e}")
        print()
        # Thử URL tiếp theo
        continue
        
    except Exception as e:
        print(f"[ERROR] Lỗi: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# Nếu đến đây thì không URL nào hoạt động
print("[ERROR] Không thể kết nối đến Laravel API qua cả IPv4 và IPv6!")
print()
print("[INFO] Kiểm tra:")
print("   1. Laravel API có đang chạy không?")
print("      cd Backend && php artisan serve --host=127.0.0.1 --port=8000")
print("   2. Port 8000 có đang listen không?")
print("      netstat -an | findstr :8000")
print("   3. Nếu Laravel listen trên IPv6, hãy khởi động lại với:")
print("      php artisan serve --host=127.0.0.1 --port=8000")
sys.exit(1)
    
except Exception as e:
    print(f"[ERROR] Lỗi: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
