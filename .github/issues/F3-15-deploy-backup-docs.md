# F3-15: Documentación de deploy y backup

**Etiquetas:** `fase-3`, `documentacion`, `devops`
**Hito:** Fase 3 — Producción
**Depende de:** Ninguna
**Subagente:** `docs-writer`

---

## Descripción

No existe documentación sobre cómo desplegar el proyecto en producción ni cómo hacer backups de PostgreSQL y Neo4j. Se necesita crear:

1. Guía de producción (servidor Windows dedicado)
2. Scripts de backup para PostgreSQL y Neo4j
3. Estrategia de respaldo documentada

## Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `docs/production-guide.md` | Guía completa de deploy en producción |
| `docs/backup-recovery.md` | Procedimientos de backup y recuperación |

## Especificación técnica

### 1. `docs/production-guide.md`

Debe incluir:

```markdown
# Guía de Producción — Observatorio Tecnológico Industrial

## Requisitos del servidor
- Windows Server 2019+ / Windows 10 Pro
- 8 GB RAM mínimo, 16 GB recomendado
- 50 GB disco disponible
- PostgreSQL 15, Neo4j 5 Community, Redis 5.0
- Python 3.11, Node.js 20 LTS

## Instalación
1. Clonar repositorio
2. Configurar .env (usar .env.example como template)
3. Ejecutar `alembic upgrade head` (backend)
4. Iniciar servicios: PostgreSQL → Neo4j → Redis → Backend → Frontend

## Inicio de servicios
```powershell
# Backend (Windows Service recomendado con NSSM)
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (construir y servir con Nginx)
cd frontend
npm run build
# Servir dist/ con nginx o similar
```

## Variables de entorno de producción
| Variable | Valor recomendado |
|----------|------------------|
| `DATABASE_URL` | PostgreSQL con usuario/pass fuertes |
| `SECRET_KEY` | Generar con `openssl rand -hex 32` |
| `FIRST_SUPERUSER_PASSWORD` | Password fuerte |
| `NEO4J_PASSWORD` | Password fuerte |
| `BACKEND_CORS_ORIGINS` | Dominio del frontend en producción |

## Seguridad
- Cambiar todas las contraseñas por defecto
- Usar HTTPS (certbot, Let's Encrypt)
- Configurar firewall (solo puertos 443, 80, 5432 interno)
- Rate limiting ya configurado en auth endpoints
```

### 2. `docs/backup-recovery.md`

```markdown
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
|----------|-----------|-----------|
| PostgreSQL | Diaria | 30 días |
| Neo4j | Semanal | 12 semanas |
| Redis | No necesario (cache) | — |

## Recuperación ante desastres
1. Detener servicios
2. Restaurar PostgreSQL desde backup
3. Restaurar Neo4j desde dump
4. Reiniciar servicios
5. Ejecutar health check: `GET /api/v1/health`
```

## Criterios de aceptación

- [ ] `docs/production-guide.md` existe con requisitos, instalación, configuración de producción
- [ ] `docs/backup-recovery.md` existe con comandos y frecuencias
- [ ] Los scripts son específicos para Windows (PowerShell)
- [ ] Incluye recomendaciones de seguridad

## Riesgos

- **Bajo**: Documentación no afecta el código en ejecución.
- **Medio**: Los scripts de backup deben probarse manualmente antes de confiar en ellos.
