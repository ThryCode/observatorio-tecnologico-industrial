# Runbook - Observatorio Tecnologico Industrial

##日常运维操作

### 1. Iniciar servicios

```powershell
# PostgreSQL
& "G:\Proyects\Observatorio\tools\postgresql\pgsql\bin\pg_ctl.exe" -D "G:\Proyects\Observatorio\tools\postgresql\pgsql\data" start

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
# PostgreSQL
& "G:\Proyects\Observatorio\tools\postgresql\pgsql\bin\pg_ctl.exe" -D "G:\Proyects\Observatorio\tools\postgresql\pgsql\data" stop

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

# Verificar PostgreSQL
& "G:\Proyects\Observatorio\tools\postgresql\pgsql\bin\psql.exe" -U observatorio -d observatorio

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
# Backup PostgreSQL
& "G:\Proyects\Observatorio\tools\postgresql\pgsql\bin\pg_dump.exe" -U observatorio -d observatorio -f backup.sql

# Restaurar PostgreSQL
& "G:\Proyects\Observatorio\tools\postgresql\pgsql\bin\psql.exe" -U observatorio -d observatorio -f backup.sql

# Backup Neo4j
& "G:\Proyects\Observatorio\tools\neo4j\neo4j-community-5.26.0\bin\neo4j-admin.bat" database dump neo4j --to-path=neo4j-backup
```

### 8. Troubleshooting

#### PostgreSQL no inicia
```powershell
# Verificar logs
Get-Content "G:\Proyects\Observatorio\tools\postgresql\pgsql\data\log\*.log"

# Reiniciar con limpieza
& "G:\Proyects\Observatorio\tools\postgresql\pgsql\bin\pg_ctl.exe" -D "G:\Proyects\Observatorio\tools\postgresql\pgsql\data" restart
```

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

```powershell
# 1. Ejecutar tests
cd backend && python -m pytest tests/ -v
cd frontend && npx vitest run

# 2. Build frontend
cd frontend
npm run build

# 3. Ejecutar migraciones
cd backend
alembic upgrade head

# 4. Iniciar backend en produccion
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 10. Monitoreo

```powershell
# Verificar metricas
curl http://localhost:8000/api/v1/health

# Verificar logs en tiempo real
Get-Content logs\observatorio.log -Wait

# Verificar uso de recursos
Get-Process python, node, postgres, neo4j | Select-Object Name, CPU, WorkingSet
```
