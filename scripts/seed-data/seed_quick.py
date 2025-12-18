import sys
import os

# Add the project root directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from backend.database import SessionLocal, engine, Base
from backend import models
from backend.models import User, UserRole
from backend.auth import get_password_hash

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Check if admin exists
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        print("Creating admin user...")
        admin_user = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        db.add(admin_user)
        db.commit()
        print("Admin user created: admin / admin123")
    else:
        print("Admin user already exists.")

    # Create Department
    cse = db.query(models.Department).filter(models.Department.code == "CSE").first()
    if not cse:
        cse = models.Department(name="Computer Science", code="CSE")
        db.add(cse)
        db.commit()
        print("Department CSE created.")

    # Create Semester
    sem = db.query(models.Semester).filter(models.Semester.name == "1-1").first()
    if not sem:
        sem = models.Semester(name="1-1")
        db.add(sem)
        db.commit()
        print("Semester 1-1 created.")

    # Create Teacher User
    teacher_user = db.query(User).filter(User.username == "teacher").first()
    if not teacher_user:
        teacher_user = User(
            username="teacher",
            password_hash=get_password_hash("teacher123"),
            role=UserRole.TEACHER
        )
        db.add(teacher_user)
        db.commit()
        
        # Create Teacher Profile
        teacher_profile = models.Teacher(
            user_id=teacher_user.id,
            email="teacher@ideal.edu.in",
            name="Ravi Kumar",
            department_id=cse.id
        )
        db.add(teacher_profile)
        db.commit()
        print("Teacher created: teacher / teacher123")
    else:
        teacher_profile = teacher_user.teacher_profile

    # Create Subject
    subject = db.query(models.Subject).filter(models.Subject.code == "CS101").first()
    if not subject:
        subject = models.Subject(
            name="Python Programming",
            code="CS101",
            department_id=cse.id,
            semester_id=sem.id,
            teacher_id=teacher_profile.id
        )
        db.add(subject)
        db.commit()
        print("Subject CS101 created and assigned to teacher.")

    # Create Student User
    student_user = db.query(User).filter(User.username == "206F1A0501").first()
    if not student_user:
        student_user = User(
            username="206F1A0501",
            password_hash=get_password_hash("student123"),
            role=UserRole.STUDENT
        )
        db.add(student_user)
        db.commit()
        
        # Create Student Profile
        student_profile = models.Student(
            user_id=student_user.id,
            roll_number="206F1A0501",
            name="Student One",
            department_id=cse.id,
            current_semester_id=sem.id
        )
        db.add(student_profile)
        db.commit()
        print("Student created: 206F1A0501 / student123")

    db.close()

if __name__ == "__main__":
    seed_data()
