# F0-05: CI/CD — GitHub Actions Workflow

**Etiquetas:** `fase-0`, `critico`, `devops`, `ci-cd`
**Hito:** Fase 0 — Estabilización
**Depende de:** Ninguna
**Subagente:** `docs-writer`

---

## Descripción

No existe ningún workflow de CI/CD. El README muestra un badge de CI roto (`https://github.com/ThryCode/observatorio-tecnologico-industrial/actions/workflows/ci.yml/badge.svg`) que apunta a un archivo que no existe. Se necesita crear el workflow para:

1. Ejecutar lint + tests automáticamente en cada push/PR a main
2. Verificar que backend y frontend compilan correctamente

## Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `.github/workflows/ci.yml` | Workflow CI principal |

## Especificación técnica

### Workflow: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: observatorio_test
          POSTGRES_USER: observatorio
          POSTGRES_PASSWORD: observatorio_dev
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install -r backend/requirements.txt

      - name: Lint
        run: ruff check backend/

      - name: Test
        working-directory: backend
        env:
          DATABASE_URL: >-
            postgresql+asyncpg://observatorio:observatorio_dev@localhost:5432/observatorio_test
          SECRET_KEY: ci-test-key
          FIRST_SUPERUSER_PASSWORD: admin
          NEO4J_PASSWORD: unused
        run: python3 -m pytest -v

  frontend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Lint
        working-directory: frontend
        run: npm run lint

      - name: Test
        working-directory: frontend
        run: npm test

      - name: Build
        working-directory: frontend
        run: npm run build
```

### Detalles importantes

| Aspecto | Decisión | Razón |
|---------|----------|-------|
| `python3` vs `python` | Usar `python3` | Por AGENTS.md: CI usa Ubuntu donde `python` no siempre apunta a Python 3 |
| `--timeout` flag | **No usar** | `pytest-timeout` no está en requirements |
| PostgreSQL service | `postgres:15` | Coincide con versión del proyecto |
| Datos de prueba | Creación vía `create_all` en conftest.py | No necesita `alembic upgrade head` porque los tests tienen su propio setup |
| Neo4j/Redis | No como services | Backend tolera su ausencia (health check acepta `unavailable`) |

### Integración con README

El badge ya existe en README.md (línea 8):

```markdown
[![CI](https://github.com/ThryCode/observatorio-tecnologico-industrial/actions/workflows/ci.yml/badge.svg)](https://github.com/ThryCode/observatorio-tecnologico-industrial/actions)
```

Esta ruta coincide exactamente con el archivo creado.

## Criterios de aceptación

- [ ] `.github/workflows/ci.yml` existe con los 2 jobs (backend + frontend)
- [ ] Backend job: instala deps, corre ruff, corre pytest
- [ ] Frontend job: instala deps, corre lint, corre test, corre build
- [ ] Badge de CI en README apunta al workflow correcto
- [ ] El workflow se activa en push/PR a main

## Riesgos

- **Medio**: Si el repo no está en GitHub o el badge apunta a un URL incorrecto, no se verá el status. Verificar que el repo sea `ThryCode/observatorio-tecnologico-industrial`.
- **Bajo**: Los tests pueden fallar si la base de datos de test no está configurada correctamente. Los tests existentes usan `DATABASE_URL` que se pasa como env var.
