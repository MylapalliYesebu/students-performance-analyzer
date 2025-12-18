
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code != 200:
        return None
    return response.json()

def verify_teachers():
    print("1. Logging in as Admin...")
    admin_auth = login("admin", "admin123")
    if not admin_auth:
        print("❌ Admin login failed")
        return
    token = admin_auth["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Needs valid Department. 
    print("2. Fetching Department IDs...")
    depts = requests.get(f"{BASE_URL}/admin/departments", headers=headers).json()
    if not depts:
        print("❌ Prerequisites failed: No departments found.")
        return
    dept_id = depts[0]["id"]
    print(f"   Using Dept ID: {dept_id}")

    print("3. Creating Teacher 'new.teacher@ideal.edu.in'...")
    new_teacher_email = "new.teacher@ideal.edu.in"
    teacher_data = {
        "email": new_teacher_email,
        "name": "New Teacher",
        "department_id": dept_id,
        "password": "teacher123"
    }
    resp = requests.post(f"{BASE_URL}/admin/teachers", json=teacher_data, headers=headers)
    
    teacher_id = None
    if resp.status_code == 201:
        teacher_id = resp.json()["id"]
        print(f"   ✅ Created success: {resp.json()}")
    elif resp.status_code == 400 and "already exists" in resp.text:
         print("   ✅ Teacher already exists (Expected if re-running).")
         # Fetch existing to get ID
         teachers = requests.get(f"{BASE_URL}/admin/teachers", headers=headers).json()
         for t in teachers:
             if t["email"] == new_teacher_email:
                 teacher_id = t["id"]
                 print(f"   Found existing ID: {teacher_id}")
                 break
    else:
        print(f"   ❌ Failed to create: {resp.text}")
        return

    print("4. Verifying Teacher Login...")
    teacher_auth = login(new_teacher_email, "teacher123")
    if teacher_auth:
        print("   ✅ Teacher login successful!")
    else:
        print("   ❌ Teacher login FAILED.")

    print("5. Assigning Subject to Teacher...")
    # Find a subject
    subjects = requests.get(f"{BASE_URL}/admin/subjects", headers=headers).json()
    if not subjects:
        print("   ❌ No subjects found to assign.")
    else:
        subject_id = subjects[0]["id"]
        assign_data = {"teacher_id": teacher_id, "subject_id": subject_id}
        resp = requests.post(f"{BASE_URL}/admin/teacher-subjects", json=assign_data, headers=headers)
        if resp.status_code == 201:
             print("   ✅ Assignment success.")
        else:
             print(f"   ❌ Assignment failed: {resp.text}")

    print("6. Listing Teachers...")
    resp = requests.get(f"{BASE_URL}/admin/teachers", headers=headers)
    teachers = resp.json()
    found = any(t["email"] == new_teacher_email for t in teachers)
    if found:
        print(f"   ✅ '{new_teacher_email}' found in list.")
    else:
        print(f"   ❌ '{new_teacher_email}' NOT found in list.")

if __name__ == "__main__":
    try:
        verify_teachers()
    except Exception as e:
        print(f"An error occurred: {e}")
