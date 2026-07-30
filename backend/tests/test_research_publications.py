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


@pytest.mark.asyncio
async def test_get_research_publication(client, auth_headers):
    headers = await auth_headers("rpget", is_superuser=True)
    create = await client.post("/api/v1/research-publications", json={
        "titulo": "Estudio de Biotecnologia en Cuba",
        "autores": "Perez, J.; Rodriguez, M.",
        "fecha_publicacion": "2026-03-01T00:00:00",
    }, headers=headers)
    eid = create.json()["id"]
    resp = await client.get(f"/api/v1/research-publications/{eid}")
    assert resp.status_code == 200
    assert resp.json()["id"] == eid


@pytest.mark.asyncio
async def test_create_research_publication_no_auth(client):
    resp = await client.post("/api/v1/research-publications", json={
        "titulo": "Test Publication",
        "autores": "Test Author",
        "fecha_publicacion": "2026-03-01T00:00:00",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_research_publication_forbidden(client, auth_headers):
    headers = await auth_headers("rpforbid", role="user")
    resp = await client.post("/api/v1/research-publications", json={
        "titulo": "Test Publication",
        "autores": "Test Author",
        "fecha_publicacion": "2026-03-01T00:00:00",
    }, headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_update_research_publication(client, auth_headers):
    headers = await auth_headers("rpupdate", is_superuser=True)
    create = await client.post("/api/v1/research-publications", json={
        "titulo": "Estudio de Biotecnologia en Cuba",
        "autores": "Perez, J.; Rodriguez, M.",
        "fecha_publicacion": "2026-03-01T00:00:00",
    }, headers=headers)
    eid = create.json()["id"]
    resp = await client.put(f"/api/v1/research-publications/{eid}", json={"titulo": "Updated Title"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["titulo"] == "Updated Title"


@pytest.mark.asyncio
async def test_delete_research_publication(client, auth_headers):
    headers = await auth_headers("rpdelete", is_superuser=True)
    create = await client.post("/api/v1/research-publications", json={
        "titulo": "Estudio de Biotecnologia en Cuba",
        "autores": "Perez, J.; Rodriguez, M.",
        "fecha_publicacion": "2026-03-01T00:00:00",
    }, headers=headers)
    eid = create.json()["id"]
    resp = await client.delete(f"/api/v1/research-publications/{eid}", headers=headers)
    assert resp.status_code == 200
    resp = await client.get(f"/api/v1/research-publications/{eid}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_research_publication_unauthorized(client, auth_headers):
    headers = await auth_headers("rpdeluser", role="user")
    resp = await client.delete("/api/v1/research-publications/00000000-0000-0000-0000-000000000001", headers=headers)
    assert resp.status_code == 403
