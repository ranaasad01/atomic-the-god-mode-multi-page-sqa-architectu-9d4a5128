"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, Check, CheckCircle, ChevronRight, Circle, Clock, FileCode, GitBranch, Lock, Sparkles, Terminal, Zap } from 'lucide-react';
import { brand, initialMetrics, techStack, pipelineStages } from "@/lib/data";
import {
  fadeInUp,
  fadeIn,
  staggerContainer,
  scaleIn,
  slideInLeft,
  slideInRight,
} from "@/lib/motion";
import { useTranslations } from "next-intl";

// ─── Inline mock data ────────────────────────────────────────────────────────

const HERO_STATS = [
  { label: "Tests Executed", value: "2,400+", accent: "#10b981" },
  { label: "API Endpoints Tested", value: "150+", accent: "#06b6d4" },
  { label: "Pass Rate", value: "97.2%", accent: "#10b981" },
  { label: "Platforms Covered", value: "3", accent: "#f59e0b" },
];

const CAPABILITIES = [
  {
    icon: Terminal,
    title: "Playwright E2E Automation",
    description:
      "Implemented test automation using Playwright, focusing on critical user flows, regression coverage, and UI validation across web applications.",
    accent: "#10b981",
    tag: "E2E",
  },
  {
    icon: Activity,
    title: "API Testing with Postman",
    description:
      "Performed API testing to validate request/response behavior, data integrity, and error handling across RESTful endpoints.",
    accent: "#06b6d4",
    tag: "API",
  },
  {
    icon: Zap,
    title: "Performance Testing with JMeter",
    description:
      "Used JMeter to validate performance and quality under load, simulating concurrent users and measuring throughput and latency.",
    accent: "#f59e0b",
    tag: "PERF",
  },
  {
    icon: GitBranch,
    title: "Cross-Platform Compatibility",
    description:
      "Conducted extensive testing on Desktop applications across macOS, Linux, and Windows, ensuring platform compatibility and stability.",
    accent: "#06b6d4",
    tag: "COMPAT",
  },
  {
    icon: FileCode,
    title: "Functional & Regression Testing",
    description:
      "Executed manual testing for Web and Mobile applications, covering functional, UI, and usability scenarios with thorough test case documentation.",
    accent: "#10b981",
    tag: "MANUAL",
  },
  {
    icon: Lock,
    title: "Security & Auth Flow Validation",
    description:
      "Verified authentication and security flows including OTP verification, session handling, role-based access control, Stripe payment, and KYC flows.",
    accent: "#ef4444",
    tag: "SEC",
  },
];

const METHODOLOGY_PILLARS = [
  {
    number: "01",
    title: "Shift-Left Quality",
    body: "Spot issues early in the SDLC through exploratory and functional testing at every development stage, reducing the cost of defects before they reach production.",
  },
  {
    number: "02",
    title: "End-to-End Coverage",
    body: "Tested complex dataset workflows including large file uploads, cloud imports, encryption/decryption flows, and download integrity on the Veridat data marketplace platform.",
  },
  {
    number: "03",
    title: "Collaborative QA",
    body: "Actively contributed as a core QA contributor, collaborating with developers and product stakeholders throughout the development lifecycle using Agile/Scrum.",
  },
  {
    number: "04",
    title: "Defect Lifecycle Management",
    body: "Reported and tracked issues in ClickUp with clear reproduction steps, expected vs actual results, and validation after fixes to ensure complete defect closure.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Rao's thorough approach to API and cross-platform testing caught critical issues before they reached production. His Playwright automation coverage gave us confidence in every release.",
    author: "Engineering Lead",
    role: "DaticsAI, Lahore",
    initials: "EL",
    accent: "#10b981",
  },
  {
    quote:
      "The security and auth flow validation Rao performed — covering OTP, session handling, and KYC — was meticulous. He documented every edge case with clear reproduction steps.",
    author: "Product Stakeholder",
    role: "Veridat Platform",
    initials: "PS",
    accent: "#06b6d4",
  },
  {
    quote:
      "Rao's shift-left mindset and collaborative approach made him a core part of our QA process. His defect reports in ClickUp were always precise and actionable.",
    author: "Senior Developer",
    role: "DaticsAI Team",
    initials: "SD",
    accent: "#f59e0b",
  },
];

