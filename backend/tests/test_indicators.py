import pytest

from tests.factories import make_indicator


@pytest.mark.asyncio
async def test_create_indicator(client, auth_headers):
    headers = await auth_headers("induser", role="admin_mindus")
    payload = {
        "name": "Industrial Production Index",
        "code": "IPI-2025",
        "description": "Monthly industrial production index",
        "unit": "percentage",
        "value": 102.5,
        "source": "ONEI",
        "period": "monthly",
    }
    resp = await client.post("/api/v1/indicators", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["code"] == "IPI-2025"
    assert float(data["value"]) == 102.5


@pytest.mark.asyncio
async def test_create_indicator_no_auth(client):
    resp = await client.post("/api/v1/indicators", json={
        "name": "No Auth", "code": "NO-001", "unit": "pct",
        "value": 1, "source": "T", "period": "monthly",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_indicator_duplicate_code(client, auth_headers):
    headers = await auth_headers("inddup", role="admin_mindus")
    payload = {
        "name": "First", "code": "DUP-001", "unit": "pct",
        "value": 1, "source": "T", "period": "monthly",
    }
    await client.post("/api/v1/indicators", json=payload, headers=headers)
    resp = await client.post("/api/v1/indicators", json=payload, headers=headers)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_list_indicators(client, db_session):
    await make_indicator(db_session, code="LST-001")
    await make_indicator(db_session, code="LST-002")
    resp = await client.get("/api/v1/indicators")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 2


@pytest.mark.asyncio
async def test_get_indicator(client, db_session):
    ind = await make_indicator(db_session)
    resp = await client.get(f"/api/v1/indicators/{ind.id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == str(ind.id)


@pytest.mark.asyncio
async def test_get_indicator_not_found(client):
    resp = await client.get("/api/v1/indicators/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_indicator(client, db_session, auth_headers):
    ind = await make_indicator(db_session, code="UPD-001")
    headers = await auth_headers("indupd", role="admin_mindus")
    resp = await client.put(f"/api/v1/indicators/{ind.id}", json={"name": "Updated"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"


@pytest.mark.asyncio
async def test_delete_indicator(client, db_session, auth_headers):
    ind = await make_indicator(db_session, code="DEL-001")
    headers = await auth_headers("inddel", is_superuser=True)
    resp = await client.delete(f"/api/v1/indicators/{ind.id}", headers=headers)
    assert resp.status_code == 200
    resp = await client.get(f"/api/v1/indicators/{ind.id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_indicator_not_superuser(client, db_session, auth_headers):
    ind = await make_indicator(db_session, code="DEL-002")
    headers = await auth_headers("induser_noadmin")
    resp = await client.delete(f"/api/v1/indicators/{ind.id}", headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_indicators_pagination(client, db_session, auth_headers):
    headers = await auth_headers("indpage", role="admin_mindus")
    for i in range(12):
        await make_indicator(db_session, code=f"PAGE-{i:04d}")
    await db_session.flush()

    resp = await client.get("/api/v1/indicators?page=1&per_page=5", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 5
    assert data["total"] == 12
    assert data["total_pages"] == 3
