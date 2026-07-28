import pytest
from sqlalchemy import update

from app.models.user import User


@pytest.fixture
async def test_organization(db_session):
    from app.models.organization import Organization

    org = Organization(nombre="Test Org", siglas="TO", tipo="empresa")
    db_session.add(org)
    await db_session.flush()
    return org


@pytest.fixture
async def test_organization_two(db_session):
    from app.models.organization import Organization

    org = Organization(nombre="Test Org Two", siglas="TO2", tipo="empresa")
    db_session.add(org)
    await db_session.flush()
    return org


@pytest.fixture
def auth_headers(client, db_session, superuser_token_headers):
    async def _register_and_login(username: str = "followuser"):
        await client.post("/api/v1/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "secret123",
            "full_name": "Follow User",
        }, headers=superuser_token_headers)
        await db_session.execute(
            update(User).where(User.username == username).values(
                is_superuser=False,
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
    return _register_and_login


@pytest.mark.asyncio
async def test_follow_organization(client, auth_headers, test_organization):
    headers = await auth_headers("followuser1")
    org_id = str(test_organization.id)

    response = await client.post(f"/api/v1/follows/{org_id}", headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["organization_id"] == org_id
    assert "id" in data


@pytest.mark.asyncio
async def test_unfollow_organization(client, auth_headers, test_organization):
    headers = await auth_headers("unfollowuser")
    org_id = str(test_organization.id)

    await client.post(f"/api/v1/follows/{org_id}", headers=headers)

    response = await client.delete(f"/api/v1/follows/{org_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["detail"] == "Unfollowed successfully"


@pytest.mark.asyncio
async def test_follow_duplicate(client, auth_headers, test_organization):
    headers = await auth_headers("dupuser")
    org_id = str(test_organization.id)

    response = await client.post(f"/api/v1/follows/{org_id}", headers=headers)
    assert response.status_code == 201

    response = await client.post(f"/api/v1/follows/{org_id}", headers=headers)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_follow_nonexistent(client, auth_headers):
    headers = await auth_headers("nonexistuser")

    response = await client.post(
        "/api/v1/follows/00000000-0000-0000-0000-000000000001",
        headers=headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_follow_own_organization(client, db_session, superuser_token_headers):
    from app.models.organization import Organization

    org = Organization(nombre="Own Org", siglas="OO", tipo="empresa")
    db_session.add(org)
    await db_session.flush()

    # Register a user and assign them to this org
    await client.post("/api/v1/auth/register", json={
        "username": "ownorguser",
        "email": "ownorguser@test.com",
        "password": "secret123",
        "full_name": "Own Org User",
    }, headers=superuser_token_headers)
    await db_session.execute(
        update(User).where(User.username == "ownorguser").values(
            is_superuser=False,
            status="approved",
            organization_id=org.id,
        )
    )
    await db_session.flush()

    login = await client.post("/api/v1/auth/login", json={
        "username": "ownorguser",
        "password": "secret123",
    })
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    org_id = str(org.id)
    response = await client.post(f"/api/v1/follows/{org_id}", headers=headers)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_follow_status(client, auth_headers, test_organization):
    headers = await auth_headers("statususer")
    org_id = str(test_organization.id)

    response = await client.get(f"/api/v1/follows/{org_id}/status", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "followers_count" in data
    assert "following_count" in data
    assert "is_following" in data
    assert data["is_following"] is False

    await client.post(f"/api/v1/follows/{org_id}", headers=headers)

    response = await client.get(f"/api/v1/follows/{org_id}/status", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["followers_count"] == 1
    assert data["is_following"] is True
