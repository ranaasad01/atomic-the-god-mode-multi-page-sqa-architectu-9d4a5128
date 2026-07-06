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
    name: "auth.spec.ts",
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
    name: "checkout.spec.ts",
    browser: "firefox",
    status: "running",
    duration: 9870,
    tests: 62,
    passed: 54,
    failed: 2,
    flaky: 3,
    worker: 2,
    retries: 2,
    tags: ["e2e", "payments"],
  },
  {
    id: "s3",
    name: "dashboard.spec.ts",
    browser: "webkit",
    status: "failed",
    duration: 22100,
    tests: 35,
    passed: 31,
    failed: 4,
    flaky: 0,
    worker: 3,
    retries: 0,
    tags: ["ui", "regression"],
  },
  {
    id: "s4",
    name: "api-gateway.spec.ts",
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
    name: "search.spec.ts",
    browser: "firefox",
    status: "queued",
    duration: 0,
    tests: 29,
    passed: 0,
    failed: 0,
    flaky: 0,
    worker: 5,
    retries: 0,
    tags: ["search", "perf"],
  },
  {
    id: "s6",
    name: "notifications.spec.ts",
    browser: "chromium",
    status: "running",
    duration: 4210,
    tests: 18,
    passed: 15,
    failed: 0,
    flaky: 1,
    worker: 6,
    retries: 1,
    tags: ["realtime", "ws"],
  },
  {
    id: "s7",
    name: "billing.spec.ts",
    browser: "webkit",
    status: "passed",
    duration: 18900,
    tests: 55,
    passed: 55,
    failed: 0,
    flaky: 0,
    worker: 7,
    retries: 0,
    tags: ["billing", "critical"],
  },
  {
    id: "s8",
    name: "onboarding.spec.ts",
    browser: "chromium",
    status: "skipped",
    duration: 0,
    tests: 22,
    passed: 0,
    failed: 0,
    flaky: 0,
    worker: 8,
    retries: 0,
    tags: ["onboarding"],
  },
];

const WORKERS: WorkerNode[] = [
  { id: 1, status: "active", currentSuite: "auth.spec.ts", cpu: 72, memory: 58, testsRun: 1204 },
  { id: 2, status: "active", currentSuite: "checkout.spec.ts", cpu: 88, memory: 71, testsRun: 987 },
  { id: 3, status: "error", currentSuite: "dashboard.spec.ts", cpu: 45, memory: 62, testsRun: 743 },
  { id: 4, status: "idle", currentSuite: "—", cpu: 12, memory: 34, testsRun: 1891 },
  { id: 5, status: "active", currentSuite: "search.spec.ts", cpu: 65, memory: 49, testsRun: 612 },
  { id: 6, status: "active", currentSuite: "notifications.spec.ts", cpu: 54, memory: 43, testsRun: 445 },
  { id: 7, status: "idle", currentSuite: "—", cpu: 8, memory: 28, testsRun: 2103 },
  { id: 8, status: "active", currentSuite: "billing.spec.ts", cpu: 79, memory: 66, testsRun: 334 },
];

const INITIAL_LOGS: TestStep[] = [
  { id: "l1", timestamp: "14:22:01.003", level: "info", message: "▶  Running 8 suites across 8 workers (Playwright v1.44.0)" },
  { id: "l2", timestamp: "14:22:01.112", level: "info", message: "  [worker:1] Launching chromium — auth.spec.ts" },
  { id: "l3", timestamp: "14:22:01.234", level: "info", message: "  [worker:2] Launching firefox — checkout.spec.ts" },
  { id: "l4", timestamp: "14:22:02.441", level: "pass", message: "  ✓ [worker:1] should login with valid credentials (342ms)" },
  { id: "l5", timestamp: "14:22:02.889", level: "pass", message: "  ✓ [worker:1] should redirect to dashboard after login (128ms)" },
  { id: "l6", timestamp: "14:22:03.102", level: "warn", message: "  ⚠ [worker:2] Retry 1/2 — checkout: payment_intent timeout (5000ms)" },
  { id: "l7", timestamp: "14:22:03.890", level: "pass", message: "  ✓ [worker:2] checkout: payment_intent resolved on retry (1204ms)" },
  { id: "l8", timestamp: "14:22:04.001", level: "fail", message: "  ✗ [worker:3] dashboard: widget render mismatch — expected 6 charts, got 5" },
  { id: "l9", timestamp: "14:22:04.220", level: "debug", message: "    console.assert: document.querySelectorAll('.chart-widget').length === 6" },
  { id: "l10", timestamp: "14:22:04.780", level: "pass", message: "  ✓ [worker:4] GET /api/v2/users 200 OK (44ms)" },
  { id: "l11", timestamp: "14:22:05.001", level: "pass", message: "  ✓ [worker:4] POST /api/v2/orders 201 Created (89ms)" },
  { id: "l12", timestamp: "14:22:05.340", level: "info", message: "  [worker:5] Queued — waiting for available slot" },
];

