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
