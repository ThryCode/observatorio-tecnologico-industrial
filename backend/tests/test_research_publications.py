import pytest


@pytest.mark.asyncio
async def test_list_research_publications(client):
    resp = await client.get("/api/v1/research-publications")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_research_publication_not_found(client):
    resp = await client.get("/api/v1/research-publications/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_research_publication(client, auth_headers):
    headers = await auth_headers("rpcreate", is_superuser=True)
    resp = await client.post("/api/v1/research-publications", json={
        "titulo": "Estudio de Biotecnologia en Cuba",
        "autores": "Perez, J.; Rodriguez, M.",
        "fecha_publicacion": "2026-03-01T00:00:00",
    }, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["titulo"] == "Estudio de Biotecnologia en Cuba"
