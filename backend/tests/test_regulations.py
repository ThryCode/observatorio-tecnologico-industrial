import pytest


@pytest.mark.asyncio
async def test_create_regulation(client):
    await client.post("/api/v1/auth/register", json={
        "username": "reguser", "email": "reg@example.com",
        "password": "secret123", "full_name": "Reg User",
    })
    login = await client.post("/api/v1/auth/login", json={
        "username": "reguser", "password": "secret123",
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "Industrial Safety Regulation",
        "regulation_number": "RES-2025-001",
        "issuing_body": "Ministry of Industries",
        "publication_date": "2025-01-15",
        "category": "resolution",
        "summary": "Safety standards for industrial facilities.",
    }
    response = await client.post("/api/v1/regulations", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["regulation_number"] == "RES-2025-001"
    assert data["category"] == "resolution"


@pytest.mark.asyncio
async def test_list_regulations(client):
    response = await client.get("/api/v1/regulations")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
