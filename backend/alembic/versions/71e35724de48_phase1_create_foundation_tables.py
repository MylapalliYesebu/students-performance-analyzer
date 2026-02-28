"""phase1_create_foundation_tables

Revision ID: 71e35724de48
Revises: 56c189d70919
Create Date: 2025-12-21 04:05:10.240569

PHASE 1: Foundation Tables
Creates three independent tables with no dependencies on existing tables:
- institutes: Institution metadata
- regulations: Curriculum regulations (R20, R23)
- exam_types: Exam type definitions (Mid-1, Mid-2, Semester, etc.)
"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '71e35724de48'
down_revision: Union[str, Sequence[str], None] = '56c189d70919'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create foundation tables and seed initial data."""
    
    # ========================================================================
    # TABLE 1: institutes
    # ========================================================================
    op.create_table(
        'institutes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, 
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Seed institutes data
    op.execute("""
        INSERT INTO institutes (name, location)
        VALUES ('Ideal Institute of Technology', 'Kakinada')
    """)
    
    # ========================================================================
    # TABLE 2: regulations
    # ========================================================================
    op.create_table(
        'regulations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_year', sa.Integer(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('institute_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['institute_id'], ['institutes.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_regulations_code'), 'regulations', ['code'], unique=False)
    
    # Seed regulations data
    op.execute("""
        INSERT INTO regulations (code, description, start_year, active, institute_id)
        VALUES 
            ('R20', 'Regulation 2020', 2020, 0, 1),
            ('R23', 'Regulation 2023', 2023, 1, 1)
    """)
    
    # ========================================================================
    # TABLE 3: exam_types
    # ========================================================================
    op.create_table(
        'exam_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('conducted_by', sa.String(), nullable=False),
        sa.Column('counts_for_internal', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('default_max_marks', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Seed exam_types data
    op.execute("""
        INSERT INTO exam_types (name, conducted_by, counts_for_internal, default_max_marks)
        VALUES 
            ('Mid-1', 'college', 1, 30.0),
            ('Mid-2', 'college', 1, 30.0),
            ('Semester', 'university', 0, 70.0),
            ('Slip Test', 'college', 1, 10.0)
    """)


def downgrade() -> None:
    """Remove foundation tables (reverse Phase 1)."""
    
    # Drop in reverse order (child tables first due to foreign keys)
    op.drop_table('exam_types')
    op.drop_index(op.f('ix_regulations_code'), table_name='regulations')
    op.drop_table('regulations')
    op.drop_table('institutes')

