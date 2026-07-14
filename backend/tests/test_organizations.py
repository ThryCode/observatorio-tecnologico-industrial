import pytest

from tests.factories import make_org


@pytest.mark.asyncio
async def test_create_org(client, auth_headers):
    headers = await auth_headers("orgcreate")
    payload = {"nombre": "Test Organization", "siglas": "TO", "tipo": "empresa"}
    resp = await client.post("/api/v1/organizations", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["nombre"] == "Test Organization"
    assert data["siglas"] == "TO"


@pytest.mark.asyncio
async def test_create_org_no_auth(client):
    resp = await client.post("/api/v1/organizations", json={"nombre": "No Auth", "siglas": "NA", "tipo": "empresa"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_org_duplicate_siglas(client, auth_headers):
    headers = await auth_headers("orgdup")
    payload = {"nombre": "Org One", "siglas": "O1", "tipo": "empresa"}
    await client.post("/api/v1/organizations", json=payload, headers=headers)
    payload["nombre"] = "Org Two"
    resp = await client.post("/api/v1/organizations", json=payload, headers=headers)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_list_orgs(client, db_session):
    await make_org(db_session, nombre="Org A", siglas="OA")
    await make_org(db_session, nombre="Org B", siglas="OB")
    resp = await client.get("/api/v1/organizations")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_get_org(client, db_session):
    org = await make_org(db_session)
    resp = await client.get(f"/api/v1/organizations/{org.id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == str(org.id)


@pytest.mark.asyncio
async def test_get_org_not_found(client):
    resp = await client.get("/api/v1/organizations/00000000-0000-0000-0000-000000000001")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_org(client, db_session, auth_headers):
    org = await make_org(db_session, siglas="UPORG")
    headers = await auth_headers("orgupd")
    resp = await client.put(f"/api/v1/organizations/{org.id}", json={"nombre": "Updated"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["nombre"] == "Updated"


@pytest.mark.asyncio
async def test_delete_org(client, db_session, auth_headers):
    org = await make_org(db_session, siglas="DELORG")
    headers = await auth_headers("orgdel", is_superuser=True)
    resp = await client.delete(f"/api/v1/organizations/{org.id}", headers=headers)
    assert resp.status_code == 200
    resp = await client.get(f"/api/v1/organizations/{org.id}")
    assert resp.status_code == 404
