import pytest


@pytest.fixture
def alert_payload():
    return {
        "titulo": "Test Alert",
        "descripcion": "Test description",
        "severidad": "alta",
    }


@pytest.mark.asyncio
async def test_create_alert(client, alert_payload, superuser_token_headers):
    response = await client.post("/api/v1/alerts", json=alert_payload, headers=superuser_token_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["titulo"] == "Test Alert"
    assert data["severidad"] == "alta"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_alerts(client, alert_payload, superuser_token_headers):
    await client.post("/api/v1/alerts", json=alert_payload, headers=superuser_token_headers)

    response = await client.get("/api/v1/alerts", headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_alerts_filter_unread(client, alert_payload, superuser_token_headers):
    await client.post("/api/v1/alerts", json=alert_payload, headers=superuser_token_headers)

    response = await client.get("/api/v1/alerts?unread_only=true", headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1

    response = await client.get("/api/v1/alerts?unread_only=false", headers=superuser_token_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_alert(client, alert_payload, superuser_token_headers):
    create_resp = await client.post("/api/v1/alerts", json=alert_payload, headers=superuser_token_headers)
    alert_id = create_resp.json()["id"]

    response = await client.get(f"/api/v1/alerts/{alert_id}", headers=superuser_token_headers)
    assert response.status_code == 200
    assert response.json()["id"] == alert_id


@pytest.mark.asyncio
async def test_mark_alert_read(client, alert_payload, superuser_token_headers):
    create_resp = await client.post("/api/v1/alerts", json=alert_payload, headers=superuser_token_headers)
    alert_id = create_resp.json()["id"]

    response = await client.patch(f"/api/v1/alerts/{alert_id}/read", headers=superuser_token_headers)
    assert response.status_code == 200
    assert response.json()["leida"] is True


@pytest.mark.asyncio
async def test_delete_alert(client, alert_payload, superuser_token_headers):
    create_resp = await client.post("/api/v1/alerts", json=alert_payload, headers=superuser_token_headers)
    alert_id = create_resp.json()["id"]

    response = await client.delete(f"/api/v1/alerts/{alert_id}", headers=superuser_token_headers)
    assert response.status_code == 200

    response = await client.get(f"/api/v1/alerts/{alert_id}", headers=superuser_token_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_alert_not_found(client, superuser_token_headers):
    response = await client.get("/api/v1/alerts/00000000-0000-0000-0000-000000000001", headers=superuser_token_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_alert_unauthorized(client, alert_payload):
    response = await client.post("/api/v1/alerts", json=alert_payload)
    assert response.status_code == 401
