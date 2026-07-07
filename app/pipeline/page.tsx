"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Activity, AlertTriangle, Check, FileCode, GitBranch, Lock, Terminal, Zap, RefreshCw, ChevronRight, Wifi, Cpu, HardDrive, Radio, Shield, XCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
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

  const injectFault = useCallback((_type: string) => {
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

// ─── Initial pipeline stages (updated for Rao Muhammad Ali's QA workflow) ────

const INITIAL_STAGES: PipelineStage[] = [
  {
    id: "lint",
    label: "ESLint + Prettier",
    icon: "FileCode",
    color: "#06b6d4",
    status: "passed",
    duration: 4.2,
    tests: 0,
  },
  {
    id: "unit",
    label: "Functional & Unit Coverage",
    icon: "Check",
    color: "#10b981",
    status: "passed",
    duration: 18.7,
    tests: 312,
  },
  {
    id: "mutation",
    label: "Mutation Score Analysis",
    icon: "Activity",
    color: "#f59e0b",
    status: "passed",
    duration: 42.1,
    tests: 87,
  },
  {
    id: "integration",
    label: "API Integration Tests",
    icon: "GitBranch",
    color: "#06b6d4",
    status: "running",
    duration: null,
    tests: 141,
  },
  {
    id: "e2e",
    label: "Playwright E2E Suite",
    icon: "Terminal",
    color: "#10b981",
    status: "idle",
    duration: null,
    tests: 0,
  },
  {
    id: "security",
    label: "Static Security Analysis",
    icon: "Lock",
    color: "#ef4444",
    status: "idle",
    duration: null,
    tests: 0,
  },
];

// ─── Chaos event templates ────────────────────────────────────────────────────

const CHAOS_TEMPLATES = [
  {
    type: "network",
    severity: "medium" as const,
    description: "Packet loss spike detected on test runner network interface",
    impact: "API integration tests experiencing intermittent timeouts",
  },
  {
    type: "cpu",
    severity: "high" as const,
    description: "CPU starvation event on Worker-3 — scheduler contention",
    impact: "E2E test execution slowed by 340% — 3 workers throttled",
  },
  {
    type: "memory",
    severity: "critical" as const,
    description: "Memory pressure: heap allocation failure in test runner",
    impact: "OOM kill signal sent to 2 Playwright worker processes",
  },
  {
    type: "network",
    severity: "low" as const,
    description: "Jitter injection: 120ms variance on loopback interface",
    impact: "WebSocket assertion flakiness increased by 12%",
  },
  {
    type: "fault",
    severity: "critical" as const,
    description: "Synthetic fault injected: database connection pool exhausted",
    impact: "All API tests failing with ECONNREFUSED — pipeline gate triggered",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: StageStatus }) {
  const colors: Record<StageStatus, string> = {
    idle: "#3f3f46",
    running: "#f59e0b",
    passed: "#10b981",
    failed: "#ef4444",
    skipped: "#6b7280",
  };
  const isRunning = status === "running";
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${isRunning ? "animate-pulse" : ""}`}
      style={{ backgroundColor: colors[status], boxShadow: isRunning ? `0 0 8px ${colors[status]}` : undefined }}
    />
  );
}

function SliderRow({
  label,
  icon,
  value,
  max,
  unit,
  color,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  max: number;
  unit: string;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span style={{ color }}>{icon}</span>
          <span>{label}</span>
        </div>
        <span className="text-xs font-mono tabular-nums" style={{ color }}>
          {value}
          {unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-zinc-800">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const t = useTranslations();
  const metrics = useMetricsStore();

  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [chaosLog, setChaosLog] = useState<ChaosEvent[]>([]);
  const [sliders, setSliders] = useState<SliderConfig>({
    packetLoss: 0,
    jitterMs: 0,
    cpuStarvation: 34,
    memoryStarvation: 48,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [activeStageIdx, setActiveStageIdx] = useState(3);
  const [mounted, setMounted] = useState(false);
  const runIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulate pipeline progression
  const startPipelineRun = useCallback(() => {
    setIsRunning(true);
    setRunProgress(0);
    setActiveStageIdx(0);
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: "idle" as StageStatus, duration: null })));

    let idx = 0;
    const advance = () => {
      setStages((prev) =>
        prev.map((s, i) => {
          if (i < idx) return { ...s, status: "passed", duration: parseFloat((Math.random() * 40 + 4).toFixed(1)) };
          if (i === idx) return { ...s, status: "running" };
          return { ...s, status: "idle" };
        })
      );
      setActiveStageIdx(idx);
      setRunProgress(Math.round((idx / INITIAL_STAGES.length) * 100));
      idx++;
      if (idx > INITIAL_STAGES.length) {
        setIsRunning(false);
        setRunProgress(100);
        setStages((prev) => prev.map((s) => ({ ...s, status: "passed", duration: s.duration ?? parseFloat((Math.random() * 40 + 4).toFixed(1)) })));
        if (runIntervalRef.current) clearInterval(runIntervalRef.current);
      }
    };

    advance();
    runIntervalRef.current = setInterval(advance, 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (runIntervalRef.current) clearInterval(runIntervalRef.current);
    };
  }, []);

  // Apply slider changes to metrics
  useEffect(() => {
    const totalStress = sliders.packetLoss + sliders.jitterMs / 10 + sliders.cpuStarvation + sliders.memoryStarvation;
    if (totalStress > 80) {
      metrics.triggerChaosEvent(Math.min(10, Math.round(totalStress / 20)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliders]);

  const handleSliderChange = (key: keyof SliderConfig, value: number) => {
    setSliders((prev) => ({ ...prev, [key]: value }));
  };

  const handleInjectChaos = () => {
    const template = CHAOS_TEMPLATES[Math.floor(Math.random() * CHAOS_TEMPLATES.length)];
    const event: ChaosEvent = {
      id: `chaos-${Date.now()}`,
      timestamp: mounted ? formatTs(new Date()) : "00:00:00",
      ...template,
    };
    setChaosLog((prev) => [event, ...prev.slice(0, 19)]);
    metrics.injectFault(template.type);
  };

  const healthColor =
    metrics.systemHealth > 80 ? "#10b981" : metrics.systemHealth > 50 ? "#f59e0b" : "#ef4444";

  const cardStyle = {
    background: "rgba(9,9,11,0.7)",
    border: "1px solid rgba(16,185,129,0.12)",
    backdropFilter: "blur(16px)",
  };

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 space-y-8">
      {/* ── Header ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: metrics.isFaultInjected ? "#ef4444" : "#10b981", boxShadow: `0 0 8px ${metrics.isFaultInjected ? "#ef4444" : "#10b981"}` }}
          />
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">chaos-engineering · pipeline-gate</span>
          {metrics.isFaultInjected && (
            <span className="text-xs font-mono text-red-400 border border-red-500/30 bg-red-500/10 px-2 py-0.5 rounded animate-pulse">
              FAULT ACTIVE
            </span>
          )}
        </motion.div>
        <motion.h1 variants={fadeInUp} className="text-2xl md:text-3xl font-bold font-mono text-emerald-400">
          Chaos Engineering &amp; Pipeline Gate
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-sm font-mono text-zinc-500 max-w-2xl">
          Simulate real-world failure scenarios, inject network faults, and observe how the automated DevOps pipeline gate responds under stress.
        </motion.p>
      </motion.div>

      {/* ── Live Metrics Bar ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "System Health", value: `${metrics.systemHealth.toFixed(1)}%`, color: healthColor, icon: <Activity size={14} /> },
          { label: "P99 Latency", value: `${metrics.p99Latency}ms`, color: metrics.p99Latency > 500 ? "#ef4444" : metrics.p99Latency > 200 ? "#f59e0b" : "#10b981", icon: <Clock size={14} /> },
          { label: "Tests Passed", value: metrics.passedCount.toLocaleString("en-US"), color: "#10b981", icon: <Check size={14} /> },
          { label: "Tests Failed", value: metrics.failedCount.toLocaleString("en-US"), color: "#ef4444", icon: <XCircle size={14} /> },
        ].map((m) => (
          <motion.div key={m.label} variants={scaleIn} style={cardStyle} className="rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2" style={{ color: m.color }}>
              {m.icon}
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{m.label}</span>
            </div>
            <div className="text-xl font-mono font-bold tabular-nums" style={{ color: m.color }}>
              {m.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Pipeline Conveyor ── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" style={cardStyle} className="rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest">Pipeline Gate</h2>
            <p className="text-xs font-mono text-zinc-600 mt-0.5">Automated DevOps quality gate — 6 stages</p>
          </div>
          <div className="flex items-center gap-3">
            {isRunning && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono text-amber-400">{runProgress}%</span>
              </div>
            )}
            <button
              onClick={startPipelineRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
              style={{
                background: isRunning ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: isRunning ? "#6b7280" : "#10b981",
                cursor: isRunning ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw size={12} className={isRunning ? "animate-spin" : ""} />
              {isRunning ? "Running…" : "Re-run Pipeline"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {isRunning && (
          <div className="mb-6 h-1 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #10b981, #06b6d4)" }}
              animate={{ width: `${runProgress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}

        {/* Stage conveyor */}
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          {stages.map((stage, idx) => {
            const isActive = stage.status === "running";
            const isPassed = stage.status === "passed";
            const isFailed = stage.status === "failed";
            const isLast = idx === stages.length - 1;

            return (
              <div key={stage.id} className="flex flex-row md:flex-col items-center flex-1">
                {/* Stage card */}
                <motion.div
                  animate={{
                    borderColor: isActive
                      ? stage.color
                      : isPassed
                      ? "rgba(16,185,129,0.3)"
                      : isFailed
                      ? "rgba(239,68,68,0.3)"
                      : "rgba(63,63,70,0.4)",
                    boxShadow: isActive ? `0 0 16px ${stage.color}40` : "none",
                  }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 md:w-full rounded-xl p-3 md:p-4 text-center"
                  style={{
                    background: isActive
                      ? `${stage.color}10`
                      : isPassed
                      ? "rgba(16,185,129,0.05)"
                      : "rgba(9,9,11,0.5)",
                    border: "1px solid",
                    borderColor: isActive ? stage.color : isPassed ? "rgba(16,185,129,0.2)" : "rgba(63,63,70,0.3)",
                  }}
                >
                  <div className="flex md:flex-col items-center md:items-center gap-2 md:gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${stage.color}20`,
                        color: isActive ? stage.color : isPassed ? "#10b981" : isFailed ? "#ef4444" : "#52525b",
                      }}
                    >
                      {ICON_MAP[stage.icon]}
                    </div>
                    <div className="text-left md:text-center">
                      <div
                        className="text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{ color: isActive ? stage.color : isPassed ? "#10b981" : isFailed ? "#ef4444" : "#52525b" }}
                      >
                        {stage.label}
                      </div>
                      <div className="flex items-center justify-start md:justify-center gap-1 mt-0.5">
                        <StatusDot status={stage.status} />
                        <span className="text-[9px] font-mono text-zinc-600">
                          {stage.status === "running"
                            ? "executing…"
                            : stage.duration
                            ? `${stage.duration}s`
                            : stage.status}
                        </span>
                      </div>
                      {stage.tests > 0 && (
                        <div className="text-[9px] font-mono text-zinc-700 mt-0.5">{stage.tests} tests</div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Connector arrow */}
                {!isLast && (
                  <div className="flex items-center justify-center w-6 h-6 md:w-full md:h-6 flex-shrink-0">
                    <ChevronRight size={12} className="text-zinc-700 md:rotate-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Chaos Control Panel + Event Log ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chaos Control Panel */}
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" style={cardStyle} className="rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest">Chaos Control Panel</h2>
              <p className="text-xs font-mono text-zinc-600 mt-0.5">Inject real-world failure scenarios</p>
            </div>
            <button
              onClick={handleInjectChaos}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:scale-105"
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
              }}
            >
              <Zap size={12} />
              Inject Chaos
            </button>
          </div>

          {/* Network Throttle */}
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.1)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Wifi size={13} className="text-cyan-400" />
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Network Throttle</span>
            </div>
            <SliderRow
              label="Packet Loss"
              icon={<Radio size={12} />}
              value={sliders.packetLoss}
              max={100}
              unit="%"
              color="#06b6d4"
              onChange={(v) => handleSliderChange("packetLoss", v)}
            />
            <SliderRow
              label="Jitter"
              icon={<TrendingUp size={12} />}
              value={sliders.jitterMs}
              max={500}
              unit="ms"
              color="#06b6d4"
              onChange={(v) => handleSliderChange("jitterMs", v)}
            />
          </div>

          {/* Server Stress */}
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield size={13} className="text-amber-400" />
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">Server Stress</span>
            </div>
            <SliderRow
              label="CPU Starvation"
              icon={<Cpu size={12} />}
              value={sliders.cpuStarvation}
              max={100}
              unit="%"
              color="#f59e0b"
              onChange={(v) => handleSliderChange("cpuStarvation", v)}
            />
            <SliderRow
              label="Memory Starvation"
              icon={<HardDrive size={12} />}
              value={sliders.memoryStarvation}
              max={100}
              unit="%"
              color="#f59e0b"
              onChange={(v) => handleSliderChange("memoryStarvation", v)}
            />
          </div>

          {/* Fault injection buttons */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Network Fault", type: "network", color: "#06b6d4", icon: <Wifi size={12} /> },
              { label: "CPU Fault", type: "cpu", color: "#f59e0b", icon: <Cpu size={12} /> },
              { label: "Memory Fault", type: "memory", color: "#f97316", icon: <HardDrive size={12} /> },
              { label: "Critical Fault", type: "fault", color: "#ef4444", icon: <AlertTriangle size={12} /> },
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => metrics.injectFault(btn.type)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all hover:scale-105"
                style={{
                  background: `${btn.color}10`,
                  border: `1px solid ${btn.color}30`,
                  color: btn.color,
                }}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Chaos Event Log */}
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" style={cardStyle} className="rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest">Chaos Event Log</h2>
              <p className="text-xs font-mono text-zinc-600 mt-0.5">{chaosLog.length} events recorded</p>
            </div>
            {chaosLog.length > 0 && (
              <button
                onClick={() => setChaosLog([])}
                className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {chaosLog.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <AlertCircle size={24} className="text-zinc-700 mb-3" />
                  <p className="text-xs font-mono text-zinc-600">No chaos events yet.</p>
                  <p className="text-[10px] font-mono text-zinc-700 mt-1">Click &quot;Inject Chaos&quot; to simulate a failure.</p>
                </motion.div>
              ) : (
                chaosLog.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="rounded-xl p-3"
                    style={{
                      background: SEVERITY_BG[event.severity],
                      border: `1px solid ${SEVERITY_COLORS[event.severity]}30`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{
                            background: `${SEVERITY_COLORS[event.severity]}20`,
                            color: SEVERITY_COLORS[event.severity],
                          }}
                        >
                          {event.severity}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">{event.type.toUpperCase()}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-700 tabular-nums flex-shrink-0">{event.timestamp}</span>
                    </div>
                    <p className="text-xs font-mono text-zinc-300 leading-relaxed">{event.description}</p>
                    <p className="text-[10px] font-mono text-zinc-600 mt-1 leading-relaxed">
                      <span style={{ color: SEVERITY_COLORS[event.severity] }}>Impact: </span>
                      {event.impact}
                    </p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── Stage Detail Table ── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" style={cardStyle} className="rounded-2xl p-6">
        <h2 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest mb-4">Stage Execution Detail</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(16,185,129,0.1)" }}>
                {["Stage", "Status", "Duration", "Tests", "Gate"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] text-zinc-600 uppercase tracking-widest font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stages.map((stage) => (
                <tr
                  key={stage.id}
                  style={{ borderBottom: "1px solid rgba(16,185,129,0.04)" }}
                  className="hover:bg-emerald-500/5 transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span style={{ color: stage.color }}>{ICON_MAP[stage.icon]}</span>
                      <span className="text-zinc-300">{stage.label}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={stage.status} />
                      <span
                        style={{
                          color:
                            stage.status === "passed"
                              ? "#10b981"
                              : stage.status === "failed"
                              ? "#ef4444"
                              : stage.status === "running"
                              ? "#f59e0b"
                              : "#52525b",
                        }}
                      >
                        {stage.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-500 tabular-nums">
                    {stage.duration ? `${stage.duration}s` : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-500 tabular-nums">
                    {stage.tests > 0 ? stage.tests : "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    {stage.status === "passed" ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check size={11} /> PASS
                      </span>
                    ) : stage.status === "failed" ? (
                      <span className="text-red-400 flex items-center gap-1">
                        <XCircle size={11} /> FAIL
                      </span>
                    ) : stage.status === "running" ? (
                      <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                        <Clock size={11} /> RUNNING
                      </span>
                    ) : (
                      <span className="text-zinc-700">PENDING</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Footer note ── */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center pb-8">
        <p className="text-[10px] font-mono text-zinc-700">
          {brand.name} · Chaos Engineering & Pipeline Gate · All fault injections are simulated
        </p>
      </motion.div>
    </div>
  );
}
