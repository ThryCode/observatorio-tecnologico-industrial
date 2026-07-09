from fastapi import APIRouter
from app.api.v1 import auth, users, patents, regulations, indicators, graph, organizations

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(patents.router)
api_router.include_router(regulations.router)
api_router.include_router(indicators.router)
api_router.include_router(graph.router)
api_router.include_router(organizations.router)
