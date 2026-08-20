# Observatorio Tecnológico Industrial

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Neo4j](https://img.shields.io/badge/Neo4j-5-008CC1?style=flat&logo=neo4j&logoColor=white)](https://neo4j.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![CI](https://github.com/ThryCode/observatorio-tecnologico-industrial/actions/workflows/ci.yml/badge.svg)](https://github.com/ThryCode/observatorio-tecnologico-industrial/actions)
[![License](https://img.shields.io/badge/License-MINDUS-blue)](LICENSE)

> Plataforma de vigilancia tecnológica y competitividad industrial para el Ministerio de Industrias de Cuba (MINDUS).

---

## Tabla de contenidos

- [Propósito](#propósito)
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Decisiones técnicas clave](#decisiones-técnicas-clave)
- [Requisitos del sistema](#requisitos-del-sistema)
- [Inicio rápido](#inicio-rápido-windows-nativo)
- [Servicios y puertos](#servicios-y-puertos)
- [Endpoints principales](#endpoints-principales)
- [Flujo de registro y aprobación](#flujo-de-registro-y-aprobación)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Testing](#testing)
- [Cómo contribuir](#cómo-contribuir)
- [Integración Continua](#integración-continua)
- [Documentación adicional](#documentación-adicional)
- [Convenciones de código](#convenciones-de-código)
- [Migraciones](#migraciones)
- [Issues conocidos](#issues-conocidos-de-la-auditoría)
- [Licencia](#licencia)

---

## Propósito

El Observatorio Tecnológico Industrial es un sistema de inteligencia estratégica que opera como servicio digital (SaaS) bajo la rectoría del MINDUS. Su propósito es monitorear, analizar y evaluar tendencias globales en ciencia, tecnología e innovación aplicadas a las industrias rectoradas del país.

## Funcionalidades

- **Grafo de conocimiento interactivo** — Navegación "una sola vista" con pan/zoom, drill-in por sector, aristas curvas por fan-in/out y etiquetas en español. Modela relaciones entre tecnologías, empresas, patentes, normativas e indicadores usando Neo4j con APOC y GDS.
- **Sincronización Neo4j completa** — `sync_all()` crea las 11 relaciones ontológicas (WORKS_AT, OPERATES_IN, REGULATES, MEASURES, BELONGS_TO_SECTOR, IS_AUTHOR_OF, HAS_PATENT, RELATES_TO, etc.) y `sync_enterprise_graph()` sincroniza follows organización→organización, todo idempotente con MERGE.
- **Recomendaciones CTI** — `GET /api/v1/graph/recommendations/{org_id}` sugiere entidades por conexiones mutuas con razón explicada.
- **Análisis de patentes** — Registro, búsqueda y clasificación de patentes por sector tecnológico y país, incluidas patentes empresariales.
- **Vigilancia normativa** — Seguimiento de leyes, decretos, resoluciones y normas del ecosistema industrial.
- **Indicadores sectoriales** — Dashboard de indicadores industriales con soporte multiperíodo (mensual, trimestral, anual).
- **Alertas tempranas** — Motor de reglas sobre el grafo de conocimiento para detectar cambios relevantes.
- **Timeline del Dashboard** — Línea temporal de eventos reales unificando patentes, normativas, boletines, alertas, tecnologías e indicadores.
- **Publicaciones de investigación** — CRUD con filtro por autor, autocompletado y búsqueda accent-insensitive; el rol profesional puede crear publicaciones.
- **Registro de usuarios** — Solicitud pública con aprobación/rechazo por administrador; registro de redes sociales en perfiles profesionales.
- **Sistema de roles** — Admin MINDUS, representante CTI, analista, profesional y visitante con permisos diferenciados (RBAC con `require_role`).
- **Health check** — Endpoint `/api/v1/health` verifica estado de SQLite, Neo4j y Redis.
- **Rate limiting** — Protección contra abuso en endpoints de autenticación (slowapi).

## Arquitectura

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Frontend   │    │   Backend    │    │   Neo4j     │
│  React 18   │◄──►│  FastAPI     │◄──►│  Grafo CTI  │
│  Vite       │    │  Uvicorn     │    │  APOC + GDS │
│  Tailwind   │    │  SQLAlchemy  │    └─────────────┘
└─────────────┘    └──┬───┬───┬──┘
                      │   │   │
               ┌──────┘   │   └──────┐
               ▼          ▼          ▼
         ┌──────────┐ ┌────────┐ ┌────────┐
         │ SQLite   │ │ Redis  │ │Adminer │
         │ (file)   │ │ 5      │ │(GUI)   │
         └──────────┘ └────────┘ └────────┘
```

## Stack tecnológico

| Capa | Tecnología | Versión | Decisión |
|---|---|---|---|
| **Backend** | Python + FastAPI | 3.11 + 0.110+ | Async nativo, Pydantic v2, performance superior a Flask/Django |
| **ORM** | SQLAlchemy + aiosqlite | 2.0 | Migración desde 1.4; async obligatorio para FastAPI |
| **Migraciones** | Alembic | — | Autogenerate desde modelos SQLAlchemy |
| **Frontend** | React + TypeScript | 18 + 5.5 | Funcional + hooks, ecosistema maduro |
| **Bundler** | Vite | 5.4 | HMR rápido, mejor que Webpack para dev |
| **Estilos** | Tailwind CSS | 3.4 | Utility-first, shadcn/ui como base de componentes |
| **Estado server** | TanStack Query | 5 | Cache automático, invalidación, re-fetch |
| **Formularios** | React Hook Form + Zod | — | Validación type-safe, mínimo re-renders |
| **Grafo** | Neo4j Community | 5.26 | Libre, suficiente para el volumen actual |
| **Base de datos** | SQLite (aiosqlite) | 3 | Sin servidor, portable, zero-config |
| **Caché** | Redis | 5.0 (tporadowski) | Simple, rápido, Windows compatible |
| **Auth** | JWT (python-jose) + bcrypt | — | Stateless, estándar industry |
| **Rate limiting** | slowapi | 0.1.9+ | Integración nativa con FastAPI |
| **Logging** | loguru | — | Rotating files, más simple que stdlib logging |
| **Testing backend** | pytest + pytest-asyncio | — | Auto mode, fixtures, async nativo |
| **Testing frontend** | Vitest + happy-dom | — | Rápido, compatible Jest API |
| **CI/CD** | GitHub Actions | — | ubuntu-latest, Python 3.11, Node 20 |

### Decisiones técnicas clave

1. **Sin Docker** — Todos los servicios se instalan nativamente en Windows 10. Razón: entorno de desarrollo controlado, sin overhead de virtualización.
2. **Dual database** — SQLite para datos relacionales, Neo4j para el grafo de conocimiento. Cada uno optimizado para su caso de uso.
3. **Async everywhere** — SQLAlchemy async, FastAPI async, Neo4j async driver. Consistencia en el patrón de concurrencia.
4. **Pydantic v2** — Migración desde v1 para mejor rendimiento (Rust core) y type inference.
5. **shadcn/ui** — Componentes copiados al proyecto (no librería), control total sobre estilos.
6. **Ruff** — Linting Python más rápido que flake8+isort+black. Reglas: E,F,W,I,N,UP,B,SIM.
7. **Vitest** — Reemplazo de Jest para mejor compatibilidad con Vite y ESM.

## Requisitos del sistema

| Requisito | Versión mínima | Ubicación en tools/ |
|---|---|---|
| Sistema operativo | Windows 10 Pro (build 18362+) | — |
| RAM | 8 GB | — |
| Python | 3.11 | `tools/python/` (opcional) |
| Node.js | 20 LTS | `tools/nodejs/node-v20.18.3-win-x64/` |
| SQLite | 3 | `backend/observatorio.db` |
| Neo4j | 5 Community | `tools/neo4j/neo4j-community-5.26.0/` |
| Redis | 5.0 | `tools/redis/` |
| Java | JDK 17 | `tools/java/jdk-17.0.19+10/` |

## Inicio rápido (Windows nativo)

```powershell
# 1. Clonar el repositorio
git clone https://github.com/ThryCode/observatorio-tecnologico-industrial.git
cd observatorio-tecnologico-industrial

# 2. Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Si falla por execution policy:
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# 3. Migraciones
alembic upgrade head

# 4. Iniciar backend
uvicorn app.main:app --reload --port 8000

# 5. Frontend (otra terminal)
cd frontend
npm install
npm run dev                    # Requiere Node 20 LTS
```

> **Si `venv\Scripts\activate` falla** por execution policy de PowerShell, usa directamente:
> ```powershell
> .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
> ```

### Credenciales por defecto

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin@mindus.gob.cu` | `admin123` | Admin MINDUS (superuser) |

> **Importante:** Después del primer pull con la migración 0003, ejecuta `alembic upgrade head`. Si el admin queda con `status=pending`, actualiza manualmente:
> ```sql
> UPDATE users SET status = 'approved' WHERE role = 'admin_mindus';
> ```

## Servicios y puertos

| Puerto | Servicio | URL | Credenciales |
|---|---|---|---|
| 7687 | Neo4j Bolt | `localhost` | Sin auth (dev) |
| 7474 | Neo4j Browser | http://localhost:7474 | Sin auth (dev) |
| 6379 | Redis | `localhost` | Sin contraseña |
| 8000 | Backend API | http://localhost:8000/docs | JWT (vía `/auth/login`) |
| 5173 | Frontend (dev) | http://localhost:5173 | — |

### Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/health` | No | Health check (DB, Neo4j, Redis) |
| `POST` | `/api/v1/auth/register/public` | No | Registro público (status=pending) |
| `POST` | `/api/v1/auth/login` | No | Login → JWT token |
| `GET` | `/api/v1/auth/me` | Si | Datos del usuario actual |
| `GET` | `/api/v1/auth/pending` | Superuser | Lista usuarios pendientes |
| `POST` | `/api/v1/auth/{id}/approve` | Superuser | Aprobar usuario |
| `POST` | `/api/v1/auth/{id}/reject` | Superuser | Rechazar usuario con motivo |
| `GET/POST` | `/api/v1/technologies` | Si | CRUD tecnologías |
| `GET/POST` | `/api/v1/patents` | Si | CRUD patentes |
| `GET/POST` | `/api/v1/organizations` | Si | CRUD organizaciones |
| `GET/POST` | `/api/v1/indicators` | Si | CRUD indicadores |
| `GET/POST` | `/api/v1/regulations` | Si | CRUD normativas |
| `GET/POST` | `/api/v1/industrial-sectors` | Si | CRUD sectores industriales |
| `GET/POST` | `/api/v1/alerts` | Si | CRUD alertas |
| `DELETE` | `/api/v1/alerts/{id}` | Si | Eliminar alerta |
| `PATCH` | `/api/v1/alerts/{id}/read` | Si | Marcar alerta como leída |
| `GET/POST` | `/api/v1/bulletins` | Si | CRUD boletines |
| `GET` | `/api/v1/competitiveness` | Si | Índices de competitividad |
| `GET` | `/api/v1/dashboard/summary` | Si | Resumen del dashboard |
| `GET` | `/api/v1/dashboard/timeline` | Si | Línea de tiempo del dashboard |
| `POST` | `/api/v1/follows/organizations/{id}` | Si | Seguir organización |
| `DELETE` | `/api/v1/follows/organizations/{id}` | Si | Dejar de seguir |
| `GET` | `/api/v1/follows/status/{org_id}` | Si | Estado de seguimiento |
| `GET` | `/api/v1/patent-maps` | Si | Mapas de patentes |
| `GET` | `/api/v1/professionals` | Si | Listar profesionales |
| `GET` | `/api/v1/professionals/specialties` | Si | Listar especialidades |
| `GET/PUT` | `/api/v1/professionals/me` | Si | Perfil propio |
| `GET/PUT/DELETE` | `/api/v1/users/{id}` | Superuser | CRUD usuarios |
| `POST` | `/api/v1/graph/sync` | Superuser | Sincronizar grafo Neo4j |
| `GET` | `/api/v1/graph/search` | Si | Buscar en el grafo |
| `GET` | `/api/v1/graph/stats` | Si | Estadísticas del grafo |

## Flujo de registro y aprobación

```
Usuario público                Sistema                    Administrador
     │                            │                            │
     │  POST /register/public     │                            │
     │  (account_type, username,  │                            │
     │   email, password, etc.)   │                            │
     │───────────────────────────►│                            │
     │                            │  status = "pending"        │
     │  "Registro enviado"        │                            │
     │◄───────────────────────────│                            │
     │                            │                            │
     │                            │  GET /auth/pending         │
     │                            │◄───────────────────────────│
     │                            │  [lista de pendientes]     │
     │                            │───────────────────────────►│
     │                            │                            │
     │                            │  POST /auth/{id}/approve   │
     │                            │◄───────────────────────────│
     │                            │  status = "approved"       │
     │                            │                            │
     │  Login exitoso             │                            │
     │◄───────────────────────────│                            │
```

## Estructura del proyecto

```
.
├── backend/
│   ├── app/
│   │   ├── api/v1/              # Endpoints REST (todos bajo /api/v1/)
│   │   │   ├── auth.py          # Login, registro, aprobación
│   │   │   ├── health.py        # Health check (DB, Neo4j, Redis)
│   │   │   ├── patents.py       # CRUD patentes
│   │   │   ├── technologies.py  # CRUD tecnologías
│   │   │   ├── organizations.py # CRUD organizaciones
│   │   │   ├── indicators.py    # CRUD indicadores
│   │   │   ├── regulations.py   # CRUD normativas
│   │   │   ├── industrial_sectors.py
│   │   │   ├── graph.py         # Explorador de grafo
│   │   │   ├── users.py         # Gestión de usuarios
│   │   │   ├── alerts.py        # Alertas tempranas
│   │   │   ├── bulletins.py     # Boletines informativos
│   │   │   ├── competitiveness.py # Competitividad
│   │   │   ├── dashboard.py     # Dashboard endpoints
│   │   │   ├── follows.py       # Seguir organizaciones
│   │   │   ├── patent_maps.py   # Mapas de patentes
│   │   │   └── professionals.py # Perfiles profesionales
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic BaseSettings
│   │   │   ├── db.py            # Async SQLAlchemy engine
│   │   │   ├── security.py      # JWT + bcrypt
│   │   │   ├── exceptions.py    # AppException handler
│   │   │   ├── init_db.py       # Seed superuser
│   │   │   └── logging_config.py
│   │   ├── graph/
│   │   │   └── repository.py    # Cypher queries (APOC)
│   │   ├── models/              # SQLAlchemy ORM
│   │   ├── schemas/             # Pydantic v2 validation
│   │   ├── services/            # Business logic
│   │   │   ├── auth_service.py  # Auth + registration
│   │   │   └── cache.py         # Redis wrapper
│   │   ├── dependencies.py      # FastAPI DI (get_db, get_current_user)
│   │   ├── neo4j_client.py      # Neo4j driver factory
│   │   ├── redis_client.py      # Redis client factory
│   │   └── main.py              # FastAPI app + lifespan
│   ├── alembic/
│   │   └── versions/
│   │       └── bb25b3baf793_*.py  # Initial SQLite schema
│   ├──    tests/                   # pytest (544+ tests)
│   ├── requirements.txt
│   └── .env
├── frontend/
│   └── src/
│       ├── pages/               # Route pages (lazy loaded)
│       │   ├── Dashboard.tsx
│       │   ├── Login.tsx
│       │   ├── Register.tsx     # Registro público
│       │   ├── PendingApprovals.tsx  # Admin: aprobar/rechazar
│       │   ├── Organizations.tsx
│       │   ├── Patents.tsx
│       │   ├── Indicators.tsx
│       │   ├── Regulations.tsx
│       │   ├── GraphExplorer.tsx
│       │   └── Profile.tsx
│       ├── components/
│       │   ├── ui/              # shadcn/ui primitives
│       │   ├── Layout.tsx       # Sidebar + Header + Outlet
│       │   ├── Sidebar.tsx      # Nav (Solicitudes solo superuser)
│       │   ├── Header.tsx
│       │   └── ProtectedRoute.tsx
│       ├── hooks/               # TanStack Query hooks
│       ├── api/                 # Axios API clients
│       │   ├── client.ts        # Axios + interceptors
│       │   └── auth.ts          # login, register, approve, reject
│       ├── contexts/
│       │   └── AuthContext.tsx   # Auth state + localStorage
│       ├── types/
│       │   └── index.ts         # TypeScript interfaces
│       ├── test/                # Vitest (116 tests, with coverage)
│       └── lib/utils.ts         # cn() utility
├── docs/
│   └── instalacion-windows.md
├── scripts/
│   ├── setup-env.ps1
│   ├── start-windows.ps1
│   └── stop-windows.ps1
├── .github/workflows/
│   └── ci.yml                   # Backend + Frontend CI
├── .env.example                 # Referencia de variables
├── .env.windows                 # Variables para Windows dev
├── AGENTS.md                    # Agent instructions (AI coding)
└── README.md
```

## Testing

```bash
# Backend (544+ tests)
cd backend
pytest -v

# Frontend (116 tests, with coverage)
cd frontend
npx vitest run
npx vitest run --coverage

# Lint backend
ruff check backend/

# Lint frontend
npx eslint src/
```

### Cobertura de tests

| Suite | Tests | Framework | Archivos |
|---|---|---|---|
| Auth | 12 | pytest | test_auth.py |
| Users | 7 | pytest | test_users.py |
| Technologies | 13 | pytest | test_technologies.py |
| Patents | 9 | pytest | test_patents.py |
| Organizations | 8 | pytest | test_organizations.py |
| Indicators | 10 | pytest | test_indicators.py |
| Regulations | 10 | pytest | test_regulations.py |
| Industrial Sectors | 8 | pytest | test_industrial_sectors.py |
| Validators | 10 | pytest | test_validators.py |
| Health | 1 | pytest | test_health.py |
| Graph | 11 | pytest | test_graph.py |
| Follows | 6 | pytest | test_follows.py |
| Alerts | 8 | pytest | test_alerts.py |
| Bulletins | 8 | pytest | test_bulletins.py |
| Competitiveness | 8 | pytest | test_competitiveness.py |
| Dashboard | 7 | pytest | test_dashboard.py |
| Patent Maps | 8 | pytest | test_patent_maps.py |
| Research Pubs | 9 | pytest | test_research_publications.py |
| Professionals | 4 | pytest | test_professionals.py |
| Audit Logs | 3 | pytest | test_audit_logs.py |
| WebSocket | 3 | pytest | test_ws.py |
| Uploads | 5 | pytest | test_uploads.py |
| Auth Register | 3 | pytest | test_auth_register.py |
| App render | 4 | Vitest | App.test.tsx |
| Button | 3 | Vitest | Button.test.tsx |
| Utils | 3 | Vitest | utils.test.ts |
| Graph Nav | 9 | Vitest | graphNav.test.ts |
| API clients | 48 | Vitest | api-clients.test.ts |
| Hooks | 19 | Vitest | hooks.test.tsx |
| **Total** | **544+** | | |

## Cómo contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para guía completa de contribución.
- Reporta bugs y solicita features en [GitHub Issues](https://github.com/ThryCode/observatorio-tecnologico-industrial/issues)
- Revisa [SECURITY.md](SECURITY.md) para reportar vulnerabilidades
- Sigue el [código de conducta](CODE_OF_CONDUCT.md)
- Revisa [SUPPORT.md](SUPPORT.md) para recursos de ayuda

## Integración Continua

Este proyecto usa GitHub Actions para CI. El workflow `.github/workflows/ci.yml` ejecuta:

| Job | Comandos |
|-----|----------|
| **backend** | `ruff check`, `pytest -v` (SQLite, no external DB required) |
| **frontend** | `npm run lint`, `npm test`, `npm run build` |

El badge de estado está en la parte superior del README.

### Notas de CI
- Usa `python3` (no `python`) en comandos CI
- `TESTING=1` deshabilita rate limiting en tests
- `pytest-timeout` NO está instalado — no usar `--timeout`
- Neo4j y Redis son opcionales en tests (aceptan 503)

## Documentación adicional

| Documento | Descripción |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Arquitectura del sistema con diagrama Mermaid |
| [`docs/instalacion-windows.md`](docs/instalacion-windows.md) | Instalación nativa en Windows paso a paso |
| [`docs/production-guide.md`](docs/production-guide.md) | Guía de deploy en producción |
| [`docs/backup-recovery.md`](docs/backup-recovery.md) | Backup y recuperación de datos |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Guía de contribución |
| [`SECURITY.md`](SECURITY.md) | Política de seguridad |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Código de conducta |
| [`SUPPORT.md`](SUPPORT.md) | Recursos de soporte |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de cambios |
| [`AGENTS.md`](AGENTS.md) | Instrucciones para desarrollo asistido por AI |

## Convenciones de código

### Backend (Python)
- Type hints en todas las funciones
- Async/await en todas las operaciones de BD
- Pydantic v2 para todos los schemas
- `AppException` para errores custom
- `PaginatedResponse[T]` para listas
- Loguru para logging (no print/logging stdlib)
- Ruff: `select = ["E","F","W","I","N","UP","B","SIM"]`

### Frontend (TypeScript)
- Strict mode
- Path alias `@/` → `./src/`
- Funcional components + forwardRef para UI primitives
- Tailwind CSS exclusivamente (no CSS modules, no inline styles)
- `cn()` utility para clases condicionales
- TanStack Query para toda data del server
- `React.lazy()` + `Suspense` para code splitting por ruta

### Naming
- Código en inglés
- Campos de dominio en español (nombre, siglas, tipo, etc.)
- Endpoints en inglés (`/auth/login`, `/technologies`)

## Migraciones

```bash
# Crear nueva migración
cd backend
alembic revision --autogenerate -m "descripción"

# Aplicar pendientes
alembic upgrade head

# Rollback último paso
alembic downgrade -1
```

> **NUNCA** editar un archivo de migración ya commiteado.

## Issues conocidos

- Sin branch protection en GitHub (ver `.github/PULL_REQUEST_TEMPLATE.md`)

## Licencia

Este proyecto se desarrolla bajo la rectoría del **Ministerio de Industrias de Cuba (MINDUS)**. Todos los derechos reservados.

---

> **Nota sobre infraestructura:** Este proyecto **no usa Docker** en ninguna circunstancia. Todos los servicios (SQLite, Neo4j, Redis, Python, Node.js) se instalan y ejecutan directamente en Windows 10 de forma nativa. No existen archivos Dockerfile, docker-compose ni configuración de contenedores.
