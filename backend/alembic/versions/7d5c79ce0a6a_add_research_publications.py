"""add research_publications table

Revision ID: 7d5c79ce0a6a
Revises: 2dd311890e21
Create Date: 2026-07-29 10:08:29.550357
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '7d5c79ce0a6a'
down_revision: Union[str, None] = '2dd311890e21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "research_publications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text("gen_random_uuid()")),
        sa.Column("titulo", sa.String(300), nullable=False),
        sa.Column("autores", sa.Text, nullable=False),
        sa.Column("resumen", sa.Text, nullable=True),
        sa.Column("doi", sa.String(100), nullable=True),
        sa.Column("journal", sa.String(200), nullable=True),
        sa.Column("fecha_publicacion", sa.DateTime, nullable=False),
        sa.Column("palabras_clave", postgresql.ARRAY(sa.String(50)), nullable=True),
        sa.Column("sector_codigo", sa.String(3), sa.ForeignKey("industrial_sectores.codigo"), nullable=True),
        sa.Column("url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("research_publications")
