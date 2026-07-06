"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { Activity, AlertCircle, AlertTriangle, Check, CheckCircle, Clock, Eye, FileCode, GitBranch, Lock, Search, Settings, Sparkles, Terminal, X, Zap } from 'lucide-react';
import { fadeInUp, fadeIn, staggerContainer, scaleIn } from "@/lib/motion";
import { brand, initialMetrics, techStack, pipelineStages } from "@/lib/data";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TestRun {
  id: string;
  suite: string;
  status: "passed" | "failed" | "running" | "queued";
  duration: string;
  tests: number;
  passed: number;
  failed: number;
  timestamp: string;
  env: string;
}

interface TerminalLine {
  id: number;
  text: string;
  type: "info" | "pass" | "fail" | "warn" | "cmd";
  ts: string;
}

interface SparkPoint {
  value: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_RUNS: TestRun[] = [
  {
    id: "run-4821",
    suite: "Auth & OTP E2E Suite",
    status: "passed",
    duration: "2m 14s",
    tests: 148,
    passed: 148,
    failed: 0,
    timestamp: "09:42:11",
    env: "staging",
  },
  {
    id: "run-4820",
    suite: "Stripe Payment & KYC Flow",
    status: "failed",
    duration: "3m 07s",
    tests: 212,
    passed: 198,
    failed: 14,
    timestamp: "09:38:55",
    env: "staging",
  },
  {
    id: "run-4819",
    suite: "API Contract Tests — Veridat",
    status: "running",
    duration: "1m 22s",
    tests: 340,
    passed: 287,
    failed: 0,
    timestamp: "09:41:03",
    env: "production",
  },
  {
    id: "run-4818",
    suite: "Dataset Upload & Cloud Import",
    status: "passed",
    duration: "4m 51s",
    tests: 96,
    passed: 96,
    failed: 0,
    timestamp: "09:30:00",
    env: "staging",
  },
  {
    id: "run-4817",
    suite: "Desktop Cross-Platform Baseline",
    status: "queued",
    duration: "--",
    tests: 0,
    passed: 0,
    failed: 0,
    timestamp: "09:43:00",
    env: "load",
  },
  {
    id: "run-4816",
    suite: "Security & RBAC Smoke Tests",
    status: "passed",
    duration: "6m 02s",
    tests: 54,
    passed: 54,
    failed: 0,
    timestamp: "09:20:14",
    env: "staging",
  },
];

const PIPELINE_STATUS: Record<string, "idle" | "running" | "passed" | "failed"> = {
  lint: "passed",
  unit: "passed",
  mutation: "running",
  integration: "queued" as unknown as "idle",
  e2e: "idle",
  security: "idle",
};

const INITIAL_TERMINAL_LINES: TerminalLine[] = [
  { id: 1, text: "▶  Playwright v1.44.0 — parallel workers: 4 — Veridat QA Suite", type: "info", ts: "09:41:03" },
  { id: 2, text: "  ✓  [chromium] › auth/otp.spec.ts:12 — should send OTP on login (234ms)", type: "pass", ts: "09:41:04" },
  { id: 3, text: "  ✓  [chromium] › auth/session.spec.ts:28 — should maintain session across tabs (189ms)", type: "pass", ts: "09:41:04" },
  { id: 4, text: "  ✓  [firefox] › auth/otp.spec.ts:12 — should send OTP on login (301ms)", type: "pass", ts: "09:41:05" },
  { id: 5, text: "  ✗  [chromium] › api/datasets.spec.ts:44 — POST /api/datasets — expected 201 got 500 (88ms)", type: "fail", ts: "09:41:06" },
  { id: 6, text: "  ✓  [webkit] › payment/stripe.spec.ts:8 — buyer onboarding complete (2100ms)", type: "pass", ts: "09:41:07" },
  { id: 7, text: "  ✓  [chromium] › chat/messaging.spec.ts:22 — messages persist after reload (310ms)", type: "pass", ts: "09:41:08" },
  { id: 8, text: "  ✓  [chromium] › security/rbac.spec.ts:5 — admin accesses all routes (145ms)", type: "pass", ts: "09:41:09" },
];

const EXTRA_TERMINAL_LINES: TerminalLine[] = [
  { id: 9, text: "  ✓  [chromium] › auth/otp.spec.ts:30 — OTP expires after 5 minutes (198ms)", type: "pass", ts: "09:41:10" },
  { id: 10, text: "  ✓  [firefox] › payment/kyc.spec.ts:14 — seller KYC verification status updates (445ms)", type: "pass", ts: "09:41:11" },
  { id: 11, text: "  ✓  [chromium] › datasets/upload.spec.ts:7 — large file upload completes (3210ms)", type: "pass", ts: "09:41:12" },
  { id: 12, text: "  ✓  [webkit] › datasets/cloud.spec.ts:19 — Google Drive import succeeds (1870ms)", type: "pass", ts: "09:41:13" },
  { id: 13, text: "  ✗  [chromium] › payment/stripe.spec.ts:44 — webhook signature validation failed (timeout 30000ms)", type: "fail", ts: "09:41:14" },
  { id: 14, text: "  ⚠  Flaky test detected: payment/stripe.spec.ts:44 — retry 1/3", type: "warn", ts: "09:41:15" },
  { id: 15, text: "  ✓  [chromium] › security/rbac.spec.ts:22 — buyer cannot access admin routes (112ms)", type: "pass", ts: "09:41:16" },
  { id: 16, text: "  ✓  [firefox] › chat/messaging.spec.ts:35 — real-time message ordering correct (289ms)", type: "pass", ts: "09:41:17" },
  { id: 17, text: '  console.assert  Expected status 201, received 500 — {"trace":"veridat-4f2a1b","endpoint":"/api/datasets"}', type: "cmd", ts: "09:41:18" },
  { id: 18, text: "  ✓  [chromium] › datasets/malware.spec.ts:8 — malware scan blocks infected file (567ms)", type: "pass", ts: "09:41:19" },
  { id: 19, text: "  ✓  [webkit] › auth/session.spec.ts:41 — session invalidated on logout (134ms)", type: "pass", ts: "09:41:20" },
  { id: 20, text: "  ✓  [chromium] › payment/kyc.spec.ts:28 — admin validates seller KYC (892ms)", type: "pass", ts: "09:41:21" },
];

// ─── Sparkline generator ──────────────────────────────────────────────────────

function generateSparkPoints(count: number, base: number, variance: number): SparkPoint[] {
  const points: SparkPoint[] = [];
  let current = base;
  for (let i = 0; i < count; i++) {
    current = Math.max(0, Math.min(100, current + (Math.random() - 0.5) * variance));
    points.push({ value: current });
  }
  return points;
}

// ─── SVG Sparkline ────────────────────────────────────────────────────────────

function Sparkline({
  points,
  color,
  height = 40,
  width = 120,
  filled = false,
}: {
  points: SparkPoint[];
  color: string;
  height?: number;
  width?: number;
  filled?: boolean;
}) {
  if (points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.value));
  const min = Math.min(...points.map((p) => p.value));
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: height - ((p.value - min) / range) * (height - 4) - 2,
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${coords[coords.length - 1].x.toFixed(1)} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {filled && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity={0.08}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TestRun["status"] }) {
  const cfg = {
    passed: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "PASSED" },
    failed: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "FAILED" },
    running: { color: "#06b6d4", bg: "rgba(6,182,212,0.1)", label: "RUNNING" },
    queued: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "QUEUED" },
  }[status];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
    >
      {status === "running" && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: cfg.color }}
        />
      )}
      {cfg.label}
    </span>
  );
}

