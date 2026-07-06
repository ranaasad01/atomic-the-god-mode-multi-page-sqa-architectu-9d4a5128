"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Activity, Terminal, CheckCircle, XCircle, Clock, Cpu, Layers, Play, Pause, RotateCcw, ChevronRight, AlertTriangle, Zap, GitBranch, Eye, Filter } from 'lucide-react';
import { fadeInUp, staggerContainer, scaleIn, fadeIn } from "@/lib/motion";
import { useTranslations } from "next-intl";

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

// We read from the real store via a dynamic import pattern — but since we can't
// import from @/lib/store, we'll use a local reactive store that syncs via
// localStorage events. For safety, we define a self-contained local store.
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
    name: "Authentication Suite",
    file: "auth.spec.ts",
    passed: 48,
    failed: 2,
    skipped: 1,
    duration: "4.2s",
    worker: "W1",
    status: "passed" as const,
  },
  {
    id: "checkout",
    name: "Checkout Flow",
    file: "checkout.spec.ts",
    passed: 62,
    failed: 0,
    skipped: 3,
    duration: "8.7s",
    worker: "W2",
    status: "passed" as const,
  },
  {
    id: "api",
    name: "API Contract Tests",
    file: "api.spec.ts",
    passed: 134,
    failed: 7,
    skipped: 0,
    duration: "12.1s",
    worker: "W3",
    status: "failed" as const,
  },
  {
    id: "visual",
    name: "Visual Regression",
    file: "visual.spec.ts",
    passed: 29,
    failed: 1,
    skipped: 0,
    duration: "22.4s",
    worker: "W4",
    status: "failed" as const,
  },
  {
    id: "perf",
    name: "Performance Benchmarks",
    file: "perf.spec.ts",
    passed: 18,
    failed: 0,
    skipped: 2,
    duration: "31.8s",
    worker: "W1",
    status: "passed" as const,
  },
  {
    id: "a11y",
    name: "Accessibility Audit",
    file: "a11y.spec.ts",
    passed: 77,
    failed: 3,
    skipped: 0,
    duration: "6.3s",
    worker: "W2",
    status: "failed" as const,
  },
  {
    id: "mobile",
    name: "Mobile Viewport Suite",
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
    name: "Security Smoke Tests",
    file: "security.spec.ts",
    passed: 22,
    failed: 0,
    skipped: 0,
    duration: "5.5s",
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
      '▶ When user fills input[name="email"] with "qa@example.com"',
      '▶ When user fills input[name="password"] with "••••••••"',
      '▶ Then expect page.url() to contain "/dashboard"',
      '▶ Given API GET /api/v2/products returns 200',
      '▶ When user clicks button[data-testid="add-to-cart"]',
      '▶ Then expect locator(".cart-count").toHaveText("1")',
      '▶ Given viewport is set to { width: 375, height: 812 }',
      '▶ When user swipes left on carousel',
      '▶ Then expect aria-label="slide 2" to be visible',
    ],
  },
  {
    level: "pass",
    messages: [
      "✓ auth.spec.ts:42 — login with valid credentials (312ms)",
      "✓ checkout.spec.ts:88 — cart persists across page reload (198ms)",
      "✓ api.spec.ts:17 — GET /products returns schema-valid JSON (44ms)",
      "✓ visual.spec.ts:5 — homepage matches baseline snapshot (1.2s)",
      "✓ a11y.spec.ts:31 — no WCAG 2.1 AA violations on /checkout",
      "✓ mobile.spec.ts:14 — hamburger menu opens on 375px viewport (87ms)",
      "✓ perf.spec.ts:9 — LCP < 2500ms on product page (2.1s)",
      "✓ security.spec.ts:3 — CSP headers present on all routes (22ms)",
    ],
  },
  {
    level: "fail",
    messages: [
      "✗ api.spec.ts:203 — POST /orders expected 201 received 422 (timeout: 30s)",
      "✗ a11y.spec.ts:67 — button missing accessible name on /profile",
      "✗ visual.spec.ts:19 — pixel diff 3.2% exceeds threshold 1.0%",
      "✗ api.spec.ts:311 — response body missing field 'orderId'",
    ],
  },
  {
    level: "warn",
    messages: [
      "⚠ Slow network detected — throttling to 3G for perf suite",
      "⚠ Worker W5 idle for 12s — rebalancing test queue",
      "⚠ Flaky test detected: checkout.spec.ts:144 (retry 2/3)",
      "⚠ Memory usage at 78% — GC pressure on W2",
    ],
  },
  {
    level: "info",
    messages: [
      '{"event":"test_start","suite":"auth","worker":"W1","timestamp":1718000000}',
      '{"event":"screenshot","path":"screenshots/checkout-step-3.png","size":"142KB"}',
      '{"event":"network_idle","url":"/dashboard","duration":234}',
      '{"event":"trace_saved","path":"traces/api-run-47.zip","size":"8.4MB"}',
      'console.assert: expect(response.status).toBe(200) — PASS',
      'console.log: [Playwright] Retrying selector ".modal-close" (attempt 2)',
      '{"event":"coverage","lines":87.4,"branches":79.1,"functions":91.2}',
    ],
  },
  {
    level: "debug",
    messages: [
      "[CDP] Network.requestWillBeSent id=1847 url=https://api.example.com/v2/cart",
      "[CDP] Page.loadEventFired timestamp=1718000012.441",
      "[V8] Heap snapshot: used=48.2MB total=64MB",
      "[WS] Frame received: 0x89 len=1024 (binary)",
    ],
  },
];

