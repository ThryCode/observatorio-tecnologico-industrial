import pytest


@pytest.mark.asyncio
async def test_dashboard_summary(client, auth_headers):
    headers = await auth_headers("dasum", role="user")
    resp = await client.get("/api/v1/dashboard/summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "kpis" in data
    assert isinstance(data["kpis"], list)


@pytest.mark.asyncio
async def test_dashboard_summary_unauthorized(client):
    resp = await client.get("/api/v1/dashboard/summary")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_dashboard_sectors(client, auth_headers):
    headers = await auth_headers("dasec", role="user")
    resp = await client.get("/api/v1/dashboard/sectors", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_dashboard_sectors_unauthorized(client):
    resp = await client.get("/api/v1/dashboard/sectors")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_dashboard_timeline(client, auth_headers):
    headers = await auth_headers("datim", role="user")
    resp = await client.get("/api/v1/dashboard/timeline", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_dashboard_timeline_with_limit(client, auth_headers):
    headers = await auth_headers("datim2", role="user")
    resp = await client.get("/api/v1/dashboard/timeline?limit=5", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_dashboard_timeline_unauthorized(client):
    resp = await client.get("/api/v1/dashboard/timeline")
    assert resp.status_code == 401
