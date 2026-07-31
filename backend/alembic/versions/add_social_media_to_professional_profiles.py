"""add social media to professional profiles

Revision ID: c1a2b3d4e5f6
Revises: bb9f93ba04fa
Create Date: 2026-07-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, None] = 'bb9f93ba04fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = ('3446be691200',)


def upgrade() -> None:
    op.add_column('professional_profiles', sa.Column('linkedin_url', sa.String(255), nullable=True))
    op.add_column('professional_profiles', sa.Column('twitter_url', sa.String(255), nullable=True))
    op.add_column('professional_profiles', sa.Column('researchgate_url', sa.String(255), nullable=True))
    op.add_column('professional_profiles', sa.Column('orcid', sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column('professional_profiles', 'orcid')
    op.drop_column('professional_profiles', 'researchgate_url')
    op.drop_column('professional_profiles', 'twitter_url')
    op.drop_column('professional_profiles', 'linkedin_url')
