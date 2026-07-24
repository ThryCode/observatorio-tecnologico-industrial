# Épico: Roadmap de Estabilización y Mejora Continua

**Etiquetas:** `epic`, `roadmap`
**Hito:** Q3 2026
**Dependencias:** Ninguna (épico raíz)

---

## Descripción

Este épico agrupa todas las tareas necesarias para llevar el proyecto de su estado actual a un nivel de producción. Se organiza en 4 fases secuenciales, cada una con issues independientes y desplegables.

## Estado Actual del Proyecto

- ✅ Backend: 12 routers, 10 modelos, 9 servicios, 4 migraciones Alembic
- ✅ Frontend: 17 páginas (lazy-loaded), 20 componentes, 7 hooks TanStack Query
- ✅ Neo4j + Redis integrados con tolerancia a fallos
- ❌ `.env` committed sin `DATABASE_URL` (bloquea arranque)
- ❌ `create_all` en `db.py` bypassea Alembic
- ❌ Sin CI/CD
- ❌ Professionals API embebido en `auth.ts` (frontend)
- ❌ Cobertura de tests incompleta
- ❌ Sin seed data para entidades principales
- ❌ Sin documentación de deploy/backup

## Fases

### 🔴 Fase 0 — Estabilización (Prioridad Crítica)
| Issue | Título | Depende de |
|-------|--------|------------|
| #01 | Fix .env: unificar variable DATABASE_URL | — |
| #02 | Hacer Alembic el único mecanismo de migración | — |
| #03 | Fix migration 0004: UUID server_default | — |
| #04 | Fix código muerto en graph/repository.py | — |
| #05 | CI/CD: GitHub Actions workflow | — |

### 🟡 Fase 1 — Calidad
| Issue | Título | Depende de |
|-------|--------|------------|
| #06 | Seed data para entidades principales | #02 |
| #07 | Separar professionals API/hooks de auth | — |
| #08 | Refactor Network y Profile con hooks dedicados | #07 |
| #09 | Backend tests faltantes | #02, #04 |

### 🔵 Fase 2 — Paridad Frontend-Backend
| Issue | Título | Depende de |
|-------|--------|------------|
| #10 | Estructurar mock data para páginas sin backend | — |
| #11 | Backend: modelo Alert + CRUD | #06 |
| #12 | Backend: endpoints de resumen para Dashboard | #06 |

### 🟢 Fase 3 — Producción
| Issue | Título | Depende de |
|-------|--------|------------|
| #13 | Frontend test infrastructure + tests | #07, #08 |
| #14 | Branch protection + PR template | — |
| #15 | Documentación de deploy y backup | — |
| #16 | Fix setup-env.ps1 | — |
| #17 | Actualizar README.md | #15 |

---

## Cómo usar este épico

1. Cada issue tiene una **especificación completa** con archivos, código y criterios de aceptación
2. Los issues de una fase se pueden trabajar en **paralelo** si no tienen dependencias entre sí
3. Cada issue puede ser asignado a un desarrollador o a un subagente de opencode
4. Al completar un issue, marcar como done y actualizar la referencia aquí
