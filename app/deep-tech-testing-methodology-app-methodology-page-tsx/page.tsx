"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, Check, ChevronDown, ChevronRight, Circle, FileCode, FileText, GitBranch, Lock, Search, Sparkles, Star, Terminal, Eye, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { fadeInUp, fadeIn, staggerContainer, scaleIn, slideInLeft, slideInRight } from "@/lib/motion";
import { useTranslations } from "next-intl";

// ─── Inline mock data ────────────────────────────────────────────────────────

const METHODOLOGY_PILLARS = [
  {
    id: "shift-left",
    icon: ArrowUp,
    color: "#10b981",
    glow: "rgba(16,185,129,0.25)",
    title: "Shift-Left Quality",
    subtitle: "Defect prevention at the source",
    description:
      "Embed quality gates at every commit boundary. Static analysis, type-checking, and contract validation run before a single line reaches CI, collapsing the feedback loop from hours to seconds.",
    metrics: [
      { label: "Defect Escape Rate", value: "0.3%", delta: "-82%" },
      { label: "Mean Time to Detect", value: "4 min", delta: "-91%" },
      { label: "Cost per Defect", value: "$12", delta: "-94%" },
    ],
    practices: [
      "Pre-commit Husky hooks with ESLint + TypeScript strict",
      "Contract testing via Pact for every service boundary",
      "Snapshot regression on all design-system tokens",
      "Automated accessibility audits in PR checks",
    ],
  },
  {
    id: "mutation",
    icon: Activity,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
    title: "Mutation Testing",
    subtitle: "Validate the validators",
    description:
      "Stryker injects 2,400+ AST-level mutations per release cycle. Any surviving mutant surfaces a gap in assertion coverage — not just line coverage. We target a Mutation Score above 85% before any release gate opens.",
    metrics: [
      { label: "Mutation Score", value: "88.7%", delta: "+12%" },
      { label: "Mutants Killed", value: "2,341", delta: "+8%" },
      { label: "Surviving Mutants", value: "297", delta: "-31%" },
    ],
    practices: [
      "Stryker configured with incremental analysis on changed files",
      "Custom mutators for domain-specific business logic",
      "Mutation reports integrated into Allure dashboards",
      "Threshold enforcement blocks merge below 80% score",
    ],
  },
  {
    id: "chaos",
    icon: AlertTriangle,
    color: "#ef4444",
    glow: "rgba(239,68,68,0.25)",
    title: "Chaos Engineering",
    subtitle: "Resilience through controlled failure",
    description:
      "Steady-state hypothesis testing via Chaos Toolkit and Litmus. We inject network partitions, pod evictions, and CPU starvation on a weekly cadence in staging, with monthly game days in production shadow environments.",
    metrics: [
      { label: "MTTR (P95)", value: "8.2 min", delta: "-67%" },
      { label: "Blast Radius", value: "< 0.1%", delta: "-88%" },
      { label: "Recovery SLO", value: "99.95%", delta: "+2.1%" },
    ],
    practices: [
      "Steady-state hypothesis defined before every experiment",
      "Automated rollback triggers on SLO breach",
      "Chaos results feed directly into runbook updates",
      "Game-day post-mortems with blameless RCA templates",
    ],
  },
  {
    id: "observability",
    icon: Eye,
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.25)",
    title: "Observability-Driven Testing",
    subtitle: "Test what you can measure",
    description:
      "Every test emits structured OpenTelemetry spans. Trace IDs propagate from Playwright browser context through API layers to database queries, enabling root-cause analysis at the span level — not just the test level.",
    metrics: [
      { label: "Trace Coverage", value: "96.1%", delta: "+18%" },
      { label: "P99 Latency SLO", value: "< 200ms", delta: "MET" },
      { label: "Error Budget Burn", value: "2.3%", delta: "SAFE" },
    ],
    practices: [
      "OpenTelemetry SDK injected into every test runner process",
      "Custom Playwright fixtures emit span start/end events",
      "Grafana dashboards auto-generated from test trace data",
      "Alerting rules derived from test-observed SLIs",
    ],
  },
];

