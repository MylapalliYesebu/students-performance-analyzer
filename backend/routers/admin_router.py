from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import database, models, auth, schemas

router = APIRouter()

@router.get("/stats")
def read_admin_stats(current_user: models.User = Depends(auth.RoleChecker(["admin"])), db: Session = Depends(database.get_db)):
    # LEGACY COMPAT: Stats now include new academic model entities
    
    student_count = db.query(models.Student).count()
    teacher_count = db.query(models.Teacher).count()
    dept_count = db.query(models.Department).count()
    subject_count = db.query(models.Subject).count()
    
    # NEW MODEL: Add counts for new entities
    batch_count = db.query(models.Batch).count()
    section_count = db.query(models.Section).count()
    offering_count = db.query(models.SubjectOffering).count()
    exam_session_count = db.query(models.ExamSession).count()
    
    return {
        "students": student_count,
        "teachers": teacher_count,
        "departments": dept_count,
        "subjects": subject_count,
        "batches": batch_count,
        "sections": section_count,
        "subject_offerings": offering_count,
        "exam_sessions": exam_session_count
    }

@router.get("/reports/export")
def export_marks_csv(
    department_id: int = None,
    semester_id: int = None,
    subject_id: int = None,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
        
    # Start query
    query = db.query(
        models.Marks, models.Student, models.Subject, models.Department
    ).join(
        models.Student, models.Marks.student_id == models.Student.id
    ).join(
        models.Subject, models.Marks.subject_id == models.Subject.id
    ).join(
        models.Department, models.Student.department_id == models.Department.id
    )

    # Apply filters
    if department_id:
        query = query.filter(models.Student.department_id == department_id)
    if semester_id:
        query = query.filter(models.Student.current_semester_id == semester_id)
    # Note: Filtering by Student's semester might not be enough if we want specific subject marks regardless of current sem,
    # but usually "Semester Filter" means "Students in this semester" OR "Marks for subjects in this semester".
    # Given the context of "Performance Report", usually we want to filter by the Subject's semester or Student's semester.
    # Let's filter by Student's current semester for now as it aligns with "Class Report".
    # Wait, if I filter by Subject ID, that's specific.
    # If I filter by Semester ID, I probably want marks for subjects IN that semester OR students IN that semester.
    # Let's stick to Student's properties for Department/Semester filters as per standard "Class" view.
    
    if subject_id:
        query = query.filter(models.Marks.subject_id == subject_id)

    results = query.all()
    
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Student Name", "Roll Number", "Department", "Semester", 
        "Subject Code", "Subject Name", "Exam Type", "Marks Obtained", "Total Marks", "Percentage"
    ])
    
    # Rows
    for mark, student, subject, dept in results:
        percentage = (mark.marks_obtained / mark.total_marks) * 100 if mark.total_marks > 0 else 0
        writer.writerow([
            student.name,
            student.roll_number,
            dept.code,
            student.current_semester_id, # optimizing to avoid extra join if just ID is needed, but let's assume we want name if available. simplistic for now.
            subject.code,
            subject.name,
            mark.exam_type,
            mark.marks_obtained,
            mark.total_marks,
            f"{percentage:.2f}"
        ])
        
    output.seek(0)
    
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=student_performance_report.csv"
    return response

