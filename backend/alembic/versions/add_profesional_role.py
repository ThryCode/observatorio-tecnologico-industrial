"""add profesional role

Revision ID: d2e3f4a5b6c7
Revises: 00e21cbe9692
Create Date: 2026-07-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, None] = '00e21cbe9692'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE users SET role = 'profesional' WHERE account_type = 'profesional' AND role = 'visitante'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE users SET role = 'visitante' WHERE role = 'profesional'"
    )
