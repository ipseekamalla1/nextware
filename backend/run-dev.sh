#!/bin/bash

set -e

cd "$(dirname "$0")"

# Load backend environment variables
if [ ! -f ".env" ]; then
    echo "ERROR: .env not found in backend directory."
    exit 1
fi

set -a
source .env
set +a

# Verify JWT configuration
if [ -z "${NEXTWARE_JWT_SECRET:-}" ]; then
    echo "ERROR: NEXTWARE_JWT_SECRET is not configured in .env."
    exit 1
fi

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
echo "JWT secret: loaded (${JWT_LENGTH} characters)"
echo "========================================"
echo ""

./mvnw spring-boot:run