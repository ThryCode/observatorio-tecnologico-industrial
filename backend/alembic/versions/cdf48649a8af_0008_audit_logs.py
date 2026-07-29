"""0008_audit_logs

Revision ID: cdf48649a8af
Revises: 27c6e2a0ed5c
Create Date: 2026-07-29 11:31:06.507075
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'cdf48649a8af'
down_revision: Union[str, None] = '27c6e2a0ed5c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('audit_logs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('action', sa.String(length=20), nullable=False),
    sa.Column('entity_type', sa.String(length=50), nullable=False),
    sa.Column('entity_id', sa.String(length=36), nullable=False),
    sa.Column('changes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('ip_address', sa.String(length=45), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('audit_logs')
