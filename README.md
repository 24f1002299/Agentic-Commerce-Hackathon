# 🛡️ Sentinel: Autonomous Reactive Procurement Agent

> **An AI agent that monitors the web for your trigger conditions and autonomously completes purchases with ironclad financial guardrails.**

[![Built for Prava Agentic Commerce Hackathon](https://img.shields.io/badge/Built%20for-Prava%20Agentic%20Commerce%20Hackathon%202026-blue?style=for-the-badge)](https://devfolio.co/)
[![Powered by Prava](https://img.shields.io/badge/Powered%20by-Prava%20Payments-6366f1?style=for-the-badge)](https://prava.space)
[![OpenAI API](https://img.shields.io/badge/OpenAI-Structured%20Outputs-black?style=for-the-badge&logo=openai)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

🔗 **Live Demo:** [Hugging Face Space](https://huggingface.co/spaces/Hasrathussain/sentinel-autonomous-procurement)  
🎬 **Demo Video:** [Watch 2-Minute Walkthrough](#) *(Replace with your Loom/YouTube link)*  
📂 **Repository:** [github.com/24f1002299/Agentic-Commerce-Hackathon](https://github.com/24f1002299/Agentic-Commerce-Hackathon)

---

## 💡 The Problem
AI agents are great at finding information, but terrible at safely spending money. Traditional "sniping" bots require hardcoded scripts, expose raw credit card details, and lack transparent audit trails. Users are rightfully terrified of giving an AI agent unchecked access to their wallet.

## 🚀 The Solution: Sentinel
Sentinel is a reactive purchasing agent. You state a trigger condition in plain English (*"Buy indigo.dev the second it's available, up to $60"*). Sentinel parses the intent, secures a **hard-capped, pre-approved spending mandate** via Prava, and continuously monitors the target. The instant the condition fires, Sentinel autonomously completes the purchase and delivers a transparent, real-time audit receipt. 

No human intervention required at execution time. No budget overruns possible.

---

## ✨ Key Features & "Trust UX"
- 🗣️ **Conversational Rule Creation**: Natural language input parsed into strict, structured JSON rules via OpenAI.
- 🔒 **Prava-Powered Financial Guardrails**: Spending caps are enforced at the payment network level, not just in app code.
- 📦 **Real-Time Visual Audit Trail**: A beautiful, "package-tracking" style UI (via Server-Sent Events) showing exactly what the agent is doing, step-by-step.
- 📱 **Omni-Channel Notifications**: Instant Telegram bot alerts upon successful execution with receipt links.
- 🛡️ **Bulletproof Execution**: Direct API checkout with a headless Playwright fallback to guarantee demo reliability.

---

## 🏗️ How It Works (End-to-End Flow)
1. **Intent**: User types a natural language rule and sets a max budget.
2. **Authorization**: Sentinel generates a **Prava Mandate**. The user approves it once using biometric **Passkey** authentication.
3. **Monitoring**: A background cron engine polls the target (e.g., domain registrar API or mock storefront) every 15 seconds.
4. **Execution**: When the trigger condition is met, Sentinel requests a **single-use Payment Token** (with dynamic CVV) from Prava, strictly bounded by the mandate's cap.
5. **Completion**: The purchase is executed, the UI updates in real-time, and a Telegram receipt is delivered.

---

## 🔌 Deep Dive: Prava Integration
Sentinel is built *around* Prava, not just tacked on. It leverages Prava's core primitives to solve the "AI spending money safely" problem:
- **Mandates**: Every Sentinel rule is mapped 1:1 to a Prava Mandate, defining the merchant, max amount, and duration.
- **Passkey Approval**: The user grants standing permission securely via biometric approval *before* the trigger fires, enabling true zero-click execution later.
- **Payment Tokens**: At execution time, Sentinel draws a single-use Visa network token + dynamic CVV against the mandate, ensuring the transaction is secure and isolated.
- **Trust**: The UI explicitly displays the Prava mandate details, ensuring the user always knows the absolute maximum the agent is allowed to spend.

---

## 🏆 Hackathon Track Eligibility
- **Prava Overall Finalist**: Core commercial action is entirely enabled by Prava Mandates and Payment Tokens.
- **OpenAI Track**: Uses OpenAI API with `response_format: { type: "json_schema" }` for highly reliable, structured natural language parsing.
- **Visa Intelligent Commerce**: Leverages Prava's Visa-backed single-use tokens and dynamic CVVs for secure, AI-initiated commerce.

---

## 🛠️ Tech Stack
| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Node.js, Express API Routes, Server-Sent Events (SSE) |
| **AI / ML** | OpenAI API (Structured Outputs) |
| **Payments** | **Prava SDK** (`@prava-sdk/cli`), Passkey Auth |
| **Database** | SQLite, Prisma ORM |
| **Automation** | Playwright (Headless Checkout Fallback), `node-cron` |
| **Notifications** | Telegram Bot API (`node-telegram-bot-api`) |
| **Deployment** | Hugging Face Spaces / Railway |

---

## 🚀 Getting Started (Local Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/24f1002299/Agentic-Commerce-Hackathon.git
   cd Agentic-Commerce-Hackathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   # Install Prava skills globally for agent context
   npx skills add https://github.com/Prava-Payments/prava-skills --skill prava-sdk-integration --global --yes --full-depth
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="file:./dev.db"
   OPENAI_API_KEY="your_openai_api_key"
   PRAVA_API_KEY="your_prava_sandbox_api_key"
   PRAVA_MERCHANT_ID="your_prava_merchant_id"
   TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
   TELEGRAM_CHAT_ID="your_telegram_chat_id"
   ```

4. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see Sentinel in action.

---

## 📜 Hackathon Disclosure
In accordance with the Prava Agentic Commerce Hackathon rules:
- **Pre-existing work**: None. The core concept was ideated prior, but **100% of the code, UI, Prava integration, and automation logic was built from scratch** during the official build window (July 31 – August 2, 2026).
- **Mock Data**: The project utilizes a controlled mock storefront API and a domain availability checker to ensure 100% reliable, reproducible demo execution for judges. The Prava payment flow, however, uses real Prava Sandbox transactions.
- **Team**: Solo builder.

---

## 🤝 Acknowledgments
- Built for the **Prava Agentic Commerce Hackathon 2026**.
- Special thanks to the Prava team for the excellent SDK documentation and Discord support.
- Inspired by the need for trustworthy, autonomous financial agents.

---
*Made with 🛡️ and ☕ by (https://www.linkedin.com/in/hasrat-hussain-08b637233/)*

---
