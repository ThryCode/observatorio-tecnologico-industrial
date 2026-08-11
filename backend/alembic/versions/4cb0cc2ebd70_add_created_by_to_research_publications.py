"""add created_by to research_publications

Revision ID: 4cb0cc2ebd70
Revises: d2e3f4a5b6c7
Create Date: 2026-07-31 11:18:12.306206
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '4cb0cc2ebd70'
down_revision: Union[str, None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('research_publications', sa.Column('created_by', sa.UUID(), nullable=True))
    op.create_foreign_key(None, 'research_publications', 'users', ['created_by'], ['id'])


def downgrade() -> None:
    op.drop_constraint(None, 'research_publications', type_='foreignkey')
    op.drop_column('research_publications', 'created_by')
