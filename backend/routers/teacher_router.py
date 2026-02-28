from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import database, models, auth, schemas, analysis


router = APIRouter()

@router.get("/subjects", response_model=List[dict]) # utilizing simple dict for now or create a schema
def get_teacher_subjects(
    current_user: models.User = Depends(auth.RoleChecker(["teacher"])),
    db: Session = Depends(database.get_db)
):
    # LEGACY COMPAT: Response shape maintains same structure as before
    # INTERNAL: Uses subject_offerings for accurate section-teacher-subject mapping
    
    teacher = current_user.teacher_profile
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    # Use NEW MODEL: Get subject offerings from access_control helper
    from access_control import get_teacher_subject_offerings
    subject_offerings = get_teacher_subject_offerings(db, teacher.id)
    
    # Group by subject to avoid duplicates (same subject taught to multiple sections)
    subjects_dict = {}
    for offering in subject_offerings:
        subject = offering.subject
        if subject.id not in subjects_dict:
            subjects_dict[subject.id] = {
                "id": subject.id, 
                "name": subject.name, 
                "code": subject.code, 
                "semester": subject.semester.name,
                "department_id": subject.department_id,
                "semester_id": subject.semester_id
            }
    
    return list(subjects_dict.values())

@router.get("/subject-offerings", response_model=List[dict])
def get_teacher_subject_offerings_enriched(
    current_user: models.User = Depends(auth.RoleChecker(["teacher"])),
    db: Session = Depends(database.get_db)
):
    """
    NEW ENDPOINT: Get enriched subject offerings for the logged-in teacher.
    
    Returns pre-joined data eliminating the need for frontend to call multiple endpoints:
    - subject_offerings (filtered by teacher)
    - subjects (with full details)
    - sections (with name)
    - semesters (for semester name)
    
    Response format:
    {
        "subject_offering_id": 1,
        "subject": {"id": 1, "name": "...", "code": "...", "semester_id": 1, "department_id": 1},
        "section": {"id": 1, "name": "A"},
        "academic_year": "2024-25",
        "semester_name": "1-1"
    }
    """
    teacher = current_user.teacher_profile
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    # Use NEW MODEL: Get subject offerings from access_control helper
    from access_control import get_teacher_subject_offerings
    subject_offerings = get_teacher_subject_offerings(db, teacher.id)
    
    # Enrich with subject, section, and semester data
    enriched_offerings = []
    for offering in subject_offerings:
        subject = offering.subject
        section = offering.section
        semester = subject.semester if subject else None
        
        enriched_offerings.append({
            "subject_offering_id": offering.id,
            "subject": {
                "id": subject.id,
                "name": subject.name,
                "code": subject.code,
                "semester_id": subject.semester_id,
                "department_id": subject.department_id
            } if subject else None,
            "section": {
                "id": section.id,
                "name": section.name
            } if section else None,
            "academic_year": offering.academic_year,
            "semester_name": semester.name if semester else None
        })
    
    return enriched_offerings

