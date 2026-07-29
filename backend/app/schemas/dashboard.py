from datetime import datetime

from pydantic import BaseModel


class KPIItem(BaseModel):
    label: str
    value: int
    unit: str
    change: float = 0


class DashboardSummary(BaseModel):
    kpis: list[KPIItem]


class TimelineEvent(BaseModel):
    id: str
    fecha: datetime
    titulo: str
    tipo: str


class SectorCount(BaseModel):
    codigo: str
    nombre: str
    count: int
