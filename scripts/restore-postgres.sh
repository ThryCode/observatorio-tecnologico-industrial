#!/bin/bash
# Restore PostgreSQL from backup

BACKUP_DIR="/backups/observatorio"
PG_USER="observatorio"
PG_DB="observatorio_db"

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    find "$BACKUP_DIR/pg" -name "backup_*.sql.gz" | sort -r
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Stop application services
systemctl stop observatorio-backend || true

# Restore database
pg_restore -h localhost -p 5432 -U "$PG_USER" -d "$PG_DB" "$BACKUP_FILE" || {
    echo "ERROR: Failed to restore database"
    exit 1
}

# Start application services
systemctl start observatorio-backend

# Verify restoration
if ! psql -h localhost -p 5432 -U "$PG_USER" -d "$PG_DB" -c "SELECT 1" > /dev/null 2>&1; then
    echo "ERROR: Database verification failed"
    exit 1
fi

echo "PostgreSQL restoration completed successfully"
