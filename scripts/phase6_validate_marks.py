"""
Phase 6 - Marks Table Validation Script

This script validates the Phase 6 migration results.
"""

import sys
import os

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


# Create engine
db_path = os.path.join(backend_dir, 'performance_analyzer.db')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)


def validate_phase6():
    """Validate Phase 6 migration results."""
    session = Session()
    
    try:
        print("="*70)
        print("PHASE 6 VALIDATION")
        print("="*70)
        
        # Total counts
        result = session.execute(text("SELECT COUNT(*) FROM marks"))
        total_marks = result.scalar()
        
        result = session.execute(text("SELECT COUNT(*) FROM students"))
        total_students = result.scalar()
        
        result = session.execute(text("SELECT COUNT(*) FROM subjects"))
        total_subjects = result.scalar()
        
        print(f"\nRow Counts:")
        print(f"  Total marks:    {total_marks}")
        print(f"  Total students: {total_students}")
        print(f"  Total subjects: {total_subjects}")
        
        # NULL checks
        result = session.execute(text("SELECT COUNT(*) FROM marks WHERE subject_offering_id IS NULL"))
        null_offering = result.scalar()
        
        result = session.execute(text("SELECT COUNT(*) FROM marks WHERE exam_session_id IS NULL"))
        null_session = result.scalar()
        
        result = session.execute(text("SELECT COUNT(*) FROM marks WHERE max_marks IS NULL"))
        null_max_marks = result.scalar()
        
        result = session.execute(text("SELECT COUNT(*) FROM marks WHERE uploaded_by IS NULL"))
        null_uploaded_by = result.scalar()
        
        print(f"\nNULL Counts:")
        print(f"  Marks with NULL subject_offering_id: {null_offering}")
        print(f"  Marks with NULL exam_session_id:     {null_session}")
        print(f"  Marks with NULL max_marks:           {null_max_marks}")
        print(f"  Marks with NULL uploaded_by:         {null_uploaded_by}  (expected)")
        
        # Migration success rate
        result = session.execute(text("""
            SELECT COUNT(*) FROM marks 
            WHERE subject_offering_id IS NOT NULL 
            AND exam_session_id IS NOT NULL 
            AND max_marks IS NOT NULL
        """))
        fully_migrated = result.scalar()
        
        success_rate = (fully_migrated / total_marks * 100) if total_marks > 0 else 0
        
        print(f"\nMigration Success:")
        print(f"  Fully migrated: {fully_migrated}/{total_marks} ({success_rate:.1f}%)")
        
        # Sample data
        print(f"\nSample Migrated Marks:")
        result = session.execute(text("""
            SELECT 
                m.id,
                m.student_id,
                m.subject_id,
                m.subject_offering_id,
                m.exam_session_id,
                m.max_marks,
                m.marks_obtained
            FROM marks m
            LIMIT 5
        """))
        for row in result:
            print(f"  mark_id={row[0]}, subject_offering={row[3]}, exam_session={row[4]}, max={row[5]}, obtained={row[6]}")
        
        # Final verdict
        print("\n" + "="*70)
        if null_offering == 0 and null_session == 0 and null_max_marks == 0:
            print("✅ PHASE 6 VALIDATION: SUCCESS")
            print("All required columns populated successfully!")
        else:
            print("⚠️ PHASE 6 VALIDATION: ISSUES FOUND")
            print(f"Found {null_offering + null_session + null_max_marks} NULL values in required columns")
        print("="*70)
        
    finally:
        session.close()


if __name__ == "__main__":
    validate_phase6()
