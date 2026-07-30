from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.security import decode_token
from app.ws_manager import manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    raw = await websocket.receive_text()
    payload = decode_token(raw.strip())
    if payload is None:
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub", "")
    manager.register(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
