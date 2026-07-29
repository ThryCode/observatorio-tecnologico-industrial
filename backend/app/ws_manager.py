from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        if user_id not in self._connections:
            self._connections[user_id] = []
        self._connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        if user_id in self._connections:
            self._connections[user_id] = [ws for ws in self._connections[user_id] if ws != websocket]
            if not self._connections[user_id]:
                del self._connections[user_id]

    async def send_to_user(self, user_id: str, message: dict) -> None:
        if user_id in self._connections:
            for ws in self._connections[user_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    self.disconnect(ws, user_id)

    async def broadcast(self, message: dict) -> None:
        for user_id in list(self._connections):
            await self.send_to_user(user_id, message)


manager = ConnectionManager()
