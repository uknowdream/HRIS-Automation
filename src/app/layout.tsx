import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HRISProvider } from "@/context/HRISContext";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AetherHR — International HRIS, Cognitive & Psychometric Automation Platform",
  description:
    "Enterprise-grade Global HRIS management system with 104-item Cognitive & Psychometric Assessment Suite (IQ, Raven Matrix, Big Five OCEAN, DISC, SJT), Email & WhatsApp auto-invitations, multi-currency payroll, webhooks, and installable Mobile App.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <HRISProvider>
          <AppShell>{children}</AppShell>
        </HRISProvider>
      </body>
    </html>
  );
}
