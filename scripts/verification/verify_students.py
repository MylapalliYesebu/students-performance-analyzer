
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code != 200:
        return None
    return response.json()

def verify_students():
    print("1. Logging in as Admin...")
    admin_auth = login("admin", "admin123")
    if not admin_auth:
        print("❌ Admin login failed")
        return
    token = admin_auth["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Needs valid Department and Semester IDs (reuse ones from prev steps)
    print("2. Fetching Department and Semester IDs...")
    depts = requests.get(f"{BASE_URL}/admin/departments", headers=headers).json()
    sems = requests.get(f"{BASE_URL}/admin/semesters", headers=headers).json()
    
    if not depts or not sems:
        print("❌ Prerequisites failed: No departments or semesters found.")
        return

    dept_id = depts[0]["id"]
    sem_id = sems[0]["id"]
    print(f"   Using Dept ID: {dept_id}, Sem ID: {sem_id}")

    print("3. Creating Student '216F1A0501'...")
    new_student_roll = "216F1A0501"
    student_data = {
        "roll_number": new_student_roll,
        "name": "New Student",
        "department_id": dept_id,
        "current_semester_id": sem_id,
        "password": "temporary_pass"
    }
    resp = requests.post(f"{BASE_URL}/admin/students", json=student_data, headers=headers)
    
    if resp.status_code == 201:
        print(f"   ✅ Created success: {resp.json()}")
    elif resp.status_code == 400 and "already exists" in resp.text:
         print("   ✅ Student already exists (Expected if re-running).")
    else:
        print(f"   ❌ Failed to create: {resp.text}")

    print("4. Verifying Student Login (Password Hashing)...")
    student_auth = login(new_student_roll, "temporary_pass")
    if student_auth:
        print("   ✅ Student login successful! Password hashed correctly.")
    else:
        print("   ❌ Student login FAILED.")

    print("5. Listing Students...")
    resp = requests.get(f"{BASE_URL}/admin/students", headers=headers)
    students = resp.json()
    found = any(s["roll_number"] == new_student_roll for s in students)
    if found:
        print(f"   ✅ '{new_student_roll}' found in list.")
    else:
        print(f"   ❌ '{new_student_roll}' NOT found in list.")

if __name__ == "__main__":
    try:
        verify_students()
    except Exception as e:
        print(f"An error occurred: {e}")
