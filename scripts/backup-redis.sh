#!/bin/bash
# Redis backup script

BACKUP_DIR="/backups/observatorio"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Create backup directory
mkdir -p "$BACKUP_DIR/redis"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/redis/redis_backup_$TIMESTAMP.rdb"

# Perform backup
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" save "$BACKUP_FILE" || {
    echo "ERROR: Redis backup failed"
    exit 1
}

# Verify backup
if [ ! -s "$BACKUP_FILE" ]; then
    echo "ERROR: Redis backup file is empty"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Keep only last 7 days of backups
find "$BACKUP_DIR/redis" -name "redis_backup_*.rdb" -mtime +7 -delete

# Log backup completion
echo "$(date): Redis backup completed: $BACKUP_FILE" >> "$BACKUP_DIR/backup.log"

echo "Redis backup completed successfully"
