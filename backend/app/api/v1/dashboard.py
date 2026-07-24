from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.alert import Alert
from app.models.indicator import Indicator
from app.models.organization import Organization
from app.models.patent import Patent
from app.models.technology import Technology
from app.schemas.dashboard import DashboardSummary, KPIItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    org_count = (await db.execute(
        select(func.count()).select_from(Organization)
    )).scalar() or 0

    pat_count = (await db.execute(
        select(func.count()).select_from(Patent)
    )).scalar() or 0

    tech_count = (await db.execute(
        select(func.count()).select_from(Technology)
    )).scalar() or 0

    ind_count = (await db.execute(
        select(func.count()).select_from(Indicator)
    )).scalar() or 0

    alert_count = (await db.execute(
        select(func.count()).select_from(Alert)
    )).scalar() or 0

    return DashboardSummary(kpis=[
        KPIItem(label="Organizaciones", value=org_count, unit="entidades", change=0),
        KPIItem(label="Patentes", value=pat_count, unit="registradas", change=0),
        KPIItem(label="Tecnologías", value=tech_count, unit="vigiladas", change=0),
        KPIItem(label="Indicadores", value=ind_count, unit="activos", change=0),
        KPIItem(label="Alertas", value=alert_count, unit="activas", change=0),
    ])
