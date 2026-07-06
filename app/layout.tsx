import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocaleProvider from "@/components/LocaleProvider";
import LanguageToggle from "@/components/LanguageToggle";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  formatDetection: { telephone: false, date: false, email: false, address: false },
  title: "QE Command Center | Quality Engineering Portfolio",
  description:
    "Enterprise-grade Quality Engineering Command Center. Real-time telemetry, chaos engineering, 3D visualizations, and advanced testing methodology.",
  keywords: [
    "quality engineering",
    "test automation",
    "chaos engineering",
    "playwright",
    "mutation testing",
  ],
  openGraph: {
    title: "QE Command Center",
    description: "Enterprise Quality Engineering Portfolio",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-mono bg-[#030303] text-emerald-400 antialiased overflow-x-hidden`}
      >
        <LocaleProvider>
          <div className="relative min-h-screen">
            {/* Matrix grid overlay */}
            <div
              className="fixed inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />
            {/* Radial glow */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.08),transparent)]" />
            <Navbar />
            <main className="relative z-10 pl-0 md:pl-64">{children}</main>
            <Footer />
          </div>
          <LanguageToggle />
        </LocaleProvider>
      </body>
    </html>
  );
}