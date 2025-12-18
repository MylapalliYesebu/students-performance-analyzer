from pydantic import BaseModel
from typing import Optional, List
from .models import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class MessageResponse(BaseModel):
    message: str

class UserBase(BaseModel):
    username: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    roll_number: str
    name: str

class StudentCreate(StudentBase):
    department_id: int
    current_semester_id: int
    password: str # Initial password

class StudentResponse(StudentBase):
    id: int
    department_id: int
    current_semester_id: int
    class Config:
        from_attributes = True

class TeacherBase(BaseModel):
    email: str
    name: str

class TeacherCreate(TeacherBase):
    department_id: int
    password: str

class TeacherResponse(TeacherBase):
    id: int
    department_id: int
    class Config:
        from_attributes = True

class TeacherSubjectAssignment(BaseModel):
    teacher_id: int
    subject_id: int

class MarksCreate(BaseModel):
    student_id: int
    subject_id: int
    exam_type: str
    marks_obtained: float
    total_marks: float

class MarksResponse(MarksCreate):
    id: int
    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    name: str
    code: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

class SemesterBase(BaseModel):
    name: str

class SemesterCreate(SemesterBase):
    @classmethod
    def validate_name(cls, v):
        allowed = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"]
        if v not in allowed:
            raise ValueError(f"Semester name must be one of {allowed}")
        return v
    
    # Pydantic v2 validator
    from pydantic import field_validator
    @field_validator('name')
    def name_must_be_allowed(cls, v):
        return cls.validate_name(v)

class SemesterResponse(SemesterBase):
    id: int
    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    name: str
    code: str

class SubjectCreate(SubjectBase):
    department_id: int
    semester_id: int

class SubjectResponse(SubjectBase):
    id: int
    department_id: int
    semester_id: int
    class Config:
        from_attributes = True

class SubjectPerformance(BaseModel):
    subject_name: str
    subject_code: str
    internal_marks: float
    university_marks: float
    total_marks: float
    max_total_marks: float
    is_passed: bool

class SemesterPerformance(BaseModel):
    semester_name: str
    subjects: List[SubjectPerformance]
    semester_sgpa: Optional[float] = None
    backlogs: int = 0

class SettingsBase(BaseModel):
    pass_percentage: float
    weak_threshold: float

class SettingsUpdate(SettingsBase):
    pass

class SettingsResponse(SettingsBase):
    id: int
    class Config:
        from_attributes = True
