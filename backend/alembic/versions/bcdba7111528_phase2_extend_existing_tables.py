"""phase2_extend_existing_tables

Revision ID: bcdba7111528
Revises: 71e35724de48
Create Date: 2025-12-21 04:10:10.722995

PHASE 2: Extend Existing Tables
Adds new columns to existing tables (SAFE, ADDITIVE ONLY):
- departments: short_code, branch_code, institute_id
- semesters: sequence (ordering 1-8)
- users: is_active (boolean)
- subjects: regulation_id

All columns are nullable initially and backfilled after addition.
NO data deletion, NO column removal, NO renaming.
Note: Foreign key constraints are not enforced in SQLite for these columns.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bcdba7111528'
down_revision: Union[str, Sequence[str], None] = '71e35724de48'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Extend existing tables with new columns and backfill data."""
    
    # ========================================================================
    # TABLE 1: departments - Add institute reference and branch codes
    # ========================================================================
    op.add_column('departments', sa.Column('short_code', sa.String(), nullable=True))
    op.add_column('departments', sa.Column('branch_code', sa.String(), nullable=True))
    op.add_column('departments', sa.Column('institute_id', sa.Integer(), nullable=True))
    
    # Backfill departments data
    op.execute("""
        UPDATE departments 
        SET 
            short_code = code,
            branch_code = CASE code
                WHEN 'CSE' THEN '05'
                WHEN 'ECE' THEN '04'
                WHEN 'MECH' THEN '03'
                WHEN 'CSM' THEN '42'
                WHEN 'COS' THEN '99'
                ELSE NULL
            END,
            institute_id = 1
    """)
    
    # ========================================================================
    # TABLE 2: semesters - Add sequence for ordering
    # ========================================================================
    op.add_column('semesters', sa.Column('sequence', sa.Integer(), nullable=True))
    
    # Backfill semesters sequence
    op.execute("""
        UPDATE semesters 
        SET sequence = CASE name
            WHEN '1-1' THEN 1
            WHEN '1-2' THEN 2
            WHEN '2-1' THEN 3
            WHEN '2-2' THEN 4
            WHEN '3-1' THEN 5
            WHEN '3-2' THEN 6
            WHEN '4-1' THEN 7
            WHEN '4-2' THEN 8
            ELSE NULL
        END
    """)
    
    # ========================================================================
    # TABLE 3: users - Add active status flag
    # ========================================================================
    op.add_column('users', sa.Column('is_active', sa.Boolean(), 
                                      nullable=True, server_default='1'))
    
    # Backfill users - all existing users are active
    op.execute("""
        UPDATE users 
        SET is_active = 1
        WHERE is_active IS NULL
    """)
    
    # ========================================================================
    # TABLE 4: subjects - Add regulation reference
    # ========================================================================
    op.add_column('subjects', sa.Column('regulation_id', sa.Integer(), nullable=True))
    
    # Backfill subjects - all existing subjects use R20 (id=1)
    op.execute("""
        UPDATE subjects 
        SET regulation_id = 1
        WHERE regulation_id IS NULL
    """)


def downgrade() -> None:
    """Remove Phase 2 additions (reverse migration)."""
    
    # Remove in reverse order of addition
    op.drop_column('subjects', 'regulation_id')
    op.drop_column('users', 'is_active')
    op.drop_column('semesters', 'sequence')
    op.drop_column('departments', 'institute_id')
    op.drop_column('departments', 'branch_code')
    op.drop_column('departments', 'short_code')

