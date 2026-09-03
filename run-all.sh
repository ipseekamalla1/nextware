#!/bin/bash

set -e

echo "🚀 Starting Nextware..."

# Backend
echo "🔵 Starting backend..."
(
    cd backend
    ./run-dev.sh
) &
BACKEND_PID=$!

# Frontend
echo "🟢 Starting frontend..."
(
    cd frontend
    npm run dev
) &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "🛑 Stopping Nextware..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
}

trap cleanup SIGINT SIGTERM

echo ""
echo "======================================"
echo "       NEXTWARE DEV ENVIRONMENT"
echo "======================================"
echo "Backend:  ./backend/run-dev.sh"
echo "Frontend: npm run dev"
echo "======================================"
echo ""

wait