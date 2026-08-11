# Backup y Recuperación

## SQLite

### Backup automático (PowerShell)
```powershell
$backup_dir = "C:\backups\sqlite"
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "observatorio_$date.db"

# Crear directorio si no existe
if (-not (Test-Path $backup_dir)) { New-Item -ItemType Directory -Path $backup_dir }

# Backup del archivo SQLite
Copy-Item "backend\observatorio.db" "$backup_dir\$filename"

# Eliminar backups más antiguos de 30 días
Get-ChildItem $backup_dir -Filter "*.db" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item

# Rotación mensual: conservar 1 backup por mes
$monthly_dir = "$backup_dir\monthly"
if (-not (Test-Path $monthly_dir)) { New-Item -ItemType Directory -Path $monthly_dir }
if ((Get-Date).Day -eq 1) {
    Copy-Item "$backup_dir\$filename" "$monthly_dir\observatorio_$(Get-Date -Format 'yyyyMM').db"
    Get-ChildItem $monthly_dir -Filter "*.db" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-90) } | Remove-Item
}
```

### Restore
```powershell
# Listar backups disponibles
Get-ChildItem "C:\backups\sqlite" -Filter "*.db" | Select-Object Name, LastWriteTime

# Restaurar backup específico
Copy-Item "C:\backups\sqlite\observatorio_20260101_030000.db" "backend\observatorio.db"
```

## Neo4j

### Backup automático (PowerShell)
```powershell
$backup_dir = "C:\backups\neo4j"
$date = Get-Date -Format "yyyyMMdd"

if (-not (Test-Path $backup_dir)) { New-Item -ItemType Directory -Path $backup_dir }

# Detener Neo4j, hacer dump, reiniciar
& "C:\tools\neo4j\bin\neo4j" stop
& "C:\tools\neo4j\bin\neo4j-admin" database dump neo4j --to-path="$backup_dir\neo4j_$date.dump"
& "C:\tools\neo4j\bin\neo4j" start

# Eliminar backups más antiguos de 12 semanas
Get-ChildItem $backup_dir -Filter "*.dump" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-84) } | Remove-Item
```

### Restore
```powershell
& "C:\tools\neo4j\bin\neo4j" stop
& "C:\tools\neo4j\bin\neo4j-admin" database load neo4j --from-path="C:\backups\neo4j\neo4j_20260101.dump"
& "C:\tools\neo4j\bin\neo4j" start
```

## Redis

Redis es caché y no requiere backup frecuente. Configurar persistencia:

```powershell
# En redis.conf:
save 900 1       # 1 cambio cada 15 min
save 300 10      # 10 cambios cada 5 min
save 60 10000    # 10000 cambios cada 60 seg

# Backup manual del dump.rdb
Copy-Item "C:\tools\redis\dump.rdb" "C:\backups\redis\dump_$(Get-Date -Format 'yyyyMMdd').rdb"
```

## Programar backups con Windows Task Scheduler

```powershell
# Backup SQLite diario a las 3:00 AM
$action_sqlite = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\scripts\backup-sqlite.ps1"
$trigger_sqlite = New-ScheduledTaskTrigger -Daily -At 03:00AM
Register-ScheduledTask -TaskName "Backup SQLite Observatorio" -Action $action_sqlite -Trigger $trigger_sqlite -User "SYSTEM" -RunLevel Highest

# Backup Neo4j semanal (domingo a las 4:00 AM)
$action_neo = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\scripts\backup-neo4j.ps1"
$trigger_neo = New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek Sunday -At 04:00AM
Register-ScheduledTask -TaskName "Backup Neo4j Observatorio" -Action $action_neo -Trigger $trigger_neo -User "SYSTEM" -RunLevel Highest
```

## Frecuencia y retención recomendada

| Servicio | Frecuencia | Retención diaria | Retención mensual |
|----------|-----------|-----------------|-------------------|
| SQLite | Diaria | 30 días | 3 meses |
| Neo4j | Semanal (domingo) | 12 semanas | — |
| Redis | No necesario (caché) | — | — |
| Código + Config | Semanal | 4 semanas | — |

## Recuperación ante desastres

### Escenario: Pérdida total del servidor

1. **Preparar nuevo servidor** con los mismos requisitos
2. **Instalar servicios:** Neo4j, Redis, Python 3.11, Node.js 20
3. **Clonar repositorio** y configurar `.env`
4. **Restaurar SQLite:**
   ```powershell
   Copy-Item "C:\backups\sqlite\observatorio_ULTIMO.db" "backend\observatorio.db"
   ```
5. **Restaurar Neo4j:**
   ```powershell
   neo4j stop
   neo4j-admin database load neo4j --from-path="C:\backups\neo4j\neo4j_ULTIMO.dump"
   neo4j start
   ```
6. **Iniciar servicios:** Neo4j → Redis → Backend → Frontend
7. **Verificar:**
   ```powershell
   curl http://localhost:8000/api/v1/health
   # Respuesta esperada: {"status":"ok","database":"healthy","neo4j":"healthy","redis":"healthy"}
   ```

### Escenario: Backup corrupto

Si el único backup disponible está corrupto:

1. **Reconstruir desde seed data:** Ejecutar backend con `FIRST_SUPERUSER_*` para crear admin inicial
2. **Sincronizar grafo Neo4j:** `POST /api/v1/graph/sync` (si hay datos en SQLite)
3. **Aceptar pérdida de datos** desde el último backup válido

### Verificación periódica

Programar una tarea mensual que:
1. Restaure backups en un directorio temporal
2. Cuente registros en tablas principales (organizations, technologies, users)
3. Envíe alerta si el conteo es cero (backup vacío)
