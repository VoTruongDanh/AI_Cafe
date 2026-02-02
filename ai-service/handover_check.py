
import requests
import sys

BASE_URL = "http://127.0.0.1:9009"

def check_endpoint(name, method, endpoint):
    try:
        if method == "GET":
            resp = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
        else:
            resp = requests.post(f"{BASE_URL}{endpoint}", json={}, timeout=5)
            
        if resp.status_code == 200:
            print(f"✅ {name}: OK")
            return True
        else:
            print(f"❌ {name}: Failed ({resp.status_code})")
            return False
    except Exception as e:
        print(f"❌ {name}: Connection Refused")
        return False

print("🚀 RUNNING FINAL HANDOVER CHECK...")
all_pass = True
all_pass &= check_endpoint("Health Check", "GET", "/health")
all_pass &= check_endpoint("Temperature Status", "GET", "/temperature/")
all_pass &= check_endpoint("Face V2 Status", "GET", "/face/v2/status")

if all_pass:
    print("\n🌟 SYSTEM READY FOR HANDOVER!")
else:
    print("\n⚠️ SYSTEM ISSUES DETECTED")
