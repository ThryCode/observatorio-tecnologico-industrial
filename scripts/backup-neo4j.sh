#!/bin/bash
# Neo4j backup script

BACKUP_DIR="/backups/observatorio"
NEO4J_HOME="/opt/neo4j"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="observatorio_dev"

# Create backup directory
mkdir -p "$BACKUP_DIR/neo4j"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR_NAME="neo4j_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_DIR_NAME"

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Run Neo4j backup
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

# Verify backup files exist
if [ ! -f "$BACKUP_PATH/observatorio_backup.dump" ]; then
    echo "ERROR: Neo4j backup file not created"
    rm -rf "$BACKUP_PATH"
    exit 1
fi

# Compress backup
gzip "$BACKUP_PATH/observatorio_backup.dump" || {
    echo "ERROR: Failed to compress Neo4j backup"
    exit 1
}

# Keep only last 30 days of backups
find "$BACKUP_DIR" -maxdepth 1 -name "neo4j_backup_*" -mtime +30 -exec rm -rf {} + 2>/dev/null

# Log backup completion
echo "$(date): Neo4j backup completed: $BACKUP_PATH/observatorio_backup.dump.gz" >> "$BACKUP_DIR/backup.log"

# Create graph schema backup
"$NEO4J_HOME/bin/cypher-shell" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" "
CALL apoc.meta.export(\"${BACKUP_PATH}/schema.graphml\")
" 2>/dev/null || true

echo "Neo4j backup completed successfully"
