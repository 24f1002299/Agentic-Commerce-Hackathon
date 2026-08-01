# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps
# Install production + dev node_modules (cached separately for faster rebuilds)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

# Install OpenSSL (required by Prisma) and other OS-level deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci


# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder
# Generate Prisma client + build the Next.js standalone output
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
  && rm -rf /var/lib/apt/lists/*

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (uses node_modules already present)
RUN npx prisma generate

# Build Next.js — produces .next/standalone + .next/static
# DATABASE_URL is only needed at runtime; provide a dummy so Prisma client
# doesn't complain during build-time imports.
ENV DATABASE_URL="file:./dummy.db"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# ──────────────────────────────────────────────────────────────────────────────
# Stage 3 — runner
# Minimal production image: standalone Next.js + Playwright Chromium
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# ── System dependencies ───────────────────────────────────────────────────────
# Chromium runtime libs required by Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    wget \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libx11-6 \
    libxext6 \
  && rm -rf /var/lib/apt/lists/*

# ── Non-root user (HF Spaces security requirement) ────────────────────────────
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# ── Copy standalone Next.js output ───────────────────────────────────────────
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

# ── Copy Prisma schema + engine + entrypoint ─────────────────────────────────
COPY --from=builder --chown=nextjs:nodejs /app/prisma           ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma      ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma       ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma  ./node_modules/.bin/prisma

COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# ── Install Playwright Chromium ───────────────────────────────────────────────
# Copy playwright packages (run as root so we can install system deps)
COPY --from=builder /app/node_modules/playwright      ./node_modules/playwright
COPY --from=builder /app/node_modules/playwright-core ./node_modules/playwright-core

# Install Chromium + its OS deps, store in a location the nextjs user can read
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install chromium --with-deps \
  && chown -R nextjs:nodejs /ms-playwright || true

# ── Runtime config ────────────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# HF Spaces mandates port 7860
ENV PORT=7860
ENV HOSTNAME=0.0.0.0

# Default DB path — override with HF Persistent Storage: file:/data/sqlite.db
ENV DATABASE_URL="file:./dev.db"

USER nextjs

EXPOSE 7860

ENTRYPOINT ["./entrypoint.sh"]
