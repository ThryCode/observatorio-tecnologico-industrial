# Guía de Producción — Observatorio Tecnológico Industrial

## Requisitos del servidor

- **SO:** Windows Server 2019/2022 o Windows 10 Pro (build 18362+)
- **RAM:** 8 GB mínimo, 16 GB recomendado
- **Disco:** 50 GB disponible, SSD recomendado
- **Puertos requeridos:**

| Puerto | Servicio | Acceso |
|--------|----------|--------|
| 5432 | PostgreSQL | Localhost solamente |
| 7687 | Neo4j Bolt | Localhost solamente |
| 7474 | Neo4j Browser | Localhost (admin) |
| 6379 | Redis | Localhost solamente |
| 8000 | Backend API | Red interna / proxy |
| 443/80 | Frontend | Público (vía nginx) |

## Instalación paso a paso

### 1. PostgreSQL 15
```powershell
# Iniciar servicio PostgreSQL
& "C:\tools\postgresql\pgsql\bin\pg_ctl" start -D "C:\tools\postgresql\data"

# Crear base de datos y usuario
& "C:\tools\postgresql\pgsql\bin\createdb" -U postgres observatorio_db
& "C:\tools\postgresql\pgsql\bin\psql" -U postgres -d observatorio_db -c "CREATE USER observatorio WITH PASSWORD 'password_seguro';"
& "C:\tools\postgresql\pgsql\bin\psql" -U postgres -d observatorio_db -c "GRANT ALL PRIVILEGES ON DATABASE observatorio_db TO observatorio;"
```

### 2. Neo4j 5 Community
```powershell
# Configurar auth (IMPORTANTE: cambiar en producción)
# Editar C:\tools\neo4j\conf\neo4j.conf:
#   dbms.security.auth_enabled=true
#   dbms.memory.heap.initial_size=512m
#   dbms.memory.heap.max_size=2g

& "C:\tools\neo4j\bin\neo4j" start
# Cambiar contraseña: curl -X POST -H "Content-Type: application/json" -d '{"password":"nueva_password"}' http://localhost:7474/user/neo4j/password
```

### 3. Redis 5.0
```powershell
# Configurar contraseña en redis.conf:
#   requirepass password_seguro
#   save 900 1

& "C:\tools\redis\redis-server.exe" "C:\tools\redis\redis.conf"
```

### 4. Python 3.11 + Backend
```powershell
cd C:\observatorio-tecnologico-industrial\backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
copy ..\.env.example .env
# Editar .env con credenciales de producción
.\venv\Scripts\python.exe -m alembic upgrade head
```

### 5. Node.js 20 + Frontend
```powershell
cd C:\observatorio-tecnologico-industrial\frontend
npm install
npm run build
# El directorio dist/ será servido por nginx
```

## Configuración de NSSM (Windows Service)

Registrar cada servicio con NSSM para inicio automático y recuperación en fallo:

```powershell
# PostgreSQL
nssm install ObservatorioPostgreSQL "C:\tools\postgresql\pgsql\bin\pg_ctl.exe" "start -D C:\tools\postgresql\data"

# Neo4j
nssm install ObservatorioNeo4j "C:\tools\neo4j\bin\neo4j.exe" "start"

# Redis (si no está ya como servicio)
nssm install ObservatorioRedis "C:\tools\redis\redis-server.exe" "C:\tools\redis\redis.conf"

# Backend API
nssm install ObservatorioAPI "C:\observatorio\backend\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
nssm set ObservatorioAPI AppDirectory "C:\observatorio\backend"
nssm set ObservatorioAPI AppStdout "C:\observatorio\backend\logs\uvicorn.log"
nssm set ObservatorioAPI AppStderr "C:\observatorio\backend\logs\uvicorn.err.log"
nssm set ObservatorioAPI Start SERVICE_AUTO_START
nssm set ObservatorioAPI ObjectName ".\LocalSystem"
```

Configurar recuperación en cada servicio (NSSM GUI: `nssm edit ObservatorioAPI`):
- Restart after 1000ms
- Restart after 10000ms
- Restart after 60000ms
- Reset fail count after 86400s

## Variables de entorno de producción

| Variable | Valor recomendado |
|----------|------------------|
| `DATABASE_URL` | `postgresql+asyncpg://observatorio:password_seguro@localhost:5432/observatorio_db` |
| `SECRET_KEY` | Generar con `openssl rand -hex 32` |
| `FIRST_SUPERUSER_EMAIL` | `admin@mindus.gob.cu` |
| `FIRST_SUPERUSER_PASSWORD` | Password fuerte (mín. 16 chars) |
| `NEO4J_URI` | `bolt://localhost:7687` |
| `NEO4J_PASSWORD` | Password fuerte |
| `REDIS_URL` | `redis://:password_seguro@localhost:6379/0` |
| `BACKEND_CORS_ORIGINS` | `["https://dominio-frontend.cu"]` |
| `TESTING` | `0` |
| `LOG_LEVEL` | `INFO` |

## Seguridad

- **HTTPS obligatorio:** Usar Let's Encrypt (certbot) o certificado de infraestructura nacional
- **Firewall:** Solo puertos 443 (HTTPS) y 80 (redirección) abiertos al exterior
- **PostgreSQL:** `pg_hba.conf` debe restringir a `127.0.0.1/32`
- **Neo4j:** Habilitar `dbms.security.auth_enabled=true`, cambiar contraseña por defecto
- **Redis:** Configurar `requirepass` en redis.conf, bind a 127.0.0.1
- **JWT:** Token expiry de 30 minutos, usar `SECRET_KEY` fuerte
- **Rate limiting:** Configurado en endpoints de auth (5 intentos/minuto por IP)

## Monitoreo

- **Health check:** `GET /api/v1/health` — verifica PostgreSQL, Neo4j, Redis
- **Logs backend:** `backend/logs/observatorio.log` (rotación cada 10 MB, retención 30 días)
- **PostgreSQL:** Habilitar `log_min_duration_statement = 200` para queries lentas
- **Neo4j:** Revisar `logs/neo4j.log` para errores de conexión y queries
- **Windows:** Event Viewer → Windows Logs → Application para fallos de servicio NSSM
- **Monitor externo:** Configurar check HTTP periódico a `/api/v1/health` (ej. cada 5 minutos)

## Actualizaciones

```powershell
# 1. Detener backend
nssm stop ObservatorioAPI

# 2. Actualizar código
git pull origin main

# 3. Actualizar dependencias (si cambiaron)
cd backend
.\venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..\frontend
npm install

# 4. Migraciones
cd ..\backend
.\venv\Scripts\python.exe -m alembic upgrade head

# 5. Reconstruir frontend
cd ..\frontend
npm run build

# 6. Iniciar backend
nssm start ObservatorioAPI

# 7. Verificar
curl http://localhost:8000/api/v1/health
```

### Rollback
```powershell
cd backend
.\venv\Scripts\python.exe -m alembic downgrade -1
git revert HEAD
nssm restart ObservatorioAPI
```
