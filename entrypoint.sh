#!/bin/sh
set -e

echo "===== Application Startup at $(date '+%Y-%m-%d %H:%M:%S') ====="

# ── Persistent Storage ────────────────────────────────────────────────────────
# If DATABASE_URL points at /data/* (HF Persistent Storage), make sure the
# directory exists before Prisma tries to create the DB file.
if echo "$DATABASE_URL" | grep -q "^file:/data/"; then
  mkdir -p /data
fi

# ── DB Migration / Init ───────────────────────────────────────────────────────
# Use the direct node path instead of `npx prisma` to avoid the Docker
# symlink-flattening bug that breaks WASM resolution in node_modules/.bin/.
#
# Fallback chain:
#   1. node ./node_modules/prisma/build/index.js   (real package location)
#   2. npx prisma                                   (if structure changes)
echo "Running prisma db push..."
if [ -f "./node_modules/prisma/build/index.js" ]; then
  node ./node_modules/prisma/build/index.js db push --skip-generate
else
  npx prisma db push --skip-generate
fi

# ── Start App ─────────────────────────────────────────────────────────────────
echo "Starting Next.js on port ${PORT:-7860}..."
exec node server.js