# Comentario para Issue #2 — Actualización post-Fase 0-5

Copia y pega esto como comentario en el Issue #2:

---

## Actualización post Roadmap Fase 0-5 (commits `4a07b3e` → `ad577f4`)

### ✅ Items RESUELTOS por el roadmap

| Eje | Auditoría | Estado |
|-----|-----------|--------|
| **Infraestructura 2/10** | CI/CD no funcional | ✅ GitHub Actions funcionando (backend: ruff+89 tests, frontend: build) |
| **Desarrollo 6/10** | Nunca ejecutada de punta a punta | ✅ PostgreSQL, Backend, Frontend, Redis, Neo4j todos corriendo. Login real funciona. |
| **Desarrollo 6/10** | Sin frontend testing | ⚠️ Parcial — frontend build pasa en CI, tests aún pendientes |
| **Infraestructura 2/10** | Loguru no configurado | ✅ `logging_config.py` con loguru, archivos rotativos, wired en lifespan |
| **Infraestructura 2/10** | GitHub Actions roto | ✅ Workflow funcional en `ubuntu-latest` (sin Docker) |
| **Calidad 5/10** | Tests no corren | ✅ 89 tests pasando con PostgreSQL real en CI |
| **Calidad 5/10** | Sin code splitting | ✅ React.lazy + Suspense + manualChunks en Vite |
| **Calidad 5/10** | Sin Redis caching | ✅ `cache.py` + IndicatorService con cache + invalidación |
| **Calidad 5/10** | Sin DB indexes | ✅ 23 índices (7 FK + 16 filtered) en migración 0002 |
| **Calidad 5/10** | Ruff sin reglas | ✅ Reglas E,F,W,I,N,UP,B,SIM habilitadas |
| **DevOps** | Dependencias frontend bloqueadas | ✅ `npm ci` funciona, frontend build OK |
| **Seguridad** | Credenciales hardcodeadas | ✅ Defaults eliminados de Settings, campo requerido |

### ❌ Items PENDIENTES (priorizados)

| Prioridad | Item | Esfuerzo | Notas |
|-----------|------|----------|-------|
| 🔴 ALTA | `/api/v1/health` endpoint | 2h | Verificar PG + Neo4j + Redis |
| 🔴 ALTA | Rate limiting (slowapi) | 4h | Auth endpoints: login 10/min, register 3/hora |
| 🟡 MEDIA | `.env` fuera del repo | 1h | Mover a solo `.env.example` tracked |
| 🟡 MEDIA | Frontend tests (Vitest) | 2-3d | Smoke tests mínimos |
| 🟡 MEDIA | GitHub branch protection | 0.5d | PRs obligatorios para main |
| 🟡 MEDIA | Deployment strategy doc | 1d | ¿Servidor Windows? ¿VM? |
| 🟢 BAJA | Backup procedures PG/Neo4j | 1d | pg_dump + neo4j-admin |
| 🟢 BAJA | npm audit + pip-audit | 0.5d | Dependency security |
| 🟢 BAJA | setup-env.ps1 rewrite | 0.5d | Script actual tiene errores |
| 🟢 BAJA | ADR para decisiones arquitectónicas | 0.5d | Dual DB, no-Docker |

### 📊 Métricas actualizadas

| Métrica | Antes (auditoría) | Ahora |
|---------|-------------------|-------|
| Tests backend | 46 (no corrían) | 89 (pasando en CI) |
| Frontend pages | 5 | 8 |
| Frontend hooks | 3 | 7 |
| API clients | 4 | 9 |
| TS types | 8 | 15 |
| Security issues | 13 | ~4 (rate limiting, .env, health, backups) |
| CI status | ❌ Roto | ✅ Verde |
| Services running | 0/3 | 3/3 (PG, Neo4j, Redis) |

### Conclusión

El proyecto pasó de **"en riesgo"** a **"funcional con deuda técnica"**. La base de código está completa y operativa. Los items pendientes son de proceso/equipo, no de funcionalidad bloqueante.
