# F2-11: Backend — Modelo Alert + CRUD

**Etiquetas:** `fase-2`, `backend`, `feature`
**Hito:** Fase 2 — Paridad Frontend-Backend
**Depende de:** F1-06 (Seed data)
**Subagente:** `backend-coder`
**Skill:** `fastapi-patterns`

---

## Descripción

Crear el módulo de **Alertas** en el backend. Actualmente la página `AlertsPage.tsx` (`/alerts`) usa datos mock hardcoded. Se necesita:

1. Modelo SQLAlchemy `Alert`
2. Esquemas Pydantic v2 (`AlertCreate`, `AlertResponse`)
3. Servicio `AlertService`
4. Router `/api/v1/alerts`
5. Migración Alembic 0006
6. Seed data para alertas demo

## Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `backend/app/models/alert.py` | Modelo ORM |
| `backend/app/schemas/alert.py` | Schemas Pydantic |
| `backend/app/services/alert_service.py` | Lógica de negocio |
| `backend/app/api/v1/alerts.py` | API endpoints |
| `backend/alembic/versions/0006_alerts.py` | Migración |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `backend/app/models/__init__.py` | Exportar `Alert` |
| `backend/app/api/v1/router.py` | Agregar `alerts.router` |
| `backend/app/core/seed_data.py` | Agregar `seed_alerts()` |

## Especificación técnica

### 1. Modelo — `backend/app/models/alert.py`

```python
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class AlertSeverity(str, Enum):
    ALTA = "alta"
    MEDIA = "media"
    BAJA = "baja"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
                server_default=sa.text("gen_random_uuid()"))
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    severidad = Column(String(10), nullable=False, default="media")
    fecha = Column(DateTime, nullable=False, default=datetime.utcnow)
    sector_codigo = Column(String(3), ForeignKey("industrial_sectores.codigo"), nullable=True)
    leida = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow,
                        onupdate=datetime.utcnow)
```

### 2. Schema — `backend/app/schemas/alert.py`

```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AlertBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    descripcion: str | None = None
    severidad: str = "media"
    sector_codigo: str | None = None


class AlertCreate(AlertBase):
    pass


class AlertResponse(AlertBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    fecha: datetime
    leida: bool
    created_at: datetime
    updated_at: datetime
```

### 3. Servicio — `backend/app/services/alert_service.py`

```python
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert
from app.core.exceptions import AppException


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, skip: int = 0, limit: int = 20, unread_only: bool = False):
        query = select(Alert)
        if unread_only:
            query = query.where(Alert.leida == False)
        count_q = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0

        query = query.order_by(Alert.fecha.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all(), total

    async def get(self, alert_id: str):
        query = select(Alert).where(Alert.id == alert_id)
        result = await self.db.execute(query)
        alert = result.scalar_one_or_none()
        if not alert:
            raise AppException(status_code=404, detail="Alert not found")
        return alert

    async def create(self, data: dict):
        alert = Alert(**data)
        self.db.add(alert)
        await self.db.flush()
        return alert

    async def mark_read(self, alert_id: str):
        query = select(Alert).where(Alert.id == alert_id)
        result = await self.db.execute(query)
        alert = result.scalar_one_or_none()
        if not alert:
            raise AppException(status_code=404, detail="Alert not found")
        alert.leida = True
        await self.db.flush()
        return alert
```

### 4. Router — `backend/app/api/v1/alerts.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user
from app.schemas.alert import AlertCreate, AlertResponse
from app.schemas.common import PaginatedResponse
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/", response_model=PaginatedResponse[AlertResponse])
async def list_alerts(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    service = AlertService(db)
    items, total = await service.list(skip=skip, limit=limit, unread_only=unread_only)
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    service = AlertService(db)
    return await service.get(alert_id)


@router.post("/", response_model=AlertResponse, status_code=201)
async def create_alert(
    data: AlertCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    service = AlertService(db)
    return await service.create(data.model_dump())


@router.patch("/{alert_id}/read", response_model=AlertResponse)
async def mark_alert_read(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    service = AlertService(db)
    return await service.mark_read(alert_id)
```

### 5. Migración 0006

```python
"""create alerts table

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-24
"""
import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"


def upgrade():
    op.create_table(
        "alerts",
        sa.Column("id", sa.UUID(), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("severidad", sa.String(10), nullable=False, server_default="media"),
        sa.Column("fecha", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("sector_codigo", sa.String(3),
                  sa.ForeignKey("industrial_sectores.codigo"), nullable=True),
        sa.Column("leida", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_alerts_severidad", "alerts", ["severidad"])
    op.create_index("ix_alerts_leida", "alerts", ["leida"])


def downgrade():
    op.drop_index("ix_alerts_leida", table_name="alerts")
    op.drop_index("ix_alerts_severidad", table_name="alerts")
    op.drop_table("alerts")
```

## Criterios de aceptación

- [ ] Modelo `Alert` creado con todos los campos
- [ ] Schemas Pydantic v2 con `from_attributes=True`
- [ ] Servicio con CRUD básico (list, get, create, mark_read)
- [ ] Router con endpoints GET /, GET /{id}, POST /, PATCH /{id}/read
- [ ] Router registrado en `router.py`
- [ ] Migración 0006 aplica y revierte correctamente
- [ ] Seed data para 5 alertas demo en `seed_data.py`
- [ ] `ruff check backend/` pasa

## Riesgos

- **Medio**: Las alertas actualmente se generan desde el motor de reglas del grafo de conocimiento. Este issue solo crea el CRUD básico; la integración con el motor de reglas queda para otro issue.
- **Bajo**: Tabla nueva sin dependencia de datos existentes.
