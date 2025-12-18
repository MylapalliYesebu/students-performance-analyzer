from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import database, models, auth, schemas

router = APIRouter()

@router.get("/subjects", response_model=List[dict]) # utilizing simple dict for now or create a schema
def get_teacher_subjects(
    current_user: models.User = Depends(auth.RoleChecker(["teacher"])),
    db: Session = Depends(database.get_db)
):
    
    teacher = current_user.teacher_profile
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
        
    return [{
        "id": s.id, 
        "name": s.name, 
        "code": s.code, 
        "semester": s.semester.name,
        "department_id": s.department_id,
        "semester_id": s.semester_id
    } for s in teacher.subjects_taught]

@router.post("/marks", response_model=schemas.MarksResponse, status_code=status.HTTP_201_CREATED)
def upload_marks(
    marks: schemas.MarksCreate,
    current_user: models.User = Depends(auth.RoleChecker(["teacher", "admin"])),
    db: Session = Depends(database.get_db)
):
    
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

    # Check if marks already exist for this student, subject, and exam type
    existing_marks = db.query(models.Marks).filter(
        models.Marks.student_id == marks.student_id,
        models.Marks.subject_id == marks.subject_id,
        models.Marks.exam_type == marks.exam_type
    ).first()

    if existing_marks:
        # Update existing marks
        existing_marks.marks_obtained = marks.marks_obtained
        existing_marks.total_marks = marks.total_marks
        db.commit()
        db.refresh(existing_marks)
        return existing_marks
    else:
        # Create new marks
        db_marks = models.Marks(**marks.dict())
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
    current_user: models.User = Depends(auth.RoleChecker(["teacher"])),
    db: Session = Depends(database.get_db)
):
        
    students = db.query(models.Student).filter(
        models.Student.department_id == department_id,
        models.Student.current_semester_id == semester_id
    ).all()
    return students

@router.get("/analysis/{department_id}/{semester_id}")
def get_class_analysis(
    department_id: int,
    semester_id: int,
    current_user: models.User = Depends(auth.RoleChecker(["teacher"])),
    db: Session = Depends(database.get_db)
):
        
    # Get all students in this class
    students = db.query(models.Student).filter(
        models.Student.department_id == department_id,
        models.Student.current_semester_id == semester_id
    ).all()
    
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

