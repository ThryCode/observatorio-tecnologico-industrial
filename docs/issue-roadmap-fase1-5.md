# Roadmap: Fase 0-5 — Seguridad + Backend + Frontend + Graph + Tests

> **Labels:** `enhancement`, `roadmap`, `priority:critical`
> **Generado por:** 6 agentes especializados (security-auditor, backend-coder, frontend-coder, graph-explorer, code-reviewer, test-writer)

---

## FASE 0 — Seguridad (CRITICO)

### [CRITICAL] Credenciales hardcodeadas en source
- [ ] `app/core/config.py:18` — Eliminar default `secret_key`. Hacer campo requerido sin default.
- [ ] `app/core/config.py:23` — Eliminar default `first_superuser_password = admin`. Generar random en primera ejecucion.
- [ ] `app/core/config.py:13-17` — Eliminar defaults de database_url, neo4j_password, redis_url (usan hostnames Docker).
- [ ] Cambiar defaults de URLs a `localhost` (proyecto NO usa Docker).

### [HIGH] Endpoint de registro abierto
- [ ] `app/api/v1/auth.py` — Agregar `Depends(get_current_user)` o rate limiting al registro.
- [ ] `app/schemas/user.py:14` — Eliminar campo `role` de `UserCreate`. Default `visitante` en service.

### [HIGH] ReDoS en busqueda Cypher
- [ ] `app/graph/repository.py:25` — Reemplazar regex con `CONTAINS` parametrizado o escapar con `re.escape()`.

### [HIGH] .env en repositorio
- [ ] Mover `backend/.env` fuera del repo. Verificar `.gitignore` lo excluye.

### [MEDIUM] Graph endpoints sin autenticacion
- [ ] `app/api/v1/graph.py` — Agregar `Depends(get_current_user)` a los 3 endpoints.

### [MEDIUM] Sin rate limiting en auth
- [ ] Instalar `slowapi`: login 10/min/IP, register 3/hora/IP.

### [MEDIUM] CORS excesivamente permisivo
- [ ] `app/main.py:57-58` — Restringir methods y headers.

### [MEDIUM] JWT expone username
- [ ] `app/services/auth_service.py:46` — Eliminar `username` del payload JWT.

### [LOW] Validation handler filtra input
- [ ] `app/core/exceptions.py:38` — Eliminar campo `input` de la respuesta.

---

## FASE 1 — Backend Completitud

### 1.1 Bugs en Services (update() sin refresh())
- [ ] `app/services/user_service.py`
- [ ] `app/services/regulation_service.py`
- [ ] `app/services/patent_service.py`
- [ ] `app/services/organization_service.py`
- [ ] `app/services/industrial_sector_service.py`
- [ ] `app/services/indicator_service.py`

### 1.2 Schemas
- [ ] `app/schemas/organization.py` — Agregar Field constraints a OrganizationCreate.

### 1.3 Graph endpoints
- [ ] `app/api/v1/graph.py` — Agregar response_model a los 3 endpoints.
- [ ] Agregar type hints al param `neo4j`.

### 1.4 Codigo muerto
- [ ] Eliminar `app/database.py`
- [ ] Eliminar `app/config.py`

### 1.5 init_db double commit
- [ ] `app/core/init_db.py` — Eliminar commit interno.

### 1.6 Ruff sin reglas
- [ ] `backend/pyproject.toml` — Agregar `select = ["E","F","W","I","N","UP","B","SIM"]`

### 1.7 Type hints
- [ ] `app/core/exceptions.py:13` — `app: FastAPI`
- [ ] `app/core/db.py:16` — `-> None`
- [ ] Todos los services — return type en `list()`

### 1.8 Refactoring (opcional)
- [ ] Crear `app/services/base.py` generico
- [ ] `PaginatedResponse.from_query()` helper

---

## FASE 2 — Frontend

### 2.1 Tipos TypeScript (7 nuevos)
- [ ] `Indicator`, `IndicatorPeriod`, `Regulation`, `RegulationCategory`, `Technology`, `IndustrialSector`, `GraphNode/Edge/Stats`

### 2.2 API Clients (5 archivos nuevos)
- [ ] `src/api/indicators.ts`
- [ ] `src/api/regulations.ts`
- [ ] `src/api/technologies.ts`
- [ ] `src/api/industrialSectors.ts`
- [ ] `src/api/graph.ts`

### 2.3 Hooks (4 archivos nuevos)
- [ ] `src/hooks/useIndicators.ts`
- [ ] `src/hooks/useRegulations.ts`
- [ ] `src/hooks/useTechnologies.ts`
- [ ] `src/hooks/useGraph.ts`

### 2.4 Paginas (3 nuevas)
- [ ] `src/pages/Indicators.tsx`
- [ ] `src/pages/Regulations.tsx`
- [ ] `src/pages/GraphExplorer.tsx`

### 2.5 Routing
- [ ] `src/App.tsx` — Agregar 3 rutas faltantes.

### 2.6 Dashboard real
- [ ] `src/components/KPIs.tsx` — API-driven
- [ ] `src/components/GraficoPatentes.tsx` — API-driven
- [ ] `src/components/AlertasTable.tsx` — API-driven

### 2.7 Calidad
- [ ] isError handling en Organizations.tsx y Patents.tsx
- [ ] React ErrorBoundary
- [ ] `cn()` en KPIs.tsx
- [ ] React Router Navigate en Login.tsx
- [ ] Configurar ESLint

---

## FASE 3 — Knowledge Graph

### 3.1 Alineacion de esquemas
- [ ] Renombrar Company → Organization en Neo4j
- [ ] Agregar nodo IndustrialSector
- [ ] Agregar propiedades faltantes a cada nodo
- [ ] Agregar relaciones FK de PG que faltan en Neo4j

### 3.2 Sincronizacion PG → Neo4j
- [ ] Script/endpoint `POST /graph/sync`
- [ ] Ejecutar post-migracion

### 3.3 Repository mejoras
- [ ] Fix type hint AsyncGraphDatabase → AsyncDriver
- [ ] Verificar APOC antes de usar
- [ ] Endpoint shortest path
- [ ] Paginacion en search

### 3.4 Seguridad graph
- [ ] Autenticacion en endpoints
- [ ] Sanitizar input
- [ ] Limitar depth

---

## FASE 4 — Tests

### 4.1 Archivos nuevos (~8 tests)
- [ ] `tests/test_users.py`
- [ ] `tests/test_organizations.py`

### 4.2 Tests faltantes (~38 tests)
- [ ] `test_patents.py` — 8 tests
- [ ] `test_regulations.py` — 9 tests
- [ ] `test_indicators.py` — 8 tests
- [ ] `test_graph.py` — 3 tests

### 4.3 Target
- [ ] 100% CRUD coverage
- [ ] All auth paths tested
- [ ] All error cases (404, 422, 401, 403)

---

## FASE 5 — DevOps

- [ ] Habilitar reglas Ruff
- [ ] GitHub Actions CI
- [ ] .env.example con placeholders reales
- [ ] Frontend code splitting
- [ ] Redis caching
- [ ] DB indexes adicionales
- [ ] Logging con loguru/structlog

---

## Estadisticas

| Metrica | Actual | Necesario |
|---------|--------|-----------|
| API Endpoints | 38 | 38+ (dashboard stats) |
| Models | 7 | 7 |
| Tests | 46 | ~92 |
| Frontend Pages | 5 | 8 |
| Frontend Hooks | 3 | 7 |
| API Clients | 4 | 9 |
| TS Types | 8 | 15 |
| Security Issues | 13 | 0 |
