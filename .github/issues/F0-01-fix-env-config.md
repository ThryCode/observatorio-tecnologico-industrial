# F0-01: Fix .env — Unificar variable DATABASE_URL

**Etiquetas:** `fase-0`, `critico`, `backend`, `config`
**Hito:** Fase 0 — Estabilización
**Depende de:** Ninguna
**Subagente:** `backend-coder`

---

## Descripción

El archivo `.env` en la raíz del proyecto está **committeado a git** (riesgo de seguridad) y contiene variables estilo Docker Compose (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) que **no son leídas por la aplicación**. Python/Pydantic Settings solo lee `DATABASE_URL`. Como resultado, el backend **falla al arrancar** porque `config.py:13` requiere `database_url` y no lo encuentra.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `.env` (raíz) | **Eliminar** del repo (contiene secrets + formato incorrecto) |
| `.gitignore` | Agregar `.env.*` para cubrir `.env.dev`, `.env.local`, etc. |
| `.env.example` | Verificar que contiene `DATABASE_URL` y todos los campos requeridos |

## Especificación técnica

### 1. Eliminar `.env` del tracking de git

```bash
git rm --cached .env
git rm --cached backend/.env 2>/dev/null || true
```

### 2. Actualizar `.gitignore`

**Archivo:** `.gitignore` (raíz, línea 2)

**Cambio:** Agregar línea después de `.env`:

```gitignore
# Environment
.env
.env.*
```

### 3. Crear/verificar `.env.example`

**Archivo:** `.env.example` (raíz)

Debe contener SOLO variables que `config.py::Settings` lee, con valores dummy:

```env
# ── Base de datos ────────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://observatorio:observatorio_dev@localhost:5432/observatorio_db

# ── Neo4j ───────────────────────────────────────────────────────────
NEO4J_PASSWORD=change-me

# ── Redis ────────────────────────────────────────────────────────────
# Dejar vacío para deshabilitar autenticación
REDIS_PASSWORD=

# ── Backend ──────────────────────────────────────────────────────────
SECRET_KEY=dev-secret-key-no-usar-en-produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# ── Superusuario inicial ─────────────────────────────────────────────
FIRST_SUPERUSER=admin
FIRST_SUPERUSER_PASSWORD=admin
```

### 4. Crear `.env` para desarrollo local

```bash
cp .env.example .env
```

**Nota:** `.env` no se commitea (cubierto por `.gitignore`).

## Criterios de aceptación

- [ ] `git status` no muestra `.env` como tracked
- [ ] `.env.example` contiene `DATABASE_URL` y todas las variables de `config.py:Settings`
- [ ] `.gitignore` ignora `.env`, `.env.dev`, `.env.local`
- [ ] Backend arranca con `uvicorn app.main:app --reload` sin error de validación de Settings
- [ ] `ruff check backend/` pasa sin errores

## Riesgos

- **Medio**: Si alguien tiene `.env` como template para docker-compose, pierde referencia. Mitigar: no aplica porque el proyecto no usa Docker.
