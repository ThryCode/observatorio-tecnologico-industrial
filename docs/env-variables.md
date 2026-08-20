# Variables de Entorno

Referencia completa de variables de entorno para el Observatorio Tecnologico Industrial.

## Backend (`backend/.env`)

Copiar `.env.example` al directorio `backend/` y ajustar valores.

| Variable | Requerida | Default | Descripcion |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | Si | — | URL de conexión SQLite. Ej: `sqlite+aiosqlite:///./observatorio.db` |
| `NEO4J_URI` | No | `bolt://localhost:7687` | URI de conexión Neo4j |
| `NEO4J_USER` | No | `neo4j` | Usuario Neo4j |
| `NEO4J_PASSWORD` | Si | — | Contraseña Neo4j |
| `REDIS_URL` | No | `redis://localhost:6379/0` | URL de conexión Redis |
| `SECRET_KEY` | Si | — | Clave secreta para JWT (cambiar en producción) |
| `ALGORITHM` | No | `HS256` | Algoritmo JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | Minutos de expiración del token |
| `BACKEND_CORS_ORIGINS` | No | `["http://localhost:5173"]` | Orígenes permitidos CORS (JSON array) |
| `FIRST_SUPERUSER` | No | `admin@mindus.gob.cu` | Email del superusuario inicial |
| `FIRST_SUPERUSER_PASSWORD` | Si | — | Contraseña del superusuario inicial |
| `SMTP_HOST` | No | `""` | Host SMTP para notificaciones |
| `SMTP_PORT` | No | `587` | Puerto SMTP |
| `SMTP_USER` | No | `""` | Usuario SMTP |
| `SMTP_PASSWORD` | No | `""` | Contraseña SMTP |
| `SMTP_USE_TLS` | No | `True` | Usar TLS para conexión SMTP |
| `EMAIL_FROM` | No | `Observatorio... <noreply@mindus.gob.cu>` | Remitente de emails |
| `FRONTEND_URL` | No | `http://localhost:5173` | URL del frontend (para emails) |
| `SUMMARY_SEND_HOUR` | No | `7` | Hora de envío de resumen diario |
| `UPLOAD_DIR` | No | `./uploads` | Directorio de archivos subidos |
| `MAX_UPLOAD_SIZE` | No | `10485760` | Tamaño máximo de upload (bytes, 10MB) |
| `ALLOWED_EXTENSIONS` | No | `.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg` | Extensiones permitidas |

## Frontend (`frontend/.env`)

| Variable | Requerida | Default | Descripcion |
|----------|-----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:8000/api/v1` | URL base del backend API |
| `VITE_USE_MOCK` | No | `false` | Habilitar modo mock (datos de ejemplo) |
| `VITE_APP_VERSION` | No | Fallback `0.0.0` | Version de la aplicacion |

## Variables de CI (`.github/workflows/ci.yml`)

| Variable | Valor | Descripcion |
|----------|-------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./test_observatorio.db` | DB de test en CI |
| `NEO4J_PASSWORD` | `test` | Neo4j dummy para CI |
| `SECRET_KEY` | `test-secret-key` | JWT dummy para CI |
| `FIRST_SUPERUSER_PASSWORD` | `admin` | Password del superuser en CI |
| `TESTING` | `1` | Deshabilita rate limiting en tests |

## Notas

- Las variables con `Required: Si` deben estar presentes en `backend/.env` para que el servidor inicie.
- El archivo `.env` y `.env.example` estan en `.gitignore` (excepto `.env.example`).
- En produccion, usar `SUMMARY_SEND_HOUR` para programar el envio de resumenes.
- `BACKEND_CORS_ORIGINS` debe incluir la URL completa del frontend desplegado.
