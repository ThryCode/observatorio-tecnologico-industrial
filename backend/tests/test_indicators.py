import pytest


@pytest.mark.asyncio
async def test_create_indicator(client):
    await client.post("/api/v1/auth/register", json={
        "username": "induser", "email": "ind@example.com",
        "password": "secret123", "full_name": "Ind User",
    })
    login = await client.post("/api/v1/auth/login", json={
        "username": "induser", "password": "secret123",
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "Industrial Production Index",
        "code": "IPI-2025",
        "description": "Monthly industrial production index",
        "unit": "percentage",
        "value": 102.5,
        "source": "ONEI",
        "period": "monthly",
    }
    response = await client.post("/api/v1/indicators", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["code"] == "IPI-2025"
    assert float(data["value"]) == 102.5


@pytest.mark.asyncio
async def test_list_indicators(client):
    response = await client.get("/api/v1/indicators")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
