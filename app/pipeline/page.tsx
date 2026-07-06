"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Activity, AlertTriangle, Check, FileCode, GitBranch, Lock, Terminal, Zap, RefreshCw, ChevronRight, Wifi, Cpu, MemoryStick, Radio, Shield, XCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { motion as m } from "framer-motion";
import { fadeInUp, staggerContainer, scaleIn, fadeIn } from "@/lib/motion";
import { pipelineStages, brand } from "@/lib/data";
import { useTranslations } from "next-intl";

// ─── Types ───────────────────────────────────────────────────────────────────

type StageStatus = "idle" | "running" | "passed" | "failed" | "skipped";

interface PipelineStage {
  id: string;
  label: string;
  icon: string;
  color: string;
  status: StageStatus;
  duration: number | null;
  tests: number;
}

interface ChaosEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  impact: string;
}

interface SliderConfig {
  packetLoss: number;
  jitterMs: number;
  cpuStarvation: number;
  memoryStarvation: number;
}

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

const ICON_MAP: Record<string, React.ReactNode> = {
  FileCode: <FileCode size={14} />,
  Check: <Check size={14} />,
  Activity: <Activity size={14} />,
  GitBranch: <GitBranch size={14} />,
  Terminal: <Terminal size={14} />,
  Lock: <Lock size={14} />,
};

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

// ─── Initial pipeline stages ─────────────────────────────────────────────────

const INITIAL_STAGES: PipelineStage[] = [
  { id: "lint", label: "Lint", icon: "FileCode", color: "#06b6d4", status: "passed", duration: 4.2, tests: 0 },
  { id: "unit", label: "Unit Tests", icon: "Check", color: "#10b981", status: "passed", duration: 18.7, tests: 3847 },
  { id: "mutation", label: "Mutation", icon: "Activity", color: "#f59e0b", status: "passed", duration: 94.1, tests: 1204 },
  { id: "integration", label: "Integration", icon: "GitBranch", color: "#06b6d4", status: "running", duration: null, tests: 892 },
  { id: "e2e", label: "E2E Suite", icon: "Terminal", color: "#10b981", status: "idle", duration: null, tests: 478 },
  { id: "security", label: "Security Scan", icon: "Lock", color: "#ef4444", status: "idle", duration: null, tests: 0 },
];

// ─── Chaos event templates ────────────────────────────────────────────────────

const CHAOS_TEMPLATES = [
  { type: "NETWORK_PARTITION", description: "Simulated network partition between service mesh nodes", impact: "P99 +380ms, 12 E2E failures" },
  { type: "CPU_THROTTLE", description: "CPU starvation injected into test runner pods", impact: "Throughput -42%, timeout cascade" },
  { type: "MEMORY_PRESSURE", description: "OOM condition triggered on integration test cluster", impact: "3 worker crashes, retry storm" },
  { type: "PACKET_LOSS", description: "15% packet loss applied to external API endpoints", impact: "Flakiness index +0.34" },
  { type: "LATENCY_SPIKE", description: "Artificial 500ms jitter injected into DB connections", impact: "P99 +620ms, SLA breach" },
  { type: "DNS_FAILURE", description: "DNS resolution failures for downstream dependencies", impact: "8 integration tests failed" },
];

// ─── SVG Ring Gauge ───────────────────────────────────────────────────────────

function RingGauge({ value, label, color, size = 140 }: { value: number; label: string; color: string; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={8}
        />
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{ marginTop: -size * 0.62, position: "relative", zIndex: 1, textAlign: "center" }}>
        <div className="text-2xl font-mono font-bold tabular-nums" style={{ color }}>
          {value.toFixed(1)}
          <span className="text-sm">%</span>
        </div>
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ─── Conveyor Pipeline ────────────────────────────────────────────────────────

const stageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" },
  }),
};

function StageStatusIcon({ status }: { status: StageStatus }) {
  if (status === "passed") return <Check size={12} className="text-emerald-400" />;
  if (status === "failed") return <XCircle size={12} className="text-red-400" />;
  if (status === "running") return (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
      <RefreshCw size={12} className="text-cyan-400" />
    </motion.div>
  );
  if (status === "skipped") return <ChevronRight size={12} className="text-zinc-500" />;
  return <Clock size={12} className="text-zinc-600" />;
}

