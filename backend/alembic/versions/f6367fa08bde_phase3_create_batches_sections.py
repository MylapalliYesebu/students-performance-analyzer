"""phase3_create_batches_sections

Revision ID: f6367fa08bde
Revises: bcdba7111528
Create Date: 2025-12-21 04:19:02.237343

PHASE 3: Batches & Sections
Creates academic batch and section structure:
- batches: Admission batches (year + regulation)
- sections: Class sections (department + batch + name)
- students: Extend with batch_id and section_id

Backfill strategy:
- Infer batches from student roll numbers (first 2 digits)
- Create default sections for each (department, batch)
- Assign students to their inferred batch and default section
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6367fa08bde'
down_revision: Union[str, Sequence[str], None] = 'bcdba7111528'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create batches and sections tables, extend students table."""
    
    # ========================================================================
    # TABLE 1: batches
    # ========================================================================
    op.create_table(
        'batches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admission_year', sa.Integer(), nullable=False),
        sa.Column('regulation_id', sa.Integer(), nullable=False),
        sa.Column('institute_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['institute_id'], ['institutes.id'], ),
        sa.ForeignKeyConstraint(['regulation_id'], ['regulations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_batches_admission_year'), 'batches', ['admission_year'], unique=False)
    
    # Backfill batches - infer from student roll numbers
    # Roll number format: YYXXXYYYY where YY is year (20 → 2020, 22 → 2022)
    op.execute("""
        INSERT INTO batches (admission_year, regulation_id, institute_id)
        SELECT DISTINCT
            2000 + CAST(SUBSTR(roll_number, 1, 2) AS INTEGER) as year,
            CASE 
                WHEN 2000 + CAST(SUBSTR(roll_number, 1, 2) AS INTEGER) < 2023 THEN 1
                ELSE 2
            END as reg_id,
            1 as inst_id
        FROM students
        ORDER BY year
    """)
    
    # ========================================================================
    # TABLE 2: sections
    # ========================================================================
    op.create_table(
        'sections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('department_id', 'batch_id', 'name', name='uq_section_dept_batch_name')
    )
    op.create_index(op.f('ix_sections_name'), 'sections', ['name'], unique=False)
    
    # Backfill sections - create ONE default section per (department, batch)
    # Default section name: {department.short_code}-a (e.g., cse-a, ece-a)
    op.execute("""
        INSERT INTO sections (name, department_id, batch_id)
        SELECT 
            LOWER(d.short_code) || '-a' as section_name,
            d.id as dept_id,
            b.id as batch_id
        FROM departments d
        CROSS JOIN batches b
        ORDER BY d.id, b.id
    """)
    
    # ========================================================================
    # TABLE 3: students - Add batch and section columns
    # ========================================================================
    op.add_column('students', sa.Column('batch_id', sa.Integer(), nullable=True))
    op.add_column('students', sa.Column('section_id', sa.Integer(), nullable=True))
    
    # Note: Not creating FK constraints due to SQLite ALTER TABLE limitations
    # These will be logical FKs only
    
    # Backfill students.batch_id - match admission year from roll number
    op.execute("""
        UPDATE students 
        SET batch_id = (
            SELECT b.id 
            FROM batches b 
            WHERE b.admission_year = 2000 + CAST(SUBSTR(students.roll_number, 1, 2) AS INTEGER)
            LIMIT 1
        )
    """)
    
    # Backfill students.section_id - assign to default section for their dept+batch
    op.execute("""
        UPDATE students 
        SET section_id = (
            SELECT s.id 
            FROM sections s 
            WHERE s.department_id = students.department_id 
            AND s.batch_id = students.batch_id
            LIMIT 1
        )
    """)


def downgrade() -> None:
    """Remove Phase 3 additions (reverse migration)."""
    
    # Remove in reverse order of creation
    
    # students: drop columns
    op.drop_column('students', 'section_id')
    op.drop_column('students', 'batch_id')
    
    # sections: drop table
    op.drop_index(op.f('ix_sections_name'), table_name='sections')
    op.drop_table('sections')
    
    # batches: drop table
    op.drop_index(op.f('ix_batches_admission_year'), table_name='batches')
    op.drop_table('batches')

