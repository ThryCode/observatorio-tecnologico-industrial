# Changelog

> Plataforma de vigilancia tecnológica industrial para el Ministerio de Industrias de Cuba (MINDUS).
> Python/FastAPI + React/TypeScript + Neo4j/SQLite/Redis.

---

## v0.2.0 (Current) — Fase 5: Refactorización y Estabilización + Grafo de Conocimiento

### Added
- **Grafo de conocimiento interactivo** — navegación "una sola vista" con pan/zoom y drill-in por sector:
  - `graphNav.ts`: vista galaxy (sectores agrupadores) y vista system (subgrafo expandible de vecinos directos)
  - Drill-in al hacer clic en un nodo (`focusNode`/`goBack`), subtítulo "Sistema de: X", botón "Ver grafo completo"
  - `ForceGraph2D.tsx` con física circular, nodos de colores por tipo, aristas curvas por fan-in/fan-out, backdrop con pan/zoom nativo (rueda no-pasiva sin scroll de página)
  - Etiquetas de aristas y títulos de nodos en español (pertenece al sector, opera en, mide, es autor de, etc.)
  - `KnowledgeGraph.tsx` y `GraphExplorer.tsx` con búsqueda accent-insensitive, autocompletado de autores y traducción de tipos de nodo al español
- **Sincronización Neo4j completa** — `sync_all()` en `app/graph/repository.py` ahora crea las 11 relaciones ontológicas:
  - `WORKS_AT` (Person → Organization), `OPERATES_IN` (Organization → Technology), `REGULATES` (Regulation → Technology), `MEASURES` (Indicator → Technology)
  - `sync_enterprise_graph()` sincroniza follows organización → organización además de user → org, con `MERGE` idempotente
- **Recomendaciones** — `GET /api/v1/graph/recommendations/{org_id}` con conexiones mutuas y razón por tipo de nodo
- **Timeline del Dashboard** — `GET /api/v1/dashboard/timeline` unifica alertas, patentes, normativas, boletines, tecnologías e indicadores; componente `DashboardTimeline.tsx`
- **Research publications** — CRUD completo con filtro por autor, autocompletado (`AuthorAutocomplete.tsx`), búsqueda accent-insensitive
- **Rol profesional** — usuarios profesionales pueden crear publicaciones de investigación; permisos por rol en `usePermissions.ts`
- **Enterprise patents** — patentes de empresas con registro de redes sociales en perfiles profesionales
- **Optimización OPT-001** — 63 hallazgos corregidos (bugs, seguridad, dead code, testing, config)
- **Tests** — 29 tests nuevos cubriendo 8 módulos endpoint (f5-12) y cobertura adicional de grupos de endpoints (f5-08)
- **Database dump** — `database/observatorio_dump.sql` con esquema completo + seed data

### Changed
- `ForceGraph2D.tsx` migrado de layout estático con pool de física a layout circular centrado automáticamente (`centeredView`)
- Fonts del grafo aumentadas (títulos 4, conexiones 4, subtítulos 2.8) y tipos de nodo traducidos al español
- `graph/repository.py` y `sync_enterprise_graph` reescritos con relaciones completas e idempotencia
- BaseService + CrudPage reducen el boilerplate CRUD (f5-06), parámetros de paginación corregidos (f5-06)
- Búsqueda en list endpoints con `query_helpers.apply_search` / `apply_date_range` (f5-07)

### Fixed
- ProtectedRoute/file serving autenticado sustituye StaticFiles público sin auth (f5-03)
- `IndicatorService` evita crash de caché con serialización Pydantic (f5-01)
- `AlertsPage` ya no marca todas las alertas como leídas al montar (f5-02)
- Dashboard sin iconos hardcodeados y con estados de error (f5-09, f5-10)
- Bug del remoto: `UserRole` sin importar en `auth_service.py`; tipos `canEdit`/`canDelete` boolean en `PublicationsPage.tsx`

### Docs
- Este changelog actualizado
- AGENTS.md con convenciones de tres niveles (always / ask-first / never)

---

## v0.1.0 — Fase: Registro de Usuarios

### Added
- User registration workflow: public registration with approval/rejection by superuser
- `POST /api/v1/auth/register/public` — public signup with `status=pending`
- `POST /api/v1/auth/{id}/approve` and `POST /api/v1/auth/{id}/reject` — admin moderation
- `GET /api/v1/auth/pending` — pending user list for superusers
- `account_type`, `status`, `rejection_reason`, `approved_by`, `approved_at` fields on User model
- Alembic migration `0003_user_registration_fields.py`
- Pending Approvals page in frontend sidebar (superuser only)
- `Register.tsx` page for public registration
- Registration status feedback and blocked login for `pending`/`rejected` users

