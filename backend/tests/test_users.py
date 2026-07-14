import pytest


@pytest.mark.asyncio
async def test_list_users(client, superuser_token_headers):
    # superuser from fixture is one user
    resp = await client.get("/api/v1/users", headers=superuser_token_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_users_no_auth(client):
    resp = await client.get("/api/v1/users")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_users_not_superuser(client, auth_headers):
    headers = await auth_headers("regularuser")
    resp = await client.get("/api/v1/users", headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_user(client, db_session, superuser_token_headers):
    resp = await client.get("/api/v1/users", headers=superuser_token_headers)
    user_id = resp.json()["items"][0]["id"]
    resp = await client.get(f"/api/v1/users/{user_id}", headers=superuser_token_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == user_id


@pytest.mark.asyncio
async def test_get_user_not_found(client, superuser_token_headers):
    resp = await client.get("/api/v1/users/00000000-0000-0000-0000-000000000001", headers=superuser_token_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_user(client, auth_headers, superuser_token_headers):
    headers = await auth_headers("updtarget")
    me = await client.get("/api/v1/auth/me", headers=headers)
    user_id = me.json()["id"]

    resp = await client.patch(
        f"/api/v1/users/{user_id}",
        json={"full_name": "Updated Name"},
        headers=superuser_token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_user(client, auth_headers, superuser_token_headers):
    headers = await auth_headers("deletarget")
    me = await client.get("/api/v1/auth/me", headers=headers)
    user_id = me.json()["id"]

    resp = await client.delete(f"/api/v1/users/{user_id}", headers=superuser_token_headers)
    assert resp.status_code == 200

    resp = await client.get(f"/api/v1/users/{user_id}", headers=superuser_token_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_user_not_superuser(client, auth_headers):
    headers = await auth_headers("delnorm")
    me = await client.get("/api/v1/auth/me", headers=headers)
    user_id = me.json()["id"]
    resp = await client.delete(f"/api/v1/users/{user_id}", headers=headers)
    assert resp.status_code == 403
