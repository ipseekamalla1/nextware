#!/usr/bin/env bash
#
# Nextware — open a psql shell against the development database.
# Usage: scripts/db-shell.sh [extra psql args]
set -euo pipefail
exec docker exec -it nextware-postgres psql -U nextware -d nextware "$@"
