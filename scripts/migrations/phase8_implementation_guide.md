# PHASE 8 — API DUAL SUPPORT & ACCESS CONTROL

## STATUS: FOUNDATION COMPLETE

**Date:** December 21, 2024  
**Current State:** Models updated, access control helpers created

---

## Completed Work

### 1. Updated models.py ✅

**Added model definitions for all Phase 1-7 tables:**
- `Institute` - College/institute information
- `Regulation` - Academic regulations (R20, R23)
- `Batch` - Student admission batches
- `Section` - Class sections (dept + batch + name)
- `ExamType` - Exam types (Mid-1, Mid-2, Semester)
- `ExamSession` - Specific exam instances
- `SubjectOffering` - Subject taught to section by teacher
- `Admin` - Admin roles (master, hod, class_incharge)

**Updated existing models:**
- Added Phase 2-6 columns to User, Department, Semester, Student, Subject, Marks
- Added all SQLAlchemy relationships
- Preserved all legacy columns

### 2. Created access_control.py ✅

**Helper functions:**
- `is_admin(user_id)` - Check if user is an admin
- `get_admin_scope(user_id)` - Get admin access scope
- `get_teacher_subject_offerings()` - NEW model
- `get_teacher_subjects_legacy()` - LEGACY model
- `get_students_by_section()` - NEW model
- `get_students_by_dept_semester()` - LEGACY model
- `map_exam_type_to_session()` - Convert legacy → new
- `should_use_new_model()` - Determine which model to use

---

## Remaining Implementation Tasks

### Task 1: Update Teacher Router

**File:** `backend/routers/teacher_router.py`

**Endpoint:** GET `/teacher/subjects`

**Current behavior:**
```python
# Returns subjects via subjects.teacher_id
subjects = db.query(Subject).filter(Subject.teacher_id == teacher_id).all()
```

**Required changes:**
```python
from access_control import should_use_new_model, get_teacher_subject_offerings, get_teacher_subjects_legacy

if should_use_new_model(db, teacher_id):
    # Use new model - subject_offerings
    offerings = get_teacher_subject_offerings(db, teacher_id)
    # Transform to response format
else:
    # Fallback to legacy
    subjects = get_teacher_subjects_legacy(db, teacher_id)
```

---

### Task 2: Update Student List Filtering

**File:** `backend/routers/teacher_router.py`

**Endpoint:** GET `/teacher/students/{subject_id}` or similar

**Current (WRONG):**
```python
# Filters by department + semester
students = db.query(Student).filter(
    Student.department_id == dept_id,
    Student.current_semester_id == sem_id
).all()
```

**Required (CORRECT):**
```python
from access_control import get_students_by_section, get_students_by_dept_semester

if subject_offering_id:  # NEW model
    offering = db.query(SubjectOffering).get(subject_offering_id)
    students = get_students_by_section(db, offering.section_id)
else:  # LEGACY fallback
    subject = db.query(Subject).get(subject_id)
    students = get_students_by_dept_semester(db, subject.department_id, subject.semester_id)
```

---

### Task 3: Marks Upload - Dual Payload Support

**File:** `backend/routers/teacher_router.py` or `admin_router.py`

**Endpoint:** POST `/marks/upload`

**Accept both formats:**

**Legacy payload:**
```json
{
  "student_id": 1,
  "subject_id": 10,
  "exam_type": "Internal-1",
  "marks_obtained": 25,
  "total_marks": 30
}
```

**New payload:**
```json
{
  "student_id": 1,
  "subject_offering_id": 20,
  "exam_session_id": 5,
  "marks_obtained": 25,
  "max_marks": 30
}
```

