"""add performance indexes for FK columns and filtered columns

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-14 00:00:00.000000
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade():
    # Foreign key indexes (7)
    op.create_index("ix_organizations_sector_codigo", "organizations", ["sector_codigo"])
    op.create_index("ix_technologies_sector_codigo", "technologies", ["sector_codigo"])
    op.create_index("ix_patents_technology_id", "patents", ["technology_id"])
    op.create_index("ix_patents_organization_id", "patents", ["organization_id"])
    op.create_index("ix_regulations_sector_codigo", "regulations", ["sector_codigo"])
    op.create_index("ix_indicators_sector_codigo", "indicators", ["sector_codigo"])
    op.create_index("ix_users_organization_id", "users", ["organization_id"])

    # Filtered column indexes (16)
    op.create_index("ix_organizations_tipo", "organizations", ["tipo"])
    op.create_index("ix_organizations_pais", "organizations", ["pais"])
    op.create_index("ix_technologies_trl_nivel", "technologies", ["trl_nivel"])
    op.create_index("ix_patents_status", "patents", ["status"])
    op.create_index("ix_patents_country", "patents", ["country"])
    op.create_index("ix_patents_applicant", "patents", ["applicant"])
    op.create_index("ix_patents_inventor", "patents", ["inventor"])
    op.create_index("ix_patents_filing_date", "patents", ["filing_date"])
    op.create_index("ix_patents_technological_sector", "patents", ["technological_sector"])
    op.create_index("ix_regulations_category", "regulations", ["category"])
    op.create_index("ix_regulations_issuing_body", "regulations", ["issuing_body"])
    op.create_index("ix_regulations_publication_date", "regulations", ["publication_date"])
    op.create_index("ix_indicators_period", "indicators", ["period"])
    op.create_index("ix_indicators_source", "indicators", ["source"])
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_is_active", "users", ["is_active"])


def downgrade():
    op.drop_index("ix_users_is_active", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_indicators_source", table_name="indicators")
    op.drop_index("ix_indicators_period", table_name="indicators")
    op.drop_index("ix_regulations_publication_date", table_name="regulations")
    op.drop_index("ix_regulations_issuing_body", table_name="regulations")
    op.drop_index("ix_regulations_category", table_name="regulations")
    op.drop_index("ix_patents_technological_sector", table_name="patents")
    op.drop_index("ix_patents_filing_date", table_name="patents")
    op.drop_index("ix_patents_inventor", table_name="patents")
    op.drop_index("ix_patents_applicant", table_name="patents")
    op.drop_index("ix_patents_country", table_name="patents")
    op.drop_index("ix_patents_status", table_name="patents")
    op.drop_index("ix_technologies_trl_nivel", table_name="technologies")
    op.drop_index("ix_organizations_pais", table_name="organizations")
    op.drop_index("ix_organizations_tipo", table_name="organizations")
    op.drop_index("ix_users_organization_id", table_name="users")
    op.drop_index("ix_indicators_sector_codigo", table_name="indicators")
    op.drop_index("ix_regulations_sector_codigo", table_name="regulations")
    op.drop_index("ix_patents_organization_id", table_name="patents")
    op.drop_index("ix_patents_technology_id", table_name="patents")
    op.drop_index("ix_technologies_sector_codigo", table_name="technologies")
    op.drop_index("ix_organizations_sector_codigo", table_name="organizations")
