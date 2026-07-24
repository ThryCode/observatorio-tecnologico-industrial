# F0-03: Fix migration 0004 — UUID server_default

**Etiquetas:** `fase-0`, `backend`, `base-de-datos`, `migracion`
**Hito:** Fase 0 — Estabilización
**Depende de:** Ninguna
**Subagente:** `db-migrator`
**Skill:** `alembic-migrations`

---

## Descripción

La migración `0004_professional_profiles.py` crea la tabla `professional_profiles` pero su columna `id` no tiene `server_default=sa.text("gen_random_uuid()")`, a diferencia de todas las demás tablas (0001). Esto es una inconsistencia que:

1. No genera UUID automáticamente si se inserta vía SQL raw u otro servicio
2. Rompe la consistencia de diseño con las otras 7 tablas

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `backend/alembic/versions/0005_fix_professional_profiles_server_default.py` | **Nueva migración** |

## Especificación técnica

### No editar la migración 0004

Regla del proyecto: **nunca editar migraciones committed**. Se crea una nueva migración 0005.

### Crear archivo: `backend/alembic/versions/0005_fix_professional_profiles_server_default.py`

```python
"""fix server_default for professional_profiles.id

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-24
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "professional_profiles",
        "id",
        server_default=sa.text("gen_random_uuid()"),
    )


def downgrade() -> None:
    op.alter_column(
        "professional_profiles",
        "id",
        server_default=None,
    )
```

## Prueba

```bash
cd backend
alembic upgrade head    # Aplica 0005
alembic downgrade -1    # Revierte 0005
alembic upgrade head    # Re-aplica
```

## Criterios de aceptación

- [ ] Nueva migración 0005 creada y registrada en la cadena de revisiones
- [ ] `alembic upgrade head` aplica sin errores
- [ ] `alembic downgrade -1` revierte correctamente (elimina server_default)
- [ ] `alembic history` muestra cadena: `0001 → 0002 → 0003 → 0004 → 0005`
- [ ] Ningún archivo de migración existente fue modificado

## Riesgos

- **Bajo**: `ALTER COLUMN ... server_default` es metadata-only en PostgreSQL. No requiere rewrite de tabla ni bloquea lecturas/escrituras.
- Tabla `professional_profiles` probablemente vacía en desarrollo, cero riesgo de datos.
