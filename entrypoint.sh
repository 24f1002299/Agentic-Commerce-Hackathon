#!/bin/sh
set -e

echo "===== Application Startup at $(date '+%Y-%m-%d %H:%M:%S') ====="

if echo "$DATABASE_URL" | grep -q "^file:/data/"; then
  mkdir -p /data
fi

echo "Running prisma db push..."
if [ -f "./node_modules/prisma/build/index.js" ]; then
  node ./node_modules/prisma/build/index.js db push --skip-generate
else
  npx prisma db push --skip-generate
fi

echo "Starting Next.js on port ${PORT:-7860}..."
exec node server.js