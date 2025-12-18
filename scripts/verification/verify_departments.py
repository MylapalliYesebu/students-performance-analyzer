
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code != 200:
        print(f"Login failed for {username}: {response.text}")
        sys.exit(1)
    return response.json()["access_token"]

def verify_departments():
    print("1. Logging in as Admin...")
    token = login("admin", "admin123")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("2. Creating Department 'Civil Engineering' (CE)...")
    dept_data = {"name": "Civil Engineering", "code": "CE"}
    resp = requests.post(f"{BASE_URL}/admin/departments", json=dept_data, headers=headers)
    if resp.status_code == 201:
        dept_id = resp.json()["id"]
        print(f"   ✅ Created success. ID: {dept_id}")
    else:
        print(f"   ❌ Failed to create: {resp.text}")
        return

    print("3. Listing Departments...")
    resp = requests.get(f"{BASE_URL}/admin/departments", headers=headers)
    depts = resp.json()
    found = any(d["code"] == "CE" for d in depts)
    if found:
        print("   ✅ CE department found in list.")
    else:
        print("   ❌ CE department NOT found in list.")
        
    print("4. Updating Department name to 'Civil & Structural'...")
    update_data = {"name": "Civil & Structural"}
    resp = requests.put(f"{BASE_URL}/admin/departments/{dept_id}", json=update_data, headers=headers)
    if resp.status_code == 200 and resp.json()["name"] == "Civil & Structural":
        print("   ✅ Update success.")
    else:
         print(f"   ❌ Update failed: {resp.text}")

    print("5. Deleting Department...")
    resp = requests.delete(f"{BASE_URL}/admin/departments/{dept_id}", headers=headers)
    if resp.status_code == 204:
        print("   ✅ Delete success.")
    else:
        print(f"   ❌ Delete failed: {resp.status_code} {resp.text}")

    print("6. Verifying Deletion...")
    resp = requests.get(f"{BASE_URL}/admin/departments", headers=headers)
    found = any(d["id"] == dept_id for d in resp.json())
    if not found:
        print("   ✅ Department successfully removed from list.")
    else:
        print("   ❌ Department still exists in list.")

    print("7. Testing Student Access (Should fail)...")
    student_token = login("206F1A0501", "student123")
    s_headers = {"Authorization": f"Bearer {student_token}"}
    resp = requests.post(f"{BASE_URL}/admin/departments", json=dept_data, headers=s_headers)
    if resp.status_code == 403:
        print("   ✅ Student blocked from creating department.")
    else:
        print(f"   ❌ Student NOT blocked: {resp.status_code}")

if __name__ == "__main__":
    try:
        verify_departments()
    except Exception as e:
        print(f"An error occurred: {e}")
