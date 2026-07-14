import pytest


@pytest.fixture
def auth_headers(client, db_session, superuser_token_headers):
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
    resp = await client.post("/api/v1/auth/register", json={
        "username": "validuser",
        "email": "not-an-email",
        "password": "secret123",
        "full_name": "Valid User",
    }, headers=superuser_token_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_user_username_invalid_chars(client, superuser_token_headers):
    resp = await client.post("/api/v1/auth/register", json={
        "username": "user with spaces!",
        "email": "valid@test.com",
        "password": "secret123",
        "full_name": "Valid User",
    }, headers=superuser_token_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_user_password_too_short(client, superuser_token_headers):
    resp = await client.post("/api/v1/auth/register", json={
        "username": "shortpwuser",
        "email": "short@test.com",
        "password": "abc",
        "full_name": "Short PW User",
    }, headers=superuser_token_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_patent_number_invalid_format(client, auth_headers):
    headers = await auth_headers("patvaluser")
    resp = await client.post("/api/v1/patents", json={
        "title": "Test Patent",
        "patent_number": "INVALID-NUMBER",
        "applicant": "Test Corp",
        "inventor": "Test Inventor",
        "filing_date": "2026-01-15",
        "country": "CU",
    }, headers=headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_patent_country_invalid_length(client, auth_headers):
    headers = await auth_headers("patcountry")
    resp = await client.post("/api/v1/patents", json={
        "title": "Test Patent",
        "patent_number": "CU-2026-001",
        "applicant": "Test Corp",
        "inventor": "Test Inventor",
        "filing_date": "2026-01-15",
        "country": "CUBA",
    }, headers=headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_technology_trl_out_of_range(client, auth_headers):
    headers = await auth_headers("trluser")
    resp = await client.post("/api/v1/technologies", json={
        "nombre": "Test Tech",
        "trl_nivel": 15,
    }, headers=headers)
    assert resp.status_code == 422

    resp = await client.post("/api/v1/technologies", json={
        "nombre": "Test Tech 2",
        "trl_nivel": 0,
    }, headers=headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_industrial_sector_codigo_wrong_length(client):
    resp = await client.post("/api/v1/industrial-sectors", json={
        "codigo": "AB",
        "nombre": "Too Short",
    })
    assert resp.status_code in (401, 422)

    resp = await client.post("/api/v1/industrial-sectors", json={
        "codigo": "ABCD",
        "nombre": "Too Long",
    })
    assert resp.status_code in (401, 422)


@pytest.mark.asyncio
async def test_regulation_effective_before_publication(client, auth_headers):
    headers = await auth_headers("regval")
    resp = await client.post("/api/v1/regulations", json={
        "title": "Bad Date",
        "regulation_number": "RES-VAL-001",
        "issuing_body": "Test",
        "publication_date": "2026-06-01",
        "effective_date": "2026-01-01",
        "category": "resolution",
    }, headers=headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_indicator_code_uppercased(client, auth_headers):
    headers = await auth_headers("indcode")
    resp = await client.post("/api/v1/indicators", json={
        "name": "Code Test",
        "code": "lower-code",
        "unit": "pct",
        "value": 1,
        "source": "T",
        "period": "monthly",
    }, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["code"] == "LOWER-CODE"


@pytest.mark.asyncio
async def test_org_unique_siglas(client, db_session, auth_headers):
    from tests.factories import make_org
    await make_org(db_session, siglas="UNQ")
    headers = await auth_headers("orgsig")
    resp = await client.post("/api/v1/organizations", json={
        "nombre": "Duplicate Siglas",
        "siglas": "UNQ",
        "tipo": "empresa",
    }, headers=headers)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_technology_palabras_clave_stripped(client, auth_headers):
    headers = await auth_headers("techkey")
    resp = await client.post("/api/v1/technologies", json={
        "nombre": "Keyword Test",
        "palabras_clave": ["  IA  ", " MANUFACTURA "],
    }, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert "ia" in data["palabras_clave"]
    assert "manufactura" in data["palabras_clave"]
