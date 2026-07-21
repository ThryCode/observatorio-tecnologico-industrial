import pytest
from sqlalchemy import update

from app.models.user import User


@pytest.fixture
def sector_payload():
    return {
        "codigo": "BIO",
        "nombre": "Biotecnología",
        "descripcion": "Sector biotecnológico industrial",
    }


@pytest.fixture
def superuser_headers(client, db_session, superuser_token_headers):
    async def _create_superuser(username: str = "superadmin"):
        await client.post("/api/v1/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "secret123",
            "full_name": "Super Admin",
        }, headers=superuser_token_headers)

        from sqlalchemy import update

        from app.models.user import User
        await db_session.execute(
            update(User).where(User.username == username).values(
                is_superuser=True,
                status="approved",
            )
        )
        await db_session.flush()

        login = await client.post("/api/v1/auth/login", json={
            "username": username,
            "password": "secret123",
        })
        token = login.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return _create_superuser


@pytest.fixture
def normal_headers(client, db_session, superuser_token_headers):
    async def _register(username: str = "normaluser"):
        await client.post("/api/v1/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "secret123",
            "full_name": "Normal User",
        }, headers=superuser_token_headers)
        await db_session.execute(
            update(User).where(User.username == username).values(status="approved")
        )
        await db_session.flush()
        login = await client.post("/api/v1/auth/login", json={
            "username": username,
            "password": "secret123",
        })
        token = login.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return _register


@pytest.mark.asyncio
async def test_create_sector(client, sector_payload, superuser_headers):
    headers = await superuser_headers()
    response = await client.post("/api/v1/industrial-sectors", json=sector_payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["codigo"] == "BIO"
    assert data["nombre"] == "Biotecnología"


@pytest.mark.asyncio
async def test_create_sector_no_auth(client, sector_payload):
    response = await client.post("/api/v1/industrial-sectors", json=sector_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_sector_not_superuser(client, sector_payload, normal_headers):
    headers = await normal_headers("normsec")
    response = await client.post("/api/v1/industrial-sectors", json=sector_payload, headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_sector_duplicate(client, sector_payload, superuser_headers):
    headers = await superuser_headers("dupsector")
    await client.post("/api/v1/industrial-sectors", json=sector_payload, headers=headers)
    response = await client.post("/api/v1/industrial-sectors", json=sector_payload, headers=headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_sector_invalid_codigo(client, superuser_headers):
    headers = await superuser_headers("invsector")
    payload = {"codigo": "AB", "nombre": "Too Short"}
    response = await client.post("/api/v1/industrial-sectors", json=payload, headers=headers)
    assert response.status_code == 422

    payload["codigo"] = "ABCD"
    response = await client.post("/api/v1/industrial-sectors", json=payload, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_sectors(client, sector_payload, superuser_headers):
    headers = await superuser_headers("listsec")
    await client.post("/api/v1/industrial-sectors", json=sector_payload, headers=headers)

    response = await client.get("/api/v1/industrial-sectors")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_sector(client, sector_payload, superuser_headers):
    headers = await superuser_headers("getsec")
    await client.post("/api/v1/industrial-sectors", json=sector_payload, headers=headers)

    response = await client.get("/api/v1/industrial-sectors/BIO")
    assert response.status_code == 200
    assert response.json()["codigo"] == "BIO"


@pytest.mark.asyncio
async def test_get_sector_not_found(client):
    response = await client.get("/api/v1/industrial-sectors/ZZZ")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_sector(client, sector_payload, superuser_headers):
    headers = await superuser_headers("updsec")
    await client.post("/api/v1/industrial-sectors", json=sector_payload, headers=headers)

    response = await client.put(
        "/api/v1/industrial-sectors/BIO",
        json={"nombre": "Biotecnología Avanzada"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["nombre"] == "Biotecnología Avanzada"


@pytest.mark.asyncio
async def test_delete_sector(client, sector_payload, superuser_headers):
    headers = await superuser_headers("delsec")
    await client.post("/api/v1/industrial-sectors", json=sector_payload, headers=headers)

    response = await client.delete("/api/v1/industrial-sectors/BIO", headers=headers)
    assert response.status_code == 200

    response = await client.get("/api/v1/industrial-sectors/BIO")
    assert response.status_code == 404
