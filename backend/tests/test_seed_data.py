import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.seed_data import seed_all
from app.models.organization import Organization
from app.models.industrial_sector import IndustrialSector
from app.models.technology import Technology
from app.models.patent import Patent
from app.models.indicator import Indicator
from app.models.alert import Alert
from app.models.bulletin import Bulletin
from app.models.competitiveness import CompetitivenessIndex
from app.models.research_publication import ResearchPublication


@pytest.mark.asyncio
async def test_seed_all_idempotent(db_session):
    count1 = await seed_all(db_session)
    count2 = await seed_all(db_session)

    result = await db_session.execute(select(Organization))
    orgs = result.scalars().all()
    assert len(orgs) > 0

    result2 = await db_session.execute(select(Organization))
    orgs2 = result2.scalars().all()
    assert len(orgs) == len(orgs2)


@pytest.mark.asyncio
async def test_seed_creates_sectors(db_session):
    await seed_all(db_session)

    result = await db_session.execute(select(IndustrialSector))
    sectors = result.scalars().all()
    assert len(sectors) > 0


@pytest.mark.asyncio
async def test_seed_creates_organizations(db_session):
    await seed_all(db_session)

    result = await db_session.execute(select(Organization))
    orgs = result.scalars().all()
    assert len(orgs) > 0


@pytest.mark.asyncio
async def test_seed_creates_technologies(db_session):
    await seed_all(db_session)

    result = await db_session.execute(select(Technology))
    techs = result.scalars().all()
    assert len(techs) > 0


@pytest.mark.asyncio
async def test_seed_creates_patents(db_session):
    await seed_all(db_session)

    result = await db_session.execute(select(Patent))
    patents = result.scalars().all()
    assert len(patents) > 0


@pytest.mark.asyncio
async def test_seed_creates_indicators(db_session):
    await seed_all(db_session)

    result = await db_session.execute(select(Indicator))
    indicators = result.scalars().all()
    assert len(indicators) > 0


@pytest.mark.asyncio
async def test_seed_creates_alerts(db_session):
    await seed_all(db_session)

    result = await db_session.execute(select(Alert))
    alerts = result.scalars().all()
    assert len(alerts) > 0


@pytest.mark.asyncio
async def test_seed_creates_bulletins(db_session):
    await seed_all(db_session)

    result = await db_session.execute(select(Bulletin))
    bulletins = result.scalars().all()
    assert len(bulletins) > 0
