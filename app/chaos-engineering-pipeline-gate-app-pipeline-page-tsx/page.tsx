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
    label: "Unit Tests",
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
    label: "Mutation Score",
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
    label: "Integration",
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
    label: "E2E Playwright",
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
    label: "OWASP Security",
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
    target: "api-gateway-pod-3",
    startedAt: "14:22:07",
    duration: 30,
    status: "resolved",
    impact: "P99 latency spiked to 847ms, 3 retries triggered",
  },
  {
    id: "ce-002",
    type: "cpu-spike",
    severity: "high",
    target: "test-runner-node-2",
    startedAt: "14:31:44",
    duration: 60,
    status: "active",
    impact: "CPU at 94%, test throughput degraded 38%",
  },
  {
    id: "ce-003",
    type: "latency-inject",
    severity: "medium",
    target: "postgres-primary",
    startedAt: "14:38:12",
    duration: 45,
    status: "active",
    impact: "DB query latency +200ms, connection pool pressure",
  },
  {
    id: "ce-004",
    type: "pod-kill",
    severity: "high",
    target: "worker-shard-7",
    startedAt: "14:45:00",
    duration: 15,
    status: "pending",
    impact: "Scheduled: validate graceful failover",
  },
  {
    id: "ce-005",
    type: "memory-leak",
    severity: "medium",
    target: "cache-layer-redis",
    startedAt: "14:18:33",
    duration: 120,
    status: "resolved",
    impact: "Memory climbed to 87%, eviction policy triggered",
  },
];

const GATE_RULES: GateRule[] = [
  {
    id: "gr-001",
    name: "Unit Test Pass Rate",
    condition: ">=",
    threshold: "95%",
    currentValue: "99.8%",
    status: "pass",
    blocking: true,
  },
  {
    id: "gr-002",
    name: "Code Coverage",
    condition: ">=",
    threshold: "90%",
    currentValue: "94.2%",
    status: "pass",
    blocking: true,
  },
  {
    id: "gr-003",
    name: "Mutation Score",
    condition: ">=",
    threshold: "85%",
    currentValue: "90.0%",
    status: "pass",
    blocking: true,
  },
  {
    id: "gr-004",
    name: "P99 Latency",
    condition: "<=",
    threshold: "500ms",
    currentValue: "142ms",
    status: "pass",
    blocking: true,
  },
  {
    id: "gr-005",
    name: "Critical Vulnerabilities",
    condition: "==",
    threshold: "0",
    currentValue: "0",
    status: "pass",
    blocking: true,
  },
  {
    id: "gr-006",
    name: "Flakiness Index",
    condition: "<=",
    threshold: "2%",
    currentValue: "3.1%",
    status: "fail",
    blocking: false,
  },
  {
    id: "gr-007",
    name: "Bundle Size Delta",
    condition: "<=",
    threshold: "+5%",
    currentValue: "+1.2%",
    status: "pass",
    blocking: false,
  },
  {
    id: "gr-008",
    name: "Accessibility Score",
    condition: ">=",
    threshold: "90",
    currentValue: "87",
    status: "warn",
    blocking: false,
  },
];

const FAULT_TYPES: { type: FaultType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: "network-partition",
    label: "Network Partition",
    icon: <Network size={16} />,
    description: "Simulate network split between service pods",
  },
  {
    type: "cpu-spike",
    label: "CPU Spike",
    icon: <Cpu size={16} />,
    description: "Inject 90% CPU load on target node",
  },
  {
    type: "memory-leak",
    label: "Memory Leak",
    icon: <Database size={16} />,
    description: "Gradually consume heap until OOM threshold",
  },
  {
    type: "latency-inject",
    label: "Latency Injection",
    icon: <Clock size={16} />,
    description: "Add 200-800ms jitter to outbound requests",
  },
  {
    type: "pod-kill",
    label: "Pod Kill",
    icon: <Zap size={16} />,
    description: "Terminate a random pod in the target namespace",
  },
  {
    type: "disk-io",
    label: "Disk I/O Saturation",
    icon: <Activity size={16} />,
    description: "Saturate disk I/O to trigger queue buildup",
  },
];

