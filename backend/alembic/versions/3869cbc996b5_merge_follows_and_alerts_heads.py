"""merge_follows_and_alerts_heads

Revision ID: 3869cbc996b5
Revises: 0006, 82db23c93d66
Create Date: 2026-07-28 08:27:08.152146
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '3869cbc996b5'
down_revision: Union[str, None] = ('0006', '82db23c93d66')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
