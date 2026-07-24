# Guía de Producción del Observatorio Tecnológico Industrial

## 1. Requisitos Previos

### 1.1 Servidores de Producción
- **Sistema Operativo**: Windows Server 2022 (x64) o Ubuntu 22.04 LTS
- **Hardware**: Mínimo 16GB RAM, 50GB espacio en disco, CPU de 2 núcleos+
- **Red**: Puertos 80/443 abiertos para tráfico web, puertos internos para servicios

### 1.2 Servicios Requeridos
- **PostgreSQL 15** - Base de datos relacional
- **Neo4j 5 Community** - Base de datos gráfica
- **Redis 5** - Caché y sesión
- **Java JDK 17** - Requerido por Neo4j

## 2. Instalación en Servidor Windows

### 2.1 Instalación de Servicios

#### PostgreSQL
```powershell
# Descargar e instalar PostgreSQL 15
# Durante instalación:
# - Puerto: 5432
# - Contraseña superusuario: observatorio_dev
# - Crear base de datos: observatorio_db
# - Crear usuario: observatorio con contraseña observatorio_dev
```

#### Neo4j
```powershell
# Descargar Neo4j 5 Community
# Extraer a C:\neo4j\
# Configurar neo4j.conf:
server.bolt.listen_address=0.0.0.0:7687
server.http.listen_address=0.0.0.0:7474
server.bolt.tls_level=DISABLED
dbms.security.auth_enabled=true
dbms.memory.pagecache.size=512m
dbms.memory.heap.initial_size=512m
dbms.memory.heap.max_size=1g

# Iniciar Neo4j
cd C:\neo4j\bin
.\neo4j.bat console
```

#### Redis
```powershell
# Descargar Redis 5.0.14 (tporadowski)
# Extraer a C:\redis\
# Iniciar Redis
cd C:\redis
.\redis-server.exe
```

### 2.2 Instalación del Backend
```powershell
# 1. Clonar repositorio
cd C:\
git clone https://github.com/ThryCode/observatorio-tecnologico-industrial.git
cd observatorio-tecnologico-industrial

# 2. Configurar variables de entorno
copy .env.example backend\.env

# 3. Configurar backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 4. Ejecutar migraciones
alembic upgrade head

# 5. Iniciar backend como servicio Windows
# Crear backend.service usando NSSM o Windows Service Manager
```

## 3. Instalación en Servidor Linux (AWS/GCP/Azure)

### 3.1 Instalación de Servicios
```bash
# Ubuntu 22.04
sudo apt update
sudo apt install -y postgresql-15 neo4j redis-server openjdk-17-jdk

# Configurar PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'observatorio_dev';"
createdb observatorio_db
sudo -u postgres psql -d observatorio_db -c "CREATE USER observatorio WITH PASSWORD 'observatorio_dev'; GRANT ALL PRIVILEGES ON DATABASE observatorio_db TO observatorio;"

# Configurar Neo4j
# Editar /etc/neo4j/neo4j.conf
server.bolt.listen_address=0.0.0.0:7687
server.http.listen_address=0.0.0.0:7474
server.bolt.tls_level=DISABLED
dbms.security.auth_enabled=true
dbms.memory.pagecache.size=512m
dbms.memory.heap.initial_size=512m
dbms.memory.heap.max_size=1g

sudo systemctl start neo4j

# Configurar Redis
# Editar /etc/redis/redis.conf
supervised no

# Iniciar servicios
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl enable neo4j
sudo systemctl start neo4j
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 3.2 Instalación del Backend
```bash
# 1. Clonar repositorio
cd /opt
sudo git clone https://github.com/ThryCode/observatorio-tecnologico-industrial.git

# 2. Configurar backend
sudo mkdir -p /opt/observatorio
cd /opt/observatorio/backend
sudo python3 -m venv venv
sudo ./venv/bin/pip install -r requirements.txt

# 3. Configurar variables de entorno
sudo cp /opt/observatorio/.env.example backend/.env

# 4. Ejecutar migraciones
sudo ./venv/bin/python -m alembic upgrade head

# 5. Crear servicio systemd
sudo tee /etc/systemd/system/observatorio-backend.service << EOF
[Unit]
Description=Observatorio Backend
After=network.target postgresql.service neo4j.service redis-server.service

