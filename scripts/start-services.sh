#!/bin/bash
# Start all services for production

set -e

APP_DIR="/opt/observatorio"
VENV_DIR="$APP_DIR/backend/venv"

# Start PostgreSQL (assuming systemd service exists)
systemctl start postgresql || service postgresql start

# Start Neo4j
sudo -u neo4j /opt/neo4j/bin/neo4j start || error_exit "Failed to start Neo4j"

# Start Redis
systemctl start redis || service redis start

# Start backend
cd "$APP_DIR/backend"
$VENV_DIR/bin/nohup $VENV_DIR/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$APP_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$APP_DIR/backend.pid"

# Start frontend
cd "$APP_DIR/frontend"
npm run start > "$APP_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$APP_DIR/frontend.pid"

# Wait for services to start
sleep 30

# Verify services are running
if ! curl -f "http://localhost:8000/api/v1/health" > /dev/null 2>&1; then
    echo "Backend failed to start"
    exit 1
fi

echo "All services started successfully"
