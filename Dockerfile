# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

ENV DATABASE_URL="file:./dummy.db"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3 — runner
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# System dependencies for Playwright Chromium
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

# Non-root user — SINGLE LINE to avoid truncation
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy standalone Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema + generated client + CLI package
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# FIX: Create a proper symlink for .bin/prisma
# Docker COPY flattens symlinks into regular files, which breaks Prisma's
# WASM resolution (prisma_schema_build_bg.wasm resolves relative to __dirname).
# A real symlink keeps __dirname pointing to prisma/build/ where the WASM lives.
RUN mkdir -p ./node_modules/.bin && ln -sf ../prisma/build/index.js ./node_modules/.bin/prisma && chown -h nextjs:nodejs ./node_modules/.bin/prisma

COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Install Playwright Chromium
COPY --from=builder /app/node_modules/playwright ./node_modules/playwright
COPY --from=builder /app/node_modules/playwright-core ./node_modules/playwright-core

RUN ln -sf ../playwright-core/cli.js ./node_modules/.bin/playwright && chown -h nextjs:nodejs ./node_modules/.bin/playwright || true

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install chromium --with-deps && chown -R nextjs:nodejs /ms-playwright || true

# Runtime config
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7860
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:./dev.db"

USER nextjs

EXPOSE 7860

ENTRYPOINT ["./entrypoint.sh"]