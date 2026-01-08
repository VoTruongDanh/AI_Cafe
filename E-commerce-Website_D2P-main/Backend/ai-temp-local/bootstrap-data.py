"""
Script để bootstrap dữ liệu ban đầu từ rule-based classifier
Chạy script này để thu thập mẫu từ database và gửi vào /collect
"""
import json
import requests
import sys
from pathlib import Path

# Fix encoding cho Windows console
if sys.platform == 'win32':
    try:
        import codecs
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except Exception:
        pass  # Ignore encoding errors

# URL của AI service (HTTPS)
AI_SERVICE_URL = "https://127.0.0.1:9009"

# URL của Laravel API
# Thử IPv4 trước, nếu không được thì thử localhost (IPv6)
LARAVEL_API_URLS = [
    "http://127.0.0.1:8000/api/products/classify-temperature",
    "http://localhost:8000/api/products/classify-temperature"
]

def normalize_vi(s: str) -> str:
    """Chuẩn hóa text tiếng Việt"""
    if not s:
        return ""
    s = s.lower()
    # Bỏ dấu đơn giản
    replacements = {
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
        'đ': 'd',
    }
    for old, new in replacements.items():
        s = s.replace(old, new)
        s = s.replace(old.upper(), new.upper())
    return s

def classify_rule_based(name: str, category_name: str = None) -> dict:
    """
    Rule-based classification (giống logic trong TemperatureClassifier.php)
    Trả về: {'temperature': 'HOT'|'COLD'|'UNKNOWN', 'confidence': float, 'source': str}
    """
    if not name:
        return {'temperature': 'UNKNOWN', 'confidence': 0.5, 'source': 'UNKNOWN'}
    
    text = normalize_vi(f"{name} | {category_name or ''}")
    
    # Keywords lạnh
    cold_keywords = [
        'da', 'iced', 'ice', 'lanh', 'frozen', 'smoothie', 'sinh to', 
        'kem', 'tra sua', 'nuoc ep', 'juice', 'cold', 'freeze',
        'ca phe da', 'tra da', 'nuoc ngot', 'soft drink', 'soda'
    ]
    
    # Keywords nóng
    hot_keywords = [
        'nong', 'hot', 'am', 'warm', 'steaming', 'boiling',
        'ca phe nong', 'tra nong', 'soup', 'lau', 'sup',
        'pho', 'bun', 'mi', 'noodle soup'
    ]
    
    # Kiểm tra keywords lạnh
    for kw in cold_keywords:
        if kw in text:
            return {'temperature': 'COLD', 'confidence': 0.95, 'source': 'RULE'}
    
    # Kiểm tra keywords nóng
    for kw in hot_keywords:
        if kw in text:
            return {'temperature': 'HOT', 'confidence': 0.90, 'source': 'RULE'}
    
    # Suy luận từ danh mục
    category_lower = (category_name or '').lower()
    if 'ca phe' in category_lower or 'coffee' in category_lower:
        if 'da' in text or 'ice' in text:
            return {'temperature': 'COLD', 'confidence': 0.85, 'source': 'RULE'}
        return {'temperature': 'HOT', 'confidence': 0.75, 'source': 'RULE'}
    
    # Suy luận từ món ăn nóng
    if any(kw in text for kw in ['lau', 'sup', 'pho', 'bun']):
        return {'temperature': 'HOT', 'confidence': 0.70, 'source': 'RULE'}
    
    return {'temperature': 'UNKNOWN', 'confidence': 0.50, 'source': 'UNKNOWN'}

def collect_sample(name: str, category_name: str, label: str, source: str, confidence: float):
    """Gửi mẫu đến AI service /collect"""
    try:
        import urllib3
        urllib3.disable_warnings()
        response = requests.post(
            f"{AI_SERVICE_URL}/collect",
            json={
                'name': name,
                'categoryName': category_name,
                'label': label,
                'source': source,
                'confidence': confidence
            },
            timeout=2,
            verify=False
        )
        return response.status_code == 200
    except Exception as e:
        print(f"  ❌ Lỗi khi gửi mẫu: {e}")
        return False

