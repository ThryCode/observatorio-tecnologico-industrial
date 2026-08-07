"""0010_fix_missing_indexes_and_defaults

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # FK indexes
    op.create_index("ix_alerts_sector_codigo", "alerts", ["sector_codigo"])
    op.create_index("ix_research_publications_sector_codigo", "research_publications", ["sector_codigo"])
    op.create_index("ix_research_publications_created_by", "research_publications", ["created_by"])
    op.create_index("ix_bulletins_sector_codigo", "bulletins", ["sector_codigo"])
    op.create_index("ix_competitiveness_indices_sector_codigo", "competitiveness_indices", ["sector_codigo"])
    op.create_index("ix_patent_map_entries_sector_codigo", "patent_map_entries", ["sector_codigo"])
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_follows_organization_id", "follows", ["organization_id"])

    # Frequently queried columns
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])

    # Defaults
    op.execute("ALTER TABLE audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()")
    op.execute("ALTER TABLE follows ALTER COLUMN id SET DEFAULT gen_random_uuid()")

    # NOT NULL
    op.execute("ALTER TABLE users ALTER COLUMN status SET NOT NULL")


def downgrade() -> None:
    op.drop_index("ix_alerts_sector_codigo", table_name="alerts")
    op.drop_index("ix_research_publications_sector_codigo", table_name="research_publications")
    op.drop_index("ix_research_publications_created_by", table_name="research_publications")
    op.drop_index("ix_bulletins_sector_codigo", table_name="bulletins")
    op.drop_index("ix_competitiveness_indices_sector_codigo", table_name="competitiveness_indices")
    op.drop_index("ix_patent_map_entries_sector_codigo", table_name="patent_map_entries")
    op.drop_index("ix_audit_logs_user_id", table_name="audit_logs")
    op.drop_index("ix_follows_organization_id", table_name="follows")
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_entity_type", table_name="audit_logs")

    op.execute("ALTER TABLE audit_logs ALTER COLUMN id DROP DEFAULT")
    op.execute("ALTER TABLE follows ALTER COLUMN id DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN status DROP NOT NULL")
