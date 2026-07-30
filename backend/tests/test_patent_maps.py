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


@pytest.mark.asyncio
async def test_create_patent_map_entry_no_auth(client):
    resp = await client.post("/api/v1/patent-maps", json={
        "tecnologia": "Inteligencia Artificial", "pais": "Cuba",
        "total_patentes": 25, "periodo": "2026", "tendencia": "creciente",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_patent_map_entry_forbidden(client, auth_headers):
    headers = await auth_headers("pmforbid", role="user")
    resp = await client.post("/api/v1/patent-maps", json={
        "tecnologia": "Inteligencia Artificial", "pais": "Cuba",
        "total_patentes": 25, "periodo": "2026", "tendencia": "creciente",
    }, headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_update_patent_map_entry(client, auth_headers):
    headers = await auth_headers("pmupdate", role="admin_mindus")
    create = await client.post("/api/v1/patent-maps", json={
        "tecnologia": "Nanotecnologia", "pais": "Cuba",
        "total_patentes": 15, "periodo": "2026", "tendencia": "creciente",
    }, headers=headers)
    eid = create.json()["id"]
    resp = await client.put(f"/api/v1/patent-maps/{eid}", json={"total_patentes": 30}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total_patentes"] == 30


@pytest.mark.asyncio
async def test_delete_patent_map_entry(client, auth_headers):
    headers = await auth_headers("pmdelete", role="admin_mindus")
    create = await client.post("/api/v1/patent-maps", json={
        "tecnologia": "Nanotecnologia", "pais": "Cuba",
        "total_patentes": 15, "periodo": "2026", "tendencia": "creciente",
    }, headers=headers)
    eid = create.json()["id"]
    resp = await client.delete(f"/api/v1/patent-maps/{eid}", headers=headers)
    assert resp.status_code == 200
    resp = await client.get(f"/api/v1/patent-maps/{eid}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_patent_map_entry_unauthorized(client, auth_headers):
    headers = await auth_headers("pmdeluser", role="user")
    resp = await client.delete("/api/v1/patent-maps/00000000-0000-0000-0000-000000000001", headers=headers)
    assert resp.status_code == 403
