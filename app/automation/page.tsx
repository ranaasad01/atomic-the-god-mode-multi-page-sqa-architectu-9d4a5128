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
      '▶ When user selects large CSV file (1.2GB)',
      '▶ Then upload progress bar should reach 100%',
      '▶ Given buyer is on Stripe checkout page',
      '▶ When buyer enters valid card details',
      '▶ Then payment confirmation email should be sent',
    ],
  },
  {
    level: "pass",
    messages: [
      '  ✓  [chromium] › auth/otp-verification.spec.ts:12 — should send OTP on login (234ms)',
      '  ✓  [chromium] › auth/session.spec.ts:28 — should maintain session across tabs (189ms)',
      '  ✓  [firefox] › dataset/upload.spec.ts:15 — should upload large CSV file (1.2GB) (4301ms)',
      '  ✓  [webkit] › payment/stripe.spec.ts:8 — should complete buyer onboarding (2100ms)',
      '  ✓  [chromium] › chat/messaging.spec.ts:22 — should persist messages after reload (310ms)',
      '  ✓  [chromium] › security/rbac.spec.ts:5 — admin should access all routes (145ms)',
      '  ✓  [firefox] › mobile/viewport.spec.ts:9 — should render correctly on 375px (201ms)',
      '  ✓  [chromium] › desktop/macos.spec.ts:3 — should launch on macOS Ventura (512ms)',
      '  ✓  [webkit] › dataset/cloud-import.spec.ts:18 — should import from Google Drive (3820ms)',
      '  ✓  [chromium] › auth/rbac.spec.ts:14 — seller should not access admin panel (98ms)',
    ],
  },
  {
    level: "fail",
    messages: [
      '  ✗  [chromium] › api/endpoints.spec.ts:44 — POST /api/datasets — expected 201 got 500 (88ms)',
      '  ✗  [firefox] › payment/kyc.spec.ts:31 — KYC status should update to verified (timeout 30000ms)',
      '  ✗  [chromium] › chat/ordering.spec.ts:17 — messages should appear in correct order (failed assertion)',
      '  ✗  [webkit] › api/endpoints.spec.ts:88 — DELETE /api/datasets/:id — expected 204 got 403 (112ms)',
    ],
  },
  {
    level: "warn",
    messages: [
      '  ⚠  Flaky test detected: chat/messaging.spec.ts:22 — retry 1/3',
      '  ⚠  Slow test: dataset/upload.spec.ts:15 — exceeded 4000ms threshold',
      '  ⚠  Network throttle active — packet loss 2% detected',
      '  ⚠  Stripe sandbox rate limit approaching — 80% of quota used',
    ],
  },
  {
    level: "debug",
    messages: [
      '  console.log  [W2] Uploading chunk 847/1024 — 82.7% complete',
      '  console.assert  Expected status 201, received 500 — {"trace":"4f2a1b","endpoint":"/api/datasets"}',
      '  console.log  [W1] OTP received via mock SMTP: 482910',
      '  console.log  [W4] Stripe webhook payload validated — event: payment_intent.succeeded',
      '  console.log  [W3] WebSocket connection established — chat room: buyer-seller-4821',
    ],
  },
  {
    level: "info",
    messages: [
      '▶  Playwright v1.44.0 — parallel workers: 4 — Project: Veridat QA Suite',
      '  ℹ  Retrying failed test: api/endpoints.spec.ts:44 (attempt 2/3)',
      '  ℹ  Screenshot captured: screenshots/payment-kyc-failure-1721234567.png',
      '  ℹ  Trace saved: traces/chat-ordering-failure.zip',
      '  ℹ  Worker W3 assigned: desktop/linux.spec.ts',
    ],
  },
];

