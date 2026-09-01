#!/usr/bin/env bash
#
# Nextware — development database backup.
# Writes a timestamped custom-format dump into ./backups (git-ignored).
#
# Usage: scripts/db-backup.sh
set -euo pipefail

CONTAINER="nextware-postgres"
DB="nextware"
DB_USER="nextware"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"

if ! docker inspect "${CONTAINER}" >/dev/null 2>&1; then
  echo "error: container '${CONTAINER}' is not present."
  echo "       start it with:  docker compose up -d postgres"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
STAMP="$(date +%Y-%m-%d-%H%M%S)"
FILE="${BACKUP_DIR}/nextware-dev-${STAMP}.dump"

echo "Backing up database '${DB}' from '${CONTAINER}'..."
docker exec "${CONTAINER}" pg_dump -U "${DB_USER}" -Fc "${DB}" > "${FILE}"

echo "Backup written: ${FILE} ($(du -h "${FILE}" | cut -f1))"
