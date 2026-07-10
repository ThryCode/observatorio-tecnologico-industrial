import pytest


@pytest.fixture
def tech_payload():
    return {
        "nombre": "Inteligencia Artificial Industrial",
        "descripcion": "Aplicación de IA en procesos industriales",
        "trl_nivel": 5,
        "palabras_clave": ["ia", "manufactura", "optimización"],
    }


@pytest.fixture
def auth_headers(client, db_session):
    async def _register_and_login(username: str = "techuser", is_superuser: bool = False):
        await client.post("/api/v1/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "secret123",
            "full_name": "Tech User",
        })
        if is_superuser:
            from sqlalchemy import update
            from app.models.user import User
            await db_session.execute(
                update(User).where(User.username == username).values(is_superuser=True)
            )
            await db_session.flush()
        login = await client.post("/api/v1/auth/login", json={
            "username": username,
            "password": "secret123",
        })
        token = login.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return _register_and_login


@pytest.mark.asyncio
async def test_create_technology(client, tech_payload, auth_headers):
    headers = await auth_headers()
    response = await client.post("/api/v1/technologies", json=tech_payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == "Inteligencia Artificial Industrial"
    assert data["trl_nivel"] == 5
    assert "id" in data


@pytest.mark.asyncio
async def test_create_technology_no_auth(client, tech_payload):
    response = await client.post("/api/v1/technologies", json=tech_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_technology_invalid_trl(client, auth_headers):
    headers = await auth_headers("trluser")
    payload = {"nombre": "Test Tech", "trl_nivel": 10}
    response = await client.post("/api/v1/technologies", json=payload, headers=headers)
    assert response.status_code == 422

    payload["trl_nivel"] = 0
    response = await client.post("/api/v1/technologies", json=payload, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_technology_invalid_sector_codigo(client, auth_headers):
    headers = await auth_headers("sectoruser")
    payload = {"nombre": "Test Tech", "sector_codigo": "AB"}
    response = await client.post("/api/v1/technologies", json=payload, headers=headers)
    assert response.status_code == 422

    payload["sector_codigo"] = "ABCD"
    response = await client.post("/api/v1/technologies", json=payload, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_technologies(client, tech_payload, auth_headers):
    headers = await auth_headers()
    await client.post("/api/v1/technologies", json=tech_payload, headers=headers)

    response = await client.get("/api/v1/technologies")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_technologies_filter_sector(client, tech_payload, auth_headers):
    headers = await auth_headers("filteruser")
    await client.post("/api/v1/technologies", json=tech_payload, headers=headers)

    response = await client.get("/api/v1/technologies?sector_codigo=BIO")
    assert response.status_code == 200
    assert response.json()["total"] == 0

    response = await client.get("/api/v1/technologies")
    assert response.status_code == 200
    assert response.json()["total"] >= 1


@pytest.mark.asyncio
async def test_get_technology(client, tech_payload, auth_headers):
    headers = await auth_headers("getuser")
    create_resp = await client.post("/api/v1/technologies", json=tech_payload, headers=headers)
    tech_id = create_resp.json()["id"]

    response = await client.get(f"/api/v1/technologies/{tech_id}")
    assert response.status_code == 200
    assert response.json()["id"] == tech_id


@pytest.mark.asyncio
async def test_get_technology_not_found(client):
    response = await client.get("/api/v1/technologies/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_technology(client, tech_payload, auth_headers):
    headers = await auth_headers("upduser")
    create_resp = await client.post("/api/v1/technologies", json=tech_payload, headers=headers)
    tech_id = create_resp.json()["id"]

    update_data = {"nombre": "IA Industrial v2", "trl_nivel": 7}
    response = await client.put(f"/api/v1/technologies/{tech_id}", json=update_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "IA Industrial v2"
    assert data["trl_nivel"] == 7


@pytest.mark.asyncio
async def test_update_technology_not_found(client, auth_headers):
    headers = await auth_headers("updnotfound")
    response = await client.put(
        "/api/v1/technologies/00000000-0000-0000-0000-000000000001",
        json={"nombre": "No exist"},
        headers=headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_technology(client, tech_payload, auth_headers):
    headers = await auth_headers("deluser", is_superuser=True)
    create_resp = await client.post("/api/v1/technologies", json=tech_payload, headers=headers)
    tech_id = create_resp.json()["id"]

    response = await client.delete(f"/api/v1/technologies/{tech_id}", headers=headers)
    assert response.status_code == 200

    response = await client.get(f"/api/v1/technologies/{tech_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_technology_not_superuser(client, tech_payload, auth_headers):
    headers = await auth_headers("normuser")
    create_resp = await client.post("/api/v1/technologies", json=tech_payload, headers=headers)
    tech_id = create_resp.json()["id"]

    response = await client.delete(f"/api/v1/technologies/{tech_id}", headers=headers)
    assert response.status_code == 403