const TESTING_PYRAMID = [
  {
    level: "E2E / Browser",
    count: 847,
    percentage: 8,
    color: "#ef4444",
    tool: "Playwright",
    avgDuration: "4.2 min",
    description: "Critical user journeys, cross-browser matrix, visual regression",
  },
  {
    level: "Integration",
    count: 3_204,
    percentage: 28,
    color: "#f59e0b",
    tool: "Vitest + Supertest",
    avgDuration: "42 sec",
    description: "Service contracts, database interactions, message queue flows",
  },
  {
    level: "Unit",
    count: 14_891,
    percentage: 64,
    color: "#10b981",
    tool: "Vitest",
    avgDuration: "8 sec",
    description: "Pure functions, domain logic, edge cases, mutation targets",
  },
];

const QUALITY_GATES = [
  {
    stage: "Pre-Commit",
    icon: FileCode,
    color: "#06b6d4",
    checks: [
      { name: "TypeScript strict compile", status: "pass" },
      { name: "ESLint + Prettier", status: "pass" },
      { name: "Circular dependency scan", status: "pass" },
      { name: "Secret detection (Gitleaks)", status: "pass" },
    ],
    blocksMerge: false,
    avgTime: "12s",
  },
  {
    stage: "Pull Request",
    icon: GitBranch,
    color: "#10b981",
    checks: [
      { name: "Unit test suite (Vitest)", status: "pass" },
      { name: "Mutation score >= 80%", status: "pass" },
      { name: "Coverage delta >= 0%", status: "pass" },
      { name: "Snapshot regression", status: "warn" },
      { name: "Accessibility audit (axe)", status: "pass" },
    ],
    blocksMerge: true,
    avgTime: "3m 20s",
  },
  {
    stage: "Staging Deploy",
    icon: Terminal,
    color: "#f59e0b",
    checks: [
      { name: "Integration test suite", status: "pass" },
      { name: "Contract tests (Pact)", status: "pass" },
      { name: "Performance baseline (k6)", status: "pass" },
      { name: "OWASP ZAP security scan", status: "pass" },
    ],
    blocksMerge: true,
    avgTime: "8m 45s",
  },
  {
    stage: "Production Gate",
    icon: Lock,
    color: "#ef4444",
    checks: [
      { name: "E2E smoke suite (Playwright)", status: "pass" },
      { name: "Canary SLO validation", status: "pass" },
      { name: "Chaos steady-state check", status: "pass" },
      { name: "Error budget burn rate", status: "pass" },
    ],
    blocksMerge: true,
    avgTime: "14m 10s",
  },
];

const FRAMEWORK_COMPARISON = [
  {
    framework: "Playwright",
    category: "E2E / Browser",
    strengths: ["Cross-browser matrix", "Network interception", "Trace viewer"],
    maturity: 95,
    adoption: "Primary",
    color: "#10b981",
  },
  {
    framework: "Vitest",
    category: "Unit / Integration",
    strengths: ["Vite-native speed", "ESM support", "Watch mode"],
    maturity: 92,
    adoption: "Primary",
    color: "#10b981",
  },
  {
    framework: "Stryker",
    category: "Mutation",
    strengths: ["AST mutations", "Incremental mode", "HTML reports"],
    maturity: 88,
    adoption: "Primary",
    color: "#10b981",
  },
  {
    framework: "k6",
    category: "Performance",
    strengths: ["JS scripting", "Grafana native", "Cloud execution"],
    maturity: 90,
    adoption: "Primary",
    color: "#10b981",
  },
  {
    framework: "OWASP ZAP",
    category: "Security",
    strengths: ["DAST scanning", "CI integration", "Active scan rules"],
    maturity: 82,
    adoption: "Secondary",
    color: "#f59e0b",
  },
  {
    framework: "Pact",
    category: "Contract",
    strengths: ["Consumer-driven", "Broker integration", "Multi-language"],
    maturity: 79,
    adoption: "Secondary",
    color: "#f59e0b",
  },
];

