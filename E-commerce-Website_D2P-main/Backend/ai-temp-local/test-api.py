#!/usr/bin/env python3
"""
Test script cho AI Local Service
"""

import requests
import json

BASE_URL = "http://127.0.0.1:9009"

def test_health():
    """Test health check"""
    print("🔍 Testing health check...")
    r = requests.get(f"{BASE_URL}/")
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2, ensure_ascii=False)}")
    print()

def test_stats():
    """Test stats endpoint"""
    print("📊 Testing stats...")
    r = requests.get(f"{BASE_URL}/stats")
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2, ensure_ascii=False)}")
    print()

def test_collect():
    """Test collect endpoint"""
    print("📝 Testing collect...")
    data = {
        "name": "Cà phê đặc biệt của quán",
        "categoryName": "Cà phê",
        "label": "HOT",
        "source": "RULE",
        "confidence": 0.9
    }
    r = requests.post(f"{BASE_URL}/collect", json=data)
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2, ensure_ascii=False)}")
    print()

def test_predict():
    """Test predict endpoint"""
    print("🤖 Testing predict...")
    data = {
        "items": [
            {"id": 1, "name": "Cà phê đặc biệt", "categoryName": "Cà phê"},
            {"id": 2, "name": "Trà xanh đá", "categoryName": "Trà"}
        ]
    }
    r = requests.post(f"{BASE_URL}/predict", json=data)
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2, ensure_ascii=False)}")
    print()

def test_reload():
    """Test reload model"""
    print("🔄 Testing reload model...")
    r = requests.post(f"{BASE_URL}/reload-model")
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2, ensure_ascii=False)}")
    print()

if __name__ == "__main__":
    try:
        test_health()
        test_stats()
        test_collect()
        test_predict()
        test_reload()
        print("✅ All tests completed!")
    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to AI service at http://127.0.0.1:9009")
        print("💡 Make sure the service is running: python api.py")
    except Exception as e:
        print(f"❌ Error: {e}")
