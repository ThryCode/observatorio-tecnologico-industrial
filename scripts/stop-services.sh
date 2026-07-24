#!/bin/bash
# Stop all services

APP_DIR="/opt/observatorio"

# Stop frontend
if [ -f "$APP_DIR/frontend.pid" ]; then
    kill $(cat "$APP_DIR/frontend.pid") 2>/dev/null || true
    rm -f "$APP_DIR/frontend.pid"
fi

# Stop backend
if [ -f "$APP_DIR/backend.pid" ]; then
    kill $(cat "$APP_DIR/backend.pid") 2>/dev/null || true
    rm -f "$APP_DIR/backend.pid"
fi

# Stop infrastructure services
systemctl stop postgresql || service postgresql stop || true
sudo -u neo4j /opt/neo4j/bin/neo4j stop || true
systemctl stop redis || service redis stop || true

echo "All services stopped"
