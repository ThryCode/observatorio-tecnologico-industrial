from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.security import decode_token
from app.ws_manager import manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str | None = None):
    payload = decode_token(token)
    if payload is None:
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub", "")
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
