import io

import pytest


@pytest.mark.asyncio
async def test_upload_file(client, auth_headers):
    headers = await auth_headers("upldusr", role="user")
    file_content = b"test file content"
    resp = await client.post("/api/v1/upload", files={
        "file": ("test.pdf", io.BytesIO(file_content), "application/pdf"),
    }, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "filename" in data


@pytest.mark.asyncio
async def test_upload_unauthorized(client):
    file_content = b"test file content"
    resp = await client.post("/api/v1/upload", files={
        "file": ("test.txt", io.BytesIO(file_content), "text/plain"),
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_file(client, auth_headers):
    headers = await auth_headers("fileget", role="user")
    upload = await client.post("/api/v1/upload", files={
        "file": ("test.pdf", io.BytesIO(b"test file content"), "application/pdf"),
    }, headers=headers)
    filename = upload.json()["filename"]
    resp = await client.get(f"/api/v1/files/{filename}", headers=headers)
    assert resp.status_code == 200
    assert resp.content == b"test file content"


@pytest.mark.asyncio
async def test_get_file_unauthorized(client):
    resp = await client.get("/api/v1/files/test.pdf")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_file_not_found(client, auth_headers):
    headers = await auth_headers("filenotfound", role="user")
    resp = await client.get("/api/v1/files/nonexistent-file.pdf", headers=headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_file_path_traversal(client, auth_headers):
    headers = await auth_headers("filetraversal", role="user")
    resp = await client.get("/api/v1/files/../etc/passwd", headers=headers)
    assert resp.status_code in [403, 404], f"Expected 403 or 404, got {resp.status_code}"
