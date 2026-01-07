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
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# URL của AI service
AI_SERVICE_URL = "http://127.0.0.1:9009"

# URL của Laravel API (cần điều chỉnh nếu khác)
LARAVEL_API_URL = "http://127.0.0.1:8000/api/products/classify-temperature"

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
        response = requests.post(
            f"{AI_SERVICE_URL}/collect",
            json={
                'name': name,
                'categoryName': category_name,
                'label': label,
                'source': source,
                'confidence': confidence
            },
            timeout=2
        )
        return response.status_code == 200
    except Exception as e:
        print(f"  ❌ Lỗi khi gửi mẫu: {e}")
        return False

def bootstrap_from_laravel_api():
    """Lấy sản phẩm từ Laravel API và thu thập mẫu"""
    print("[...] Dang lay san pham tu Laravel API...")
    
    try:
        response = requests.get(LARAVEL_API_URL, params={'limit': 1000}, timeout=10)
        if response.status_code != 200:
            print(f"[ERROR] Loi khi goi Laravel API: {response.status_code}")
            return 0
        
        data = response.json()
        if not data.get('success'):
            print(f"[ERROR] API tra ve loi: {data.get('message', 'Unknown error')}")
            return 0
        
        products = data.get('data', [])
        print(f"[OK] Lay duoc {len(products)} san pham")
        
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
        
    except Exception as e:
        print(f"[ERROR] Loi: {e}")
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
        response = requests.get(f"{AI_SERVICE_URL}/docs", timeout=2)
        if response.status_code != 200:
            print(f"[!] AI Service co ve khong chay tai {AI_SERVICE_URL}")
            print("   Hay chay: uvicorn api:app --host 127.0.0.1 --port 9009")
            return
    except:
        print(f"[!] Khong the ket noi den AI Service tai {AI_SERVICE_URL}")
        print("   Hay chay: uvicorn api:app --host 127.0.0.1 --port 9009")
        return
    
    print("[OK] AI Service dang chay")
    print()
    
    # Thu thập từ Laravel API
    collected = bootstrap_from_laravel_api()
    
    print()
    print("=" * 60)
    print(f"[OK] Da thu thap {collected} mau")
    print()
    print("Buoc tiep theo:")
    print("   1. Chay: python train.py")
    print("   2. Sau do: curl -X POST http://127.0.0.1:9009/reload-model")
    print("=" * 60)

if __name__ == "__main__":
    main()
