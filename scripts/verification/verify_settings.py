import requests
import json
import random
import string

BASE_URL = "http://localhost:8000"

def get_random_string(length=8):
    return ''.join(random.choices(string.ascii_letters, k=length))

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"LOGIN FAILED for {username}: {response.status_code} {response.text}")
    return None

def create_department(token, name):
    headers = {"Authorization": f"Bearer {token}"}
    code = f"DEPT_{get_random_string(3).upper()}"
    response = requests.post(f"{BASE_URL}/admin/departments", json={"name": name, "code": code, "description": "Test Dept"}, headers=headers)
    return response.json() if response.status_code == 201 else None

def create_semester(token, name):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/admin/semesters", json={"name": name}, headers=headers)
    if response.status_code == 201:
        return response.json()
    elif response.status_code == 400 and "already exists" in response.text:
        # Fetch ID if exists
        all_sems = requests.get(f"{BASE_URL}/admin/semesters", headers=headers).json()
        for s in all_sems:
            if s["name"] == name:
                return s
    return None

def create_subject(token, name, code, dept_id, sem_id):
    headers = {"Authorization": f"Bearer {token}"}
    data = {"name": name, "code": code, "credits": 3, "department_id": dept_id, "semester_id": sem_id}
    response = requests.post(f"{BASE_URL}/admin/subjects", json=data, headers=headers)
    return response.json() if response.status_code == 201 else None

def create_teacher(token, name, email, password, dept_id):
    headers = {"Authorization": f"Bearer {token}"}
    data = {"name": name, "email": email, "phone": "1234567890", "password": password, "department_id": dept_id}
    response = requests.post(f"{BASE_URL}/admin/teachers", json=data, headers=headers)
    return response.json() if response.status_code == 201 else None

def assign_teacher_subject(token, teacher_id, subject_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/admin/teacher-subjects", json={"teacher_id": teacher_id, "subject_id": subject_id}, headers=headers)
    if response.status_code != 201:
        print(f"ASSIGN TEACHER FAILED: {response.status_code} {response.text}")
    return response.status_code == 201

def create_student(token, name, email, roll, dept_id, sem_id, password):
    headers = {"Authorization": f"Bearer {token}"}
    data = {"name": name, "email": email, "roll_number": roll, "department_id": dept_id, "current_semester_id": sem_id, "password": password}
    response = requests.post(f"{BASE_URL}/admin/students", json=data, headers=headers)
    return response.json() if response.status_code == 201 else None

def update_marks(token, student_id, subject_id, marks_type, marks, total):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "student_id": student_id,
        "subject_id": subject_id,
        "exam_type": marks_type,
        "marks_obtained": marks,
        "total_marks": total,
        "is_absent": False
    }
    response = requests.post(f"{BASE_URL}/teacher/marks", json=data, headers=headers)
    if response.status_code != 201:
        print(f"UPDATE MARKS FAILED: {response.status_code} {response.text}")
    return response.status_code == 201

def update_settings(token, pass_percentage, weak_threshold):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "pass_percentage": pass_percentage,
        "weak_threshold": weak_threshold
    }
    response = requests.put(f"{BASE_URL}/admin/settings", json=data, headers=headers)
    return response.json() if response.status_code == 200 else None

def verify_student_marks(token, subject_name, expected_pass):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/student/marks", headers=headers)
    data = response.json()
    
    for semester in data:
        for subject in semester['subjects']:
            if subject['subject_name'] == subject_name:
                print(f"Subject: {subject_name}, Passed: {subject['is_passed']}, Expected: {expected_pass}")
                return subject['is_passed'] == expected_pass
    return False

def verify_analysis_weak(token, subject_name, expected_weak):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/student/analysis", headers=headers)
    data = response.json()
    
    weak_subjects = data.get('weak_subjects', [])
    is_weak = subject_name in weak_subjects
    print(f"Subject: {subject_name}, Weak: {is_weak}, Expected: {expected_weak}")
    return is_weak == expected_weak

def main():
    print("Starting verification...")
    
    # 1. Login as Admin
    admin_token = login("admin", "admin123")
    if not admin_token:
        print("Failed to login as admin")
        return

    # 2. Setup Data
    dept_name = f"Settings Dept {get_random_string()}"
    dept = create_department(admin_token, dept_name)
    if not dept:
        print("Failed to create department")
        return

    sem_name = "1-1"
    sem = create_semester(admin_token, sem_name)
    if not sem:
        print("Failed to create/get semester")
        return
    
    sub1_code = get_random_string()
    sub1 = create_subject(admin_token, "Subject A", sub1_code, dept['id'], sem['id'])
    
    sub2_code = get_random_string()
    sub2 = create_subject(admin_token, "Subject B", sub2_code, dept['id'], sem['id'])

    teacher_email = f"teacher_{get_random_string()}@test.com"
    teacher_pass = "teacher123"
    teacher = create_teacher(admin_token, "Teacher Settings", teacher_email, teacher_pass, dept['id'])
    assign_teacher_subject(admin_token, teacher['id'], sub1['id'])
    assign_teacher_subject(admin_token, teacher['id'], sub2['id'])

    student_email = f"student_{get_random_string()}@test.com"
    student_roll = get_random_string()
    student_pass = "student123"
    student = create_student(admin_token, "Student Settings", student_email, student_roll, dept['id'], sem['id'], student_pass)
    if not student:
        print("Failed to create student")
        return

    # 3. Add Marks (45% for Sub1, 55% for Sub2)
    # Use Admin token to bypass University marks restriction
    
    # 45 Marks Total (20 Internal + 25 University)
    update_marks(admin_token, student['id'], sub1['id'], "Internal 1", 20, 40)
    update_marks(admin_token, student['id'], sub1['id'], "University", 25, 60) # Total 45/100
    
    # 55 Marks Total (25 Internal + 30 University)
    update_marks(admin_token, student['id'], sub2['id'], "Internal 1", 25, 40)
    update_marks(admin_token, student['id'], sub2['id'], "University", 30, 60) # Total 55/100

    student_token = login(student_roll, student_pass)
    if not student_token:
        print("Failed to login as student")
        return

    print("\nTest Case 1: Standard Settings (Pass=40, Weak=50)")
    update_settings(admin_token, 40.0, 50.0)
    
    # Sub1 (45%): Pass (45 >= 40), Weak (45 < 50)
    # Sub2 (55%): Pass (55 >= 40), Not Weak (55 >= 50)
    
    if not verify_student_marks(student_token, "Subject A", True): return
    if not verify_analysis_weak(student_token, "Subject A", True): return
    if not verify_student_marks(student_token, "Subject B", True): return
    if not verify_analysis_weak(student_token, "Subject B", False): return

    print("\nTest Case 2: High Pass Threshold (Pass=50, Weak=50)")
    update_settings(admin_token, 50.0, 50.0)
    
    # Sub1 (45%): Fail (45 < 50)
    # Sub2 (55%): Pass (55 >= 50)
    
    if not verify_student_marks(student_token, "Subject A", False): return
    if not verify_student_marks(student_token, "Subject B", True): return

    print("\nTest Case 3: High Weak Threshold (Pass=40, Weak=60)")
    update_settings(admin_token, 40.0, 60.0)
    
    # Sub1 (45%): Weak (45 < 60)
    # Sub2 (55%): Weak (55 < 60)
    
    if not verify_analysis_weak(student_token, "Subject A", True): return
    if not verify_analysis_weak(student_token, "Subject B", True): return

    print("\nVerification Passed Successfully!")

if __name__ == "__main__":
    main()
