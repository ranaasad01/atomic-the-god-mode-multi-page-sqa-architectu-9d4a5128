"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { Activity, Check, X, Clock, Zap, Terminal, GitBranch, AlertCircle, ChevronRight, Play, Pause, RotateCcw, Filter, Search, ArrowUp, ArrowDown, Circle, FileCode, Eye, Star } from 'lucide-react';
import { fadeInUp, fadeIn, staggerContainer, scaleIn } from "@/lib/motion";
import { useTranslations } from "next-intl";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TestSuite {
  id: string;
  name: string;
  browser: string;
  status: "running" | "passed" | "failed" | "queued" | "skipped";
  duration: number;
  tests: number;
  passed: number;
  failed: number;
  flaky: number;
  worker: number;
  retries: number;
  tags: string[];
}

interface TestStep {
  id: string;
  timestamp: string;
  level: "info" | "pass" | "fail" | "warn" | "debug";
  message: string;
  duration?: number;
}

interface WorkerNode {
  id: number;
  status: "active" | "idle" | "error";
  currentSuite: string;
  cpu: number;
  memory: number;
  testsRun: number;
}

interface SparkPoint {
  value: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const SUITES: TestSuite[] = [
  {
    id: "s1",
    name: "auth-otp.spec.ts",
    browser: "chromium",
    status: "passed",
    duration: 14320,
    tests: 48,
    passed: 48,
    failed: 0,
    flaky: 1,
    worker: 1,
    retries: 1,
    tags: ["auth", "critical"],
  },
  {
    id: "s2",
    name: "stripe-kyc.spec.ts",
    browser: "firefox",
    status: "running",
    duration: 9870,
    tests: 62,
    passed: 54,
    failed: 2,
    flaky: 3,
    worker: 2,
    retries: 2,
    tags: ["payment", "kyc"],
  },
  {
    id: "s3",
    name: "dataset-upload.spec.ts",
    browser: "webkit",
    status: "failed",
    duration: 22100,
    tests: 35,
    passed: 31,
    failed: 4,
    flaky: 0,
    worker: 3,
    retries: 0,
    tags: ["upload", "regression"],
  },
  {
    id: "s4",
    name: "api-endpoints.spec.ts",
    browser: "chromium",
    status: "passed",
    duration: 6540,
    tests: 120,
    passed: 120,
    failed: 0,
    flaky: 2,
    worker: 4,
    retries: 2,
    tags: ["api", "contract"],
  },
  {
    id: "s5",
    name: "desktop-macos.spec.ts",
    browser: "webkit",
    status: "queued",
    duration: 0,
    tests: 29,
    passed: 0,
    failed: 0,
    flaky: 0,
    worker: 5,
    retries: 0,
    tags: ["desktop", "macos"],
  },
  {
    id: "s6",
    name: "chat-realtime.spec.ts",
    browser: "chromium",
    status: "running",
    duration: 4210,
    tests: 18,
    passed: 15,
    failed: 0,
    flaky: 1,
    worker: 6,
    retries: 1,
    tags: ["realtime", "chat"],
  },
  {
    id: "s7",
    name: "security-rbac.spec.ts",
    browser: "chromium",
    status: "passed",
    duration: 18900,
    tests: 55,
    passed: 55,
    failed: 0,
    flaky: 0,
    worker: 7,
    retries: 0,
    tags: ["security", "rbac"],
  },
];

const WORKERS: WorkerNode[] = [
  { id: 1, status: "active", currentSuite: "auth-otp.spec.ts", cpu: 72, memory: 58, testsRun: 1204 },
  { id: 2, status: "active", currentSuite: "stripe-kyc.spec.ts", cpu: 88, memory: 71, testsRun: 987 },
  { id: 3, status: "error", currentSuite: "dataset-upload.spec.ts", cpu: 45, memory: 62, testsRun: 743 },
  { id: 4, status: "idle", currentSuite: "api-endpoints.spec.ts", cpu: 12, memory: 34, testsRun: 1891 },
  { id: 5, status: "active", currentSuite: "desktop-macos.spec.ts", cpu: 65, memory: 49, testsRun: 612 },
  { id: 6, status: "active", currentSuite: "chat-realtime.spec.ts", cpu: 54, memory: 43, testsRun: 445 },
  { id: 7, status: "idle", currentSuite: "security-rbac.spec.ts", cpu: 8, memory: 28, testsRun: 2103 },
  { id: 8, status: "active", currentSuite: "—", cpu: 77, memory: 55, testsRun: 334 },
];

type LogLevel = "info" | "pass" | "fail" | "warn" | "debug" | "step";

interface LogEntry {
  id: number;
  ts: string;
  level: LogLevel;
  worker: string;
  message: string;
}

const LOG_TEMPLATES: Array<{ level: LogLevel; messages: string[] }> = [
  {
    level: "step",
    messages: [
      '▶ Given user navigates to "/login"',
      '▶ When user fills input[name="email"] with "qa@veridat.com"',
      '▶ When user submits OTP verification form',
      '▶ Then session token is stored in localStorage',
      '▶ Given authenticated user opens dataset marketplace',
      '▶ When user initiates large file upload (2.4 GB)',
      '▶ Then upload progress bar reaches 100%',
      '▶ Given buyer navigates to Stripe checkout',
      '▶ When KYC verification status is "pending"',
      '▶ Then admin panel reflects updated verification state',
    ],
  },
  {
    level: "pass",
    messages: [
      "✓ [chromium] auth-otp.spec.ts:12 — OTP input renders correctly (187ms)",
      "✓ [chromium] auth-otp.spec.ts:28 — OTP submission triggers session (234ms)",
      "✓ [firefox] stripe-kyc.spec.ts:44 — Stripe payment intent created (312ms)",
      "✓ [chromium] api-endpoints.spec.ts:88 — GET /datasets returns 200 (91ms)",
      "✓ [chromium] api-endpoints.spec.ts:102 — POST /upload validates schema (108ms)",
      "✓ [chromium] security-rbac.spec.ts:15 — Admin role blocks buyer endpoint (144ms)",
      "✓ [chromium] chat-realtime.spec.ts:7 — Message ordering preserved (201ms)",
      "✓ [webkit] auth-otp.spec.ts:55 — Role-based redirect works (178ms)",
      "✓ [chromium] api-endpoints.spec.ts:120 — DELETE /dataset returns 204 (77ms)",
      "✓ [firefox] stripe-kyc.spec.ts:61 — KYC onboarding flow completes (445ms)",
    ],
  },
  {
    level: "fail",
    messages: [
      "✗ [webkit] dataset-upload.spec.ts:33 — Large file upload timeout after 30000ms",
      "✗ [firefox] stripe-kyc.spec.ts:78 — KYC status not updated after webhook (expected 'verified', got 'pending')",
      "✗ [webkit] dataset-upload.spec.ts:67 — Cloud import from Google Drive returned 403",
      "✗ [webkit] dataset-upload.spec.ts:89 — Malware scan result not reflected in UI",
    ],
  },
  {
    level: "warn",
    messages: [
      "⚠ Flaky test detected: stripe-kyc.spec.ts:44 — retry 1/2",
      "⚠ Slow assertion: chat-realtime.spec.ts:19 — message persistence check took 4200ms",
      "⚠ Network throttle active — packet loss 2.1%",
      "⚠ Worker 3 CPU at 94% — test throughput degraded",
      "⚠ Retry triggered: dataset-upload.spec.ts:33 — attempt 2/3",
    ],
  },
  {
    level: "info",
    messages: [
      "[runner] Playwright v1.44.0 — 7 workers active across chromium/firefox/webkit",
      "[runner] Veridat platform suite — 367 total tests queued",
      '[runner] Shard 1/4 assigned: auth-otp.spec.ts, security-rbac.spec.ts',
      '[runner] Shard 2/4 assigned: stripe-kyc.spec.ts, chat-realtime.spec.ts',
      '[runner] Shard 3/4 assigned: dataset-upload.spec.ts',
      '[runner] Shard 4/4 assigned: api-endpoints.spec.ts, desktop-macos.spec.ts',
      "[trace] Capturing video artifacts for failed tests",
      "[allure] Generating test report at /reports/allure-results",
    ],
  },
  {
    level: "debug",
    messages: [
      '  console.log  Request: POST /api/auth/otp {"email":"qa@veridat.com"}',
      '  console.log  Response: 200 {"token":"eyJhbGci...","expiresIn":3600}',
      '  console.assert  Expected role "admin", received "buyer" — RBAC check failed',
      '  console.log  Stripe webhook received: {"type":"identity.verification_session.verified"}',
      '  console.log  Upload chunk 47/48 — 2.3 GB processed',
      '  console.log  WebSocket message received: {"room":"chat-4821","seq":112}',
      '  console.assert  Expected message count 15, received 14 — ordering gap detected',
    ],
  },
];

function generateLog(id: number): LogEntry {
  const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
  const messages = template.messages;
  const message = messages[Math.floor(Math.random() * messages.length)];
  const workerNum = Math.floor(Math.random() * 7) + 1;
  const now = new Date();
  const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
  return { id, ts, level: template.level, worker: `W${workerNum}`, message };
}

function generateSparkData(length: number, base: number, variance: number): SparkPoint[] {
  return Array.from({ length }, () => ({
    value: Math.max(0, base + (Math.random() - 0.5) * variance * 2),
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sparkline({ data, color, height = 32 }: { data: SparkPoint[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const w = 120;
  const h = height;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.value - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,${h} ` + points + ` ${w},${h}`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sg-${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: TestSuite["status"] }) {
  const cfg = {
    passed: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "PASSED" },
    failed: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "FAILED" },
    running: { color: "#06b6d4", bg: "rgba(6,182,212,0.1)", label: "RUNNING" },
    queued: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "QUEUED" },
    skipped: { color: "#71717a", bg: "rgba(113,113,122,0.1)", label: "SKIPPED" },
  }[status];
  return (
    <span
      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}40` }}
    >
      {cfg.label}
    </span>
  );
}

function BrowserIcon({ browser }: { browser: string }) {
  const colors: Record<string, string> = {
    chromium: "#10b981",
    firefox: "#f59e0b",
    webkit: "#06b6d4",
  };
  const color = colors[browser] ?? "#71717a";
  return (
    <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ color, border: `1px solid ${color}40` }}>
      {browser.toUpperCase()}
    </span>
  );
}

function WorkerStatusDot({ status }: { status: WorkerNode["status"] }) {
  const color = status === "active" ? "#10b981" : status === "error" ? "#ef4444" : "#71717a";
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: color, boxShadow: status === "active" ? `0 0 6px ${color}` : "none" }}
    />
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
        />
      </div>
      <span className="text-[9px] font-mono tabular-nums" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

// ─── Log Level Config ─────────────────────────────────────────────────────────

const LOG_LEVEL_CONFIG: Record<LogLevel, { color: string; bg: string }> = {
  pass: { color: "#10b981", bg: "rgba(16,185,129,0.06)" },
  fail: { color: "#ef4444", bg: "rgba(239,68,68,0.06)" },
  warn: { color: "#f59e0b", bg: "rgba(245,158,11,0.06)" },
  info: { color: "#06b6d4", bg: "transparent" },
  debug: { color: "#71717a", bg: "transparent" },
  step: { color: "#a78bfa", bg: "rgba(167,139,250,0.04)" },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HighThroughputAutomationPage() {
  const t = useTranslations();

  // ── State ──
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logIdRef, setLogIdRef] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [filterLevel, setFilterLevel] = useState<LogLevel | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [throughputData, setThroughputData] = useState<SparkPoint[]>(() =>
    generateSparkData(40, 1847, 400)
  );
  const [latencyData, setLatencyData] = useState<SparkPoint[]>(() =>
    generateSparkData(40, 142, 60)
  );
  const [workerData, setWorkerData] = useState<WorkerNode[]>(WORKERS);
  const [isRunning, setIsRunning] = useState(true);
  const [totalPassed, setTotalPassed] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const logIdCounter = useRef(1);

  // ── Compute totals from SUITES ──
  useEffect(() => {
    const p = SUITES.reduce((acc, s) => acc + s.passed, 0);
    const f = SUITES.reduce((acc, s) => acc + s.failed, 0);
    setTotalPassed(p);
    setTotalFailed(f);
  }, []);

  // ── Elapsed timer ──
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // ── Log streaming ──
  useEffect(() => {
    if (isPaused || !isRunning) return;
    const id = setInterval(() => {
      const newLog = generateLog(logIdCounter.current++);
      setLogs((prev) => {
        const next = [...prev, newLog];
        return next.length > 200 ? next.slice(-200) : next;
      });
    }, 280);
    return () => clearInterval(id);
  }, [isPaused, isRunning]);

  // ── Auto-scroll terminal ──
  useEffect(() => {
    if (isPaused) return;
    const el = logContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs, isPaused]);

  // ── Sparkline updates ──
  useEffect(() => {
    const id = setInterval(() => {
      setThroughputData((prev) => {
        const next = [...prev.slice(1), { value: Math.max(0, 1847 + (Math.random() - 0.5) * 800) }];
        return next;
      });
      setLatencyData((prev) => {
        const next = [...prev.slice(1), { value: Math.max(50, 142 + (Math.random() - 0.5) * 120) }];
        return next;
      });
    }, 600);
    return () => clearInterval(id);
  }, []);

  // ── Worker CPU/memory jitter ──
  useEffect(() => {
    const id = setInterval(() => {
      setWorkerData((prev) =>
        prev.map((w) => ({
          ...w,
          cpu: w.status === "idle" ? Math.max(2, w.cpu + (Math.random() - 0.5) * 4) : Math.min(99, Math.max(20, w.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.min(95, Math.max(10, w.memory + (Math.random() - 0.5) * 6)),
          testsRun: w.status === "active" ? w.testsRun + Math.floor(Math.random() * 3) : w.testsRun,
        }))
      );
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterLevel !== "all" && l.level !== filterLevel) return false;
    if (searchQuery && !l.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const formatDuration = (ms: number) => {
    if (ms === 0) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const totalTests = SUITES.reduce((a, s) => a + s.tests, 0);
  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0.0";

  const selectedSuiteData = selectedSuite ? SUITES.find((s) => s.id === selectedSuite) : null;

  return (
    <div className="min-h-screen bg-[#030303] text-emerald-400 font-mono">
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(3,3,3,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(16,185,129,0.1)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #10b981" }} />
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Automation Suite</span>
          <span className="text-xs text-zinc-700">/</span>
          <span className="text-xs text-emerald-400">Veridat Platform — Playwright Parallel Run</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-zinc-500" />
            <span className="text-xs font-mono tabular-nums text-zinc-400">{formatElapsed(elapsedSeconds)}</span>
          </div>
          <button
            onClick={() => setIsRunning((r) => !r)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all"
            style={{
              background: isRunning ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
              border: `1px solid ${isRunning ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
              color: isRunning ? "#ef4444" : "#10b981",
            }}
          >
            {isRunning ? <Pause size={11} /> : <Play size={11} />}
            {isRunning ? "Pause" : "Resume"}
          </button>
          <button
            onClick={() => setLogs([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            style={{ border: "1px solid rgba(113,113,122,0.2)" }}
          >
            <RotateCcw size={11} />
            Reset
          </button>
        </div>
      </motion.div>

      <div className="px-6 py-6 space-y-6">
        {/* ── Top KPI Strip ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { label: "Total Tests", value: totalTests.toLocaleString("en-US"), color: "#06b6d4", icon: <Activity size={14} /> },
            { label: "Passed", value: totalPassed.toLocaleString("en-US"), color: "#10b981", icon: <Check size={14} /> },
            { label: "Failed", value: totalFailed.toLocaleString("en-US"), color: "#ef4444", icon: <X size={14} /> },
            { label: "Pass Rate", value: `${passRate}%`, color: parseFloat(passRate) > 95 ? "#10b981" : parseFloat(passRate) > 80 ? "#f59e0b" : "#ef4444", icon: <Zap size={14} /> },
          ].map((kpi) => (
            <motion.div
              key={kpi.label}
              variants={scaleIn}
              className="rounded-lg p-4 flex items-center gap-3"
              style={{
                background: "rgba(9,9,11,0.8)",
                border: `1px solid ${kpi.color}20`,
                boxShadow: `inset 0 0 20px ${kpi.color}05`,
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: `${kpi.color}15`, color: kpi.color }}
              >
                {kpi.icon}
              </div>
              <div>
                <div className="text-xl font-bold tabular-nums" style={{ color: kpi.color }}>
                  {kpi.value}
                </div>
                <div className="text-[9px] text-zinc-600 uppercase tracking-widest">{kpi.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Sparklines Row ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {[
            { label: "Throughput (RPS)", data: throughputData, color: "#10b981", current: Math.round(throughputData[throughputData.length - 1]?.value ?? 1847) },
            { label: "P99 Latency (ms)", data: latencyData, color: "#06b6d4", current: Math.round(latencyData[latencyData.length - 1]?.value ?? 142) },
          ].map((chart) => (
            <motion.div
              key={chart.label}
              variants={fadeInUp}
              className="rounded-lg p-4"
              style={{
                background: "rgba(9,9,11,0.8)",
                border: "1px solid rgba(16,185,129,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{chart.label}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: chart.color }}>
                  {chart.current.toLocaleString("en-US")}
                </span>
              </div>
              <Sparkline data={chart.data} color={chart.color} height={40} />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Grid: Suites + Workers ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Test Suites Table */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="xl:col-span-2 rounded-lg overflow-hidden"
            style={{
              background: "rgba(9,9,11,0.8)",
              border: "1px solid rgba(16,185,129,0.1)",
            }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(16,185,129,0.08)" }}
            >
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Test Suites</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {SUITES.length} suites
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={11} className="text-zinc-600" />
                <span className="text-[9px] text-zinc-600">Veridat Platform</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(16,185,129,0.06)" }}>
                    {["Suite", "Browser", "Status", "Tests", "Pass/Fail", "Duration", "Worker", "Tags"].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-[9px] text-zinc-600 uppercase tracking-widest font-normal"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SUITES.map((suite, idx) => (
                    <motion.tr
                      key={suite.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedSuite(selectedSuite === suite.id ? null : suite.id)}
                      className="cursor-pointer transition-colors hover:bg-emerald-500/5"
                      style={{
                        borderBottom: "1px solid rgba(16,185,129,0.04)",
                        background: selectedSuite === suite.id ? "rgba(16,185,129,0.06)" : undefined,
                      }}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <FileCode size={11} className="text-zinc-600 flex-shrink-0" />
                          <span className="text-zinc-300 truncate max-w-[160px]">{suite.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <BrowserIcon browser={suite.browser} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={suite.status} />
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-zinc-400">{suite.tests}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-emerald-400">{suite.passed}</span>
                        <span className="text-zinc-700">/</span>
                        <span className="text-red-400">{suite.failed}</span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-zinc-500">{formatDuration(suite.duration)}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-cyan-400">W{suite.worker}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {suite.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[8px] px-1 py-0.5 rounded"
                              style={{
                                background: "rgba(6,182,212,0.08)",
                                color: "#06b6d4",
                                border: "1px solid rgba(6,182,212,0.2)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Suite detail panel */}
            {selectedSuiteData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-4"
                style={{ borderTop: "1px solid rgba(16,185,129,0.1)", background: "rgba(16,185,129,0.03)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-emerald-400 font-mono">{selectedSuiteData.name}</span>
                  <button onClick={() => setSelectedSuite(null)} className="text-zinc-600 hover:text-zinc-400">
                    <X size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Tests", value: selectedSuiteData.tests, color: "#06b6d4" },
                    { label: "Passed", value: selectedSuiteData.passed, color: "#10b981" },
                    { label: "Failed", value: selectedSuiteData.failed, color: "#ef4444" },
                    { label: "Flaky", value: selectedSuiteData.flaky, color: "#f59e0b" },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <div className="text-lg font-bold tabular-nums" style={{ color: m.color }}>
                        {m.value}
                      </div>
                      <div className="text-[9px] text-zinc-600 uppercase tracking-widest">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[9px] text-zinc-600">Retries: <span className="text-zinc-400">{selectedSuiteData.retries}</span></span>
                  <span className="text-[9px] text-zinc-600">Duration: <span className="text-zinc-400">{formatDuration(selectedSuiteData.duration)}</span></span>
                  <span className="text-[9px] text-zinc-600">Worker: <span className="text-cyan-400">W{selectedSuiteData.worker}</span></span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Worker Nodes */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="rounded-lg overflow-hidden"
            style={{
              background: "rgba(9,9,11,0.8)",
              border: "1px solid rgba(16,185,129,0.1)",
            }}
          >
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid rgba(16,185,129,0.08)" }}
            >
              <Cpu size={14} className="text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Worker Nodes</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {workerData.filter((w) => w.status === "active").length} active
              </span>
            </div>
            <div className="p-3 space-y-2">
              {workerData.map((worker) => (
                <motion.div
                  key={worker.id}
                  layout
                  className="rounded p-3 space-y-2"
                  style={{
                    background: "rgba(9,9,11,0.6)",
                    border: `1px solid ${
                      worker.status === "active"
                        ? "rgba(16,185,129,0.15)"
                        : worker.status === "error"
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(113,113,122,0.1)"
                    }`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <WorkerStatusDot status={worker.status} />
                      <span className="text-xs font-mono text-zinc-300">W{worker.id}</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600 tabular-nums">
                      {worker.testsRun.toLocaleString("en-US")} tests
                    </span>
                  </div>
                  <div className="text-[9px] text-zinc-600 truncate">{worker.currentSuite}</div>
                  <div className="space-y-1">
                    <MiniBar value={Math.round(worker.cpu)} color="#10b981" />
                    <MiniBar value={Math.round(worker.memory)} color="#06b6d4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Terminal Log ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="rounded-lg overflow-hidden"
          style={{
            background: "rgba(9,9,11,0.95)",
            border: "1px solid rgba(16,185,129,0.1)",
          }}
        >
          {/* Terminal header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(16,185,129,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <Terminal size={14} className="text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Playwright Output</span>
              <span className="text-[9px] text-zinc-600 tabular-nums">{logs.length} lines</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Level filter */}
              <div className="flex items-center gap-1">
                {(["all", "pass", "fail", "warn", "step", "debug"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFilterLevel(lvl)}
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono transition-all"
                    style={{
                      background: filterLevel === lvl ? "rgba(16,185,129,0.15)" : "transparent",
                      color: filterLevel === lvl ? "#10b981" : "#52525b",
                      border: `1px solid ${filterLevel === lvl ? "rgba(16,185,129,0.3)" : "transparent"}`,
                    }}
                  >
                    {lvl.toUpperCase()}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Search size={10} className="text-zinc-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="filter..."
                  className="bg-transparent text-[10px] font-mono text-zinc-400 outline-none w-24 placeholder-zinc-700"
                />
              </div>
              <button
                onClick={() => setIsPaused((p) => !p)}
                className="text-[9px] px-2 py-1 rounded font-mono transition-all"
                style={{
                  background: isPaused ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                  color: isPaused ? "#f59e0b" : "#10b981",
                  border: `1px solid ${isPaused ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`,
                }}
              >
                {isPaused ? "RESUME" : "PAUSE"}
              </button>
            </div>
          </div>

          {/* Log lines */}
          <div
            ref={logContainerRef}
            className="h-80 overflow-y-auto p-3 space-y-0.5"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(16,185,129,0.2) transparent" }}
          >
            {filteredLogs.length === 0 && (
              <div className="text-center text-zinc-700 text-xs py-8">
                {isRunning ? "Waiting for log output..." : "Run paused. Press Resume to continue."}
              </div>
            )}
            {filteredLogs.map((log) => {
              const cfg = LOG_LEVEL_CONFIG[log.level];
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2 px-2 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: cfg.bg }}
                >
                  <span className="text-zinc-700 tabular-nums flex-shrink-0 w-24">{log.ts}</span>
                  <span
                    className="flex-shrink-0 w-12 text-[8px] uppercase font-bold"
                    style={{ color: cfg.color }}
                  >
                    {log.level}
                  </span>
                  <span className="text-zinc-600 flex-shrink-0 w-8">{log.worker}</span>
                  <span style={{ color: cfg.color === "#71717a" ? "#52525b" : cfg.color }} className="break-all">
                    {log.message}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Terminal footer */}
          <div
            className="px-4 py-2 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(16,185,129,0.06)" }}
          >
            <div className="flex items-center gap-4">
              <span className="text-[9px] text-zinc-700">
                <span className="text-emerald-400">{logs.filter((l) => l.level === "pass").length}</span> pass
              </span>
              <span className="text-[9px] text-zinc-700">
                <span className="text-red-400">{logs.filter((l) => l.level === "fail").length}</span> fail
              </span>
              <span className="text-[9px] text-zinc-700">
                <span className="text-amber-400">{logs.filter((l) => l.level === "warn").length}</span> warn
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: isRunning && !isPaused ? "#10b981" : "#f59e0b",
                  boxShadow: isRunning && !isPaused ? "0 0 6px #10b981" : "none",
                  animation: isRunning && !isPaused ? "pulse 1.5s infinite" : "none",
                }}
              />
              <span className="text-[9px] text-zinc-600">
                {isRunning && !isPaused ? "STREAMING" : "PAUSED"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
