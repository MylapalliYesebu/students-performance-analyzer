
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code != 200:
        return None
    return response.json()

def verify_teacher_view():
    print("1. Logging in as Admin (to setup data)...")
    admin_token = login("admin", "admin123")["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # reuse previous data
    teacher_email = "new.teacher@ideal.edu.in"
    student_roll = "216F1A0501"
    
    # 1. Ensure a subject exists that is NOT assigned to this teacher
    # Teacher has Subject ID 1 (Physics) from previous test.
    # Create Subject 'Chemistry' (CH101) - ID 3 presumably
    chem_data = {"name": "Chemistry", "code": "CH101", "department_id": 1, "semester_id": 1}
    resp = requests.post(f"{BASE_URL}/admin/subjects", json=chem_data, headers=admin_headers)
    chem_id = None
    if resp.status_code == 200:
        chem_id = resp.json()["id"]
    elif resp.status_code == 400: # Already exists
        subs = requests.get(f"{BASE_URL}/admin/subjects", headers=admin_headers).json()
        for s in subs:
            if s["code"] == "CH101":
                chem_id = s["id"]
                break
    
    print(f"   Unassigned Subject ID: {chem_id}")

    # 2. Add marks for this unassigned subject (Admin can do this via backdoor or we make another teacher? 
    # Actually, verify_marks.py showed admin can't simply post to /teacher/marks ... wait.
    # /teacher/marks checks: if subject.teacher_id != teacher.id. 
    # ADMIN users have role='admin'. The RoleChecker allows 'teacher'.
    # Actually, we need to assign this subject to SOME teacher (or no one) and use THAT teacher to upload?
    # OR, we can just insert into DB? But we don't have direct DB access easily here.
    # Allow: Assign 'Chemistry' to 'teacher' (default teacher) and upload as 'teacher'.
    # 'teacher' user exists from seed.py.
    
    # Assign CH101 to 'teacher' (ID 1 usually)
    assign_data = {"teacher_id": 1, "subject_id": chem_id} 
    requests.post(f"{BASE_URL}/admin/teacher-subjects", json=assign_data, headers=admin_headers)
    
    print("2a. Uploading marks for ASSIGNED subject (Physics)...")
    my_token = login(teacher_email, "teacher123")["access_token"]
    my_headers = {"Authorization": f"Bearer {my_token}"}
    
    # Need student ID for 216F1A0501
    students = requests.get(f"{BASE_URL}/admin/students", headers=admin_headers).json()
    student_id = next(s["id"] for s in students if s["roll_number"] == student_roll)
    
    # Determine assigned subject ID (Physics, ID 1)
    # But let's get it dynamically
    my_subjects = requests.get(f"{BASE_URL}/teacher/subjects", headers=my_headers).json()
    assigned_sub_id = my_subjects[0]["id"]

    assigned_marks_data = {
        "student_id": student_id,
        "subject_id": assigned_sub_id,
        "exam_type": "Internal 1",
        "marks_obtained": 28,
        "total_marks": 30
    }
    requests.post(f"{BASE_URL}/teacher/marks", json=assigned_marks_data, headers=my_headers)


    # Login as 'teacher' and upload marks for CH101
    print("2b. Uploading marks for UNASSIGNED subject (as different teacher)...")
    other_teacher_token = login("teacher", "teacher123")["access_token"]
    other_headers = {"Authorization": f"Bearer {other_teacher_token}"}
    
    marks_data = {
        "student_id": student_id,
        "subject_id": chem_id,
        "exam_type": "Internal 1",
        "marks_obtained": 29,
        "total_marks": 30
    }
    requests.post(f"{BASE_URL}/teacher/marks", json=marks_data, headers=other_headers)

    # 3. Login as 'new.teacher' and try to view student
    print("3. Logging in as 'new.teacher' and requesting Student View...")
    
    resp = requests.get(f"{BASE_URL}/teacher/student/{student_roll}", headers=my_headers)
    if resp.status_code != 200:
        print(f"❌ Failed to get view: {resp.text}")
        return

    marks_list = resp.json()
    print(f"   Received {len(marks_list)} marks records.")
    
    # Verification
    # Should see Subject ID 1 (Physics) - marks 28 (from prev test)
    # Should NOT see Subject ID 3 (Chemistry) - marks 29
    
    seen_subjects = [m["subject_id"] for m in marks_list]
    if 1 in seen_subjects: # Physics assigned
        print("   ✅ assigned subject (Physics) marks found.")
    else:
        print("   ❌ assigned subject (Physics) marks MISSING.")

    if chem_id in seen_subjects: # Chemistry unassigned
        print(f"   ❌ UNASSIGNED subject (Chemistry) marks found! Security fail.")
    else:
        print("   ✅ unassigned subject (Chemistry) marks HIDDEN.")

if __name__ == "__main__":
    try:
        verify_teacher_view()
    except Exception as e:
        print(f"An error occurred: {e}")
