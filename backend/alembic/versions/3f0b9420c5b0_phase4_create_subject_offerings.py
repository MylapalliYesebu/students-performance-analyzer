"""phase4_create_subject_offerings

Revision ID: 3f0b9420c5b0
Revises: f6367fa08bde
Create Date: 2025-12-21 04:49:18.664866

PHASE 4: Subject Offerings
Creates the subject_offerings table that links:
- subjects (what to teach)
- sections (who to teach - students grouped)
- teachers (who teaches)
- academic_year (when)

Backfill strategy:
- For each subject with teacher_id, create offerings for ALL sections
  in that subject's department
- Use academic_year = "2024-25" for all initial offerings
- Maintain UNIQUE constraint on (subject_id, section_id, academic_year)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f0b9420c5b0'
down_revision: Union[str, Sequence[str], None] = 'f6367fa08bde'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create subject_offerings table and backfill from subjects.teacher_id."""
    
    # ========================================================================
    # TABLE: subject_offerings
    # ========================================================================
    op.create_table(
        'subject_offerings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('academic_year', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('subject_id', 'section_id', 'academic_year', 
                           name='uq_offering_subject_section_year')
    )
    op.create_index(op.f('ix_subject_offerings_academic_year'), 
                    'subject_offerings', ['academic_year'], unique=False)
    op.create_index(op.f('ix_subject_offerings_subject_id'), 
                    'subject_offerings', ['subject_id'], unique=False)
    
    # ========================================================================
    # BACKFILL: subject_offerings from subjects.teacher_id
    # ========================================================================
    # Strategy:
    # For each subject with teacher_id:
    #   - Find all sections in the subject's department
    #   - Create one subject_offering per section
    #   - academic_year = "2024-25"
    
    op.execute("""
        INSERT INTO subject_offerings (subject_id, section_id, teacher_id, academic_year)
        SELECT 
            subj.id as subject_id,
            sec.id as section_id,
            subj.teacher_id as teacher_id,
            '2024-25' as academic_year
        FROM subjects subj
        INNER JOIN sections sec ON sec.department_id = subj.department_id
        WHERE subj.teacher_id IS NOT NULL
        ORDER BY subj.id, sec.id
    """)


def downgrade() -> None:
    """Remove Phase 4 additions (reverse migration)."""
    
    # Drop indexes first, then table
    op.drop_index(op.f('ix_subject_offerings_subject_id'), table_name='subject_offerings')
    op.drop_index(op.f('ix_subject_offerings_academic_year'), table_name='subject_offerings')
    op.drop_table('subject_offerings')

