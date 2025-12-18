from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import database, models, auth, schemas, analysis

router = APIRouter()

@router.get("/marks", response_model=List[schemas.SemesterPerformance])
def get_student_marks(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
        
    # Group marks by Semester -> Subject
    # Structure: { sem_name: { subj_code: { internal: 0, uni: 0, total_max: 0, name: "" } } }
    sem_data = {}
    
    for mark in student.marks:
        sem_name = mark.subject.semester.name
        subj_code = mark.subject.code
        
        if sem_name not in sem_data:
            sem_data[sem_name] = {}
            
        if subj_code not in sem_data[sem_name]:
            sem_data[sem_name][subj_code] = {
                "subject_name": mark.subject.name,
                "subject_code": mark.subject.code,
                "internal_marks": 0.0,
                "university_marks": 0.0,
                "total_marks": 0.0,
                "max_total_marks": 0.0 # We need to sum max marks too? 
                # Assumption: Different exam types have their own max marks.
                # E.g. Internal 1 (30), Internal 2 (30), Univ (70). 
                # Wait, usually for JNTU internal is best of 2 or avg. 
                # Simplified here: Sum everything.
            }
            
        target = sem_data[sem_name][subj_code]
        
        if mark.exam_type == "University":
            target["university_marks"] += mark.marks_obtained
        else:
            target["internal_marks"] += mark.marks_obtained
            
        target["total_marks"] += mark.marks_obtained
        target["max_total_marks"] += mark.total_marks

    # Build Response
    response = []
    semester_order = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"]
    
    # Sort semesters
    sorted_semesters = sorted(sem_data.keys(), key=lambda x: semester_order.index(x) if x in semester_order else 99)

    for sem in sorted_semesters:
        subjects_list = []
        backlog_count = 0
        
        for code, data in sem_data[sem].items():
            # Calculate Pass/Fail: Fetch percentage from settings
            settings = db.query(models.Settings).first()
            pass_percentage = settings.pass_percentage if settings else 40.0
            
            pass_threshold = (pass_percentage / 100.0) * data["max_total_marks"] if data["max_total_marks"] > 0 else 0
            is_passed = data["total_marks"] >= pass_threshold
            if not is_passed:
                backlog_count += 1
                
            subjects_list.append(schemas.SubjectPerformance(
                subject_name=data["subject_name"],
                subject_code=data["subject_code"],
                internal_marks=data["internal_marks"],
                university_marks=data["university_marks"],
                total_marks=data["total_marks"],
                max_total_marks=data["max_total_marks"],
                is_passed=is_passed
            ))
            
        response.append(schemas.SemesterPerformance(
            semester_name=sem,
            subjects=subjects_list,
            backlogs=backlog_count,
            semester_sgpa=None # Placeholder
        ))
        
    return response

@router.get("/analysis")
def get_student_analysis(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Reuse logic via internal function call or re-implement simple analysis
    # Let's call the helper function provided in original code, but we might need to adapt data
    # Originally: analysis.analyze_performance(student.id, marks_data)
    # The original analysis module likely expects simple dicts. 
    # Let's keep using it for now but populate it with ALL raw marks.
    
    marks_data = []
    for m in student.marks:
        marks_data.append({
            "subject": m.subject.name,
            "marks": m.marks_obtained,
            "total": m.total_marks,
            "semester": m.subject.semester.name
        })
        
    settings = db.query(models.Settings).first()
    weak_threshold = settings.weak_threshold if settings else 50.0
    return analysis.analyze_performance(student.id, marks_data, weak_threshold)
