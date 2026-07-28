from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from app.core.db import get_db
from app.core.exceptions import AppException
from app.dependencies import get_current_user, get_neo4j, require_role
from app.models.follow import Follow
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.graph import (
    EnterpriseGraphEdge,
    EnterpriseGraphNode,
    EnterpriseGraphResponse,
    GraphExploreResponse,
    GraphSearchResponse,
    GraphStatsResponse,
    ShortestPathResponse,
    SyncResponse,
)

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/explore", response_model=GraphExploreResponse)
async def explore_node(
    node_id: str = Query(...),
    depth: int = Query(2, ge=1, le=5),
    neo4j=Depends(get_neo4j),
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
    neo4j=Depends(get_neo4j),
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
    neo4j=Depends(get_neo4j),
    _: User = Depends(get_current_user),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    items = await repo.stats()
    return {"items": items}


@router.post("/sync", response_model=SyncResponse)
async def sync_graph(
    neo4j=Depends(get_neo4j),
    db=Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN_MINDUS)),
):
    if not neo4j:
        raise AppException(503, "Neo4j is not available")
    from app.graph.repository import GraphRepository
    repo = GraphRepository(neo4j)
    return await repo.sync_all(db)


@router.get("/shortest-path", response_model=ShortestPathResponse)
async def find_shortest_path(
    from_id: str = Query(..., alias="from"),
    to_id: str = Query(..., alias="to"),
    max_depth: int = Query(10, ge=1, le=50),
    neo4j=Depends(get_neo4j),
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
    db=Depends(get_db),
    _: User = Depends(get_current_user),
):
    users_result = await db.execute(select(User))
    users = users_result.scalars().all()

    orgs_result = await db.execute(select(Organization))
    orgs = orgs_result.scalars().all()

    follows_result = await db.execute(select(Follow))
    follows = follows_result.scalars().all()

    nodes: list[EnterpriseGraphNode] = []
    edges: list[EnterpriseGraphEdge] = []
    seen = set()

    for u in users:
        nid = f"user-{u.id}"
        seen.add(nid)
        nodes.append(EnterpriseGraphNode(
            id=nid,
            type="person",
            label=u.full_name,
            role=u.role,
            org_id=str(u.organization_id) if u.organization_id else None,
        ))
    for o in orgs:
        nid = f"org-{o.id}"
        seen.add(nid)
        nodes.append(EnterpriseGraphNode(
            id=nid,
            type="organization",
            label=f"{o.nombre} ({o.siglas})",
            siglas=o.siglas,
        ))

    for f in follows:
        source = f"user-{f.follower_id}"
        target = f"org-{f.organization_id}"
        if source in seen and target in seen:
            edges.append(EnterpriseGraphEdge(source=source, target=target, type="FOLLOWS"))

    for u in users:
        if u.organization_id:
            source = f"user-{u.id}"
            target = f"org-{u.organization_id}"
            if source in seen and target in seen:
                edges.append(EnterpriseGraphEdge(source=source, target=target, type="REPRESENTS"))

    return EnterpriseGraphResponse(nodes=nodes, edges=edges)
