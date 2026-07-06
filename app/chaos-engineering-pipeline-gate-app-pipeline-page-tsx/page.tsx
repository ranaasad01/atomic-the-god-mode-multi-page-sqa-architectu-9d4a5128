"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Activity, AlertTriangle, Check, CheckCircle, ChevronDown, ChevronRight, Circle, Clock, FileCode, GitBranch, Lock, Terminal, X, Zap, Shield, Cpu, Database, Network, AlertCircle, Play, Square, RotateCcw, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { motion as m } from "framer-motion";
import { fadeInUp, fadeIn, staggerContainer, scaleIn, slideInLeft, slideInRight } from "@/lib/motion";

// ─── Types ───────────────────────────────────────────────────────────────────

type StageStatus = "idle" | "running" | "passed" | "failed" | "skipped";
type FaultType = "network-partition" | "cpu-spike" | "memory-leak" | "disk-io" | "pod-kill" | "latency-inject";
type Severity = "low" | "medium" | "high" | "critical";

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  status: StageStatus;
  duration: number | null;
  tests: number;
  passed: number;
  failed: number;
  coverage?: number;
}

interface ChaosEvent {
  id: string;
  type: FaultType;
  severity: Severity;
  target: string;
  startedAt: string;
  duration: number;
  status: "active" | "resolved" | "pending";
  impact: string;
}

interface GateRule {
  id: string;
  name: string;
  condition: string;
  threshold: string;
  currentValue: string;
  status: "pass" | "fail" | "warn";
  blocking: boolean;
}