[Service]
Type=simple
User=observatorio
WorkingDirectory=/opt/observatorio/backend
Environment=DATABASE_URL=postgresql+asyncpg://observatorio:observatorio_dev@localhost:5432/observatorio_db
Environment=NEO4J_URI=bolt://localhost:7687
Environment=NEO4J_USER=neo4j
Environment=NEO4J_PASSWORD=observatorio_dev
Environment=REDIS_URL=redis://localhost:6379
Environment=SECRET_KEY=change-me-in-production
Environment=FIRST_SUPERUSER_PASSWORD=change-me-in-production
ExecStart=/opt/observatorio/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable observatorio-backend
sudo systemctl start observatorio-backend
```

## 4. Instalación del Frontend

### 4.1 Servidor Windows
```powershell
# 1. Instalar Node.js 20
cd C:\
# Descargar e instalar Node.js 20 LTS

# 2. Clonar frontend
cd C:\
git clone https://github.com/ThryCode/observatorio-tecnologico-industrial.git
cd observatorio-tecnologico-industrial\frontend

# 3. Instalar dependencias
npm ci

# 4. Construir para producción
npm run build

# 5. Configurar IIS o servicio Node.js
```

### 4.2 Servidor Linux
```bash
# 1. Instalar Node.js 20
cd /opt
sudo apt install -y nodejs npm
# Asegurar Node.js 20 (usar nvm si es necesario)

# 2. Clonar frontend
sudo git clone https://github.com/ThryCode/observatorio-tecnologico-industrial.git

# 3. Instalar dependencias
cd /opt/observatorio/frontend
sudo npm ci

# 4. Construir para producción
sudo npm run build

