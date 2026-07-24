# F0-02: Hacer Alembic el único mecanismo de migración

**Etiquetas:** `fase-0`, `critico`, `backend`, `base-de-datos`
**Hito:** Fase 0 — Estabilización
**Depende de:** Ninguna
**Subagente:** `backend-coder` + `db-migrator`
**Skills:** `alembic-migrations`, `fastapi-patterns`

---

## Descripción

Actualmente `backend/app/core/db.py:32-33` ejecuta `Base.metadata.create_all()` en cada startup, lo que **bypassea completamente Alembic**. Esto hace que las migraciones sean decorativas/documentales y genera un falso sentido de versionamiento de esquema.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `backend/app/core/db.py` | Eliminar `create_all` (líneas 32-33), renombrar función |
| `backend/app/main.py` | Actualizar import y call |
| `backend/README.md` (o `backend/AGENTS.md`) | Documentar que `alembic upgrade head` es obligatorio |

## Especificación técnica

### 1. Verificar cobertura de migraciones

Antes de hacer cambios, **verificar** que las 4 migraciones existentes cubren TODAS las tablas de los modelos:

| Modelo | Tabla | Migración | Cubierta |
|--------|-------|-----------|----------|
| `IndustrialSector` | `industrial_sectores` | 0001 | ✅ |
| `Organization` | `organizations` | 0001 | ✅ |
| `Technology` | `technologies` | 0001 | ✅ |
| `User` | `users` | 0001 + 0003 | ✅ |
| `Patent` | `patents` | 0001 | ✅ |
| `Regulation` | `regulations` | 0001 | ✅ |
| `Indicator` | `indicators` | 0001 | ✅ |
| `ProfessionalProfile` | `professional_profiles` | 0004 | ✅ |

Todas cubiertas ✅ — no se necesita migración de sync.

### 2. Modificar `db.py`

**Archivo:** `backend/app/core/db.py`

**Cambio 1:** Renombrar `init_db()` a `startup_db()` (evitar colisión de nombres con `init_db.py::init_db`)

```python
async def startup_db() -> None:  # antes: async def init_db() -> None:
```

**Cambio 2:** Eliminar las líneas 32-33 (`create_all`):

```diff
     _session_factory = async_sessionmaker(
         _engine,
         class_=AsyncSession,
         expire_on_commit=False,
     )

-    async with _engine.begin() as conn:
-        await conn.run_sync(Base.metadata.create_all)
-
     async with _session_factory() as session:
         from app.core.init_db import init_db as seed_db
         try:
```

**Nota:** No eliminar el import de `Base` si se usa en otra parte; si no, eliminarlo también.

**Archivo completo después:**

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.models.base import Base  # mantener si otros módulos lo usan vía db

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


async def startup_db() -> None:
    global _engine, _session_factory

    _engine = create_async_engine(
        settings.database_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
    )
    _session_factory = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with _session_factory() as session:
        from app.core.init_db import init_db as seed_db
        try:
            await seed_db(session)
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if _session_factory is None:
        raise RuntimeError("Database not initialized. Call startup_db() first.")

    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def close_db():
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
```

### 3. Modificar `main.py`

**Archivo:** `backend/app/main.py`, línea 13

```diff
- from app.core.db import close_db, init_db
+ from app.core.db import close_db, startup_db
```

Línea 27:

```diff
-     await init_db()
+     await startup_db()
```

### 4. Los tests NO cambian

`backend/tests/conftest.py` usa su propio `create_all` para la base de datos de prueba (sesión-scoped). Eso es correcto y debe mantenerse — los tests necesitan crear tablas temporales sin depender de Alembic.

### 5. Actualizar documentación

En `backend/AGENTS.md`, agregar al inicio rápido:

```bash
# Obligatorio antes del primer arranque:
alembic upgrade head
```

## Criterios de aceptación

- [ ] `create_all` eliminado de `db.py`
- [ ] `init_db` renombrado a `startup_db` en `db.py` y `main.py`
- [ ] Backend arranca correctamente con `alembic upgrade head && uvicorn app.main:app`
- [ ] Seed de superusuario sigue funcionando
- [ ] Tests pasan: `pytest -v` desde `backend/`
- [ ] `ruff check backend/` pasa sin errores

## Riesgos

- **Alto**: Si hay instancias en producción que nunca ejecutaron `alembic upgrade head`, las tablas existen pero Alembic no lo sabe. Se debe ejecutar `alembic stamp head` para sincronizar. Esto debe documentarse en el README y en la guía de deploy.
- **Ninguno** para tests: `conftest.py` usa su propio `create_all` independiente.
