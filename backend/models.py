from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from .database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True) # Email for Teacher, Roll No for Student, anything for Admin
    password_hash = Column(String)
    role = Column(String) # Storing as string for simplicity, validated by schemas
    
    student_profile = relationship("Student", back_populates="user", uselist=False)
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    code = Column(String, unique=True)
    
    students = relationship("Student", back_populates="department")
    teachers = relationship("Teacher", back_populates="department")
    subjects = relationship("Subject", back_populates="department")

class Semester(Base):
    __tablename__ = "semesters"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True) # e.g., "1-1", "1-2"
    
    students = relationship("Student", back_populates="current_semester")
    subjects = relationship("Subject", back_populates="semester")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    roll_number = Column(String, unique=True, index=True)
    name = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    current_semester_id = Column(Integer, ForeignKey("semesters.id"))
    
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    current_semester = relationship("Semester", back_populates="students")
    marks = relationship("Marks", back_populates="student")

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    email = Column(String, unique=True, index=True)
    name = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    user = relationship("User", back_populates="teacher_profile")
    department = relationship("Department", back_populates="teachers")
    subjects_taught = relationship("Subject", back_populates="teacher")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    code = Column(String, unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    semester_id = Column(Integer, ForeignKey("semesters.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True) # Assigned teacher
    
    department = relationship("Department", back_populates="subjects")
    semester = relationship("Semester", back_populates="subjects")
    teacher = relationship("Teacher", back_populates="subjects_taught")
    marks = relationship("Marks", back_populates="subject")

class Marks(Base):
    __tablename__ = "marks"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    exam_type = Column(String) # "Slip Test", "Mid-1", "Mid-2", "University"
    marks_obtained = Column(Float)
    total_marks = Column(Float)
    
    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    pass_percentage = Column(Float, default=40.0)
    weak_threshold = Column(Float, default=50.0)
