# Deployment script for Observatorio Tecnológico Industrial

#!/bin/bash
# Deployment script for Observatorio Tecnológico Industrial

set -e

# Configuration
BACKUP_DIR="/backups/observatorio"
APP_DIR="/opt/observatorio"
VENV_DIR="$APP_DIR/backend/venv"
LOG_DIR="$APP_DIR/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_DIR/deploy.log"
}

# Error handling
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Create directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$APP_DIR"

# Backup current state
log "${YELLOW}Creating backup...${NC}"
gpg --symmetric --cipher-algo AES256 "$APP_DIR/backend/.env" "$BACKUP_DIR/env.backup.$(date +%Y%m%d%H%M%S).gpg"

# Pull latest code
log "${YELLOW}Pulling latest code...${NC}"
cd "$APP_DIR"
git pull origin main || error_exit "Failed to pull latest code"

# Install dependencies
log "${YELLOW}Installing dependencies...${NC}"
cd "$APP_DIR/backend"
$VENV_DIR/bin/pip install -r requirements.txt || error_exit "Failed to install backend dependencies"

cd "$APP_DIR/frontend"
npm ci || error_exit "Failed to install frontend dependencies"

# Run migrations
log "${YELLOW}Running database migrations...${NC}"
cd "$APP_DIR/backend"
$VENV_DIR/bin/python -m alembic upgrade head || error_exit "Failed to run migrations"

# Build frontend
log "${YELLOW}Building frontend...${NC}"
cd "$APP_DIR/frontend"
npm run build || error_exit "Failed to build frontend"

# Restart services
log "${YELLOW}Restarting services...${NC}"
systemctl restart observatorio-backend || error_exit "Failed to restart backend"
systemctl restart observatorio-frontend || error_exit "Failed to restart frontend"

# Health check
log "${YELLOW}Performing health checks...${NC}"
sleep 30

# Check backend health
if ! curl -f "http://localhost:8000/api/v1/health" > /dev/null 2>&1; then
    error_exit "Backend health check failed"
fi

# Check frontend
if ! curl -f "http://localhost:5173" > /dev/null 2>&1; then
    error_exit "Frontend health check failed"
fi

log "${GREEN}Deployment completed successfully!${NC}"
