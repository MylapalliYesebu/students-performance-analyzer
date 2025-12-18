import sys
import os

# Add the project root directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import Subject, Teacher

db: Session = SessionLocal()

# Department-wise subject pools
SUBJECT_POOLS = {
    1: [  # CSE
        "Programming Fundamentals", "Data Structures", "OOPS",
        "DBMS", "Operating Systems", "Computer Networks",
        "Software Engineering", "Machine Learning", "Artificial Intelligence"
    ],
    2: [  # AIML
        "Programming Fundamentals", "Data Structures", "OOPS",
        "Machine Learning", "Deep Learning", "Artificial Intelligence",
        "Data Mining", "Neural Networks", "DBMS"
    ],
    3: [  # CS General
        "Programming Fundamentals", "Data Structures", "OOPS",
        "DBMS", "Operating Systems", "Computer Networks",
        "Software Engineering", "Web Technologies", "Cloud Computing"
    ],
    4: [  # ME
        "Engineering Mechanics", "Strength of Materials", "Thermodynamics",
        "Fluid Mechanics", "Manufacturing Processes", "Machine Design",
        "Heat Transfer", "CAD CAM", "Metrology"
    ],
    5: [  # ECE
        "Network Theory", "Analog Electronics", "Digital Electronics",
        "Signals and Systems", "Microprocessors", "Communication Systems",
        "VLSI Design", "Embedded Systems", "Microwave Engineering"
    ],
}

def seed_subjects():
    for dept_id, subjects in SUBJECT_POOLS.items():
        teachers = (
            db.query(Teacher)
            .filter(Teacher.department_id == dept_id)
            .order_by(Teacher.id)
            .all()
        )

        if len(teachers) != 3:
            raise Exception(f"Expected 3 teachers for dept {dept_id}")

        subject_index = 0

        for semester_id in range(1, 9):  # 8 semesters
            for i in range(3):  # 3 subjects per semester
                subject_name = subjects[subject_index % len(subjects)]
                teacher = teachers[(semester_id + i) % 3]

                subject = Subject(
                    name=subject_name,
                    code=f"{dept_id}{semester_id}{i+1:02d}",
                    department_id=dept_id,
                    semester_id=semester_id,
                    teacher_id=teacher.id
                )

                db.add(subject)
                subject_index += 1

    db.commit()
    print("✅ Subjects seeded successfully")

if __name__ == "__main__":
    seed_subjects()
