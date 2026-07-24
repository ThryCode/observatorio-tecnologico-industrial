"""create alerts table

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-24
"""
import sqlalchemy as sa

from alembic import op

revision = "0006"
down_revision = "0005"


def upgrade():
    op.create_table(
        "alerts",
        sa.Column("id", sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("severidad", sa.String(10), nullable=False, server_default="media"),
        sa.Column("fecha", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "sector_codigo",
            sa.String(3),
            sa.ForeignKey("industrial_sectores.codigo"),
            nullable=True,
        ),
        sa.Column("leida", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_alerts_severidad", "alerts", ["severidad"])
    op.create_index("ix_alerts_leida", "alerts", ["leida"])


def downgrade():
    op.drop_index("ix_alerts_leida", table_name="alerts")
    op.drop_index("ix_alerts_severidad", table_name="alerts")
    op.drop_table("alerts")
