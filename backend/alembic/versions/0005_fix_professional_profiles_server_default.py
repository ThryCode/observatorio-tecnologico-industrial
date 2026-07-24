"""fix server_default for professional_profiles.id

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-24
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "professional_profiles",
        "id",
        server_default=sa.text("gen_random_uuid()"),
    )


def downgrade() -> None:
    op.alter_column(
        "professional_profiles",
        "id",
        server_default=None,
    )
