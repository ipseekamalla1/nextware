#!/usr/bin/env bash
#
# Nextware — development database restore.
# Restores a dump produced by scripts/db-backup.sh into the dev database.
# This REPLACES the contents of the 'nextware' development database.
#
# Usage: scripts/db-restore.sh <backup-file.dump> [--yes]
set -euo pipefail

CONTAINER="nextware-postgres"
DB="nextware"
DB_USER="nextware"

FILE="${1:-}"
CONFIRM="${2:-}"

if [ -z "${FILE}" ]; then
  echo "Usage: scripts/db-restore.sh <backup-file.dump> [--yes]"
  exit 1
fi

if [ ! -f "${FILE}" ]; then
  echo "error: file not found: ${FILE}"
  exit 1
fi

if ! docker inspect "${CONTAINER}" >/dev/null 2>&1; then
  echo "error: container '${CONTAINER}' is not present."
  exit 1
fi

if [ "${CONFIRM}" != "--yes" ]; then
  read -r -p "This REPLACES all data in the '${DB}' development database. Type 'yes' to continue: " answer
  [ "${answer}" = "yes" ] || { echo "Aborted."; exit 1; }
fi

echo "Stop the backend before restoring if it is running."
echo "Restoring '${FILE}' into '${DB}'..."
docker exec -i "${CONTAINER}" pg_restore -U "${DB_USER}" -d "${DB}" \
  --clean --if-exists --no-owner < "${FILE}"

echo "Restore complete. Verification:"
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${DB}" -tA \
  -c "SELECT 'companies=' || count(*) FROM company;" \
  -c "SELECT 'products='  || count(*) FROM product;"
