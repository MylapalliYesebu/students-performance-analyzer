import sys
import os

# Add the project root directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import User, Teacher

db: Session = SessionLocal()

# Department IDs (from departments table)
DEPARTMENTS = [
    (1, "Computer Science and Engineering", "cse"),
    (2, "CSE - Artificial Intelligence and Machine Learning", "aiml"),
    (3, "Computer Science (General)", "cs"),
    (4, "Mechanical Engineering", "mech"),
    (5, "Electronics and Communication Engineering", "ece"),
]

def seed_teachers():
    teacher_users = (
        db.query(User)
        .filter(User.role == "teacher")
        .order_by(User.id)
        .all()
    )

    if len(teacher_users) != 15:
        raise Exception("Expected exactly 15 teacher users")

    index = 0
    for dept_id, dept_name, slug in DEPARTMENTS:
        for i in range(1, 4):  # 3 teachers per department
            user = teacher_users[index]
            teacher = Teacher(
                user_id=user.id,
                name=f"{dept_name} Faculty {i}",
                email=f"{slug}_faculty{i}@ideal.edu.in",
                department_id=dept_id
            )
            db.add(teacher)
            index += 1

    db.commit()
    print("✅ Teachers seeded successfully")

if __name__ == "__main__":
    seed_teachers()
