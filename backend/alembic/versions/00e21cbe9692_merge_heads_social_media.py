"""merge_heads_social_media

Revision ID: 00e21cbe9692
Revises: 3446be691200, c1a2b3d4e5f6
Create Date: 2026-07-31 09:15:33.245803
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '00e21cbe9692'
down_revision: Union[str, None] = ('3446be691200', 'c1a2b3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