const INITIAL_LOGS: LogEntry[] = [
  { id: 1, ts: "09:41:00", level: "info", worker: "MAIN", message: "▶  Playwright v1.44.0 — parallel workers: 4 — Project: Veridat QA Suite" },
  { id: 2, ts: "09:41:01", level: "pass", worker: "W1", message: "  ✓  [chromium] › auth/otp-verification.spec.ts:12 — should send OTP on login (234ms)" },
  { id: 3, ts: "09:41:02", level: "pass", worker: "W1", message: "  ✓  [chromium] › auth/session.spec.ts:28 — should maintain session across tabs (189ms)" },
  { id: 4, ts: "09:41:03", level: "pass", worker: "W2", message: "  ✓  [firefox] › dataset/upload.spec.ts:15 — should upload large CSV file (1.2GB) (4301ms)" },
  { id: 5, ts: "09:41:04", level: "fail", worker: "W3", message: "  ✗  [chromium] › api/endpoints.spec.ts:44 — POST /api/datasets — expected 201 got 500 (88ms)" },
  { id: 6, ts: "09:41:05", level: "pass", worker: "W4", message: "  ✓  [webkit] › payment/stripe.spec.ts:8 — should complete buyer onboarding (2100ms)" },
  { id: 7, ts: "09:41:06", level: "pass", worker: "W2", message: "  ✓  [chromium] › chat/messaging.spec.ts:22 — should persist messages after reload (310ms)" },
  { id: 8, ts: "09:41:07", level: "pass", worker: "W4", message: "  ✓  [chromium] › security/rbac.spec.ts:5 — admin should access all routes (145ms)" },
  { id: 9, ts: "09:41:08", level: "warn", worker: "W3", message: "  ⚠  Flaky test detected: chat/messaging.spec.ts:22 — retry 1/3" },
  { id: 10, ts: "09:41:09", level: "debug", worker: "W2", message: '  console.assert  Expected status 201, received 500 — {"trace":"4f2a1b","endpoint":"/api/datasets"}' },
];

// ─── Three.js Double Helix ────────────────────────────────────────────────────

interface HelixNode {
  position: THREE.Vector3;
  status: "executing" | "passed" | "failed";
  index: number;
}