interface TerminalLine {
  id: number;
  ts: string;
  level: "info" | "warn" | "error" | "success";
  msg: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_STAGES: PipelineStage[] = [
  {
    id: "lint",
    label: "Lint & Format",
    icon: <FileCode size={14} />,
    color: "#06b6d4",
    status: "passed",
    duration: 12,
    tests: 0,
    passed: 0,
    failed: 0,
  },
  {
    id: "unit",
    label: "Functional Unit Tests",
    icon: <Check size={14} />,
    color: "#10b981",
    status: "passed",
    duration: 48,
    tests: 2847,
    passed: 2841,
    failed: 6,
    coverage: 94.2,
  },
  {
    id: "mutation",
    label: "Regression Analysis",
    icon: <Activity size={14} />,
    color: "#f59e0b",
    status: "passed",
    duration: 187,
    tests: 2847,
    passed: 2563,
    failed: 284,
    coverage: 90.0,
  },
  {
    id: "integration",
    label: "API Integration (Postman)",
    icon: <GitBranch size={14} />,
    color: "#06b6d4",
    status: "running",
    duration: null,
    tests: 412,
    passed: 389,
    failed: 0,
    coverage: 88.7,
  },
  {
    id: "e2e",
    label: "E2E Playwright — Veridat",
    icon: <Terminal size={14} />,
    color: "#10b981",
    status: "idle",
    duration: null,
    tests: 0,
    passed: 0,
    failed: 0,
  },
  {
    id: "security",
    label: "Auth & RBAC Security Scan",
    icon: <Lock size={14} />,
    color: "#ef4444",
    status: "idle",
    duration: null,
    tests: 0,
    passed: 0,
    failed: 0,
  },
];

const CHAOS_EVENTS: ChaosEvent[] = [
  {
    id: "ce-001",
    type: "network-partition",
    severity: "critical",
    target: "Veridat API Gateway",
    startedAt: "14:22:07",
    duration: 30,
    status: "resolved",
    impact: "Dataset upload timeout — validating retry logic",
  },
  {
    id: "ce-002",
    type: "latency-inject",
    severity: "high",
    target: "Stripe Payment Service",
    startedAt: "14:31:44",
    duration: 60,
    status: "active",
    impact: "KYC verification delay — testing timeout handling",
  },
  {
    id: "ce-003",
    type: "cpu-spike",
    severity: "medium",
    target: "Desktop App Runner (macOS)",
    startedAt: "14:38:12",
    duration: 45,
    status: "active",
    impact: "Cross-platform stability under CPU stress",
  },
  {
    id: "ce-004",
    type: "memory-leak",
    severity: "high",
    target: "Chat WebSocket Service",
    startedAt: "14:45:00",
    duration: 15,
    status: "pending",
    impact: "Real-time message persistence under memory pressure",
  },
];

const GATE_RULES: GateRule[] = [
  {
    id: "gr-001",
    name: "Pass Rate",
    condition: "Pass Rate ≥ 95%",
    threshold: "95%",
    currentValue: "97.2%",
    status: "pass",
    blocking: true,
  },
  {
    id: "gr-002",
    name: "API Response Time",
    condition: "API Response Time < 500ms",
    threshold: "500ms",
    currentValue: "142ms",
    status: "pass",
    blocking: true,
  },
  {
    id: "gr-003",
    name: "Auth Failures",
    condition: "Zero Critical Auth Failures",
    threshold: "0",
    currentValue: "0",
    status: "pass",
    blocking: true,
  },
  {
    id: "gr-004",
    name: "Cross-Platform Coverage",
    condition: "Cross-Platform Coverage Complete",
    threshold: "PASS",
    currentValue: "PASS",
    status: "pass",
    blocking: false,
  },
];

const INITIAL_TERMINAL: TerminalLine[] = [
  { id: 1, ts: "14:20:01", level: "info", msg: "[PIPELINE] Initializing QA gate — Veridat platform build #4821" },
  { id: 2, ts: "14:20:03", level: "success", msg: "[LINT] ESLint + Prettier checks passed — 0 violations" },
  { id: 3, ts: "14:20:51", level: "success", msg: "[UNIT] Functional tests complete — 2841/2847 passed" },
  { id: 4, ts: "14:23:18", level: "success", msg: "[REGRESSION] Analysis complete — coverage 90.0%" },
  { id: 5, ts: "14:23:19", level: "info", msg: "[API] Postman collection executing — 412 requests queued" },
  { id: 6, ts: "14:31:44", level: "warn", msg: "[CHAOS] Latency inject → Stripe Payment Service — KYC delay detected" },
  { id: 7, ts: "14:38:12", level: "warn", msg: "[CHAOS] CPU spike → Desktop App Runner (macOS) — monitoring stability" },
  { id: 8, ts: "14:45:00", level: "warn", msg: "[CHAOS] Memory leak → Chat WebSocket Service — persistence test active" },
  { id: 9, ts: "14:45:01", level: "info", msg: "[E2E] Playwright queued — Veridat end-to-end suite pending API gate" },
  { id: 10, ts: "14:45:02", level: "info", msg: "[SECURITY] Auth & RBAC scan scheduled — awaiting E2E completion" },
];

const EXTRA_TERMINAL: TerminalLine[] = [
  { id: 11, ts: "14:45:10", level: "info", msg: "[API] Validating dataset upload endpoints — large file handling" },
  { id: 12, ts: "14:45:14", level: "success", msg: "[API] Google Drive import flow — 200 OK (138ms)" },
  { id: 13, ts: "14:45:18", level: "success", msg: "[API] OneDrive cloud import — 200 OK (161ms)" },
  { id: 14, ts: "14:45:22", level: "warn", msg: "[API] Malware scan endpoint — elevated response time 487ms" },
  { id: 15, ts: "14:45:30", level: "success", msg: "[API] Stripe KYC onboarding flow — buyer verification passed" },
  { id: 16, ts: "14:45:35", level: "success", msg: "[API] OTP verification endpoint — session token valid" },
  { id: 17, ts: "14:45:40", level: "info", msg: "[API] Role-based access control — admin panel routes validated" },
  { id: 18, ts: "14:45:45", level: "success", msg: "[API] Real-time chat WebSocket — message ordering confirmed" },
  { id: 19, ts: "14:45:50", level: "success", msg: "[API] Encryption/decryption flow — dataset integrity verified" },
  { id: 20, ts: "14:45:55", level: "info", msg: "[E2E] Playwright launching — Veridat platform full suite" },
];

// ─── Store (inline mock — mirrors real Zustand shape) ─────────────────────────

function useMetricsStore() {
  const [systemHealth, setSystemHealth] = useState(94.7);
  const [p99Latency, setP99Latency] = useState(142);
  const [passedCount, setPassedCount] = useState(8421);
  const [failedCount, setFailedCount] = useState(37);
  const [isFaultInjected, setIsFaultInjected] = useState(false);
  const [faultIntensity, setFaultIntensity] = useState(0);

  const triggerChaosEvent = useCallback((intensity: number) => {
    setFaultIntensity(intensity);
    setIsFaultInjected(true);
    setSystemHealth((h) => Math.max(20, h - intensity * 0.4));
    setP99Latency((l) => Math.min(9999, l + intensity * 12));
    setFailedCount((c) => c + Math.floor(intensity * 0.3));
    setTimeout(() => {
      setIsFaultInjected(false);
      setSystemHealth((h) => Math.min(99, h + intensity * 0.15));
      setP99Latency((l) => Math.max(80, l - intensity * 6));
    }, 4000);
  }, []);

  const injectFault = useCallback((type: string) => {
    setIsFaultInjected(true);
    setSystemHealth((h) => Math.max(15, h - 18));
    setP99Latency((l) => Math.min(9999, l + 380));
    setFailedCount((c) => c + 12);
    setTimeout(() => {
      setIsFaultInjected(false);
      setSystemHealth((h) => Math.min(99, h + 10));
      setP99Latency((l) => Math.max(80, l - 200));
    }, 5000);
  }, []);

  return {
    systemHealth,
    p99Latency,
    passedCount,
    failedCount,
    isFaultInjected,
    faultIntensity,
    triggerChaosEvent,
    injectFault,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTs(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  return `${h}:${min}:${s}`;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const SEVERITY_BG: Record<string, string> = {
  low: "rgba(16,185,129,0.08)",
  medium: "rgba(245,158,11,0.08)",
  high: "rgba(249,115,22,0.08)",
  critical: "rgba(239,68,68,0.08)",
};

const STATUS_COLORS: Record<StageStatus, string> = {
  idle: "#3f3f46",
  running: "#f59e0b",
  passed: "#10b981",
  failed: "#ef4444",
  skipped: "#6b7280",
};

const TERMINAL_COLORS: Record<string, string> = {
  info: "#06b6d4",
  warn: "#f59e0b",
  error: "#ef4444",
  success: "#10b981",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StageNode({ stage, index, isActive }: { stage: PipelineStage; index: number; isActive: boolean }) {
  const statusColor = STATUS_COLORS[stage.status];
  const isRunning = stage.status === "running";

  return (
    <motion.div
      variants={scaleIn}
      className="flex flex-col items-center gap-2 relative"
    >
      {/* Connector line */}
      {index > 0 && (
        <div
          className="absolute left-0 top-6 w-full h-px -translate-x-1/2"
          style={{
            background: `linear-gradient(90deg, ${statusColor}40, ${statusColor}20)`,
            width: "calc(100% + 1rem)",
            left: "-50%",
          }}
        />
      )}

      {/* Node circle */}
      <motion.div
        className="relative w-12 h-12 rounded-full flex items-center justify-center border-2 z-10"
        style={{
          borderColor: statusColor,
          backgroundColor: `${statusColor}15`,
          boxShadow: isRunning ? `0 0 20px ${statusColor}60` : `0 0 8px ${statusColor}30`,
        }}
        animate={isRunning ? { scale: [1, 1.08, 1], opacity: [1, 0.8, 1] } : {}}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span style={{ color: statusColor }}>{stage.icon}</span>
        {isRunning && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: statusColor }}
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Label */}
      <div className="text-center">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: statusColor }}>
          {stage.label}
        </div>
        <div className="text-[9px] font-mono text-zinc-600 mt-0.5">
          {stage.status === "running" ? "IN PROGRESS" : stage.status.toUpperCase()}
        </div>
        {stage.duration !== null && (
          <div className="text-[9px] font-mono text-zinc-500">{stage.duration}s</div>
        )}
      </div>
    </motion.div>
  );
}

function ChaosEventCard({ event }: { event: ChaosEvent }) {
  const sevColor = SEVERITY_COLORS[event.severity];
  const sevBg = SEVERITY_BG[event.severity];

  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-lg border p-3 font-mono"
      style={{
        borderColor: `${sevColor}30`,
        backgroundColor: sevBg,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: sevColor, boxShadow: `0 0 6px ${sevColor}` }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: sevColor }}>
            {event.type.replace("-", " ")}
          </span>
        </div>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider"
          style={{
            color: event.status === "active" ? "#f59e0b" : event.status === "resolved" ? "#10b981" : "#6b7280",
            borderColor: event.status === "active" ? "#f59e0b40" : event.status === "resolved" ? "#10b98140" : "#6b728040",
            backgroundColor: event.status === "active" ? "#f59e0b10" : event.status === "resolved" ? "#10b98110" : "#6b728010",
          }}
        >
          {event.status}
        </span>
      </div>
      <div className="text-[11px] text-zinc-300 mb-1">
        <span className="text-zinc-500">TARGET: </span>{event.target}
      </div>
      <div className="text-[10px] text-zinc-500 mb-2">{event.impact}</div>
      <div className="flex items-center justify-between text-[9px] text-zinc-600">
        <span>{event.startedAt}</span>
        <span>{event.duration}s duration</span>
      </div>
    </motion.div>
  );
}

