The code interpreter environment keeps resetting between cells, making it impossible to build the file incrementally. Let me deliver the **complete design.md** directly here — just copy everything below into a file called `design.md` in your project root.

---

# 🎨 Sentinel — Design System & UX Specification

> **Goal**: Win the "Best UX / Mac Mini" prize at the Prava Agentic Commerce Hackathon.
> **Philosophy**: An AI agent spending your money should feel like having a trusted, meticulous financial assistant — never a black box. Every pixel must communicate **safety, transparency, and delight**.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout Grid](#4-spacing--layout-grid)
5. [Component Specifications](#5-component-specifications)
6. [Animation & Motion](#6-animation--motion)
7. [Screen-by-Screen UX Breakdown](#7-screen-by-screen-ux-breakdown)
8. [Trust UX Patterns (Critical)](#8-trust-ux-patterns)
9. [Micro-Interactions & Delight](#9-micro-interactions--delight)
10. [Loading, Empty & Error States](#10-loading-empty--error-states)
11. [Mobile Responsiveness](#11-mobile-responsiveness)
12. [Accessibility](#12-accessibility)
13. [Copy & Tone of Voice](#13-copy--tone-of-voice)
14. [Iconography](#14-iconography)
15. [Final Polish Checklist](#15-final-polish-checklist)

---

## 1. Design Philosophy

### The Core Problem
Users are terrified of AI spending their money. Every design decision must answer:
> *"Does this make the user feel SAFE, INFORMED, and IN CONTROL?"*

### Three Pillars

| Pillar | Meaning | UX Expression |
|--------|---------|---------------|
| **Transparency** | User always knows what the agent is doing and how much it costs. | Real-time visual timeline, explicit budget displays, receipt generation. |
| **Control** | User sets the rules and can revoke permission at any time. | Clear Passkey approval, budget sliders, pause/cancel buttons always visible. |
| **Delight** | The experience feels premium, responsive, and rewarding. | Smooth animations, success confetti, satisfying state transitions. |

### Aesthetic Direction
- **Inspiration**: Linear, Vercel, Raycast, Arc Browser
- **Mood**: Calm confidence. Not flashy. Not corporate. *Precise.*
- **Primary Mode**: Dark mode (premium feel, reduces cognitive load for monitoring)
- **Secondary Mode**: Light mode (accessibility and judge preference)

---

## 2. Color System

### Dark Mode (Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0A0A0B` | Page background |
| `--bg-secondary` | `#111113` | Card backgrounds, sidebar |
| `--bg-tertiary` | `#1A1A1E` | Hover states, input fields |
| `--bg-elevated` | `#222226` | Modals, dropdowns, popovers |
| `--border-subtle` | `#2A2A2E` | Card borders, dividers |
| `--border-strong` | `#3A3A3E` | Active input borders, focus rings |
| `--text-primary` | `#FAFAFA` | Headings, primary content |
| `--text-secondary` | `#A1A1AA` | Descriptions, labels, metadata |
| `--text-tertiary` | `#71717A` | Placeholders, disabled text |
| `--accent` | `#6366F1` | Primary buttons, active states, links (Indigo) |
| `--accent-hover` | `#818CF8` | Button hover |
| `--accent-muted` | `rgba(99,102,241,0.15)` | Accent backgrounds, badges |
| `--success` | `#10B981` | Purchase complete, active monitoring |
| `--success-muted` | `rgba(16,185,129,0.15)` | Success badge backgrounds |
| `--warning` | `#F59E0B` | Budget approaching limit, pending states |
| `--warning-muted` | `rgba(245,158,11,0.15)` | Warning badge backgrounds |
| `--danger` | `#EF4444` | Failed purchases, budget exceeded |
| `--danger-muted` | `rgba(239,68,68,0.15)` | Error badge backgrounds |
| `--prava-brand` | `#7C3AED` | Prava-specific elements, Passkey approval (Violet) |

### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#FFFFFF` | Page background |
| `--bg-secondary` | `#F9FAFB` | Card backgrounds |
| `--bg-tertiary` | `#F3F4F6` | Hover states, inputs |
| `--text-primary` | `#111827` | Headings |
| `--text-secondary` | `#6B7280` | Descriptions |
| `--border-subtle` | `#E5E7EB` | Borders |

### Gradient Accents (Use Sparingly)

```css
/* Hero / CTA gradient */
background: linear-gradient(135deg, #6366F1 0%, #7C3AED 50%, #6366F1 100%);

/* Success glow (purchase complete) */
box-shadow: 0 0 40px rgba(16, 185, 129, 0.15);

/* Card hover glow */
box-shadow: 0 0 30px rgba(99, 102, 241, 0.08);
```

---

## 3. Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
```

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 36px / 2.25rem | 700 | 1.1 | Hero headline (landing only) |
| H1 | 28px / 1.75rem | 600 | 1.2 | Page titles |
| H2 | 22px / 1.375rem | 600 | 1.3 | Section headers |
| H3 | 18px / 1.125rem | 600 | 1.4 | Card titles, modal headers |
| Body | 15px / 0.9375rem | 400 | 1.6 | Primary content |
| Body Small | 14px / 0.875rem | 400 | 1.5 | Secondary content, descriptions |
| Caption | 13px / 0.8125rem | 500 | 1.4 | Labels, metadata, timestamps |
| Mono | 13px / 0.8125rem | 400 | 1.5 | Code, transaction IDs, amounts |

### Rules
- **Never** use more than 2 font weights on a single screen.
- **Amounts** (prices, budgets) always use `--font-mono` for tabular alignment.
- **Line length** for body text: max 65 characters (use `max-w-prose`).

---

## 4. Spacing & Layout Grid

### Spacing Scale (4px base)

```
4px   → xs   (icon-to-text gaps)
8px   → sm   (tight internal padding)
12px  → md   (between related elements)
16px  → lg   (card padding on mobile)
24px  → xl   (card padding on desktop, section gaps)
32px  → 2xl  (between sections)
48px  → 3xl  (page-level vertical rhythm)
64px  → 4xl  (hero spacing)
```

### Layout
- **Max content width**: `1200px` (centered with `mx-auto`)
- **Sidebar width**: `260px` (desktop), hidden on mobile (bottom nav instead)
- **Card border radius**: `12px` (consistent everywhere)
- **Button border radius**: `8px`
- **Input border radius**: `8px`
- **Modal border radius**: `16px`
- **Card padding**: `24px` desktop, `16px` mobile
- **Page horizontal padding**: `24px` desktop, `16px` mobile

### Grid
- Dashboard cards: CSS Grid, `repeat(auto-fill, minmax(340px, 1fr))`, `gap: 20px`
- On mobile: single column, full width

---

## 5. Component Specifications

### 5.1 Primary Button

```
Height: 40px
Padding: 0 20px
Font: 14px / 500
Background: var(--accent)
Text: #FFFFFF
Border-radius: 8px
Transition: all 0.15s ease
Hover: background var(--accent-hover), translateY(-1px)
Active: translateY(0), scale(0.98)
Disabled: opacity 0.5, cursor not-allowed
Focus: 2px solid var(--accent), offset 2px
```

### 5.2 Secondary / Ghost Button

```
Height: 40px
Background: transparent
Border: 1px solid var(--border-subtle)
Text: var(--text-primary)
Hover: background var(--bg-tertiary), border var(--border-strong)
```

### 5.3 Danger Button (Cancel Rule / Revoke)

```
Background: transparent
Border: 1px solid var(--danger)
Text: var(--danger)
Hover: background var(--danger-muted)
```

### 5.4 Input Field

```
Height: 44px
Padding: 0 14px
Background: var(--bg-tertiary)
Border: 1px solid var(--border-subtle)
Border-radius: 8px
Font: 15px / 400
Placeholder: var(--text-tertiary)
Focus: border var(--accent), box-shadow 0 0 0 3px var(--accent-muted)
Transition: border 0.15s ease, box-shadow 0.15s ease
```

### 5.5 Card (Rule Card)

```
Background: var(--bg-secondary)
Border: 1px solid var(--border-subtle)
Border-radius: 12px
Padding: 24px
Transition: all 0.2s ease
Hover: border var(--border-strong), box-shadow 0 4px 24px rgba(0,0,0,0.2)
```

### 5.6 Status Badge

```
Height: 24px
Padding: 0 10px
Font: 12px / 600, uppercase, letter-spacing 0.5px
Border-radius: 9999px (pill)

Active:     bg var(--success-muted),  text var(--success),  dot ●
Pending:    bg var(--warning-muted),  text var(--warning),  dot ●
Failed:     bg var(--danger-muted),   text var(--danger),   dot ●
Monitoring: bg var(--accent-muted),   text var(--accent),   animated pulse dot
```

### 5.7 Modal (Passkey Approval)

```
Width: 440px (max), 90vw (mobile)
Background: var(--bg-elevated)
Border: 1px solid var(--border-subtle)
Border-radius: 16px
Padding: 32px
Overlay: rgba(0,0,0,0.6) with backdrop-filter: blur(4px)
Animation: scale(0.95) → scale(1), opacity 0 → 1, 200ms ease-out
```

### 5.8 Toast Notification (sonner)

```
Position: bottom-right (desktop), bottom-center (mobile)
Background: var(--bg-elevated)
Border: 1px solid var(--border-subtle)
Border-radius: 12px
Padding: 16px 20px
Shadow: 0 8px 32px rgba(0,0,0,0.3)
Auto-dismiss: 5 seconds
Animation: slide-in from right, 250ms ease-out
```

---

## 6. Animation & Motion

### Principles
- **Purposeful**: Every animation communicates a state change. No gratuitous motion.
- **Fast**: Most transitions are 150–250ms. Nothing exceeds 400ms.
- **Easing**: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for transforms.

### Standard Transitions

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Button hover | background, transform | 150ms | ease |
| Card hover | border-color, box-shadow | 200ms | ease |
| Modal entrance | opacity, scale | 200ms | ease-out |
| Modal exit | opacity, scale | 150ms | ease-in |
| Page transition | opacity, translateY(8px) | 250ms | ease-out |
| Toast entrance | opacity, translateX(20px) | 250ms | ease-out |
| Timeline step reveal | opacity, translateY(12px) | 300ms | ease-out |
| Success checkmark | scale(0) → scale(1) | 400ms | spring(1, 80, 10) |
| Confetti burst | — | 1500ms | — |
| Skeleton shimmer | background-position | 1500ms | linear, infinite |
| Pulse dot (monitoring) | opacity, scale | 2000ms | ease-in-out, infinite |

### Framer Motion Variants (Copy-Paste Ready)

```tsx
// Card entrance
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }
};

// Timeline step stagger
const timelineContainer = {
  visible: { transition: { staggerChildren: 0.15 } }
};
const timelineItem = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

// Success checkmark
const checkmark = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1, opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 15 }
  }
};

// Modal
const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};
const modalContent = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};
```

---

## 7. Screen-by-Screen UX Breakdown

### Screen 1: Landing / Hero (Pre-Auth)

```
┌─────────────────────────────────────────────────┐
│  [Logo: Sentinel]              [Sign In] [CTA]  │
│                                                 │
│           Your Money. On Autopilot.             │
│     Set a rule. Walk away. Sentinel buys        │
│     the instant conditions are met.             │
│                                                 │
│     [ 🚀 Create Your First Sentinel ]           │
│                                                 │
│     ┌─────────────────────────────────┐         │
│     │  Animated demo loop:            │         │
│     │  Rule → Monitor → Buy           │         │
│     └─────────────────────────────────┘         │
│                                                 │
│  Trusted by Prava · Secured by Visa             │
└─────────────────────────────────────────────────┘
```

- **Hero animation**: 6-second looping CSS animation showing a text input typing
  "Buy indigo.dev under $60", a progress bar filling (monitoring), then a green
  checkmark (purchased).
- **CTA button**: Gradient background, subtle glow shadow, hover lifts 2px.

### Screen 2: Rule Creation (Conversational)

```
┌─────────────────────────────────────────────────┐
│  ← Back to Dashboard                            │
│                                                 │
│  Create a Sentinel Rule                         │
│  Tell Sentinel what to watch for.               │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ ✨ "Buy indigo.dev the second it's      │    │
│  │     available, up to $60"               │    │
│  │                              [Analyze →]│    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ── OR use quick templates ──                   │
│  [🌐 Domain Snipe]  [📉 Price Drop]  [📦 Restock]│
└─────────────────────────────────────────────────┘
```

- **Input**: Large, prominent, auto-focus on page load. Placeholder text types
  itself (typewriter effect, 50ms/char).
- **Templates**: Clicking one pre-fills the input with an example.
- **Analyze button**: Shows spinner + "Analyzing..." while OpenAI processes.

### Screen 3: Rule Confirmation Card (Post-OpenAI Parse)

```
┌─────────────────────────────────────────────────┐
│  ✅ Sentinel understood your rule:              │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  🎯 Target:     indigo.dev              │    │
│  │  📊 Condition:  Domain becomes available│    │
│  │  💰 Max Budget: $60.00                  │    │
│  │  🏪 Merchant:   Namecheap               │    │
│  │                                         │    │
│  │  [Edit]          [Confirm & Authorize →]│    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  🔒 You'll approve a spending mandate next.     │
│     Sentinel cannot exceed $60.00. Ever.        │
└─────────────────────────────────────────────────┘
```

- **Animation**: Card slides up with `translateY(12px) → 0`, 250ms.
- **Budget amount**: Rendered in `--font-mono`, `--success` color, bold.
- **Trust line**: Small text below card with lock icon, `--text-secondary`.

### Screen 4: Prava Passkey Approval Modal

```
┌─────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────┐    │
│  │         🔐 Authorize Sentinel           │    │
│  │                                         │    │
│  │  You are granting Sentinel permission   │    │
│  │  to spend up to:                        │    │
│  │                                         │    │
│  │         $60.00                          │    │
│  │         (maximum, one-time)             │    │
│  │                                         │    │
│  │  Merchant: Namecheap                    │    │
│  │  Valid for: 24 hours                    │    │
│  │                                         │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  🛡️ Approve with Passkey       │    │    │
│  │  └─────────────────────────────────┘    │    │
│  │                                         │    │
│  │  Powered by Prava · Visa Network        │    │
│  │                                         │    │
│  │  [Cancel]                               │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

- **Amount**: 32px, `--font-mono`, `--text-primary`, centered. Visual anchor.
- **Passkey button**: `--prava-brand` background, full width, 48px height.
- **Powered by line**: 12px, `--text-tertiary`, small Prava + Visa logos (16px).
- **Critical UX**: The modal must feel *calm*, not urgent. No red. No exclamation
  marks. This is a *permission*, not a *warning*.

### Screen 5: Dashboard (Active Rules)

```
┌─────────────────────────────────────────────────┐
│  Sentinel Dashboard              [+ New Rule]   │
│                                                 │
│  Active Sentinels (2)                           │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │ 🌐 indigo.dev    │  │ 📉 Sony WH-1000  │    │
│  │ ● Monitoring     │  │ ● Monitoring     │    │
│  │ Cap: $60.00      │  │ Cap: $250.00     │    │
│  │ Started: 2m ago  │  │ Started: 1h ago  │    │
│  │                  │  │                  │    │
│  │ [View] [Pause]   │  │ [View] [Pause]   │    │
│  └──────────────────┘  └──────────────────┘    │
│                                                 │
│  Completed (1)                                  │
│  ┌──────────────────┐                           │
│  │ ✅ airbnb.design  │                           │
│  │ Purchased $45.00 │                           │
│  │ [Receipt] [Logs] │                           │
│  └──────────────────┘                           │
└─────────────────────────────────────────────────┘
```

- **Status dot**: Animated pulse for "Monitoring" (2s infinite), solid for done.
- **Cards**: Hover lifts with shadow. Click navigates to detail view.
- **Empty state**: If no rules, show illustration + "Create your first Sentinel" CTA.

### Screen 6: Rule Detail / Live Audit Timeline

```
┌─────────────────────────────────────────────────┐
│  ← Back    indigo.dev Sentinel    [Pause] [✕]  │
│                                                 │
│  Status: ● Monitoring    Budget: $60.00         │
│                                                 │
│  ── Live Activity ──                            │
│                                                 │
│  ✅ Rule created                    2:31 PM     │
│  │  "Buy indigo.dev under $60"                  │
│  │                                              │
│  ✅ Prava mandate approved          2:31 PM     │
│  │  Max $60.00 · Namecheap · 24h               │
│  │                                              │
│  🔄 Monitoring domain availability  2:31 PM     │
│  │  Checking every 30s...                      │
│  │  ● ● ● (animated pulse)                     │
│  │                                              │
│  ⚡ Condition met!                  2:47 PM     │
│  │  indigo.dev is AVAILABLE                    │
│  │                                              │
│  🔒 Generating payment token        2:47 PM     │
│  │  Prava single-use token · Visa              │
│  │                                              │
│  ✅ Purchase successful!            2:47 PM     │
│     $45.00 charged · Receipt #TXN-8291         │
│     [View Receipt]                              │
└─────────────────────────────────────────────────┘
```

- **Timeline**: Vertical line on left (2px, `--border-subtle`). Each step is a node.
- **Animation**: New steps animate in with `translateX(-12px) → 0`, staggered 150ms.
- **Current step**: Has a pulsing dot animation.
- **Completed steps**: Green checkmark icon, `--success` color.
- **Failed steps**: Red X icon, `--danger` color, with friendly explanation.
- **SSE**: Timeline updates in real-time via Server-Sent Events. No page refresh.

### Screen 7: Purchase Success (Celebration Moment)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              🎉 (confetti burst)                │
│                                                 │
│              ✅ Purchase Complete               │
│                                                 │
│         indigo.dev is yours!                    │
│         Charged: $45.00                         │
│         Under budget by: $15.00 🎯              │
│                                                 │
│         Receipt: #TXN-8291                      │
│         Payment: Prava · Visa ····4291          │
│                                                 │
│         [View Full Receipt]  [Done]             │
│                                                 │
│         📱 Notification sent to Telegram        │
└─────────────────────────────────────────────────┘
```

- **Confetti**: Use `canvas-confetti`. Burst from center, 150 particles, 1.5s.
- **Checkmark**: Animated SVG draw (stroke-dashoffset animation, 400ms).
- **"Under budget by"**: `--success` color. Reinforces safety of the budget cap.

---

## 8. Trust UX Patterns

### 8.1 The Budget Cap is ALWAYS Visible
- On the rule card: `Cap: $60.00` in mono font.
- On the Passkey modal: `$60.00` is the largest text element.
- On the audit timeline: Every payment step shows the amount.
- On the receipt: "Under budget by $X" or "At budget limit".
- **Rule**: The user should NEVER have to wonder "how much can this agent spend?"

### 8.2 Explicit Permission Language
- ❌ Bad: "Authorize payment"
- ✅ Good: "You are granting Sentinel permission to spend up to $60.00 at
  Namecheap. It cannot exceed this amount."

### 8.3 Real-Time Visibility
- The audit timeline is not hidden in a "Logs" tab. It is the **primary view**
  of an active rule.
- The user sees every step as it happens. No mystery.

### 8.4 Easy Revocation
- Every active rule has a visible [Pause] and [✕ Cancel] button.
- Canceling a rule immediately revokes the Prava mandate.
- Confirmation modal: "This will immediately revoke Sentinel's spending
  permission. Are you sure?"

### 8.5 Receipt & Proof
- Every completed purchase generates a receipt with:
  - Transaction ID
  - Amount charged
  - Merchant
  - Payment method (Prava · Visa ····last4)
  - Timestamp
  - Link to Prava dashboard transaction
- Receipt is accessible forever from the dashboard.

---

## 9. Micro-Interactions & Delight

| Moment | Interaction | Implementation |
|--------|-------------|----------------|
| Page load | Cards stagger in (50ms delay each) | Framer Motion `staggerChildren` |
| Button click | Scale down to 0.98, then back | CSS `active:scale(0.98)` |
| Rule created | Card slides up from bottom | Framer Motion `y: 20 → 0` |
| Monitoring active | Status dot pulses (2s loop) | CSS `@keyframes pulse` |
| Condition met | Timeline node flashes briefly | Framer Motion `scale: [1, 1.2, 1]` |
| Purchase success | Confetti + checkmark draw | `canvas-confetti` + SVG animation |
| Budget saved | "Under budget by $X" fades in | Framer Motion `opacity: 0 → 1` |
| Copy transaction ID | Clipboard icon → checkmark | State swap, 150ms |
| Toast notification | Slides in from right | Framer Motion `x: 20 → 0` |
| Skeleton loading | Shimmer gradient sweep | CSS `background-size: 200%`, animate |
| Input focus | Border glows accent color | CSS `box-shadow` transition |
| Card hover | Lifts 2px + shadow deepens | CSS `transform: translateY(-2px)` |

---

## 10. Loading, Empty & Error States

### Loading States
- **Initial page load**: Skeleton cards (3x) with shimmer animation. Never blank.
- **OpenAI parsing**: Typing indicator (three bouncing dots) + "Sentinel is
  analyzing your rule..."
- **Payment processing**: Spinner in button + text changes to "Securing payment..."
  + button disabled.
- **Timeline waiting**: Pulsing dot on current step + "Waiting for condition..."

### Empty States

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              🛡️ (subtle illustration)           │
│                                                 │
│         No active Sentinels yet.                │
│         Set your first rule and let             │
│         Sentinel watch for you.                 │
│                                                 │
│         [ + Create Your First Rule ]            │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Illustration: Simple line-art shield with sparkles. `--text-tertiary`. 120px.
- CTA: Primary button, centered.

### Error States

**Budget exceeded:**
```
🛡️ Sentinel protected your wallet.
The price ($72.00) exceeded your $60.00 cap.
No charge was made. Rule paused.
[Adjust Budget]  [Cancel Rule]
```
Icon: Shield, `--warning` color. NOT a scary red X. Frame it as *protection*.

**Payment failed:**
```
⚠️ Payment could not be completed.
Prava token expired. No charge was made.
[Retry with New Token]  [Cancel Rule]
```

**API error:**
```
🔄 Connection issue detected.
Sentinel will retry automatically in 60s.
Your rule is safe. No action needed.
```

Always reassure: "No charge was made." "Your rule is safe."

---

## 11. Mobile Responsiveness

### Breakpoints

```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

### Mobile-Specific Rules

| Element | Desktop | Mobile |
|---------|---------|--------|
| Navigation | Left sidebar (260px) | Bottom tab bar (4 items) |
| Dashboard grid | 2-3 columns | 1 column, full width |
| Rule creation | Centered, max-w-lg | Full width, 16px padding |
| Passkey modal | 440px centered | Full-screen bottom sheet |
| Audit timeline | Left-aligned, 600px | Full width, smaller icons |
| Toast position | Bottom-right | Bottom-center, full width |
| Card padding | 24px | 16px |
| Font sizes | As specified | H1: 24px, Body: 14px |
| Buttons | 40px height | 48px height (thumb-friendly) |
| Confetti | Full viewport | Reduced particles (80) |

### Bottom Tab Bar (Mobile)

```
┌─────────────────────────────────────────────────┐
│  🏠 Home  │  ➕ Create  │  📋 Rules  │  ⚙️ More │
└─────────────────────────────────────────────────┘
```

- Height: 64px + safe area inset.
- Active tab: `--accent` color, filled icon.
- Inactive: `--text-tertiary`, outline icon.

---

## 12. Accessibility

### Requirements
- **Contrast**: All text meets WCAG AA (4.5:1 body, 3:1 large text).
- **Focus states**: Every interactive element has visible `2px solid var(--accent)` ring.
- **Keyboard nav**: Full tab order. Modals trap focus. Escape closes modals.
- **Screen readers**: All icons have `aria-label`. Timeline steps have `role="listitem"`.
- **Reduced motion**: Respect `prefers-reduced-motion`. Disable confetti, pulse, transitions.
- **Color independence**: Status never communicated by color alone. Always icon + text.

### Implementation

```tsx
// Respect reduced motion
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

// Confetti only if motion is OK
if (!prefersReducedMotion) {
  confetti({ particleCount: 150, spread: 70 });
}

// Focus trap in modal
<Dialog trapFocus aria-label="Authorize Sentinel spending">
```

---

## 13. Copy & Tone of Voice

### Voice
- **Confident but calm**. Not hype. Not corporate. Like a smart friend who
  handles your money carefully.
- **Second person**. "You" and "your". Never "the user".
- **Active voice**. "Sentinel purchased indigo.dev" not "indigo.dev was purchased."

### Key Copy Examples

| Context | ❌ Bad | ✅ Good |
|---------|--------|---------|
| Rule active | "Rule is running" | "Sentinel is watching indigo.dev for you" |
| Condition met | "Trigger fired" | "indigo.dev just became available!" |
| Payment | "Processing transaction" | "Securing your purchase with Prava..." |
| Success | "Transaction complete" | "indigo.dev is yours! Charged $45.00" |
| Budget saved | "Under limit" | "Under budget by $15.00 🎯" |
| Budget exceeded | "Error: over budget" | "Sentinel protected your wallet. Price was $72 — over your $60 cap." |
| Passkey prompt | "Authenticate" | "Approve Sentinel to spend up to $60.00" |
| Empty state | "No data" | "No active Sentinels yet. Set your first rule." |
| Cancel confirm | "Are you sure?" | "This immediately revokes Sentinel's spending permission." |

### Rules
- **Never** use jargon ("mandate", "token", "webhook") in user-facing copy.
  Use "permission", "secure payment", "update".
- **Always** state the amount. "$45.00" not "the item".
- **Always** reassure on failure: "No charge was made."
- **Emojis sparingly**: ✅ 🛡️ 🎯 🔄 ⚡ — only in timeline and toasts. Not in buttons.

---

## 14. Iconography

### Library
Use **Lucide React** (`lucide-react`). Consistent 1.5px stroke, 24px grid.

### Icon Mapping

| Concept | Icon | Color Context |
|---------|------|---------------|
| Sentinel / Agent | `Shield` | `--accent` |
| Monitoring | `Radar` or `Eye` | `--accent`, animated pulse |
| Domain | `Globe` | `--text-secondary` |
| Price drop | `TrendingDown` | `--success` |
| Budget / Money | `Wallet` | `--text-primary` |
| Passkey / Security | `Fingerprint` or `Lock` | `--prava-brand` |
| Payment | `CreditCard` | `--text-secondary` |
| Success | `CheckCircle2` | `--success` |
| Failed | `XCircle` | `--danger` |
| Warning | `AlertTriangle` | `--warning` |
| Receipt | `FileText` | `--text-secondary` |
| Timeline node | `Circle` (filled) | Varies by state |
| Create / Add | `Plus` | `--accent` |
| Settings | `Settings` | `--text-secondary` |
| Telegram | `Send` | `--accent` |
| Pause | `PauseCircle` | `--warning` |
| Cancel / Delete | `Trash2` | `--danger` |
| External link | `ExternalLink` | `--text-tertiary` |
| Copy | `Copy` → `Check` | `--text-secondary` → `--success` |

### Rules
- Icon size: 20px in buttons, 16px in badges/metadata, 24px in timeline.
- Always pair icons with text labels in navigation.
- Never icon-only buttons without `aria-label`.

---

## 15. Final Polish Checklist

Before recording your demo video, verify EVERY item:

### Visual
- [ ] Dark mode is the default and looks flawless.
- [ ] Light mode toggle works and looks good.
- [ ] No layout shifts on page load (skeletons match final layout).
- [ ] All cards have consistent 12px border radius.
- [ ] All buttons have consistent 8px border radius.
- [ ] No orphaned text (single word on last line of a paragraph).
- [ ] Amounts are in mono font everywhere.
- [ ] Status badges are pill-shaped with muted backgrounds.

### Animation
- [ ] Page transitions are smooth (250ms fade + slide).
- [ ] Modal entrance is smooth (200ms scale + fade).
- [ ] Timeline steps animate in with stagger.
- [ ] Monitoring dot pulses continuously.
- [ ] Success checkmark has a spring animation.
- [ ] Confetti fires on purchase success.
- [ ] Buttons have hover (lift) and active (press) states.
- [ ] Skeleton loaders shimmer while data loads.

### Trust
- [ ] Budget cap is visible on every screen that involves money.
- [ ] Passkey modal clearly states the max amount in large text.
- [ ] "Powered by Prava · Visa" is visible on the payment modal.
- [ ] Audit timeline is the primary view for active rules.
- [ ] Cancel/Pause buttons are always visible on active rules.
- [ ] Receipts include transaction ID, amount, merchant, and payment method.
- [ ] Error states always say "No charge was made" when applicable.

### Mobile
- [ ] Bottom tab bar is visible and functional.
- [ ] Cards are full-width on mobile.
- [ ] Passkey modal is a bottom sheet on mobile.
- [ ] Buttons are 48px tall on mobile.
- [ ] Toast is bottom-center on mobile.
- [ ] No horizontal scrolling anywhere.
- [ ] Text is readable without zooming (min 14px body).

### Accessibility
- [ ] Tab order is logical.
- [ ] Focus rings are visible on all interactive elements.
- [ ] Escape closes modals.
- [ ] All icons have aria-labels.
- [ ] Color is never the only indicator of state.
- [ ] `prefers-reduced-motion` disables animations.

### Content
- [ ] No lorem ipsum anywhere.
- [ ] No "TODO" or placeholder text.
- [ ] All timestamps are formatted (e.g., "2:47 PM", not "14:47:32.000Z").
- [ ] All amounts have 2 decimal places and $ prefix.
- [ ] Transaction IDs are copyable with one click.

---

## Appendix: Quick Reference — CSS Variables

```css
:root {
  /* Colors - Dark */
  --bg-primary: #0A0A0B;
  --bg-secondary: #111113;
  --bg-tertiary: #1A1A1E;
  --bg-elevated: #222226;
  --border-subtle: #2A2A2E;
  --border-strong: #3A3A3E;
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-tertiary: #71717A;
  --accent: #6366F1;
  --accent-hover: #818CF8;
  --accent-muted: rgba(99,102,241,0.15);
  --success: #10B981;
  --success-muted: rgba(16,185,129,0.15);
  --warning: #F59E0B;
  --warning-muted: rgba(245,158,11,0.15);
  --danger: #EF4444;
  --danger-muted: rgba(239,68,68,0.15);
  --prava-brand: #7C3AED;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;

  /* Spacing */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.3);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
  --shadow-glow: 0 0 30px rgba(99,102,241,0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;
}
```

---

> **Remember**: The judge who opens your project should think,
> *"This feels like a real product I would trust with my money."*
> That thought wins the Mac mini. 🏆

