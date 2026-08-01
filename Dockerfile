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
# Prisma schema must be present for the postinstall `prisma generate` hook
COPY prisma ./prisma
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
  && adduser --system --uid 10