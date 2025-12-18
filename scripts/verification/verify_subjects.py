
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code != 200:
        print(f"Login failed for {username}: {response.text}")
        sys.exit(1)
    return response.json()["access_token"]

def verify_subjects():
    print("1. Logging in as Admin...")
    token = login("admin", "admin123")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Needs valid Department and Semester IDs. 
    # From previous verification: we created a "CE" dept (ID 2 hopefully) and "3-2" sem (ID 2 hopefully).
    # But to be safe, let's fetch them first.
    print("2. Fetching Department and Semester IDs...")
    depts = requests.get(f"{BASE_URL}/admin/departments", headers=headers).json()
    sems = requests.get(f"{BASE_URL}/admin/semesters", headers=headers).json()
    
    if not depts or not sems:
        print("❌ Prerequisites failed: No departments or semesters found.")
        return

    dept_id = depts[0]["id"]
    sem_id = sems[0]["id"]
    print(f"   Using Dept ID: {dept_id}, Sem ID: {sem_id}")

    print("3. Creating Subject 'Physics' (PH101)...")
    sub_data = {
        "name": "Physics",
        "code": "PH101",
        "department_id": dept_id,
        "semester_id": sem_id
    }
    resp = requests.post(f"{BASE_URL}/admin/subjects", json=sub_data, headers=headers)
    if resp.status_code == 201:
        print(f"   ✅ Created success: {resp.json()}")
    elif resp.status_code == 400 and "already exists" in resp.text:
         print("   ✅ Subject already exists (Expected).")
    else:
        print(f"   ❌ Failed to create: {resp.text}")

    print("4. Attempting Invalid Dept ID...")
    bad_data = sub_data.copy()
    bad_data["department_id"] = 99999
    bad_data["code"] = "PH102"
    resp = requests.post(f"{BASE_URL}/admin/subjects", json=bad_data, headers=headers)
    if resp.status_code == 404:
        print("   ✅ Invalid Department correctly rejected (404).")
    else:
        print(f"   ❌ Invalid Department NOT rejected: {resp.status_code}")

    print("5. Listing Subjects...")
    resp = requests.get(f"{BASE_URL}/admin/subjects", headers=headers)
    subs = resp.json()
    found = any(s["code"] == "PH101" for s in subs)
    if found:
        print("   ✅ 'PH101' found in list.")
    else:
        print("   ❌ 'PH101' NOT found in list.")

if __name__ == "__main__":
    try:
        verify_subjects()
    except Exception as e:
        print(f"An error occurred: {e}")
