
import pytest


@pytest.fixture
def bulletin_payload():
    return {
        "titulo": "Boletin Tecnologico Q1 2026",
        "resumen": "Resumen del primer trimestre",
        "fecha_publicacion": "2026-01-15T00:00:00",
        "categoria": "informe",
        "autor": "MINDUS",
    }


@pytest.mark.asyncio
async def test_list_bulletins(client):
    resp = await client.get("/api/v1/bulletins")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_bulletin(client, bulletin_payload, auth_headers):
    headers = await auth_headers("bulcreate", role="admin_mindus")
    resp = await client.post("/api/v1/bulletins", json=bulletin_payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["titulo"] == bulletin_payload["titulo"]
    assert data["categoria"] == "informe"


@pytest.mark.asyncio
async def test_create_bulletin_no_auth(client, bulletin_payload):
    resp = await client.post("/api/v1/bulletins", json=bulletin_payload)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_bulletin(client, db_session, auth_headers):
    headers = await auth_headers("bulget", role="admin_mindus")
    create = await client.post("/api/v1/bulletins", json={
        "titulo": "Boletin Test", "categoria": "informe",
        "fecha_publicacion": "2026-01-15T00:00:00",
    }, headers=headers)
    bid = create.json()["id"]
    resp = await client.get(f"/api/v1/bulletins/{bid}")
    assert resp.status_code == 200
    assert resp.json()["id"] == bid


@pytest.mark.asyncio
async def test_get_bulletin_not_found(client):
    resp = await client.get("/api/v1/bulletins/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_bulletin(client, bulletin_payload, auth_headers):
    headers = await auth_headers("bulupd", role="admin_mindus")
    create = await client.post("/api/v1/bulletins", json=bulletin_payload, headers=headers)
    bid = create.json()["id"]
    resp = await client.put(f"/api/v1/bulletins/{bid}", json={"titulo": "Updated Title"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["titulo"] == "Updated Title"


@pytest.mark.asyncio
async def test_delete_bulletin(client, bulletin_payload, auth_headers):
    headers = await auth_headers("buldel", is_superuser=True)
    create = await client.post("/api/v1/bulletins", json=bulletin_payload, headers=headers)
    bid = create.json()["id"]
    resp = await client.delete(f"/api/v1/bulletins/{bid}", headers=headers)
    assert resp.status_code == 200
    resp = await client.get(f"/api/v1/bulletins/{bid}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_bulletin_unauthorized(client, bulletin_payload, auth_headers):
    create_headers = await auth_headers("buldel2create", role="admin_mindus")
    delete_headers = await auth_headers("buldel2", role="user")
    create = await client.post("/api/v1/bulletins", json=bulletin_payload, headers=create_headers)
    bid = create.json()["id"]
    resp = await client.delete(f"/api/v1/bulletins/{bid}", headers=delete_headers)
    assert resp.status_code == 403