function BiHelixStream({ scrollY }: { scrollY: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const connectorsRef = useRef<THREE.InstancedMesh>(null);

  const nodes = useMemo<HelixNode[]>(() => {
    const result: HelixNode[] = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 8;
      const y = i * 0.4 - 8;
      // Strand A
      result.push({
        position: new THREE.Vector3(Math.cos(t) * 1.5, y, Math.sin(t) * 1.5),
        status: i % 7 === 3 ? "failed" : i % 5 === 0 ? "executing" : "passed",
        index: i * 2,
      });
      // Strand B
      result.push({
        position: new THREE.Vector3(Math.cos(t + Math.PI) * 1.5, y, Math.sin(t + Math.PI) * 1.5),
        status: i % 9 === 4 ? "failed" : i % 4 === 0 ? "executing" : "passed",
        index: i * 2 + 1,
      });
    }
    return result;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorMap: Record<string, THREE.Color> = useMemo(
    () => ({
      executing: new THREE.Color("#f59e0b"),
      passed: new THREE.Color("#10b981"),
      failed: new THREE.Color("#ef4444"),
    }),
    []
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.15;
    groupRef.current.position.y = Math.sin(t * 0.3) * 0.2 - scrollY * 0.003;

    if (nodesRef.current) {
      nodes.forEach((node, i) => {
        dummy.position.copy(node.position);
        const pulse = node.status === "executing" ? 0.12 + Math.sin(t * 3 + i) * 0.06 : 0.1;
        dummy.scale.setScalar(pulse);
        dummy.updateMatrix();
        nodesRef.current!.setMatrixAt(i, dummy.matrix);
        nodesRef.current!.setColorAt(i, colorMap[node.status]);
      });
      nodesRef.current.instanceMatrix.needsUpdate = true;
      if (nodesRef.current.instanceColor) nodesRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Helix nodes */}
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          emissive="#10b981"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.7}
        />
      </instancedMesh>

      {/* Base pair connectors */}
      {Array.from({ length: 20 }, (_, i) => {
        const t = (i / 20) * Math.PI * 8;
        const y = i * 0.8 - 8;
        const xA = Math.cos(t) * 1.5;
        const zA = Math.sin(t) * 1.5;
        const xB = Math.cos(t + Math.PI) * 1.5;
        const zB = Math.sin(t + Math.PI) * 1.5;
        const midX = (xA + xB) / 2;
        const midZ = (zA + zB) / 2;
        const length = Math.sqrt((xB - xA) ** 2 + (zB - zA) ** 2);
        const angle = Math.atan2(zB - zA, xB - xA);
        return (
          <mesh
            key={i}
            position={[midX, y, midZ]}
            rotation={[0, -angle, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.02, 0.02, length, 4]} />
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#06b6d4"
              emissiveIntensity={0.3}
              transparent
              opacity={0.5}
            />
          </mesh>
        );
      })}

      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#10b981" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#06b6d4" />
    </group>
  );
}

// ─── Terminal Component ───────────────────────────────────────────────────────

function AdvancedTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const terminalRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(INITIAL_LOGS.length + 1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getTimestamp = useCallback(() => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, "0");
    const m = now.getMinutes().toString().padStart(2, "0");
    const s = now.getSeconds().toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, []);

  const addLog = useCallback(() => {
    const templateGroup = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const message = templateGroup.messages[Math.floor(Math.random() * templateGroup.messages.length)];
    const workerIds = ["W1", "W2", "W3", "W4", "MAIN"];
    const newLog: LogEntry = {
      id: counterRef.current++,
      ts: getTimestamp(),
      level: templateGroup.level,
      worker: workerIds[Math.floor(Math.random() * workerIds.length)],
      message,
    };
    setLogs((prev) => [...prev.slice(-199), newLog]);
  }, [getTimestamp]);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(addLog, 600 + Math.random() * 400);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, addLog]);

  useEffect(() => {
    if (terminalRef.current && !paused) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, paused]);

  const levelColors: Record<LogLevel, string> = {
    info: "#06b6d4",
    pass: "#10b981",
    fail: "#ef4444",
    warn: "#f59e0b",
    debug: "#8b5cf6",
    step: "#94a3b8",
  };

  const levelLabels: Record<LogLevel, string> = {
    info: "INFO",
    pass: "PASS",
    fail: "FAIL",
    warn: "WARN",
    debug: "DBG ",
    step: "STEP",
  };

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.level === filter);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "rgba(9,9,11,0.95)",
        border: "1px solid rgba(16,185,129,0.2)",
        boxShadow: "0 0 40px rgba(16,185,129,0.05)",
      }}
    >
      {/* Terminal header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid rgba(16,185,129,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
          </div>
          <span className="text-xs font-mono text-zinc-400">veridat-qa — playwright — 4 workers</span>
        </div>
        <div className="flex items-center gap-2">
          {(["all", "pass", "fail", "warn", "info"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as LogLevel | "all")}
              className="text-[10px] font-mono px-2 py-0.5 rounded transition-all"
              style={{
                background: filter === f ? "rgba(16,185,129,0.2)" : "transparent",
                color: filter === f ? "#10b981" : "#52525b",
                border: `1px solid ${filter === f ? "rgba(16,185,129,0.4)" : "transparent"}`,
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded transition-all"
            style={{
              background: paused ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.1)",
              color: paused ? "#f59e0b" : "#10b981",
              border: `1px solid ${paused ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.2)"}`,
            }}
          >
            {paused ? <Play size={10} /> : <Pause size={10} />}
            {paused ? "RESUME" : "PAUSE"}
          </button>
          <button
            onClick={() => setLogs(INITIAL_LOGS)}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded transition-all"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <RotateCcw size={10} />
            CLEAR
          </button>
        </div>
      </div>

      {/* Log output */}
      <div
        ref={terminalRef}
        className="h-80 overflow-y-auto p-3 space-y-0.5"
        style={{ fontFamily: "monospace" }}
      >
        {filteredLogs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-start gap-2 text-[11px] leading-5"
          >
            <span className="text-zinc-600 shrink-0 tabular-nums">{log.ts}</span>
            <span
              className="shrink-0 px-1 rounded text-[9px] font-bold tabular-nums"
              style={{
                color: levelColors[log.level],
                background: `${levelColors[log.level]}18`,
              }}
            >
              {levelLabels[log.level]}
            </span>
            <span className="text-zinc-500 shrink-0">[{log.worker}]</span>
            <span
              style={{ color: levelColors[log.level] }}
              className="break-all"
            >
              {log.message}
            </span>
          </motion.div>
        ))}
        {!paused && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <span className="animate-pulse">█</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Suite Row ────────────────────────────────────────────────────────────────

function SuiteRow({
  suite,
  index,
}: {
  suite: (typeof TEST_SUITES)[0];
  index: number;
}) {
  const total = suite.passed + suite.failed + suite.skipped;
  const passRate = total > 0 ? (suite.passed / total) * 100 : 0;
  const statusColor =
    suite.status === "passed"
      ? "#10b981"
      : suite.status === "failed"
      ? "#ef4444"
      : "#f59e0b";

  return (
    <motion.div
      variants={fadeInUp}
      className="group flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200"
      style={{
        background: "rgba(9,9,11,0.6)",
        border: `1px solid rgba(16,185,129,0.08)`,
      }}
      whileHover={{
        background: "rgba(16,185,129,0.04)",
        borderColor: "rgba(16,185,129,0.2)",
      }}
    >
      {/* Status indicator */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          backgroundColor: statusColor,
          boxShadow: `0 0 6px ${statusColor}`,
        }}
      />

      {/* Suite info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-zinc-200 truncate">
            {suite.name}
          </span>
          <span className="text-[10px] font-mono text-zinc-600 shrink-0">
            {suite.file}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: statusColor }}
            initial={{ width: 0 }}
            animate={{ width: `${passRate}%` }}
            transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-center">
          <div className="text-xs font-mono font-bold text-emerald-400">{suite.passed}</div>
          <div className="text-[9px] font-mono text-zinc-600">PASS</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-mono font-bold" style={{ color: suite.failed > 0 ? "#ef4444" : "#52525b" }}>
            {suite.failed}
          </div>
          <div className="text-[9px] font-mono text-zinc-600">FAIL</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-mono font-bold text-zinc-500">{suite.skipped}</div>
          <div className="text-[9px] font-mono text-zinc-600">SKIP</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-mono text-zinc-400">{suite.duration}</div>
          <div className="text-[9px] font-mono text-zinc-600">DUR</div>
        </div>
        <div
          className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{
            color: statusColor,
            background: `${statusColor}18`,
            border: `1px solid ${statusColor}40`,
          }}
        >
          {suite.worker}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Worker Card ──────────────────────────────────────────────────────────────

function WorkerCard({ worker }: { worker: (typeof WORKERS)[0] }) {
  const [util, setUtil] = useState(worker.utilization);

  useEffect(() => {
    const id = setInterval(() => {
      setUtil(Math.min(100, Math.max(0, worker.utilization + (Math.random() - 0.5) * 12)));
    }, 1200);
    return () => clearInterval(id);
  }, [worker.utilization]);

  const color = util > 85 ? "#ef4444" : util > 65 ? "#f59e0b" : "#10b981";

  return (
    <motion.div
      variants={scaleIn}
      className="p-3 rounded-lg"
      style={{
        background: "rgba(9,9,11,0.8)",
        border: "1px solid rgba(16,185,129,0.1)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-bold text-zinc-300">{worker.id}</span>
        <span className="text-[10px] font-mono text-zinc-500">{worker.browser}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${util}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </div>
      <div className="flex justify-between">
        <span className="text-[10px] font-mono" style={{ color }}>
          {Math.round(util)}%
        </span>
        <span className="text-[10px] font-mono text-zinc-600">{worker.tests} tests</span>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "passed" | "failed">("all");
  const [isRunning, setIsRunning] = useState(true);
  const metrics = useLocalMetrics();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const totalPassed = TEST_SUITES.reduce((a, s) => a + s.passed, 0);
  const totalFailed = TEST_SUITES.reduce((a, s) => a + s.failed, 0);
  const totalSkipped = TEST_SUITES.reduce((a, s) => a + s.skipped, 0);
  const totalTests = totalPassed + totalFailed + totalSkipped;
  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0.0";

  const filteredSuites = TEST_SUITES.filter((s) => {
    if (activeFilter === "all") return true;
    return s.status === activeFilter;
  });

  return (
    <div className="min-h-screen">
      {/* Hero section with 3D helix */}
      <section className="relative h-[60vh] min-h-[480px] overflow-hidden">
        {/* Canvas */}
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <BiHelixStream scrollY={scrollY} />
          </Canvas>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030303]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-transparent to-[#030303] opacity-60" />

        {/* Hero content */}
        <div className="relative z-10 h-full flex flex-col justify-center px-8 max-w-4xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <motion.div variants={fadeInUp} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#10b981", boxShadow: "0 0 8px #10b981" }}
              />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                Playwright Execution Engine — Active
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold font-mono"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Automation Suite
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg font-mono text-zinc-400 max-w-xl"
            >
              Veridat Platform — Parallelized QA across 4 workers, 3 browsers
            </motion.p>

            {/* Live stats bar */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-6 pt-2"
            >
              {[
                { label: "Total Tests", value: totalTests.toLocaleString("en-US"), color: "#06b6d4" },
                { label: "Passed", value: totalPassed.toLocaleString("en-US"), color: "#10b981" },
                { label: "Failed", value: totalFailed.toLocaleString("en-US"), color: "#ef4444" },
                { label: "Pass Rate", value: `${passRate}%`, color: "#10b981" },
                { label: "Workers", value: "4", color: "#f59e0b" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    className="text-2xl font-mono font-bold tabular-nums"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <section className="px-6 md:px-8 py-12 max-w-7xl mx-auto space-y-12">
        {/* Worker grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
            <Cpu size={16} className="text-cyan-400" />
            <h2 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-widest">
              Parallel Workers
            </h2>
            <div
              className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                background: "rgba(16,185,129,0.1)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </div>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
          >
            {WORKERS.map((w) => (
              <WorkerCard key={w.id} worker={w} />
            ))}
          </motion.div>
        </motion.div>

        {/* Test suites */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <Layers size={16} className="text-emerald-400" />
              <h2 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-widest">
                Test Suites — Veridat Platform
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {(["all", "passed", "failed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="text-[10px] font-mono px-3 py-1 rounded transition-all"
                  style={{
                    background:
                      activeFilter === f
                        ? f === "failed"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(16,185,129,0.15)"
                        : "transparent",
                    color:
                      activeFilter === f
                        ? f === "failed"
                          ? "#ef4444"
                          : "#10b981"
                        : "#52525b",
                    border: `1px solid ${
                      activeFilter === f
                        ? f === "failed"
                          ? "rgba(239,68,68,0.3)"
                          : "rgba(16,185,129,0.3)"
                        : "transparent"
                    }`,
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerContainer} className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredSuites.map((suite, i) => (
                <SuiteRow key={suite.id} suite={suite} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Terminal */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
            <Terminal size={16} className="text-emerald-400" />
            <h2 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-widest">
              Live Execution Log
            </h2>
            <span className="text-[10px] font-mono text-zinc-600">
              Playwright v1.44.0 · Veridat QA Suite
            </span>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <AdvancedTerminal />
          </motion.div>
        </motion.div>

        {/* Summary stats */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            {
              label: "Authentication & OTP",
              value: "48/51",
              sub: "tests passing",
              color: "#10b981",
              icon: CheckCircle,
            },
            {
              label: "API Contract Tests",
              value: "134/141",
              sub: "7 failures",
              color: "#ef4444",
              icon: XCircle,
            },
            {
              label: "Stripe & KYC Flows",
              value: "29/30",
              sub: "1 failure",
              color: "#f59e0b",
              icon: AlertTriangle,
            },
            {
              label: "Security & RBAC",
              value: "22/22",
              sub: "all passing",
              color: "#10b981",
              icon: CheckCircle,
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              variants={scaleIn}
              className="p-4 rounded-lg"
              style={{
                background: "rgba(9,9,11,0.8)",
                border: `1px solid ${card.color}25`,
                boxShadow: `0 0 20px ${card.color}08`,
              }}
            >
              <card.icon size={20} style={{ color: card.color }} className="mb-3" />
              <div
                className="text-2xl font-mono font-bold tabular-nums mb-1"
                style={{ color: card.color }}
              >
                {card.value}
              </div>
              <div className="text-xs font-mono text-zinc-400 mb-0.5">{card.label}</div>
              <div className="text-[10px] font-mono text-zinc-600">{card.sub}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
