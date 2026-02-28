"""phase6_extend_marks_table

Revision ID: f47e360a0218
Revises: a914e34ff475
Create Date: 2025-12-21 05:19:08.032938

PHASE 6: Marks Table Extension (CRITICAL)
Extends the marks table with new columns for the finalized academic model.

IMPORTANT: This migration ONLY adds columns. NO backfilling happens here.
Backfilling will be done by a separate Python script.

New columns:
- subject_offering_id (FK → subject_offerings.id, nullable)
- exam_session_id (FK → exam_sessions.id, nullable)
- max_marks (Float, nullable) - replaces total_marks semantically
- uploaded_by (FK → users.id, nullable) - tracks who entered the marks

Legacy columns preserved (NOT dropped):
- subject_id (will be deprecated later)
- exam_type (will be deprecated later)
- total_marks (will be deprecated later)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f47e360a0218'
down_revision: Union[str, Sequence[str], None] = 'a914e34ff475'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new columns to marks table (nullable, no backfill)."""
    
    # Add new columns - all nullable initially
    op.add_column('marks', sa.Column('subject_offering_id', sa.Integer(), nullable=True))
    op.add_column('marks', sa.Column('exam_session_id', sa.Integer(), nullable=True))
    op.add_column('marks', sa.Column('max_marks', sa.Float(), nullable=True))
    op.add_column('marks', sa.Column('uploaded_by', sa.Integer(), nullable=True))
    
    # Create indexes for performance
    op.create_index(op.f('ix_marks_subject_offering_id'), 'marks', ['subject_offering_id'], unique=False)
    op.create_index(op.f('ix_marks_exam_session_id'), 'marks', ['exam_session_id'], unique=False)
    
    # Note: FK constraints not enforced due to SQLite ALTER TABLE limitations
    # These are logical relationships only


def downgrade() -> None:
    """Remove Phase 6 additions (reverse migration)."""
    
    # Drop indexes first
    op.drop_index(op.f('ix_marks_exam_session_id'), table_name='marks')
    op.drop_index(op.f('ix_marks_subject_offering_id'), table_name='marks')
    
    # Drop columns
    op.drop_column('marks', 'uploaded_by')
    op.drop_column('marks', 'max_marks')
    op.drop_column('marks', 'exam_session_id')
    op.drop_column('marks', 'subject_offering_id')
