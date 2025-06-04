#!/bin/bash

# Create backups directory if it doesn't exist
mkdir -p ./backups

# Get current timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
echo "Creating database backup..."
pg_dump $DATABASE_URL > "./backups/dev_backup_${TIMESTAMP}.sql"

# Keep only the last 5 backups
ls -t ./backups/dev_backup_*.sql | tail -n +6 | xargs -r rm

echo "Backup completed: ./backups/dev_backup_${TIMESTAMP}.sql" 