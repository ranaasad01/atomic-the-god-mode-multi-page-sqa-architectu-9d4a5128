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
    suite: "Auth E2E Suite",
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
    suite: "Checkout Flow",
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
    suite: "API Contract Tests",
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
    suite: "Visual Regression",
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
    suite: "Performance Baseline",
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
    suite: "Security Scan",
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
  { id: 1, text: "▶  Playwright v1.44.0 — parallel workers: 8", type: "info", ts: "09:41:03" },
  { id: 2, text: "  ✓  [chromium] › auth/login.spec.ts:12 — should render login form (234ms)", type: "pass", ts: "09:41:04" },
  { id: 3, text: "  ✓  [chromium] › auth/login.spec.ts:28 — should validate email format (189ms)", type: "pass", ts: "09:41:04" },
  { id: 4, text: "  ✓  [firefox] › auth/login.spec.ts:12 — should render login form (301ms)", type: "pass", ts: "09:41:05" },
  { id: 5, text: "  ✗  [webkit] › checkout/cart.spec.ts:88 — should apply discount code (timeout 30000ms)", type: "fail", ts: "09:41:06" },
  { id: 6, text: "  ⚠  Flaky test detected: checkout/cart.spec.ts:88 — retry 1/3", type: "warn", ts: "09:41:07" },
  { id: 7, text: "  ✓  [chromium] › api/contracts.spec.ts:44 — GET /users returns 200 (88ms)", type: "pass", ts: "09:41:08" },
  { id: 8, text: "  ✓  [chromium] › api/contracts.spec.ts:55 — POST /orders validates schema (112ms)", type: "pass", ts: "09:41:08" },
  { id: 9, text: '  console.assert  Expected status 200, received 503 — {"trace":"4f2a1b"}', type: "cmd", ts: "09:41:09" },
  { id: 10, text: "  ✓  [firefox] › api/contracts.spec.ts:44 — GET /users returns 200 (94ms)", type: "pass", ts: "09:41:09" },
];

const EXTRA_TERMINAL_LINES: TerminalLine[] = [
  { id: 11, text: "  ✓  [chromium] › auth/session.spec.ts:7 — token refresh succeeds (145ms)", type: "pass", ts: "09:41:10" },
  { id: 12, text: "  ✓  [chromium] › auth/session.spec.ts:19 — logout clears cookies (98ms)", type: "pass", ts: "09:41:11" },
  { id: 13, text: "  ✗  [webkit] › checkout/cart.spec.ts:88 — retry 1 failed (timeout)", type: "fail", ts: "09:41:12" },
  { id: 14, text: "  ⚠  Flaky test detected: checkout/cart.spec.ts:88 — retry 2/3", type: "warn", ts: "09:41:13" },
  { id: 15, text: '  console.log  {"step":"applyDiscount","code":"SAVE20","result":"INVALID_CODE"}', type: "cmd", ts: "09:41:13" },
  { id: 16, text: "  ✓  [chromium] › perf/lcp.spec.ts:3 — LCP < 2500ms (1847ms) (pass)", type: "pass", ts: "09:41:14" },
  { id: 17, text: "  ✓  [firefox] › perf/lcp.spec.ts:3 — LCP < 2500ms (2103ms) (pass)", type: "pass", ts: "09:41:15" },
  { id: 18, text: "  ✗  [webkit] › checkout/cart.spec.ts:88 — retry 2 failed (timeout)", type: "fail", ts: "09:41:16" },
  { id: 19, text: "  ✗  checkout/cart.spec.ts:88 — FINAL FAIL after 3 retries", type: "fail", ts: "09:41:17" },
  { id: 20, text: "  ✓  [chromium] › security/xss.spec.ts:11 — reflected XSS blocked (201ms)", type: "pass", ts: "09:41:18" },
];

// ─── Sparkline Generator ──────────────────────────────────────────────────────

