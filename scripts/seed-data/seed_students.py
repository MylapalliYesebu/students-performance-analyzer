import sys
import os

# Add the project root directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import User, Student

db: Session = SessionLocal()

# ---------------- CONSTANTS ----------------
COLLEGE_CODE = "6K"
COURSE_TYPE = "1"   # Regular
COURSE_CODE = "A"   # B.Tech

# Department → Branch Code
BRANCH_CODES = {
    1: "05",  # CSE
    2: "43",  # CSE-AIML
    3: "12",  # CS General
    4: "03",  # ME
    5: "04",  # ECE
}

# Admission year mapping (semester-based)
YEAR_BY_SEMESTER = {
    1: "25", 2: "25",  # 1st year
    3: "24", 4: "24",  # 2nd year
    5: "23", 6: "23",  # 3rd year
    7: "22", 8: "22",  # 4th year
}

# -------------------------------------------

def generate_roll(year, branch_code, serial):
    """
    Generates roll number like: 236K1A0512
    """
    return f"{year}{COLLEGE_CODE}{COURSE_TYPE}{COURSE_CODE}{branch_code}{serial:02d}"

def seed_students(students_per_dept=14):
    """
    students_per_dept = 14  → total 70
    students_per_dept = 30  → total 150
    """
    student_users = (
        db.query(User)
        .filter(User.role == "student")
        .order_by(User.id)
        .all()
    )

    expected = students_per_dept * len(BRANCH_CODES)
    if len(student_users) < expected:
        raise Exception(f"Not enough student users. Needed {expected}")

    user_index = 0

    for dept_id, branch_code in BRANCH_CODES.items():
        for serial in range(1, students_per_dept + 1):
            user = student_users[user_index]

            # Rotate semesters realistically
            semester_id = (serial % 8) + 1
            admission_year = YEAR_BY_SEMESTER[semester_id]

            student = Student(
                user_id=user.id,
                roll_number=generate_roll(admission_year, branch_code, serial),
                name=f"Student_{dept_id}_{serial}",
                department_id=dept_id,
                current_semester_id=semester_id
            )

            db.add(student)
            user_index += 1

    db.commit()
    print(f"✅ students seeded successfully")

if __name__ == "__main__":
    seed_students()  # default = 70 students
