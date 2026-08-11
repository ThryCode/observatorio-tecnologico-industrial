# Runbook - Observatorio Tecnologico Industrial

##日常运维操作

### 1. Iniciar servicios

```powershell
# Neo4j
& "G:\Proyects\Observatorio\tools\neo4j\neo4j-community-5.26.0\bin\neo4j.bat" console

# Redis
& "G:\Proyects\Observatorio\tools\redis\redis-server.exe" --port 6379

# Backend
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

### 2. Detener servicios

```powershell
# Neo4j
& "G:\Proyects\Observatorio\tools\neo4j\neo4j-community-5.26.0\bin\neo4j.bat" stop

# Redis
& "G:\Proyects\Observatorio\tools\redis\redis-cli.exe" shutdown
```

### 3. Ejecutar migraciones

```powershell
cd backend
alembic upgrade head
alembic downgrade -1
alembic revision --autogenerate -m "description"
```

### 4. Ejecutar tests

```powershell
# Backend
cd backend
python -m pytest tests/ -v

# Frontend
cd frontend
npx vitest run
npx vitest run --coverage
```

### 5. Verificar salud del sistema

```powershell
# Health check
curl http://localhost:8000/api/v1/health

# Verificar SQLite (el archivo DB existe)
Test-Path "backend\observatorio.db"

# Verificar Neo4j
& "G:\Proyects\Observatorio\tools\neo4j\neo4j-community-5.26.0\bin\cypher-shell.bat" -u neo4j -p password

# Verificar Redis
& "G:\Proyects\Observatorio\tools\redis\redis-cli.exe" ping
```

### 6. Sincronizar grafo Neo4j

```powershell
# Sync completo (todas las entidades)
curl -X POST http://localhost:8000/api/v1/graph/sync \
  -H "Authorization: Bearer <token>"

# Verificar estadisticas
curl http://localhost:8000/api/v1/graph/stats \
  -H "Authorization: Bearer <token>"
```

### 7. Backup y restauracion

```powershell
# Backup SQLite
Copy-Item "backend\observatorio.db" "backups\observatorio_$(Get-Date -Format 'yyyyMMdd').db"

# Backup Neo4j
& "G:\Proyects\Observatorio\tools\neo4j\neo4j-community-5.26.0\bin\neo4j-admin.bat" database dump neo4j --to-path=neo4j-backup
```

### 8. Troubleshooting

#### Neo4j no conecta
```powershell
# Verificar logs
Get-Content "G:\Proyects\Observatorio\tools\neo4j\neo4j-community-5.26.0\logs\neo4j.log"

# Verificar puerto
netstat -an | findstr 7687
```

#### Backend errores de conexion
```powershell
# Verificar variables de entorno
Get-Content backend\.env

# Verificar logs del backend
Get-Content logs\observatorio.log
```

### 9. Deploy a produccion

#### Pre-requisitos
- Python 3.11 instalado
- Node.js 20 LTS instalado
- Neo4j 5 corriendo (opcional)
- Redis corriendo (opcional)

#### Pasos de deploy
```powershell
# 1. Actualizar codigo
git pull origin main

# 2. Actualizar dependencias backend
cd backend
.\venv\Scripts\pip.exe install -r requirements.txt

# 3. Ejecutar tests
python -m pytest tests/ -v

# 4. Ejecutar migraciones
alembic upgrade head

# 5. Build frontend
cd ..\frontend
& "G:\Proyects\Observatorio\tools\nodejs\node-v20.18.3-win-x64\npm.cmd" run build

# 6. Sincronizar grafo (si Neo4j disponible)
cd ..\backend
$login = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"admin@mindus.gob.cu","password":"admin123"}'
$headers = @{"Authorization"="Bearer $($login.access_token)"}
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/graph/sync" -Method Post -Headers $headers

# 7. Reiniciar backend
# Detener proceso existente y ejecutar:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Variables de entorno para produccion
```bash
# backend/.env
DATABASE_URL=sqlite+aiosqlite:///./observatorio.db
SECRET_KEY=<clave-segura-256-bits>
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password-neo4j>
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=["https://yourdomain.com"]
```

### 10. Monitoreo

```powershell
# Verificar metricas
curl http://localhost:8000/api/v1/health

# Verificar logs en tiempo real
Get-Content logs\observatorio.log -Wait

# Verificar uso de recursos
Get-Process python, node, neo4j | Select-Object Name, CPU, WorkingSet
```
