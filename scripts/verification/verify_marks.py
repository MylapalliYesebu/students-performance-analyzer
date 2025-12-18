
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code != 200:
        return None
    return response.json()

def verify_marks():
    print("1. Logging in as Teacher 'new.teacher@ideal.edu.in'...")
    # This teacher was created in previous step and assigned a subject (ID 1 presumably)
    token_resp = login("new.teacher@ideal.edu.in", "teacher123")
    if not token_resp:
        print("❌ Teacher login failed. Ensure verify_teachers.py ran successfully.")
        return
    token = token_resp["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Needs valid Subject and Student.
    # We assigned Subject ID 1 (Physics usually) to this teacher.
    # We created Student '216F1A0501' (ID 2 usually).
    
    # Let's dynamically get assigned subjects
    print("2. Fetching Assigned Subjects...")
    subjects = requests.get(f"{BASE_URL}/teacher/subjects", headers=headers).json()
    if not subjects:
        print("❌ No assigned subjects found.")
        return
    subject_id = subjects[0]["id"]
    print(f"   Using Subject ID: {subject_id} ({subjects[0]['name']})")
    
    # Need a student ID. Admin can list students.
    # To simplify, we will login as admin just to get student ID, then back to teacher.
    admin_token = login("admin", "admin123")["access_token"]
    students = requests.get(f"{BASE_URL}/admin/students", headers={"Authorization": f"Bearer {admin_token}"}).json()
    if not students:
        print("❌ No students found.")
        return
    student_id = students[0]["id"]
    print(f"   Using Student ID: {student_id}")

    print("3. Uploading Internal Marks (Valid)...")
    marks_data = {
        "student_id": student_id,
        "subject_id": subject_id,
        "exam_type": "Internal 1",
        "marks_obtained": 25,
        "total_marks": 30
    }
    resp = requests.post(f"{BASE_URL}/teacher/marks", json=marks_data, headers=headers)
    if resp.status_code == 201:
        print(f"   ✅ Upload success: {resp.json()['marks_obtained']}")
    else:
        print(f"   ❌ Upload failed: {resp.text}")

    print("4. Updating Internal Marks (Valid Upsert)...")
    marks_data["marks_obtained"] = 28
    marks_data["marks_obtained"] = 28
    resp = requests.post(f"{BASE_URL}/teacher/marks", json=marks_data, headers=headers)
    if resp.status_code == 201 and resp.json()["marks_obtained"] == 28:
        print(f"   ✅ Update success: New marks {resp.json()['marks_obtained']}")
    else:
        print(f"   ❌ Update failed: {resp.text}")

    print("5. Attempting University Marks (Should Fail)...")
    uni_data = marks_data.copy()
    uni_data["exam_type"] = "University"
    resp = requests.post(f"{BASE_URL}/teacher/marks", json=uni_data, headers=headers)
    if resp.status_code == 403:
        print("   ✅ Access correctly blocked (403).")
    else:
        print(f"   ❌ University marks NOT blocked: {resp.status_code}")

    print("6. Attempting Unassigned Subject (Should Fail)...")
    # Try an ID that is likely not assigned, e.g. 99 or a new subject
    # Create a new subject as admin first to be sure it exists but is unassigned
    new_sub_data = {"name": "Math", "code": "M101", "department_id": subjects[0]["department_id"], "semester_id": subjects[0]["semester_id"]}
    s_resp = requests.post(f"{BASE_URL}/admin/subjects", json=new_sub_data, headers={"Authorization": f"Bearer {admin_token}"})
    if s_resp.status_code == 201 or (s_resp.status_code == 400 and "exists" in s_resp.text):
         # If created or exists, we assume it has an ID different from the assigned one if names differ, 
         # but simpler: use ID 9999 first to test 404/403 order, OR use a real unmatched ID.
         # Let's attempt ID 9999 simply. Router checks existence first (404), then assignment (403).
         # Wait, if we use 9999 and it doesn't exist, we get 404. We want 403.
         # We need a REAL subject that is NOT assigned.
         pass
         
    # Let's try to find a subject ID not in [s['id'] for s in subjects]
    all_subjects = requests.get(f"{BASE_URL}/admin/subjects", headers={"Authorization": f"Bearer {admin_token}"}).json()
    unassigned_id = None
    for s in all_subjects:
        if s["id"] != subject_id:
            unassigned_id = s["id"]
            break
            
    if unassigned_id:
        print(f"   Using Unassigned Subject ID: {unassigned_id}")
        bad_sub_data = marks_data.copy()
        bad_sub_data["subject_id"] = unassigned_id
        resp = requests.post(f"{BASE_URL}/teacher/marks", json=bad_sub_data, headers=headers)
        # Note: If unassigned_id actually has a DIFFERENT teacher, it returns 403. 
        # If it has NO teacher, it also returns 403 because subject.teacher_id (None) != teacher.id
        if resp.status_code == 403:
             print("   ✅ Access correctly blocked (403) for unassigned subject.")
        else:
             print(f"   ❌ Unassigned subject NOT blocked: {resp.status_code} {resp.text}")
    else:
        print("   ⚠️ Could not find unassigned subject to test.")

if __name__ == "__main__":
    try:
        verify_marks()
    except Exception as e:
        print(f"An error occurred: {e}")
