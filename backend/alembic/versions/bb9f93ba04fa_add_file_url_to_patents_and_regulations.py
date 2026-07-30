"""add file_url to patents and regulations

Revision ID: bb9f93ba04fa
Revises: cdf48649a8af
Create Date: 2026-07-29 11:59:49.325533
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'bb9f93ba04fa'
down_revision: Union[str, None] = 'cdf48649a8af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
