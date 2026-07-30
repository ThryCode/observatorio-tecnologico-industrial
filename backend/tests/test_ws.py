import pytest
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.core.security import create_access_token
from app.main import app


def test_websocket_connect_valid_token():
    """Connect to WS, send a valid JWT token, verify the connection stays open."""
    client = TestClient(app)
    # Create a valid JWT token directly (no DB lookup needed for WS auth)
    token = create_access_token({"sub": "test-user-id"})
    with client.websocket_connect("/api/v1/ws") as ws:
        ws.send_text(token)
        # Connection stays open — send a second message to confirm
        ws.send_text("ping")


def test_websocket_connect_invalid_token():
    """Connect to WS, send an invalid JWT token, verify server closes with code 4001."""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws") as ws:
        ws.send_text("this-is-not-a-valid-jwt-token")
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_text()
    assert exc.value.code == 4001, "Expected close code 4001 for invalid token"


def test_websocket_connect_no_token():
    """Connect to WS, send an empty message, verify server closes with code 4001."""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws") as ws:
        ws.send_text("")
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_text()
    assert exc.value.code == 4001, "Expected close code 4001 for empty token"
