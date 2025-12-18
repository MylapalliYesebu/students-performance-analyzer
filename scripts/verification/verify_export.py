import requests
import json
import random
import string
import csv
import io

BASE_URL = "http://localhost:8000"

def get_random_string(length=8):
    return ''.join(random.choices(string.ascii_letters, k=length))

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code != 200:
        print(f"Login failed for {username}: {response.text}")
        return None
    return response.json()["access_token"]

def create_department(token, name, code):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/admin/departments", json={"name": name, "code": code, "description": "Test Dept"}, headers=headers)
    if response.status_code == 201:
        return response.json()
    # Handle if already exists
    if response.status_code == 400 and "already exists" in response.text:
         all_depts = requests.get(f"{BASE_URL}/admin/departments", headers=headers).json()
         for d in all_depts:
             if d["code"] == code:
                 return d
    return None

def create_semester(token, name):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/admin/semesters", json={"name": name}, headers=headers)
    if response.status_code == 201:
        return response.json()
    if response.status_code == 400 and "already exists" in response.text:
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
    return response.status_code == 201

def get_export_csv(token, params=None):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/reports/export", headers=headers, params=params)
    if response.status_code == 200:
        csv_file = io.StringIO(response.text)
        return list(csv.DictReader(csv_file))
    return None

def main():
    print("Starting Export Verification...")
    
    # 1. Login
    admin_token = login("admin", "admin123")
    if not admin_token: return

    # 2. Setup Data: 
    # Dept A, Sem 1, Subject A1
    # Dept B, Sem 2, Subject B1
    
    dept_a_code = f"DA_{get_random_string(3)}"
    dept_a = create_department(admin_token, f"Export Dept A {get_random_string()}", dept_a_code)
    sem_1 = create_semester(admin_token, "1-1")
    
    dept_b_code = f"DB_{get_random_string(3)}"
    dept_b = create_department(admin_token, f"Export Dept B {get_random_string()}", dept_b_code)
    sem_2 = create_semester(admin_token, "1-2")
    
    if not (dept_a and dept_b and sem_1 and sem_2):
        print("Failed to setup Departments/Semesters")
        return

    sub_a1 = create_subject(admin_token, "Subject A1", get_random_string(), dept_a['id'], sem_1['id'])
    sub_b1 = create_subject(admin_token, "Subject B1", get_random_string(), dept_b['id'], sem_2['id'])

    # Students
    stu_a = create_student(admin_token, "Student A", f"sa_{get_random_string()}@test.com", get_random_string(), dept_a['id'], sem_1['id'], "pass")
    stu_b = create_student(admin_token, "Student B", f"sb_{get_random_string()}@test.com", get_random_string(), dept_b['id'], sem_2['id'], "pass")
    
    # Marks (Using Admin token to bypass restrictions)
    if stu_a and sub_a1:
        update_marks(admin_token, stu_a['id'], sub_a1['id'], "Midterm", 80, 100)
    if stu_b and sub_b1:
        update_marks(admin_token, stu_b['id'], sub_b1['id'], "Midterm", 90, 100)

    print("Data Setup Complete.")

    # 3. Test Filters
    
    # Filter 1: Department A
    print(f"\nTesting Filter: Department = {dept_a['code']}")
    rows_dept = get_export_csv(admin_token, {"department_id": dept_a['id']})
    if rows_dept:
        valid = all(row['Department'] == dept_a['code'] for row in rows_dept)
        found_stu_a = any(row['Student Name'] == "Student A" for row in rows_dept)
        not_found_stu_b = not any(row['Student Name'] == "Student B" for row in rows_dept)
        print(f"  Rows Returned: {len(rows_dept)}")
        print(f"  Only Dept A: {valid}")
        print(f"  Found Student A: {found_stu_a}")
        print(f"  Excluded Student B: {not_found_stu_b}")
        if valid and found_stu_a and not_found_stu_b:
            print("  ✅ Department Filter Passed")
        else:
             print("  ❌ Department Filter Failed")

    # Filter 2: Semester 2
    print(f"\nTesting Filter: Semester ID = {sem_2['id']}")
    rows_sem = get_export_csv(admin_token, {"semester_id": sem_2['id']})
    if rows_sem:
        # Check if we got Student B (who is in Semester 2)
        found_stu_b = any(row['Student Name'] == "Student B" for row in rows_sem)
        not_found_stu_a = not any(row['Student Name'] == "Student A" for row in rows_sem)
        print(f"  Rows Returned: {len(rows_sem)}")
        print(f"  Found Student B: {found_stu_b}")
        print(f"  Excluded Student A: {not_found_stu_a}")
        if found_stu_b and not_found_stu_a:
            print("  ✅ Semester Filter Passed")
        else:
             print("  ❌ Semester Filter Failed")
             
    # Filter 3: Subject A1
    print(f"\nTesting Filter: Subject ID = {sub_a1['id']}")
    rows_sub = get_export_csv(admin_token, {"subject_id": sub_a1['id']})
    if rows_sub:
        valid = all(row['Subject Name'] == "Subject A1" for row in rows_sub)
        print(f"  Rows Returned: {len(rows_sub)}")
        print(f"  Only Subject A1: {valid}")
        if valid and len(rows_sub) > 0:
            print("  ✅ Subject Filter Passed")
        else:
            print("  ❌ Subject Filter Failed")

if __name__ == "__main__":
    main()
