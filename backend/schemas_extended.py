"""
Extended schemas for the new academic model.

This module contains Pydantic schemas for the new academic model entities:
- Batches
- Sections
- Subject Offerings
- Exam Sessions

These schemas extend the existing schemas.py without breaking backward compatibility.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Batch Schemas
# ============================================================================

class BatchBase(BaseModel):
    admission_year: int
    regulation_id: int
    institute_id: int


class BatchCreate(BatchBase):
    pass


class BatchResponse(BatchBase):
    id: int
    
    class Config:
        from_attributes = True


# ============================================================================
# Section Schemas
# ============================================================================

class SectionBase(BaseModel):
    name: str
    department_id: int
    batch_id: int


class SectionCreate(SectionBase):
    pass


class SectionResponse(SectionBase):
    id: int
    
    class Config:
        from_attributes = True


# ============================================================================
# Exam Type Schemas
# ============================================================================

class ExamTypeBase(BaseModel):
    name: str


class ExamTypeResponse(ExamTypeBase):
    id: int
    
    class Config:
        from_attributes = True


# ============================================================================
# Exam Session Schemas
# ============================================================================

class ExamSessionBase(BaseModel):
    exam_type_id: int
    semester_id: int
    regulation_id: int
    academic_year: str
    exam_date: Optional[datetime] = None


class ExamSessionCreate(ExamSessionBase):
    pass


class ExamSessionResponse(ExamSessionBase):
    id: int
    
    class Config:
        from_attributes = True


# ============================================================================
# Subject Offering Schemas
# ============================================================================

class SubjectOfferingBase(BaseModel):
    subject_id: int
    section_id: int
    teacher_id: int
    academic_year: str


class SubjectOfferingCreate(SubjectOfferingBase):
    pass


class SubjectOfferingResponse(SubjectOfferingBase):
    id: int
    
    class Config:
        from_attributes = True


# ============================================================================
# Extended Marks Schemas (New Model)
# ============================================================================

class MarksCreateNew(BaseModel):
    """
    Marks creation schema using the NEW academic model.
    Uses subject_offering_id and exam_session_id instead of legacy fields.
    """
    student_id: int
    subject_offering_id: int
    exam_session_id: int
    marks_obtained: float
    max_marks: float
    uploaded_by: Optional[int] = None


class MarksResponseNew(MarksCreateNew):
    id: int
    
    class Config:
        from_attributes = True


# ============================================================================
# Student Extended Schemas
# ============================================================================

class StudentCreateExtended(BaseModel):
    """
    Extended student creation schema requiring section and batch.
    Used by new academic model.
    """
    roll_number: str
    name: str
    department_id: int
    current_semester_id: int
    section_id: int
    batch_id: int
    password: str


class StudentResponseExtended(BaseModel):
    """
    Extended student response with section and batch info.
    """
    id: int
    roll_number: str
    name: str
    department_id: int
    current_semester_id: int
    section_id: Optional[int] = None
    batch_id: Optional[int] = None
    
    class Config:
        from_attributes = True
