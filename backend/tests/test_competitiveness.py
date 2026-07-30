import pytest


@pytest.mark.asyncio
async def test_list_competitiveness(client):
    resp = await client.get("/api/v1/competitiveness")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_competitiveness_not_found(client):
    resp = await client.get("/api/v1/competitiveness/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_competitiveness(client, auth_headers):
    headers = await auth_headers("compcreate", role="admin_mindus")
    resp = await client.post("/api/v1/competitiveness", json={
        "sector": "Biotecnologia", "indicador": "Indice de Innovacion",
        "valor": 85.5, "pais": "Cuba", "periodo": "2026-Q1",
    }, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["indicador"] == "Indice de Innovacion"


@pytest.mark.asyncio
async def test_create_competitiveness_no_auth(client):
    resp = await client.post("/api/v1/competitiveness", json={
        "sector": "Energia", "indicador": "Indice Energetico",
        "valor": 90.0, "pais": "Cuba", "periodo": "2026-Q1",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_competitiveness_forbidden(client, auth_headers):
    headers = await auth_headers("compforbid", role="user")
    resp = await client.post("/api/v1/competitiveness", json={
        "sector": "Energia", "indicador": "Indice Energetico",
        "valor": 90.0, "pais": "Cuba", "periodo": "2026-Q1",
    }, headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_update_competitiveness(client, auth_headers):
    headers = await auth_headers("compupdate", role="admin_mindus")
    create = await client.post("/api/v1/competitiveness", json={
        "sector": "Biotecnologia", "indicador": "Indice de Innovacion",
        "valor": 85.5, "pais": "Cuba", "periodo": "2026-Q1",
    }, headers=headers)
    eid = create.json()["id"]
    resp = await client.put(f"/api/v1/competitiveness/{eid}", json={"valor": 95.0}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["valor"] == "95.00"


@pytest.mark.asyncio
async def test_delete_competitiveness(client, auth_headers):
    headers = await auth_headers("compdelete", role="admin_mindus")
    create = await client.post("/api/v1/competitiveness", json={
        "sector": "Biotecnologia", "indicador": "Indice de Innovacion",
        "valor": 85.5, "pais": "Cuba", "periodo": "2026-Q1",
    }, headers=headers)
    eid = create.json()["id"]
    resp = await client.delete(f"/api/v1/competitiveness/{eid}", headers=headers)
    assert resp.status_code == 200
    resp = await client.get(f"/api/v1/competitiveness/{eid}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_competitiveness_unauthorized(client, auth_headers):
    headers = await auth_headers("compdeluser", role="user")
    resp = await client.delete("/api/v1/competitiveness/00000000-0000-0000-0000-000000000001", headers=headers)
    assert resp.status_code == 403
