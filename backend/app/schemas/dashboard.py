from pydantic import BaseModel


class KPIItem(BaseModel):
    label: str
    value: int
    unit: str
    change: float = 0


class DashboardSummary(BaseModel):
    kpis: list[KPIItem]