### Changed
- Login endpoint now rejects users with `status=pending` or `status=rejected`
- Auth service refactored to support registration workflow

### Fixed
- Migration 0004 UUID `server_default` issue resolved

### Docs
- README updated with registration flow diagram and approval workflow

---

## v0.0.3 — Fase 4: Features

### Added
- Backend alerts model (`Alert`) with full CRUD endpoints
- Dashboard summary endpoints for aggregate indicators
- Seed data script for main entities (technologies, patents, organizations)
- Frontend test infrastructure: Vitest + happy-dom setup (10 tests)
- Frontend test coverage: `App.test.tsx`, `Button.test.tsx`, `utils.test.tsx`
- Branch protection documentation and PR template
- `docs/production-guide.md` — production deployment guide for Windows
- `docs/backup-recovery.md` — PostgreSQL, Neo4j, and Redis backup procedures
- `CONTRIBUTING.md` contribution guidelines

### Changed
- Frontend mock data structured for pages without backend endpoints
- README.md expanded with full stack table, architecture, and conventions

### Fixed
- `setup-env.ps1` syntax errors resolved
- Backend tests expanded to 111 tests (pytest)
- WebSocket echo test removed from test suite

### Chore
- GitHub Actions CI workflow for backend (ruff + pytest) and frontend (lint + test + build)
- CI badge added to README
- Branch protection settings documented for GitHub repo

---

## v0.0.2 — Fase 0-3: Foundation

### Added
- CI/CD: GitHub Actions workflow with backend and frontend jobs
- Health check endpoint: `GET /api/v1/health` — verifies PostgreSQL, Neo4j, Redis
- Rate limiting with slowapi on auth endpoints
- Neo4j graph repository with parametrized Cypher queries using APOC
- Graph sync endpoint: `POST /api/v1/graph/sync`
- Pydantic v2 schemas for all CRUD entities
- `services/cache.py` Redis wrapper service
- `core/exceptions.py` — `AppException` and global exception handler
- `core/logging_config.py` — loguru with rotating file handler
- Frontend auth context (`AuthContext.tsx`) with localStorage JWT persistence
- Frontend TanStack Query hooks for all entity types
- Frontend axios client with interceptors for token refresh
- Frontend `ProtectedRoute.tsx` component
- Frontend 17 lazy-loaded pages (Dashboard, Login, Organizations, Patents, etc.)
- Frontend 20 reusable components (shadcn/ui primitives, Layout, Sidebar, Header)
- Frontend 7 TanStack Query hooks

### Changed
- `.env.example` created with `DATABASE_URL` and all required variables
- `.gitignore` updated to ignore `.env.*` patterns
- `db.py` engine configuration aligned with Alembic (async SQLAlchemy)
- Backend routers standardized under `/api/v1/` prefix
- Frontend routing with `React.lazy()` + `Suspense` for code splitting
- Vite `manualChunks` configuration for vendor splitting

### Fixed
- `.env` removed from git tracking (was committed with secrets)
- `DATABASE_URL` variable now correctly read by Pydantic Settings
- Migration 0002 index creation alignment with models
- Dead code removed from `graph/repository.py`
- WebSocket echo endpoint removed (not in scope)

### Docs
- `CHANGELOG.md` created (this file)
- `AGENTS.md` — AI agent instructions for opencode collaboration
- `.opencode/` configuration with project skills

---

## v0.0.1 — Initial Scaffold

### Added
- Project repository initialized
- Backend scaffold: FastAPI app with Uvicorn, SQLAlchemy 2.0 async, Alembic
- Frontend scaffold: React 18 + TypeScript + Vite 5 + Tailwind CSS 3
- Neo4j Community 5 integration with async driver
- PostgreSQL 15 async connection via asyncpg
- Redis 5.0 cache integration (tporadowski Windows build)
- Alembic migrations `0001_initial_schema.py` and `0002_performance_indexes.py`
- ORM models: User, Technology, Patent, Organization, Indicator, Regulation, IndustrialSector
- CRUD endpoints for all entities
- JWT authentication (python-jose + bcrypt)
- Role-based authorization: `admin_mindus`, `representante_cti`, `analista`, `visitante`
- Frontend UI primitives from shadcn/ui
- Tailwind CSS configuration with custom theme
- TypeScript strict mode with path alias `@/`
- `cn()` utility for conditional class merging
- Installation scripts: `setup-env.ps1`, `start-windows.ps1`, `stop-windows.ps1`
- `.env.windows` template for Windows development
- `docs/instalacion-windows.md` — Windows setup guide
- `README.md` with project description, setup, and architecture
- `.gitignore` with Python, Node, and IDE patterns

### Chore
- `requirements.txt` with all Python dependencies
- `package.json` with all Node dependencies
- `opencode.json` configuration