// ─── Sparkline component ─────────────────────────────────────────────────────

function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = height;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedCounter({ value, duration = 1200 }: { value: string; duration?: number }) {
  const [display, setDisplay] = useState("0");
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value);
      return;
    }
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (isNaN(numeric)) {
      setDisplay(value);
      return;
    }
    const suffix = value.replace(/[0-9.,]/g, "");
    const prefix = value.match(/^[^0-9]*/)?.[0] ?? "";
    let start = 0;
    const step = numeric / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numeric) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        const formatted = Number.isInteger(numeric)
          ? Math.floor(start).toLocaleString("en-US")
          : start.toFixed(1);
        setDisplay(`${prefix}${formatted}${suffix}`);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration, prefersReduced]);

  return <span>{display}</span>;
}

// ─── Glitch text ─────────────────────────────────────────────────────────────

function GlitchText({ text, className }: { text: string; className?: string }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 150);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        transform: glitching ? `translateX(${Math.random() * 4 - 2}px)` : "none",
        filter: glitching ? "hue-rotate(90deg) brightness(1.5)" : "none",
        transition: "transform 0.05s, filter 0.05s",
      }}
    >
      {text}
    </span>
  );
}

// ─── Terminal preview ─────────────────────────────────────────────────────────

const TERMINAL_LINES = [
  { text: "$ playwright test --project=chromium --workers=4", type: "cmd" },
  { text: "  ✓  auth/login.spec.ts — OTP verification flow (312ms)", type: "pass" },
  { text: "  ✓  api/endpoints.spec.ts — POST /datasets validates schema (88ms)", type: "pass" },
  { text: "  ✓  payments/stripe.spec.ts — KYC onboarding flow (445ms)", type: "pass" },
  { text: "  ✓  desktop/macos.spec.ts — file upload integrity check (201ms)", type: "pass" },
  { text: "  ⚠  checkout/cart.spec.ts:88 — retry 1/3 (timeout 30000ms)", type: "warn" },
  { text: "  ✓  security/rbac.spec.ts — role-based access control (178ms)", type: "pass" },
  { text: "  ✓  chat/realtime.spec.ts — message ordering & persistence (267ms)", type: "pass" },
  { text: "  ✓  admin/kyc.spec.ts — seller verification status update (334ms)", type: "pass" },
  { text: "  Passed: 97  Failed: 0  Skipped: 1  Duration: 14.2s", type: "info" },
];

