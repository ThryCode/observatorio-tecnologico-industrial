import pytest

from tests.factories import make_patent


@pytest.fixture
def patent_payload():
    return {
        "title": "Industrial Process Optimization",
        "patent_number": "CU-2025-0001",
        "applicant": "Ministry of Industries",
        "inventor": "Juan Pérez",
        "filing_date": "2025-06-15",
        "status": "filed",
        "abstract": "A method for optimizing industrial processes.",
        "technological_sector": "Manufacturing",
        "country": "CU",
    }


@pytest.mark.asyncio
async def test_create_patent(client, patent_payload, auth_headers):
    headers = await auth_headers("patuser")
    resp = await client.post("/api/v1/patents", json=patent_payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["patent_number"] == "CU-2025-0001"
    assert data["title"] == "Industrial Process Optimization"


@pytest.mark.asyncio
async def test_create_patent_no_auth(client, patent_payload):
    resp = await client.post("/api/v1/patents", json=patent_payload)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_patents(client):
    resp = await client.get("/api/v1/patents")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_patent(client, db_session):
    pat = await make_patent(db_session)
    resp = await client.get(f"/api/v1/patents/{pat.id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == str(pat.id)


@pytest.mark.asyncio
async def test_get_patent_not_found(client):
    resp = await client.get("/api/v1/patents/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_patent(client, db_session, auth_headers):
    pat = await make_patent(db_session, patent_number="CU-2026-002")
    headers = await auth_headers("patupd")
    resp = await client.put(f"/api/v1/patents/{pat.id}", json={"title": "Updated Title"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Title"


@pytest.mark.asyncio
async def test_delete_patent(client, db_session, auth_headers):
    pat = await make_patent(db_session, patent_number="CU-2026-003")
    headers = await auth_headers("patdel", is_superuser=True)
    resp = await client.delete(f"/api/v1/patents/{pat.id}", headers=headers)
    assert resp.status_code == 200
    resp = await client.get(f"/api/v1/patents/{pat.id}")
    assert resp.status_code == 404
