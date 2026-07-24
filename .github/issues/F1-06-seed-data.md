# F1-06: Seed data para entidades principales

**Etiquetas:** `fase-1`, `backend`, `datos`
**Hito:** Fase 1 — Calidad
**Depende de:** F0-02 (Alembic único mecanismo)
**Subagente:** `backend-coder`
**Skill:** `fastapi-patterns`

---

## Descripción

Actualmente solo tienen seed data: `industrial_sectores` (5 registros en migración 0001) y `users` (superuser vía `init_db.py`). El resto de entidades — `organizations`, `technologies`, `patents`, `regulations`, `indicators` — están completamente vacías al hacer una instalación fresca.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `backend/app/core/seed_data.py` | **Nuevo** — funciones seed para cada entidad |
| `backend/app/core/init_db.py` | Modificar — llamar `seed_all()` después del superuser |

## Especificación técnica

### 1. Crear `backend/app/core/seed_data.py`

Cada función seed debe ser **idempotente** (verificar existencia antes de insertar).

```python
"""Seed data for initial demonstration and development.
All functions are idempotent — safe to run multiple times.
"""
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.indicator import Indicator
from app.models.organization import Organization
from app.models.technology import Technology


async def seed_organizations(session: AsyncSession) -> int:
    """Seed 5 Cuban industrial organizations."""
    count = 0
    orgs = [
        {"nombre": "Centro de Investigaciones de la Industria Automatizada",
         "siglas": "CIEA", "tipo": "centro_investigacion", "sector_codigo": "AUT",
         "pais": "Cuba", "provincia": "La Habana"},
        {"nombre": "Empresa Metalúrgica de Camagüey",
         "siglas": "METCAM", "tipo": "empresa", "sector_codigo": "MET",
         "pais": "Cuba", "provincia": "Camagüey"},
        {"nombre": "Instituto de Investigaciones Siderúrgicas",
         "siglas": "INSID", "tipo": "centro_investigacion", "sector_codigo": "SID",
         "pais": "Cuba", "provincia": "La Habana"},
        {"nombre": "Empresa de Electrónica de Villa Clara",
         "siglas": "ELEVC", "tipo": "empresa", "sector_codigo": "ELE",
         "pais": "Cuba", "provincia": "Villa Clara"},
        {"nombre": "Centro de Biotecnología Industrial",
         "siglas": "CBI", "tipo": "centro_investigacion", "sector_codigo": "QUI",
         "pais": "Cuba", "provincia": "La Habana"},
    ]
    for data in orgs:
        exists = await session.execute(
            select(Organization).where(Organization.siglas == data["siglas"])
        )
        if not exists.scalar_one_or_none():
            session.add(Organization(**data))
            count += 1
    if count:
        await session.flush()
        logger.info(f"Seeded {count} organizations")
    return count


async def seed_technologies(session: AsyncSession) -> int:
    """Seed 5 representative technologies per sector."""
    count = 0
    techs = [
        {"nombre": "Manufactura Aditiva para Repuestos Metálicos",
         "descripcion": "Impresion 3D de piezas metalicas para mantenimiento industrial",
         "sector_codigo": "MET", "trl_nivel": 6,
         "palabras_clave": ["impresion_3d", "repuestos", "metalurgia"]},
        {"nombre": "Automatizacion de Lineas de Produccion con PLC",
         "descripcion": "Sistemas de control programable para lineas automatizadas",
         "sector_codigo": "AUT", "trl_nivel": 8,
         "palabras_clave": ["plc", "automatizacion", "produccion"]},
        {"nombre": "Recubrimientos Nanotecnologicos Anti-Corrosion",
         "descripcion": "Recubrimientos basados en nanoparticulas para proteccion de acero",
         "sector_codigo": "SID", "trl_nivel": 5,
         "palabras_clave": ["nanotecnologia", "corrosion", "acero"]},
        {"nombre": "Sensores IoT para Monitoreo de Procesos",
         "descripcion": "Red de sensores conectados para vigilancia en tiempo real",
         "sector_codigo": "ELE", "trl_nivel": 7,
         "palabras_clave": ["iot", "sensores", "monitoreo"]},
        {"nombre": "Catalizadores para Procesos Quimicos Verde",
         "descripcion": "Catalizadores que reducen subproductos toxicos en sintesis quimica",
         "sector_codigo": "QUI", "trl_nivel": 4,
         "palabras_clave": ["catalizadores", "quimica_verde", "sintesis"]},
    ]
    for data in techs:
        exists = await session.execute(
            select(Technology).where(Technology.nombre == data["nombre"])
        )
        if not exists.scalar_one_or_none():
            session.add(Technology(**data))
            count += 1
    if count:
        await session.flush()
        logger.info(f"Seeded {count} technologies")
    return count


async def seed_indicators(session: AsyncSession) -> int:
    """Seed 5 KPI indicators for demo dashboards."""
    count = 0
    indicators = [
        {"name": "Produccion de Acero (ton/mes)", "code": "PROD_ACERO_MENSUAL",
         "unit": "toneladas", "value": 12500, "source": "ONEI",
         "period": "monthly", "sector_codigo": "SID"},
        {"name": "Patentes Registradas por Sector", "code": "PAT_SECTOR_ANUAL",
         "unit": "unidades", "value": 23, "source": "OCPI",
         "period": "annual", "sector_codigo": "AUT"},
        {"name": "Indice de Satisfaccion de Clientes", "code": "SAT_CLIENTES",
         "unit": "porcentaje", "value": 78.5, "source": "Encuesta interna",
         "period": "quarterly", "sector_codigo": "ELE"},
        {"name": "Inversion en I+D por Empresa", "code": "INV_ID_EMPRESA",
         "unit": "CUP miles", "value": 450, "source": "MINCEX",
         "period": "annual"},
        {"name": "Empleo en Sector Metalurgico", "code": "EMPLEO_MET",
         "unit": "personas", "value": 8200, "source": "ONEI",
         "period": "annual", "sector_codigo": "MET"},
    ]
    for data in indicators:
        exists = await session.execute(
            select(Indicator).where(Indicator.code == data["code"])
        )
        if not exists.scalar_one_or_none():
            session.add(Indicator(**data))
            count += 1
    if count:
        await session.flush()
        logger.info(f"Seeded {count} indicators")
    return count


async def seed_all(session: AsyncSession) -> None:
    """Run all seed functions in dependency order."""
    await seed_organizations(session)
    await seed_technologies(session)
    await seed_indicators(session)
```

### 2. Modificar `backend/app/core/init_db.py`

```diff
 async def init_db(session: AsyncSession) -> None:
     await create_superuser_if_not_exists(session)
+    from app.core.seed_data import seed_all
+    await seed_all(session)
```

## Criterios de aceptación

- [ ] `seed_data.py` existe con funciones idempotentes para organizations, technologies, indicators
- [ ] `init_db.py` llama a `seed_all()` después del superuser
- [ ] Al arrancar el backend, organizations, technologies e indicators se crean con datos demo
- [ ] Ejecutar `pytest -v` pasa (ningún test existente se rompe)
- [ ] `ruff check backend/` pasa

## Riesgos

- **Bajo**: Datos demo con valores ilustrativos (no reales). Documentar en el código que son datos de demostración.
- **Bajo**: Idempotencia garantizada — ejecutar múltiples veces no duplica datos.