function generateLog(id: number): LogEntry {
  const templateIdx = Math.floor(Math.random() * LOG_TEMPLATES.length);
  const template = LOG_TEMPLATES[templateIdx];
  if (!template) {
    return { id, ts: "00:00:00.000", level: "info", worker: "W1", message: "log entry" };
  }
  const msgIdx = Math.floor(Math.random() * template.messages.length);
  const msg = template.messages[msgIdx] ?? "log entry";
  const workers = ["W1", "W2", "W3", "W4"];
  const workerIdx = Math.floor(Math.random() * workers.length);
  return {
    id,
    ts: "00:00:00.000", // filled client-side in useEffect
    level: template.level,
    worker: workers[workerIdx] ?? "W1",
    message: msg,
  };
}

// ─── Log Level Colors ─────────────────────────────────────────────────────────

const LOG_COLORS: Record<LogLevel, string> = {
  info: "#94a3b8",
  pass: "#10b981",
  fail: "#ef4444",
  warn: "#f59e0b",
  debug: "#6366f1",
  step: "#06b6d4",
};

const LOG_BG: Record<LogLevel, string> = {
  info: "transparent",
  pass: "rgba(16,185,129,0.04)",
  fail: "rgba(239,68,68,0.06)",
  warn: "rgba(245,158,11,0.04)",
  debug: "rgba(99,102,241,0.04)",
  step: "rgba(6,182,212,0.04)",
};

// ─── AdvancedTerminal ─────────────────────────────────────────────────────────

