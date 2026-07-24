"""create_follows_table

Revision ID: 82db23c93d66
Revises: 08b5fe1de05c
Create Date: 2026-07-24 10:45:20.219195
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '82db23c93d66'
down_revision: Union[str, None] = '08b5fe1de05c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('follows',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('follower_id', sa.UUID(), nullable=False),
        sa.Column('follower_type', sa.String(length=20), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('follower_id', 'follower_type', 'organization_id', name='uq_follow'),
    )


def downgrade() -> None:
    op.drop_table('follows')
