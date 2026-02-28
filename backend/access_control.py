"""
Phase 8 - Access Control Helpers

This module provides helper functions for admin access control and dual support
between legacy and new academic models.
"""

from sqlalchemy.orm import Session
from models import Admin, Teacher, User, SubjectOffering, ExamSession


def is_admin(db: Session, user_id: int) -> bool:
    """
    Check if a user is an admin.
    
    Args:
        db: Database session
        user_id: User ID to check
        
    Returns:
        True if user is an admin, False otherwise
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "admin":
        return False
    
    # Check if teacher has admin record
    if user.teacher_profile:
        admin = db.query(Admin).filter(Admin.teacher_id == user.teacher_profile.id).first()
        return admin is not None
    
    return False


def get_admin_scope(db: Session, user_id: int) -> dict:
    """
    Get the scope of access for an admin user.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Dictionary with admin_type, department_id, section_id
        Returns None if not an admin
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.teacher_profile:
        return None
    
    admin = db.query(Admin).filter(Admin.teacher_id == user.teacher_profile.id).first()
    if not admin:
        return None
    
    return {
        "admin_type": admin.admin_type,
        "department_id": admin.department_id,
        "section_id": admin.section_id,
        "is_master": admin.admin_type == "master",
        "is_hod": admin.admin_type == "hod",
        "is_class_incharge": admin.admin_type == "class_incharge"
    }


def get_teacher_subject_offerings(db: Session, teacher_id: int, academic_year: str = "2024-25"):
    """
    Get subject offerings for a teacher (NEW academic model).
    
    Args:
        db: Database session
        teacher_id: Teacher ID
        academic_year: Academic year filter
        
    Returns:
        List of SubjectOffering objects
    """
    return db.query(SubjectOffering).filter(
        SubjectOffering.teacher_id == teacher_id,
        SubjectOffering.academic_year == academic_year
    ).all()


def get_teacher_subjects_legacy(db: Session, teacher_id: int):
    """
    Get subjects for a teacher (LEGACY model via subjects.teacher_id).
    
    Args:
        db: Database session
        teacher_id: Teacher ID
        
    Returns:
        List of Subject objects
    """
    from models import Subject
    return db.query(Subject).filter(Subject.teacher_id == teacher_id).all()


def get_students_by_section(db: Session, section_id: int):
    """
    Get all students in a section (NEW academic model).
    
    Args:
        db: Database session
        section_id: Section ID
        
    Returns:
        List of Student objects
    """
    from models import Student
    return db.query(Student).filter(Student.section_id == section_id).all()


def get_students_by_dept_semester(db: Session, department_id: int, semester_id: int):
    """
    Get students by department and semester (LEGACY model).
    
    Args:
        db: Database session
        department_id: Department ID
        semester_id: Semester ID
        
    Returns:
        List of Student objects
    """
    from models import Student
    return db.query(Student).filter(
        Student.department_id == department_id,
        Student.current_semester_id == semester_id
    ).all()


def map_exam_type_to_session(db: Session, exam_type_str: str, semester_id: int, 
                             regulation_id: int, academic_year: str = "2024-25"):
    """
    Map legacy exam_type string to ExamSession.
    
    Args:
        db: Database session
        exam_type_str: Legacy exam type string ("Internal-1", "Internal-2", "Semester")
        semester_id: Semester ID
        regulation_id: Regulation ID
        academic_year: Academic year
        
    Returns:
        ExamSession object or None
    """
    # Map legacy exam type strings to exam_type_id
    exam_type_map = {
        "Internal-1": 1,  # Mid-1
        "Internal-2": 2,  # Mid-2
        "Semester": 3     # Semester
    }
    
    exam_type_id = exam_type_map.get(exam_type_str)
    if not exam_type_id:
        return None
    
    return db.query(ExamSession).filter(
        ExamSession.exam_type_id == exam_type_id,
        ExamSession.semester_id == semester_id,
        ExamSession.regulation_id == regulation_id,
        ExamSession.academic_year == academic_year
    ).first()


def should_use_new_model(db: Session, teacher_id: int = None) -> bool:
    """
    Determine if new academic model should be used.
    
    Strategy: Use new model if subject_offerings exist for this teacher.
    
    Args:
        db: Database session
        teacher_id: Optional teacher ID to check
        
    Returns:
        True if new model should be used, False for legacy
    """
    if teacher_id:
        offerings_count = db.query(SubjectOffering).filter(
            SubjectOffering.teacher_id == teacher_id
        ).count()
        return offerings_count > 0
    
    # Global check
    return db.query(SubjectOffering).count() > 0


def get_section_for_student(db: Session, student_id: int):
    """
    Get the section for a student (NEW academic model).
    
    Args:
        db: Database session
        student_id: Student ID
        
    Returns:
        Section object or None
    """
    from models import Student, Section
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student or not student.section_id:
        return None
    
    return db.query(Section).filter(Section.id == student.section_id).first()


def get_subject_offering_for_teacher_subject(db: Session, teacher_id: int, 
                                             subject_id: int, 
                                             academic_year: str = "2024-25"):
    """
    Map teacher + subject to subject_offering (NEW academic model).
    
    This is useful for legacy APIs that accept subject_id but need to map
    to subject_offering_id internally.
    
    Args:
        db: Database session
        teacher_id: Teacher ID
        subject_id: Subject ID
        academic_year: Academic year filter
        
    Returns:
        SubjectOffering object or None
    """
    return db.query(SubjectOffering).filter(
        SubjectOffering.teacher_id == teacher_id,
        SubjectOffering.subject_id == subject_id,
        SubjectOffering.academic_year == academic_year
    ).first()


def verify_teacher_can_access_section(db: Session, teacher_id: int, section_id: int, 
                                      academic_year: str = "2024-25") -> bool:
    """
    Check if a teacher has access to a section (i.e., teaches any subject in that section).
    
    Args:
        db: Database session
        teacher_id: Teacher ID
        section_id: Section ID
        academic_year: Academic year filter
        
    Returns:
        True if teacher has access, False otherwise
    """
    offering_count = db.query(SubjectOffering).filter(
        SubjectOffering.teacher_id == teacher_id,
        SubjectOffering.section_id == section_id,
        SubjectOffering.academic_year == academic_year
    ).count()
    
    return offering_count > 0

