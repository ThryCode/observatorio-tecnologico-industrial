"""add registration fields to users table

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-21 00:00:00.000000
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade():
    op.add_column("users", sa.Column("account_type", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("status", sa.String(20), server_default="pending"))
    op.add_column("users", sa.Column("rejection_reason", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("approved_by", sa.UUID(), nullable=True))
    op.add_column("users", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_users_status", "users", ["status"])
    op.create_index("ix_users_account_type", "users", ["account_type"])
    op.create_foreign_key("fk_users_approved_by", "users", "users", ["approved_by"], ["id"])


def downgrade():
    op.drop_constraint("fk_users_approved_by", "users", type_="foreignkey")
    op.drop_index("ix_users_account_type", table_name="users")
    op.drop_index("ix_users_status", table_name="users")
    op.drop_column("users", "approved_at")
    op.drop_column("users", "approved_by")
    op.drop_column("users", "rejection_reason")
    op.drop_column("users", "status")
    op.drop_column("users", "account_type")