**Implementation:**
```python
from access_control import map_exam_type_to_session

def create_marks(payload: dict, db: Session, current_user: User):
    # Detect format
    is_new_format = "subject_offering_id" in payload and "exam_session_id" in payload
    
    if is_new_format:
        # Direct assignment
        mark = Marks(
            student_id=payload["student_id"],
            subject_offering_id=payload["subject_offering_id"],
            exam_session_id=payload["exam_session_id"],
            marks_obtained=payload["marks_obtained"],
            max_marks=payload.get("max_marks"),
            uploaded_by=current_user.id
        )
        # Also populate legacy fields for backward compatibility
        offering = db.query(SubjectOffering).get(payload["subject_offering_id"])
        mark.subject_id = offering.subject_id
        # Map exam_session to exam_type string
        session = db.query(ExamSession).get(payload["exam_session_id"])
        mark.exam_type = map_session_to_legacy_type(session.exam_type_id)
        mark.total_marks = payload.get("max_marks")
    else:
        # Legacy format - populate both old and new
        mark = Marks(
            student_id=payload["student_id"],
            subject_id=payload["subject_id"],
            exam_type=payload["exam_type"],
            marks_obtained=payload["marks_obtained"],
            total_marks=payload["total_marks"],
            max_marks=payload["total_marks"],
            uploaded_by=current_user.id
        )
        # Try to map to new model
        subject = db.query(Subject).get(payload["subject_id"])
        student = db.query(Student).get(payload["student_id"])
        
        if student.section_id:
            offering = db.query(SubjectOffering).filter(
                SubjectOffering.subject_id == payload["subject_id"],
                SubjectOffering.section_id == student.section_id
            ).first()
            if offering:
                mark.subject_offering_id = offering.id
        
        exam_session = map_exam_type_to_session(
            db, payload["exam_type"], 
            subject.semester_id, 
            subject.regulation_id
        )
        if exam_session:
            mark.exam_session_id = exam_session.id
    
    db.add(mark)
    db.commit()
    return mark
```

---

### Task 4: Marks Read - Student View

**File:** `backend/routers/student_router.py`

**Endpoint:** GET `/student/marks`

**Implementation:**
```python
def get_student_marks(student_id: int, db: Session):
    marks = db.query(Marks).filter(Marks.student_id == student_id).all()
    
    # Group by subject
    marks_by_subject = {}
    for mark in marks:
        # Prefer new model
        if mark.subject_offering_id:
            offering = mark.subject_offering
            subject_key = offering.subject.code
            exam_name = mark.exam_session.exam_type.name if mark.exam_session else "Unknown"
        else:
            # Fallback to legacy
            subject_key = mark.subject.code
            exam_name = mark.exam_type
        
        if subject_key not in marks_by_subject:
            marks_by_subject[subject_key] = []
        
        marks_by_subject[subject_key].append({
            "exam": exam_name,
            "obtained": mark.marks_obtained,
            "max": mark.max_marks or mark.total_marks,
            "percentage": (mark.marks_obtained / (mark.max_marks or mark.total_marks)) * 100
        })
    
    return marks_by_subject
```

---

### Task 5: Admin Access Rules

**Apply to all endpoints:**

```python
from access_control import is_admin, get_admin_scope

def check_access(current_user: User, requested_resource, db: Session):
    if not is_admin(db, current_user.id):
        # Regular teacher - only their data
        return current_user.teacher_profile.id == requested_resource.teacher_id
    
    scope = get_admin_scope(db, current_user.id)
    
    if scope["is_master"]:
        return True  # Full access
    
    if scope["is_hod"]:
        # Can access department scope
        return requested_resource.department_id == scope["department_id"]
    
    if scope["is_class_incharge"]:
        # Can access section scope
        return requested_resource.section_id == scope["section_id"]
    
    return False
```

---

## Testing Checklist

- [ ] Teacher login → sees correct subjects (new or legacy)
- [ ] Teacher views students → filtered by section (not dept+sem)
- [ ] Teacher uploads marks → both payload formats work
- [ ] Student views marks → sees data from new model
- [ ] Master admin → sees all data
- [ ] HOD admin → sees only department data
- [ ] Class incharge → sees only section data
- [ ] Legacy APIs still work
- [ ] No data loss
- [ ] No schema changes

---

## Files Modified

1. ✅ `backend/models.py` - Added all Phase 1-7 model definitions
2. ✅ `backend/access_control.py` - NEW helper module
3. ⏳ `backend/routers/teacher_router.py` - Needs dual support implementation
4. ⏳ `backend/routers/student_router.py` - Needs updated marks view
5. ⏳ `backend/routers/admin_router.py` - Needs access control checks

---

## Key Principles

1. **Prefer new model when available**
2. **Always fallback to legacy**
3. **Populate BOTH columns when writing**
4. **Never break existing APIs**
5. **Test both code paths**

---

## ⛔ PHASE 8 STATUS: FOUNDATION COMPLETE

**Next Steps:**
1. Review this implementation guide
2. Implement router changes incrementally
3. Test each endpoint after modification
4. Verify backward compatibility

**Note:** Full implementation requires careful testing of each endpoint to ensure no breaking changes.
