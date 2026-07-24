#!/bin/bash
# PostgreSQL backup script

BACKUP_DIR="/backups/observatorio"
PG_USER="observatorio"
PG_DB="observatorio_db"
PG_HOST="localhost"
PG_PORT="5432"

# Create backup directory
mkdir -p "$BACKUP_DIR/pg"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pg/backup_$TIMESTAMP.sql"

# Perform backup
pg_dump -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -F c -b -v "$PG_DB" > "$BACKUP_FILE" || {
    echo "ERROR: PostgreSQL backup failed"
    exit 1
}

# Compress backup
gzip "$BACKUP_FILE" || {
    echo "ERROR: Failed to compress backup"
    exit 1
}

# Verify backup
if ! pg_restore --list "$BACKUP_FILE.gz" > /dev/null 2>&1; then
    echo "ERROR: Backup verification failed"
    rm -f "$BACKUP_FILE.gz"
    exit 1
fi

# Keep only last 7 days of backups
find "$BACKUP_DIR/pg" -name "backup_*.sql.gz" -mtime +7 -delete

# Encrypt backup (optional)
# gpg --symmetric --cipher-algo AES256 "$BACKUP_FILE.gz" "$BACKUP_FILE.gz.gpg"

# Log backup completion
echo "$(date): PostgreSQL backup completed: $BACKUP_FILE.gz" >> "$BACKUP_DIR/backup.log"

# Create database schema backup
mkdir -p "$BACKUP_DIR/schema"
cd /opt/observatorio/backend
./venv/bin/python -m alembic current > "$BACKUP_DIR/schema/version.txt"
./venv/bin/python -m alembic history --verbose > "$BACKUP_DIR/schema/history.txt"

echo "PostgreSQL backup completed successfully"
