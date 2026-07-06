"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
  { label: "Tests Executed Today", value: "2,847,391", accent: "#10b981" },
  { label: "P99 Latency", value: "142ms", accent: "#06b6d4" },
  { label: "Pass Rate", value: "97.2%", accent: "#10b981" },
  { label: "Active Runners", value: "64", accent: "#f59e0b" },
];

const CAPABILITIES = [
  {
    icon: Terminal,
    title: "Parallelized E2E Execution",
    description:
      "Playwright-powered browser automation across 64 concurrent shards. Sub-200ms assertion feedback loops with full trace capture and video artifacts on failure.",
    accent: "#10b981",
    tag: "E2E",
  },
  {
    icon: Activity,
    title: "Chaos Engineering Controls",
    description:
      "Inject latency spikes, partition networks, and corrupt payloads mid-run. Validate system resilience against real-world failure modes before they reach production.",
    accent: "#ef4444",
    tag: "CHAOS",
  },
  {
    icon: GitBranch,
    title: "Pipeline Gate Enforcement",
    description:
      "Six-stage quality gates from lint to security scanning. Zero-tolerance mutation score thresholds block merges automatically via GitHub Actions integration.",
    accent: "#06b6d4",
    tag: "CI/CD",
  },
  {
    icon: FileCode,
    title: "Mutation Testing at Scale",
    description:
      "Stryker mutation analysis across 40,000+ source lines. Identifies test suite blind spots with surgical precision, reporting per-file mutation scores in Allure.",
    accent: "#f59e0b",
    tag: "MUTATION",
  },
  {
    icon: Zap,
    title: "High-Throughput Load Simulation",
    description:
      "k6 scripts simulate Poisson-distributed traffic bursts up to 10,000 RPS. Real-time Grafana dashboards surface P95/P99 degradation before SLA breach.",
    accent: "#06b6d4",
    tag: "PERF",
  },
  {
    icon: Lock,
    title: "Security Regression Suite",
    description:
      "OWASP ZAP active scanning integrated into every pipeline run. Automated CVE triage with severity-gated deployment blocks and audit trail generation.",
    accent: "#ef4444",
    tag: "SEC",
  },
];

const METHODOLOGY_PILLARS = [
  {
    number: "01",
    title: "Shift-Left Quality",
    body: "Static analysis, type checking, and unit coverage gates run on every commit. Defects caught at the source cost 100x less than production incidents.",
  },
  {
    number: "02",
    title: "Observability-Driven Testing",
    body: "Every test emits structured telemetry. Prometheus scrapes assertion durations, Grafana surfaces flakiness regression trends, and Allure generates audit-ready reports.",
  },
  {
    number: "03",
    title: "Resilience by Design",
    body: "Chaos experiments are first-class citizens. Fault injection scenarios are version-controlled alongside application code and executed on every release candidate.",
  },
  {
    number: "04",
    title: "Continuous Mutation Hardening",
    body: "Stryker mutation scores are tracked over time. Any regression below the 85% threshold triggers an automated Slack alert and blocks the release pipeline.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Deploying this infrastructure cut our production incident rate by 73% in the first quarter. The chaos engineering controls alone saved us from three P0 outages.",
    author: "Priya Nair",
    role: "VP of Engineering, FinTech Scale-Up",
    initials: "PN",
    accent: "#10b981",
  },
  {
    quote:
      "The mutation testing integration exposed 340 undertested code paths we had no idea existed. Our test suite went from a false sense of security to genuine confidence.",
    author: "Marcus Okafor",
    role: "Principal QE Architect, Enterprise SaaS",
    initials: "MO",
    accent: "#06b6d4",
  },
  {
    quote:
      "Pipeline gate enforcement with six quality stages means our team ships faster, not slower. Automated blocks replaced 80% of manual review overhead.",
    author: "Selin Yıldız",
    role: "Head of Quality, E-Commerce Platform",
    initials: "SY",
    accent: "#f59e0b",
  },
];