@router.post("/departments", response_model=schemas.DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept: schemas.DepartmentCreate,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    db_dept = db.query(models.Department).filter(models.Department.code == dept.code).first()
    if db_dept:
        raise HTTPException(status_code=400, detail="Department code already exists")
    
    new_dept = models.Department(**dept.dict())
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@router.get("/departments", response_model=List[schemas.DepartmentResponse])
def get_departments(
    current_user: models.User = Depends(auth.RoleChecker(["admin", "teacher"])),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Department).all()

@router.put("/departments/{dept_id}", response_model=schemas.DepartmentResponse)
def update_department(
    dept_id: int,
    dept_update: schemas.DepartmentUpdate,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    db_dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if dept_update.name:
        db_dept.name = dept_update.name
    if dept_update.code:
        # Check if code is already taken by another dept
        existing = db.query(models.Department).filter(models.Department.code == dept_update.code).first()
        if existing and existing.id != dept_id:
             raise HTTPException(status_code=400, detail="Department code already exists")
        db_dept.code = dept_update.code
        
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.delete("/departments/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    dept_id: int,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    db_dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Check for foreign key constraints (naive check, DB would fail anyway but good to provide useful error)
    if db_dept.students or db_dept.teachers or db_dept.subjects:
         raise HTTPException(status_code=400, detail="Cannot delete department with associated students, teachers, or subjects")

    db.delete(db_dept)
    db.commit()
    return None

@router.post("/semesters", response_model=schemas.SemesterResponse, status_code=status.HTTP_201_CREATED)
def create_semester(
    semester: schemas.SemesterCreate,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    db_sem = db.query(models.Semester).filter(models.Semester.name == semester.name).first()
    if db_sem:
         raise HTTPException(status_code=400, detail="Semester already exists")
    
    new_sem = models.Semester(name=semester.name)
    db.add(new_sem)
    db.commit()
    db.refresh(new_sem)
    return new_sem

@router.get("/semesters", response_model=List[schemas.SemesterResponse])
def get_semesters(
    current_user: models.User = Depends(auth.RoleChecker(["admin", "teacher"])),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Semester).all()

@router.post("/subjects", response_model=schemas.SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject: schemas.SubjectCreate,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    # Check if subject code exists
    if db.query(models.Subject).filter(models.Subject.code == subject.code).first():
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
    # Check if department exists
    if not db.query(models.Department).filter(models.Department.id == subject.department_id).first():
        raise HTTPException(status_code=404, detail="Department not found")

    # Check if semester exists
    if not db.query(models.Semester).filter(models.Semester.id == subject.semester_id).first():
        raise HTTPException(status_code=404, detail="Semester not found")
        
    new_subject = models.Subject(**subject.dict())
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return new_subject

@router.get("/subjects", response_model=List[schemas.SubjectResponse])
def get_subjects(
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Subject).all()

@router.post("/students", response_model=schemas.StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student: schemas.StudentCreate,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    # Check if department exists
    if not db.query(models.Department).filter(models.Department.id == student.department_id).first():
        raise HTTPException(status_code=404, detail="Department not found")

    # Check if semester exists
    if not db.query(models.Semester).filter(models.Semester.id == student.current_semester_id).first():
        raise HTTPException(status_code=404, detail="Semester not found")

    # Check if user already exists (Roll Number is username)
    if db.query(models.User).filter(models.User.username == student.roll_number).first():
        raise HTTPException(status_code=400, detail="Student with this Roll Number already exists")

    # Create User
    hashed_password = auth.get_password_hash(student.password)
    db_user = models.User(
        username=student.roll_number,
        password_hash=hashed_password,
        role=models.UserRole.STUDENT
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create Student Profile
    db_student = models.Student(
        user_id=db_user.id,
        roll_number=student.roll_number,
        name=student.name,
        department_id=student.department_id,
        current_semester_id=student.current_semester_id
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    return db_student

@router.get("/students", response_model=List[schemas.StudentResponse])
def get_students(
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Student).all()

@router.post("/teachers", response_model=schemas.TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(
    teacher: schemas.TeacherCreate,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    # Check department
    if not db.query(models.Department).filter(models.Department.id == teacher.department_id).first():
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Check email uniqueness (username)
    if db.query(models.User).filter(models.User.username == teacher.email).first():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Create User
    hashed_password = auth.get_password_hash(teacher.password)
    db_user = models.User(
        username=teacher.email,
        password_hash=hashed_password,
        role=models.UserRole.TEACHER
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create Teacher Profile
    db_teacher = models.Teacher(
        user_id=db_user.id,
        email=teacher.email,
        name=teacher.name,
        department_id=teacher.department_id
    )
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    
    return db_teacher

@router.get("/teachers", response_model=List[schemas.TeacherResponse])
def get_teachers(
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Teacher).all()

@router.post("/teacher-subjects", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def assign_subject_to_teacher(
    assignment: schemas.TeacherSubjectAssignment,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == assignment.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
        
    subject = db.query(models.Subject).filter(models.Subject.id == assignment.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    subject.teacher_id = teacher.id
    db.commit()
    
    return {"message": "Subject assigned successfully"}

@router.get("/settings", response_model=schemas.SettingsResponse)
def get_settings(
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    settings = db.query(models.Settings).first()
    if not settings:
        # Create default if not exists
        settings = models.Settings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings", response_model=schemas.SettingsResponse)
def update_settings(
    settings_update: schemas.SettingsUpdate,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    settings = db.query(models.Settings).first()
    if not settings:
        settings = models.Settings()
        db.add(settings)
    
    settings.pass_percentage = settings_update.pass_percentage
    settings.weak_threshold = settings_update.weak_threshold
    db.commit()
    db.refresh(settings)
    return settings


# ============================================================================
# NEW MODEL ENDPOINTS: Sections
# ============================================================================

@router.get("/sections")
def get_sections(
    current_user: models.User = Depends(auth.RoleChecker(["admin", "teacher"])),
    db: Session = Depends(database.get_db)
):
    """List all sections with batch and department info."""
    from schemas_extended import SectionResponse
    sections = db.query(models.Section).all()
    return [SectionResponse.from_orm(s) for s in sections]


@router.post("/sections", status_code=status.HTTP_201_CREATED)
def create_section(
    name: str,
    department_id: int,
    batch_id: int,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    """Create a new section."""
    # Verify department exists
    if not db.query(models.Department).filter(models.Department.id == department_id).first():
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Verify batch exists
    if not db.query(models.Batch).filter(models.Batch.id == batch_id).first():
        raise HTTPException(status_code=404, detail="Batch not found")
    
    new_section = models.Section(
        name=name,
        department_id=department_id,
        batch_id=batch_id
    )
    db.add(new_section)
    db.commit()
    db.refresh(new_section)
    
    from schemas_extended import SectionResponse
    return SectionResponse.from_orm(new_section)


# ============================================================================
# NEW MODEL ENDPOINTS: Subject Offerings
# ============================================================================

@router.get("/subject-offerings")
def get_subject_offerings(
    teacher_id: int = None,
    section_id: int = None,
    academic_year: str = None,
    current_user: models.User = Depends(auth.RoleChecker(["admin", "teacher"])),
    db: Session = Depends(database.get_db)
):
    """List all subject offerings with optional filters."""
    from schemas_extended import SubjectOfferingResponse
    
    query = db.query(models.SubjectOffering)
    
    if teacher_id:
        query = query.filter(models.SubjectOffering.teacher_id == teacher_id)
    if section_id:
        query = query.filter(models.SubjectOffering.section_id == section_id)
    if academic_year:
        query = query.filter(models.SubjectOffering.academic_year == academic_year)
    
    offerings = query.all()
    return [SubjectOfferingResponse.from_orm(o) for o in offerings]


@router.post("/subject-offerings", status_code=status.HTTP_201_CREATED)
def create_subject_offering(
    subject_id: int,
    section_id: int,
    teacher_id: int,
    academic_year: str,
    current_user: models.User = Depends(auth.RoleChecker(["admin"])),
    db: Session = Depends(database.get_db)
):
    """Create a new subject offering."""
    # Verify subject exists
    if not db.query(models.Subject).filter(models.Subject.id == subject_id).first():
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Verify section exists
    if not db.query(models.Section).filter(models.Section.id == section_id).first():
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Verify teacher exists
    if not db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first():
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Check for duplicates
    existing = db.query(models.SubjectOffering).filter(
        models.SubjectOffering.subject_id == subject_id,
        models.SubjectOffering.section_id == section_id,
        models.SubjectOffering.academic_year == academic_year
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Subject offering already exists for this section and academic year")
    
    new_offering = models.SubjectOffering(
        subject_id=subject_id,
        section_id=section_id,
        teacher_id=teacher_id,
        academic_year=academic_year
    )
    db.add(new_offering)
    db.commit()
    db.refresh(new_offering)
    
    from schemas_extended import SubjectOfferingResponse
    return SubjectOfferingResponse.from_orm(new_offering)

