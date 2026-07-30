"""fix_research_publications id server_default

Fixes the `research_publications` table: the `id` column was created with
`default=sa.text("gen_random_uuid()")` instead of
`server_default=sa.text("gen_random_uuid()")`, so raw SQL inserts without an
explicit `id` would fail due to the missing database-level default.

Revision ID: 3446be691200
Revises: bb9f93ba04fa
Create Date: 2026-07-30 11:07:32.874203
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '3446be691200'
down_revision: Union[str, None] = 'bb9f93ba04fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix the id column: add the missing server_default for gen_random_uuid()
    op.execute(
        "ALTER TABLE research_publications ALTER COLUMN id SET DEFAULT gen_random_uuid()"
    )


def downgrade() -> None:
    # Remove the server_default that was added in upgrade
    op.execute(
        "ALTER TABLE research_publications ALTER COLUMN id DROP DEFAULT"
    )
