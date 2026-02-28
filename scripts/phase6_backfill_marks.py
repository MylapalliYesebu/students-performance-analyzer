"""
Phase 6 - Marks Table Backfill Script

This script backfills the new columns in the marks table:
- subject_offering_id
- exam_session_id
- max_marks

Logic:
1. subject_offering_id: Match by student.section_id + marks.subject_id
2. exam_session_id: Match by marks.exam_type + subject.semester_id + subject.regulation_id
3. max_marks: Copy from marks.total_marks
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


def backfill_marks():
    """Backfill the new columns in marks table using SQL."""
    session = Session()
    
    try:
        # Get total count
        result = session.execute(text("SELECT COUNT(*) FROM marks"))
        total_marks = result.scalar()
        
        print(f"Starting backfill for {total_marks} marks records...")
        print("="*70)
        
        # ================================================================
        # 1. Backfill max_marks (simple copy from total_marks)
        # ================================================================
        print("Step 1: Backfilling max_marks from total_marks...")
        result = session.execute(text("""
            UPDATE marks 
            SET max_marks = total_marks
            WHERE max_marks IS NULL
        """))
        session.commit()
        print(f"  ✓ Updated {result.rowcount} rows")
        
        # ================================================================
        # 2. Backfill subject_offering_id
        # ================================================================
        print("\nStep 2: Backfilling subject_offering_id...")
        result = session.execute(text("""
            UPDATE marks
            SET subject_offering_id = (
                SELECT so.id
                FROM subject_offerings so
                INNER JOIN students st ON st.id = marks.student_id
                WHERE so.subject_id = marks.subject_id
                AND so.section_id = st.section_id
                LIMIT 1
            )
            WHERE subject_offering_id IS NULL
        """))
        session.commit()
        print(f"  ✓ Updated {result.rowcount} rows")
        
        # ================================================================
        # 3. Backfill exam_session_id
        # ================================================================
        print("\nStep 3: Backfilling exam_session_id...")
        result = session.execute(text("""
            UPDATE marks
            SET exam_session_id = (
                SELECT es.id
                FROM exam_sessions es
                INNER JOIN subjects subj ON subj.id = marks.subject_id
                WHERE es.exam_type_id = CASE marks.exam_type
                        WHEN 'Internal-1' THEN 1
                        WHEN 'Internal-2' THEN 2
                        WHEN 'Semester' THEN 3
                    END
                AND es.semester_id = subj.semester_id
                AND es.regulation_id = subj.regulation_id
                LIMIT 1
            )
            WHERE exam_session_id IS NULL
        """))
        session.commit()
        print(f"  ✓ Updated {result.rowcount} rows")
        
        # ================================================================
        # Validation
        # ================================================================
        print("\n" + "="*70)
        print("VALIDATION:")
        print("="*70)
        
        result = session.execute(text("SELECT COUNT(*) FROM marks WHERE subject_offering_id IS NULL"))
        null_offering = result.scalar()
        
        result = session.execute(text("SELECT COUNT(*) FROM marks WHERE exam_session_id IS NULL"))
        null_session = result.scalar()
        
        result = session.execute(text("SELECT COUNT(*) FROM marks WHERE max_marks IS NULL"))
        null_max_marks = result.scalar()
        
        result = session.execute(text("""
            SELECT COUNT(*) FROM marks 
            WHERE subject_offering_id IS NOT NULL 
            AND exam_session_id IS NOT NULL 
            AND max_marks IS NOT NULL
        """))
        successful = result.scalar()
        
        print(f"Total marks:                    {total_marks}")
        print(f"Successfully migrated:          {successful} ({100*successful/total_marks:.1f}%)")
        print(f"NULL subject_offering_id:       {null_offering}")
        print(f"NULL exam_session_id:           {null_session}")
        print(f"NULL max_marks:                 {null_max_marks}")
        
        if null_offering == 0 and null_session == 0 and null_max_marks == 0:
            print("\n✅ SUCCESS: All marks fully migrated!")
        else:
            print("\n⚠️ WARNING: Some marks have NULL values")
            
            # Show examples of problematic records
            if null_offering > 0:
                print(f"\nExample marks with NULL subject_offering_id:")
                result = session.execute(text("""
                    SELECT id, student_id, subject_id 
                    FROM marks 
                    WHERE subject_offering_id IS NULL 
                    LIMIT 3
                """))
                for row in result:
                    print(f"  mark_id={row[0]}, student_id={row[1]}, subject_id={row[2]}")
        
        return successful, total_marks
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    backfill_marks()
