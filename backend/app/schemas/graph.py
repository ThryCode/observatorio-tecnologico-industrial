from typing import Any

from pydantic import BaseModel


class GraphExploreResponse(BaseModel):
    nodes: list[dict[str, Any]] | None = None
    relationships: list[dict[str, Any]] | None = None


class GraphSearchItem(BaseModel):
    n: dict[str, Any]
    labels: list[str]


class GraphSearchResponse(BaseModel):
    items: list[GraphSearchItem]


class GraphStatItem(BaseModel):
    label: str
    count: int


class GraphStatsResponse(BaseModel):
    items: list[GraphStatItem]