const CASE_STUDIES = [
  {
    title: "Payment Service Hardening",
    tag: "Chaos + Mutation",
    tagColor: "#ef4444",
    outcome: "Zero payment failures during Black Friday 3x traffic spike",
    detail:
      "Injected 14 distinct fault scenarios into the payment orchestration layer. Mutation testing revealed 3 critical assertion gaps in idempotency logic. Post-hardening: 0 P0 incidents across 2.4M transactions.",
    metrics: [
      { k: "Transactions", v: "2.4M" },
      { k: "P0 Incidents", v: "0" },
      { k: "Mutation Score", v: "91%" },
    ],
  },
  {
    title: "Search Latency Regression Suite",
    tag: "Observability",
    tagColor: "#06b6d4",
    outcome: "P99 latency regression caught 48 hours before production deploy",
    detail:
      "OpenTelemetry traces from Playwright tests exposed a 340ms regression in the Elasticsearch aggregation pipeline. The trace pinpointed a missing index on a compound query introduced in a dependency upgrade.",
    metrics: [
      { k: "Regression Caught", v: "48h early" },
      { k: "Latency Delta", v: "+340ms" },
      { k: "Root Cause", v: "1 span" },
    ],
  },
  {
    title: "Auth Service Contract Migration",
    tag: "Shift-Left",
    tagColor: "#10b981",
    outcome: "12-service contract migration with zero runtime breakages",
    detail:
      "Pact consumer-driven contracts enforced at PR level across 12 microservices during an OAuth 2.1 migration. Every breaking change was caught in CI before reaching a shared environment.",
    metrics: [
      { k: "Services", v: "12" },
      { k: "Breaking Changes Caught", v: "34" },
      { k: "Runtime Breakages", v: "0" },
    ],
  },
];

const ACCORDION_FAQS = [
  {
    q: "How do you handle flaky tests at scale?",
    a: "We track a Flakiness Regression Index (FRI) per test file. Any test with FRI > 0.05 over a 7-day rolling window is automatically quarantined into a flaky bucket, re-run in isolation with retry=3, and a GitHub issue is auto-filed with the trace. The test is blocked from gating merges until the FRI drops below 0.02.",
  },
  {
    q: "What is your approach to test data management?",
    a: "All test data is generated via factory functions using deterministic seeds — never random, never shared between runs. Factories are co-located with domain models. For integration tests, we use Testcontainers to spin up isolated Postgres/Redis instances per test suite, seeded from migration scripts.",
  },
  {
    q: "How do you measure test suite ROI?",
    a: "We track Cost per Defect Caught (CPDC), Defect Escape Rate (DER), and Mean Time to Detect (MTTD) across all pipeline stages. These feed a quarterly QE ROI report that maps testing investment to production incident reduction and developer velocity gains.",
  },
  {
    q: "How is the mutation testing threshold enforced?",
    a: "Stryker runs in incremental mode on changed files only, keeping CI time under 4 minutes. The mutation score threshold (80% minimum, 85% target) is enforced as a required status check on the GitHub branch protection rule. Surviving mutants are surfaced in the PR comment with the exact AST node and suggested assertion.",
  },
  {
    q: "What is your strategy for cross-browser testing?",
    a: "Playwright runs the full E2E suite against Chromium, Firefox, and WebKit in parallel on every staging deploy. A subset of 120 critical-path tests also runs against real devices via BrowserStack on a nightly schedule. Visual regression uses Percy with a 0.1% pixel-diff threshold.",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children, color = "#10b981" }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs font-mono uppercase tracking-widest" style={{ color }}>
        {children}
      </span>
    </div>
  );
}

