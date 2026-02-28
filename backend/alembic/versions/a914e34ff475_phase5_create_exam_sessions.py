"""phase5_create_exam_sessions

Revision ID: a914e34ff475
Revises: 3f0b9420c5b0
Create Date: 2025-12-21 04:59:48.662630

PHASE 5: Exam Sessions
Creates the exam_sessions table that defines specific exam instances:
- exam_type_id (what type: Mid-1, Semester, etc.)
- semester_id (which semester)
- regulation_id (which regulation)
- academic_year (when)

Backfill strategy:
- Extract distinct combinations from marks table
- Map marks.exam_type (string) to exam_types.id
- Infer semester and regulation from subject relationships
- Use academic_year = "2024-25"
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a914e34ff475'
down_revision: Union[str, Sequence[str], None] = '3f0b9420c5b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create exam_sessions table and backfill from marks data."""
    
    # ========================================================================
    # TABLE: exam_sessions
    # ========================================================================
    op.create_table(
        'exam_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('exam_type_id', sa.Integer(), nullable=False),
        sa.Column('semester_id', sa.Integer(), nullable=False),
        sa.Column('regulation_id', sa.Integer(), nullable=False),
        sa.Column('academic_year', sa.String(), nullable=False),
        sa.Column('exam_date', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['exam_type_id'], ['exam_types.id'], ),
        sa.ForeignKeyConstraint(['regulation_id'], ['regulations.id'], ),
        sa.ForeignKeyConstraint(['semester_id'], ['semesters.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('exam_type_id', 'semester_id', 'regulation_id', 'academic_year',
                           name='uq_exam_session_type_sem_reg_year')
    )
    op.create_index(op.f('ix_exam_sessions_academic_year'), 
                    'exam_sessions', ['academic_year'], unique=False)
    op.create_index(op.f('ix_exam_sessions_exam_type_id'), 
                    'exam_sessions', ['exam_type_id'], unique=False)
    
    # ========================================================================
    # BACKFILL: exam_sessions from marks table
    # ========================================================================
    # Strategy:
    # 1. Get distinct (exam_type, subject.semester_id, subject.regulation_id) from marks
    # 2. Map exam_type string to exam_type_id:
    #    "Internal-1" -> "Mid-1" (id=1)
    #    "Internal-2" -> "Mid-2" (id=2)
    #    "Semester" -> "Semester" (id=3)
    # 3. academic_year = "2024-25"
    
    op.execute("""
        INSERT INTO exam_sessions (exam_type_id, semester_id, regulation_id, academic_year)
        SELECT DISTINCT
            CASE m.exam_type
                WHEN 'Internal-1' THEN 1  -- Mid-1
                WHEN 'Internal-2' THEN 2  -- Mid-2
                WHEN 'Semester' THEN 3    -- Semester
                ELSE NULL
            END as exam_type_id,
            subj.semester_id,
            subj.regulation_id,
            '2024-25' as academic_year
        FROM marks m
        INNER JOIN subjects subj ON m.subject_id = subj.id
        WHERE m.exam_type IS NOT NULL
        AND subj.semester_id IS NOT NULL
        AND subj.regulation_id IS NOT NULL
        ORDER BY exam_type_id, subj.semester_id, subj.regulation_id
    """)


def downgrade() -> None:
    """Remove Phase 5 additions (reverse migration)."""
    
    # Drop indexes first, then table
    op.drop_index(op.f('ix_exam_sessions_exam_type_id'), table_name='exam_sessions')
    op.drop_index(op.f('ix_exam_sessions_academic_year'), table_name='exam_sessions')
    op.drop_table('exam_sessions')