const PIPELINE_FLOW = [
  { stage: "Lint", status: "pass", duration: "12s", color: "#06b6d4" },
  { stage: "Unit", status: "pass", duration: "48s", color: "#10b981" },
  { stage: "Mutation", status: "pass", duration: "3m 12s", color: "#f59e0b" },
  { stage: "Integration", status: "pass", duration: "1m 44s", color: "#06b6d4" },
  { stage: "E2E", status: "running", duration: "2m 08s", color: "#10b981" },
  { stage: "Security", status: "pending", duration: "--", color: "#ef4444" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GlowOrb({ color, size, x, y, blur }: { color: string; size: number; x: string; y: string; blur: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: `blur(${blur}px)`,
        opacity: 0.12,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex rounded-full h-2 w-2"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

function SparklineBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function TerminalLine({ text, delay }: { text: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return (
    <div className="font-mono text-xs leading-relaxed">
      {text.startsWith("✓") ? (
        <span className="text-emerald-400">{text}</span>
      ) : text.startsWith("✗") ? (
        <span className="text-red-400">{text}</span>
      ) : text.startsWith("→") ? (
        <span className="text-cyan-400">{text}</span>
      ) : text.startsWith("[") ? (
        <span className="text-amber-400">{text}</span>
      ) : (
        <span className="text-zinc-400">{text}</span>
      )}
    </div>
  );
}

const TERMINAL_LINES = [
  { text: "→ Playwright v1.42.0 — 64 workers initializing", delay: 0 },
  { text: "[SHARD 01] browser: chromium | headless: true", delay: 200 },
  { text: "[SHARD 02] browser: firefox | headless: true", delay: 350 },
  { text: "→ Loading test registry: 2,847 specs found", delay: 500 },
  { text: "✓ auth.spec.ts > login with valid credentials (84ms)", delay: 700 },
  { text: "✓ auth.spec.ts > MFA token validation (112ms)", delay: 900 },
  { text: "✓ checkout.spec.ts > add to cart flow (203ms)", delay: 1100 },
  { text: "→ [SHARD 08] injecting network latency: +250ms", delay: 1300 },
  { text: "✓ checkout.spec.ts > payment gateway timeout recovery (441ms)", delay: 1500 },
  { text: "✗ api.spec.ts > POST /orders 503 retry exhausted (2001ms)", delay: 1700 },
  { text: "[CHAOS] fault: connection_reset injected on shard 12", delay: 1900 },
  { text: "✓ resilience.spec.ts > circuit breaker opens at threshold (88ms)", delay: 2100 },
  { text: "→ Mutation score: 91.4% (threshold: 85%) — PASS", delay: 2300 },
  { text: "✓ security.spec.ts > OWASP ZAP scan: 0 critical findings", delay: 2500 },
  { text: "→ Pipeline gate: ALL STAGES PASSED — deploying to staging", delay: 2700 },
];

// ─── Section: Hero ────────────────────────────────────────────────────────────

function HeroSection() {
  const shouldReduce = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: shouldReduce ? 0 : 0.12, delayChildren: 0.1 },
    },
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-8 pb-24"
    >
      {/* Background glows */}
      <GlowOrb color="#10b981" size={600} x="20%" y="40%" blur={120} />
      <GlowOrb color="#06b6d4" size={400} x="75%" y="30%" blur={100} />
      <GlowOrb color="#f59e0b" size={300} x="60%" y="70%" blur={90} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-16 items-center"
        >
          {/* Left: copy */}
          <div className="space-y-8">
            <motion.div variants={fadeIn} className="flex items-center gap-3">
              <PulsingDot color="#10b981" />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded-full">
                {brand.version} — System Nominal
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl lg:text-6xl font-bold font-mono leading-tight tracking-tight text-balance"
              style={{ color: "#f4f4f5" }}
            >
              Quality Engineering{" "}
              <span
                className="block"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Command Center
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-base text-zinc-400 leading-relaxed max-w-lg text-pretty"
            >
              Enterprise-grade testing infrastructure built for engineers who demand
              precision at scale. Parallelized E2E execution, chaos engineering controls,
              mutation hardening, and six-stage pipeline gates — all observable in real time.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link
                href="/automation"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-sm font-semibold transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  boxShadow: "0 0 24px rgba(16,185,129,0.3), 0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                <Terminal size={16} />
                Explore Automation Suite
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/pipeline"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-sm font-semibold border transition-all duration-300 hover:border-cyan-500/50 hover:bg-cyan-500/5"
                style={{
                  borderColor: "rgba(6,182,212,0.25)",
                  color: "#06b6d4",
                }}
              >
                <GitBranch size={16} />
                View Pipeline Gates
              </Link>
            </motion.div>

            {/* Stat strip */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-2 gap-3 pt-4"
            >
              {HERO_STATS.map((s) => (
                <motion.div
                  key={s.label}
                  variants={scaleIn}
                  className="rounded-xl p-4 border"
                  style={{
                    background: "rgba(9,9,11,0.6)",
                    borderColor: "rgba(255,255,255,0.06)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)",
                  }}
                >
                  <div
                    className="text-2xl font-mono font-bold tabular-nums"
                    style={{ color: s.accent }}
                  >
                    {s.value}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: live terminal */}
          <motion.div variants={slideInRight} className="relative">
            <div
              className="rounded-2xl overflow-hidden border"
              style={{
                background: "rgba(9,9,11,0.9)",
                borderColor: "rgba(16,185,129,0.15)",
                boxShadow:
                  "0 0 0 1px rgba(16,185,129,0.08), 0 24px 64px -16px rgba(0,0,0,0.8), 0 0 80px -20px rgba(16,185,129,0.15)",
              }}
            >
              {/* Terminal header */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: "rgba(16,185,129,0.1)" }}
              >
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                </div>
                <span className="text-xs font-mono text-zinc-500 ml-2">
                  qecc-runner — playwright-shard-01..64
                </span>
                <PulsingDot color="#10b981" />
              </div>
              {/* Terminal body */}
              <div className="p-4 h-72 overflow-hidden space-y-1">
                {TERMINAL_LINES.map((line, i) => (
                  <TerminalLine key={i} text={line.text} delay={line.delay} />
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={
                !shouldReduce
                  ? { y: [0, -6, 0] }
                  : {}
              }
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 rounded-xl px-4 py-3 border"
              style={{
                background: "rgba(9,9,11,0.95)",
                borderColor: "rgba(16,185,129,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400">
                  97.2% pass rate — 2,847 specs
                </span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section: Live Pipeline ───────────────────────────────────────────────────

function PipelineSection() {
  const [activeStage, setActiveStage] = useState(4);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStage((prev) => (prev < PIPELINE_FLOW.length - 1 ? prev + 1 : 4));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="pipeline"
      className="relative py-24 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <GlowOrb color="#06b6d4" size={500} x="80%" y="50%" blur={120} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-12"
        >
          <motion.div variants={fadeInUp} className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 rounded">
                Live Pipeline
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold font-mono tracking-tight text-zinc-100 text-balance">
              Six-Stage Quality Gate
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed text-pretty">
              Every commit traverses a deterministic gauntlet. Each stage must pass before
              the next begins. A single failure halts the pipeline and notifies the team
              within seconds.
            </p>
          </motion.div>

          {/* Pipeline visualization */}
          <motion.div variants={fadeInUp} className="relative">
            <div className="flex flex-wrap gap-3 items-center">
              {PIPELINE_FLOW.map((stage, i) => {
                const isActive = i === activeStage;
                const isPast = i < activeStage;
                const isPending = stage.status === "pending";
                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative rounded-xl px-5 py-4 border cursor-default transition-all duration-300"
                      style={{
                        background: isActive
                          ? `rgba(${stage.color === "#10b981" ? "16,185,129" : stage.color === "#06b6d4" ? "6,182,212" : "245,158,11"},0.1)`
                          : isPast
                          ? "rgba(16,185,129,0.05)"
                          : "rgba(9,9,11,0.6)",
                        borderColor: isActive
                          ? stage.color
                          : isPast
                          ? "rgba(16,185,129,0.2)"
                          : "rgba(255,255,255,0.06)",
                        boxShadow: isActive
                          ? `0 0 20px ${stage.color}30`
                          : "none",
                      }}
                    >
                      {isActive && (
                        <div
                          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-ping"
                          style={{ backgroundColor: stage.color }}
                        />
                      )}
                      <div
                        className="text-sm font-mono font-bold"
                        style={{
                          color: isActive ? stage.color : isPast ? "#10b981" : "#52525b",
                        }}
                      >
                        {isPast ? "✓ " : isActive ? "⟳ " : "○ "}
                        {stage.stage}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-600 mt-1">
                        {stage.duration}
                      </div>
                    </motion.div>
                    {i < PIPELINE_FLOW.length - 1 && (
                      <ChevronRight
                        size={14}
                        className={isPast ? "text-emerald-500" : "text-zinc-700"}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Metrics row */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: "Total Duration", value: "7m 44s", color: "#06b6d4", icon: Clock },
              { label: "Stages Passed", value: "4 / 6", color: "#10b981", icon: Check },
              { label: "Mutation Score", value: "91.4%", color: "#f59e0b", icon: Activity },
              { label: "Security Findings", value: "0 Critical", color: "#10b981", icon: Lock },
            ].map((m) => (
              <motion.div
                key={m.label}
                variants={scaleIn}
                whileHover={{ y: -2 }}
                className="rounded-xl p-5 border"
                style={{
                  background: "rgba(9,9,11,0.7)",
                  borderColor: "rgba(255,255,255,0.06)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.5)",
                }}
              >
                <m.icon size={16} style={{ color: m.color }} className="mb-3" />
                <div className="text-xl font-mono font-bold tabular-nums" style={{ color: m.color }}>
                  {m.value}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                  {m.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section: Capabilities ────────────────────────────────────────────────────

function CapabilitiesSection() {
  return (
    <section
      id="features"
      className="relative py-24 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <GlowOrb color="#10b981" size={600} x="10%" y="60%" blur={130} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-14"
        >
          <motion.div variants={slideInLeft} className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                Core Capabilities
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold font-mono tracking-tight text-zinc-100 text-balance">
              Every layer of the testing pyramid, automated.
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed text-pretty">
              From static analysis to chaos-driven resilience validation, the QECC covers
              the full quality spectrum with observable, reproducible, and auditable results.
            </p>
          </motion.div>

          {/* Bento grid */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.title}
                variants={fadeInUp}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative rounded-2xl p-6 border overflow-hidden transition-all duration-300"
                style={{
                  background: "rgba(9,9,11,0.7)",
                  borderColor: "rgba(255,255,255,0.06)",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.5)",
                  gridColumn: i === 0 ? "span 1" : i === 3 ? "span 1" : "span 1",
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${cap.accent}08 0%, transparent 70%)`,
                  }}
                />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${cap.accent}15`,
                        border: `1px solid ${cap.accent}25`,
                      }}
                    >
                      <cap.icon size={18} style={{ color: cap.accent }} />
                    </div>
                    <span
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        color: cap.accent,
                        borderColor: `${cap.accent}30`,
                        background: `${cap.accent}10`,
                      }}
                    >
                      {cap.tag}
                    </span>
                  </div>

                  <h3 className="text-sm font-mono font-bold text-zinc-100 leading-snug">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Tech stack strip */}
          <motion.div variants={fadeIn} className="space-y-4">
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              Powered by
            </div>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <motion.span
                  key={tech}
                  whileHover={{ scale: 1.05 }}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border transition-all duration-200 hover:border-emerald-500/30 hover:text-emerald-400 cursor-default"
                  style={{
                    background: "rgba(9,9,11,0.6)",
                    borderColor: "rgba(255,255,255,0.07)",
                    color: "#71717a",
                  }}
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section: Methodology ─────────────────────────────────────────────────────

function MethodologySection() {
  return (
    <section
      id="about"
      className="relative py-24 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <GlowOrb color="#f59e0b" size={400} x="90%" y="30%" blur={100} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid lg:grid-cols-2 gap-16 items-start"
        >
          {/* Left */}
          <motion.div variants={slideInLeft} className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded">
                Methodology
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold font-mono tracking-tight text-zinc-100 text-balance">
              Engineering quality into every layer.
            </h2>
            <p className="text-zinc-400 leading-relaxed text-pretty">
              The QECC methodology is built on four foundational pillars that transform
              quality from a gate at the end of development into a continuous, measurable
              property of the system itself.
            </p>
            <Link
              href="/methodology"
              className="group inline-flex items-center gap-2 text-sm font-mono text-amber-400 hover:text-amber-300 transition-colors duration-200"
            >
              Read full methodology documentation
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </motion.div>

          {/* Right: pillars */}
          <motion.div variants={staggerContainer} className="space-y-4">
            {METHODOLOGY_PILLARS.map((pillar) => (
              <motion.div
                key={pillar.number}
                variants={fadeInUp}
                whileHover={{ x: 4 }}
                className="flex gap-5 p-5 rounded-xl border transition-all duration-300 group"
                style={{
                  background: "rgba(9,9,11,0.6)",
                  borderColor: "rgba(255,255,255,0.06)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                <div
                  className="text-2xl font-mono font-black shrink-0 leading-none mt-0.5"
                  style={{ color: "rgba(245,158,11,0.3)" }}
                >
                  {pillar.number}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-mono font-bold text-zinc-100 group-hover:text-amber-400 transition-colors duration-200">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{pillar.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section: Social Proof ────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section
      id="social-proof"
      className="relative py-24 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <GlowOrb color="#10b981" size={500} x="50%" y="50%" blur={140} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-12"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold font-mono tracking-tight text-zinc-100 text-balance">
              Trusted by engineering teams at scale.
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              From fintech to e-commerce, quality engineers rely on QECC to ship with
              confidence.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.author}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="relative rounded-2xl p-6 border flex flex-col gap-5 transition-all duration-300"
                style={{
                  background: "rgba(9,9,11,0.7)",
                  borderColor: "rgba(255,255,255,0.06)",
                  boxShadow:
                    "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${t.accent}40, transparent)`,
                  }}
                />
                <p className="text-xs text-zinc-400 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0"
                    style={{
                      background: `${t.accent}15`,
                      border: `1px solid ${t.accent}30`,
                      color: t.accent,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-zinc-200">
                      {t.author}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section: CTA ─────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section
      id="contact"
      className="relative py-24 overflow-hidden"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <GlowOrb color="#10b981" size={700} x="50%" y="50%" blur={160} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-8"
        >
          <motion.div variants={fadeIn} className="flex justify-center">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded-full">
              Ready to deploy
            </span>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-4xl lg:text-5xl font-bold font-mono tracking-tight text-zinc-100 text-balance"
          >
            Ship with confidence.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Every release.
            </span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-zinc-400 leading-relaxed max-w-xl mx-auto text-pretty"
          >
            Explore the full QECC infrastructure. Dive into the automation suite,
            trigger chaos experiments, inspect pipeline gates, or read the complete
            methodology documentation.
          </motion.p>

          <motion.div
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-4"
          >
            {[
              { label: "Automation Suite", href: "/automation", accent: "#10b981", icon: Terminal },
              { label: "Chaos Engineering", href: "/pipeline", accent: "#ef4444", icon: AlertTriangle },
              { label: "Methodology Docs", href: "/methodology", accent: "#f59e0b", icon: FileCode },
            ].map((cta) => (
              <motion.div key={cta.href} variants={scaleIn} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={cta.href}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-sm font-semibold border transition-all duration-300"
                  style={{
                    borderColor: `${cta.accent}30`,
                    color: cta.accent,
                    background: `${cta.accent}08`,
                  }}
                >
                  <cta.icon size={15} />
                  {cta.label}
                  <ChevronRight size={13} />
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* System status bar */}
          <motion.div
            variants={fadeIn}
            className="mt-8 inline-flex items-center gap-6 px-6 py-4 rounded-2xl border mx-auto"
            style={{
              background: "rgba(9,9,11,0.8)",
              borderColor: "rgba(255,255,255,0.06)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {initialMetrics.map((m) => (
              <div key={m.label} className="text-center">
                <div
                  className="text-base font-mono font-bold tabular-nums"
                  style={{
                    color:
                      m.status === "nominal"
                        ? "#10b981"
                        : m.status === "warning"
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                >
                  {m.value}
                  <span className="text-[10px] text-zinc-600 ml-0.5">{m.unit}</span>
                </div>
                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                  {m.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const t = useTranslations();

  return (
    <main className="relative min-h-screen" style={{ background: "#09090b" }}>
      <HeroSection />
      <PipelineSection />
      <CapabilitiesSection />
      <MethodologySection />
      <TestimonialsSection />
      <CTASection />
    </main>
  );
}