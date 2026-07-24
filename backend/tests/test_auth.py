import pytest
from httpx import AsyncClient
from sqlalchemy import update

from app.dependencies import get_current_user
from app.main import app
from app.models.user import User


@pytest.mark.asyncio
async def test_register(client, superuser_token_headers):
    payload = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "secret123",
        "full_name": "Test User",
    }
    response = await client.post("/api/v1/auth/register", json=payload, headers=superuser_token_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "password" not in data


@pytest.mark.asyncio
async def test_register_duplicate(client, superuser_token_headers):
    payload = {
        "username": "dupuser",
        "email": "dup@example.com",
        "password": "secret123",
        "full_name": "Dup User",
    }
    await client.post("/api/v1/auth/register", json=payload, headers=superuser_token_headers)
    response = await client.post("/api/v1/auth/register", json=payload, headers=superuser_token_headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_not_superuser(client):
    """Normal users (no auth) should get 401 when calling register."""
    payload = {
        "username": "nosuperuser",
        "email": "nosuper@test.com",
        "password": "secret123",
        "full_name": "No Super",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login(client, superuser_token_headers, db_session):
    await client.post("/api/v1/auth/register", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "secret123",
        "full_name": "Login User",
    }, headers=superuser_token_headers)
    await db_session.execute(
        update(User).where(User.username == "loginuser").values(status="approved")
    )
    await db_session.flush()
    response = await client.post("/api/v1/auth/login", json={
        "username": "loginuser",
        "password": "secret123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid(client):
    response = await client.post("/api/v1/auth/login", json={
        "username": "nobody",
        "password": "wrong",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me(client, superuser_token_headers, db_session):
    await client.post("/api/v1/auth/register", json={
        "username": "meuser",
        "email": "me@example.com",
        "password": "secret123",
        "full_name": "Me User",
    }, headers=superuser_token_headers)
    await db_session.execute(
        update(User).where(User.username == "meuser").values(status="approved")
    )
    await db_session.flush()
    login_resp = await client.post("/api/v1/auth/login", json={
        "username": "meuser",
        "password": "secret123",
    })
    token = login_resp.json()["access_token"]
    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["username"] == "meuser"


@pytest.mark.asyncio
async def test_register_invalid_email(client, superuser_token_headers):
    response = await client.post("/api/v1/auth/register", json={
        "username": "emailuser",
        "email": "not-valid-email",
        "password": "secret123",
        "full_name": "Email User",
    }, headers=superuser_token_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_short_password(client, superuser_token_headers):
    response = await client.post("/api/v1/auth/register", json={
        "username": "shortpw",
        "email": "shortpw@test.com",
        "password": "abc",
        "full_name": "Short PW",
    }, headers=superuser_token_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_approve_user(client: AsyncClient, db_session):
    from tests.factories import make_user

    pending_user = await make_user(db_session, username="pending1", status="pending")
    admin = await make_user(db_session, username="admin1", is_superuser=True)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: admin
    response = await client.post(f"/api/v1/auth/{pending_user.id}/approve")
    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    assert response.json()["status"] == "approved"


@pytest.mark.asyncio
async def test_reject_user(client: AsyncClient, db_session):
    from tests.factories import make_user

    pending_user = await make_user(db_session, username="pending2", status="pending")
    admin = await make_user(db_session, username="admin2", is_superuser=True)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: admin
    response = await client.post(
        f"/api/v1/auth/{pending_user.id}/reject",
        json={"reason": "Documentacion incompleta"},
    )
    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "rejected"
    assert data["rejection_reason"] == "Documentacion incompleta"


@pytest.mark.asyncio
async def test_list_pending(client: AsyncClient, db_session):
    from tests.factories import make_user

    await make_user(db_session, username="pend_a", status="pending")
    await make_user(db_session, username="pend_b", status="pending")
    admin = await make_user(db_session, username="admin3", is_superuser=True)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: admin
    response = await client.get("/api/v1/auth/pending")
    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
