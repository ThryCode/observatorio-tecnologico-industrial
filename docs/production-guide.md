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