function GlowCard({
  children,
  className = "",
  glowColor = "rgba(16,185,129,0.08)",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <div
      className={`relative rounded-xl border border-white/5 bg-zinc-900/60 backdrop-blur-sm overflow-hidden ${className}`}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px -8px rgba(0,0,0,0.5), inset 0 0 60px -20px ${glowColor}`,
      }}
    >
      {children}
    </div>
  );
}

function PillarCard({ pillar, index }: { pillar: (typeof METHODOLOGY_PILLARS)[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = pillar.icon;

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <GlowCard glowColor={pillar.glow}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${pillar.color}18`, border: `1px solid ${pillar.color}30` }}
              >
                <Icon size={18} style={{ color: pillar.color }} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-zinc-100">{pillar.title}</h3>
                <p className="text-xs font-mono" style={{ color: pillar.color }}>
                  {pillar.subtitle}
                </p>
              </div>
            </div>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full border"
              style={{
                color: pillar.color,
                borderColor: `${pillar.color}40`,
                backgroundColor: `${pillar.color}10`,
              }}
            >
              0{index + 1}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs font-mono text-zinc-400 leading-relaxed mb-5">{pillar.description}</p>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {pillar.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-lg p-2 text-center"
                style={{ backgroundColor: `${pillar.color}08`, border: `1px solid ${pillar.color}20` }}
              >
                <div className="text-sm font-mono font-bold" style={{ color: pillar.color }}>
                  {m.value}
                </div>
                <div className="text-[9px] font-mono text-zinc-600 mt-0.5">{m.label}</div>
                <div
                  className="text-[9px] font-mono mt-0.5"
                  style={{ color: m.delta.startsWith("-") ? "#10b981" : m.delta.startsWith("+") ? "#06b6d4" : "#f59e0b" }}
                >
                  {m.delta}
                </div>
              </div>
            ))}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
          >
            <ChevronDown
              size={12}
              className="transition-transform duration-200"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            />
            {expanded ? "Hide practices" : "View practices"}
          </button>

          {expanded && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-4 space-y-2 overflow-hidden"
            >
              {pillar.practices.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Check size={10} className="mt-0.5 shrink-0" style={{ color: pillar.color }} />
                  <span className="text-xs font-mono text-zinc-400">{p}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      </GlowCard>
    </motion.div>
  );
}

function PyramidSection() {
  const total = TESTING_PYRAMID.reduce((s, l) => s + l.count, 0);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="space-y-4"
    >
      {[...TESTING_PYRAMID].reverse().map((level, i) => (
        <motion.div key={level.level} variants={fadeInUp}>
          <GlowCard glowColor={`${level.color}12`}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: level.color, boxShadow: `0 0 6px ${level.color}` }}
                  />
                  <span className="text-sm font-mono font-bold text-zinc-100">{level.level}</span>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${level.color}15`, color: level.color, border: `1px solid ${level.color}30` }}
                  >
                    {level.tool}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold tabular-nums" style={{ color: level.color }}>
                    {level.count.toLocaleString("en-US")}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-600">tests</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: level.color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${level.percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-zinc-500">{level.description}</p>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    <div className="text-xs font-mono text-zinc-300">{level.avgDuration}</div>
                    <div className="text-[9px] font-mono text-zinc-600">avg run</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold" style={{ color: level.color }}>
                      {level.percentage}%
                    </div>
                    <div className="text-[9px] font-mono text-zinc-600">of suite</div>
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      ))}
    </motion.div>
  );
}

function QualityGateCard({ gate }: { gate: (typeof QUALITY_GATES)[0] }) {
  const Icon = gate.icon;
  const passCount = gate.checks.filter((c) => c.status === "pass").length;
  const warnCount = gate.checks.filter((c) => c.status === "warn").length;

  return (
    <motion.div variants={scaleIn} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <GlowCard glowColor={`${gate.color}12`} className="h-full">
        <div className="p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${gate.color}18`, border: `1px solid ${gate.color}30` }}
              >
                <Icon size={14} style={{ color: gate.color }} />
              </div>
              <span className="text-xs font-mono font-bold text-zinc-100">{gate.stage}</span>
            </div>
            {gate.blocksMerge && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 bg-red-500/10">
                BLOCKS MERGE
              </span>
            )}
          </div>

          {/* Checks */}
          <ul className="space-y-2 flex-1 mb-4">
            {gate.checks.map((check) => (
              <li key={check.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      check.status === "pass"
                        ? "rgba(16,185,129,0.2)"
                        : "rgba(245,158,11,0.2)",
                    border: `1px solid ${check.status === "pass" ? "#10b981" : "#f59e0b"}40`,
                  }}
                >
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: check.status === "pass" ? "#10b981" : "#f59e0b" }}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-400">{check.name}</span>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-emerald-400">{passCount} pass</span>
              {warnCount > 0 && (
                <span className="text-[10px] font-mono text-amber-400">{warnCount} warn</span>
              )}
            </div>
            <span className="text-[10px] font-mono text-zinc-500">{gate.avgTime}</span>
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
}

