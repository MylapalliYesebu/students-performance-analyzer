"""phase7_create_admins_table

Revision ID: 787dce8f06af
Revises: f47e360a0218
Create Date: 2025-12-21 05:37:39.557826

PHASE 7: Admins Table
Creates the admins table to properly model college administration.

Key concepts:
- Admins are promoted teachers (not separate users)
- One teacher can be admin only once (UNIQUE constraint)
- Admin types:
    * "master" - full control (no department/section restrictions)
    * "hod" - controls one department
    * "class_incharge" - controls one section
- Exactly ONE master admin must exist
- Master admin cannot be deleted or demoted
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '787dce8f06af'
down_revision: Union[str, Sequence[str], None] = 'f47e360a0218'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create admins table."""
    
    op.create_table(
        'admins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('admin_type', sa.String(), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=True),
        sa.Column('section_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ),
        sa.ForeignKeyConstraint(['teacher_id'], ['teachers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('teacher_id', name='uq_admin_teacher_id')
    )
    
    # Create indexes for performance
    op.create_index(op.f('ix_admins_admin_type'), 'admins', ['admin_type'], unique=False)
    op.create_index(op.f('ix_admins_teacher_id'), 'admins', ['teacher_id'], unique=True)


def downgrade() -> None:
    """Remove Phase 7 additions (reverse migration)."""
    
    # Drop indexes first
    op.drop_index(op.f('ix_admins_teacher_id'), table_name='admins')
    op.drop_index(op.f('ix_admins_admin_type'), table_name='admins')
    
    # Drop table
    op.drop_table('admins')
