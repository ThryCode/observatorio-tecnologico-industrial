import pytest


@pytest.mark.asyncio
async def test_register_public(client):
    resp = await client.post("/api/v1/auth/register/public", json={
        "account_type": "profesional",
        "username": "nuevousuario",
        "email": "nuevo@test.com",
        "password": "password123",
        "full_name": "Nuevo Usuario",
        "job_title": "Analista",
    })
    assert resp.status_code == 201
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_register_public_duplicate_username(client):
    await client.post("/api/v1/auth/register/public", json={
        "account_type": "profesional",
        "username": "dupuser",
        "email": "dup1@test.com",
        "password": "password123",
        "full_name": "Dup User",
        "job_title": "Analista",
    })
    resp = await client.post("/api/v1/auth/register/public", json={
        "account_type": "profesional",
        "username": "dupuser",
        "email": "dup2@test.com",
        "password": "password123",
        "full_name": "Dup User 2",
        "job_title": "Analista",
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_public_invalid_account_type(client):
    resp = await client.post("/api/v1/auth/register/public", json={
        "account_type": "invalido",
        "username": "baduser",
        "email": "bad@test.com",
        "password": "password123",
        "full_name": "Bad User",
        "job_title": "Analista",
    })
    assert resp.status_code == 422
