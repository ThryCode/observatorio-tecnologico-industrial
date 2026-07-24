"""add_fecha_creacion_and_contacto_to_organizations

Revision ID: 08b5fe1de05c
Revises: 0004
Create Date: 2026-07-24 10:06:27.699170
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '08b5fe1de05c'
down_revision: Union[str, None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('organizations', sa.Column('fecha_creacion', sa.Date(), nullable=True))
    op.add_column('organizations', sa.Column('contacto', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('organizations', 'contacto')
    op.drop_column('organizations', 'fecha_creacion')
