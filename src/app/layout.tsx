import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agentic Commerce Platform | Prava Integration",
  description: "Next-generation autonomous commerce platform powered by AI agents and Prava SDK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        {children}
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
