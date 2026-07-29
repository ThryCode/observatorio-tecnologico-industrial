from fastapi import APIRouter

from app.api.v1 import (
    alerts,
    auth,
    bulletins,
    competitiveness,
    dashboard,
    follows,
    graph,
    health,
    indicators,
    industrial_sectors,
    organizations,
    patent_maps,
    patents,
    professionals,
    regulations,
    research_publications,
    technologies,
    uploads,
    users,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(alerts.router)
api_router.include_router(bulletins.router)
api_router.include_router(competitiveness.router)
api_router.include_router(dashboard.router)
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(follows.router)
api_router.include_router(patent_maps.router)
api_router.include_router(patents.router)
api_router.include_router(regulations.router)
api_router.include_router(indicators.router)
api_router.include_router(graph.router)
api_router.include_router(organizations.router)
api_router.include_router(technologies.router)
api_router.include_router(industrial_sectors.router)
api_router.include_router(professionals.router)
api_router.include_router(research_publications.router)
api_router.include_router(uploads.router)