const LOG_POOL: Omit<TestStep, "id" | "timestamp">[] = [
  { level: "pass", message: "  ✓ [worker:1] should enforce MFA on suspicious login (891ms)" },
  { level: "pass", message: "  ✓ [worker:2] cart: add item persists across page reload (234ms)" },
  { level: "fail", message: "  ✗ [worker:3] sidebar: active state not applied on /reports route" },
  { level: "debug", message: "    Snapshot diff: 2px offset in nav highlight — threshold exceeded" },
  { level: "pass", message: "  ✓ [worker:4] DELETE /api/v2/sessions 204 No Content (31ms)" },
  { level: "warn", message: "  ⚠ [worker:6] WebSocket reconnect attempt 1/3 (1000ms backoff)" },
  { level: "pass", message: "  ✓ [worker:6] notification delivered within SLA 800ms (actual: 612ms)" },
  { level: "pass", message: "  ✓ [worker:7] invoice PDF generated correctly (1102ms)" },
  { level: "info", message: "  [worker:8] Suite complete — 55/55 passed, 0 failed" },
  { level: "pass", message: "  ✓ [worker:1] session token rotated after privilege escalation (445ms)" },
  { level: "debug", message: "    Browser console: [chromium] No errors in 48 assertions" },
  { level: "pass", message: "  ✓ [worker:2] promo code SAVE20 applies 20% discount (178ms)" },
  { level: "fail", message: "  ✗ [worker:3] chart tooltip z-index overlaps modal overlay" },
  { level: "pass", message: "  ✓ [worker:4] rate limit 429 returned after 100 req/min (22ms)" },
  { level: "info", message: "  [worker:5] Launching firefox — search.spec.ts" },
  { level: "pass", message: "  ✓ [worker:5] search returns results within 200ms p95 (actual: 143ms)" },
];

function generateSparkline(length: number, base: number, variance: number): SparkPoint[] {
  const points: SparkPoint[] = [];
  let current = base;
  for (let i = 0; i < length; i++) {
    current = Math.max(0, Math.min(100, current + (Math.random() - 0.5) * variance * 2));
    points.push({ value: current });
  }
  return points;
}

const INITIAL_THROUGHPUT = generateSparkline(40, 72, 12);
const INITIAL_PASS_RATE = generateSparkline(40, 95, 4);
const INITIAL_FLAKINESS = generateSparkline(40, 8, 5);

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusColor(status: TestSuite["status"]): string {
  switch (status) {
    case "passed": return "#10b981";
    case "failed": return "#ef4444";
    case "running": return "#06b6d4";
    case "queued": return "#f59e0b";
    case "skipped": return "#71717a";
    default: return "#71717a";
  }
}

function workerStatusColor(status: WorkerNode["status"]): string {
  switch (status) {
    case "active": return "#10b981";
    case "idle": return "#f59e0b";
    case "error": return "#ef4444";
    default: return "#71717a";
  }
}

