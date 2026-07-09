# Observatorio Tecnológico Industrial

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=flat&logo=neo4j&logoColor=white)](https://neo4j.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
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
        │  15  alg.│ │ 5      │ │(GUI)   │
        └──────────┘ └────────┘ └────────┘
```

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2 |
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query |
| **Grafo** | Neo4j 5 Community, APOC, Graph Data Science |
| **Base de datos** | PostgreSQL 15 |
| **Caché / Colas** | Redis 5 (tporadowski) |
| **Infraestructura** | Instalación nativa Windows 10 (Docker alternativo para producción) |

## Requisitos del sistema

| Requisito | Versión mínima |
|---|---|
| Sistema operativo | Windows 10 Pro (build 18362+) |
| RAM | 8 GB |
| Python | 3.11 |
| Node.js | 20 LTS |
| PostgreSQL | 15 |
| Neo4j | 5 Community |
| Redis | 5.0 (tporadowski) |
| Java | JDK 17 (requisito Neo4j) |

## Inicio rápido (Windows nativo)

```powershell
# 1. Clonar el repositorio
git clone https://github.com/ThryCode/observatorio-tecnologico-industrial.git
cd observatorio-tecnologico-industrial

# 2. Crear archivo de variables de entorno
copy .env.windows backend\.env

# 3. Crear y activar entorno virtual
python -m venv backend\venv
backend\venv\Scripts\activate

# 4. Instalar dependencias del backend
pip install -r backend\requirements.txt

# 5. Ejecutar migraciones (requiere PostgreSQL corriendo)
cd backend
alembic upgrade head
cd ..

# 6. Iniciar backend
cd backend
..\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Abrir en el navegador:
- **Documentación API:** http://localhost:8000/docs
- **Neo4j Browser:** http://localhost:7474

Para una guía detallada de instalación de cada componente, ver:
**[docs/instalacion-windows.md](docs/instalacion-windows.md)**

## Scripts de automatización

| Script | Descripción |
|---|---|
| `scripts/setup-env.ps1` | Verifica servicios, copia `.env.windows`, ejecuta migraciones |
| `scripts/start-windows.ps1` | Inicia backend (uvicorn) y frontend (vite) en ventanas separadas |
| `scripts/stop-windows.ps1` | Detiene procesos de uvicorn y node |

## Servicios

| Puerto | Servicio | URL | Credenciales |
|---|---|---|---|
| 5432 | PostgreSQL | `localhost` | `observatorio` / `observatorio_dev` |
| 7687 | Neo4j Bolt | `localhost` | `neo4j` / `observatorio_dev` |
| 7474 | Neo4j Browser | http://localhost:7474 | `neo4j` / `observatorio_dev` |
| 6379 | Redis | `localhost` | Sin contraseña |
| 8000 | Backend API | http://localhost:8000/docs | JWT (vía `/auth/login`) |
| 5173 | Frontend (dev) | http://localhost:5173 | — |

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
│   ├── .env                 # Variables de entorno (local)
│   └── tests/
├── frontend/
│   └── src/                 # React + Vite + Tailwind
├── docs/
│   └── instalacion-windows.md
├── scripts/
│   ├── setup-env.ps1
│   ├── start-windows.ps1
│   └── stop-windows.ps1
├── .env.example             # Referencia de variables Docker
├── .env.windows             # Variables para desarrollo nativo Windows
└── README.md
```

## Licencia

Este proyecto se desarrolla bajo la rectoría del **Ministerio de Industrias de Cuba (MINDUS)**. Todos los derechos reservados.