# 5. Configurar Nginx
sudo tee /etc/nginx/sites-available/observatorio << EOF
server {
    listen 80;
    server_name observatorio.mindus.gob.cu;
    
    # Frontend
    location / {
        root /opt/observatorio/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        proxy_set_header Access-Control-Allow-Origin "$frontend_url";
        proxy_set_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        proxy_set_header Access-Control-Allow-Headers "Content-Type, Authorization";
        proxy_set_header Access-Control-Allow-Credentials "true";
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/api/v1/health;
        access_log off;
    }
    
    # Static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/observatorio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. Configuración de Variables de Entorno

### 5.1 Variables de Producción

#### Archivo: `backend/.env` (Producción)
```bash
# PostgreSQL
DATABASE_URL=postgresql+asyncpg://observatorio:SECURE_PASSWORD@localhost:5432/observatorio_db

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=SECURE_PASSWORD

# Redis
REDIS_URL=redis://localhost:6379

# JWT
SECRET_KEY=VERY_LONG_RANDOM_SECRET_KEY_HERE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
BACKEND_CORS_ORIGINS=["https://observatorio.mindus.gob.cu"]

# Superusuario inicial
FIRST_SUPERUSER=admin@mindus.gob.cu
FIRST_SUPERUSER_PASSWORD=SECURE_ADMIN_PASSWORD

# Frontend
VITE_API_URL=https://observatorio.mindus.gob.cu/api/v1
VITE_USE_MOCK=false
```

### 5.2 Variables de Entorno Sensibles

- **SECRET_KEY**: Generar usando `openssl rand -hex 32`
- **FIRST_SUPERUSER_PASSWORD**: Contraseña segura única
- **NEO4J_PASSWORD**: Contraseña única para Neo4j
- **DATABASE_URL**: Incluye contraseña del usuario PostgreSQL

## 6. Scripts de Administración

### 6.1 Script de Inicio (`scripts/start-services.sh`)
```bash
#!/bin/bash
# Iniciar todos los servicios para producción

set -e

APP_DIR="/opt/observatorio"
VENV_DIR="$APP_DIR/backend/venv"

# Iniciar PostgreSQL (asumiendo servicio systemd)
systemctl start postgresql || service postgresql start

# Iniciar Neo4j
sudo -u neo4j /opt/neo4j/bin/neo4j start || error_exit "Failed to start Neo4j"

# Iniciar Redis
systemctl start redis || service redis start

# Iniciar backend
cd "$APP_DIR/backend"
$VENV_DIR/bin/nohup $VENV_DIR/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$APP_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$APP_DIR/backend.pid"

# Iniciar frontend
cd "$APP_DIR/frontend"
npm run start > "$APP_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$APP_DIR/frontend.pid"

# Esperar a que los servicios inicien
sleep 30

# Verificar servicios
if ! curl -f "http://localhost:8000/api/v1/health" > /dev/null 2>&1; then
    echo "Backend failed to start"
    exit 1
fi

echo "All services started successfully"
```

### 6.2 Script de Detención (`scripts/stop-services.sh`)
```bash
#!/bin/bash
# Detener todos los servicios

APP_DIR="/opt/observatorio"

# Detener frontend
if [ -f "$APP_DIR/frontend.pid" ]; then
    kill $(cat "$APP_DIR/frontend.pid") 2>/dev/null || true
    rm -f "$APP_DIR/frontend.pid"
fi

# Detener backend
if [ -f "$APP_DIR/backend.pid" ]; then
    kill $(cat "$APP_DIR/backend.pid") 2>/dev/null || true
    rm -f "$APP_DIR/backend.pid"
fi

# Detener servicios de infraestructura
systemctl stop postgresql || service postgresql stop || true
sudo -u neo4j /opt/neo4j/bin/neo4j stop || true
systemctl stop redis || service redis stop || true

echo "All services stopped"
```

### 6.3 Script de Deployment (`scripts/deploy.sh`)
```bash
#!/bin/bash
# Deployment script para Observatorio Tecnológico Industrial

set -e

# Configuración
BACKUP_DIR="/backups/observatorio"
APP_DIR="/opt/observatorio"
VENV_DIR="$APP_DIR/backend/venv"
LOG_DIR="$APP_DIR/logs"

# Colores para salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función de logging
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_DIR/deploy.log"
}

# Manejo de errores
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Crear directorios
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$APP_DIR"

# Backup del estado actual
log "${YELLOW}Creating backup...${NC}"
gpg --symmetric --cipher-algo AES256 "$APP_DIR/backend/.env" "$BACKUP_DIR/env.backup.$(date +%Y%m%d%H%M%S).gpg"

# Pull del último código
log "${YELLOW}Pulling latest code...${NC}"
cd "$APP_DIR"
git pull origin main || error_exit "Failed to pull latest code"

# Instalar dependencias
log "${YELLOW}Installing dependencies...${NC}"
cd "$APP_DIR/backend"
$VENV_DIR/bin/pip install -r requirements.txt || error_exit "Failed to install backend dependencies"

cd "$APP_DIR/frontend"
npm ci || error_exit "Failed to install frontend dependencies"

# Ejecutar migraciones
log "${YELLOW}Running database migrations...${NC}"
cd "$APP_DIR/backend"
$VENV_DIR/bin/python -m alembic upgrade head || error_exit "Failed to run migrations"

# Construir frontend
log "${YELLOW}Building frontend...${NC}"
cd "$APP_DIR/frontend"
npm run build || error_exit "Failed to build frontend"

# Reiniciar servicios
log "${YELLOW}Restarting services...${NC}"
systemctl restart observatorio-backend || error_exit "Failed to restart backend"
systemctl restart observatorio-frontend || error_exit "Failed to restart frontend"

# Health check
log "${YELLOW}Performing health checks...${NC}"
sleep 30

# Verificar backend
if ! curl -f "http://localhost:8000/api/v1/health" > /dev/null 2>&1; then
    error_exit "Backend health check failed"
fi

# Verificar frontend
if ! curl -f "http://localhost:5173" > /dev/null 2>&1; then
    error_exit "Frontend health check failed"
fi

log "${GREEN}Deployment completed successfully!${NC}"
```

## 7. Backup y Recuperación

### 7.1 Procedimientos de Backup

#### 7.1.1 Backup de PostgreSQL
```bash
# Script: scripts/backup-postgres.sh

BACKUP_DIR="/backups/observatorio"
PG_USER="observatorio"
PG_DB="observatorio_db"
PG_HOST="localhost"
PG_PORT="5432"

# Crear directorio de backup
mkdir -p "$BACKUP_DIR/pg"

# Generar nombre de archivo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pg/backup_$TIMESTAMP.sql"

# Realizar backup
pg_dump -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -F c -b -v "$PG_DB" > "$BACKUP_FILE" || {
    echo "ERROR: PostgreSQL backup failed"
    exit 1
}

# Comprimir backup
gzip "$BACKUP_FILE" || {
    echo "ERROR: Failed to compress backup"
    exit 1
}

# Verificar backup
if ! pg_restore --list "$BACKUP_FILE.gz" > /dev/null 2>&1; then
    echo "ERROR: Backup verification failed"
    rm -f "$BACKUP_FILE.gz"
    exit 1
fi

# Mantener solo últimos 7 días de backups
find "$BACKUP_DIR/pg" -name "backup_*.sql.gz" -mtime +7 -delete

# Log de backup
echo "$(date): PostgreSQL backup completed: $BACKUP_FILE.gz" >> "$BACKUP_DIR/backup.log"

# Backup de esquema
mkdir -p "$BACKUP_DIR/schema"
cd /opt/observatorio/backend
./venv/bin/python -m alembic current > "$BACKUP_DIR/schema/version.txt"
./venv/bin/python -m alembic history --verbose > "$BACKUP_DIR/schema/history.txt"
```

#### 7.1.2 Backup de Neo4j
```bash
# Script: scripts/backup-neo4j.sh

BACKUP_DIR="/backups/observatorio"
NEO4J_HOME="/opt/neo4j"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="observatorio_dev"

# Crear directorio de backup
mkdir -p "$BACKUP_DIR/neo4j"

# Generar nombre de directorio
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR_NAME="neo4j_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_DIR_NAME"

# Crear directorio de backup
mkdir -p "$BACKUP_PATH"

# Ejecutar backup de Neo4j
"$NEO4J_HOME/bin/cypher-shell" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" "
CALL db.backup({
    directory: '$BACKUP_PATH',
    name: 'observatorio_backup'
})
" || {
    echo "ERROR: Neo4j backup failed"
    rm -rf "$BACKUP_PATH"
    exit 1
}

# Verificar archivo de backup
if [ ! -f "$BACKUP_PATH/observatorio_backup.dump" ]; then
    echo "ERROR: Neo4j backup file not created"
    rm -rf "$BACKUP_PATH"
    exit 1
fi

# Comprimir backup
gzip "$BACKUP_PATH/observatorio_backup.dump" || {
    echo "ERROR: Failed to compress Neo4j backup"
    exit 1
}

# Mantener solo últimos 30 días de backups
find "$BACKUP_DIR" -maxdepth 1 -name "neo4j_backup_*" -mtime +30 -exec rm -rf {} + 2>/dev/null

# Log de backup
echo "$(date): Neo4j backup completed: $BACKUP_PATH/observatorio_backup.dump.gz" >> "$BACKUP_DIR/backup.log"

# Backup de esquema del grafo
"$NEO4J_HOME/bin/cypher-shell" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" "
CALL apoc.meta.export(\"${BACKUP_PATH}/schema.graphml\")
" 2>/dev/null || true
```

#### 7.1.3 Backup de Redis
```bash
# Script: scripts/backup-redis.sh

BACKUP_DIR="/backups/observatorio"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Crear directorio de backup
mkdir -p "$BACKUP_DIR/redis"

# Generar nombre de archivo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/redis/redis_backup_$TIMESTAMP.rdb"

# Realizar backup
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" save "$BACKUP_FILE" || {
    echo "ERROR: Redis backup failed"
    exit 1
}

# Verificar backup
if [ ! -s "$BACKUP_FILE" ]; then
    echo "ERROR: Redis backup file is empty"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Mantener solo últimos 7 días de backups
find "$BACKUP_DIR/redis" -name "redis_backup_*.rdb" -mtime +7 -delete

# Log de backup
echo "$(date): Redis backup completed: $BACKUP_FILE" >> "$BACKUP_DIR/backup.log"
```

### 7.2 Tareas Cron
```bash
# Agregar a crontab (crontab -e)
# Backup de PostgreSQL diario a las 2:00 AM
0 2 * * * /opt/observatorio/scripts/backup-postgres.sh

# Backup semanal completo
0 3 * * 0 /opt/observatorio/scripts/backup-postgres.sh

# Archivo de backup mensual
0 2 1 * * /opt/observatorio/scripts/archive-backups.sh
```

### 7.3 Procedimientos de Recuperación
```bash
# Script: scripts/restore-postgres.sh

BACKUP_DIR="/backups/observatorio"
PG_USER="observatorio"
PG_DB="observatorio_db"

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Backups disponibles:"
    find "$BACKUP_DIR/pg" -name "backup_*.sql.gz" | sort -r
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Detener servicios de la aplicación
systemctl stop observatorio-backend || true

# Restaurar base de datos
pg_restore -h localhost -p 5432 -U "$PG_USER" -d "$PG_DB" "$BACKUP_FILE" || {
    echo "ERROR: Failed to restore database"
    exit 1
}

# Iniciar servicios de la aplicación
systemctl start observatorio-backend

# Verificar restauración
if ! psql -h localhost -p 5432 -U "$PG_USER" -d "$PG_DB" -c "SELECT 1" > /dev/null 2>&1; then
    echo "ERROR: Database verification failed"
    exit 1
fi

echo "PostgreSQL restoration completed successfully"
```

## 8. Monitoreo y Alertas

### 8.1 Health Checks
```bash
# Verificar salud del backend
curl -f http://localhost:8000/api/v1/health

# Verificar frontend
curl -f http://localhost:5173

# Verificar servicios de infraestructura
curl -f http://localhost:5432  # PostgreSQL
curl -f http://localhost:7687  # Neo4j
curl -f http://localhost:6379  # Redis
```

### 8.2 Scripts de Monitoreo
```bash
#!/bin/bash
# scripts/health-check.sh

# Verificar todos los componentes
components=("backend" "frontend" "postgresql" "neo4j" "redis")

for component in "${components[@]}"; do
    case $component in
        "backend")
            if ! curl -f "http://localhost:8000/api/v1/health" > /dev/null 2>&1; then
                echo "ALERT: Backend is down"
                # Enviar alerta por email/Slack
            fi
            ;;
        "frontend")
            if ! curl -f "http://localhost:5173" > /dev/null 2>&1; then
                echo "ALERT: Frontend is down"
                # Enviar alerta por email/Slack
            fi
            ;;
        "postgresql")
            if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
                echo "ALERT: PostgreSQL is down"
                # Enviar alerta por email/Slack
            fi
            ;;
        "neo4j")
            if ! curl -f "http://localhost:7474" > /dev/null 2>&1; then
                echo "ALERT: Neo4j is down"
                # Enviar alerta por email/Slack
            fi
            ;;
        "redis")
            if ! redis-cli ping | grep -q PONG; then
                echo "ALERT: Redis is down"
                # Enviar alerta por email/Slack
            fi
            ;;
    esac
done
```

## 9. Documentación de Operación

### 9.1 Guía de Operación (`docs/operation-guide.md`)
```markdown
# Guía de Operación del Observatorio Tecnológico Industrial

## 1. Inicio de Servicios

### Servicios de Infraestructura
```powershell
# Windows
Start-Service postgresql-x64-15
C:\neo4j\bin\neo4j.bat console
C:\redis\redis-server.exe

# Linux
sudo systemctl start postgresql
sudo systemctl start neo4j
sudo systemctl start redis-server
```

### Servicios de Aplicación
```powershell
# Windows
cd C:\observatorio\backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Linux
cd /opt/observatorio/backend
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 2. Tareas de Mantenimiento Diarias

### Verificar Logs
- Backend: `G:\Proyects\Observatorio\observatorio-tecnologico-industrial\logs\backend.log`
- Frontend: `G:\Proyects\Observatorio\observatorio-tecnologico-industrial\logs\frontend.log`

### Verificar Espacio en Disco
```bash
df -h
```

### Verificar Tamaño de Backups
```bash
find /backups/observatorio -type f -name "*.gz" -o -name "*.rdb" | xargs du -h | sort -hr
```

## 3. Tareas de Mantenimiento Semanales

### Probar Restauración de Backup
```bash
# Restaurar último backup de PostgreSQL
LATEST_BACKUP=$(ls -t /backups/observatorio/pg/backup_*.sql.gz | head -1)
sudo /opt/observatorio/scripts/restore-postgres.sh "$LATEST_BACKUP"
```

### Revisar Logs de Errores
```bash
grep -i error G:\Proyects\Observatorio\observatorio-tecnologico-industrial\logs\*.log
```

## 4. Tareas de Mantenimiento Mensuales

### Revisar Políticas de Retención de Backups
- Verificar que los backups antiguos se eliminen automáticamente
- Asegurar que los backups críticos se mantengan por más tiempo

### Verificar Configuración de Monitoreo
- Verificar que Prometheus/Grafana estén corriendo
- Verificar que las alertas estén configuradas correctamente

## 5. Procedimientos de Emergencia

### Fallo de Base de Datos
1. Detener servicios de la aplicación
2. Restaurar desde backup más reciente
3. Iniciar servicios de la aplicación
4. Verificar salud

### Fallo de Servidor
1. Iniciar servicios de infraestructura
2. Iniciar servicios de aplicación
3. Verificar salud
4. Restaurar desde backup si es necesario

## 6. Contactos de Soporte

- Equipo de Operaciones: ops@mindus.gob.cu
- Soporte Técnico: soporte@mindus.gob.cu
- Urgencias: +53-7-123-4567
```

### 9.2 Lista de Verificación de Producción (`docs/production-checklist.md`)
```markdown
# Lista de Verificación de Producción

## Pre-Deployment

### Servidores
- [ ] Sistema operativo actualizado (Windows Server 2022 / Ubuntu 22.04)
- [ ] Java JDK 17 instalado
- [ ] PostgreSQL 15 instalado y corriendo
- [ ] Neo4j 5 instalado y corriendo
- [ ] Redis 5 instalado y corriendo
- [ ] Espacio en disco: > 50GB libre
- [ ] Memoria RAM: > 16GB

### Backend
- [ ] Python 3.11 instalado
- [ ] Virtualenv creado en `/opt/observatorio/backend/venv`
- [ ] Dependencias instaladas (`pip install -r requirements.txt`)
- [ ] Migraciones ejecutadas (`alembic upgrade head`)
- [ ] Superusuario creado (`admin@mindus.gob.cu`)
- [ ] Variables de entorno configuradas
- [ ] Archivo `.env` movido a `/opt/observatorio/backend/.env`
- [ ] Permisos de archivos correctos

### Frontend
- [ ] Node.js 20 instalado
- [ ] Dependencias instaladas (`npm ci`)
- [ ] Build ejecutado (`npm run build`)
- [ ] Archivos construidos en `/opt/observatorio/frontend/dist`
- [ ] Variables de entorno configuradas (`VITE_API_URL`)

### Infraestructura
- [ ] DNS configurado (observatorio.mindus.gob.cu)
- [ ] Certificados SSL (Let's Encrypt)
- [ ] Nginx instalado y configurado
- [ ] Firewall rules permitidas:
  - Puerto 80/443 (HTTP/HTTPS)
  - Puerto 8000 (backend, si no se usa Nginx)
  - Puerto 5173 (frontend, si no se usa Nginx)
- [ ] Logs rotados (/var/log/observatorio/)
- [ ] Monitoreo instalado (Prometheus + Grafana)

### Backup
- [ ] Scripts de backup probados (`scripts/backup-postgres.sh`, etc.)
- [ ] Tareas cron configuradas
- [ ] Retención de backups verificada (30 días PG, 90 días Neo4j)
- [ ] Procedimientos de recuperación probados
- [ ] Copia de seguridad offline creada

### Seguridad
- [ ] Contraseñas fuertes en variables de entorno
- [ ] JWT `SECRET_KEY` rotado
- [ ] CORS restringido a dominios autorizados
- [ ] HTTPS obligatorio (redirect HTTP → HTTPS)
- [ ] Headers de seguridad configurados (HSTS, CSP)
- [ ] Firewall rules restrictivas
- [ ] Logs de auditoría habilitados

### Monitoreo
- [ ] Health check endpoint (`/api/v1/health`)
- [ ] Alertas configuradas (email, Slack)
- [ ] Métricas expuestas (Prometheus)
- [ ] Dashboard de monitoreo creado
- [ ] Scripts de verificación automática

### Documentación
- [ ] README actualizado con enlaces a docs
- [ ] Guía de operación creada (`docs/operation-guide.md`)
- [ ] Procedimientos de emergencia documentados
- [ ] Contactos de soporte listados

## Post-Deployment

### Verificación
- [ ] Health check pasa (`curl http://localhost:8000/api/v1/health`)
- [ ] Login de superusuario funciona
- [ ] Todas las páginas frontend cargan
- [ ] API endpoints responden correctamente
- [ ] Backups se ejecutan según programación

### Monitoreo Inicial
- [ ] Rendimiento monitoreado (CPU, memoria, DB connections)
- [ ] Logs revisados (errores, warnings)
- [ ] Alertas verificadas
- [ ] Tiempo de actividad registrado

### Optimización
- [ ] Índices de base de datos revisados
- [ ] Configuración de cache ajustada
- [ ] Conexiones de base de datos optimizadas
- [ ] Compresión de archivos habilitada

## Mantenimiento

### Diario
- [ ] Verificar logs de aplicaciones
- [ ] Verificar estado de servicios
- [ ] Verificar espacio en disco
- [ ] Verificar tamaño de backups

### Semanal
- [ ] Probar restauración de backup
- [ ] Revisar logs de errores
- [ ] Actualizar dependencias (si es necesario)
- [ ] Optimizar consultas lentas

### Mensual
- [ ] Revisar políticas de retención de backups
- [ ] Verificar configuración de monitoreo
- [ ] Actualizar documentación
- [ ] Realizar pruebas de stress

### Anual
- [ ] Auditoría de seguridad completa
- [ ] Plan de recuperación de desastres revisado
- [ ] Infraestructura actualizada
- [ ] Capacitación al equipo de operación
```
