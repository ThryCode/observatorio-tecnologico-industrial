import pytest


@pytest.mark.asyncio
async def test_list_audit_logs_superuser(client, superuser_token_headers):
    resp = await client.get("/api/v1/audit-logs", headers=superuser_token_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_list_audit_logs_unauthorized(client, auth_headers):
    headers = await auth_headers("auditusr", role="user")
    resp = await client.get("/api/v1/audit-logs", headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_audit_logs_no_auth(client):
    resp = await client.get("/api/v1/audit-logs")
    assert resp.status_code == 401