function generateSparkPoints(count: number, base: number, variance: number): SparkPoint[] {
  const points: SparkPoint[] = [];
  let current = base;
  for (let i = 0; i < count; i++) {
    current = Math.max(0, Math.min(100, current + (Math.random() - 0.5) * variance));
    points.push({ value: current });
  }
  return points;
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({
  points,
  color,
  height = 40,
  width = 120,
}: {
  points: SparkPoint[];
  color: string;
  height?: number;
  width?: number;
}) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value));
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p.value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const polyline = coords.join(" ");
  const areaPath = `M${coords[0]} L${coords.join(" L")} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      <circle
        cx={coords[coords.length - 1]?.split(",")[0] ?? 0}
        cy={coords[coords.length - 1]?.split(",")[1] ?? 0}
        r="2.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const statCardVariant: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 16 },
  },
};

function StatCard({
  label,
  value,
  unit,
  color,
  sparkPoints,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  sparkPoints: SparkPoint[];
  delta: string;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      variants={statCardVariant}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative rounded-xl p-4 flex flex-col gap-3 overflow-hidden"
      style={{
        background: "rgba(9,9,11,0.7)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 8px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-5 rounded-xl"
        style={{ background: `radial-gradient(ellipse at top left, ${color}, transparent 70%)` }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          >
            <Icon size={13} style={{ color }} />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</span>
        </div>
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}
        >
          {delta}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-mono font-bold tabular-nums" style={{ color }}>
            {value}
          </span>
          <span className="text-xs font-mono text-zinc-500 ml-1">{unit}</span>
        </div>
        <Sparkline points={sparkPoints} color={color} width={80} height={32} />
      </div>
    </motion.div>
  );
}

// ─── Terminal ─────────────────────────────────────────────────────────────────

function LiveTerminal({ lines }: { lines: TerminalLine[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const colorMap: Record<TerminalLine["type"], string> = {
    info: "#06b6d4",
    pass: "#10b981",
    fail: "#ef4444",
    warn: "#f59e0b",
    cmd: "#a78bfa",
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 8px 32px -8px rgba(0,0,0,0.6)",
      }}
    >
      {/* Terminal header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 ml-2">playwright — run-4819 — 8 workers</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-400">LIVE</span>
        </div>
      </div>
      {/* Lines */}
      <div className="h-52 overflow-y-auto p-3 space-y-0.5 font-mono text-[11px] leading-relaxed">
        {(lines ?? []).map((line) => (
          <div key={line.id} className="flex gap-2 items-start">
            <span className="text-zinc-600 shrink-0 tabular-nums">{line.ts}</span>
            <span style={{ color: colorMap[line.type] ?? "#a1a1aa" }}>{line.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ─── Pipeline Stage ───────────────────────────────────────────────────────────

const stageIconMap: Record<string, React.ElementType> = {
  FileCode,
  Check,
  Activity,
  GitBranch,
  Terminal,
  Lock,
};

function PipelineStageChip({
  stage,
  status,
  index,
}: {
  stage: (typeof pipelineStages)[number];
  status: "idle" | "running" | "passed" | "failed";
  index: number;
}) {
  const Icon = stageIconMap[stage.icon] ?? Activity;
  const statusConfig = {
    idle: { color: "#52525b", bg: "rgba(82,82,91,0.1)", label: "IDLE" },
    running: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "RUN" },
    passed: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "PASS" },
    failed: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "FAIL" },
  };
  const cfg = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 140, damping: 16 }}
      className="flex flex-col items-center gap-1.5"
    >
      <div
        className="relative w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.color}40`,
          boxShadow: status === "running" ? `0 0 12px ${cfg.color}40` : "none",
        }}
      >
        <Icon size={16} style={{ color: cfg.color }} />
        {status === "running" && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{ border: `1px solid ${cfg.color}` }}
            animate={{ opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
        {status === "passed" && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check size={8} className="text-black" />
          </div>
        )}
        {status === "failed" && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
            <X size={8} className="text-white" />
          </div>
        )}
      </div>
      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{stage.label}</span>
      <span
        className="text-[8px] font-mono px-1 rounded"
        style={{ color: cfg.color, background: cfg.bg }}
      >
        {cfg.label}
      </span>
    </motion.div>
  );
}

// ─── Test Run Row ─────────────────────────────────────────────────────────────

