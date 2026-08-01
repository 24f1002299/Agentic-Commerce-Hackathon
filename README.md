---
title: Sentinel Autonomous Procurement
emoji: 🛡️
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# 🛡️ Sentinel — Autonomous Procurement Agent

**Sentinel** is an AI-powered autonomous procurement system that monitors the web, enforces configurable spending rules, and executes purchases — all without manual intervention.

## Features

- 🤖 **Agentic AI** — OpenAI-powered natural-language rule engine
- 🔍 **Domain Checking** — Playwright-driven real-time product availability monitoring
- 💳 **Autonomous Payments** — Prava mandate-based payment execution
- 📋 **Audit Trail** — Full log of every agent action
- ⚙️ **Rule Management** — Create, approve, and monitor procurement rules

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + Framer Motion |
| Database | Prisma + SQLite |
| Payments | Prava SDK |
| AI | OpenAI GPT-4 |
| Browser | Playwright + Chromium |

## Environment Variables

Set these in **Space Settings → Variables and secrets**:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `PRAVA_API_KEY` | Prava secret key (`sk_test_...`) |
| `NEXT_PUBLIC_PRAVA_PUBLISHABLE_KEY` | Prava publishable key (`pk_test_...`) |
| `PRAVA_ENVIRONMENT` | `sandbox` or `production` |
| `PRAVA_API_BASE` | `https://sandbox.api.prava.space` |
| `PRAVA_CUSTOMER_ID` | Your Prava customer ID |
| `PRAVA_USER_EMAIL` | Your email address |
| `PRAVA_MERCHANT_NAME` | `Sentinel Autonomous Procurement` |
| `PRAVA_MERCHANT_URL` | Your HF Space URL |
| `NEXT_PUBLIC_APP_URL` | Your HF Space URL |
| `DATABASE_URL` | `file:/data/sqlite.db` (with Persistent Storage) or `file:./dev.db` |

## Persistent Storage

By default, the SQLite database is **ephemeral** and will be wiped on every restart.

To persist rules and payment sessions across restarts:
1. Enable **Persistent Storage** in Space Settings (~$5/month)
2. Set `DATABASE_URL=file:/data/sqlite.db`
