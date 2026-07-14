"""initial schema with industrial sectors

Revision ID: 0001
Revises:
Create Date: 2026-07-09 00:00:00.000000
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── Tabla maestra: sectores industriales ──────────────────────────────────
    op.create_table(
        "industrial_sectores",
        sa.Column("codigo", sa.String(3), primary_key=True),
        sa.Column("nombre", sa.String(50), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
    )

    op.execute("""
        INSERT INTO industrial_sectores (codigo, nombre, descripcion) VALUES
        ('SID', 'Siderurgia', 'Industria del acero y derivados'),
        ('MET', 'Metalurgia', 'Transformación de metales no ferrosos'),
        ('ELE', 'Electrónica', 'Componentes y sistemas electrónicos'),
        ('QUI', 'Química', 'Industria química y petroquímica'),
        ('AUT', 'Automatización', 'Automatización industrial y robótica')
    """)

    # ── Organizaciones ──────────────────────────────────────────────────────
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("siglas", sa.String(20), unique=True, nullable=False),
        sa.Column("tipo", sa.String(30), nullable=False),
        sa.Column("sector_codigo", sa.String(3),
                  sa.ForeignKey("industrial_sectores.codigo"), nullable=True),
        sa.Column("pais", sa.String(100), nullable=True),
        sa.Column("provincia", sa.String(100), nullable=True),
        sa.Column("sitio_web", sa.String(255), nullable=True),
        sa.Column("email_contacto", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )

    # ── Tecnologías ──────────────────────────────────────────────────────────
    op.create_table(
        "technologies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("sector_codigo", sa.String(3),
                  sa.ForeignKey("industrial_sectores.codigo"), nullable=True),
        sa.Column("trl_nivel", sa.Integer(), nullable=True),
        sa.Column("referencia_ontologia", sa.String(50), nullable=True),
        sa.Column("palabras_clave", postgresql.ARRAY(sa.String(50)), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )

    # ── Usuarios ─────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("username", sa.String(50), unique=True, index=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("role", sa.String(20), server_default="visitante", nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("job_title", sa.String(100), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("is_superuser", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )

    # ── Patentes ─────────────────────────────────────────────────────────────
    op.create_table(
        "patents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("patent_number", sa.String(50), unique=True, index=True, nullable=False),
        sa.Column("applicant", sa.String(200), nullable=False),
        sa.Column("inventor", sa.String(200), nullable=False),
        sa.Column("filing_date", sa.Date(), nullable=False),
        sa.Column("publication_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("abstract", sa.Text(), nullable=True),
        sa.Column("technological_sector", sa.String(100), nullable=True),
        sa.Column("country", sa.String(50), nullable=False),
        sa.Column("technology_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("technologies.id"), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )

    # ── Normativas ───────────────────────────────────────────────────────────
    op.create_table(
        "regulations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("regulation_number", sa.String(50), unique=True, index=True, nullable=False),
        sa.Column("issuing_body", sa.String(200), nullable=False),
        sa.Column("publication_date", sa.Date(), nullable=False),
        sa.Column("effective_date", sa.Date(), nullable=True),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("sector_codigo", sa.String(3),
                  sa.ForeignKey("industrial_sectores.codigo"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )

    # ── Indicadores ──────────────────────────────────────────────────────────
    op.create_table(
        "indicators",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("code", sa.String(50), unique=True, index=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("unit", sa.String(50), nullable=False),
        sa.Column("value", sa.Numeric(14, 4), nullable=False),
        sa.Column("source", sa.String(200), nullable=False),
        sa.Column("period", sa.String(20), nullable=False),
        sa.Column("sector_codigo", sa.String(3),
                  sa.ForeignKey("industrial_sectores.codigo"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("indicators")
    op.drop_table("regulations")
    op.drop_table("patents")
    op.drop_table("users")
    op.drop_table("technologies")
    op.drop_table("organizations")
    op.drop_table("industrial_sectores")