function logLevelColor(level: TestStep["level"]): string {
  switch (level) {
    case "pass": return "#10b981";
    case "fail": return "#ef4444";
    case "warn": return "#f59e0b";
    case "debug": return "#8b5cf6";
    case "info": return "#06b6d4";
    default: return "#71717a";
  }
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  width = 120,
  height = 36,
}: {
  data: SparkPoint[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const areaPath = `M ${pts[0]} ${pts.slice(1).map((p) => `L ${p}`).join(" ")} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={parseFloat(pts[pts.length - 1]?.split(",")[0] ?? "0")}
        cy={parseFloat(pts[pts.length - 1]?.split(",")[1] ?? "0")}
        r="2.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

// ─── Worker Grid ──────────────────────────────────────────────────────────────

const workerCardVariant: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" },
  }),
};

function WorkerGrid({ workers }: { workers: WorkerNode[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(workers ?? []).map((w, i) => {
        const sc = workerStatusColor(w.status);
        return (
          <motion.div
            key={w.id}
            custom={i}
            variants={workerCardVariant}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className="relative rounded-xl p-3 border"
            style={{
              background: "rgba(9,9,11,0.7)",
              borderColor: `${sc}22`,
              boxShadow: `0 0 12px ${sc}11`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                W{w.id}
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: sc, boxShadow: `0 0 6px ${sc}` }}
              />
            </div>
            <div className="text-[9px] font-mono text-zinc-600 truncate mb-2">
              {w.currentSuite}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-zinc-600 w-8">CPU</span>
                <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${w.cpu}%`,
                      background: w.cpu > 80 ? "#ef4444" : w.cpu > 60 ? "#f59e0b" : "#10b981",
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 w-7 text-right">{w.cpu}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-zinc-600 w-8">MEM</span>
                <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${w.memory}%`,
                      background: "#06b6d4",
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 w-7 text-right">{w.memory}%</span>
              </div>
            </div>
            <div className="mt-2 text-[9px] font-mono text-zinc-600">
              {(w.testsRun ?? 0).toLocaleString("en-US")} tests run
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Telemetry Panel ──────────────────────────────────────────────────────────

function TelemetryPanel() {
  const [throughput, setThroughput] = useState<SparkPoint[]>(INITIAL_THROUGHPUT);
  const [passRate, setPassRate] = useState<SparkPoint[]>(INITIAL_PASS_RATE);
  const [flakiness, setFlakiness] = useState<SparkPoint[]>(INITIAL_FLAKINESS);
  const [tpVal, setTpVal] = useState(72);
  const [prVal, setPrVal] = useState(95);
  const [flVal, setFlVal] = useState(8);

  useEffect(() => {
    const id = setInterval(() => {
      setThroughput((prev) => {
        const next = [...prev.slice(1), { value: Math.max(0, Math.min(100, (prev[prev.length - 1]?.value ?? 72) + (Math.random() - 0.5) * 14)) }];
        setTpVal(Math.round(next[next.length - 1]?.value ?? 72));
        return next;
      });
      setPassRate((prev) => {
        const next = [...prev.slice(1), { value: Math.max(80, Math.min(100, (prev[prev.length - 1]?.value ?? 95) + (Math.random() - 0.5) * 3)) }];
        setPrVal(parseFloat((next[next.length - 1]?.value ?? 95).toFixed(1)));
        return next;
      });
      setFlakiness((prev) => {
        const next = [...prev.slice(1), { value: Math.max(0, Math.min(30, (prev[prev.length - 1]?.value ?? 8) + (Math.random() - 0.5) * 4)) }];
        setFlVal(parseFloat((next[next.length - 1]?.value ?? 8).toFixed(1)));
        return next;
      });
    }, 800);
    return () => clearInterval(id);
  }, []);

  const panels = [
    {
      label: "Throughput RPS",
      value: `${tpVal}%`,
      sublabel: "Poisson λ=1847",
      data: throughput,
      color: "#06b6d4",
      icon: <Zap size={12} />,
    },
    {
      label: "Pass Rate",
      value: `${prVal}%`,
      sublabel: "Rolling 5m window",
      data: passRate,
      color: "#10b981",
      icon: <Check size={12} />,
    },
    {
      label: "Flakiness Index",
      value: `${flVal}%`,
      sublabel: "Variance σ²=0.04",
      data: flakiness,
      color: "#f59e0b",
      icon: <Activity size={12} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {panels.map((p) => (
        <motion.div
          key={p.label}
          variants={scaleIn}
          className="rounded-xl border p-4"
          style={{
            background: "rgba(9,9,11,0.7)",
            borderColor: `${p.color}22`,
            boxShadow: `0 0 20px ${p.color}0a`,
          }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span style={{ color: p.color }}>{p.icon}</span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                {p.label}
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-600">{p.sublabel}</span>
          </div>
          <div className="flex items-end justify-between">
            <span
              className="text-2xl font-mono font-bold tabular-nums"
              style={{ color: p.color }}
            >
              {p.value}
            </span>
            <Sparkline data={p.data} color={p.color} width={100} height={32} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Advanced Terminal ────────────────────────────────────────────────────────

function AdvancedTerminal() {
  const [logs, setLogs] = useState<TestStep[]>(INITIAL_LOGS);
  const [running, setRunning] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(INITIAL_LOGS.length);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const pool = LOG_POOL;
      const entry = pool[Math.floor(Math.random() * pool.length)];
      if (!entry) return;
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
      counterRef.current += 1;
      setLogs((prev) => {
        const next = [
          ...prev,
          { ...entry, id: `l${counterRef.current}`, timestamp: ts },
        ];
        return next.slice(-80);
      });
    }, 600);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const filtered = (logs ?? []).filter(
    (l) => filter === "all" || l.level === filter
  );

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "rgba(5,5,8,0.95)",
        borderColor: "rgba(16,185,129,0.15)",
        boxShadow: "0 0 40px rgba(16,185,129,0.05)",
      }}
    >
      {/* Terminal header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "rgba(16,185,129,0.1)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <Terminal size={12} className="text-emerald-500 ml-2" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            playwright — parallel run — 8 workers
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(["all", "pass", "fail", "warn", "debug"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-[9px] font-mono px-2 py-0.5 rounded border transition-all duration-200"
              style={{
                borderColor: filter === f ? "#10b981" : "rgba(255,255,255,0.06)",
                color: filter === f ? "#10b981" : "#52525b",
                background: filter === f ? "rgba(16,185,129,0.1)" : "transparent",
              }}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => setRunning((r) => !r)}
            className="ml-2 p-1 rounded border transition-all duration-200 hover:border-emerald-500/40"
            style={{ borderColor: "rgba(255,255,255,0.06)", color: "#52525b" }}
          >
            {running ? <Pause size={10} /> : <Play size={10} />}
          </button>
          <button
            onClick={() => setLogs(INITIAL_LOGS)}
            className="p-1 rounded border transition-all duration-200 hover:border-emerald-500/40"
            style={{ borderColor: "rgba(255,255,255,0.06)", color: "#52525b" }}
          >
            <RotateCcw size={10} />
          </button>
        </div>
      </div>

      {/* Log output */}
      <div className="h-64 overflow-y-auto p-3 space-y-0.5 font-mono text-[11px] leading-relaxed">
        {(filtered ?? []).map((log) => (
          <div key={log.id} className="flex gap-2 items-start">
            <span className="text-zinc-700 shrink-0 tabular-nums">{log.timestamp}</span>
            <span
              className="shrink-0 w-10 text-right"
              style={{ color: logLevelColor(log.level) }}
            >
              [{log.level}]
            </span>
            <span
              style={{
                color:
                  log.level === "fail"
                    ? "#fca5a5"
                    : log.level === "pass"
                    ? "#6ee7b7"
                    : log.level === "warn"
                    ? "#fcd34d"
                    : log.level === "debug"
                    ? "#c4b5fd"
                    : "#a1a1aa",
              }}
            >
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 border-t"
        style={{ borderColor: "rgba(16,185,129,0.08)" }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: running ? "#10b981" : "#f59e0b",
              boxShadow: running ? "0 0 6px #10b981" : "0 0 6px #f59e0b",
            }}
          />
          <span className="text-[9px] font-mono text-zinc-600">
            {running ? "STREAMING" : "PAUSED"}
          </span>
        </div>
        <span className="text-[9px] font-mono text-zinc-700">
          {filtered.length} entries
        </span>
      </div>
    </div>
  );
}

// ─── Suite Table ──────────────────────────────────────────────────────────────

function SuiteTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"name" | "duration" | "tests">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = (SUITES ?? [])
    .filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "duration") cmp = a.duration - b.duration;
      else if (sortKey === "tests") cmp = a.tests - b.tests;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const SortIcon = ({ k }: { k: typeof sortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? (
        <ArrowUp size={10} className="inline ml-1" />
      ) : (
        <ArrowDown size={10} className="inline ml-1" />
      )
    ) : null;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "rgba(9,9,11,0.7)",
        borderColor: "rgba(16,185,129,0.1)",
      }}
    >
      {/* Controls */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: "rgba(16,185,129,0.08)" }}
      >
        <div className="flex items-center gap-2 flex-1">
          <Search size={12} className="text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter suites..."
            className="bg-transparent text-xs font-mono text-zinc-300 placeholder-zinc-700 outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={10} className="text-zinc-600" />
          {(["all", "passed", "failed", "running", "queued", "skipped"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-[9px] font-mono px-2 py-0.5 rounded border transition-all duration-200"
              style={{
                borderColor: statusFilter === s ? statusColor(s as TestSuite["status"]) : "rgba(255,255,255,0.06)",
                color: statusFilter === s ? statusColor(s as TestSuite["status"]) : "#52525b",
                background: statusFilter === s ? `${statusColor(s as TestSuite["status"])}18` : "transparent",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {[
                { key: "name", label: "Suite" },
                { key: null, label: "Browser" },
                { key: null, label: "Status" },
                { key: "tests", label: "Tests" },
                { key: null, label: "Pass/Fail" },
                { key: "duration", label: "Duration" },
                { key: null, label: "Flaky" },
                { key: null, label: "Tags" },
              ].map((col) => (
                <th
                  key={col.label}
                  className="text-left px-4 py-2.5 text-[9px] uppercase tracking-widest text-zinc-600"
                  onClick={() => col.key && handleSort(col.key as typeof sortKey)}
                  style={{ cursor: col.key ? "pointer" : "default" }}
                >
                  {col.label}
                  {col.key && <SortIcon k={col.key as typeof sortKey} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(filtered ?? []).map((suite, i) => {
              const sc = statusColor(suite.status);
              return (
                <motion.tr
                  key={suite.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="border-b transition-colors duration-150 hover:bg-white/[0.02]"
                  style={{ borderColor: "rgba(255,255,255,0.03)" }}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileCode size={11} className="text-zinc-600 shrink-0" />
                      <span className="text-zinc-300">{suite.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-zinc-500">{suite.browser}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] border"
                      style={{
                        color: sc,
                        borderColor: `${sc}33`,
                        background: `${sc}11`,
                      }}
                    >
                      {suite.status === "running" && (
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ backgroundColor: sc }}
                        />
                      )}
                      {suite.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400 tabular-nums">{suite.tests}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 tabular-nums">{suite.passed}</span>
                      <span className="text-zinc-700">/</span>
                      <span className="text-red-400 tabular-nums">{suite.failed}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500 tabular-nums">
                    {formatDuration(suite.duration)}
                  </td>
                  <td className="px-4 py-2.5">
                    {suite.flaky > 0 ? (
                      <span className="text-amber-400 tabular-nums">{suite.flaky}</span>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {(suite.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="text-[8px] px-1.5 py-0.5 rounded border text-zinc-600"
                          style={{ borderColor: "rgba(255,255,255,0.06)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span className="text-[9px] font-mono text-zinc-700">
          {filtered.length} of {SUITES.length} suites
        </span>
        <span className="text-[9px] font-mono text-zinc-700">
          {SUITES.reduce((a, s) => a + s.tests, 0)} total tests
        </span>
      </div>
    </div>
  );
}

// ─── Coverage Heatmap ─────────────────────────────────────────────────────────

const COVERAGE_MODULES = [
  { name: "auth", coverage: 97, lines: 1204, branches: 89 },
  { name: "checkout", coverage: 91, lines: 2341, branches: 78 },
  { name: "dashboard", coverage: 84, lines: 1876, branches: 71 },
  { name: "api-gateway", coverage: 99, lines: 3102, branches: 96 },
  { name: "search", coverage: 88, lines: 987, branches: 82 },
  { name: "notifications", coverage: 76, lines: 654, branches: 64 },
  { name: "billing", coverage: 95, lines: 1543, branches: 91 },
  { name: "onboarding", coverage: 72, lines: 432, branches: 58 },
  { name: "settings", coverage: 81, lines: 765, branches: 74 },
  { name: "analytics", coverage: 93, lines: 1123, branches: 87 },
  { name: "reports", coverage: 68, lines: 543, branches: 55 },
  { name: "admin", coverage: 89, lines: 2109, branches: 83 },
];

function coverageColor(pct: number): string {
  if (pct >= 90) return "#10b981";
  if (pct >= 80) return "#06b6d4";
  if (pct >= 70) return "#f59e0b";
  return "#ef4444";
}

function CoverageHeatmap() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: "rgba(9,9,11,0.7)",
        borderColor: "rgba(16,185,129,0.1)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye size={13} className="text-emerald-500" />
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
            Coverage Heatmap
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-600">
          {[
            { label: "≥90%", color: "#10b981" },
            { label: "≥80%", color: "#06b6d4" },
            { label: "≥70%", color: "#f59e0b" },
            { label: "<70%", color: "#ef4444" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {(COVERAGE_MODULES ?? []).map((mod, i) => {
          const c = coverageColor(mod.coverage);
          const isHov = hovered === mod.name;
          return (
            <motion.div
              key={mod.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onMouseEnter={() => setHovered(mod.name)}
              onMouseLeave={() => setHovered(null)}
              className="relative rounded-lg p-2.5 cursor-default transition-all duration-200"
              style={{
                background: isHov ? `${c}22` : `${c}0d`,
                border: `1px solid ${isHov ? c : `${c}33`}`,
                boxShadow: isHov ? `0 0 16px ${c}22` : "none",
              }}
            >
              <div
                className="text-[10px] font-mono font-bold tabular-nums mb-1"
                style={{ color: c }}
              >
                {mod.coverage}%
              </div>
              <div className="text-[9px] font-mono text-zinc-600 truncate">{mod.name}</div>
              {isHov && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full left-0 mb-1 z-20 rounded-lg border p-2 text-[9px] font-mono whitespace-nowrap"
                  style={{
                    background: "rgba(9,9,11,0.95)",
                    borderColor: `${c}44`,
                    color: "#a1a1aa",
                  }}
                >
                  <div style={{ color: c }}>{mod.name}</div>
                  <div>Lines: {(mod.lines ?? 0).toLocaleString("en-US")}</div>
                  <div>Branches: {mod.branches}%</div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    label: "Total Tests",
    value: "8,319",
    delta: "+124",
    deltaDir: "up",
    color: "#06b6d4",
    icon: <Circle size={14} />,
    sub: "across 8 suites",
  },
  {
    label: "Pass Rate",
    value: "97.2%",
    delta: "+0.4%",
    deltaDir: "up",
    color: "#10b981",
    icon: <Check size={14} />,
    sub: "last 24h rolling",
  },
  {
    label: "Avg Duration",
    value: "14.3s",
    delta: "-1.2s",
    deltaDir: "up",
    color: "#10b981",
    icon: <Clock size={14} />,
    sub: "per suite median",
  },
  {
    label: "Flaky Tests",
    value: "7",
    delta: "-3",
    deltaDir: "up",
    color: "#f59e0b",
    icon: <AlertCircle size={14} />,
    sub: "quarantine eligible",
  },
  {
    label: "Active Workers",
    value: "6 / 8",
    delta: "stable",
    deltaDir: "neutral",
    color: "#06b6d4",
    icon: <Zap size={14} />,
    sub: "2 idle, 0 error",
  },
  {
    label: "Retries",
    value: "6",
    delta: "+2",
    deltaDir: "down",
    color: "#ef4444",
    icon: <RotateCcw size={14} />,
    sub: "this run",
  },
];

function StatCards() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
    >
      {(STAT_CARDS ?? []).map((card) => (
        <motion.div
          key={card.label}
          variants={scaleIn}
          whileHover={{ scale: 1.04, transition: { duration: 0.2 } }}
          className="rounded-xl border p-3"
          style={{
            background: "rgba(9,9,11,0.7)",
            borderColor: `${card.color}22`,
            boxShadow: `0 0 16px ${card.color}08`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: card.color }}>{card.icon}</span>
            <span
              className="text-[9px] font-mono flex items-center gap-0.5"
              style={{
                color:
                  card.deltaDir === "up"
                    ? "#10b981"
                    : card.deltaDir === "down"
                    ? "#ef4444"
                    : "#71717a",
              }}
            >
              {card.deltaDir === "up" && <ArrowUp size={8} />}
              {card.deltaDir === "down" && <ArrowDown size={8} />}
              {card.delta}
            </span>
          </div>
          <div
            className="text-xl font-mono font-bold tabular-nums mb-0.5"
            style={{ color: card.color }}
          >
            {card.value}
          </div>
          <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            {card.label}
          </div>
          <div className="text-[8px] font-mono text-zinc-700 mt-0.5">{card.sub}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Playwright Config Panel ──────────────────────────────────────────────────

const CONFIG_SNIPPET = `// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 8 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["allure-playwright"],
    ["json", { outputFile: "results.json" }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox",  use: { ...devices["Desktop Firefox"] } },
    { name: "webkit",   use: { ...devices["Desktop Safari"] } },
    { name: "mobile",   use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});`;

function ConfigPanel() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "rgba(5,5,8,0.95)",
        borderColor: "rgba(16,185,129,0.12)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "rgba(16,185,129,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <FileCode size={12} className="text-emerald-500" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            playwright.config.ts
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-[9px] font-mono px-2 py-0.5 rounded border transition-all duration-200"
          style={{
            borderColor: copied ? "#10b981" : "rgba(255,255,255,0.08)",
            color: copied ? "#10b981" : "#52525b",
            background: copied ? "rgba(16,185,129,0.1)" : "transparent",
          }}
        >
          {copied ? "copied!" : "copy"}
        </button>
      </div>
      <pre className="p-4 text-[10px] font-mono text-zinc-400 overflow-x-auto leading-relaxed">
        <code>{CONFIG_SNIPPET}</code>
      </pre>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen md:pl-64 pt-16 md:pt-0">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-widest"
                style={{
                  color: "#06b6d4",
                  borderColor: "rgba(6,182,212,0.3)",
                  background: "rgba(6,182,212,0.08)",
                }}
              >
                HIGH THROUGHPUT
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "#10b981", boxShadow: "0 0 6px #10b981" }}
              />
              <span className="text-[9px] font-mono text-emerald-500">LIVE RUN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-zinc-100 tracking-tight">
              Automation Suite
            </h1>
            <p className="text-sm font-mono text-zinc-500 mt-1">
              Playwright parallel execution across 8 workers — chromium, firefox, webkit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono transition-all duration-200"
              style={{
                borderColor: "rgba(16,185,129,0.3)",
                color: "#10b981",
                background: "rgba(16,185,129,0.08)",
              }}
            >
              <Play size={10} />
              Re-run All
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono transition-all duration-200"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                color: "#71717a",
                background: "transparent",
              }}
            >
              <Star size={10} />
              Save Report
            </motion.button>
          </div>
        </motion.div>

        {/* Stat cards */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <StatCards />
        </motion.section>

        {/* Telemetry */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={13} className="text-emerald-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Live Telemetry
            </span>
          </div>
          <TelemetryPanel />
        </motion.section>

        {/* Worker grid */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={13} className="text-cyan-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Worker Nodes
            </span>
            <span className="text-[9px] font-mono text-zinc-700 ml-auto">
              8 nodes — 6 active
            </span>
          </div>
          <WorkerGrid workers={WORKERS} />
        </motion.section>

        {/* Terminal */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={13} className="text-emerald-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Live Output Stream
            </span>
          </div>
          <AdvancedTerminal />
        </motion.section>

        {/* Suite table */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={13} className="text-cyan-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Test Suites
            </span>
          </div>
          <SuiteTable />
        </motion.section>

        {/* Coverage + Config — two-column */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <motion.div variants={fadeInUp}>
            <CoverageHeatmap />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-2 mb-4">
              <FileCode size={13} className="text-emerald-500" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Configuration
              </span>
            </div>
            <ConfigPanel />
          </motion.div>
        </motion.section>

        {/* Bottom CTA strip */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <div
            className="rounded-xl border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(6,182,212,0.04) 100%)",
              borderColor: "rgba(16,185,129,0.15)",
            }}
          >
            <div>
              <div className="text-sm font-mono font-bold text-zinc-200 mb-1">
                Allure Report — Run #4821
              </div>
              <div className="text-xs font-mono text-zinc-500">
                Full HTML report with traces, screenshots, and video artifacts available
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.a
                href="#"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono transition-all duration-200"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#10b981",
                }}
              >
                View Report
                <ChevronRight size={12} />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono transition-all duration-200"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#71717a",
                }}
              >
                Download Artifacts
                <ChevronRight size={12} />
              </motion.a>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}