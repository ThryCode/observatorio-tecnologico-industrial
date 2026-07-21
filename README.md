# Observatorio Tecnológico Industrial

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Neo4j](https://img.shields.io/badge/Neo4j-5-008CC1?style=flat&logo=neo4j&logoColor=white)](https://neo4j.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![CI](https://github.com/ThryCode/observatorio-tecnologico-industrial/actions/workflows/ci.yml/badge.svg)](https://github.com/ThryCode/observatorio-tecnologico-industrial/actions)

> Plataforma de vigilancia tecnológica y competitividad industrial para el Ministerio de Industrias de Cuba (MINDUS).

---

## Propósito

El Observatorio Tecnológico Industrial es un sistema de inteligencia estratégica que opera como servicio digital (SaaS) bajo la rectoría del MINDUS. Su propósito es monitorear, analizar y evaluar tendencias globales en ciencia, tecnología e innovación aplicadas a las industrias rectoradas del país.

## Funcionalidades

- **Grafo de conocimiento industrial** — Modela relaciones entre tecnologías, empresas, patentes, normativas e indicadores usando Neo4j con APOC y GDS.
- **Análisis de patentes** — Registro, búsqueda y clasificación de patentes por sector tecnológico y país.
- **Vigilancia normativa** — Seguimiento de leyes, decretos, resoluciones y normas del ecosistema industrial.
- **Indicadores sectoriales** — Dashboard de indicadores industriales con soporte multiperíodo (mensual, trimestral, anual).
- **Alertas tempranas** — Motor de reglas sobre el grafo de conocimiento para detectar cambios relevantes.
- **Recomendaciones CTI** — Sugerencias de colaboración entre entidades basadas en el análisis del grafo.
- **Registro de usuarios** — Solicitud pública con aprobación/rechazo por administrador.
- **Sistema de roles** — Admin MINDUS, representante CTI, analista, visitante con permisos diferenciados.
- **Health check** — Endpoint `/api/v1/health` verifica estado de PostgreSQL, Neo4j y Redis.
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
        │PostgreSQL│ │ Redis  │ │Adminer │
        │  15      │ │ 5      │ │(GUI)   │
        └──────────┘ └────────┘ └────────┘
```

## Stack tecnológico

| Capa | Tecnología | Versión | Decisión |
|---|---|---|---|
| **Backend** | Python + FastAPI | 3.11 + 0.110+ | Async nativo, Pydantic v2, performance superior a Flask/Django |
| **ORM** | SQLAlchemy + asyncpg | 2.0 | Migración desde 1.4; async obligatorio para FastAPI |
| **Migraciones** | Alembic | — | Autogenerate desde modelos SQLAlchemy |
| **Frontend** | React + TypeScript | 18 + 5.5 | Funcional + hooks, ecosistema maduro |
| **Bundler** | Vite | 5.4 | HMR rápido, mejor que Webpack para dev |
| **Estilos** | Tailwind CSS | 3.4 | Utility-first, shadcn/ui como base de componentes |
| **Estado server** | TanStack Query | 5 | Cache automático, invalidación, re-fetch |
| **Formularios** | React Hook Form + Zod | — | Validación type-safe, mínimo re-renders |
| **Grafo** | Neo4j Community | 5.26 | Libre, suficiente para el volumen actual |
| **Base de datos** | PostgreSQL | 15 | JSONB, extensions, madurez |
| **Caché** | Redis | 5.0 (tporadowski) | Simple, rápido, Windows compatible |
| **Auth** | JWT (python-jose) + bcrypt | — | Stateless, estándar industry |
| **Rate limiting** | slowapi | 0.1.9+ | Integración nativa con FastAPI |
| **Logging** | loguru | — | Rotating files, más simple que stdlib logging |
| **Testing backend** | pytest + pytest-asyncio | — | Auto mode, fixtures, async nativo |
| **Testing frontend** | Vitest + happy-dom | — | Rápido, compatible Jest API |
| **CI/CD** | GitHub Actions | — | ubuntu-latest, Python 3.11, Node 20 |

### Decisiones técnicas clave

1. **Sin Docker** — Todos los servicios se instalan nativamente en Windows 10. Razón: entorno de desarrollo controlado, sin overhead de virtualización.
2. **Dual database** — PostgreSQL para datos relacionales, Neo4j para el grafo de conocimiento. Cada uno optimizado para su caso de uso.
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
| PostgreSQL | 15 | `tools/postgresql/pgsql/bin/` |
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

# 3. Migraciones (requiere PostgreSQL corriendo)
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
| 5432 | PostgreSQL | `localhost` | `observatorio` / `observatorio_dev` |
| 7687 | Neo4j Bolt | `localhost` | Sin auth (dev) |
| 7474 | Neo4j Browser | http://localhost:7474 | Sin auth (dev) |
| 6379 | Redis | `localhost` | Sin contraseña |
| 8000 | Backend API | http://localhost:8000/docs | JWT (vía `/auth/login`) |
| 5173 | Frontend (dev) | http://localhost:5173 | — |

### Endpoints principales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/health` | No | Health check (PG, Neo4j, Redis) |
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
| `POST` | `/api/v1/graph/sync` | Superuser | Sincronizar grafo Neo4j |

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
│   │   │   ├── health.py        # Health check (PG, Neo4j, Redis)
│   │   │   ├── patents.py       # CRUD patentes
│   │   │   ├── technologies.py  # CRUD tecnologías
│   │   │   ├── organizations.py # CRUD organizaciones
│   │   │   ├── indicators.py    # CRUD indicadores
│   │   │   ├── regulations.py   # CRUD normativas
│   │   │   ├── industrial_sectors.py
│   │   │   ├── graph.py         # Explorador de grafo
│   │   │   └── users.py         # Gestión de usuarios
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
│   │       ├── 0001_*.py        # Schema inicial
│   │       ├── 0002_*.py        # Performance indexes
│   │       └── 0003_*.py        # User registration fields
│   ├── tests/                   # pytest (90 tests)
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
│       ├── test/                # Vitest (10 tests)
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
# Backend (90 tests)
cd backend
pytest -v

# Frontend (10 tests)
cd frontend
npx vitest run

# Lint backend
ruff check backend/

# Lint frontend (requiere eslint config — pendiente)
npx eslint src/
```

### Cobertura de tests

| Suite | Tests | Framework | Archivos |
|---|---|---|---|
| Auth | 10 | pytest | test_auth.py |
| Users | 5 | pytest | test_users.py |
| Technologies | 15 | pytest | test_technologies.py |
| Patents | 12 | pytest | test_patents.py |
| Organizations | 10 | pytest | test_organizations.py |
| Indicators | 8 | pytest | test_indicators.py |
| Regulations | 8 | pytest | test_regulations.py |
| Industrial Sectors | 8 | pytest | test_industrial_sectors.py |
| Validators | 10 | pytest | test_validators.py |
| Health | 1 | pytest | test_health.py |
| Graph | 3 | pytest | test_graph.py |
| App render | 1 | Vitest | App.test.tsx |
| Button | 3 | Vitest | Button.test.tsx |
| Utils | 3 | Vitest | utils.test.tsx |
| **Total** | **100** | | |

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

- **Trigger:** push y PR a `main`
- **Backend job:** PostgreSQL 15 service container, Python 3.11, `pytest -v`
- **Frontend job:** Node 20, `npx vitest run`
- **Env vars:** `DATABASE_URL`, `NEO4J_PASSWORD`, `SECRET_KEY`, `FIRST_SUPERUSER_PASSWORD`, `TESTING=1`

### Notas de CI
- Usa `python3` (no `python`) en comandos CI
- `TESTING=1` deshabilita rate limiting en tests
- `pytest-timeout` NO está instalado — no usar `--timeout`
- Neon4j y Redis son opcionales en tests (aceptan 503)

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

## Conocido pendiente

- `.env` está commiteado (debería ser solo `.env.example`)
- `setup-env.ps1` tiene errores de sintaxis
- No hay branch protection ni PR reviews en GitHub
- No hay estrategia de deployment documentada
- No hay procedimientos de backup para PG/Neo4j
- Frontend no tiene eslint config (`eslint.config.js`)
- `pytest-timeout` no está en requirements

## Licencia

Este proyecto se desarrolla bajo la rectoría del **Ministerio de Industrias de Cuba (MINDUS)**. Todos los derechos reservados.

---

> **Nota sobre infraestructura:** Este proyecto **no usa Docker** en ninguna circunstancia. Todos los servicios (PostgreSQL, Neo4j, Redis, Python, Node.js) se instalan y ejecutan directamente en Windows 10 de forma nativa. No existen archivos Dockerfile, docker-compose ni configuración de contenedores.
