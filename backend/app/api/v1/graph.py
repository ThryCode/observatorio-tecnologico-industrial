import uuid
from collections import defaultdict

import structlog
from fastapi import APIRouter, Depends, Query
from neo4j import AsyncDriver
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.exceptions import AppException
from app.dependencies import get_current_user, get_neo4j, get_redis, require_role
from app.models.organization import Organization
from app.models.patent import PatentStatus
from app.models.user import User
from app.schemas.graph import (
    CommunityResponse,
    EnterpriseGraphEdge,
    EnterpriseGraphNode,
    EnterpriseGraphPatent,
    EnterpriseGraphResponse,
    GraphExploreResponse,
    GraphQueryResponse,
    GraphSearchResponse,
    GraphStatsResponse,
    PageRankResponse,
    RecommendationsResponse,
    ShortestPathResponse,
    SimilarResponse,
    SyncResponse,
)
from app.services.cache import cache_key, get_cached, set_cached

logger = structlog.stdlib.get_logger()

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/query", response_model=GraphQueryResponse)
async def query_graph(
    limit: int = Query(500, ge=1, le=2000),
    sector_codigos: str | None = Query(None),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    codes = [c.strip() for c in sector_codigos.split(",")] if sector_codigos else None
    return await repo.query_graph(limit, codes)


@router.get("/explore", response_model=GraphExploreResponse)
async def explore_node(
    node_id: str = Query(...),
    depth: int = Query(2, ge=1, le=5),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    result = await repo.explore_node(node_id, depth)
    return result or GraphExploreResponse()


@router.get("/search", response_model=GraphSearchResponse)
async def search_nodes(
    q: str = Query(...),
    labels: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    label_list = labels.split(",") if labels else None
    return await repo.search_nodes(q, label_list, page, per_page)


@router.get("/stats", response_model=GraphStatsResponse)
async def graph_stats(
    sector_codigos: str | None = Query(None),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    redis: Redis | None = Depends(get_redis),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")

    key = cache_key("graph:stats", sector=sector_codigos or "all")
    cached = await get_cached(redis, key)
    if cached:
        return {"items": cached}

    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    codes = [c.strip() for c in sector_codigos.split(",")] if sector_codigos else None
    items = await repo.stats(codes)

    await set_cached(redis, key, items, ttl=300)
    return {"items": items}


@router.post("/sync", response_model=SyncResponse)
async def sync_graph(
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin_mindus")),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    return await repo.sync_all(db)


@router.post("/sync-enterprise", response_model=SyncResponse)
async def sync_enterprise_graph(
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin_mindus")),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    return await repo.sync_enterprise_graph(db)


@router.get("/recommendations/{org_id}", response_model=RecommendationsResponse)
async def recommendations_for_org(
    org_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")

    org = (
        await db.execute(select(Organization).where(Organization.id == uuid.UUID(org_id)))
    ).scalar_one_or_none()

    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    result = await repo.recommendations_for_org(org_id, limit)
    return RecommendationsResponse(
        org_id=org_id,
        org_name=org.nombre if org else None,
        items=result["items"],
        total=result["total"],
    )


@router.get("/shortest-path", response_model=ShortestPathResponse)
async def find_shortest_path(
    from_id: str = Query(..., alias="from"),
    to_id: str = Query(..., alias="to"),
    max_depth: int = Query(10, ge=1, le=50),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    result = await repo.shortest_path(from_id, to_id, max_depth)
    return result or ShortestPathResponse()


@router.get("/enterprise", response_model=EnterpriseGraphResponse)
async def enterprise_graph(
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if neo4j:
        try:
            return await _enterprise_graph_from_neo4j(neo4j)
        except Exception as exc:
            logger.warning("neo4j_fallback_enterprise_graph", error=str(exc))

    from app.services.graph_service import GraphService
    return await GraphService(db).get_enterprise_graph()


async def _enterprise_graph_from_neo4j(neo4j: AsyncDriver) -> EnterpriseGraphResponse:
    async with neo4j.session() as session:
        orgs_result = await session.run(
            "MATCH (n:Enterprise) RETURN n.id AS id, n.nombre AS nombre, "
            "n.siglas AS siglas, n.sector_codigo AS sector, n.tipo AS tipo, "
            "n.provincia AS provincia ORDER BY n.siglas"
        )
        orgs = [dict(r) async for r in orgs_result]

        follows_result = await session.run(
            "MATCH (a:Enterprise)-[:FOLLOWS]->(b:Enterprise) "
            "RETURN a.id AS source, b.id AS target"
        )
        edges_data = [dict(r) async for r in follows_result]

        patents_result = await session.run(
            "MATCH (o:Enterprise)-[:HAS_PATENT]->(p:Patent) "
            "RETURN o.id AS org_id, p.id AS id, p.title AS title, "
            "p.patent_number AS patent_number, p.status AS status, "
            "p.filing_date AS filing_date, p.publication_date AS publication_date, "
            "p.technological_sector AS technological_sector, p.country AS country"
        )
        patents_data = [dict(r) async for r in patents_result]

    patents_by_org: dict[str, list] = defaultdict(list)
    for p in patents_data:
        patents_by_org[p["org_id"]].append(p)

    nodes: list[EnterpriseGraphNode] = []
    for o in orgs:
        oid = o["id"]
        org_patents = patents_by_org.get(oid, [])
        patent_list = [
            EnterpriseGraphPatent(
                id=str(p["id"]),
                title=p["title"],
                patent_number=p["patent_number"],
                status=p["status"] or "filed",
                filing_date=str(p["filing_date"]) if p["filing_date"] else None,
                publication_date=str(p["publication_date"]) if p["publication_date"] else None,
                technological_sector=p["technological_sector"],
                country=p["country"],
            )
            for p in org_patents
        ]
        active = sum(1 for p in org_patents if p.get("status") in (PatentStatus.GRANTED, PatentStatus.EXAMINATION))
        pending = sum(1 for p in org_patents if p.get("status") == PatentStatus.FILED)
        nodes.append(EnterpriseGraphNode(
            id=oid,
            type="organization",
            label=f"{o['nombre']} ({o['siglas']})",
            siglas=o["siglas"],
            sector=o["sector"],
            tipo=o["tipo"],
            provincia=o["provincia"],
            patents=patent_list,
            patents_active=active,
            patents_pending=pending,
        ))

    edges = [
        EnterpriseGraphEdge(source=e["source"], target=e["target"], type="FOLLOWS")
        for e in edges_data
    ]

    return EnterpriseGraphResponse(nodes=nodes, edges=edges)


@router.get("/centrality", response_model=PageRankResponse)
async def graph_centrality(
    limit: int = Query(20, ge=1, le=100),
    label: str | None = Query(None),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository

    repo = GraphRepository(neo4j)
    raw = await repo.pagerank(label, limit)
    items = [
        {
            "id": r["id"],
            "label": r["properties"].get("nombre", r["id"]),
            "score": r["score"],
            "labels": r["labels"],
            "props": r["properties"],
        }
        for r in raw
    ]
    return PageRankResponse(items=items, total=len(items))


@router.get("/communities", response_model=CommunityResponse)
async def graph_communities(
    limit: int = Query(50, ge=1, le=200),
    label: str | None = Query(None),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository

    repo = GraphRepository(neo4j)
    raw = await repo.community_detection(label, limit)
    grouped: dict[int, list] = {}
    for r in raw:
        cid = r.get("community", 0)
        grouped.setdefault(cid, []).append(r)
    items = [
        {
            "community_id": cid,
            "nodes": [
                {
                    "id": n["id"],
                    "label": n["properties"].get("nombre", n["id"]),
                    "props": n["properties"],
                }
                for n in nodes
            ],
            "size": len(nodes),
        }
        for cid, nodes in sorted(grouped.items(), key=lambda x: -len(x[1]))
    ]
    return CommunityResponse(items=items, total=len(items))


@router.get("/similar/{node_id}", response_model=SimilarResponse)
async def graph_similar(
    node_id: str,
    limit: int = Query(10, ge=1, le=50),
    neo4j: AsyncDriver | None = Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository

    repo = GraphRepository(neo4j)
    raw = await repo.knn(node_id, limit)
    items = [
        {
            "id": r["id"],
            "label": r["properties"].get("nombre", r["id"]),
            "similarity": min(r["strength"] / 10.0, 1.0),
            "relationship": r["relationship"],
            "strength": r["strength"],
            "labels": r["labels"],
            "props": r["properties"],
        }
        for r in raw
    ]
    return SimilarResponse(items=items, total=len(items))
