# Observatorio Tecnológico Industrial

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=flat&logo=neo4j&logoColor=white)](https://neo4j.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)

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
- **Recomendaciones CTI** — Sugerencias de colaboración entre entidades de ciencia, tecnología e innovación basadas en el análisis del grafo.

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
        │  15  alg.│ │ 7      │ │(GUI)   │
        └──────────┘ └────────┘ └────────┘
```

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2 |
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui, React Query |
| **Grafo** | Neo4j 5 Community, APOC, Graph Data Science |
| **Base de datos** | PostgreSQL 15 |
| **Caché / Colas** | Redis 7 |
| **Infraestructura** | Docker, Docker Compose |

## Inicio rápido

```bash
# Requisitos: Docker Engine ≥ 24, Docker Compose ≥ 2.20

# 1. Clonar
git clone https://github.com/ThryCode/observatorio-tecnologico-industrial.git
cd observatorio-tecnologico-industrial

# 2. Configurar entorno
cp .env.example .env
# Editar .env si es necesario (los valores por defecto funcionan para dev)

# 3. Levantar toda la infraestructura
docker compose up -d

# 4. Ejecutar migraciones de base de datos
docker compose exec backend alembic upgrade head

# 5. Abrir en navegador
open http://localhost:8000/docs   # Swagger UI
open http://localhost:7474        # Neo4j Browser
open http://localhost:8080        # Adminer
```

## Servicios

| Puerto | Servicio | URL | Credenciales |
|---|---|---|---|
| 5432 | PostgreSQL | `localhost` | `observatorio` / `observatorio_dev` |
| 7687 | Neo4j Bolt | `localhost` | `neo4j` / `observatorio_dev` |
| 7474 | Neo4j Browser | http://localhost:7474 | `neo4j` / `observatorio_dev` |
| 6379 | Redis | `localhost` | Sin contraseña |
| 8000 | Backend API | http://localhost:8000/docs | JWT (vía `/auth/register` y `/auth/login`) |
| 8080 | Adminer | http://localhost:8080 | Servidor: `postgres`, Usuario: `observatorio` |

## Estructura del proyecto

```
.
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Endpoints REST
│   │   ├── core/            # Seguridad, excepciones
│   │   ├── graph/           # Repositorio Neo4j (Cypher)
│   │   ├── models/          # ORM SQLAlchemy
│   │   ├── schemas/         # Pydantic v2
│   │   └── services/        # Lógica de negocio
│   ├── alembic/             # Migraciones async
│   └── tests/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Licencia

Este proyecto se desarrolla bajo la rectoría del **Ministerio de Industrias de Cuba (MINDUS)**. Todos los derechos reservados.