function GateRuleRow({ rule }: { rule: GateRule }) {
  const statusColor = rule.status === "pass" ? "#10b981" : rule.status === "warn" ? "#f59e0b" : "#ef4444";

  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-center justify-between py-2.5 border-b font-mono"
      style={{ borderColor: "rgba(63,63,70,0.4)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
        />
        <div>
          <div className="text-[11px] text-zinc-300">{rule.condition}</div>
          {rule.blocking && (
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider">BLOCKING GATE</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold tabular-nums" style={{ color: statusColor }}>
          {rule.currentValue}
        </span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded border uppercase"
          style={{
            color: statusColor,
            borderColor: `${statusColor}40`,
            backgroundColor: `${statusColor}10`,
          }}
        >
          {rule.status}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChaosEngineeringPage() {
  const metrics = useMetricsStore();
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [chaosEvents, setChaosEvents] = useState<ChaosEvent[]>(CHAOS_EVENTS);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(INITIAL_TERMINAL);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [sliders, setSliders] = useState({
    packetLoss: 0,
    jitterMs: 0,
    cpuStarvation: 0,
    memoryStarvation: 0,
  });
  const [activeTab, setActiveTab] = useState<"pipeline" | "chaos" | "gates">("pipeline");
  const terminalRef = useRef<HTMLDivElement>(null);
  const extraLineIdx = useRef(0);
  const lineCounter = useRef(INITIAL_TERMINAL.length + 1);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Stream extra terminal lines
  useEffect(() => {
    const id = setInterval(() => {
      if (extraLineIdx.current < EXTRA_TERMINAL.length) {
        const line = EXTRA_TERMINAL[extraLineIdx.current];
        setTerminalLines((prev) => [
          ...prev.slice(-60),
          { ...line, id: lineCounter.current++, ts: formatTs(new Date()) },
        ]);
        extraLineIdx.current++;
      }
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // Pipeline run simulation
  const handleRunPipeline = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setRunProgress(0);

    const stageOrder = ["lint", "unit", "mutation", "integration", "e2e", "security"];
    let stageIdx = 0;

    setStages((prev) =>
      prev.map((s) => ({ ...s, status: "idle" as StageStatus }))
    );

    const advance = () => {
      if (stageIdx >= stageOrder.length) {
        setIsRunning(false);
        setRunProgress(100);
        return;
      }

      const currentId = stageOrder[stageIdx];
      setStages((prev) =>
        prev.map((s) =>
          s.id === currentId ? { ...s, status: "running" as StageStatus } : s
        )
      );

      const duration = 1500 + Math.random() * 2000;
      setTimeout(() => {
        const passed = Math.random() > 0.12;
        setStages((prev) =>
          prev.map((s) =>
            s.id === currentId
              ? { ...s, status: passed ? "passed" : "failed", duration: Math.round(duration / 100) }
              : s
          )
        );
        setRunProgress(Math.round(((stageIdx + 1) / stageOrder.length) * 100));
        stageIdx++;
        if (passed) advance();
        else {
          setIsRunning(false);
          setTerminalLines((prev) => [
            ...prev,
            {
              id: lineCounter.current++,
              ts: formatTs(new Date()),
              level: "error",
              msg: `[GATE FAIL] Stage "${currentId}" failed — pipeline halted`,
            },
          ]);
        }
      }, duration);
    };

    advance();
  }, [isRunning]);

  // Slider change handler
  const handleSliderChange = useCallback(
    (key: keyof typeof sliders, value: number) => {
      setSliders((prev) => ({ ...prev, [key]: value }));
      const intensity = Math.round(value / 10);
      if (intensity > 0) {
        metrics.triggerChaosEvent(intensity);
        setTerminalLines((prev) => [
          ...prev.slice(-60),
          {
            id: lineCounter.current++,
            ts: formatTs(new Date()),
            level: "warn",
            msg: `[CHAOS] ${key} set to ${value}${key.includes("Ms") ? "ms" : "%"} — fault intensity ${intensity}/10`,
          },
        ]);
      }
    },
    [metrics]
  );

  const handleInjectFault = useCallback(
    (type: string) => {
      metrics.injectFault(type);
      const newEvent: ChaosEvent = {
        id: `ce-${Date.now()}`,
        type: type as FaultType,
        severity: "critical",
        target: type === "network-partition" ? "Veridat API Gateway" : type === "latency-inject" ? "Stripe Payment Service" : type === "cpu-spike" ? "Desktop App Runner (macOS)" : "Chat WebSocket Service",
        startedAt: formatTs(new Date()),
        duration: 30,
        status: "active",
        impact: type === "network-partition" ? "Dataset upload timeout — validating retry logic" : type === "latency-inject" ? "KYC verification delay — testing timeout handling" : type === "cpu-spike" ? "Cross-platform stability under CPU stress" : "Real-time message persistence under memory pressure",
      };
      setChaosEvents((prev) => [newEvent, ...prev.slice(0, 7)]);
      setTerminalLines((prev) => [
        ...prev.slice(-60),
        {
          id: lineCounter.current++,
          ts: formatTs(new Date()),
          level: "error",
          msg: `[FAULT INJECT] ${type} → ${newEvent.target} — CRITICAL`,
        },
      ]);
    },
    [metrics]
  );

  const healthColor =
    metrics.systemHealth > 80 ? "#10b981" : metrics.systemHealth > 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen bg-[#030303] text-emerald-400 font-mono">
      {/* Header */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="px-6 pt-8 pb-6 border-b"
        style={{ borderColor: "rgba(16,185,129,0.1)" }}
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #10b981" }} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">QA Pipeline Gate</span>
          </div>
          <div className="h-px flex-1" style={{ background: "rgba(16,185,129,0.15)" }} />
          <span className="text-[10px] text-zinc-600">Veridat Platform — Build #4821</span>
        </motion.div>
        <motion.h1 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-white mb-1">
          Chaos Engineering{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            & Pipeline Gate
          </span>
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-sm text-zinc-500 max-w-2xl">
          Real-time fault injection and quality gate enforcement for the Veridat data marketplace platform.
          Playwright E2E, Postman API validation, Auth & RBAC security scanning.
        </motion.p>

        {/* Live metrics strip */}
        <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 mt-4">
          {[
            { label: "System Health", value: `${metrics.systemHealth.toFixed(1)}%`, color: healthColor },
            { label: "P99 Latency", value: `${metrics.p99Latency}ms`, color: metrics.p99Latency > 500 ? "#ef4444" : "#06b6d4" },
            { label: "Passed", value: metrics.passedCount.toLocaleString("en-US"), color: "#10b981" },
            { label: "Failed", value: metrics.failedCount.toLocaleString("en-US"), color: "#ef4444" },
            { label: "Fault Active", value: metrics.isFaultInjected ? "YES" : "NO", color: metrics.isFaultInjected ? "#ef4444" : "#10b981" },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{m.label}:</span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: m.color }}>{m.value}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="px-6 py-6 space-y-6">
        {/* Tab navigation */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="flex gap-1 p-1 rounded-lg border"
          style={{ borderColor: "rgba(63,63,70,0.4)", backgroundColor: "rgba(9,9,11,0.6)" }}
        >
          {(["pipeline", "chaos", "gates"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 px-3 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider transition-all duration-200"
              style={{
                backgroundColor: activeTab === tab ? "rgba(16,185,129,0.15)" : "transparent",
                color: activeTab === tab ? "#10b981" : "#52525b",
                border: activeTab === tab ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
              }}
            >
              {tab === "pipeline" ? "Pipeline" : tab === "chaos" ? "Chaos Events" : "Gate Rules"}
            </button>
          ))}
        </motion.div>

        {/* Pipeline tab */}
        <AnimatePresence mode="wait">
          {activeTab === "pipeline" && (
            <motion.div
              key="pipeline"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Pipeline stages */}
              <motion.div
                variants={scaleIn}
                className="rounded-xl border p-6"
                style={{
                  borderColor: "rgba(16,185,129,0.15)",
                  backgroundColor: "rgba(9,9,11,0.8)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">QA Pipeline</h2>
                    <p className="text-[10px] text-zinc-600 mt-0.5">Veridat Platform — 6-Stage Quality Gate</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isRunning && (
                      <div className="flex items-center gap-1.5">
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-amber-400"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                        <span className="text-[10px] text-amber-400 uppercase tracking-wider">Running {runProgress}%</span>
                      </div>
                    )}
                    <button
                      onClick={handleRunPipeline}
                      disabled={isRunning}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
                      style={{
                        backgroundColor: isRunning ? "rgba(63,63,70,0.3)" : "rgba(16,185,129,0.15)",
                        color: isRunning ? "#52525b" : "#10b981",
                        border: `1px solid ${isRunning ? "rgba(63,63,70,0.3)" : "rgba(16,185,129,0.3)"}`,
                      }}
                    >
                      <Play size={10} />
                      Run Pipeline
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {runProgress > 0 && (
                  <div className="mb-6">
                    <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #10b981, #06b6d4)" }}
                        animate={{ width: `${runProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Stage nodes */}
                <motion.div
                  variants={staggerContainer}
                  className="grid grid-cols-3 md:grid-cols-6 gap-4"
                >
                  {stages.map((stage, i) => (
                    <StageNode key={stage.id} stage={stage} index={i} isActive={stage.status === "running"} />
                  ))}
                </motion.div>

                {/* Stage details */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stages.filter((s) => s.tests > 0).map((stage) => (
                    <motion.div
                      key={stage.id}
                      variants={fadeInUp}
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: `${STATUS_COLORS[stage.status]}25`,
                        backgroundColor: `${STATUS_COLORS[stage.status]}08`,
                      }}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: STATUS_COLORS[stage.status] }}>
                        {stage.label}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-600">Tests</span>
                          <span className="text-zinc-300 tabular-nums">{stage.tests.toLocaleString("en-US")}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-600">Passed</span>
                          <span className="text-emerald-400 tabular-nums">{stage.passed.toLocaleString("en-US")}</span>
                        </div>
                        {stage.failed > 0 && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-600">Failed</span>
                            <span className="text-red-400 tabular-nums">{stage.failed.toLocaleString("en-US")}</span>
                          </div>
                        )}
                        {stage.coverage !== undefined && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-600">Coverage</span>
                            <span className="text-cyan-400 tabular-nums">{stage.coverage}%</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Terminal */}
              <motion.div
                variants={scaleIn}
                className="rounded-xl border overflow-hidden"
                style={{
                  borderColor: "rgba(16,185,129,0.15)",
                  backgroundColor: "rgba(9,9,11,0.9)",
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2.5 border-b"
                  style={{ borderColor: "rgba(16,185,129,0.1)" }}
                >
                  <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Pipeline Log</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <span className="text-[9px] text-zinc-600">LIVE</span>
                  </div>
                </div>
                <div
                  ref={terminalRef}
                  className="h-48 overflow-y-auto p-4 space-y-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {terminalLines.map((line) => (
                    <motion.div
                      key={line.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-2 text-[10px]"
                    >
                      <span className="text-zinc-700 flex-shrink-0 tabular-nums">{line.ts}</span>
                      <span
                        className="flex-1"
                        style={{ color: TERMINAL_COLORS[line.level] }}
                      >
                        {line.msg}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Chaos tab */}
          {activeTab === "chaos" && (
            <motion.div
              key="chaos"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Chaos Control Panel */}
              <motion.div
                variants={scaleIn}
                className="rounded-xl border p-6"
                style={{
                  borderColor: "rgba(239,68,68,0.2)",
                  backgroundColor: "rgba(9,9,11,0.8)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
                  >
                    <Zap size={14} className="text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Chaos Control Panel</h2>
                    <p className="text-[10px] text-zinc-600">Inject faults into Veridat platform services</p>
                  </div>
                </div>

                {/* Network throttle sliders */}
                <div className="space-y-5 mb-6">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b pb-2" style={{ borderColor: "rgba(63,63,70,0.4)" }}>
                    Network Throttle
                  </div>
                  {[
                    { key: "packetLoss" as const, label: "Packet Loss", unit: "%", max: 100, color: "#ef4444" },
                    { key: "jitterMs" as const, label: "Jitter", unit: "ms", max: 500, color: "#f59e0b" },
                  ].map((slider) => (
                    <div key={slider.key}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] text-zinc-400">{slider.label}</span>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: slider.color }}>
                          {sliders[slider.key]}{slider.unit}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min={0}
                          max={slider.max}
                          value={sliders[slider.key]}
                          onChange={(e) => handleSliderChange(slider.key, Number(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(90deg, ${slider.color} ${(sliders[slider.key] / slider.max) * 100}%, rgba(63,63,70,0.4) ${(sliders[slider.key] / slider.max) * 100}%)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b pb-2 mt-4" style={{ borderColor: "rgba(63,63,70,0.4)" }}>
                    Server Stress
                  </div>
                  {[
                    { key: "cpuStarvation" as const, label: "CPU Starvation", unit: "%", max: 100, color: "#f97316" },
                    { key: "memoryStarvation" as const, label: "Memory Starvation", unit: "%", max: 100, color: "#a855f7" },
                  ].map((slider) => (
                    <div key={slider.key}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] text-zinc-400">{slider.label}</span>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: slider.color }}>
                          {sliders[slider.key]}{slider.unit}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min={0}
                          max={slider.max}
                          value={sliders[slider.key]}
                          onChange={(e) => handleSliderChange(slider.key, Number(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(90deg, ${slider.color} ${(sliders[slider.key] / slider.max) * 100}%, rgba(63,63,70,0.4) ${(sliders[slider.key] / slider.max) * 100}%)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick inject buttons */}
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Quick Fault Injection</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: "network-partition", label: "Network Partition", color: "#ef4444", target: "Veridat API Gateway" },
                      { type: "latency-inject", label: "Latency Inject", color: "#f59e0b", target: "Stripe Payment" },
                      { type: "cpu-spike", label: "CPU Spike", color: "#f97316", target: "Desktop Runner" },
                      { type: "memory-leak", label: "Memory Leak", color: "#a855f7", target: "Chat WebSocket" },
                    ].map((fault) => (
                      <button
                        key={fault.type}
                        onClick={() => handleInjectFault(fault.type)}
                        className="flex flex-col items-start p-3 rounded-lg border text-left transition-all duration-200 hover:scale-[1.02]"
                        style={{
                          borderColor: `${fault.color}30`,
                          backgroundColor: `${fault.color}08`,
                        }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: fault.color }}>
                          {fault.label}
                        </span>
                        <span className="text-[9px] text-zinc-600 mt-0.5">{fault.target}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Chaos events list */}
              <motion.div
                variants={scaleIn}
                className="rounded-xl border p-6"
                style={{
                  borderColor: "rgba(16,185,129,0.15)",
                  backgroundColor: "rgba(9,9,11,0.8)",
                }}
              >
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Active Chaos Events</h2>
                <motion.div variants={staggerContainer} className="space-y-3">
                  {chaosEvents.map((event) => (
                    <ChaosEventCard key={event.id} event={event} />
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Gates tab */}
          {activeTab === "gates" && (
            <motion.div
              key="gates"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <motion.div
                variants={scaleIn}
                className="rounded-xl border p-6"
                style={{
                  borderColor: "rgba(16,185,129,0.15)",
                  backgroundColor: "rgba(9,9,11,0.8)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Quality Gate Rules</h2>
                    <p className="text-[10px] text-zinc-600 mt-0.5">Rao Muhammad Ali — QA Standards for Veridat Platform</p>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border"
                    style={{ borderColor: "rgba(16,185,129,0.3)", backgroundColor: "rgba(16,185,129,0.08)" }}
                  >
                    <CheckCircle size={10} className="text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-bold">ALL GATES PASSING</span>
                  </div>
                </div>

                <motion.div variants={staggerContainer} className="space-y-1">
                  {GATE_RULES.map((rule) => (
                    <GateRuleRow key={rule.id} rule={rule} />
                  ))}
                </motion.div>

                {/* Summary */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Pass Rate", value: "97.2%", color: "#10b981", sub: "Target ≥ 95%" },
                    { label: "API Response", value: "142ms", color: "#06b6d4", sub: "Target < 500ms" },
                    { label: "Auth Failures", value: "0", color: "#10b981", sub: "Zero tolerance" },
                    { label: "Platform Coverage", value: "PASS", color: "#10b981", sub: "macOS · Linux · Windows" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg border p-3 text-center"
                      style={{
                        borderColor: `${stat.color}25`,
                        backgroundColor: `${stat.color}08`,
                      }}
                    >
                      <div className="text-lg font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{stat.label}</div>
                      <div className="text-[9px] text-zinc-600 mt-0.5">{stat.sub}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* QA Engineer context */}
              <motion.div
                variants={scaleIn}
                className="rounded-xl border p-6"
                style={{
                  borderColor: "rgba(6,182,212,0.15)",
                  backgroundColor: "rgba(9,9,11,0.8)",
                }}
              >
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">QA Engineer Context</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest border-b pb-2" style={{ borderColor: "rgba(63,63,70,0.4)" }}>Platform Under Test</div>
                    {[
                      { label: "Platform", value: "Veridat Data Marketplace" },
                      { label: "URL", value: "veridat-demo.daticsai.com" },
                      { label: "Modules", value: "Web · Desktop · Admin Panel" },
                      { label: "Automation", value: "Playwright (critical flows)" },
                      { label: "Issue Tracker", value: "ClickUp" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-[11px]">
                        <span className="text-zinc-600">{item.label}</span>
                        <span className="text-zinc-300">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest border-b pb-2" style={{ borderColor: "rgba(63,63,70,0.4)" }}>Test Coverage Areas</div>
                    {[
                      "Dataset upload & cloud imports (GDrive, OneDrive)",
                      "Malware scanning & encryption/decryption flows",
                      "Stripe payment & KYC onboarding flows",
                      "OTP verification & session handling",
                      "Role-based access control (RBAC)",
                      "Real-time chat — message ordering & persistence",
                    ].map((area) => (
                      <div key={area} className="flex items-start gap-2 text-[10px]">
                        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <span className="text-zinc-400">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
