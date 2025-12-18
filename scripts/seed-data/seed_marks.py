import sys
import os

# Add the project root directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import random
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import Student, Subject, Marks

db: Session = SessionLocal()

EXAM_TYPES = [
    ("Internal-1", 30),
    ("Internal-2", 30),
    ("Semester", 70),
]

def generate_marks():
    students = db.query(Student).all()
    subjects = db.query(Subject).all()

    if not students or not subjects:
        raise Exception("Students or Subjects missing")

    count = 0

    for student in students:
        # Subjects for student's department & semester
        student_subjects = [
            s for s in subjects
            if s.department_id == student.department_id
            and s.semester_id == student.current_semester_id
        ]

        for subject in student_subjects:
            for exam_type, total in EXAM_TYPES:
                # Performance pattern
                chance = random.random()

                if chance < 0.2:          # Weak
                    marks = random.uniform(15, total * 0.5)
                elif chance < 0.8:        # Average
                    marks = random.uniform(total * 0.5, total * 0.8)
                else:                     # Topper
                    marks = random.uniform(total * 0.8, total)

                mark = Marks(
                    student_id=student.id,
                    subject_id=subject.id,
                    exam_type=exam_type,
                    marks_obtained=round(marks, 2),
                    total_marks=total
                )

                db.add(mark)
                count += 1

    db.commit()
    print(f"✅ {count} marks inserted")

if __name__ == "__main__":
    generate_marks()
