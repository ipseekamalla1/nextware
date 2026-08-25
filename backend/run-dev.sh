#!/bin/bash

set -e

# Always run from the backend directory
cd "$(dirname "$0")"

# Load project environment variables
if [ ! -f "../.env" ]; then
    echo "ERROR: ../.env not found."
    echo "Expected .env at the Nextware project root."
    exit 1
fi

set -a
source ../.env
set +a

# Verify required JWT configuration
if [ -z "${NEXTWARE_JWT_SECRET:-}" ]; then
    echo "ERROR: NEXTWARE_JWT_SECRET is not configured."
    exit 1
fi

# Verify JWT secret is strong enough for HS256
JWT_LENGTH=$(printf "%s" "$NEXTWARE_JWT_SECRET" | wc -c | tr -d ' ')

if [ "$JWT_LENGTH" -lt 43 ]; then
    echo "ERROR: NEXTWARE_JWT_SECRET is too short."
    echo "Expected at least 43 Base64 characters."
    exit 1
fi

echo ""
echo "========================================"
echo "        Nextware Backend"
echo "========================================"
echo "Profile: ${SPRING_PROFILES_ACTIVE:-default}"
echo "JWT secret: loaded"
echo "========================================"
echo ""

./mvnw spring-boot:run