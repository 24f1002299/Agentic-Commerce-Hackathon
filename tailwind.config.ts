import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        mono:  ["var(--font-jetbrains)", "SF Mono", "monospace"],
      },
      colors: {
        /* shadcn base tokens — now mapped to AMOLED palette */
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* ── Sentinel design-system semantic tokens ────────────────────────── */
        sentinel: {
          bg:         "#0A0A0B",
          "bg-card":  "#111113",
          "bg-hover": "#1A1A1E",
          "bg-modal": "#222226",
          "border":   "#2A2A2E",
          "border-strong": "#3A3A3E",
          accent:     "#6366F1",
          "accent-hover": "#818CF8",
          success:    "#10B981",
          warning:    "#F59E0B",
          danger:     "#EF4444",
          prava:      "#7C3AED",
          "text-primary":   "#FAFAFA",
          "text-secondary": "#A1A1AA",
          "text-tertiary":  "#71717A",
        },
      },
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        /* spec-exact radii */
        "btn":   "8px",
        "card":  "12px",
        "modal": "16px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%":      { opacity: "0.7", transform: "scale(1.03)" },
        },
        "status-pulse": {
          "0%, 100%": { opacity: "1",   transform: "scale(1)" },
          "50%":      { opacity: "0.4", transform: "scale(0.85)" },
        },
        "skeleton-shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },
      animation: {
        "accordion-down":   "accordion-down 0.2s ease-out",
        "accordion-up":     "accordion-up 0.2s ease-out",
        "pulse-glow":       "pulse-glow 6s ease-in-out infinite",
        "status-pulse":     "status-pulse 2s ease-in-out infinite",
        "skeleton-shimmer": "skeleton-shimmer 1.5s linear infinite",
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
