# Backup y Recuperación

## PostgreSQL
```powershell
# Backup completo
pg_dump -U observatorio -d observatorio_db > backup_%DATE%.sql

# Restore
psql -U observatorio -d observatorio_db < backup.sql
```

## Neo4j
- Usar dump de la base de datos:
```bash
neo4j-admin database dump neo4j --to-path=/backups/
```

## Redis
- Backup del dump.rdb (configurar save en redis.conf)

## Frecuencia recomendada
| Servicio | Frecuencia | Retención |
|----------|-----------|----------|
| PostgreSQL | Diaria | 30 días |
| Neo4j | Semanal | 12 semanas |
| Redis | No necesario (cache) | — |

## Recuperación ante desastres
1. Detener servicios
2. Restaurar PostgreSQL desde backup
3. Restaurar Neo4j desde dump
4. Reiniciar servicios
5. Ejecutar health check: `GET /api/v1/health`