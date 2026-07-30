from typing import Any

from pydantic import BaseModel


class GraphExploreResponse(BaseModel):
    nodes: list[dict[str, Any]] | None = None
    relationships: list[dict[str, Any]] | None = None


class GraphSearchItem(BaseModel):
    n: dict[str, Any]
    node_labels: list[str]


class GraphSearchResponse(BaseModel):
    items: list[GraphSearchItem]
    total: int
    page: int
    per_page: int


class GraphStatItem(BaseModel):
    label: str
    count: int


class GraphStatsResponse(BaseModel):
    items: list[GraphStatItem]


class SyncResponse(BaseModel):
    nodes_merged: int
    relationships_merged: int


class ShortestPathResponse(BaseModel):
    node_ids: list[str] | None = None
    rel_types: list[str] | None = None
    weight: int | None = None


class EnterpriseGraphNode(BaseModel):
    id: str
    type: str = "organization"
    label: str
    siglas: str | None = None
    sector: str | None = None
    tipo: str | None = None
    provincia: str | None = None


class EnterpriseGraphEdge(BaseModel):
    source: str
    target: str
    type: str


class EnterpriseGraphResponse(BaseModel):
    nodes: list[EnterpriseGraphNode]
    edges: list[EnterpriseGraphEdge]
