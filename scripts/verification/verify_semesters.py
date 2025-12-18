
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code != 200:
        print(f"Login failed for {username}: {response.text}")
        sys.exit(1)
    return response.json()["access_token"]

def verify_semesters():
    print("1. Logging in as Admin...")
    token = login("admin", "admin123")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check if 3-2 exists, if so skip creation or assume success
    print("2. Creating Semester '3-2'...")
    sem_data = {"name": "3-2"}
    resp = requests.post(f"{BASE_URL}/admin/semesters", json=sem_data, headers=headers)
    if resp.status_code == 201:
        print(f"   ✅ Created success: {resp.json()}")
    elif resp.status_code == 400 and "already exists" in resp.text:
         print("   ✅ Semester already exists (Expected behavior).")
    else:
        print(f"   ❌ Failed to create: {resp.text}")

    print("3. Attempting Invalid Semester '5-1'...")
    bad_data = {"name": "5-1"}
    resp = requests.post(f"{BASE_URL}/admin/semesters", json=bad_data, headers=headers)
    if resp.status_code == 422:
        print("   ✅ Invalid semester correctly rejected (422).")
    else:
        print(f"   ❌ Invalid semester NOT rejected properly: {resp.status_code} {resp.text}")

    print("4. Listing Semesters...")
    resp = requests.get(f"{BASE_URL}/admin/semesters", headers=headers)
    sems = resp.json()
    print(f"   Found {len(sems)} semesters.")
    found = any(s["name"] == "3-2" for s in sems)
    if found:
        print("   ✅ '3-2' found in list.")
    else:
        print("   ❌ '3-2' NOT found in list.")

if __name__ == "__main__":
    try:
        verify_semesters()
    except Exception as e:
        print(f"An error occurred: {e}")
