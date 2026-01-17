import requests
import time

def check_status(port):
    url = f"http://localhost:{port}/api/admin/face/v2/status"
    print(f"Testing URL: {url}")
    try:
        resp = requests.get(url, timeout=2)
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

print("--- Testing Port 8000 (Laravel/Alias) ---")
check_status(8000)

print("\n--- Testing Port 9009 (Python Direct) ---")
# Direct port checks /face/v2/status (no /api/admin prefix unless alias works there too?)
# Alias router was mounted on app, so it works on 9009 too under /api/admin prefix.
check_status(9009)

print("\n--- Testing Port 9009 (Python Original Path) ---")
try:
    url = "http://localhost:9009/face/v2/status"
    resp = requests.get(url, timeout=2)
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
