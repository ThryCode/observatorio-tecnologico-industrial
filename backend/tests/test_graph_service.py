import uuid
from datetime import date

import pytest

from app.models.follow import Follow
from app.models.organization import Organization
from app.models.patent import Patent, PatentStatus
from app.models.user import User
from app.services.graph_service import GraphService


async def _make_org(db, siglas="ORG01"):
    from app.models.industrial_sector import IndustrialSector
    existing = await db.get(IndustrialSector, "01")
    if not existing:
        sector = IndustrialSector(codigo="01", nombre="Sector")
        db.add(sector)
        await db.flush()
    org = Organization(
        nombre=f"Org {siglas}", siglas=siglas, tipo="empresa",
        sector_codigo="01", pais="Cuba", provincia="La Habana",
    )
    db.add(org)
    await db.flush()
    return org


async def _make_user(db, org_id, username="user1"):
    user = User(
        username=username, email=f"{username}@test.com",
        full_name="Test User", hashed_password="x",
        organization_id=org_id,
    )
    db.add(user)
    await db.flush()
    return user


async def _make_patent(db, org_id, status=PatentStatus.FILED):
    patent = Patent(
        title="Test Patent", patent_number=f"CU-2024-{uuid.uuid4().hex[:6]}",
        applicant="Applicant", inventor="Inventor",
        filing_date=date(2024, 1, 1), status=status,
        country="Cuba", organization_id=org_id,
    )
    db.add(patent)
    await db.flush()
    return patent


@pytest.mark.asyncio
async def test_enterprise_graph_empty(client, db_session, auth_headers):
    headers = await auth_headers(role="admin_mindus")
    resp = await client.get("/api/v1/graph/enterprise", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "nodes" in data
    assert "edges" in data


@pytest.mark.asyncio
async def test_enterprise_graph_with_data(client, db_session, auth_headers):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    await db_session.flush()

    result = await db_session.execute(
        __import__('sqlalchemy').select(Organization)
    )
    orgs = result.scalars().all()
    assert len(orgs) > 0
    org = orgs[0]

    user = await _make_user(db_session, org.id, "graph_user1")
    await db_session.flush()

    await _make_patent(db_session, org.id, PatentStatus.GRANTED)
    await _make_patent(db_session, org.id, PatentStatus.FILED)
    await db_session.flush()

    from app.models.industrial_sector import IndustrialSector
    sector_result = await db_session.execute(
        __import__('sqlalchemy').select(IndustrialSector).limit(1)
    )
    sector = sector_result.scalar_one_or_none()
    if not sector:
        sector = IndustrialSector(codigo="TEST", nombre="Test Sector")
        db_session.add(sector)
        await db_session.flush()

    org2 = Organization(
        nombre="Org2", siglas="ORG2", tipo="empresa",
        sector_codigo=sector.codigo, pais="Cuba", provincia="La Habana",
    )
    db_session.add(org2)
    await db_session.flush()

    follow = Follow(
        follower_id=user.id, follower_type="user",
        organization_id=org2.id,
    )
    db_session.add(follow)
    await db_session.flush()

    headers = await auth_headers(role="admin_mindus")
    resp = await client.get("/api/v1/graph/enterprise", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["nodes"]) >= 1
    assert any(n["id"] == str(org.id) for n in data["nodes"])


@pytest.mark.asyncio
async def test_enterprise_graph_service_directly(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    await db_session.flush()

    service = GraphService(db_session)
    result = await service.get_enterprise_graph()

    assert hasattr(result, "nodes")
    assert hasattr(result, "edges")
    assert isinstance(result.nodes, list)
    assert isinstance(result.edges, list)