function ConveyorPipeline({
  stages,
  isFaultInjected,
}: {
  stages: PipelineStage[];
  isFaultInjected: boolean;
}) {
  const statusColors: Record<StageStatus, string> = {
    passed: "#10b981",
    failed: "#ef4444",
    running: "#06b6d4",
    idle: "#3f3f46",
    skipped: "#71717a",
  };

  const statusBg: Record<StageStatus, string> = {
    passed: "rgba(16,185,129,0.08)",
    failed: "rgba(239,68,68,0.12)",
    running: "rgba(6,182,212,0.1)",
    idle: "rgba(63,63,70,0.3)",
    skipped: "rgba(113,113,122,0.1)",
  };

  return (
    <div className="relative w-full overflow-x-auto pb-2">
      <div className="flex items-center gap-0 min-w-max">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex items-center">
            <motion.div
              custom={i}
              variants={stageVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05, y: -2 }}
              className="relative flex flex-col items-center gap-2 px-4 py-3 rounded-xl cursor-default"
              style={{
                background: statusBg[stage.status],
                border: `1px solid ${statusColors[stage.status]}30`,
                boxShadow: stage.status === "running"
                  ? `0 0 20px ${statusColors[stage.status]}30`
                  : stage.status === "failed" && isFaultInjected
                  ? "0 0 24px rgba(239,68,68,0.4)"
                  : "none",
                minWidth: 110,
              }}
            >
              {stage.status === "running" && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  style={{ background: `radial-gradient(ellipse at center, ${statusColors[stage.status]}15, transparent)` }}
                />
              )}
              <div className="flex items-center gap-1.5">
                <span style={{ color: statusColors[stage.status] }}>
                  {ICON_MAP[stage.icon] ?? <Activity size={14} />}
                </span>
                <span className="text-xs font-mono font-semibold text-zinc-200">{stage.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <StageStatusIcon status={stage.status} />
                <span className="text-[10px] font-mono" style={{ color: statusColors[stage.status] }}>
                  {stage.status.toUpperCase()}
                </span>
              </div>
              {stage.duration !== null && (
                <div className="text-[9px] font-mono text-zinc-500">{stage.duration.toFixed(1)}s</div>
              )}
              {stage.tests > 0 && (
                <div className="text-[9px] font-mono text-zinc-600">{stage.tests.toLocaleString("en-US")} tests</div>
              )}
            </motion.div>

            {i < stages.length - 1 && (
              <div className="flex items-center px-1">
                <motion.div
                  className="h-px w-8"
                  style={{
                    background: stage.status === "passed"
                      ? "linear-gradient(90deg, #10b981, #06b6d4)"
                      : "rgba(63,63,70,0.5)",
                  }}
                  animate={stage.status === "running" ? { opacity: [0.4, 1, 0.4] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <ChevronRight size={12} className="text-zinc-600 -ml-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chaos Slider ─────────────────────────────────────────────────────────────

function ChaosSlider({
  label,
  value,
  min,
  max,
  unit,
  color,
  icon,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          <span className="text-xs font-mono text-zinc-300">{label}</span>
        </div>
        <span className="text-xs font-mono tabular-nums" style={{ color }}>
          {value}
          {unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}60`,
          }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

// ─── Fault Log Panel ──────────────────────────────────────────────────────────

function FaultLogPanel({ events }: { events: ChaosEvent[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div
      ref={listRef}
      className="space-y-2 overflow-y-auto"
      style={{ maxHeight: 280 }}
    >
      <AnimatePresence initial={false}>
        {(events ?? []).map((ev) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg p-3 border"
            style={{
              background: SEVERITY_BG[ev.severity] ?? "rgba(255,255,255,0.03)",
              borderColor: `${SEVERITY_COLORS[ev.severity] ?? "#71717a"}30`,
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: SEVERITY_COLORS[ev.severity] ?? "#71717a",
                    background: `${SEVERITY_COLORS[ev.severity] ?? "#71717a"}20`,
                  }}
                >
                  {ev.severity.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono font-semibold text-zinc-200">{ev.type}</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-600 shrink-0">{ev.timestamp}</span>
            </div>
            <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">{ev.description}</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: SEVERITY_COLORS[ev.severity] ?? "#71717a" }}>
              Impact: {ev.impact}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
      {events.length === 0 && (
        <div className="text-center py-8 text-zinc-600 font-mono text-xs">
          No chaos events recorded. System nominal.
        </div>
      )}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color, width = 200, height = 48 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `0,${height} ${pts.join(" ")} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  color,
  icon,
  trend,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "flat";
}) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ scale: 1.02, y: -2 }}
      className="rounded-xl p-4 border"
      style={{
        background: "rgba(9,9,11,0.6)",
        borderColor: `${color}20`,
        boxShadow: `0 1px 2px rgba(0,0,0,0.2), 0 0 20px ${color}08`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ color }} className="opacity-80">{icon}</span>
        {trend && (
          <span className={`text-[10px] font-mono ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-500"}`}>
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
          </span>
        )}
      </div>
      <div className="text-xl font-mono font-bold tabular-nums" style={{ color }}>
        {value}
        <span className="text-sm font-normal text-zinc-500 ml-1">{unit}</span>
      </div>
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">{label}</div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const t = useTranslations();
  const store = useMetricsStore();

  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [sliders, setSliders] = useState<SliderConfig>({
    packetLoss: 0,
    jitterMs: 0,
    cpuStarvation: 0,
    memoryStarvation: 0,
  });
  const [chaosEvents, setChaosEvents] = useState<ChaosEvent[]>([]);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [eventCounter, setEventCounter] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([142, 138, 145, 151, 139, 144, 148, 142, 155, 141]);
  const [healthHistory, setHealthHistory] = useState<number[]>([97, 96, 98, 95, 97, 94, 98, 97, 96, 95]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulate pipeline progression
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setStages((prev) => {
        const runningIdx = prev.findIndex((s) => s.status === "running");
        if (runningIdx === -1) return prev;
        const next = [...prev];
        const shouldFail = store.isFaultInjected && runningIdx >= 3;
        next[runningIdx] = {
          ...next[runningIdx],
          status: shouldFail ? "failed" : "passed",
          duration: 15 + runningIdx * 8 + (shouldFail ? 0 : 2),
        };
        if (runningIdx + 1 < next.length && !shouldFail) {
          next[runningIdx + 1] = { ...next[runningIdx + 1], status: "running" };
        }
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [mounted, store.isFaultInjected]);

  // Update sparkline histories
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setLatencyHistory((prev) => {
        const next = [...prev.slice(-19), store.p99Latency + (Math.random() - 0.5) * 20];
        return next;
      });
      setHealthHistory((prev) => {
        const next = [...prev.slice(-19), store.systemHealth + (Math.random() - 0.5) * 2];
        return next;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [mounted, store.p99Latency, store.systemHealth]);

  const addChaosEvent = useCallback((type: string, severity: ChaosEvent["severity"], description: string, impact: string) => {
    const now = new Date();
    const ts = formatTs(now);
    setChaosEvents((prev) => [
      ...prev.slice(-19),
      {
        id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: ts,
        type,
        severity,
        description,
        impact,
      },
    ]);
    setEventCounter((c) => c + 1);
  }, []);

  const handleSliderChange = useCallback(
    (key: keyof SliderConfig, value: number) => {
      setSliders((prev) => ({ ...prev, [key]: value }));
      const totalIntensity =
        (key === "packetLoss" ? value : sliders.packetLoss) +
        (key === "jitterMs" ? value : sliders.jitterMs) / 5 +
        (key === "cpuStarvation" ? value : sliders.cpuStarvation) +
        (key === "memoryStarvation" ? value : sliders.memoryStarvation);
      if (totalIntensity > 30) {
        store.triggerChaosEvent(totalIntensity);
      }
    },
    [sliders, store]
  );

  const handleInjectFault = useCallback(
    (templateIdx: number) => {
      const tpl = CHAOS_TEMPLATES[templateIdx % CHAOS_TEMPLATES.length];
      if (!tpl) return;
      store.injectFault(tpl.type);
      const severities: ChaosEvent["severity"][] = ["low", "medium", "high", "critical"];
      const sev = severities[Math.min(templateIdx, 3)] ?? "medium";
      addChaosEvent(tpl.type, sev, tpl.description, tpl.impact);
      setStages((prev) =>
        prev.map((s) =>
          s.status === "running" || s.status === "idle"
            ? { ...s, status: s.status === "running" ? "failed" : "idle" }
            : s
        )
      );
    },
    [store, addChaosEvent]
  );

  const handleResetPipeline = useCallback(() => {
    setStages(INITIAL_STAGES.map((s, i) => ({
      ...s,
      status: i < 2 ? "passed" : i === 2 ? "running" : "idle",
      duration: i < 2 ? s.duration : null,
    })));
    setSliders({ packetLoss: 0, jitterMs: 0, cpuStarvation: 0, memoryStarvation: 0 });
    setIsRunningPipeline(false);
  }, []);

  const healthColor =
    store.systemHealth > 80 ? "#10b981" : store.systemHealth > 50 ? "#f59e0b" : "#ef4444";

  const passedStages = stages.filter((s) => s.status === "passed").length;
  const failedStages = stages.filter((s) => s.status === "failed").length;
  const totalIntensity = sliders.packetLoss + sliders.jitterMs / 5 + sliders.cpuStarvation + sliders.memoryStarvation;

  return (
    <div className="relative min-h-screen" style={{ background: "transparent" }}>
      {/* Fault injection red flicker overlay */}
      <AnimatePresence>
        {store.isFaultInjected && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.08, 0, 0.12, 0, 0.06, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, times: [0, 0.1, 0.2, 0.35, 0.5, 0.7, 1] }}
            style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.3), rgba(239,68,68,0.05))" }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 px-4 md:px-8 py-8 max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                className="w-2 h-2 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ background: store.isFaultInjected ? "#ef4444" : "#10b981", boxShadow: `0 0 8px ${store.isFaultInjected ? "#ef4444" : "#10b981"}` }}
              />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                {store.isFaultInjected ? "FAULT ACTIVE" : "PIPELINE NOMINAL"}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-mono font-bold text-zinc-100 tracking-tight">
              Chaos Engineering
              <span className="text-emerald-400"> & Pipeline Gate</span>
            </h1>
            <p className="text-sm font-mono text-zinc-500 mt-2 max-w-xl">
              Real-time CI/CD pipeline orchestration with fault injection, chaos controls, and automated quality gates. Every commit must survive the gauntlet.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleResetPipeline}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono border transition-all duration-200"
              style={{
                background: "rgba(6,182,212,0.08)",
                borderColor: "rgba(6,182,212,0.3)",
                color: "#06b6d4",
              }}
            >
              <RefreshCw size={12} />
              Reset Pipeline
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleInjectFault(chaosEvents.length % CHAOS_TEMPLATES.length)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono border transition-all duration-200"
              style={{
                background: store.isFaultInjected ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)",
                borderColor: "rgba(239,68,68,0.4)",
                color: "#ef4444",
                boxShadow: store.isFaultInjected ? "0 0 16px rgba(239,68,68,0.3)" : "none",
              }}
            >
              <Zap size={12} />
              Inject Fault
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stat Cards ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard
            label="System Health"
            value={mounted ? store.systemHealth.toFixed(1) : "94.7"}
            unit="%"
            color={healthColor}
            icon={<Shield size={16} />}
            trend={store.isFaultInjected ? "down" : "up"}
          />
          <StatCard
            label="P99 Latency"
            value={mounted ? store.p99Latency.toFixed(0) : "142"}
            unit="ms"
            color={store.p99Latency > 500 ? "#ef4444" : store.p99Latency > 300 ? "#f59e0b" : "#10b981"}
            icon={<Activity size={16} />}
            trend={store.isFaultInjected ? "up" : "flat"}
          />
          <StatCard
            label="Stages Passed"
            value={passedStages.toString()}
            unit={`/ ${stages.length}`}
            color="#10b981"
            icon={<Check size={16} />}
            trend="up"
          />
          <StatCard
            label="Chaos Events"
            value={eventCounter.toString()}
            unit="total"
            color={eventCounter > 5 ? "#ef4444" : "#f59e0b"}
            icon={<AlertTriangle size={16} />}
            trend={eventCounter > 0 ? "up" : "flat"}
          />
        </motion.div>

        {/* ── Conveyor Pipeline ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl border p-6"
          style={{
            background: "rgba(9,9,11,0.7)",
            borderColor: "rgba(16,185,129,0.12)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 8px 32px -8px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #10b981" }} />
              <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-widest">
                CI/CD Pipeline — Conveyor View
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {failedStages > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {failedStages} FAILED
                </span>
              )}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {passedStages} PASSED
              </span>
            </div>
          </div>
          <ConveyorPipeline stages={stages} isFaultInjected={store.isFaultInjected} />

          {/* Stage detail table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-600 uppercase tracking-widest pb-2 pr-4">Stage</th>
                  <th className="text-left text-zinc-600 uppercase tracking-widest pb-2 pr-4">Status</th>
                  <th className="text-right text-zinc-600 uppercase tracking-widest pb-2 pr-4">Duration</th>
                  <th className="text-right text-zinc-600 uppercase tracking-widest pb-2">Tests</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stage) => {
                  const statusColors: Record<StageStatus, string> = {
                    passed: "#10b981",
                    failed: "#ef4444",
                    running: "#06b6d4",
                    idle: "#3f3f46",
                    skipped: "#71717a",
                  };
                  return (
                    <tr key={stage.id} className="border-b border-zinc-900 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 pr-4 text-zinc-300">{stage.label}</td>
                      <td className="py-2 pr-4">
                        <span style={{ color: statusColors[stage.status] }}>{stage.status.toUpperCase()}</span>
                      </td>
                      <td className="py-2 pr-4 text-right text-zinc-500">
                        {stage.duration !== null ? `${stage.duration.toFixed(1)}s` : "—"}
                      </td>
                      <td className="py-2 text-right text-zinc-500">
                        {stage.tests > 0 ? stage.tests.toLocaleString("en-US") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── Chaos Control + Health Gauge ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chaos Control Panel */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="lg:col-span-2 rounded-2xl border p-6 space-y-6"
            style={{
              background: "rgba(9,9,11,0.7)",
              borderColor: store.isFaultInjected ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.12)",
              boxShadow: store.isFaultInjected
                ? "0 0 32px rgba(239,68,68,0.12), 0 1px 2px rgba(0,0,0,0.3)"
                : "0 1px 2px rgba(0,0,0,0.3), 0 8px 32px -8px rgba(0,0,0,0.4)",
              transition: "border-color 0.4s, box-shadow 0.4s",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-1 h-6 rounded-full"
                  style={{
                    background: store.isFaultInjected ? "#ef4444" : "#f59e0b",
                    boxShadow: `0 0 8px ${store.isFaultInjected ? "#ef4444" : "#f59e0b"}`,
                  }}
                />
                <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-widest">
                  Chaos Control Panel
                </h2>
              </div>
              {store.isFaultInjected && (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30"
                >
                  FAULT ACTIVE
                </motion.span>
              )}
            </div>

            {/* Network section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Wifi size={12} className="text-cyan-400" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Network Throttling</span>
              </div>
              <ChaosSlider
                label="Packet Loss"
                value={sliders.packetLoss}
                min={0}
                max={50}
                unit="%"
                color="#06b6d4"
                icon={<Radio size={12} />}
                onChange={(v) => handleSliderChange("packetLoss", v)}
              />
              <ChaosSlider
                label="Jitter"
                value={sliders.jitterMs}
                min={0}
                max={500}
                unit="ms"
                color="#06b6d4"
                icon={<Activity size={12} />}
                onChange={(v) => handleSliderChange("jitterMs", v)}
              />
            </div>

            <div className="border-t border-zinc-800/60" />

            {/* Server stress section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={12} className="text-amber-400" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Server Stress</span>
              </div>
              <ChaosSlider
                label="CPU Starvation"
                value={sliders.cpuStarvation}
                min={0}
                max={100}
                unit="%"
                color="#f59e0b"
                icon={<Cpu size={12} />}
                onChange={(v) => handleSliderChange("cpuStarvation", v)}
              />
              <ChaosSlider
                label="Memory Starvation"
                value={sliders.memoryStarvation}
                min={0}
                max={100}
                unit="%"
                color="#f97316"
                icon={<MemoryStick size={12} />}
                onChange={(v) => handleSliderChange("memoryStarvation", v)}
              />
            </div>

            {/* Total intensity indicator */}
            <div
              className="rounded-xl p-4 border"
              style={{
                background: totalIntensity > 60 ? "rgba(239,68,68,0.06)" : totalIntensity > 30 ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.04)",
                borderColor: totalIntensity > 60 ? "rgba(239,68,68,0.2)" : totalIntensity > 30 ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.15)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Aggregate Chaos Intensity</span>
                <span
                  className="text-sm font-mono font-bold tabular-nums"
                  style={{ color: totalIntensity > 60 ? "#ef4444" : totalIntensity > 30 ? "#f59e0b" : "#10b981" }}
                >
                  {totalIntensity.toFixed(0)}
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${Math.min(100, totalIntensity)}%` }}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: totalIntensity > 60
                      ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                      : totalIntensity > 30
                      ? "linear-gradient(90deg, #10b981, #f59e0b)"
                      : "linear-gradient(90deg, #10b981, #06b6d4)",
                    boxShadow: `0 0 8px ${totalIntensity > 60 ? "#ef4444" : totalIntensity > 30 ? "#f59e0b" : "#10b981"}60`,
                  }}
                />
              </div>
              <p className="text-[10px] font-mono text-zinc-600 mt-2">
                {totalIntensity > 60
                  ? "Critical: Pipeline gate will block deployment. Fault injection imminent."
                  : totalIntensity > 30
                  ? "Warning: Elevated chaos may cause test flakiness and latency spikes."
                  : "Nominal: System operating within acceptable chaos parameters."}
              </p>
            </div>

            {/* Quick inject buttons */}
            <div>
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">Quick Fault Injection</div>
              <div className="flex flex-wrap gap-2">
                {CHAOS_TEMPLATES.map((tpl, i) => (
                  <motion.button
                    key={tpl.type}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleInjectFault(i)}
                    className="text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all duration-200"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      borderColor: "rgba(239,68,68,0.2)",
                      color: "#ef4444",
                    }}
                  >
                    {tpl.type.replace(/_/g, " ")}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Health Gauge + Sparklines */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="rounded-2xl border p-6 flex flex-col gap-6"
            style={{
              background: "rgba(9,9,11,0.7)",
              borderColor: "rgba(16,185,129,0.12)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 8px 32px -8px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #10b981" }} />
              <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-widest">
                Pipeline Health
              </h2>
            </div>

            <div className="flex justify-center">
              <RingGauge
                value={mounted ? store.systemHealth : 94.7}
                label="System Health"
                color={healthColor}
                size={160}
              />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">P99 Latency Trend</span>
                  <span className="text-[10px] font-mono tabular-nums" style={{ color: store.p99Latency > 300 ? "#ef4444" : "#10b981" }}>
                    {mounted ? store.p99Latency.toFixed(0) : "142"}ms
                  </span>
                </div>
                <Sparkline data={latencyHistory} color={store.p99Latency > 300 ? "#ef4444" : "#06b6d4"} width={220} height={40} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Health Trend</span>
                  <span className="text-[10px] font-mono tabular-nums text-emerald-400">
                    {mounted ? store.systemHealth.toFixed(1) : "94.7"}%
                  </span>
                </div>
                <Sparkline data={healthHistory} color={healthColor} width={220} height={40} />
              </div>
            </div>

            {/* Pass/fail ratio */}
            <div className="rounded-xl p-3 border border-zinc-800/60" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Test Outcome Ratio</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    animate={{
                      width: `${mounted ? (store.passedCount / (store.passedCount + store.failedCount)) * 100 : 99.6}%`,
                    }}
                    transition={{ duration: 0.8 }}
                    style={{ background: "linear-gradient(90deg, #10b981, #06b6d4)" }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-emerald-400">{mounted ? store.passedCount.toLocaleString("en-US") : "8,421"} passed</span>
                <span className="text-red-400">{mounted ? store.failedCount.toLocaleString("en-US") : "37"} failed</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Fault Injection Log ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl border p-6"
          style={{
            background: "rgba(9,9,11,0.7)",
            borderColor: "rgba(239,68,68,0.1)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 8px 32px -8px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-red-400" style={{ boxShadow: "0 0 8px #ef4444" }} />
              <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-widest">
                Fault Injection Log
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-600">{chaosEvents.length} events</span>
              {chaosEvents.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setChaosEvents([])}
                  className="text-[10px] font-mono px-2 py-1 rounded border transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "#71717a",
                  }}
                >
                  Clear
                </motion.button>
              )}
            </div>
          </div>
          <FaultLogPanel events={chaosEvents} />
        </motion.div>

        {/* ── Pipeline Gate Rules ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-2xl border p-6"
          style={{
            background: "rgba(9,9,11,0.7)",
            borderColor: "rgba(6,182,212,0.12)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 8px 32px -8px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 8px #06b6d4" }} />
            <h2 className="text-sm font-mono font-bold text-zinc-200 uppercase tracking-widest">
              Automated Quality Gate Rules
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { rule: "Mutation Score", threshold: ">= 85%", current: "91.4%", pass: true, icon: <Activity size={14} /> },
              { rule: "P99 Latency", threshold: "< 300ms", current: `${mounted ? store.p99Latency.toFixed(0) : "142"}ms`, pass: mounted ? store.p99Latency < 300 : true, icon: <Clock size={14} /> },
              { rule: "E2E Pass Rate", threshold: ">= 98%", current: "99.1%", pass: true, icon: <Check size={14} /> },
              { rule: "Security Findings", threshold: "0 Critical", current: "0 Critical", pass: true, icon: <Lock size={14} /> },
              { rule: "Code Coverage", threshold: ">= 90%", current: "94.7%", pass: true, icon: <TrendingUp size={14} /> },
              { rule: "System Health", threshold: ">= 80%", current: `${mounted ? store.systemHealth.toFixed(1) : "94.7"}%`, pass: mounted ? store.systemHealth >= 80 : true, icon: <Shield size={14} /> },
            ].map((gate) => (
              <motion.div
                key={gate.rule}
                whileHover={{ scale: 1.02, y: -1 }}
                className="rounded-xl p-4 border flex items-start gap-3"
                style={{
                  background: gate.pass ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.06)",
                  borderColor: gate.pass ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.2)",
                }}
              >
                <div
                  className="mt-0.5 shrink-0"
                  style={{ color: gate.pass ? "#10b981" : "#ef4444" }}
                >
                  {gate.pass ? <Check size={14} /> : <XCircle size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-semibold text-zinc-200 mb-1">{gate.rule}</div>
                  <div className="text-[10px] font-mono text-zinc-500">Threshold: {gate.threshold}</div>
                  <div
                    className="text-[10px] font-mono font-bold mt-1 tabular-nums"
                    style={{ color: gate.pass ? "#10b981" : "#ef4444" }}
                  >
                    {gate.current}
                  </div>
                </div>
                <div style={{ color: gate.pass ? "#10b981" : "#ef4444", opacity: 0.5 }}>
                  {gate.icon}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Gate decision banner */}
          <motion.div
            animate={{
              borderColor: store.isFaultInjected ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.3)",
              background: store.isFaultInjected ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.04)",
            }}
            transition={{ duration: 0.5 }}
            className="mt-6 rounded-xl p-4 border flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ opacity: store.isFaultInjected ? [1, 0.3, 1] : 1 }}
                transition={{ repeat: store.isFaultInjected ? Infinity : 0, duration: 0.8 }}
              >
                {store.isFaultInjected ? (
                  <AlertCircle size={18} className="text-red-400" />
                ) : (
                  <Shield size={18} className="text-emerald-400" />
                )}
              </motion.div>
              <div>
                <div
                  className="text-sm font-mono font-bold"
                  style={{ color: store.isFaultInjected ? "#ef4444" : "#10b981" }}
                >
                  {store.isFaultInjected ? "PIPELINE GATE: BLOCKED" : "PIPELINE GATE: APPROVED"}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  {store.isFaultInjected
                    ? "Fault injection detected. Deployment blocked pending recovery and re-validation."
                    : "All quality gates passing. Deployment approved for production promotion."}
                </div>
              </div>
            </div>
            <div
              className="text-[10px] font-mono px-3 py-1.5 rounded-lg border"
              style={{
                color: store.isFaultInjected ? "#ef4444" : "#10b981",
                borderColor: store.isFaultInjected ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)",
                background: store.isFaultInjected ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
              }}
            >
              {store.isFaultInjected ? "BLOCKED" : "DEPLOY"}
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}