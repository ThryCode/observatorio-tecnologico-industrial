"""0007_bulletins_competitiveness_patentmaps

Revision ID: 2dd311890e21
Revises: 3869cbc996b5
Create Date: 2026-07-28 08:27:28.517155
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '2dd311890e21'
down_revision: Union[str, None] = '3869cbc996b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('bulletins',
    sa.Column('titulo', sa.String(length=300), nullable=False),
    sa.Column('resumen', sa.Text(), nullable=True),
    sa.Column('fecha_publicacion', sa.DateTime(), nullable=False),
    sa.Column('categoria', sa.String(length=50), nullable=False),
    sa.Column('autor', sa.String(length=200), nullable=True),
    sa.Column('archivo_url', sa.String(length=500), nullable=True),
    sa.Column('sector_codigo', sa.String(length=3), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['sector_codigo'], ['industrial_sectores.codigo'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('competitiveness_indices',
    sa.Column('sector', sa.String(length=200), nullable=False),
    sa.Column('sector_codigo', sa.String(length=3), nullable=True),
    sa.Column('indicador', sa.String(length=200), nullable=False),
    sa.Column('valor', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('pais', sa.String(length=100), nullable=False),
    sa.Column('periodo', sa.String(length=20), nullable=False),
    sa.Column('fuente', sa.String(length=300), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['sector_codigo'], ['industrial_sectores.codigo'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('patent_map_entries',
    sa.Column('tecnologia', sa.String(length=200), nullable=False),
    sa.Column('pais', sa.String(length=100), nullable=False),
    sa.Column('sector_codigo', sa.String(length=3), nullable=True),
    sa.Column('total_patentes', sa.Integer(), nullable=False),
    sa.Column('periodo', sa.String(length=20), nullable=False),
    sa.Column('tendencia', sa.String(length=20), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['sector_codigo'], ['industrial_sectores.codigo'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('patent_map_entries')
    op.drop_table('competitiveness_indices')
    op.drop_table('bulletins')