function AdvancedTerminal() {
  const t = useTranslations();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [logCounter, setLogCounter] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    // Seed initial logs
    const initial: LogEntry[] = [];
    for (let i = 0; i < 30; i++) {
      const entry = generateLog(i);
      entry.ts = "00:00:00.000";
      initial.push(entry);
    }
    setLogs(initial);
    counterRef.current = 30;
    setLogCounter(30);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      const batchSize = Math.floor(Math.random() * 3) + 1;
      setLogs((prev) => {
        const next = [...prev];
        for (let i = 0; i < batchSize; i++) {
          counterRef.current += 1;
          const entry = generateLog(counterRef.current);
          entry.ts = "live";
          next.push(entry);
        }
        return next.slice(-300);
      });
      setLogCounter((c) => c + batchSize);
    }, 180);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (paused) return;
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs, paused]);

  const filtered = useMemo(
    () => (filter === "all" ? logs : logs.filter((l) => l.level === filter)),
    [logs, filter]
  );

  const filterOptions: Array<LogLevel | "all"> = ["all", "step", "pass", "fail", "warn", "info", "debug"];

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: "rgba(9,9,11,0.95)",
        border: "1px solid rgba(16,185,129,0.15)",
        boxShadow: "0 0 40px rgba(16,185,129,0.05), 0 2px 8px rgba(0,0,0,0.4)",
        height: "480px",
      }}
    >
      {/* Terminal header */}
      <div
        className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(16,185,129,0.1)", background: "rgba(16,185,129,0.03)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-mono text-emerald-400">playwright-parallel-runner</span>
          <span className="text-xs font-mono text-zinc-600">— {logCounter} events</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex gap-1">
            {filterOptions.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-2 py-0.5 rounded text-[10px] font-mono transition-all duration-200"
                style={{
                  background: filter === f ? (f === "all" ? "rgba(16,185,129,0.2)" : `${LOG_COLORS[f as LogLevel]}22`) : "transparent",
                  color: filter === f ? (f === "all" ? "#10b981" : LOG_COLORS[f as LogLevel]) : "#52525b",
                  border: `1px solid ${filter === f ? (f === "all" ? "rgba(16,185,129,0.3)" : `${LOG_COLORS[f as LogLevel]}44`) : "transparent"}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all duration-200"
            style={{
              background: paused ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.1)",
              color: paused ? "#f59e0b" : "#10b981",
              border: `1px solid ${paused ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.2)"}`,
            }}
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {/* Log body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(16,185,129,0.2) transparent" }}
      >
        {filtered.map((log) => (
          <div
            key={log.id}
            className="flex gap-2 px-4 py-0.5 hover:bg-white/[0.02] transition-colors"
            style={{ background: LOG_BG[log.level] }}
          >
            <span className="text-zinc-700 flex-shrink-0 w-20 tabular-nums">
              {log.ts === "live" ? new Date().toISOString().slice(11, 23) : `00:00:${String(log.id % 60).padStart(2, "0")}.${String((log.id * 37) % 1000).padStart(3, "0")}`}
            </span>
            <span
              className="flex-shrink-0 w-6 text-center"
              style={{ color: LOG_COLORS[log.level] }}
            >
              {log.worker}
            </span>
            <span
              className="flex-shrink-0 w-10 uppercase text-[9px] tracking-wider self-center"
              style={{ color: LOG_COLORS[log.level] }}
            >
              {log.level}
            </span>
            <span style={{ color: LOG_COLORS[log.level], opacity: log.level === "debug" ? 0.6 : 0.9 }}>
              {log.message}
            </span>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 flex-shrink-0 text-[10px] font-mono"
        style={{ borderTop: "1px solid rgba(16,185,129,0.1)", background: "rgba(16,185,129,0.03)" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-emerald-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            STREAMING
          </span>
          <span className="text-zinc-600">4 workers active</span>
        </div>
        <div className="flex gap-4">
          <span style={{ color: LOG_COLORS.pass }}>PASS: {logs.filter((l) => l.level === "pass").length}</span>
          <span style={{ color: LOG_COLORS.fail }}>FAIL: {logs.filter((l) => l.level === "fail").length}</span>
          <span style={{ color: LOG_COLORS.warn }}>WARN: {logs.filter((l) => l.level === "warn").length}</span>
        </div>
      </div>
    </div>
  );
}

// ─── BiHelix Three.js ─────────────────────────────────────────────────────────

interface HelixNodeProps {
  position: [number, number, number];
  isPassed: boolean;
  isFailed: boolean;
  scrollProgress: number;
  index: number;
}

function HelixNode({ position, isPassed, isFailed, scrollProgress, index }: HelixNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetColor = useRef(new THREE.Color());
  const currentColor = useRef(new THREE.Color("#f59e0b"));

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;

    if (isFailed) {
      targetColor.current.set("#ef4444");
    } else if (isPassed) {
      targetColor.current.set("#10b981");
    } else {
      targetColor.current.set("#f59e0b");
    }

    currentColor.current.lerp(targetColor.current, delta * 3);
    mat.color.copy(currentColor.current);
    mat.emissive.copy(currentColor.current);
    mat.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.002 + index) * 0.1;

    meshRef.current.rotation.y += delta * 0.5;
    meshRef.current.scale.setScalar(
      0.08 + Math.sin(Date.now() * 0.003 + index * 0.7) * 0.01
    );
  });

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.08, 0]} />
      <meshStandardMaterial
        color="#f59e0b"
        emissive="#f59e0b"
        emissiveIntensity={0.4}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

interface ConnectorProps {
  start: [number, number, number];
  end: [number, number, number];
  isPassed: boolean;
}

function Connector({ start, end, isPassed }: ConnectorProps) {
  const ref = useRef<THREE.Mesh>(null);
  const color = isPassed ? "#10b981" : "#f59e0b";

  const mid: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return (
    <mesh ref={ref} position={mid}>
      <cylinderGeometry args={[0.008, 0.008, length, 4]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}

interface HelixSceneProps {
  scrollProgress: number;
  passedCount: number;
  failedCount: number;
}

function HelixScene({ scrollProgress, passedCount, failedCount }: HelixSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const totalNodes = 20;
  const passRatio = passedCount / Math.max(1, passedCount + failedCount);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.15;
    groupRef.current.position.y = scrollProgress * -2;
  });

  const nodes = useMemo(() => {
    const result = [];
    for (let i = 0; i < totalNodes; i++) {
      const t = (i / totalNodes) * Math.PI * 4;
      const y = i * 0.35 - (totalNodes * 0.35) / 2;
      const r = 0.8;

      const x1 = Math.cos(t) * r;
      const z1 = Math.sin(t) * r;
      const x2 = Math.cos(t + Math.PI) * r;
      const z2 = Math.sin(t + Math.PI) * r;

      const isPassed = i / totalNodes < passRatio;
      const isFailed = !isPassed && i / totalNodes > passRatio + 0.1;

      result.push({ i, y, x1, z1, x2, z2, isPassed, isFailed, t });
    }
    return result;
  }, [passRatio]);

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} intensity={1} color="#10b981" />
      <pointLight position={[-3, -3, -3]} intensity={0.5} color="#06b6d4" />

      {nodes.map(({ i, y, x1, z1, x2, z2, isPassed, isFailed }) => (
        <group key={i}>
          <HelixNode
            position={[x1, y, z1]}
            isPassed={isPassed}
            isFailed={isFailed}
            scrollProgress={scrollProgress}
            index={i}
          />
          <HelixNode
            position={[x2, y, z2]}
            isPassed={isPassed}
            isFailed={isFailed}
            scrollProgress={scrollProgress}
            index={i + totalNodes}
          />
          {i % 3 === 0 && (
            <Connector
              start={[x1, y, z1]}
              end={[x2, y, z2]}
              isPassed={isPassed}
            />
          )}
        </group>
      ))}
    </group>
  );
}

function BiHelixStream() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const passedCount = useLocalMetrics((s) => s.passedCount);
  const failedCount = useLocalMetrics((s) => s.failedCount);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrollProgress(isNaN(progress) ? 0 : progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="rounded-xl overflow-hidden relative"
      style={{
        height: "480px",
        background: "rgba(9,9,11,0.8)",
        border: "1px solid rgba(6,182,212,0.15)",
        boxShadow: "0 0 40px rgba(6,182,212,0.05)",
      }}
    >
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-mono text-cyan-400">BiHelix Test DNA</span>
      </div>
      <div className="absolute bottom-3 left-4 z-10 flex gap-4 text-[10px] font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span className="text-emerald-400">Pass ({passedCount.toLocaleString("en-US")})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span className="text-amber-400">Pending</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
          <span className="text-red-400">Fail ({failedCount.toLocaleString("en-US")})</span>
        </span>
      </div>
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
        <HelixScene
          scrollProgress={scrollProgress}
          passedCount={passedCount}
          failedCount={failedCount}
        />
      </Canvas>
    </div>
  );
}

// ─── Worker Utilization Panel ─────────────────────────────────────────────────

const workerBarVariants: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: (util: number) => ({
    scaleX: util / 100,
    originX: 0,
    transition: { duration: 0.8, ease: "easeOut", delay: 0.1 },
  }),
};

function WorkerPanel() {
  const [workers, setWorkers] = useState(WORKERS);

  useEffect(() => {
    const id = setInterval(() => {
      setWorkers((prev) =>
        prev.map((w) => ({
          ...w,
          utilization: Math.min(100, Math.max(10, w.utilization + (Math.random() - 0.5) * 12)),
          tests: w.tests + Math.floor(Math.random() * 3),
        }))
      );
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const getUtilColor = (u: number) => {
    if (u > 85) return "#ef4444";
    if (u > 65) return "#f59e0b";
    return "#10b981";
  };

  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-xl p-5"
      style={{
        background: "rgba(9,9,11,0.8)",
        border: "1px solid rgba(16,185,129,0.12)",
        boxShadow: "0 2px 24px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-mono font-bold text-emerald-400">Parallel Worker Utilization</h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
          {workers.filter((w) => w.utilization > 20).length}/{workers.length} ACTIVE
        </span>
      </div>

      <div className="space-y-3">
        {workers.map((worker) => {
          const color = getUtilColor(worker.utilization);
          return (
            <div key={worker.id} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300">{worker.name}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px]"
                    style={{
                      background: `${color}15`,
                      color,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    {worker.browser}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600">{worker.tests} tests</span>
                  <span style={{ color }} className="tabular-nums w-10 text-right">
                    {Math.round(worker.utilization)}%
                  </span>
                </div>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${worker.utilization}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                    boxShadow: `0 0 8px ${color}44`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-5 pt-4 grid grid-cols-3 gap-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        {[
          { label: "Avg Utilization", value: `${Math.round(workers.reduce((a, w) => a + w.utilization, 0) / workers.length)}%`, color: "#10b981" },
          { label: "Total Tests Run", value: workers.reduce((a, w) => a + w.tests, 0).toLocaleString("en-US"), color: "#06b6d4" },
          { label: "Browsers", value: "3", color: "#f59e0b" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-lg font-mono font-bold tabular-nums" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Suite Breakdown Table ────────────────────────────────────────────────────

function SuiteTable() {
  const [suites, setSuites] = useState(TEST_SUITES);
  const [sortKey, setSortKey] = useState<"name" | "passed" | "failed" | "duration">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const passedCount = useLocalMetrics((s) => s.passedCount);
  const failedCount = useLocalMetrics((s) => s.failedCount);

  useEffect(() => {
    const id = setInterval(() => {
      setSuites((prev) =>
        prev.map((s) => ({
          ...s,
          passed: s.passed + Math.floor(Math.random() * 2),
          failed: s.status === "failed" ? s.failed + (Math.random() > 0.85 ? 1 : 0) : s.failed,
        }))
      );
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const sorted = useMemo(() => {
    return [...suites].sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [suites, sortKey, sortDir]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const totalPassed = suites.reduce((a, s) => a + s.passed, 0);
  const totalFailed = suites.reduce((a, s) => a + s.failed, 0);
  const passRate = ((totalPassed / Math.max(1, totalPassed + totalFailed)) * 100).toFixed(1);

  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(9,9,11,0.8)",
        border: "1px solid rgba(16,185,129,0.12)",
        boxShadow: "0 2px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(16,185,129,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-mono font-bold text-emerald-400">Test Suite Breakdown</h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-emerald-400">{totalPassed.toLocaleString("en-US")} passed</span>
          <span className="text-red-400">{totalFailed.toLocaleString("en-US")} failed</span>
          <span
            className="px-2 py-0.5 rounded"
            style={{
              background: "rgba(16,185,129,0.1)",
              color: "#10b981",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            {passRate}% pass rate
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {[
                { key: "name", label: "Suite" },
                { key: "passed", label: "Passed" },
                { key: "failed", label: "Failed" },
                { key: "duration", label: "Duration" },
              ].map((col) => (
                <th
                  key={col.key}
                  className="text-left px-5 py-3 text-zinc-500 uppercase tracking-wider text-[10px] cursor-pointer hover:text-zinc-300 transition-colors select-none"
                  onClick={() => handleSort(col.key as typeof sortKey)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <ChevronRight
                        className="w-3 h-3"
                        style={{ transform: sortDir === "asc" ? "rotate(90deg)" : "rotate(-90deg)" }}
                      />
                    )}
                  </span>
                </th>
              ))}
              <th className="text-left px-5 py-3 text-zinc-500 uppercase tracking-wider text-[10px]">Worker</th>
              <th className="text-left px-5 py-3 text-zinc-500 uppercase tracking-wider text-[10px]">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((suite, idx) => {
              const total = suite.passed + suite.failed;
              const pct = total > 0 ? (suite.passed / total) * 100 : 100;
              return (
                <motion.tr
                  key={suite.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="hover:bg-white/[0.02] transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <td className="px-5 py-3">
                    <div className="text-zinc-200">{suite.name}</div>
                    <div className="text-zinc-600 text-[10px]">{suite.file}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 tabular-nums">{suite.passed.toLocaleString("en-US")}</span>
                      <div className="w-16 h-1 rounded-full overflow-hidden bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={suite.failed > 0 ? "text-red-400 tabular-nums" : "text-zinc-600"}>
                      {suite.failed}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-400 tabular-nums">{suite.duration}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px]"
                      style={{
                        background: "rgba(6,182,212,0.1)",
                        color: "#06b6d4",
                        border: "1px solid rgba(6,182,212,0.2)",
                      }}
                    >
                      {suite.worker}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded w-fit"
                      style={{
                        background: suite.status === "passed" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: suite.status === "passed" ? "#10b981" : "#ef4444",
                        border: `1px solid ${suite.status === "passed" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}
                    >
                      {suite.status === "passed" ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {suite.status}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatCards() {
  const passedCount = useLocalMetrics((s) => s.passedCount);
  const failedCount = useLocalMetrics((s) => s.failedCount);
  const p99Latency = useLocalMetrics((s) => s.p99Latency);
  const throughputRPS = useLocalMetrics((s) => s.throughputRPS);

  const [liveStats, setLiveStats] = useState({
    passed: passedCount,
    failed: failedCount,
    latency: p99Latency,
    rps: throughputRPS,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setLiveStats((prev) => ({
        passed: prev.passed + Math.floor(Math.random() * 5),
        failed: prev.failed + (Math.random() > 0.9 ? 1 : 0),
        latency: Math.max(80, Math.min(400, prev.latency + (Math.random() - 0.5) * 20)),
        rps: Math.max(1000, Math.min(3000, prev.rps + (Math.random() - 0.5) * 100)),
      }));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const cards = [
    {
      label: "Tests Passed",
      value: liveStats.passed.toLocaleString("en-US"),
      icon: CheckCircle,
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.15)",
      delta: "+12 last min",
    },
    {
      label: "Tests Failed",
      value: liveStats.failed.toLocaleString("en-US"),
      icon: XCircle,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.15)",
      delta: "1.8% fail rate",
    },
    {
      label: "P99 Latency",
      value: `${Math.round(liveStats.latency)}ms`,
      icon: Clock,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.15)",
      delta: "SLA: <500ms",
    },
    {
      label: "Throughput",
      value: `${Math.round(liveStats.rps).toLocaleString("en-US")} RPS`,
      icon: Zap,
      color: "#06b6d4",
      bg: "rgba(6,182,212,0.08)",
      border: "rgba(6,182,212,0.15)",
      delta: "Peak: 2,847 RPS",
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            variants={scaleIn}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="rounded-xl p-4"
            style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
              boxShadow: `0 0 20px ${card.color}08`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                {card.label}
              </span>
              <Icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
            <div
              className="text-2xl font-mono font-bold tabular-nums"
              style={{ color: card.color }}
            >
              {card.value}
            </div>
            <div className="text-[10px] font-mono text-zinc-600 mt-1">{card.delta}</div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ─── Run Controls ─────────────────────────────────────────────────────────────

function RunControls() {
  const [running, setRunning] = useState(true);
  const [progress, setProgress] = useState(67);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { setRunning(false); return 100; }
        return Math.min(100, p + Math.random() * 0.8);
      });
    }, 400);
    return () => clearInterval(id);
  }, [running]);

  const handleReset = () => { setProgress(0); setRunning(false); };
  const handleToggle = () => {
    if (progress >= 100) { setProgress(0); setRunning(true); }
    else setRunning((r) => !r);
  };

  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-xl p-5"
      style={{
        background: "rgba(9,9,11,0.8)",
        border: "1px solid rgba(16,185,129,0.12)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-mono font-bold text-emerald-400">Active Run: playwright-ci-#847</h3>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all"
            style={{
              background: running ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
              color: running ? "#f59e0b" : "#10b981",
              border: `1px solid ${running ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`,
            }}
          >
            {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {running ? "Pause" : progress >= 100 ? "Restart" : "Resume"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono"
            style={{
              background: "rgba(99,102,241,0.1)",
              color: "#818cf8",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </motion.button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-mono text-zinc-500">
          <span>Overall Progress</span>
          <span className="text-emerald-400 tabular-nums">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              background: progress >= 100
                ? "linear-gradient(90deg, #10b981, #06b6d4)"
                : "linear-gradient(90deg, #10b98188, #10b981)",
              boxShadow: "0 0 12px rgba(16,185,129,0.4)",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-zinc-600">
          <span>376 / 560 tests complete</span>
          <span>{running ? "ETA: ~2m 14s" : progress >= 100 ? "Complete" : "Paused"}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {[
          { label: "Suites", value: "8", color: "#06b6d4" },
          { label: "Workers", value: "6", color: "#10b981" },
          { label: "Retries", value: "4", color: "#f59e0b" },
          { label: "Shards", value: "3", color: "#818cf8" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-base font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const t = useTranslations();

  // Simulate live metric updates
  useEffect(() => {
    const id = setInterval(() => {
      useLocalMetrics.setState((s) => ({
        passedCount: s.passedCount + Math.floor(Math.random() * 4),
        failedCount: s.failedCount + (Math.random() > 0.92 ? 1 : 0),
        p99Latency: Math.max(80, Math.min(500, s.p99Latency + (Math.random() - 0.5) * 15)),
        throughputRPS: Math.max(800, Math.min(3000, s.throughputRPS + (Math.random() - 0.5) * 80)),
      }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen md:pl-64" style={{ background: "transparent" }}>
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 px-6 py-8 max-w-7xl mx-auto space-y-8">
        {/* Page header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          <motion.div variants={fadeIn} className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-widest"
              style={{
                background: "rgba(16,185,129,0.1)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              HIGH THROUGHPUT
            </span>
            <span className="text-[10px] font-mono text-zinc-600">playwright v1.44 — 6 workers — 3 shards</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-mono font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 60%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Automation Suite
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-sm font-mono text-zinc-500 max-w-2xl">
            Parallelized Playwright execution across 6 workers, 3 browser engines, and 8 test suites.
            Real-time streaming telemetry with automatic retry orchestration and flakiness detection.
          </motion.p>
        </motion.div>

        {/* Stat cards */}
        <StatCards />

        {/* Run controls */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <RunControls />
        </motion.div>

        {/* Terminal + Helix split */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        >
          <motion.div variants={fadeInUp} className="xl:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-mono font-bold text-zinc-300">Live Execution Stream</h2>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded animate-pulse"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                LIVE
              </span>
            </div>
            <AdvancedTerminal />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-mono font-bold text-zinc-300">Test DNA Helix</h2>
            </div>
            <BiHelixStream />
          </motion.div>
        </motion.div>

        {/* Worker panel */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <WorkerPanel />
        </motion.div>

        {/* Suite table */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <SuiteTable />
        </motion.div>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </main>
  );
}