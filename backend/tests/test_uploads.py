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
