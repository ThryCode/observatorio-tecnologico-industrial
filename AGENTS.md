# Observatorio Tecnologico Industrial - Agent Instructions

## Project Overview
Plataforma SaaS de inteligencia estrategica para el MINDUS (Ministerio de Industries). Monitorea tendencias globales en ciencia, tecnologia e innovacion para sectores industriales cubanos. Dual database: PostgreSQL (relational) + Neo4j (knowledge graph).

## Tech Stack
- **Backend:** Python 3.11, FastAPI >=0.110, SQLAlchemy 2.0 (async), Alembic, Pydantic v2
- **Frontend:** React 18, TypeScript 5.5, Vite 5.4, Tailwind 3.4, TanStack Query 5
- **Databases:** PostgreSQL 15, Neo4j 5 Community, Redis 5.0
- **Testing:** pytest + pytest-asyncio (backend)
- **Linting:** Ruff (backend, line-length=120, target py311), ESLint (frontend)

## Setup Commands
```bash
# Backend
cd backend && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev

# Tests
cd backend && pytest -v

# Lint
ruff check backend/
npm run lint
```

## Architecture
```
backend/app/
  api/v1/         - REST endpoints (all under /api/v1/)
  services/       - Business logic layer
  models/         - SQLAlchemy ORM models
  schemas/        - Pydantic v2 validation
  core/           - Config, security, DB setup
  graph/          - Neo4j Cypher queries

frontend/src/
  pages/          - Route pages
  components/     - Reusable components
  hooks/          - TanStack Query hooks
  api/            - Axios API clients
  contexts/       - React Context providers
  types/          - TypeScript interfaces
```

## Code Conventions
- Python: type hints everywhere, async/await, Pydantic v2 schemas
- TypeScript: strict mode, path alias `@/` -> `./src/`
- Components: functional + forwardRef for UI primitives
- CSS: Tailwind only, use `cn()` utility for class merging
- Naming: English code, Spanish domain fields (nombre, siglas, tipo)
- Services: instantiated per-request, not via DI

## Three-Tier Boundaries

### Always do
- Use async SQLAlchemy for all DB operations
- Use Pydantic v2 for all API schemas
- Handle errors with `AppException` class
- Run `ruff check backend/` before committing backend
- Run `npm run lint` before committing frontend
- Use `PaginatedResponse[T]` wrapper for list endpoints
- Use parameterized Cypher queries (never string concat)

### Ask first
- Run database migrations (`alembic upgrade/downgrade`)
- Add new Python/Node dependencies
- Modify authentication or authorization flow
- Create new database models or columns
- Change Neo4j graph schema (node labels, relationships)
- Modify CORS or security settings

### Never do
- Commit `.env` files or secrets
- Hardcode API keys or passwords
- Use sync DB operations in async context
- Edit committed migration files
- Use `console.log` in production frontend
- Skip error handling in API endpoints
- Use string concatenation for Cypher queries
- Import from `node_modules` directly in source
