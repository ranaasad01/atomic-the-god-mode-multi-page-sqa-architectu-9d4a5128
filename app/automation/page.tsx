"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Activity, Terminal, CheckCircle, XCircle, Clock, Cpu, Layers, Play, Pause, RotateCcw, ChevronRight, AlertTriangle, Zap, GitBranch, Eye, Filter } from 'lucide-react';
import { fadeInUp, staggerContainer, scaleIn, fadeIn } from "@/lib/motion";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

// ─── Zustand store (inline minimal mirror to avoid import issues) ─────────────
import { create } from "zustand";

interface MetricsState {
  systemHealth: number;
  passedCount: number;
  failedCount: number;
  p99Latency: number;
  throughputRPS: number;
  activeTestRun: boolean;
  isFaultInjected: boolean;
}

const useLocalMetrics = create<MetricsState>(() => ({
  systemHealth: 97.4,
  passedCount: 2847,
  failedCount: 53,
  p99Latency: 142,
  throughputRPS: 1847,
  activeTestRun: true,
  isFaultInjected: false,
}));

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TEST_SUITES = [
  {
    id: "auth",
    name: "Authentication & OTP Suite",
    file: "auth.spec.ts",
    passed: 48,
    failed: 2,
    skipped: 1,
    duration: "4.2s",
    worker: "W1",
    status: "passed" as const,
  },
  {
    id: "dataset",
    name: "Dataset Upload & Cloud Import",
    file: "dataset.spec.ts",
    passed: 62,
    failed: 0,
    skipped: 3,
    duration: "8.7s",
    worker: "W2",
    status: "passed" as const,
  },
  {
    id: "api",
    name: "API Contract & Response Tests",
    file: "api.spec.ts",
    passed: 134,
    failed: 7,
    skipped: 0,
    duration: "12.1s",
    worker: "W3",
    status: "failed" as const,
  },
  {
    id: "payment",
    name: "Stripe Payment & KYC Flows",
    file: "payment.spec.ts",
    passed: 29,
    failed: 1,
    skipped: 0,
    duration: "22.4s",
    worker: "W4",
    status: "failed" as const,
  },
  {
    id: "desktop",
    name: "Desktop App Cross-Platform",
    file: "desktop.spec.ts",
    passed: 18,
    failed: 0,
    skipped: 2,
    duration: "31.8s",
    worker: "W1",
    status: "passed" as const,
  },
  {
    id: "chat",
    name: "Real-Time Chat Functionality",
    file: "chat.spec.ts",
    passed: 77,
    failed: 3,
    skipped: 0,
    duration: "6.3s",
    worker: "W2",
    status: "failed" as const,
  },
  {
    id: "mobile",
    name: "Mobile Web Viewport Suite",
    file: "mobile.spec.ts",
    passed: 41,
    failed: 0,
    skipped: 5,
    duration: "9.1s",
    worker: "W3",
    status: "passed" as const,
  },
  {
    id: "security",
    name: "Security & RBAC Smoke Tests",
    file: "security.spec.ts",
    passed: 22,
    failed: 0,
    skipped: 0,
    duration: "5.4s",
    worker: "W4",
    status: "passed" as const,
  },
];

