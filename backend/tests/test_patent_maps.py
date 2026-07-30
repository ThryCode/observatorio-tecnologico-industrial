import pytest


@pytest.mark.asyncio
async def test_get_patent_map_summary(client):
    resp = await client.get("/api/v1/patent-maps/summary")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_get_patent_map_entry_not_found(client):
    resp = await client.get("/api/v1/patent-maps/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_patent_map_entry(client, auth_headers):
    headers = await auth_headers("pmcreate", role="admin_mindus")
    resp = await client.post("/api/v1/patent-maps", json={
        "tecnologia": "Nanotecnologia", "pais": "Cuba",
        "total_patentes": 15, "periodo": "2026", "tendencia": "creciente",
    }, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["tecnologia"] == "Nanotecnologia"
