from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func, literal_column, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.alert import Alert
from app.models.bulletin import Bulletin
from app.models.indicator import Indicator
from app.models.industrial_sector import IndustrialSector
from app.models.organization import Organization
from app.models.patent import Patent
from app.models.regulation import Regulation
from app.models.technology import Technology
from app.schemas.dashboard import DashboardSummary, KPIItem, SectorCount, TimelineEvent

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


@router.get("/sectors", response_model=list[SectorCount])
async def dashboard_sectors(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    pat_counts = select(
        Patent.technological_sector.label("codigo"),
        func.count().label("cnt"),
    ).where(Patent.technological_sector.isnot(None)).group_by(Patent.technological_sector).cte()

    tech_counts = select(
        Technology.sector_codigo.label("codigo"),
        func.count().label("cnt"),
    ).where(Technology.sector_codigo.isnot(None)).group_by(Technology.sector_codigo).cte()

    org_counts = select(
        Organization.sector_codigo.label("codigo"),
        func.count().label("cnt"),
    ).where(Organization.sector_codigo.isnot(None)).group_by(Organization.sector_codigo).cte()

    query = (
        select(
            IndustrialSector.codigo,
            IndustrialSector.nombre,
            (
                func.coalesce(pat_counts.c.cnt, 0)
                + func.coalesce(tech_counts.c.cnt, 0)
                + func.coalesce(org_counts.c.cnt, 0)
            ).label("count"),
        )
        .outerjoin(pat_counts, IndustrialSector.codigo == pat_counts.c.codigo)
        .outerjoin(tech_counts, IndustrialSector.codigo == tech_counts.c.codigo)
        .outerjoin(org_counts, IndustrialSector.codigo == org_counts.c.codigo)
        .order_by(IndustrialSector.codigo)
    )

    result = await db.execute(query)
    rows = result.fetchall()
    return [SectorCount(codigo=r.codigo, nombre=r.nombre, count=r.count) for r in rows]


@router.get("/timeline", response_model=list[TimelineEvent])
async def dashboard_timeline(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    alert_q = select(
        Alert.id.label("id"),
        Alert.fecha.label("fecha"),
        Alert.titulo.label("titulo"),
        literal_column("'alerta'").label("tipo"),
    )

    pat_q = select(
        Patent.id.label("id"),
        Patent.created_at.label("fecha"),
        Patent.title.label("titulo"),
        literal_column("'patente'").label("tipo"),
    )

    reg_q = select(
        Regulation.id.label("id"),
        Regulation.created_at.label("fecha"),
        Regulation.title.label("titulo"),
        literal_column("'regulacion'").label("tipo"),
    )

    bul_q = select(
        Bulletin.id.label("id"),
        Bulletin.created_at.label("fecha"),
        Bulletin.titulo.label("titulo"),
        literal_column("'boletin'").label("tipo"),
    )

    tech_q = select(
        Technology.id.label("id"),
        Technology.created_at.label("fecha"),
        Technology.nombre.label("titulo"),
        literal_column("'tecnologia'").label("tipo"),
    )

    ind_q = select(
        Indicator.id.label("id"),
        Indicator.created_at.label("fecha"),
        Indicator.name.label("titulo"),
        literal_column("'indicador'").label("tipo"),
    )

    union_q = alert_q.union_all(pat_q, reg_q, bul_q, tech_q, ind_q).cte("events")

    query = (
        select(union_q)
        .order_by(union_q.c.fecha.desc().nullslast())
        .limit(limit)
    )

    result = await db.execute(query)
    events = result.fetchall()

    return [
        TimelineEvent(id=str(r.id), fecha=r.fecha or datetime.min, titulo=r.titulo, tipo=r.tipo)
        for r in events
    ]
