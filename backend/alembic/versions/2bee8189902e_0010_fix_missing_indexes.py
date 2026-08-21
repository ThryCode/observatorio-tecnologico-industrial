"""0010_fix_missing_indexes

Revision ID: 2bee8189902e
Revises: 00c35cf85ccb
Create Date: 2026-08-21 09:46:53.057300
"""
from typing import Sequence, Union

from alembic import op


revision: str = "2bee8189902e"
down_revision: Union[str, None] = "00c35cf85ccb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # FK indexes: sector_codigo across 8 tables
    op.create_index("ix_alerts_sector_codigo", "alerts", ["sector_codigo"])
    op.create_index("ix_bulletins_sector_codigo", "bulletins", ["sector_codigo"])
    op.create_index(
        "ix_competitiveness_indices_sector_codigo", "competitiveness_indices", ["sector_codigo"]
    )
    op.create_index("ix_indicators_sector_codigo", "indicators", ["sector_codigo"])
    op.create_index("ix_organizations_sector_codigo", "organizations", ["sector_codigo"])
    op.create_index("ix_patent_map_entries_sector_codigo", "patent_map_entries", ["sector_codigo"])
    op.create_index("ix_regulations_sector_codigo", "regulations", ["sector_codigo"])
    op.create_index("ix_technologies_sector_codigo", "technologies", ["sector_codigo"])
    op.create_index(
        "ix_research_publications_sector_codigo", "research_publications", ["sector_codigo"]
    )

    # FK indexes: other foreign keys
    op.create_index("ix_research_publications_created_by", "research_publications", ["created_by"])
    op.create_index("ix_follows_organization_id", "follows", ["organization_id"])
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])

    # Query frequency indexes for audit_logs
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_entity_type", table_name="audit_logs")
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_user_id", table_name="audit_logs")
    op.drop_index("ix_follows_organization_id", table_name="follows")
    op.drop_index("ix_research_publications_created_by", table_name="research_publications")
    op.drop_index("ix_research_publications_sector_codigo", table_name="research_publications")
    op.drop_index("ix_technologies_sector_codigo", table_name="technologies")
    op.drop_index("ix_regulations_sector_codigo", table_name="regulations")
    op.drop_index("ix_patent_map_entries_sector_codigo", table_name="patent_map_entries")
    op.drop_index("ix_organizations_sector_codigo", table_name="organizations")
    op.drop_index("ix_indicators_sector_codigo", table_name="indicators")
    op.drop_index("ix_competitiveness_indices_sector_codigo", table_name="competitiveness_indices")
    op.drop_index("ix_bulletins_sector_codigo", table_name="bulletins")
    op.drop_index("ix_alerts_sector_codigo", table_name="alerts")
