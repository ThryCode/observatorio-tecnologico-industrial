import pytest


@pytest.fixture
def patent_payload():
    return {
        "title": "Industrial Process Optimization",
        "patent_number": "CU-2025-0001",
        "applicant": "Ministry of Industries",
        "inventor": "Juan Pérez",
        "filing_date": "2025-06-15",
        "status": "filed",
        "abstract": "A method for optimizing industrial processes.",
        "technological_sector": "Manufacturing",
        "country": "CU",
    }


@pytest.mark.asyncio
async def test_create_patent(client, patent_payload, superuser_token_headers):
    await client.post("/api/v1/auth/register", json={
        "username": "patentuser", "email": "patent@example.com",
        "password": "secret123", "full_name": "Patent User",
    }, headers=superuser_token_headers)
    login = await client.post("/api/v1/auth/login", json={
        "username": "patentuser", "password": "secret123",
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post("/api/v1/patents", json=patent_payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["patent_number"] == "CU-2025-0001"
    assert data["title"] == "Industrial Process Optimization"


@pytest.mark.asyncio
async def test_list_patents(client, patent_payload):
    response = await client.get("/api/v1/patents")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_patent_not_found(client):
    response = await client.get("/api/v1/patents/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 404
