#!/bin/bash

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Please provide a backup file path"
  echo "Usage: ./restore-db.sh <backup_file>"
  exit 1
fi

# Check if backup file exists
if [ ! -f "$1" ]; then
  echo "Backup file not found: $1"
  exit 1
fi

# Confirm before restore
read -p "This will overwrite the current database. Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled"
  exit 1
fi

# Restore database
echo "Restoring database from $1..."
psql $DATABASE_URL < "$1"

echo "Database restore completed" 