// ─── Pipeline stage dot ───────────────────────────────────────────────────────

function PipelineDot({ status, color }: { status: string; color: string }) {
  const s = PIPELINE_STATUS[status] ?? "idle";
  const dotColor =
    s === "passed"
      ? "#10b981"
      : s === "failed"
      ? "#ef4444"
      : s === "running"
      ? "#06b6d4"
      : "#3f3f46";
  return (
    <div
      className="w-2 h-2 rounded-full"
      style={{
        background: dotColor,
        boxShadow: s === "running" ? `0 0 6px ${dotColor}` : "none",
      }}
    />
  );
}

// ─── Terminal line color ──────────────────────────────────────────────────────

function terminalColor(type: TerminalLine["type"]): string {
  return {
    info: "#06b6d4",
    pass: "#10b981",
    fail: "#ef4444",
    warn: "#f59e0b",
    cmd: "#a1a1aa",
  }[type];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MissionControlDashboardPage() {
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(INITIAL_TERMINAL_LINES);
  const [terminalPaused, setTerminalPaused] = useState(false);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(MOCK_RUNS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [throughputPoints, setThroughputPoints] = useState<SparkPoint[]>(() =>
    generateSparkPoints(30, 65, 18)
  );
  const [flakinessPoints, setFlakinessPoints] = useState<SparkPoint[]>(() =>
    generateSparkPoints(30, 30, 12)
  );
  const [systemHealth, setSystemHealth] = useState(97.4);
  const [p99Latency, setP99Latency] = useState(142);
  const [passedCount, setPassedCount] = useState(2847);
  const [failedCount, setFailedCount] = useState(53);
  const [throughputRPS, setThroughputRPS] = useState(1847);
  const terminalRef = useRef<HTMLDivElement>(null);
  const extraLineIndex = useRef(0);

  // Live telemetry simulation
  useEffect(() => {
    const id = setInterval(() => {
      setSystemHealth((h) => Math.min(100, Math.max(85, h + (Math.random() - 0.48) * 0.4)));
      setP99Latency((l) => Math.min(300, Math.max(80, l + (Math.random() - 0.5) * 8)));
      setPassedCount((c) => c + Math.floor(Math.random() * 3));
      setThroughputRPS((r) => Math.min(2500, Math.max(1200, r + (Math.random() - 0.5) * 60)));
      setThroughputPoints((pts) => {
        const next = [...pts.slice(1), { value: Math.min(100, Math.max(0, pts[pts.length - 1].value + (Math.random() - 0.5) * 15)) }];
        return next;
      });
      setFlakinessPoints((pts) => {
        const next = [...pts.slice(1), { value: Math.min(100, Math.max(0, pts[pts.length - 1].value + (Math.random() - 0.5) * 8)) }];
        return next;
      });
    }, 1200);
    return () => clearInterval(id);
  }, []);

  // Terminal streaming
  useEffect(() => {
    if (terminalPaused) return;
    const id = setInterval(() => {
      const extra = EXTRA_TERMINAL_LINES[extraLineIndex.current % EXTRA_TERMINAL_LINES.length];
      extraLineIndex.current += 1;
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      setTerminalLines((lines) => [
        ...lines.slice(-60),
        { ...extra, id: Date.now(), ts },
      ]);
    }, 900);
    return () => clearInterval(id);
  }, [terminalPaused]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current && !terminalPaused) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines, terminalPaused]);

  const filteredRuns = MOCK_RUNS.filter(
    (r) =>
      r.suite.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTests = MOCK_RUNS.reduce((a, r) => a + r.tests, 0);
  const totalPassed = MOCK_RUNS.reduce((a, r) => a + r.passed, 0);
  const totalFailed = MOCK_RUNS.reduce((a, r) => a + r.failed, 0);
  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 space-y-8">
      {/* ── Header ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 8px #10b981" }} />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Mission Control Dashboard</span>
          <span className="text-[10px] font-mono text-zinc-600">— Veridat QA Suite @ DaticsAI</span>
        </motion.div>
        <motion.h1
          variants={fadeInUp}
          className="text-2xl md:text-3xl font-bold font-mono text-emerald-400"
          style={{ textShadow: "0 0 20px rgba(16,185,129,0.3)" }}
        >
          {brand.name}
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-sm font-mono text-zinc-500">
          Rao Muhammad Ali · SQA Engineer · DaticsAI, Lahore
        </motion.p>
      </motion.div>

      {/* ── Top KPI strip ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "System Health", value: `${systemHealth.toFixed(1)}%`, color: "#10b981", icon: Activity },
          { label: "P99 Latency", value: `${Math.round(p99Latency)}ms`, color: "#06b6d4", icon: Zap },
          { label: "Pass Rate", value: `${passRate}%`, color: "#10b981", icon: CheckCircle },
          { label: "Throughput", value: `${Math.round(throughputRPS).toLocaleString("en-US")} RPS`, color: "#f59e0b", icon: Activity },
        ].map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={scaleIn}
            className="rounded-lg p-4 border"
            style={{
              background: "rgba(9,9,11,0.8)",
              borderColor: `${kpi.color}20`,
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon size={12} style={{ color: kpi.color }} />
            </div>
            <div
              className="text-xl font-mono font-bold tabular-nums"
              style={{ color: kpi.color, textShadow: `0 0 12px ${kpi.color}50` }}
            >
              {kpi.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Test Runs table ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 rounded-lg border overflow-hidden"
          style={{
            background: "rgba(9,9,11,0.8)",
            borderColor: "rgba(16,185,129,0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Table header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "rgba(16,185,129,0.1)" }}
          >
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">Test Runs</span>
            </div>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                placeholder="Search suites…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900/60 border border-zinc-800 rounded text-[11px] font-mono text-zinc-400 pl-6 pr-3 py-1 focus:outline-none focus:border-emerald-500/40 w-44"
              />
            </div>
          </div>

          {/* Column headers */}
          <div
            className="grid grid-cols-12 gap-2 px-4 py-2 border-b text-[10px] font-mono text-zinc-600 uppercase tracking-wider"
            style={{ borderColor: "rgba(16,185,129,0.06)" }}
          >
            <span className="col-span-1">ID</span>
            <span className="col-span-4">Suite</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-1">Tests</span>
            <span className="col-span-1">Pass</span>
            <span className="col-span-1">Fail</span>
            <span className="col-span-1">Time</span>
            <span className="col-span-1">Env</span>
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: "rgba(16,185,129,0.04)" }}>
            {filteredRuns.map((run) => (
              <motion.div
                key={run.id}
                whileHover={{ backgroundColor: "rgba(16,185,129,0.03)" }}
                onClick={() => setSelectedRun(run)}
                className="grid grid-cols-12 gap-2 px-4 py-2.5 cursor-pointer transition-colors"
                style={{
                  borderBottom: "1px solid rgba(16,185,129,0.04)",
                  background: selectedRun?.id === run.id ? "rgba(16,185,129,0.05)" : "transparent",
                }}
              >
                <span className="col-span-1 text-[10px] font-mono text-zinc-600 truncate">{run.id}</span>
                <span className="col-span-4 text-[11px] font-mono text-zinc-300 truncate">{run.suite}</span>
                <span className="col-span-2">
                  <StatusBadge status={run.status} />
                </span>
                <span className="col-span-1 text-[11px] font-mono text-zinc-400 tabular-nums">{run.tests || "—"}</span>
                <span className="col-span-1 text-[11px] font-mono tabular-nums" style={{ color: "#10b981" }}>{run.passed || "—"}</span>
                <span className="col-span-1 text-[11px] font-mono tabular-nums" style={{ color: run.failed > 0 ? "#ef4444" : "#3f3f46" }}>{run.failed || "—"}</span>
                <span className="col-span-1 text-[10px] font-mono text-zinc-600 tabular-nums">{run.timestamp}</span>
                <span
                  className="col-span-1 text-[10px] font-mono uppercase"
                  style={{
                    color:
                      run.env === "production"
                        ? "#ef4444"
                        : run.env === "staging"
                        ? "#06b6d4"
                        : "#f59e0b",
                  }}
                >
                  {run.env}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Summary footer */}
          <div
            className="flex items-center justify-between px-4 py-2 border-t"
            style={{ borderColor: "rgba(16,185,129,0.08)" }}
          >
            <span className="text-[10px] font-mono text-zinc-600">
              {filteredRuns.length} runs · {totalTests.toLocaleString("en-US")} tests
            </span>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono" style={{ color: "#10b981" }}>
                ✓ {totalPassed.toLocaleString("en-US")} passed
              </span>
              <span className="text-[10px] font-mono" style={{ color: "#ef4444" }}>
                ✗ {totalFailed.toLocaleString("en-US")} failed
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Right column: Pipeline + Selected run ── */}
        <div className="space-y-4">
          {/* Pipeline status */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="rounded-lg border p-4"
            style={{
              background: "rgba(9,9,11,0.8)",
              borderColor: "rgba(16,185,129,0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <GitBranch size={13} className="text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">Pipeline Gate</span>
            </div>
            <div className="space-y-2">
              {pipelineStages.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PipelineDot status={stage.id} color={stage.color} />
                    <span className="text-[11px] font-mono text-zinc-400">{stage.label}</span>
                  </div>
                  <span
                    className="text-[10px] font-mono uppercase"
                    style={{
                      color:
                        PIPELINE_STATUS[stage.id] === "passed"
                          ? "#10b981"
                          : PIPELINE_STATUS[stage.id] === "failed"
                          ? "#ef4444"
                          : PIPELINE_STATUS[stage.id] === "running"
                          ? "#06b6d4"
                          : "#3f3f46",
                    }}
                  >
                    {PIPELINE_STATUS[stage.id] ?? "idle"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Selected run detail */}
          {selectedRun && (
            <motion.div
              key={selectedRun.id}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="rounded-lg border p-4"
              style={{
                background: "rgba(9,9,11,0.8)",
                borderColor: "rgba(16,185,129,0.12)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye size={13} className="text-cyan-400" />
                  <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">Run Detail</span>
                </div>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-0.5">Suite</div>
                  <div className="text-xs font-mono text-zinc-300">{selectedRun.suite}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-0.5">Duration</div>
                    <div className="text-xs font-mono text-zinc-400">{selectedRun.duration}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-0.5">Env</div>
                    <div
                      className="text-xs font-mono uppercase"
                      style={{
                        color:
                          selectedRun.env === "production"
                            ? "#ef4444"
                            : selectedRun.env === "staging"
                            ? "#06b6d4"
                            : "#f59e0b",
                      }}
                    >
                      {selectedRun.env}
                    </div>
                  </div>
                </div>
                {selectedRun.tests > 0 && (
                  <div>
                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">Pass / Fail</div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 rounded-full flex-1 overflow-hidden"
                        style={{ background: "rgba(239,68,68,0.2)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(selectedRun.passed / selectedRun.tests) * 100}%`,
                            background: "#10b981",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: "#10b981" }}>
                        {((selectedRun.passed / selectedRun.tests) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-0.5">Timestamp</div>
                  <div className="text-xs font-mono text-zinc-500">{selectedRun.timestamp}</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Telemetry sparklines ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Throughput */}
        <motion.div
          variants={fadeInUp}
          className="rounded-lg border p-4"
          style={{
            background: "rgba(9,9,11,0.8)",
            borderColor: "rgba(6,182,212,0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={13} style={{ color: "#06b6d4" }} />
              <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: "#06b6d4" }}>
                Throughput RPS
              </span>
            </div>
            <span className="text-lg font-mono font-bold tabular-nums" style={{ color: "#06b6d4" }}>
              {Math.round(throughputRPS).toLocaleString("en-US")}
            </span>
          </div>
          <div className="w-full">
            <Sparkline
              points={throughputPoints}
              color="#06b6d4"
              height={48}
              width={320}
              filled
            />
          </div>
          <div className="mt-2 text-[10px] font-mono text-zinc-600">
            Poisson-distributed traffic simulation · Veridat API endpoints
          </div>
        </motion.div>

        {/* Flakiness */}
        <motion.div
          variants={fadeInUp}
          className="rounded-lg border p-4"
          style={{
            background: "rgba(9,9,11,0.8)",
            borderColor: "rgba(245,158,11,0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} style={{ color: "#f59e0b" }} />
              <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: "#f59e0b" }}>
                Flakiness Regression Index
              </span>
            </div>
            <span className="text-lg font-mono font-bold tabular-nums" style={{ color: "#f59e0b" }}>
              {flakinessPoints.length > 0
                ? flakinessPoints[flakinessPoints.length - 1].value.toFixed(1)
                : "0.0"}%
            </span>
          </div>
          <div className="w-full">
            <Sparkline
              points={flakinessPoints}
              color="#f59e0b"
              height={48}
              width={320}
              filled
            />
          </div>
          <div className="mt-2 text-[10px] font-mono text-zinc-600">
            Variance model · Stripe & dataset upload flakiness tracked
          </div>
        </motion.div>
      </motion.div>

      {/* ── Terminal ── */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border overflow-hidden"
        style={{
          background: "rgba(5,5,7,0.95)",
          borderColor: "rgba(16,185,129,0.12)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Terminal header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: "rgba(16,185,129,0.1)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <Terminal size={12} className="text-emerald-400 ml-1" />
            <span className="text-[11px] font-mono text-emerald-400 font-bold">playwright · veridat-qa-suite</span>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              LIVE
            </span>
          </div>
          <button
            onClick={() => setTerminalPaused((p) => !p)}
            className="text-[10px] font-mono px-2 py-1 rounded transition-colors"
            style={{
              color: terminalPaused ? "#10b981" : "#f59e0b",
              background: terminalPaused ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
              border: `1px solid ${terminalPaused ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
            }}
          >
            {terminalPaused ? "▶ RESUME" : "⏸ PAUSE"}
          </button>
        </div>

        {/* Terminal body */}
        <div
          ref={terminalRef}
          className="h-64 overflow-y-auto p-4 space-y-0.5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(16,185,129,0.2) transparent" }}
        >
          {terminalLines.map((line) => (
            <div key={line.id} className="flex items-start gap-3 font-mono text-[11px] leading-5">
              <span className="text-zinc-700 tabular-nums shrink-0 w-16">{line.ts}</span>
              <span style={{ color: terminalColor(line.type) }} className="break-all">
                {line.text}
              </span>
            </div>
          ))}
          {!terminalPaused && (
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span className="text-zinc-700 tabular-nums w-16">——</span>
              <span className="text-emerald-400 animate-pulse">█</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Tech stack ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="rounded-lg border p-4"
        style={{
          background: "rgba(9,9,11,0.8)",
          borderColor: "rgba(16,185,129,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-3">
          <Sparkles size={13} className="text-emerald-400" />
          <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">QA Stack · Rao Muhammad Ali</span>
        </motion.div>
        <motion.div variants={fadeInUp} className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="text-[10px] font-mono px-2 py-1 rounded"
              style={{
                background: "rgba(16,185,129,0.06)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
