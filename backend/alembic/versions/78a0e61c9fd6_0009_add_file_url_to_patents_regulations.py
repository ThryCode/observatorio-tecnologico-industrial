"""0009_add_file_url_to_patents_regulations

Revision ID: 78a0e61c9fd6
Revises: 2dd311890e21
Create Date: 2026-07-29 09:52:43.834700
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '78a0e61c9fd6'
down_revision: Union[str, None] = '2dd311890e21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("patents", sa.Column("file_url", sa.String(500), nullable=True))
    op.add_column("regulations", sa.Column("file_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("regulations", "file_url")
    op.drop_column("patents", "file_url")