@router.post("/marks", response_model=schemas.MarksResponse, status_code=status.HTTP_201_CREATED)
def upload_marks(
    marks: schemas.MarksCreate,
    current_user: models.User = Depends(auth.RoleChecker(["teacher", "admin"])),
    db: Session = Depends(database.get_db)
):
    # LEGACY COMPAT: API accepts legacy params (subject_id, exam_type string, total_marks)
    # INTERNAL: Maps to new model (subject_offering_id, exam_session_id, max_marks)
    
    # Verify teacher teaches this subject (optional but recommended security check)
    teacher = current_user.teacher_profile
    subject = db.query(models.Subject).filter(models.Subject.id == marks.subject_id).first()
    
    if not subject:
         raise HTTPException(status_code=404, detail="Subject not found")
         
    # allow admin or the assigned teacher to upload
    if current_user.role != models.UserRole.ADMIN and subject.teacher_id != teacher.id:
         raise HTTPException(status_code=403, detail="You are not assigned to this subject")
         
    # Prevent modification of University marks (unless Admin)
    if marks.exam_type == "University" and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Teachers cannot modify University marks")

    # NEW MODEL MAPPING: Map legacy params to new model
    from access_control import get_subject_offering_for_teacher_subject, map_exam_type_to_session
    
    # Get student to determine regulation
    student = db.query(models.Student).filter(models.Student.id == marks.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get batch to determine regulation
    batch = student.batch if student.batch else None
    regulation_id = batch.regulation_id if batch else 1  # Default to regulation 1 if no batch
    
    # Map subject_id + teacher_id -> subject_offering_id
    subject_offering = None
    if teacher:
        subject_offering = get_subject_offering_for_teacher_subject(
            db, teacher.id, marks.subject_id
        )
    
    # Map exam_type string -> exam_session_id
    exam_session = map_exam_type_to_session(
        db, marks.exam_type, subject.semester_id, regulation_id
    )

    # Check if marks already exist for this student, subject, and exam type
    existing_marks = db.query(models.Marks).filter(
        models.Marks.student_id == marks.student_id,
        models.Marks.subject_id == marks.subject_id,
        models.Marks.exam_type == marks.exam_type
    ).first()

    if existing_marks:
        # Update existing marks (both legacy and new fields)
        existing_marks.marks_obtained = marks.marks_obtained
        existing_marks.total_marks = marks.total_marks  # Legacy
        existing_marks.max_marks = marks.total_marks     # New model
        existing_marks.subject_offering_id = subject_offering.id if subject_offering else None
        existing_marks.exam_session_id = exam_session.id if exam_session else None
        existing_marks.uploaded_by = current_user.id
        db.commit()
        db.refresh(existing_marks)
        return existing_marks
    else:
        # Create new marks (populate both legacy and new fields)
        db_marks = models.Marks(
            student_id=marks.student_id,
            subject_id=marks.subject_id,                # Legacy
            exam_type=marks.exam_type,                  # Legacy
            marks_obtained=marks.marks_obtained,
            total_marks=marks.total_marks,              # Legacy
            max_marks=marks.total_marks,                # New model
            subject_offering_id=subject_offering.id if subject_offering else None,  # New model
            exam_session_id=exam_session.id if exam_session else None,              # New model
            uploaded_by=current_user.id
        )
        db.add(db_marks)
        db.commit()
        db.refresh(db_marks)
        return db_marks

@router.get("/student/{roll_number}", response_model=List[schemas.MarksResponse])
def get_student_performance(
    roll_number: str,
    current_user: models.User = Depends(auth.RoleChecker(["teacher"])),
    db: Session = Depends(database.get_db)
):
    teacher = current_user.teacher_profile
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    student = db.query(models.Student).filter(models.Student.roll_number == roll_number).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get IDs of subjects assigned to this teacher
    assigned_subject_ids = [s.id for s in teacher.subjects_taught]

    # Query marks for this student, filtered by assigned subjects
    marks = db.query(models.Marks).filter(
        models.Marks.student_id == student.id,
        models.Marks.subject_id.in_(assigned_subject_ids)
    ).all()

    return marks

@router.get("/students/{department_id}/{semester_id}", response_model=List[schemas.StudentResponse])
def get_students_for_class(
    department_id: int,
    semester_id: int,
    section_id: int = None,  # NEW: Optional section_id param for new model
    current_user: models.User = Depends(auth.RoleChecker(["teacher"])),
    db: Session = Depends(database.get_db)
):
    # LEGACY COMPAT: Supports section_id query param for new model, falls back to dept/sem for legacy
    
    # NEW MODEL: If section_id provided, use section-based query
    if section_id:
        from access_control import get_students_by_section
        students = get_students_by_section(db, section_id)
    else:
        # LEGACY FALLBACK: Use department/semester filtering
        from access_control import get_students_by_dept_semester
        students = get_students_by_dept_semester(db, department_id, semester_id)
    
    return students

@router.get("/analysis/{department_id}/{semester_id}")
def get_class_analysis(
    department_id: int,
    semester_id: int,
    section_id: int = None,  # NEW: Optional section_id param for new model
    current_user: models.User = Depends(auth.RoleChecker(["teacher"])),
    db: Session = Depends(database.get_db)
):
    # LEGACY COMPAT: Analysis now section-aware, maintains dept/sem fallback
    
    # Get all students in this class
    if section_id:
        from access_control import get_students_by_section
        students = get_students_by_section(db, section_id)
    else:
        from access_control import get_students_by_dept_semester
        students = get_students_by_dept_semester(db, department_id, semester_id)
    
    student_ids = [s.id for s in students]
    
    # Get all marks for these students
    marks = db.query(models.Marks).filter(models.Marks.student_id.in_(student_ids)).all()
    
    marks_data = []
    for m in marks:
         marks_data.append({
            "subject": m.subject.name,
            "marks": m.marks_obtained,
            "total": m.total_marks,
            "student_id": m.student_id
        })
        
    return analysis.analyze_class_performance(marks_data)


@router.get("/ai-insights")
def get_ai_class_insights(
    subject_offering_id: int,
    current_user: models.User = Depends(auth.RoleChecker(["teacher"])),
    db: Session = Depends(database.get_db)
):
    """
    Generate AI-powered class insights for a specific subject offering.
    
    READ-ONLY: Uses existing marks data for the section.
    Returns natural-language insights about class performance.
    
    Query Params:
        subject_offering_id: ID of the subject offering
    
    Response:
        {
            "insights": "AI-generated class analysis text",
            "generated_at": "2025-12-26T20:15:00Z",
            "scope": {
                "subject": "OOPS",
                "section": "05-a",
                "academic_year": "2024-25"
            },
            "source": "ai" | "fallback"
        }
    """
    teacher = current_user.teacher_profile
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    # Verify subject offering exists
    subject_offering = db.query(models.SubjectOffering).filter(
        models.SubjectOffering.id == subject_offering_id
    ).first()
    
    if not subject_offering:
        raise HTTPException(status_code=404, detail="Subject offering not found")
    
    # Verify teacher has access to this subject offering
    if subject_offering.teacher_id != teacher.id:
        raise HTTPException(
            status_code=403, 
            detail="You do not have access to this subject offering"
        )
    
    # Extract scope information
    subject = subject_offering.subject
    section = subject_offering.section
    academic_year = subject_offering.academic_year
    
    # Get all students in this section
    from access_control import get_students_by_section
    students = get_students_by_section(db, section.id)
    student_ids = [s.id for s in students]
    
    if not student_ids:
        # No students in section - return early
        from ai_service import generate_teacher_insights
        return generate_teacher_insights({
            "subject_name": subject.name,
            "section_name": section.name,
            "academic_year": academic_year,
            "total_students": 0,
            "class_average": 0,
            "exam_sessions": [],
            "high_performers": [],
            "low_performers": [],
            "improvement_trend": "N/A - No students enrolled yet"
        })
    
    # Get all marks for these students in this subject
    marks = db.query(models.Marks).filter(
        models.Marks.student_id.in_(student_ids),
        models.Marks.subject_id == subject.id
    ).all()
    
    if not marks:
        # No marks data - return early
        from ai_service import generate_teacher_insights
        return generate_teacher_insights({
            "subject_name": subject.name,
            "section_name": section.name,
            "academic_year": academic_year,
            "total_students": len(students),
            "class_average": 0,
            "exam_sessions": [],
            "high_performers": [],
            "low_performers": [],
            "improvement_trend": "N/A - No marks recorded yet"
        })
    
    # Calculate class metrics
    # 1. Overall average
    total_obtained = 0
    total_max = 0
    
    for mark in marks:
        total_obtained += mark.marks_obtained
        max_marks = mark.max_marks if mark.max_marks else mark.total_marks
        total_max += max_marks
    
    class_average = (total_obtained / total_max * 100) if total_max > 0 else 0
    
    # 2. Exam session comparison
    exam_session_data = {}
    for mark in marks:
        if mark.exam_session:
            exam_name = mark.exam_session.exam_type.name if mark.exam_session.exam_type else "Unknown"
            if exam_name not in exam_session_data:
                exam_session_data[exam_name] = {"obtained": 0, "max": 0}
            
            max_marks = mark.max_marks if mark.max_marks else mark.total_marks
            exam_session_data[exam_name]["obtained"] += mark.marks_obtained
            exam_session_data[exam_name]["max"] += max_marks
    
    exam_sessions = []
    for exam_type, data in exam_session_data.items():
        if data["max"] > 0:
            avg_marks = (data["obtained"] / data["max"]) * 100
            exam_sessions.append({
                "exam_type": exam_type,
                "avg_marks": avg_marks
            })
    
    # 3. Student-wise performance for high/low performers
    student_performance = {}
    for mark in marks:
        student_id = mark.student_id
        if student_id not in student_performance:
            student_performance[student_id] = {"obtained": 0, "max": 0}
        
        max_marks = mark.max_marks if mark.max_marks else mark.total_marks
        student_performance[student_id]["obtained"] += mark.marks_obtained
        student_performance[student_id]["max"] += max_marks
    
    high_performers = []
    low_performers = []
    
    for student_id, perf in student_performance.items():
        if perf["max"] > 0:
            percentage = (perf["obtained"] / perf["max"]) * 100
            student = db.query(models.Student).filter(models.Student.id == student_id).first()
            
            if percentage >= 75:
                high_performers.append(student.name if student else f"Student {student_id}")
            elif percentage < 50:
                low_performers.append(student.name if student else f"Student {student_id}")
    
    # 4. Determine improvement trend (if multiple exam sessions)
    if len(exam_sessions) >= 2:
        # Sort by exam type (assuming Mid-1, Mid-2, Semester order)
        exam_sessions_sorted = sorted(exam_sessions, key=lambda x: x["exam_type"])
        first_avg = exam_sessions_sorted[0]["avg_marks"]
        last_avg = exam_sessions_sorted[-1]["avg_marks"]
        
        if last_avg > first_avg + 5:  # 5% improvement
            improvement_trend = "improving"
        elif last_avg < first_avg - 5:  # 5% decline
            improvement_trend = "declining"
        else:
            improvement_trend = "stable"
    else:
        improvement_trend = "stable"
    
    # Prepare data for AI service
    class_data = {
        "subject_name": subject.name,
        "section_name": section.name,
        "academic_year": academic_year,
        "total_students": len(students),
        "class_average": class_average,
        "exam_sessions": exam_sessions,
        "high_performers": high_performers,
        "low_performers": low_performers,
        "improvement_trend": improvement_trend
    }
    
    # Generate AI insights (with fallback)
    from ai_service import generate_teacher_insights
    return generate_teacher_insights(class_data)


