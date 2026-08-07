import pytest


@pytest.fixture
def tech_payload():
    return {
        "nombre": "Inteligencia Artificial Industrial",
        "descripcion": "Aplicación de IA en procesos industriales",
        "trl_nivel": 5,
        "palabras_clave": ["ia", "manufactura", "optimización"],
    }


@pytest.mark.asyncio
async def test_create_technology(client, tech_payload, auth_headers):
    headers = await auth_headers(role="admin_mindus")
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
    headers = await auth_headers("trluser", role="admin_mindus")
    payload = {"nombre": "Test Tech", "trl_nivel": 10}
    response = await client.post("/api/v1/technologies", json=payload, headers=headers)
    assert response.status_code == 422

    payload["trl_nivel"] = 0
    response = await client.post("/api/v1/technologies", json=payload, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_technology_invalid_sector_codigo(client, auth_headers):
    headers = await auth_headers("sectoruser", role="admin_mindus")
    payload = {"nombre": "Test Tech", "sector_codigo": "AB"}
    response = await client.post("/api/v1/technologies", json=payload, headers=headers)
    assert response.status_code == 422

    payload["sector_codigo"] = "ABCD"
    response = await client.post("/api/v1/technologies", json=payload, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_technologies(client, tech_payload, auth_headers):
    headers = await auth_headers(role="admin_mindus")
    await client.post("/api/v1/technologies", json=tech_payload, headers=headers)

    response = await client.get("/api/v1/technologies")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_technologies_filter_sector(client, tech_payload, auth_headers):
    headers = await auth_headers("filteruser", role="admin_mindus")
    await client.post("/api/v1/technologies", json=tech_payload, headers=headers)

    response = await client.get("/api/v1/technologies?sector_codigo=BIO")
    assert response.status_code == 200
    assert response.json()["total"] == 0

    response = await client.get("/api/v1/technologies")
    assert response.status_code == 200
    assert response.json()["total"] >= 1


@pytest.mark.asyncio
async def test_get_technology(client, tech_payload, auth_headers):
    headers = await auth_headers("getuser", role="admin_mindus")
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
    headers = await auth_headers("upduser", role="admin_mindus")
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
    headers = await auth_headers("updnotfound", role="admin_mindus")
    response = await client.put(
        "/api/v1/technologies/00000000-0000-0000-0000-000000000001",
        json={"nombre": "No exist"},
        headers=headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_technology(client, tech_payload, db_session):
    from app.core.security import get_password_hash
    from app.models.user import User
    user = User(
        username="rbac_admin",
        email="rbac_admin@test.com",
        hashed_password=get_password_hash("secret123"),
        full_name="RBAC Admin",
        role="admin_mindus",
        is_superuser=True,
        status="approved",
    )
    db_session.add(user)
    await db_session.flush()
    login_resp = await client.post("/api/v1/auth/login", json={"username": "rbac_admin", "password": "secret123"})
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post("/api/v1/technologies", json=tech_payload, headers=headers)
    assert create_resp.status_code == 201, f"POST failed: {create_resp.status_code} {create_resp.text}"
    tech_id = create_resp.json()["id"]

    response = await client.delete(f"/api/v1/technologies/{tech_id}", headers=headers)
    assert response.status_code == 200

    response = await client.get(f"/api/v1/technologies/{tech_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_technology_not_superuser(client, tech_payload, db_session):
    from app.core.security import get_password_hash
    from app.models.user import User
    admin = User(
        username="rbac_admin2",
        email="rbac_admin2@test.com",
        hashed_password=get_password_hash("secret123"),
        full_name="RBAC Admin 2",
        role="admin_mindus",
        is_superuser=True,
        status="approved",
    )
    db_session.add(admin)
    await db_session.flush()
    login_resp = await client.post("/api/v1/auth/login", json={"username": "rbac_admin2", "password": "secret123"})
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    admin_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    create_resp = await client.post("/api/v1/technologies", json=tech_payload, headers=admin_headers)
    assert create_resp.status_code == 201, f"POST failed: {create_resp.status_code} {create_resp.text}"
    tech_id = create_resp.json()["id"]

    user = User(
        username="rbac_user",
        email="rbac_user@test.com",
        hashed_password=get_password_hash("secret123"),
        full_name="RBAC User",
        role="user",
        status="approved",
    )
    db_session.add(user)
    await db_session.flush()
    login_resp2 = await client.post("/api/v1/auth/login", json={"username": "rbac_user", "password": "secret123"})
    headers = {"Authorization": f"Bearer {login_resp2.json()['access_token']}"}
    response = await client.delete(f"/api/v1/technologies/{tech_id}", headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_technologies_pagination(client, db_session, auth_headers):
    headers = await auth_headers("techpage", role="admin_mindus")
    for i in range(12):
        await client.post("/api/v1/technologies", json={"nombre": f"Tech {i}", "trl_nivel": 3}, headers=headers)
    await db_session.flush()

    resp = await client.get("/api/v1/technologies?page=1&per_page=5", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 5
    assert data["total"] == 12
    assert data["total_pages"] == 3
