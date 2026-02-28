from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base  # Changed from relative to absolute import for Alembic compatibility
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
    is_active = Column(Boolean, default=True)  # Phase 2 addition
    
    student_profile = relationship("Student", back_populates="user", uselist=False)
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)

class Institute(Base):
    __tablename__ = "institutes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    
    batches = relationship("Batch", back_populates="institute")
    departments = relationship("Department", back_populates="institute")

class Regulation(Base):
    __tablename__ = "regulations"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=False)
    
    batches = relationship("Batch", back_populates="regulation")
    subjects = relationship("Subject", back_populates="regulation")
    exam_sessions = relationship("ExamSession", back_populates="regulation")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    code = Column(String, unique=True)
    short_code = Column(String)  # Phase 2 addition
    branch_code = Column(String)  # Phase 2 addition
    institute_id = Column(Integer, ForeignKey("institutes.id"))  # Phase 2 addition
    
    institute = relationship("Institute", back_populates="departments")
    students = relationship("Student", back_populates="department")
    teachers = relationship("Teacher", back_populates="department")
    subjects = relationship("Subject", back_populates="department")
    sections = relationship("Section", back_populates="department")
    admins = relationship("Admin", back_populates="department")

class Semester(Base):
    __tablename__ = "semesters"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True) # e.g., "1-1", "1-2"
    sequence = Column(Integer)  # Phase 2 addition
    
    students = relationship("Student", back_populates="current_semester")
    subjects = relationship("Subject", back_populates="semester")
    exam_sessions = relationship("ExamSession", back_populates="semester")

class Batch(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True, index=True)
    admission_year = Column(Integer, nullable=False, index=True)
    regulation_id = Column(Integer, ForeignKey("regulations.id"), nullable=False)
    institute_id = Column(Integer, ForeignKey("institutes.id"), nullable=False)
    
    regulation = relationship("Regulation", back_populates="batches")
    institute = relationship("Institute", back_populates="batches")
    sections = relationship("Section", back_populates="batch")
    students = relationship("Student", back_populates="batch")

class Section(Base):
    __tablename__ = "sections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    
    department = relationship("Department", back_populates="sections")
    batch = relationship("Batch", back_populates="sections")
    students = relationship("Student", back_populates="section")
    subject_offerings = relationship("SubjectOffering", back_populates="section")
    admins = relationship("Admin", back_populates="section")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    roll_number = Column(String, unique=True, index=True)
    name = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    current_semester_id = Column(Integer, ForeignKey("semesters.id"))
    batch_id = Column(Integer, ForeignKey("batches.id"))  # Phase 3 addition
    section_id = Column(Integer, ForeignKey("sections.id"))  # Phase 3 addition
    
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    current_semester = relationship("Semester", back_populates="students")
    batch = relationship("Batch", back_populates="students")
    section = relationship("Section", back_populates="students")
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
    subject_offerings = relationship("SubjectOffering", back_populates="teacher")
    admin = relationship("Admin", back_populates="teacher", uselist=False)

class ExamType(Base):
    __tablename__ = "exam_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    exam_sessions = relationship("ExamSession", back_populates="exam_type")

class ExamSession(Base):
    __tablename__ = "exam_sessions"
    id = Column(Integer, primary_key=True, index=True)
    exam_type_id = Column(Integer, ForeignKey("exam_types.id"), nullable=False, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    regulation_id = Column(Integer, ForeignKey("regulations.id"), nullable=False)
    academic_year = Column(String, nullable=False, index=True)
    exam_date = Column(DateTime, nullable=True)
    
    exam_type = relationship("ExamType", back_populates="exam_sessions")
    semester = relationship("Semester", back_populates="exam_sessions")
    regulation = relationship("Regulation", back_populates="exam_sessions")
    marks = relationship("Marks", back_populates="exam_session")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    code = Column(String, unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    semester_id = Column(Integer, ForeignKey("semesters.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True) # Assigned teacher (legacy)
    regulation_id = Column(Integer, ForeignKey("regulations.id"))  # Phase 2 addition
    
    department = relationship("Department", back_populates="subjects")
    semester = relationship("Semester", back_populates="subjects")
    teacher = relationship("Teacher", back_populates="subjects_taught")
    regulation = relationship("Regulation", back_populates="subjects")
    marks = relationship("Marks", back_populates="subject")
    subject_offerings = relationship("SubjectOffering", back_populates="subject")

class SubjectOffering(Base):
    __tablename__ = "subject_offerings"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    academic_year = Column(String, nullable=False, index=True)
    
    subject = relationship("Subject", back_populates="subject_offerings")
    section = relationship("Section", back_populates="subject_offerings")
    teacher = relationship("Teacher", back_populates="subject_offerings")
    marks = relationship("Marks", back_populates="subject_offering")

class Marks(Base):
    __tablename__ = "marks"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))  # Legacy
    exam_type = Column(String) # Legacy: "Slip Test", "Mid-1", "Mid-2", "University"
    marks_obtained = Column(Float)
    total_marks = Column(Float)  # Legacy
    # Phase 6 additions
    subject_offering_id = Column(Integer, ForeignKey("subject_offerings.id"), index=True)
    exam_session_id = Column(Integer, ForeignKey("exam_sessions.id"), index=True)
    max_marks = Column(Float)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    
    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")
    subject_offering = relationship("SubjectOffering", back_populates="marks")
    exam_session = relationship("ExamSession", back_populates="marks")

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False, unique=True, index=True)
    admin_type = Column(String, nullable=False, index=True)  # master, hod, class_incharge
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    teacher = relationship("Teacher", back_populates="admin")
    department = relationship("Department", back_populates="admins")
    section = relationship("Section", back_populates="admins")

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    pass_percentage = Column(Float, default=40.0)
    weak_threshold = Column(Float, default=50.0)