const INITIAL_TERMINAL_LINES: TerminalLine[] = [
  { id: 1, ts: "14:38:01.002", level: "info", msg: "[pipeline] Stage: integration — spawning 8 workers" },
  { id: 2, ts: "14:38:01.114", level: "info", msg: "[worker-1] Connecting to test-db-replica-2:5432" },
  { id: 3, ts: "14:38:01.887", level: "success", msg: "[worker-1] DB connection established (pool: 10/10)" },
  { id: 4, ts: "14:38:02.003", level: "info", msg: "[worker-2] Loading fixture: users.seed.json (2,400 rows)" },
  { id: 5, ts: "14:38:02.441", level: "info", msg: "[chaos] Fault active: latency-inject → postgres-primary +200ms" },
  { id: 6, ts: "14:38:03.112", level: "warn", msg: "[worker-3] Query timeout warning: 480ms (threshold: 500ms)" },
  { id: 7, ts: "14:38:03.889", level: "success", msg: "[worker-1] PASS: POST /api/v2/auth/login → 201 (87ms)" },
  { id: 8, ts: "14:38:04.001", level: "success", msg: "[worker-2] PASS: GET /api/v2/users?page=1 → 200 (142ms)" },
  { id: 9, ts: "14:38:04.334", level: "error", msg: "[worker-4] FAIL: DELETE /api/v2/sessions/:id → 500 (timeout)" },
  { id: 10, ts: "14:38:04.778", level: "info", msg: "[chaos] Resilience check: retry #1 of 3 for worker-4" },
];

const STREAM_LINES = [
  { level: "success" as const, msg: "[worker-1] PASS: GET /api/v2/products?limit=50 → 200 (98ms)" },
  { level: "success" as const, msg: "[worker-2] PASS: POST /api/v2/cart/items → 201 (134ms)" },
  { level: "info" as const, msg: "[worker-5] Executing: checkout.flow.spec.ts — step 3/12" },
  { level: "warn" as const, msg: "[chaos] CPU spike detected on test-runner-node-2: 94%" },
  { level: "success" as const, msg: "[worker-3] PASS: PATCH /api/v2/users/:id → 200 (67ms)" },
  { level: "error" as const, msg: "[worker-6] FAIL: WebSocket connection dropped after 3s" },
  { level: "info" as const, msg: "[worker-7] Assertion: expect(response.body.items).toHaveLength(12)" },
  { level: "success" as const, msg: "[worker-8] PASS: DELETE /api/v2/cart/items/:id → 204 (45ms)" },
  { level: "info" as const, msg: "[pipeline] Progress: 389/412 integration tests complete (94.4%)" },
  { level: "warn" as const, msg: "[worker-4] Retry #2: POST /api/v2/payments → 503 (upstream fault)" },
  { level: "success" as const, msg: "[worker-1] PASS: GET /api/v2/orders?status=pending → 200 (211ms)" },
  { level: "info" as const, msg: "[chaos] Fault resolved: network-partition on api-gateway-pod-3" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const statusColors: Record<StageStatus, string> = {
  idle: "#3f3f46",
  running: "#06b6d4",
  passed: "#10b981",
  failed: "#ef4444",
  skipped: "#f59e0b",
};

const statusIcons: Record<StageStatus, React.ReactNode> = {
  idle: <Circle size={12} />,
  running: <Activity size={12} className="animate-pulse" />,
  passed: <CheckCircle size={12} />,
  failed: <X size={12} />,
  skipped: <ChevronRight size={12} />,
};

const severityColors: Record<Severity, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const levelColors: Record<TerminalLine["level"], string> = {
  info: "#94a3b8",
  warn: "#f59e0b",
  error: "#ef4444",
  success: "#10b981",
};

const pulseVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 14 },
  },
};

