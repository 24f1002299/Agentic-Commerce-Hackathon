#!/bin/sh
set -e

# ── Persistent Storage ────────────────────────────────────────────────────────
# If DATABASE_URL points at /data/* (HF Persistent Storage), make sure the
# directory exists before Prisma tries to create the DB file.
if echo "$DATABASE_URL" | grep -q "^file:/data/"; then
  mkdir -p /data
fi

# ── DB Migration / Init ───────────────────────────────────────────────────────
# prisma db push creates the schema on first run and is a no-op if it's
# already up-to-date. Safe to run on every container start.
echo "Running prisma db push..."
npx prisma db push --skip-generate

# ── Start App ─────────────────────────────────────────────────────────────────
echo "Starting Next.js on port ${PORT:-7860}..."
exec node server.js