function FrameworkRow({ fw, index }: { fw: (typeof FRAMEWORK_COMPARISON)[0]; index: number }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors duration-200"
    >
      <div className="w-6 text-center text-xs font-mono text-zinc-600">{String(index + 1).padStart(2, "0")}</div>
      <div className="w-28 shrink-0">
        <div className="text-xs font-mono font-bold text-zinc-100">{fw.framework}</div>
        <div className="text-[10px] font-mono text-zinc-500">{fw.category}</div>
      </div>
      <div className="flex-1">
        <div className="flex gap-2 flex-wrap">
          {fw.strengths.map((s) => (
            <span
              key={s}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/5"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="w-24 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: fw.color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${fw.maturity}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.05 }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">{fw.maturity}%</span>
        </div>
      </div>
      <div className="w-20 text-right shrink-0">
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
          style={{
            color: fw.adoption === "Primary" ? "#10b981" : "#f59e0b",
            borderColor: fw.adoption === "Primary" ? "#10b98140" : "#f59e0b40",
            backgroundColor: fw.adoption === "Primary" ? "#10b98110" : "#f59e0b10",
          }}
        >
          {fw.adoption}
        </span>
      </div>
    </motion.div>
  );
}

function CaseStudyCard({ cs }: { cs: (typeof CASE_STUDIES)[0] }) {
  return (
    <motion.div variants={fadeInUp} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <GlowCard glowColor={`${cs.tagColor}12`} className="h-full">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
              style={{
                color: cs.tagColor,
                borderColor: `${cs.tagColor}40`,
                backgroundColor: `${cs.tagColor}10`,
              }}
            >
              {cs.tag}
            </span>
            <Star size={12} className="text-zinc-600" />
          </div>
          <h3 className="text-sm font-mono font-bold text-zinc-100 mb-2">{cs.title}</h3>
          <p className="text-xs font-mono font-semibold mb-3" style={{ color: cs.tagColor }}>
            {cs.outcome}
          </p>
          <p className="text-xs font-mono text-zinc-500 leading-relaxed flex-1 mb-4">{cs.detail}</p>
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
            {cs.metrics.map((m) => (
              <div key={m.k} className="text-center">
                <div className="text-xs font-mono font-bold text-zinc-100">{m.v}</div>
                <div className="text-[9px] font-mono text-zinc-600">{m.k}</div>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
}

function AccordionItem({ item, index }: { item: (typeof ACCORDION_FAQS)[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div variants={fadeInUp}>
      <div
        className="border border-white/5 rounded-xl overflow-hidden"
        style={{ backgroundColor: "rgba(24,24,27,0.6)" }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-white/2 transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
            <span className="text-sm font-mono text-zinc-200">{item.q}</span>
          </div>
          <ChevronDown
            size={14}
            className="text-zinc-500 shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="pl-8 border-l border-emerald-500/20">
                <p className="text-xs font-mono text-zinc-400 leading-relaxed">{item.a}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Animated sparkline for hero ─────────────────────────────────────────────

function HeroSparkline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const dataRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    let t = 0;

    const draw = () => {
      t += 0.04;
      const val = 60 + Math.sin(t) * 20 + Math.sin(t * 2.3) * 10 + Math.sin(t * 0.7) * 8;
      dataRef.current.push(val);
      if (dataRef.current.length > 80) dataRef.current.shift();

      ctx.clearRect(0, 0, W, H);

      const data = dataRef.current;
      if (data.length < 2) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.beginPath();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 6;
      data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - 20) / 80) * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.fillStyle = "rgba(16,185,129,0.06)";
      data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - 20) / 80) * H;
        if (i === 0) ctx.moveTo(x, H);
        ctx.lineTo(x, y);
      });
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return <canvas ref={canvasRef} width={400} height={80} className="w-full opacity-70" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MethodologyPage() {
  const [activeTab, setActiveTab] = useState<"pillars" | "pyramid" | "gates" | "frameworks">("pillars");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFrameworks = FRAMEWORK_COMPARISON.filter(
    (fw) =>
      searchQuery === "" ||
      fw.framework.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fw.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: "pillars", label: "Core Pillars" },
    { id: "pyramid", label: "Test Pyramid" },
    { id: "gates", label: "Quality Gates" },
    { id: "frameworks", label: "Frameworks" },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 md:pl-64">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="px-6 pt-16 pb-12 border-b border-white/5">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={fadeIn} className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #10b981" }} />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                Deep-Tech Testing Methodology
              </span>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div>
                <motion.h1
                  variants={slideInLeft}
                  className="text-4xl md:text-5xl font-mono font-black text-zinc-100 leading-tight tracking-tight mb-4"
                  style={{ textShadow: "0 0 40px rgba(16,185,129,0.15)" }}
                >
                  Quality at
                  <br />
                  <span className="text-emerald-400">Every Layer</span>
                </motion.h1>
                <motion.p
                  variants={fadeInUp}
                  className="text-sm font-mono text-zinc-400 leading-relaxed max-w-lg mb-6"
                >
                  A systematic, evidence-based approach to software quality spanning mutation testing,
                  chaos engineering, observability-driven validation, and shift-left defect prevention.
                  Built for teams shipping at enterprise velocity.
                </motion.p>
                <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
                  {[
                    { label: "19,942 Tests", color: "#10b981" },
                    { label: "88.7% Mutation Score", color: "#f59e0b" },
                    { label: "4 Quality Gates", color: "#06b6d4" },
                    { label: "0 P0 Escapes", color: "#ef4444" },
                  ].map((badge) => (
                    <span
                      key={badge.label}
                      className="text-xs font-mono px-3 py-1 rounded-full border"
                      style={{
                        color: badge.color,
                        borderColor: `${badge.color}40`,
                        backgroundColor: `${badge.color}10`,
                      }}
                    >
                      {badge.label}
                    </span>
                  ))}
                </motion.div>
              </div>

              <motion.div variants={slideInRight}>
                <GlowCard glowColor="rgba(16,185,129,0.1)">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Quality Signal — Live
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-400">STREAMING</span>
                      </div>
                    </div>
                    <HeroSparkline />
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {[
                        { k: "Health", v: "98.4%", c: "#10b981" },
                        { k: "P99", v: "142ms", c: "#06b6d4" },
                        { k: "Pass Rate", v: "97.2%", c: "#10b981" },
                        { k: "RPS", v: "1,847", c: "#f59e0b" },
                      ].map((m) => (
                        <div key={m.k} className="text-center">
                          <div className="text-sm font-mono font-bold tabular-nums" style={{ color: m.c }}>
                            {m.v}
                          </div>
                          <div className="text-[9px] font-mono text-zinc-600">{m.k}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── Tab navigation ───────────────────────────────────────────────── */}
        <section className="px-6 py-6 border-b border-white/5 sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/60 border border-white/5 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative px-4 py-2 text-xs font-mono rounded-lg transition-all duration-200"
                  style={{
                    color: activeTab === tab.id ? "#10b981" : "#71717a",
                    backgroundColor: activeTab === tab.id ? "rgba(16,185,129,0.1)" : "transparent",
                    border: activeTab === tab.id ? "1px solid rgba(16,185,129,0.25)" : "1px solid transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tab content ──────────────────────────────────────────────────── */}
        <section className="px-6 py-12">
          <div className="max-w-5xl mx-auto">
            {/* PILLARS */}
            {activeTab === "pillars" && (
              <motion.div
                key="pillars"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fadeInUp} className="mb-8">
                  <SectionLabel>Methodology Pillars</SectionLabel>
                  <h2 className="text-2xl font-mono font-bold text-zinc-100 tracking-tight">
                    Four Dimensions of Quality Engineering
                  </h2>
                  <p className="text-sm font-mono text-zinc-500 mt-2 max-w-2xl">
                    Each pillar addresses a distinct failure mode in software delivery. Together they form
                    a defense-in-depth quality strategy that catches defects at the earliest possible stage.
                  </p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {METHODOLOGY_PILLARS.map((pillar, i) => (
                    <PillarCard key={pillar.id} pillar={pillar} index={i} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* PYRAMID */}
            {activeTab === "pyramid" && (
              <motion.div
                key="pyramid"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fadeInUp} className="mb-8">
                  <SectionLabel color="#f59e0b">Test Distribution</SectionLabel>
                  <h2 className="text-2xl font-mono font-bold text-zinc-100 tracking-tight">
                    The Testing Pyramid
                  </h2>
                  <p className="text-sm font-mono text-zinc-500 mt-2 max-w-2xl">
                    19,942 tests distributed across three layers. The pyramid shape is intentional: fast,
                    cheap unit tests form the base; slow, expensive E2E tests are reserved for critical paths only.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {TESTING_PYRAMID.map((level) => (
                    <motion.div key={level.level} variants={scaleIn}>
                      <GlowCard glowColor={`${level.color}12`}>
                        <div className="p-5 text-center">
                          <div
                            className="text-3xl font-mono font-black mb-1"
                            style={{ color: level.color }}
                          >
                            {level.count.toLocaleString("en-US")}
                          </div>
                          <div className="text-xs font-mono text-zinc-300 mb-1">{level.level}</div>
                          <div className="text-[10px] font-mono text-zinc-600">{level.tool}</div>
                          <div
                            className="mt-3 text-xs font-mono font-bold"
                            style={{ color: level.color }}
                          >
                            {level.percentage}% of suite
                          </div>
                        </div>
                      </GlowCard>
                    </motion.div>
                  ))}
                </div>

                <PyramidSection />
              </motion.div>
            )}

            {/* GATES */}
            {activeTab === "gates" && (
              <motion.div
                key="gates"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fadeInUp} className="mb-8">
                  <SectionLabel color="#06b6d4">Pipeline Enforcement</SectionLabel>
                  <h2 className="text-2xl font-mono font-bold text-zinc-100 tracking-tight">
                    Quality Gate Architecture
                  </h2>
                  <p className="text-sm font-mono text-zinc-500 mt-2 max-w-2xl">
                    Four mandatory checkpoints from commit to production. Each gate is a hard blocker
                    with automated rollback. No human override without a signed incident ticket.
                  </p>
                </motion.div>

                {/* Pipeline flow visualization */}
                <motion.div variants={fadeInUp} className="mb-8">
                  <GlowCard glowColor="rgba(6,182,212,0.08)">
                    <div className="p-5">
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {QUALITY_GATES.map((gate, i) => {
                          const Icon = gate.icon;
                          return (
                            <div key={gate.stage} className="flex items-center gap-2 shrink-0">
                              <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                                style={{
                                  borderColor: `${gate.color}40`,
                                  backgroundColor: `${gate.color}10`,
                                }}
                              >
                                <Icon size={12} style={{ color: gate.color }} />
                                <span className="text-xs font-mono" style={{ color: gate.color }}>
                                  {gate.stage}
                                </span>
                              </div>
                              {i < QUALITY_GATES.length - 1 && (
                                <ArrowRight size={12} className="text-zinc-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {QUALITY_GATES.map((gate) => (
                    <QualityGateCard key={gate.stage} gate={gate} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* FRAMEWORKS */}
            {activeTab === "frameworks" && (
              <motion.div
                key="frameworks"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fadeInUp} className="mb-6">
                  <SectionLabel color="#f59e0b">Toolchain</SectionLabel>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-mono font-bold text-zinc-100 tracking-tight">
                        Framework Inventory
                      </h2>
                      <p className="text-sm font-mono text-zinc-500 mt-2 max-w-2xl">
                        Every tool is evaluated on maturity, community support, CI integration depth,
                        and alignment with our observability-first philosophy.
                      </p>
                    </div>
                    <div className="relative">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter frameworks..."
                        className="pl-8 pr-4 py-2 text-xs font-mono bg-zinc-900/60 border border-white/10 rounded-lg text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors duration-200 w-48"
                      />
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-2">
                  {filteredFrameworks.map((fw, i) => (
                    <FrameworkRow key={fw.framework} fw={fw} index={i} />
                  ))}
                  {filteredFrameworks.length === 0 && (
                    <div className="text-center py-12 text-xs font-mono text-zinc-600">
                      No frameworks match your search.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── Case Studies ─────────────────────────────────────────────────── */}
        <section className="px-6 py-16 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <motion.div variants={fadeInUp} className="mb-8">
                <SectionLabel color="#ef4444">Evidence</SectionLabel>
                <h2 className="text-2xl font-mono font-bold text-zinc-100 tracking-tight">
                  Case Studies
                </h2>
                <p className="text-sm font-mono text-zinc-500 mt-2 max-w-2xl">
                  Real outcomes from applying this methodology in production systems. Numbers are
                  measured, not estimated.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {CASE_STUDIES.map((cs) => (
                  <CaseStudyCard key={cs.title} cs={cs} />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ / Deep Dives ─────────────────────────────────────────────── */}
        <section className="px-6 py-16 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <motion.div variants={fadeInUp} className="mb-8">
                <SectionLabel color="#06b6d4">Deep Dives</SectionLabel>
                <h2 className="text-2xl font-mono font-bold text-zinc-100 tracking-tight">
                  Engineering Decisions
                </h2>
                <p className="text-sm font-mono text-zinc-500 mt-2 max-w-2xl">
                  Detailed answers to the hard questions about how this methodology works in practice.
                </p>
              </motion.div>

              <div className="space-y-2">
                {ACCORDION_FAQS.map((item, i) => (
                  <AccordionItem key={item.q} item={item} index={i} />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA strip ────────────────────────────────────────────────────── */}
        <section className="px-6 py-16 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
            >
              <GlowCard glowColor="rgba(16,185,129,0.12)">
                <div className="p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-emerald-400" />
                      <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                        Ready to explore
                      </span>
                    </div>
                    <h3 className="text-xl font-mono font-bold text-zinc-100 mb-2">
                      See the methodology in action
                    </h3>
                    <p className="text-sm font-mono text-zinc-500 max-w-md">
                      The Mission Control dashboard streams live metrics from every layer of this
                      quality system in real time.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    <a
                      href="/"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold transition-all duration-200"
                      style={{
                        backgroundColor: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.35)",
                        color: "#10b981",
                        boxShadow: "0 0 20px -8px rgba(16,185,129,0.4)",
                      }}
                    >
                      Mission Control
                      <ArrowRight size={12} />
                    </a>
                    <a
                      href="/pipeline"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
                    >
                      Chaos Pipeline
                      <ChevronRight size={12} />
                    </a>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}