def bootstrap_from_laravel_api():
    """Lấy sản phẩm từ Laravel API và thu thập mẫu"""
    print("[...] Dang lay san pham tu Laravel API...")
    
    # Thử cả IPv4 và IPv6
    for LARAVEL_API_URL in LARAVEL_API_URLS:
        try:
            print(f"[INFO] Thu ket noi den: {LARAVEL_API_URL}")
            response = requests.get(LARAVEL_API_URL, params={'limit': 1000}, timeout=10)
            if response.status_code != 200:
                print(f"[WARNING] Status code: {response.status_code}, thu URL tiep theo...")
                continue
            
            data = response.json()
            if not data.get('success'):
                print(f"[WARNING] API tra ve loi: {data.get('message', 'Unknown error')}, thu URL tiep theo...")
                continue
            
            products = data.get('data', [])
            print(f"[OK] Lay duoc {len(products)} san pham tu {LARAVEL_API_URL}")
            
            collected = 0
            for product in products:
                name = product.get('name', '')
                category_name = product.get('categoryName', '')
                
                # Phân loại bằng rule-based
                classification = classify_rule_based(name, category_name)
                
                # Chỉ thu thập mẫu có nhãn chắc chắn (confidence >= 0.8)
                if classification['confidence'] >= 0.8 and classification['temperature'] in ['HOT', 'COLD']:
                    label = classification['temperature']
                    source = classification['source']
                    confidence = classification['confidence']
                    
                    if collect_sample(name, category_name, label, source, confidence):
                        collected += 1
                        print(f"  [OK] [{collected}] {name} -> {label} (confidence: {confidence:.2f})")
            
            return collected
            
        except requests.exceptions.ConnectionError as e:
            print(f"[WARNING] Khong the ket noi den {LARAVEL_API_URL}")
            print(f"   Chi tiet: {e}")
            # Thử URL tiếp theo
            continue
        except Exception as e:
            print(f"[WARNING] Loi khi ket noi den {LARAVEL_API_URL}: {e}")
            # Thử URL tiếp theo
            continue
    
    # Nếu đến đây thì không URL nào hoạt động
    print(f"[ERROR] Khong the ket noi den Laravel API qua ca IPv4 va IPv6!")
    print(f"   [INFO] Kiem tra:")
    print(f"   - Laravel API co dang chay khong?")
    print(f"   - Chay: cd .. && php artisan serve --host=127.0.0.1 --port=8000")
    print(f"   - Hoac: restart-laravel.bat")
    return 0

def bootstrap_from_file(file_path: str = "sample_products.json"):
    """Thu thập mẫu từ file JSON (nếu có)"""
    path = Path(file_path)
    if not path.exists():
        return 0
    
    print(f"🔄 Đang đọc từ file: {file_path}")
    try:
        with open(path, 'r', encoding='utf-8') as f:
            products = json.load(f)
        
        collected = 0
        for product in products:
            name = product.get('name', '')
            category_name = product.get('categoryName', product.get('category', {}).get('name', ''))
            
            classification = classify_rule_based(name, category_name)
            
            if classification['confidence'] >= 0.8 and classification['temperature'] in ['HOT', 'COLD']:
                label = classification['temperature']
                source = classification['source']
                confidence = classification['confidence']
                
                if collect_sample(name, category_name, label, source, confidence):
                    collected += 1
                    print(f"  ✅ [{collected}] {name} → {label}")
        
        return collected
    except Exception as e:
        print(f"❌ Lỗi khi đọc file: {e}")
        return 0

def main():
    print("=" * 60)
    print("Bootstrap Du Lieu Cho Local AI Model")
    print("=" * 60)
    print()
    
    # Kiểm tra AI service có chạy không
    try:
        import urllib3
        urllib3.disable_warnings()
        response = requests.get(f"{AI_SERVICE_URL}/docs", timeout=2, verify=False)
        if response.status_code != 200:
            print(f"[!] AI Service co ve khong chay tai {AI_SERVICE_URL}")
            print("   Hay chay: 1-start-ai-service.bat")
            return 1
    except Exception as e:
        print(f"[!] Khong the ket noi den AI Service tai {AI_SERVICE_URL}")
        print(f"   Loi: {e}")
        print("   Hay chay: 1-start-ai-service.bat")
        return 1
    
    print("[OK] AI Service dang chay")
    print()
    
    # Thu thập từ Laravel API
    collected = bootstrap_from_laravel_api()
    
    print()
    print("=" * 60)
    if collected == 0:
        print(f"[ERROR] Khong thu thap duoc mau nao!")
        print("[INFO] Kiem tra lai:")
        print("   - Laravel API co dang chay khong? (http://127.0.0.1:8000)")
        print("   - Endpoint co dung khong? (/api/products/classify-temperature)")
        return 1
    print(f"[OK] Da thu thap {collected} mau")
    print()
    print("Buoc tiep theo:")
    print("   1. Chay: python train.py")
    print("   2. Sau do: curl -X POST http://127.0.0.1:9009/reload-model")
    print("=" * 60)
    return 0

if __name__ == "__main__":
    try:
        exit_code = main()
        if exit_code is None:
            exit_code = 0
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n[!] Bi huy boi nguoi dung (Ctrl+C)")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Loi khi bootstrap: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