function TestRunRow({ run, index }: { run: TestRun; index: number }) {
  const statusConfig = {
    passed: { color: "#10b981", icon: CheckCircle, label: "PASSED" },
    failed: { color: "#ef4444", icon: AlertCircle, label: "FAILED" },
    running: { color: "#f59e0b", icon: Activity, label: "RUNNING" },
    queued: { color: "#6366f1", icon: Clock, label: "QUEUED" },
  };
  const cfg = statusConfig[run.status];
  const StatusIcon = cfg.icon;
  const passRate = run.tests > 0 ? ((run.passed / run.tests) * 100).toFixed(0) : "—";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="group"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
    >
      <td className="py-2.5 px-3">
        <span className="text-[10px] font-mono text-zinc-600">{run.id}</span>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-xs font-mono text-zinc-300 group-hover:text-emerald-400 transition-colors duration-200">
          {run.suite}
        </span>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <StatusIcon size={11} style={{ color: cfg.color }} />
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}
          >
            {cfg.label}
          </span>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-[10px] font-mono text-zinc-500">{run.tests > 0 ? run.tests : "—"}</span>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-[10px] font-mono" style={{ color: "#10b981" }}>
          {run.passed > 0 ? run.passed : "—"}
        </span>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-[10px] font-mono" style={{ color: run.failed > 0 ? "#ef4444" : "#52525b" }}>
          {run.tests > 0 ? run.failed : "—"}
        </span>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: run.tests > 0 ? `${passRate}%` : "0%",
                background: run.failed > 0 ? "#ef4444" : "#10b981",
              }}
            />
          </div>
          <span className="text-[9px] font-mono text-zinc-500">{run.tests > 0 ? `${passRate}%` : "—"}</span>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-[10px] font-mono text-zinc-600">{run.duration}</span>
      </td>
      <td className="py-2.5 px-3">
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{ color: "#06b6d4", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}
        >
          {run.env}
        </span>
      </td>
    </motion.tr>
  );
}

// ─── Telemetry Panel ──────────────────────────────────────────────────────────

function TelemetryPanel({
  label,
  value,
  unit,
  color,
  points,
  subLabel,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  points: SparkPoint[];
  subLabel: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        background: "rgba(9,9,11,0.6)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 4px 24px -8px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="text-[9px] font-mono text-zinc-600">{subLabel}</span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-xl font-mono font-bold tabular-nums" style={{ color }}>
            {value.toLocaleString("en-US")}
          </span>
          <span className="text-xs font-mono text-zinc-500 ml-1">{unit}</span>
        </div>
        <Sparkline points={points} color={color} width={100} height={36} />
      </div>
    </div>
  );
}

// ─── Health Ring ──────────────────────────────────────────────────────────────

