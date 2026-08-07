from datetime import datetime

from fastapi import APIRouter, Depends, Query
from redis.asyncio import Redis
from sqlalchemy import func, literal_column, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, get_redis
from app.models.alert import Alert
from app.models.bulletin import Bulletin
from app.models.follow import Follow
from app.models.indicator import Indicator
from app.models.industrial_sector import IndustrialSector
from app.models.organization import Organization
from app.models.patent import Patent
from app.models.regulation import Regulation
from app.models.technology import Technology
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, KPIItem, SectorCount, TimelineEvent
from app.services.cache import cache_key, get_cached, set_cached

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(
    sector_codigos: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    redis: Redis | None = Depends(get_redis),
    _=Depends(get_current_user),
):
    key = cache_key("dashboard:summary", sector=sector_codigos or "all")
    cached = await get_cached(redis, key)
    if cached:
        return DashboardSummary(**cached)

    codes = [c.strip() for c in sector_codigos.split(",")] if sector_codigos else None

    def _count(model, sector_col=None):
        q = select(func.count()).select_from(model)
        if codes and sector_col is not None:
            q = q.where(sector_col.in_(codes))
        return q

    org_count = (await db.execute(_count(Organization, Organization.sector_codigo))).scalar() or 0
    pat_count = (await db.execute(_count(Patent, Patent.technological_sector))).scalar() or 0
    tech_count = (await db.execute(_count(Technology, Technology.sector_codigo))).scalar() or 0
    ind_count = (await db.execute(_count(Indicator, Indicator.sector_codigo))).scalar() or 0
    alert_count = (await db.execute(_count(Alert, Alert.sector_codigo))).scalar() or 0

    result = DashboardSummary(kpis=[
        KPIItem(label="Organizaciones", value=org_count, unit="entidades", change=0),
        KPIItem(label="Patentes", value=pat_count, unit="registradas", change=0),
        KPIItem(label="Tecnologías", value=tech_count, unit="vigiladas", change=0),
        KPIItem(label="Indicadores", value=ind_count, unit="activos", change=0),
        KPIItem(label="Alertas", value=alert_count, unit="activas", change=0),
    ])

    await set_cached(redis, key, result.model_dump(), ttl=300)
    return result


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


def _timeline_query(
    id_col,
    fecha_col,
    titulo_col,
    tipo: str,
    sector_col=None,
    sector_codigos: list[str] | None = None,
):
    query = select(
        id_col.label("id"),
        fecha_col.label("fecha"),
        titulo_col.label("titulo"),
        literal_column(f"'{tipo}'").label("tipo"),
    )
    if sector_col is not None and sector_codigos:
        query = query.where(sector_col.in_(sector_codigos))
    return query


@router.get("/timeline", response_model=list[TimelineEvent])
async def dashboard_timeline(
    limit: int = Query(20, ge=1, le=100),
    sector_codigos: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    codes = [c.strip() for c in sector_codigos.split(",")] if sector_codigos else None

    alert_q = _timeline_query(
        Alert.id, Alert.fecha, Alert.titulo, "alerta",
        Alert.sector_codigo, codes,
    )

    pat_q = _timeline_query(
        Patent.id, Patent.created_at, Patent.title, "patente",
        Patent.technological_sector, codes,
    )

    reg_q = _timeline_query(
        Regulation.id, Regulation.created_at, Regulation.title, "regulacion",
        Regulation.sector_codigo, codes,
    )

    bul_q = _timeline_query(
        Bulletin.id, Bulletin.created_at, Bulletin.titulo, "boletin",
        Bulletin.sector_codigo, codes,
    )

    tech_q = _timeline_query(
        Technology.id, Technology.created_at, Technology.nombre, "tecnologia",
        Technology.sector_codigo, codes,
    )

    ind_q = _timeline_query(
        Indicator.id, Indicator.created_at, Indicator.name, "indicador",
        Indicator.sector_codigo, codes,
    )

    union_q = alert_q.union_all(pat_q, reg_q, bul_q, tech_q, ind_q).cte("events")

    query = (
        select(union_q)
        .order_by(union_q.c.fecha.desc().nullslast())
        .limit(limit)
    )

    result = await db.execute(query)
    events = result.fetchall()

    timeline = [
        TimelineEvent(id=str(r.id), fecha=r.fecha or datetime.min, titulo=r.titulo, tipo=r.tipo)
        for r in events
    ]

    follow_events = await _follow_events(db, codes)
    timeline.extend(follow_events)
    timeline.sort(key=lambda e: e.fecha, reverse=True)

    return timeline[:limit]


async def _follow_events(db: AsyncSession, sector_codigos: list[str] | None) -> list[TimelineEvent]:
    org_sel = select(
        Organization.id, Organization.nombre, Organization.siglas, Organization.sector_codigo
    )
    orgs_result = await db.execute(org_sel)
    org_rows = orgs_result.all()
    org_map = {str(r.id): r for r in org_rows}

    users_result = await db.execute(select(User.id, User.organization_id))
    user_org_map = {
        str(r.id): str(r.organization_id)
        for r in users_result.all()
        if r.organization_id
    }

    follows_result = await db.execute(
        select(Follow.id, Follow.follower_id, Follow.follower_type, Follow.organization_id, Follow.created_at)
        .order_by(Follow.created_at.desc())
        .limit(100)
    )
    follow_rows = follows_result.all()

    events: list[TimelineEvent] = []
    for row in follow_rows:
        target = org_map.get(str(row.organization_id))
        if not target:
            continue
        if sector_codigos and (target.sector_codigo or "") not in sector_codigos:
            continue

        if row.follower_type == "organization":
            follower_org = org_map.get(str(row.follower_id))
            follower_name = follower_org.nombre if follower_org else "Una organización"
        elif row.follower_type == "user":
            org_id = user_org_map.get(str(row.follower_id))
            follower_org = org_map.get(org_id or "")
            follower_name = follower_org.nombre if follower_org else "Un usuario"
        else:
            continue

        events.append(TimelineEvent(
            id=str(row.id),
            fecha=row.created_at or datetime.min,
            titulo=f"{follower_name} comenzó a seguir a {target.nombre}",
            tipo="follow",
        ))

    return events
