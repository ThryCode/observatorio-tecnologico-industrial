# F2-12: Backend — Endpoints de resumen para Dashboard

**Etiquetas:** `fase-2`, `backend`, `feature`
**Hito:** Fase 2 — Paridad Frontend-Backend
**Depende de:** F1-06 (Seed data)
**Subagente:** `backend-coder`
**Skill:** `fastapi-patterns`

---

## Descripción

El Dashboard (`/`) actualmente muestra KPIs y datos hardcoded. El backend ya tiene datos en varias tablas (patents, indicators, organizations) pero no hay un endpoint que agregue esa información para el dashboard.

Se necesita un endpoint `/api/v1/dashboard/summary` que devuelva KPIs calculados en tiempo real desde la base de datos.

## Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `backend/app/api/v1/dashboard.py` | Endpoints de resumen |
| `backend/app/schemas/dashboard.py` | Schemas de respuesta |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `backend/app/api/v1/router.py` | Agregar `dashboard.router` |

## Especificación técnica

### 1. Schema — `backend/app/schemas/dashboard.py`

```python
from pydantic import BaseModel


class KPIItem(BaseModel):
    label: str
    value: int
    unit: str
    change: float = 0


class DashboardSummary(BaseModel):
    kpis: list[KPIItem]
```

### 2. Router — `backend/app/api/v1/dashboard.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user
from app.models.organization import Organization
from app.models.patent import Patent
from app.models.technology import Technology
from app.models.indicator import Indicator
from app.schemas.dashboard import DashboardSummary, KPIItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    # Total organizations
    org_count = (await db.execute(
        select(func.count()).select_from(Organization)
    )).scalar() or 0

    # Total patents
    pat_count = (await db.execute(
        select(func.count()).select_from(Patent)
    )).scalar() or 0

    # Total technologies
    tech_count = (await db.execute(
        select(func.count()).select_from(Technology)
    )).scalar() or 0

    # Total indicators
    ind_count = (await db.execute(
        select(func.count()).select_from(Indicator)
    )).scalar() or 0

    return DashboardSummary(kpis=[
        KPIItem(label="Organizaciones", value=org_count, unit="entidades", change=0),
        KPIItem(label="Patentes", value=pat_count, unit="registradas", change=0),
        KPIItem(label="Tecnologías", value=tech_count, unit="vigiladas", change=0),
        KPIItem(label="Indicadores", value=ind_count, unit="activos", change=0),
    ])
```

### 3. Registrar en router.py

```python
from app.api.v1 import dashboard
api_router.include_router(dashboard.router)
```

### 4. Conectar frontend

El hook `useDashboard` (creado en F2-10) debe consumir este endpoint:

```typescript
// hooks/useDashboard.ts — modificar
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      if (USE_MOCK) return MOCK_DATA;
      const res = await client.get<DashboardSummary>('/dashboard/summary');
      return res.data;
    },
  });
}
```

## Criterios de aceptación

- [ ] Endpoint `GET /api/v1/dashboard/summary` devuelve KPIs reales desde DB
- [ ] KPIs: organizaciones, patentes, tecnologías, indicadores
- [ ] Router registrado en `router.py`
- [ ] Endpoint protegido por auth (requiere `get_current_user`)
- [ ] `ruff check backend/` pasa
- [ ] Datos cambian cuando se agregan registros (integración con seed data)

## Riesgos

- **Bajo**: Endpoint de solo lectura, no modifica datos.
- **Bajo**: Si no hay seed data, los KPIs devuelven 0 (comportamiento esperado).