function HealthRing({ value, color }: { value: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
      <motion.circle
        cx={45}
        cy={45}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform="rotate(-90 45 45)"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
      <text x={45} y={49} textAnchor="middle" fill={color} fontSize={14} fontFamily="monospace" fontWeight="bold">
        {value.toFixed(0)}%
      </text>
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MissionControlPage() {
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(INITIAL_TERMINAL_LINES);
  const [systemHealth, setSystemHealth] = useState(98.4);
  const [p99Latency, setP99Latency] = useState(142);
  const [passedCount, setPassedCount] = useState(4821);
  const [failedCount, setFailedCount] = useState(137);
  const [throughputRPS, setThroughputRPS] = useState(1847);
  const [flakiness, setFlakiness] = useState(2.3);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "passed" | "failed" | "running">("all");

  // Sparkline histories
  const [healthPoints, setHealthPoints] = useState<SparkPoint[]>(() =>
    generateSparkPoints(20, 98, 3)
  );
  const [latencyPoints, setLatencyPoints] = useState<SparkPoint[]>(() =>
    generateSparkPoints(20, 55, 15)
  );
  const [rpsPoints, setRpsPoints] = useState<SparkPoint[]>(() =>
    generateSparkPoints(20, 60, 20)
  );
  const [flakinessPoints, setFlakinessPoints] = useState<SparkPoint[]>(() =>
    generateSparkPoints(20, 20, 10)
  );

  const extraLinesRef = useRef(0);

  // Live telemetry simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth((v) => Math.min(100, Math.max(70, v + (Math.random() - 0.48) * 0.8)));
      setP99Latency((v) => Math.max(80, Math.min(400, v + (Math.random() - 0.5) * 12)));
      setPassedCount((v) => v + Math.floor(Math.random() * 4));
      setFailedCount((v) => (Math.random() > 0.85 ? v + 1 : v));
      setThroughputRPS((v) => Math.max(1200, Math.min(2400, v + (Math.random() - 0.5) * 80)));
      setFlakiness((v) => Math.max(0.5, Math.min(8, v + (Math.random() - 0.5) * 0.3)));

      setHealthPoints((pts) => {
        const next = [...pts.slice(-19), { value: Math.min(100, Math.max(70, (pts[pts.length - 1]?.value ?? 98) + (Math.random() - 0.48) * 2)) }];
        return next;
      });
      setLatencyPoints((pts) => {
        const last = pts[pts.length - 1]?.value ?? 55;
        return [...pts.slice(-19), { value: Math.max(10, Math.min(100, last + (Math.random() - 0.5) * 10)) }];
      });
      setRpsPoints((pts) => {
        const last = pts[pts.length - 1]?.value ?? 60;
        return [...pts.slice(-19), { value: Math.max(20, Math.min(100, last + (Math.random() - 0.5) * 15)) }];
      });
      setFlakinessPoints((pts) => {
        const last = pts[pts.length - 1]?.value ?? 20;
        return [...pts.slice(-19), { value: Math.max(5, Math.min(60, last + (Math.random() - 0.5) * 8)) }];
      });

      // Stream terminal lines
      const idx = extraLinesRef.current % EXTRA_TERMINAL_LINES.length;
      const newLine = EXTRA_TERMINAL_LINES[idx];
      if (newLine) {
        setTerminalLines((prev) => {
          const updated = [...prev, { ...newLine, id: Date.now() }];
          return updated.slice(-30);
        });
      }
      extraLinesRef.current += 1;
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  const healthColor = systemHealth > 85 ? "#10b981" : systemHealth > 65 ? "#f59e0b" : "#ef4444";

  const filteredRuns = MOCK_RUNS.filter((r) => {
    const matchesSearch =
      searchQuery === "" ||
      r.suite.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || r.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const filterTabs: { key: typeof activeFilter; label: string }[] = [
    { key: "all", label: "All Runs" },
    { key: "passed", label: "Passed" },
    { key: "failed", label: "Failed" },
    { key: "running", label: "Running" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      {/* Page header */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <motion.div variants={fadeIn} className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
            Mission Control — Live
          </span>
          <div
            className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded"
            style={{ color: "#06b6d4", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            {brand.version}
          </div>
        </motion.div>
        <motion.h1
          variants={fadeInUp}
          className="text-3xl md:text-4xl font-mono font-bold tracking-tight text-zinc-100"
          style={{ textShadow: "0 0 40px rgba(16,185,129,0.2)" }}
        >
          Quality Engineering
          <span className="text-emerald-400"> Command Center</span>
        </motion.h1>
        <motion.p variants={fadeInUp} className="mt-2 text-sm font-mono text-zinc-500 max-w-xl">
          Real-time telemetry across all test environments. Monitoring {(passedCount + failedCount).toLocaleString("en-US")} test executions with {systemHealth.toFixed(1)}% system health.
        </motion.p>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        <StatCard
          label="System Health"
          value={systemHealth.toFixed(1)}
          unit="%"
          color={healthColor}
          sparkPoints={healthPoints}
          delta="+0.2%"
          icon={Activity}
        />
        <StatCard
          label="P99 Latency"
          value={p99Latency.toFixed(0)}
          unit="ms"
          color={p99Latency > 250 ? "#ef4444" : p99Latency > 180 ? "#f59e0b" : "#06b6d4"}
          sparkPoints={latencyPoints}
          delta={p99Latency > 200 ? "↑ HIGH" : "↓ LOW"}
          icon={Zap}
        />
        <StatCard
          label="Tests Passed"
          value={passedCount.toLocaleString("en-US")}
          unit="total"
          color="#10b981"
          sparkPoints={rpsPoints}
          delta="+12 /min"
          icon={CheckCircle}
        />
        <StatCard
          label="Throughput"
          value={Math.round(throughputRPS).toLocaleString("en-US")}
          unit="RPS"
          color="#a78bfa"
          sparkPoints={rpsPoints}
          delta="Poisson"
          icon={Sparkles}
        />
      </motion.div>

      {/* ── Pipeline + Health Ring ── */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6"
      >
        {/* Pipeline stages */}
        <div
          className="lg:col-span-2 rounded-xl p-5"
          style={{
            background: "rgba(9,9,11,0.7)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest">
                CI Pipeline — run-4819
              </h2>
              <p className="text-[10px] font-mono text-zinc-600 mt-0.5">API Contract Tests — production env</p>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="w-2 h-2 rounded-full bg-amber-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[9px] font-mono text-amber-400">IN PROGRESS</span>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {pipelineStages.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-2 shrink-0">
                <PipelineStageChip
                  stage={stage}
                  status={PIPELINE_STATUS[stage.id] ?? "idle"}
                  index={i}
                />
                {i < pipelineStages.length - 1 && (
                  <div
                    className="w-6 h-px"
                    style={{
                      background:
                        PIPELINE_STATUS[stage.id] === "passed"
                          ? "rgba(16,185,129,0.4)"
                          : "rgba(255,255,255,0.08)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-[9px] font-mono text-zinc-600">Overall Progress</span>
              <span className="text-[9px] font-mono text-zinc-500">2 / 6 stages complete</span>
            </div>
            <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #10b981, #06b6d4)" }}
                initial={{ width: "0%" }}
                animate={{ width: "33%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Health ring */}
        <div
          className="rounded-xl p-5 flex flex-col items-center justify-center gap-4"
          style={{
            background: "rgba(9,9,11,0.7)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)",
          }}
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">System Health</span>
          <HealthRing value={systemHealth} color={healthColor} />
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="text-center">
              <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                {passedCount.toLocaleString("en-US")}
              </div>
              <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-mono font-bold text-red-400 tabular-nums">
                {failedCount.toLocaleString("en-US")}
              </div>
              <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">Failed</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Telemetry Grid ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        {[
          {
            label: "Throughput RPS",
            value: Math.round(throughputRPS),
            unit: "req/s",
            color: "#06b6d4",
            points: rpsPoints,
            subLabel: "Poisson dist.",
          },
          {
            label: "P99 Latency",
            value: Math.round(p99Latency),
            unit: "ms",
            color: p99Latency > 200 ? "#f59e0b" : "#10b981",
            points: latencyPoints,
            subLabel: "tail latency",
          },
          {
            label: "Flakiness Index",
            value: parseFloat(flakiness.toFixed(1)),
            unit: "%",
            color: flakiness > 5 ? "#ef4444" : "#a78bfa",
            points: flakinessPoints,
            subLabel: "variance model",
          },
          {
            label: "Mutation Score",
            value: 87,
            unit: "%",
            color: "#f59e0b",
            points: healthPoints,
            subLabel: "Stryker v7",
          },
        ].map((panel) => (
          <motion.div key={panel.label} variants={scaleIn}>
            <TelemetryPanel {...panel} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Live Terminal ── */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={13} className="text-emerald-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Live Playwright Output
          </span>
        </div>
        <LiveTerminal lines={terminalLines} />
      </motion.div>

      {/* ── Test Runs Table ── */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="mb-6"
      >
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(9,9,11,0.7)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)",
          }}
        >
          {/* Table header */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div>
              <h2 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-widest">
                Recent Test Runs
              </h2>
              <p className="text-[10px] font-mono text-zinc-600 mt-0.5">
                {filteredRuns.length} of {MOCK_RUNS.length} runs shown
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Search size={11} className="text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search suites..."
                  className="bg-transparent text-[11px] font-mono text-zinc-300 placeholder-zinc-600 outline-none w-28"
                />
              </div>
              {/* Filter tabs */}
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className="text-[9px] font-mono px-2 py-1 rounded transition-all duration-200"
                  style={{
                    color: activeFilter === tab.key ? "#10b981" : "#52525b",
                    background: activeFilter === tab.key ? "rgba(16,185,129,0.1)" : "transparent",
                    border: `1px solid ${activeFilter === tab.key ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {["Run ID", "Suite", "Status", "Tests", "Pass", "Fail", "Rate", "Duration", "Env"].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left py-2 px-3 text-[9px] font-mono uppercase tracking-widest text-zinc-600"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run, i) => (
                  <TestRunRow key={run.id} run={run} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ── Tech Stack ── */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Settings size={13} className="text-zinc-500" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Active Tech Stack
          </span>
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap gap-2"
        >
          {techStack.map((tech, i) => (
            <motion.span
              key={tech}
              variants={scaleIn}
              whileHover={{ scale: 1.06, y: -2 }}
              className="text-[10px] font-mono px-3 py-1.5 rounded-lg cursor-default transition-all duration-200"
              style={{
                color: "#06b6d4",
                background: "rgba(6,182,212,0.06)",
                border: "1px solid rgba(6,182,212,0.15)",
                boxShadow: "0 2px 8px -2px rgba(6,182,212,0.1)",
              }}
            >
              {tech}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Alert Banner ── */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-20px" }}
      >
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.2)",
            boxShadow: "0 4px 24px -8px rgba(239,68,68,0.15)",
          }}
        >
          <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-mono font-bold text-red-400">Flaky Test Detected</p>
            <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
              checkout/cart.spec.ts:88 failed 3 consecutive retries across webkit. Discount code validation
              returning INVALID_CODE. Assigned to QE-Team-Alpha for triage. Trace ID: 4f2a1b.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <Eye size={11} className="text-zinc-600" />
            <span className="text-[9px] font-mono text-zinc-600">09:41:19</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}