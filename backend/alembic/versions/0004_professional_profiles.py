"""add professional_profiles table

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-22 00:00:00.000000
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade():
    op.create_table(
        "professional_profiles",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("especialidad", sa.String(100), nullable=False),
        sa.Column("grado_cientifico", sa.String(50), nullable=True),
        sa.Column("cv_url", sa.String(255), nullable=True),
        sa.Column("biografia", sa.Text(), nullable=True),
        sa.Column("intereses", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_professional_profiles_user_id", "professional_profiles", ["user_id"])


def downgrade():
    op.drop_index("ix_professional_profiles_user_id", table_name="professional_profiles")
    op.drop_table("professional_profiles")
