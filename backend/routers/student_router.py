from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, models, auth, schemas, analysis

router = APIRouter()

@router.get("/marks", response_model=List[schemas.SemesterPerformance])
def get_student_marks(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    # LEGACY COMPAT: Response shape remains same (SemesterPerformance)
    # INTERNAL: Uses exam_sessions for exam categorization instead of string-based exam_type
    
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
                "max_total_marks": 0.0
            }
            
        target = sem_data[sem_name][subj_code]
        
        # NEW MODEL: Use exam_session if available, fallback to legacy exam_type
        if mark.exam_session and mark.exam_session.exam_type:
            exam_type_name = mark.exam_session.exam_type.name
        else:
            exam_type_name = mark.exam_type  # Legacy fallback
        
        # Categorize by exam type
        if exam_type_name and "Semester" in exam_type_name:
            target["university_marks"] += mark.marks_obtained
        else:
            target["internal_marks"] += mark.marks_obtained
            
        target["total_marks"] += mark.marks_obtained
        
        # Use max_marks from new model if available, else total_marks from legacy
        max_marks_value = mark.max_marks if mark.max_marks else mark.total_marks
        target["max_total_marks"] += max_marks_value

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
    # LEGACY COMPAT: Analysis uses exam_session-based marks grouping internally
    
    if current_user.role != models.UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Build marks data for analysis
    marks_data = []
    for m in student.marks:
        # Use max_marks from new model if available, else total_marks from legacy
        total_marks = m.max_marks if m.max_marks else m.total_marks
        marks_data.append({
            "subject": m.subject.name,
            "marks": m.marks_obtained,
            "total": total_marks,
            "semester": m.subject.semester.name
        })
        
    settings = db.query(models.Settings).first()
    weak_threshold = settings.weak_threshold if settings else 50.0
    return analysis.analyze_performance(student.id, marks_data, weak_threshold)


@router.get("/ai-summary")
def get_ai_performance_summary(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """
    Generate AI-powered performance summary for the student.
    
    READ-ONLY: Uses existing marks and analysis data.
    Returns natural-language summary with insights and suggestions.
    
    Response:
        {
            "summary": "AI-generated text with performance insights",
            "generated_at": "2025-12-26T20:05:00Z",
            "source": "ai" | "fallback"
        }
    """
    if current_user.role != models.UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    # Prepare data from existing endpoints (READ-ONLY)
    # 1. Get marks data
    marks_list = []
    subject_performance = {}  # Track performance by subject
    
    for mark in student.marks:
        subject_name = mark.subject.name
        total_marks = mark.max_marks if mark.max_marks else mark.total_marks
        
        if total_marks > 0:
            percentage = (mark.marks_obtained / total_marks) * 100
            
            # Track subject-wise aggregated performance
            if subject_name not in subject_performance:
                subject_performance[subject_name] = {
                    'total_obtained': 0,
                    'total_max': 0
                }
            
            subject_performance[subject_name]['total_obtained'] += mark.marks_obtained
            subject_performance[subject_name]['total_max'] += total_marks
        
        marks_list.append({
            "subject": subject_name,
            "marks": mark.marks_obtained,
            "total": total_marks,
            "semester": mark.subject.semester.name
        })
    
    # Calculate overall and subject-wise metrics
    if not marks_list:
        # No marks available - return encouraging message
        from ai_service import generate_student_summary
        return generate_student_summary({
            "student_name": student.name,
            "total_subjects": 0,
            "current_semester": student.current_semester.name if student.current_semester else "N/A",
            "average_percentage": 0,
            "strong_subjects": [],
            "weak_subjects": [],
            "exam_trend": "N/A - No marks recorded yet",
            "backlogs": 0
        })
    
    # Calculate average percentage
    total_obtained = sum(m['marks'] for m in marks_list)
    total_max = sum(m['total'] for m in marks_list)
    average_percentage = (total_obtained / total_max * 100) if total_max > 0 else 0
    
    # Identify strong and weak subjects
    strong_subjects = []
    weak_subjects = []
    
    for subject_name, perf in subject_performance.items():
        if perf['total_max'] > 0:
            subj_percentage = (perf['total_obtained'] / perf['total_max']) * 100
            
            if subj_percentage >= 75:
                strong_subjects.append({
                    "name": subject_name,
                    "percentage": subj_percentage
                })
            elif subj_percentage < 50:
                weak_subjects.append({
                    "name": subject_name,
                    "percentage": subj_percentage
                })
    
    # Sort by percentage
    strong_subjects.sort(key=lambda x: x['percentage'], reverse=True)
    weak_subjects.sort(key=lambda x: x['percentage'])
    
    # Determine exam trend (simple heuristic: compare first half vs second half of marks)
    if len(marks_list) >= 4:
        midpoint = len(marks_list) // 2
        first_half = marks_list[:midpoint]
        second_half = marks_list[midpoint:]
        
        first_avg = sum(m['marks'] / m['total'] for m in first_half if m['total'] > 0) / len(first_half)
        second_avg = sum(m['marks'] / m['total'] for m in second_half if m['total'] > 0) / len(second_half)
        
        if second_avg > first_avg + 0.05:  # 5% improvement
            exam_trend = "improving"
        elif second_avg < first_avg - 0.05:  # 5% decline
            exam_trend = "declining"
        else:
            exam_trend = "stable"
    else:
        exam_trend = "stable"
    
    # Calculate backlogs (subjects with < 40% - using settings)
    settings = db.query(models.Settings).first()
    pass_percentage = settings.pass_percentage if settings else 40.0
    
    backlogs = sum(1 for perf in subject_performance.values() 
                   if perf['total_max'] > 0 and 
                   (perf['total_obtained'] / perf['total_max'] * 100) < pass_percentage)
    
    # Prepare data for AI service
    student_data = {
        "student_name": student.name,
        "total_subjects": len(subject_performance),
        "current_semester": student.current_semester.name if student.current_semester else "N/A",
        "average_percentage": average_percentage,
        "strong_subjects": strong_subjects,
        "weak_subjects": weak_subjects,
        "exam_trend": exam_trend,
        "backlogs": backlogs
    }
    
    # Generate AI summary (with fallback)
    from ai_service import generate_student_summary
    return generate_student_summary(student_data)

