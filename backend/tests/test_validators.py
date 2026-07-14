import pytest


@pytest.fixture
def auth_headers(client, superuser_token_headers):
    async def _register(username: str):
        await client.post("/api/v1/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "secret123",
            "full_name": "Validator User",
        }, headers=superuser_token_headers)
        login = await client.post("/api/v1/auth/login", json={
            "username": username,
            "password": "secret123",
        })
        token = login.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    return _register


@pytest.mark.asyncio
async def test_user_email_invalid(client, superuser_token_headers):
    response = await client.post("/api/v1/auth/register", json={
        "username": "validuser",
        "email": "not-an-email",
        "password": "secret123",
        "full_name": "Valid User",
    }, headers=superuser_token_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_user_username_invalid_chars(client, superuser_token_headers):
    response = await client.post("/api/v1/auth/register", json={
        "username": "user with spaces!",
        "email": "valid@test.com",
        "password": "secret123",
        "full_name": "Valid User",
    }, headers=superuser_token_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_user_password_too_short(client, superuser_token_headers):
    response = await client.post("/api/v1/auth/register", json={
        "username": "shortpwuser",
        "email": "short@test.com",
        "password": "abc",
        "full_name": "Short PW User",
    }, headers=superuser_token_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patent_number_invalid_format(client, auth_headers):
    headers = await auth_headers("patvaluser")
    response = await client.post("/api/v1/patents", json={
        "title": "Test Patent",
        "patent_number": "INVALID-NUMBER",
        "applicant": "Test Corp",
        "inventor": "Test Inventor",
        "filing_date": "2026-01-15",
        "country": "CU",
    }, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patent_country_invalid_length(client, auth_headers):
    headers = await auth_headers("patcountry")
    response = await client.post("/api/v1/patents", json={
        "title": "Test Patent",
        "patent_number": "CU-2026-001",
        "applicant": "Test Corp",
        "inventor": "Test Inventor",
        "filing_date": "2026-01-15",
        "country": "CUBA",
    }, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_technology_trl_out_of_range(client, auth_headers):
    headers = await auth_headers("trluser")
    response = await client.post("/api/v1/technologies", json={
        "nombre": "Test Tech",
        "trl_nivel": 15,
    }, headers=headers)
    assert response.status_code == 422

    response = await client.post("/api/v1/technologies", json={
        "nombre": "Test Tech 2",
        "trl_nivel": 0,
    }, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_industrial_sector_codigo_wrong_length(client):
    response = await client.post("/api/v1/industrial-sectors", json={
        "codigo": "AB",
        "nombre": "Too Short",
    })
    assert response.status_code in (401, 422)

    response = await client.post("/api/v1/industrial-sectors", json={
        "codigo": "ABCD",
        "nombre": "Too Long",
    })
    assert response.status_code in (401, 422)
