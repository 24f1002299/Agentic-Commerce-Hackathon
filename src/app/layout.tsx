import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sentinel — Agentic Commerce by Prava",
  description:
    "Set a rule. Walk away. Sentinel autonomously monitors and buys the moment conditions are met — secured by Prava and Visa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-background text-foreground antialiased`}
      >
        {children}
        {/* Spec §5.8: position bottom-right on desktop */}
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              color: "var(--text-primary)",
            },
          }}
        />
      </body>
    </html>
  );
}
