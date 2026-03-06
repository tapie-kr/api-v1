#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/database && pnpm run migrate:prod

echo "Starting API server..."
cd /app/packages/api && exec node dist/main.js
