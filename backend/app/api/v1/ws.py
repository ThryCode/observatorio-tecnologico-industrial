import uuid

import structlog
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.db import _session_factory
from app.core.security import decode_token
from app.models.user import User
from app.ws_manager import manager

logger = structlog.stdlib.get_logger()

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    token = websocket.query_params.get("token", "")
    if not token:
        await websocket.close(code=4001)
        return

    payload = decode_token(token)
    if payload is None:
        await websocket.close(code=4001)
        return

    raw_user_id = payload.get("sub", "")
    if not raw_user_id:
        await websocket.close(code=4001)
        return

    try:
        user_id = uuid.UUID(raw_user_id)
    except ValueError:
        await websocket.close(code=4001)
        return

    async with _session_factory() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active or user.status != "approved":
            await websocket.close(code=4001)
            return

    manager.register(websocket, str(user_id))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, str(user_id))