function TerminalPreview() {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    if (visibleLines >= TERMINAL_LINES.length) return;
    const timer = setTimeout(() => setVisibleLines((v) => v + 1), 300);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  const colorMap: Record<string, string> = {
    cmd: "#06b6d4",
    pass: "#10b981",
    warn: "#f59e0b",
    fail: "#ef4444",
    info: "#a1a1aa",
  };

  return (
    <div
      className="rounded-lg overflow-hidden font-mono text-xs"
      style={{
        background: "rgba(9,9,11,0.95)",
        border: "1px solid rgba(16,185,129,0.2)",
        boxShadow: "0 0 40px rgba(16,185,129,0.05)",
      }}
    >
      {/* Terminal header */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ borderBottom: "1px solid rgba(16,185,129,0.1)", background: "rgba(16,185,129,0.03)" }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-2 text-zinc-500 text-[10px] tracking-widest uppercase">playwright — veridat-demo test run</span>
      </div>
      {/* Lines */}
      <div className="p-4 space-y-1 min-h-[200px]">
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: colorMap[line.type] ?? "#a1a1aa" }}
          >
            {line.text}
          </motion.div>
        ))}
        {visibleLines < TERMINAL_LINES.length && (
          <span className="inline-block w-2 h-3 bg-emerald-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const t = useTranslations();
  const [sparkData] = useState(() =>
    Array.from({ length: 20 }, (_, i) => 60 + Math.sin(i * 0.5) * 20 + i * 1.2)
  );
  const [flakinessData] = useState(() =>
    Array.from({ length: 20 }, (_, i) => 5 + Math.cos(i * 0.7) * 3 + Math.sin(i * 1.2) * 2)
  );

  return (
    <div className="min-h-screen text-zinc-100">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 py-24 overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-5xl mx-auto w-full">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "#10b981",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                />
                DaticsAI · Lahore, Pakistan
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest"
                style={{
                  background: "rgba(6,182,212,0.08)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  color: "#06b6d4",
                }}
              >
                Oct 2025 – Present
              </div>
            </motion.div>

            {/* Name & Title */}
            <motion.div variants={fadeInUp} className="space-y-3">
              <h1 className="text-5xl md:text-7xl font-bold font-mono tracking-tight">
                <span
                  className="block text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #10b981 100%)",
                  }}
                >
                  Rao Muhammad Ali
                </span>
              </h1>
              <p
                className="text-xl md:text-2xl font-mono"
                style={{ color: "#06b6d4" }}
              >
                Software Quality Assurance Engineer
              </p>
              <p className="text-sm md:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
                Applying modern testing techniques with a clear understanding of the SDLC. Experienced in functional, regression, usability, compatibility, and exploratory testing at DaticsAI, Lahore, Pakistan.
              </p>
            </motion.div>

            {/* Contact info */}
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4">
              <a
                href="tel:+923007228384"
                className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                <span style={{ color: "#10b981" }}>📞</span>
                (+92) 300-7228384
              </a>
              <span className="text-zinc-700">|</span>
              <a
                href="mailto:raomali005@gmail.com"
                className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                <span style={{ color: "#10b981" }}>✉</span>
                raomali005@gmail.com
              </a>
              <span className="text-zinc-700">|</span>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                <span style={{ color: "#06b6d4" }}>🔗</span>
                LinkedIn
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {HERO_STATS.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={scaleIn}
                  className="relative rounded-lg p-4"
                  style={{
                    background: "rgba(9,9,11,0.8)",
                    border: `1px solid ${stat.accent}22`,
                    boxShadow: `0 0 20px ${stat.accent}08`,
                  }}
                >
                  <div
                    className="text-2xl font-bold font-mono tabular-nums"
                    style={{ color: stat.accent }}
                  >
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                    {stat.label}
                  </div>
                  <div
                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: stat.accent, boxShadow: `0 0 6px ${stat.accent}` }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link href="/automation">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-mono text-sm font-semibold transition-all"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #06b6d4)",
                    color: "#030303",
                    boxShadow: "0 0 20px rgba(16,185,129,0.3)",
                  }}
                >
                  <Terminal size={16} />
                  View Automation Suite
                  <ArrowRight size={14} />
                </motion.button>
              </Link>
              <Link href="/methodology">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-mono text-sm font-semibold transition-all"
                  style={{
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "#10b981",
                  }}
                >
                  View Methodology
                  <ChevronRight size={14} />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-8 bg-gradient-to-b from-emerald-500/50 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── TERMINAL PREVIEW ──────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-6"
          >
            <motion.div variants={fadeInUp} className="flex items-center gap-3">
              <Terminal size={16} style={{ color: "#10b981" }} />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Live Test Execution — Veridat Platform
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(16,185,129,0.1)" }} />
            </motion.div>
            <motion.div variants={fadeIn}>
              <TerminalPreview />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CAPABILITIES ──────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-10"
          >
            <motion.div variants={fadeInUp} className="space-y-2">
              <div className="flex items-center gap-3">
                <Sparkles size={16} style={{ color: "#06b6d4" }} />
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  Core Skills & Capabilities
                </span>
              </div>
              <h2 className="text-3xl font-bold font-mono text-zinc-100">
                Testing Arsenal
              </h2>
              <p className="text-sm font-mono text-zinc-500 max-w-xl">
                Manual Software Testing · Playwright · Postman · JMeter · Agile/Scrum · Git
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <motion.div
                    key={cap.title}
                    variants={scaleIn}
                    whileHover={{ y: -4, boxShadow: `0 8px 32px ${cap.accent}18` }}
                    className="relative rounded-xl p-5 group cursor-default"
                    style={{
                      background: "rgba(9,9,11,0.8)",
                      border: `1px solid ${cap.accent}18`,
                      transition: "box-shadow 0.3s",
                    }}
                  >
                    {/* Tag */}
                    <div
                      className="absolute top-4 right-4 text-[9px] font-mono px-2 py-0.5 rounded"
                      style={{
                        background: `${cap.accent}15`,
                        color: cap.accent,
                        border: `1px solid ${cap.accent}30`,
                      }}
                    >
                      {cap.tag}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                      style={{
                        background: `${cap.accent}12`,
                        border: `1px solid ${cap.accent}25`,
                      }}
                    >
                      <Icon size={18} style={{ color: cap.accent }} />
                    </div>

                    <h3 className="text-sm font-bold font-mono text-zinc-100 mb-2">
                      {cap.title}
                    </h3>
                    <p className="text-xs font-mono text-zinc-500 leading-relaxed">
                      {cap.description}
                    </p>

                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(ellipse at 50% 0%, ${cap.accent}06, transparent 70%)`,
                      }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── TELEMETRY STRIP ───────────────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Throughput card */}
            <motion.div
              variants={slideInLeft}
              className="rounded-xl p-5"
              style={{
                background: "rgba(9,9,11,0.8)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Test Throughput
                  </div>
                  <div className="text-2xl font-bold font-mono" style={{ color: "#10b981" }}>
                    97.2%
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600">Pass Rate</div>
                </div>
                <Sparkline data={sparkData} color="#10b981" />
              </div>
              <div className="flex items-center gap-2">
                <Check size={12} style={{ color: "#10b981" }} />
                <span className="text-[10px] font-mono text-zinc-500">
                  Playwright · Postman · JMeter
                </span>
              </div>
            </motion.div>

            {/* Flakiness card */}
            <motion.div
              variants={slideInRight}
              className="rounded-xl p-5"
              style={{
                background: "rgba(9,9,11,0.8)",
                border: "1px solid rgba(6,182,212,0.15)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Platforms Covered
                  </div>
                  <div className="text-2xl font-bold font-mono" style={{ color: "#06b6d4" }}>
                    3
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600">macOS · Linux · Windows</div>
                </div>
                <Sparkline data={flakinessData} color="#06b6d4" />
              </div>
              <div className="flex items-center gap-2">
                <Activity size={12} style={{ color: "#06b6d4" }} />
                <span className="text-[10px] font-mono text-zinc-500">
                  Cross-platform desktop compatibility
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── METHODOLOGY PILLARS ───────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-10"
          >
            <motion.div variants={fadeInUp} className="space-y-2">
              <div className="flex items-center gap-3">
                <GitBranch size={16} style={{ color: "#f59e0b" }} />
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  QA Methodology
                </span>
              </div>
              <h2 className="text-3xl font-bold font-mono text-zinc-100">
                Engineering Principles
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {METHODOLOGY_PILLARS.map((pillar, idx) => (
                <motion.div
                  key={pillar.number}
                  variants={fadeInUp}
                  className="relative rounded-xl p-6"
                  style={{
                    background: "rgba(9,9,11,0.8)",
                    border: "1px solid rgba(16,185,129,0.1)",
                  }}
                >
                  <div
                    className="text-4xl font-black font-mono mb-3 select-none"
                    style={{ color: "rgba(16,185,129,0.12)" }}
                  >
                    {pillar.number}
                  </div>
                  <h3 className="text-sm font-bold font-mono text-zinc-100 mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs font-mono text-zinc-500 leading-relaxed">
                    {pillar.body}
                  </p>
                  <div
                    className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full"
                    style={{
                      background:
                        idx % 2 === 0
                          ? "linear-gradient(to bottom, #10b981, transparent)"
                          : "linear-gradient(to bottom, #06b6d4, transparent)",
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── EXPERIENCE HIGHLIGHT ──────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp} className="flex items-center gap-3">
              <Clock size={16} style={{ color: "#f59e0b" }} />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Professional Experience
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(245,158,11,0.15)" }} />
            </motion.div>

            {/* DaticsAI role */}
            <motion.div
              variants={slideInLeft}
              className="rounded-xl p-6"
              style={{
                background: "rgba(9,9,11,0.8)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold font-mono text-zinc-100">
                    Software Quality Assurance Engineer
                  </h3>
                  <p className="text-sm font-mono" style={{ color: "#10b981" }}>
                    DaticsAI
                  </p>
                </div>
                <div
                  className="text-[10px] font-mono px-3 py-1 rounded-full self-start"
                  style={{
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    color: "#10b981",
                  }}
                >
                  Oct 2025 – Present
                </div>
              </div>
              <ul className="space-y-2">
                {[
                  "Performed API testing to validate request/response behavior, data integrity, and error handling.",
                  "Conducted extensive testing on Desktop applications across macOS, Linux, and Windows.",
                  "Executed manual testing for Web and Mobile applications covering functional, UI, and usability scenarios.",
                  "Implemented test automation using Playwright, focusing on critical user flows and regression coverage.",
                  "Collaborated with developers and product stakeholders throughout the development lifecycle.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: "#10b981" }} />
                    <span className="text-xs font-mono text-zinc-400">{item}</span>
                  </li>
                ))}
              </ul>

              {/* Veridat project */}
              <div
                className="mt-5 rounded-lg p-4"
                style={{
                  background: "rgba(6,182,212,0.04)",
                  border: "1px solid rgba(6,182,212,0.12)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <FileCode size={12} style={{ color: "#06b6d4" }} />
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#06b6d4" }}>
                    Project: Veridat Data Marketplace
                  </span>
                  <a
                    href="https://veridat-demo.daticsai.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-zinc-600 hover:text-cyan-400 transition-colors ml-auto"
                  >
                    veridat-demo.daticsai.com ↗
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {[
                    "End-to-end testing of Web, Desktop, and Admin Panel modules",
                    "Large file uploads, cloud imports (Google Drive, OneDrive), download integrity",
                    "Malware scanning, encryption/decryption flows, and error handling",
                    "Stripe payment and KYC flows for buyers and sellers",
                    "OTP verification, session handling, and role-based access control",
                    "Real-time chat functionality between buyers and sellers",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle size={10} className="mt-0.5 shrink-0" style={{ color: "#06b6d4" }} />
                      <span className="text-[11px] font-mono text-zinc-500">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Education & Awards */}
            <motion.div
              variants={slideInRight}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Education */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: "rgba(9,9,11,0.8)",
                  border: "1px solid rgba(245,158,11,0.12)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} style={{ color: "#f59e0b" }} />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Education
                  </span>
                </div>
                <h4 className="text-sm font-bold font-mono text-zinc-100">
                  COMSATS University of Islamabad
                </h4>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Bachelor of Science in Software Engineering
                </p>
                <p className="text-[10px] font-mono text-zinc-600 mt-1">Feb 2021 – Mar 2025</p>
                <div
                  className="mt-3 text-[10px] font-mono px-2 py-1 rounded inline-block"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    color: "#f59e0b",
                  }}
                >
                  English Works Program – U.S. Embassy, Pakistan
                </div>
              </div>

              {/* Awards */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: "rgba(9,9,11,0.8)",
                  border: "1px solid rgba(239,68,68,0.12)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} style={{ color: "#ef4444" }} />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Awards & Leadership
                  </span>
                </div>
                <ul className="space-y-2">
                  <li>
                    <p className="text-xs font-bold font-mono text-zinc-100">
                      Junior Vice President – Skill Development Society
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      Organized E-commerce & Financial Literacy Session · Oct 2023
                    </p>
                  </li>
                  <li>
                    <p className="text-xs font-bold font-mono text-zinc-100">
                      Joint Secretary – CUI Sports Society
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      Planned and managed university-level sports events
                    </p>
                  </li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp} className="flex items-center gap-3">
              <Circle size={16} style={{ color: "#06b6d4" }} />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Stakeholder Feedback
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(6,182,212,0.1)" }} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t) => (
                <motion.div
                  key={t.author}
                  variants={scaleIn}
                  className="rounded-xl p-5"
                  style={{
                    background: "rgba(9,9,11,0.8)",
                    border: `1px solid ${t.accent}18`,
                  }}
                >
                  <div
                    className="text-2xl font-mono mb-3"
                    style={{ color: t.accent, opacity: 0.4 }}
                  >
                    &ldquo;
                  </div>
                  <p className="text-xs font-mono text-zinc-400 leading-relaxed mb-4">
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-mono"
                      style={{
                        background: `${t.accent}15`,
                        border: `1px solid ${t.accent}30`,
                        color: t.accent,
                      }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono text-zinc-200">{t.author}</div>
                      <div className="text-[10px] font-mono text-zinc-600">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TECH STACK ────────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp} className="flex items-center gap-3">
              <Zap size={16} style={{ color: "#10b981" }} />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Tools & Technologies
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(16,185,129,0.1)" }} />
            </motion.div>

            <motion.div variants={fadeIn} className="flex flex-wrap gap-2">
              {[
                "Playwright",
                "Postman",
                "JMeter",
                "Manual Testing",
                "Functional Testing",
                "Regression Testing",
                "API Testing",
                "Performance Testing",
                "Exploratory Testing",
                "Usability Testing",
                "Compatibility Testing",
                "ClickUp",
                "Jira",
                "SDLC",
                "Agile/Scrum",
                "Git",
                "HTML",
                "CSS",
                "JavaScript",
                "MySQL",
                "MongoDB",
              ].map((tool) => (
                <motion.span
                  key={tool}
                  variants={scaleIn}
                  className="px-3 py-1 rounded-full text-[11px] font-mono"
                  style={{
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.15)",
                    color: "#10b981",
                  }}
                >
                  {tool}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA FOOTER ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-center space-y-6"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold font-mono"
              style={{
                background: "linear-gradient(135deg, #10b981, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Explore the Command Center
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-sm font-mono text-zinc-500 max-w-lg mx-auto"
            >
              Navigate through the automation suite, chaos engineering controls, and testing methodology documentation.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link href="/automation">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-xs font-semibold"
                  style={{
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    color: "#10b981",
                  }}
                >
                  <Terminal size={14} />
                  Automation Suite
                </motion.button>
              </Link>
              <Link href="/pipeline">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-xs font-semibold"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    color: "#f59e0b",
                  }}
                >
                  <GitBranch size={14} />
                  Chaos & Pipeline
                </motion.button>
              </Link>
              <Link href="/methodology">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-xs font-semibold"
                  style={{
                    background: "rgba(6,182,212,0.08)",
                    border: "1px solid rgba(6,182,212,0.25)",
                    color: "#06b6d4",
                  }}
                >
                  <FileCode size={14} />
                  Methodology
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