const WORKERS = [
  { id: "W1", name: "Worker 1", utilization: 78, tests: 66, browser: "Chromium" },
  { id: "W2", name: "Worker 2", utilization: 91, tests: 139, browser: "Firefox" },
  { id: "W3", name: "Worker 3", utilization: 65, tests: 141, browser: "WebKit" },
  { id: "W4", name: "Worker 4", utilization: 84, tests: 30, browser: "Chromium" },
  { id: "W5", name: "Worker 5", utilization: 43, tests: 0, browser: "Firefox" },
  { id: "W6", name: "Worker 6", utilization: 57, tests: 0, browser: "WebKit" },
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
      '▶ Then dashboard should be visible within 3000ms',
      '▶ Given dataset upload modal is open',
      '▶ When user selects file "large_dataset_500mb.csv"',
      '▶ Then upload progress bar should reach 100%',
      '▶ Given Stripe checkout is initiated',
      '▶ When user enters card number "4242 4242 4242 4242"',
      '▶ Then payment confirmation modal should appear',
    ],
  },
  {
    level: "pass",
    messages: [
      "✓ auth.spec.ts:42 — OTP verification flow [PASS] 1.2s",
      "✓ dataset.spec.ts:88 — Cloud import from S3 [PASS] 3.4s",
      "✓ payment.spec.ts:15 — Stripe webhook received [PASS] 0.8s",
      "✓ security.spec.ts:7 — RBAC admin role enforced [PASS] 0.3s",
      "✓ mobile.spec.ts:33 — Viewport 375px renders correctly [PASS] 0.6s",
      "✓ chat.spec.ts:21 — WebSocket message delivered [PASS] 0.4s",
      "✓ desktop.spec.ts:12 — macOS window resize [PASS] 1.1s",
    ],
  },
  {
    level: "fail",
    messages: [
      "✗ api.spec.ts:103 — POST /api/datasets 422 Unprocessable Entity [FAIL] 2.1s",
      "✗ chat.spec.ts:67 — WebSocket reconnect timeout exceeded [FAIL] 5.0s",
      "✗ api.spec.ts:211 — GET /api/users/me 401 Unauthorized [FAIL] 0.9s",
    ],
  },
  {
    level: "info",
    messages: [
      "[playwright] Launching Chromium browser — headless: true",
      "[playwright] Launching Firefox browser — headless: true",
      "[playwright] Launching WebKit browser — headless: true",
      "[runner] Distributing 376 tests across 4 workers",
      "[runner] Test isolation: per-test context",
      "[network] Intercepting API calls on localhost:3000",
      "[storage] Clearing browser storage between tests",
    ],
  },
  {
    level: "warn",
    messages: [
      "[warn] Slow test detected: payment.spec.ts:89 took 22.4s",
      "[warn] Flaky selector: .toast-notification — retrying (1/3)",
      "[warn] Network request timeout: /api/export — 10000ms exceeded",
      "[warn] Memory usage high on Worker 2: 1.8GB",
    ],
  },
  {
    level: "debug",
    messages: [
      'DEBUG page.evaluate: document.title === "Veridat Dashboard"',
      "DEBUG locator resolved: [data-testid=\"upload-btn\"] → 1 element",
      "DEBUG screenshot captured: test-failure-api-103.png",
      "DEBUG trace saved: playwright-trace-auth-42.zip",
      'DEBUG console.log from page: "[App] User authenticated: qa@veridat.com"',
    ],
  },
];

function getRandomLog(counter: number): LogEntry {
  const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
  const messages = template.messages;
  const message = messages[Math.floor(Math.random() * messages.length)];
  const workers = ["W1", "W2", "W3", "W4"];
  const worker = workers[Math.floor(Math.random() * workers.length)];
  const now = new Date();
  const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
  return { id: counter, ts, level: template.level, worker, message };
}

// ─── Log Level Colors ─────────────────────────────────────────────────────────

const LOG_COLORS: Record<LogLevel, string> = {
  info: "#06b6d4",
  pass: "#10b981",
  fail: "#ef4444",
  warn: "#f59e0b",
  debug: "#6b7280",
  step: "#a78bfa",
};

const LOG_BG: Record<LogLevel, string> = {
  info: "rgba(6,182,212,0.04)",
  pass: "rgba(16,185,129,0.04)",
  fail: "rgba(239,68,68,0.08)",
  warn: "rgba(245,158,11,0.06)",
  debug: "rgba(107,114,128,0.04)",
  step: "rgba(167,139,250,0.06)",
};

// ─── Advanced Terminal Component ──────────────────────────────────────────────

function AdvancedTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(true);
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [counter, setCounter] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Seed with initial logs
    const initial: LogEntry[] = [];
    let c = 0;
    for (let i = 0; i < 20; i++) {
      initial.push(getRandomLog(c++));
    }
    setLogs(initial);
    setCounter(c);
  }, []);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCounter((prev) => {
        const newLog = getRandomLog(prev);
        setLogs((l) => {
          const next = [...l, newLog];
          return next.slice(-200);
        });
        return prev + 1;
      });
    }, 180);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = useMemo(
    () => (filter === "all" ? logs : logs.filter((l) => l.level === filter)),
    [logs, filter]
  );

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      counts[l.level] = (counts[l.level] || 0) + 1;
    });
    return counts;
  }, [logs]);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: "rgba(16,185,129,0.15)",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Terminal header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: "rgba(16,185,129,0.1)", background: "rgba(0,0,0,0.4)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-mono text-zinc-400">playwright-runner — 4 workers</span>
          {running && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex gap-1">
            {(["all", "pass", "fail", "warn", "step", "debug"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className="px-2 py-0.5 rounded text-[9px] font-mono uppercase transition-all"
                style={{
                  background: filter === lvl
                    ? lvl === "all" ? "rgba(16,185,129,0.2)" : `${LOG_COLORS[lvl as LogLevel]}22`
                    : "transparent",
                  color: filter === lvl
                    ? lvl === "all" ? "#10b981" : LOG_COLORS[lvl as LogLevel]
                    : "#52525b",
                  border: `1px solid ${
                    filter === lvl
                      ? lvl === "all" ? "rgba(16,185,129,0.3)" : `${LOG_COLORS[lvl as LogLevel]}44`
                      : "transparent"
                  }`,
                }}
              >
                {lvl}{lvl !== "all" && levelCounts[lvl] ? ` (${levelCounts[lvl]})` : ""}
              </button>
            ))}
          </div>
          <button
            onClick={() => setRunning((r) => !r)}
            className="p-1 rounded text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            {running ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button
            onClick={() => setLogs([])}
            className="p-1 rounded text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Log output */}
      <div
        ref={terminalRef}
        className="h-80 overflow-y-auto p-3 space-y-0.5"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-2 px-2 py-0.5 rounded text-[11px] leading-relaxed"
            style={{ background: LOG_BG[log.level] }}
          >
            <span className="text-zinc-600 shrink-0 tabular-nums">{log.ts}</span>
            <span
              className="shrink-0 uppercase font-bold w-10 text-center"
              style={{ color: LOG_COLORS[log.level] }}
            >
              {log.level}
            </span>
            <span className="text-zinc-500 shrink-0">[{log.worker}]</span>
            <span style={{ color: LOG_COLORS[log.level] === "#6b7280" ? "#71717a" : "#d4d4d8" }}>
              {log.message}
            </span>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-center text-zinc-600 text-xs font-mono py-8">
            No logs matching filter &quot;{filter}&quot;
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 border-t text-[10px] font-mono"
        style={{ borderColor: "rgba(16,185,129,0.1)", background: "rgba(0,0,0,0.3)" }}
      >
        <span className="text-zinc-600">{logs.length} lines buffered</span>
        <div className="flex gap-4">
          <span style={{ color: LOG_COLORS.pass }}>✓ {levelCounts.pass || 0} pass</span>
          <span style={{ color: LOG_COLORS.fail }}>✗ {levelCounts.fail || 0} fail</span>
          <span style={{ color: LOG_COLORS.warn }}>⚠ {levelCounts.warn || 0} warn</span>
        </div>
      </div>
    </div>
  );
}

// ─── Helix Visualization (Canvas-based, no Three.js SSR issues) ──────────────

function HelixVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const scrollY = useRef(0);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const NUM_NODES = 24;
    const nodeStatuses: Array<"executing" | "pass" | "fail"> = Array.from(
      { length: NUM_NODES },
      (_, i) => {
        if (i < 8) return "pass";
        if (i === 10 || i === 14 || i === 18) return "fail";
        if (i >= 20) return "executing";
        return "pass";
      }
    );

    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.012;

      const cx = W / 2;
      const radius = 60;
      const verticalSpacing = H / (NUM_NODES + 1);

      // Draw helix strands
      for (let strand = 0; strand < 2; strand++) {
        ctx.beginPath();
        for (let i = 0; i <= NUM_NODES * 4; i++) {
          const frac = i / (NUM_NODES * 4);
          const angle = frac * Math.PI * 6 + t + (strand === 1 ? Math.PI : 0);
          const x = cx + Math.cos(angle) * radius;
          const y = frac * H;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = strand === 0
          ? "rgba(16,185,129,0.25)"
          : "rgba(6,182,212,0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw base pairs and nodes
      for (let i = 0; i < NUM_NODES; i++) {
        const frac = (i + 1) / (NUM_NODES + 1);
        const angle = frac * Math.PI * 6 + t;
        const x1 = cx + Math.cos(angle) * radius;
        const x2 = cx + Math.cos(angle + Math.PI) * radius;
        const y = frac * H;

        const status = nodeStatuses[i];
        const nodeColor =
          status === "pass"
            ? "#10b981"
            : status === "fail"
            ? "#ef4444"
            : "#f59e0b";

        // Base pair connector
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = `${nodeColor}33`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node circles
        [x1, x2].forEach((nx) => {
          ctx.beginPath();
          ctx.arc(nx, y, hoveredNode === i ? 7 : 5, 0, Math.PI * 2);
          ctx.fillStyle = nodeColor;
          ctx.shadowColor = nodeColor;
          ctx.shadowBlur = hoveredNode === i ? 16 : 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Executing pulse
        if (status === "executing") {
          const pulse = Math.sin(t * 4 + i) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x1, y, 5 + pulse * 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245,158,11,${0.3 * pulse})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [hoveredNode]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={200}
        height={600}
        className="opacity-90"
        style={{ maxHeight: "100%" }}
      />
      <div className="absolute top-4 right-4 space-y-2 text-[10px] font-mono">
        {[
          { color: "#10b981", label: "PASS" },
          { color: "#ef4444", label: "FAIL" },
          { color: "#f59e0b", label: "EXEC" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }}
            />
            <span className="text-zinc-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Test Suite Row ───────────────────────────────────────────────────────────

function TestSuiteRow({
  suite,
  index,
}: {
  suite: (typeof TEST_SUITES)[0];
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = suite.passed + suite.failed + suite.skipped;
  const passRate = total > 0 ? (suite.passed / total) * 100 : 0;

  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-lg border overflow-hidden cursor-pointer"
      style={{
        borderColor:
          suite.status === "passed"
            ? "rgba(16,185,129,0.2)"
            : "rgba(239,68,68,0.2)",
        background: "rgba(9,9,11,0.6)",
      }}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status icon */}
        <div className="shrink-0">
          {suite.status === "passed" ? (
            <CheckCircle size={16} className="text-emerald-400" />
          ) : (
            <XCircle size={16} className="text-red-400" />
          )}
        </div>

        {/* Suite info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-zinc-200 truncate">{suite.name}</span>
            <span className="text-[10px] font-mono text-zinc-600 shrink-0">{suite.file}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${passRate}%`,
                background:
                  passRate > 95
                    ? "#10b981"
                    : passRate > 80
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 shrink-0 text-[11px] font-mono">
          <span className="text-emerald-400">{suite.passed}✓</span>
          {suite.failed > 0 && (
            <span className="text-red-400">{suite.failed}✗</span>
          )}
          {suite.skipped > 0 && (
            <span className="text-zinc-600">{suite.skipped}⊘</span>
          )}
          <span className="text-zinc-500">{suite.duration}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[9px] uppercase"
            style={{
              background: "rgba(6,182,212,0.1)",
              color: "#06b6d4",
              border: "1px solid rgba(6,182,212,0.2)",
            }}
          >
            {suite.worker}
          </span>
        </div>

        <ChevronRight
          size={14}
          className={`text-zinc-600 transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t px-4 py-3"
            style={{ borderColor: "rgba(16,185,129,0.08)" }}
          >
            <div className="grid grid-cols-3 gap-4 text-[11px] font-mono">
              <div>
                <div className="text-zinc-600 mb-1">Pass Rate</div>
                <div className="text-emerald-400 font-bold">{passRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-zinc-600 mb-1">Total Tests</div>
                <div className="text-zinc-300">{total}</div>
              </div>
              <div>
                <div className="text-zinc-600 mb-1">Duration</div>
                <div className="text-cyan-400">{suite.duration}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Worker Grid ──────────────────────────────────────────────────────────────

function WorkerGrid() {
  const [workerStats, setWorkerStats] = useState(WORKERS);

  useEffect(() => {
    const id = setInterval(() => {
      setWorkerStats((prev) =>
        prev.map((w) => ({
          ...w,
          utilization: Math.min(
            100,
            Math.max(0, w.utilization + (Math.random() - 0.5) * 10)
          ),
        }))
      );
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {workerStats.map((worker) => (
        <div
          key={worker.id}
          className="rounded-lg border p-3"
          style={{
            borderColor:
              worker.utilization > 85
                ? "rgba(245,158,11,0.3)"
                : "rgba(16,185,129,0.15)",
            background: "rgba(9,9,11,0.6)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-zinc-300">{worker.name}</span>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(6,182,212,0.1)",
                color: "#06b6d4",
                border: "1px solid rgba(6,182,212,0.2)",
              }}
            >
              {worker.browser}
            </span>
          </div>

          {/* Utilization bar */}
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${worker.utilization}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                background:
                  worker.utilization > 85
                    ? "#f59e0b"
                    : worker.utilization > 60
                    ? "#10b981"
                    : "#06b6d4",
              }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-zinc-600">{worker.utilization.toFixed(0)}% CPU</span>
            <span className="text-zinc-500">{worker.tests} tests</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const t = useTranslations();
  const metrics = useLocalMetrics();
  const [activeTab, setActiveTab] = useState<"suites" | "workers" | "coverage">("suites");

  const totalTests = TEST_SUITES.reduce(
    (acc, s) => acc + s.passed + s.failed + s.skipped,
    0
  );
  const totalPassed = TEST_SUITES.reduce((acc, s) => acc + s.passed, 0);
  const totalFailed = TEST_SUITES.reduce((acc, s) => acc + s.failed, 0);
  const overallPassRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

  return (
    <div className="min-h-screen px-4 md:px-8 py-8">
      {/* Header */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "#10b981", boxShadow: "0 0 8px #10b981" }}
          />
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            High-Throughput Automation Suite
          </span>
        </motion.div>
        <motion.h1
          variants={fadeInUp}
          className="text-3xl md:text-4xl font-bold font-mono text-zinc-100"
        >
          Playwright{" "}
          <span style={{ color: "#10b981" }}>Execution</span>{" "}
          Runner
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-sm font-mono text-zinc-500 mt-2">
          Parallelized test execution across 4 workers · {TEST_SUITES.length} suites ·{" "}
          {totalTests} total tests
        </motion.p>
      </motion.div>

      {/* Top metrics bar */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          {
            label: "Total Tests",
            value: totalTests.toLocaleString("en-US"),
            icon: <Layers size={16} />,
            color: "#06b6d4",
          },
          {
            label: "Passed",
            value: totalPassed.toLocaleString("en-US"),
            icon: <CheckCircle size={16} />,
            color: "#10b981",
          },
          {
            label: "Failed",
            value: totalFailed.toLocaleString("en-US"),
            icon: <XCircle size={16} />,
            color: "#ef4444",
          },
          {
            label: "Pass Rate",
            value: `${overallPassRate.toFixed(1)}%`,
            icon: <Activity size={16} />,
            color: overallPassRate > 95 ? "#10b981" : overallPassRate > 80 ? "#f59e0b" : "#ef4444",
          },
        ].map((metric) => (
          <motion.div
            key={metric.label}
            variants={scaleIn}
            className="rounded-xl border p-4"
            style={{
              borderColor: `${metric.color}33`,
              background: "rgba(9,9,11,0.7)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-2 mb-2" style={{ color: metric.color }}>
              {metric.icon}
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                {metric.label}
              </span>
            </div>
            <div
              className="text-2xl font-bold font-mono tabular-nums"
              style={{ color: metric.color }}
            >
              {metric.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main content: Helix + Terminal/Suites */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 mb-8">
        {/* Helix visualization */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: "rgba(16,185,129,0.15)",
            background: "rgba(9,9,11,0.6)",
            height: "600px",
          }}
        >
          <div
            className="px-3 py-2 border-b text-[10px] font-mono text-zinc-500 uppercase tracking-widest"
            style={{ borderColor: "rgba(16,185,129,0.1)" }}
          >
            BiHelix Stream
          </div>
          <div className="h-[calc(100%-36px)]">
            <HelixVisualization />
          </div>
        </motion.div>

        {/* Right panel */}
        <div className="space-y-6">
          {/* Tab bar */}
          <div className="flex gap-2">
            {(["suites", "workers", "coverage"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all"
                style={{
                  background:
                    activeTab === tab
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(9,9,11,0.6)",
                  color: activeTab === tab ? "#10b981" : "#52525b",
                  border: `1px solid ${
                    activeTab === tab
                      ? "rgba(16,185,129,0.3)"
                      : "rgba(16,185,129,0.08)"
                  }`,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === "suites" && (
              <motion.div
                key="suites"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {TEST_SUITES.map((suite, i) => (
                    <TestSuiteRow key={suite.id} suite={suite} index={i} />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {activeTab === "workers" && (
              <motion.div
                key="workers"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <WorkerGrid />
              </motion.div>
            )}

            {activeTab === "coverage" && (
              <motion.div
                key="coverage"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border p-6"
                style={{
                  borderColor: "rgba(16,185,129,0.15)",
                  background: "rgba(9,9,11,0.6)",
                }}
              >
                <div className="space-y-4">
                  {[
                    { label: "Statements", value: 94.2, color: "#10b981" },
                    { label: "Branches", value: 87.6, color: "#06b6d4" },
                    { label: "Functions", value: 91.3, color: "#f59e0b" },
                    { label: "Lines", value: 93.8, color: "#10b981" },
                  ].map((cov) => (
                    <div key={cov.label}>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-zinc-400">{cov.label}</span>
                        <span style={{ color: cov.color }}>{cov.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${cov.value}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{ background: cov.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Advanced Terminal */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={14} className="text-emerald-400" />
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Live Execution Log
          </span>
        </div>
        <AdvancedTerminal />
      </motion.div>
    </div>
  );
}