const rowVariant: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 100, damping: 18 },
  },
};

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 120;
  const h = height;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPath = `M0,${h} L${pts.split(" ").map((p) => p).join(" L")} L${w},${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Pipeline Stage Card ──────────────────────────────────────────────────────

function StageCard({ stage, index }: { stage: PipelineStage; index: number }) {
  const color = statusColors[stage.status];
  const isRunning = stage.status === "running";

  return (
    <motion.div
      variants={rowVariant}
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative rounded-xl p-4 cursor-default"
      style={{
        background: "rgba(9,9,11,0.7)",
        border: `1px solid ${color}30`,
        boxShadow: isRunning ? `0 0 16px ${color}20` : "none",
      }}
    >
      {isRunning && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ border: `1px solid ${color}60`, borderRadius: "inherit" }}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: stage.color }}>{stage.icon}</span>
          <span className="text-xs font-mono font-semibold text-zinc-200">{stage.label}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color }}>
          {statusIcons[stage.status]}
          <span className="text-[10px] font-mono uppercase tracking-wider">{stage.status}</span>
        </div>
      </div>

      {stage.tests > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>{stage.passed} passed</span>
            {stage.failed > 0 && <span style={{ color: "#ef4444" }}>{stage.failed} failed</span>}
            <span>{stage.tests} total</span>
          </div>
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${stage.tests > 0 ? (stage.passed / stage.tests) * 100 : 0}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
            />
          </div>
          {stage.coverage !== undefined && (
            <div className="text-[10px] font-mono text-zinc-500">
              Coverage: <span style={{ color: stage.color }}>{stage.coverage.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}

      {stage.duration !== null && (
        <div className="mt-2 text-[10px] font-mono text-zinc-600">
          <Clock size={9} className="inline mr-1" />
          {stage.duration}s
        </div>
      )}
    </motion.div>
  );
}

// ─── Chaos Event Row ──────────────────────────────────────────────────────────

function ChaosEventRow({ event }: { event: ChaosEvent }) {
  const [expanded, setExpanded] = useState(false);
  const sevColor = severityColors[event.severity];
  const statusMap = {
    active: { color: "#ef4444", label: "ACTIVE" },
    resolved: { color: "#10b981", label: "RESOLVED" },
    pending: { color: "#f59e0b", label: "PENDING" },
  };
  const st = statusMap[event.status];

  return (
    <motion.div
      variants={rowVariant}
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(9,9,11,0.5)" }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: sevColor, boxShadow: `0 0 6px ${sevColor}` }}
        />
        <span className="text-[10px] font-mono text-zinc-500 w-20 flex-shrink-0">{event.startedAt}</span>
        <span className="text-xs font-mono text-zinc-300 flex-1">{event.type}</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border" style={{ color: sevColor, borderColor: `${sevColor}40`, background: `${sevColor}10` }}>
          {event.severity}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border ml-2" style={{ color: st.color, borderColor: `${st.color}40`, background: `${st.color}10` }}>
          {st.label}
        </span>
        <ChevronDown size={12} className={`text-zinc-600 transition-transform ml-2 ${expanded ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 grid grid-cols-2 gap-3 border-t border-white/5">
              <div>
                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Target</div>
                <div className="text-xs font-mono text-cyan-400">{event.target}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Duration</div>
                <div className="text-xs font-mono text-zinc-300">{event.duration}s</div>
              </div>
              <div className="col-span-2">
                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Impact</div>
                <div className="text-xs font-mono text-zinc-400">{event.impact}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Gate Rule Row ────────────────────────────────────────────────────────────

function GateRuleRow({ rule }: { rule: GateRule }) {
  const colors = { pass: "#10b981", fail: "#ef4444", warn: "#f59e0b" };
  const icons = {
    pass: <CheckCircle size={13} />,
    fail: <X size={13} />,
    warn: <AlertTriangle size={13} />,
  };
  const c = colors[rule.status];

  return (
    <motion.div
      variants={rowVariant}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
      style={{ background: "rgba(9,9,11,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
    >
      <span style={{ color: c }}>{icons[rule.status]}</span>
      <span className="text-xs font-mono text-zinc-300 flex-1">{rule.name}</span>
      <span className="text-[10px] font-mono text-zinc-600">
        {rule.condition} {rule.threshold}
      </span>
      <span className="text-xs font-mono tabular-nums" style={{ color: c }}>
        {rule.currentValue}
      </span>
      {rule.blocking && (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 bg-red-500/10">
          BLOCKING
        </span>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(INITIAL_TERMINAL_LINES);
  const [selectedFault, setSelectedFault] = useState<FaultType>("network-partition");
  const [selectedTarget, setSelectedTarget] = useState("api-gateway-pod-3");
  const [faultDuration, setFaultDuration] = useState("30");
  const [chaosEvents, setChaosEvents] = useState<ChaosEvent[]>(CHAOS_EVENTS);
  const [pipelineRunning, setPipelineRunning] = useState(true);
  const [gateStatus, setGateStatus] = useState<"open" | "blocked" | "evaluating">("evaluating");
  const [sparkData, setSparkData] = useState<number[]>([40, 55, 48, 62, 58, 71, 65, 80, 74, 88, 82, 91, 85, 78, 83]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const lineCounterRef = useRef(11);
  const streamIndexRef = useRef(0);

  // Simulate terminal streaming
  useEffect(() => {
    const id = setInterval(() => {
      const template = STREAM_LINES[streamIndexRef.current % STREAM_LINES.length];
      streamIndexRef.current += 1;
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
      const newLine: TerminalLine = {
        id: lineCounterRef.current++,
        ts,
        level: template.level,
        msg: template.msg,
      };
      setTerminalLines((prev) => {
        const next = [...prev, newLine];
        return next.length > 80 ? next.slice(-80) : next;
      });
    }, 900);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Sparkline update
  useEffect(() => {
    const id = setInterval(() => {
      setSparkData((prev) => {
        const last = prev[prev.length - 1] ?? 70;
        const next = Math.min(100, Math.max(10, last + (Math.random() - 0.45) * 12));
        const arr = [...prev, next];
        return arr.length > 20 ? arr.slice(-20) : arr;
      });
    }, 1200);
    return () => clearInterval(id);
  }, []);

  // Gate evaluation
  useEffect(() => {
    const failCount = GATE_RULES.filter((r) => r.status === "fail" && r.blocking).length;
    if (failCount > 0) {
      setGateStatus("blocked");
    } else {
      const timer = setTimeout(() => setGateStatus("open"), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInjectFault = useCallback(() => {
    const faultDef = FAULT_TYPES.find((f) => f.type === selectedFault);
    const newEvent: ChaosEvent = {
      id: `ce-${Date.now()}`,
      type: selectedFault,
      severity: "high",
      target: selectedTarget || "unknown-target",
      startedAt: (() => {
        const n = new Date();
        return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")}`;
      })(),
      duration: parseInt(faultDuration, 10) || 30,
      status: "active",
      impact: faultDef?.description ?? "Fault injected",
    };
    setChaosEvents((prev) => [newEvent, ...prev]);
  }, [selectedFault, selectedTarget, faultDuration]);

  const handleResetPipeline = useCallback(() => {
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: "idle" as StageStatus, duration: null })));
    setPipelineRunning(false);
    setGateStatus("evaluating");
  }, []);

  const gateColors = {
    open: "#10b981",
    blocked: "#ef4444",
    evaluating: "#f59e0b",
  };
  const gateLabels = {
    open: "GATE OPEN — DEPLOY APPROVED",
    blocked: "GATE BLOCKED — DEPLOY REJECTED",
    evaluating: "EVALUATING QUALITY GATES...",
  };

  const passCount = GATE_RULES.filter((r) => r.status === "pass").length;
  const failCount = GATE_RULES.filter((r) => r.status === "fail").length;
  const warnCount = GATE_RULES.filter((r) => r.status === "warn").length;

  return (
    <main className="min-h-screen text-zinc-100 font-mono" style={{ background: "transparent" }}>
      {/* Page header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="px-6 pt-8 pb-6 border-b border-white/5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-red-400" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Chaos Engineering
              </span>
              <span className="text-zinc-700">/</span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Pipeline Gate
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">
              Chaos Engineering{" "}
              <span className="text-red-400">&amp;</span>{" "}
              Pipeline Gate
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Fault injection, resilience validation, and quality gate enforcement for production deployments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleResetPipeline}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-zinc-400 border border-zinc-700 hover:border-zinc-500 transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPipelineRunning((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono border transition-colors"
              style={{
                background: pipelineRunning ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                borderColor: pipelineRunning ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)",
                color: pipelineRunning ? "#ef4444" : "#10b981",
              }}
            >
              {pipelineRunning ? <Square size={12} /> : <Play size={12} />}
              {pipelineRunning ? "Stop Pipeline" : "Start Pipeline"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="px-6 py-6 space-y-8">
        {/* Quality Gate Banner */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="relative rounded-2xl overflow-hidden"
          style={{
            border: `1px solid ${gateColors[gateStatus]}40`,
            background: `${gateColors[gateStatus]}08`,
          }}
        >
          {gateStatus === "evaluating" && (
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: `linear-gradient(90deg, transparent, ${gateColors[gateStatus]}10, transparent)` }}
            />
          )}
          <div className="relative px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: gateColors[gateStatus],
                  boxShadow: `0 0 12px ${gateColors[gateStatus]}`,
                }}
              />
              <span
                className="text-sm font-mono font-bold tracking-wider"
                style={{ color: gateColors[gateStatus] }}
              >
                {gateLabels[gateStatus]}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-mono font-bold text-emerald-400">{passCount}</div>
                <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono font-bold text-amber-400">{warnCount}</div>
                <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-mono font-bold text-red-400">{failCount}</div>
                <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Failed</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pipeline Stages */}
        <section>
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="flex items-center gap-2 mb-4"
          >
            <GitBranch size={14} className="text-cyan-400" />
            <h2 className="text-sm font-mono font-semibold text-zinc-300 uppercase tracking-widest">
              CI/CD Pipeline Stages
            </h2>
            <div className="flex-1 h-px bg-white/5 ml-2" />
            <span className="text-[10px] font-mono text-zinc-600">
              {stages.filter((s) => s.status === "passed").length}/{stages.length} complete
            </span>
          </motion.div>

          {/* Stage flow connector */}
          <div className="relative mb-4 hidden md:flex items-center gap-1 px-2">
            {stages.map((stage, i) => (
              <div key={stage.id} className="flex items-center flex-1">
                <div
                  className="flex-1 h-0.5 rounded-full transition-colors duration-500"
                  style={{ backgroundColor: statusColors[stage.status] + "60" }}
                />
                {i < stages.length - 1 && (
                  <ChevronRight size={10} style={{ color: statusColors[stage.status] + "80" }} />
                )}
              </div>
            ))}
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
          >
            {stages.map((stage, i) => (
              <StageCard key={stage.id} stage={stage} index={i} />
            ))}
          </motion.div>
        </section>

        {/* Two-column: Gate Rules + Chaos Injection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Gate Rules */}
          <motion.section
            variants={slideInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-emerald-400" />
              <h2 className="text-sm font-mono font-semibold text-zinc-300 uppercase tracking-widest">
                Quality Gate Rules
              </h2>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-2"
            >
              {GATE_RULES.map((rule) => (
                <GateRuleRow key={rule.id} rule={rule} />
              ))}
            </motion.div>
          </motion.section>

          {/* Chaos Injection Panel */}
          <motion.section
            variants={slideInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-red-400" />
              <h2 className="text-sm font-mono font-semibold text-zinc-300 uppercase tracking-widest">
                Fault Injection Console
              </h2>
            </div>
            <div
              className="rounded-xl p-5 space-y-4"
              style={{
                background: "rgba(9,9,11,0.7)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              {/* Fault type selector */}
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                  Fault Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FAULT_TYPES.map((ft) => (
                    <motion.button
                      key={ft.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedFault(ft.type)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                      style={{
                        background: selectedFault === ft.type ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selectedFault === ft.type ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.06)"}`,
                        color: selectedFault === ft.type ? "#ef4444" : "#71717a",
                      }}
                    >
                      {ft.icon}
                      <span className="text-[10px] font-mono">{ft.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Target input */}
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                  Target Pod / Service
                </label>
                <input
                  type="text"
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-700 focus:border-red-500/50 focus:outline-none transition-colors"
                  placeholder="e.g. api-gateway-pod-3"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                  Duration (seconds): {faultDuration}s
                </label>
                <input
                  type="range"
                  min="5"
                  max="300"
                  value={faultDuration}
                  onChange={(e) => setFaultDuration(e.target.value)}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-700 mt-1">
                  <span>5s</span>
                  <span>300s</span>
                </div>
              </div>

              {/* Inject button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleInjectFault}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-mono font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))",
                  border: "1px solid rgba(239,68,68,0.4)",
                  color: "#ef4444",
                  boxShadow: "0 0 20px rgba(239,68,68,0.1)",
                }}
              >
                <Zap size={14} />
                INJECT FAULT
              </motion.button>

              {/* Selected fault description */}
              <div className="text-[10px] font-mono text-zinc-600 text-center">
                {FAULT_TYPES.find((f) => f.type === selectedFault)?.description}
              </div>
            </div>
          </motion.section>
        </div>

        {/* Chaos Events Log */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={14} className="text-amber-400" />
            <h2 className="text-sm font-mono font-semibold text-zinc-300 uppercase tracking-widest">
              Active Chaos Events
            </h2>
            <div className="flex-1 h-px bg-white/5 ml-2" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-mono text-zinc-500">
                {chaosEvents.filter((e) => e.status === "active").length} active
              </span>
            </div>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-2"
          >
            {chaosEvents.map((event) => (
              <ChaosEventRow key={event.id} event={event} />
            ))}
          </motion.div>
        </motion.section>

        {/* Telemetry + Terminal row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Telemetry sparklines */}
          <motion.section
            variants={slideInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-cyan-400" />
              <h2 className="text-sm font-mono font-semibold text-zinc-300 uppercase tracking-widest">
                Resilience Telemetry
              </h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Throughput RPS", value: "1,847", delta: "+12%", color: "#06b6d4", trend: "up" },
                { label: "Error Rate", value: "0.8%", delta: "+0.3%", color: "#ef4444", trend: "up" },
                { label: "Recovery Time", value: "2.4s", delta: "-0.6s", color: "#10b981", trend: "down" },
                { label: "Retry Success", value: "94.2%", delta: "+1.1%", color: "#f59e0b", trend: "up" },
              ].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  variants={rowVariant}
                  className="rounded-xl p-4 flex items-center justify-between"
                  style={{
                    background: "rgba(9,9,11,0.6)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  whileHover={{ borderColor: `${metric.color}30` }}
                >
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">
                      {metric.label}
                    </div>
                    <div className="text-xl font-mono font-bold tabular-nums" style={{ color: metric.color }}>
                      {metric.value}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {metric.trend === "up" ? (
                        <TrendingUp size={10} style={{ color: metric.color }} />
                      ) : (
                        <TrendingDown size={10} style={{ color: metric.color }} />
                      )}
                      <span className="text-[10px] font-mono" style={{ color: metric.color }}>
                        {metric.delta}
                      </span>
                    </div>
                  </div>
                  <Sparkline
                    data={sparkData.map((v, idx) => Math.max(5, v + (idx % 3) * 8 - i * 5))}
                    color={metric.color}
                    height={40}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Live Terminal */}
          <motion.section
            variants={slideInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="lg:col-span-3"
          >
            <div className="flex items-center gap-2 mb-4">
              <Terminal size={14} className="text-emerald-400" />
              <h2 className="text-sm font-mono font-semibold text-zinc-300 uppercase tracking-widest">
                Pipeline Live Log
              </h2>
              <div className="flex-1 h-px bg-white/5 ml-2" />
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-zinc-500">streaming</span>
              </div>
            </div>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "rgba(5,5,8,0.95)",
                border: "1px solid rgba(16,185,129,0.15)",
                boxShadow: "0 0 30px rgba(16,185,129,0.05)",
              }}
            >
              {/* Terminal header */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 border-b"
                style={{ borderColor: "rgba(16,185,129,0.1)", background: "rgba(16,185,129,0.04)" }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <span className="text-[10px] font-mono text-zinc-600 ml-2">
                  pipeline-gate — integration stage — 8 workers
                </span>
              </div>
              {/* Terminal body */}
              <div
                ref={terminalRef}
                className="h-80 overflow-y-auto p-4 space-y-0.5"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#27272a transparent" }}
              >
                <AnimatePresence initial={false}>
                  {terminalLines.map((line) => (
                    <motion.div
                      key={line.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-2 text-[11px] font-mono leading-relaxed"
                    >
                      <span className="text-zinc-700 flex-shrink-0 tabular-nums">{line.ts}</span>
                      <span
                        className="flex-shrink-0 w-12 text-right uppercase text-[9px] tracking-wider"
                        style={{ color: levelColors[line.level] }}
                      >
                        {line.level}
                      </span>
                      <span style={{ color: levelColors[line.level] + "cc" }}>{line.msg}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-emerald-400 text-xs">$</span>
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-3.5 bg-emerald-400 inline-block"
                  />
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Resilience Scorecard */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Eye size={14} className="text-purple-400" />
            <h2 className="text-sm font-mono font-semibold text-zinc-300 uppercase tracking-widest">
              Resilience Scorecard
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Blast Radius",
                value: "Contained",
                sub: "2 of 8 pods affected",
                color: "#f59e0b",
                icon: <AlertTriangle size={18} />,
              },
              {
                label: "MTTR",
                value: "2.4s",
                sub: "Mean time to recovery",
                color: "#10b981",
                icon: <Clock size={18} />,
              },
              {
                label: "Fault Coverage",
                value: "6/6",
                sub: "All fault types validated",
                color: "#06b6d4",
                icon: <CheckCircle size={18} />,
              },
              {
                label: "SLO Compliance",
                value: "99.7%",
                sub: "Under active chaos load",
                color: "#a78bfa",
                icon: <TrendingUp size={18} />,
              },
            ].map((card) => (
              <motion.div
                key={card.label}
                variants={scaleIn}
                whileHover={{ scale: 1.03, y: -3 }}
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{
                  background: "rgba(9,9,11,0.7)",
                  border: `1px solid ${card.color}20`,
                  boxShadow: `0 4px 24px ${card.color}08`,
                }}
              >
                <div style={{ color: card.color }}>{card.icon}</div>
                <div>
                  <div className="text-2xl font-mono font-bold tabular-nums" style={{ color: card.color }}>
                    {card.value}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                    {card.label}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-600 mt-1">{card.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </main>
  );
}