import pytest

from tests.factories import make_regulation


@pytest.mark.asyncio
async def test_create_regulation(client, auth_headers):
    headers = await auth_headers("reguser")
    payload = {
        "title": "Industrial Safety Regulation",
        "regulation_number": "RES-2025-001",
        "issuing_body": "Ministry of Industries",
        "publication_date": "2025-01-15",
        "category": "resolution",
        "summary": "Safety standards for industrial facilities.",
    }
    resp = await client.post("/api/v1/regulations", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["regulation_number"] == "RES-2025-001"
    assert data["category"] == "resolution"


@pytest.mark.asyncio
async def test_create_regulation_no_auth(client):
    resp = await client.post("/api/v1/regulations", json={
        "title": "No Auth", "regulation_number": "RES-000",
        "issuing_body": "Test", "publication_date": "2026-01-01",
        "category": "resolution",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_regulation_invalid_date(client, auth_headers):
    headers = await auth_headers("regdate")
    resp = await client.post("/api/v1/regulations", json={
        "title": "Bad Date", "regulation_number": "RES-2026-002",
        "issuing_body": "Test", "publication_date": "2026-06-01",
        "effective_date": "2026-01-01",
        "category": "resolution",
    }, headers=headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_regulations(client, db_session):
    await make_regulation(db_session, regulation_number="RES-001")
    await make_regulation(db_session, regulation_number="RES-002")
    resp = await client.get("/api/v1/regulations")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 2


@pytest.mark.asyncio
async def test_get_regulation(client, db_session):
    reg = await make_regulation(db_session)
    resp = await client.get(f"/api/v1/regulations/{reg.id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == str(reg.id)


@pytest.mark.asyncio
async def test_get_regulation_not_found(client):
    resp = await client.get("/api/v1/regulations/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_regulation(client, db_session, auth_headers):
    reg = await make_regulation(db_session, regulation_number="RES-2026-003")
    headers = await auth_headers("regupd")
    resp = await client.put(f"/api/v1/regulations/{reg.id}", json={"title": "Updated"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated"


@pytest.mark.asyncio
async def test_delete_regulation(client, db_session, auth_headers):
    reg = await make_regulation(db_session, regulation_number="RES-2026-004")
    headers = await auth_headers("regdel", is_superuser=True)
    resp = await client.delete(f"/api/v1/regulations/{reg.id}", headers=headers)
    assert resp.status_code == 200
    resp = await client.get(f"/api/v1/regulations/{reg.id}")
    assert resp.status_code == 404
