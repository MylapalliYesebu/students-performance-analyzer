
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code != 200:
        return None
    return response.json()

def verify_student_performance():
    print("1. Setup: Ensuring Student (216F1A0501) has marks...")
    # Student 216F1A0501 created in verify_students.py (ID might be 2)
    # Marks created in verify_marks.py (Internal 1, 28/30) for Subject 1 (Physics, 1-1)
    
    # We need to add University marks to see separation
    # Teacher cannot add University marks. Need Admin or direct DB.
    # We'll use a mocked Admin backdoor or just assume we can use the seed data? 
    # Seed data has user 206F1A0501. But we are testing the NEW student 216F1A0501.
    
    # Let's create University marks for 216F1A0501 using a simplified trick:
    # We can temporarily allow Admin to post to /teacher/marks? No, router checks checks role=['teacher'].
    # Does Admin have 'teacher' role? No.
    # BUT, we can use the 'seed' student "206F1A0501" / "student123".
    # Seed student has initial data? "seed.py" creates marks?
    # Let's check seed student details.
    
    print("   Using SEED Student '206F1A0501'...")
    student_auth = login("206F1A0501", "student123")
    if not student_auth:
        print("❌ Seed student login failed.")
        return
    token = student_auth["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("2. Fetching Student Marks (Enhanced API)...")
    resp = requests.get(f"{BASE_URL}/student/marks", headers=headers)
    if resp.status_code != 200:
        print(f"❌ Failed to get marks: {resp.text}")
        return
        
    data = resp.json()
    # Expect list of SemesterPerformance
    print(f"   Received data for {len(data)} semesters.")
    
    if len(data) > 0:
        sem1 = data[0]
        print(f"   Semester: {sem1['semester_name']}")
        print(f"   Subjects: {len(sem1['subjects'])}")
        if len(sem1['subjects']) > 0:
            sub = sem1['subjects'][0]
            print(f"   Subject: {sub['subject_name']}")
            print(f"   Internal: {sub['internal_marks']}")
            print(f"   University: {sub['university_marks']}")
            print(f"   Total: {sub['total_marks']}")
            print(f"   Passed: {sub['is_passed']}")
            
            # Simple validation
            if "internal_marks" in sub and "university_marks" in sub:
                 print("   ✅ Structure valid.")
            else:
                 print("   ❌ Structure missing keys.")
    else:
        print("   ⚠️ No semester data found for seed student.")

    print("3. Fetching Analysis...")
    resp = requests.get(f"{BASE_URL}/student/analysis", headers=headers)
    if resp.status_code == 200:
        print(f"   ✅ Analysis success: {resp.json()}")
    else:
        print(f"   ❌ Analysis failed: {resp.text}")

if __name__ == "__main__":
    try:
        verify_student_performance()
    except Exception as e:
        print(f"An error occurred: {e}")
