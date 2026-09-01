#!/usr/bin/env bash
#
# Nextware — development database reset.
# Drops and recreates the empty 'nextware' development database. The next
# backend start (dev profile) re-applies Flyway migrations and reseeds the
# demo data via DevelopmentDataSeeder.
#
# This only ever touches the local docker-compose 'nextware-postgres'
# container. It refuses to run against anything else.
#
# Usage: scripts/db-reset.sh [--yes]
set -euo pipefail

CONTAINER="nextware-postgres"
DB="nextware"
DB_USER="nextware"
CONFIRM="${1:-}"

if ! docker inspect "${CONTAINER}" >/dev/null 2>&1; then
  echo "error: container '${CONTAINER}' is not present."
  echo "       start it with:  docker compose up -d postgres"
  exit 1
fi

if [ "${CONFIRM}" != "--yes" ]; then
  echo "This DROPS and recreates the '${DB}' development database in '${CONTAINER}'."
  echo "All local development data will be lost."
  read -r -p "Type 'yes' to continue: " answer
  [ "${answer}" = "yes" ] || { echo "Aborted."; exit 1; }
fi

echo "Stop the backend first if it is running (it holds connections)."
echo "Dropping and recreating '${DB}'..."
docker exec "${CONTAINER}" psql -U "${DB_USER}" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS ${DB} WITH (FORCE);" \
  -c "CREATE DATABASE ${DB} OWNER ${DB_USER};"

echo "Done."
echo "Next: start the backend with SPRING_PROFILES_ACTIVE=dev to run Flyway + reseed."
