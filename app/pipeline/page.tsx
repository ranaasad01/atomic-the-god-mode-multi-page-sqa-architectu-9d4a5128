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
    label: "Regression Analysis",
    icon: "Activity",
    color: "#f59e0b",
    status: "running",
    duration: null,
    tests: 198,
  },
  {
    id: "integration",
    label: "API Integration Tests (Postman/Playwright)",
    icon: "GitBranch",
    color: "#06b6d4",
    status: "idle",
    duration: null,
    tests: 0,
  },
  {
    id: "e2e",
    label: "E2E Playwright — Veridat Platform",
    icon: "Terminal",
    color: "#10b981",
    status: "idle",
    duration: null,
    tests: 0,
  },
  {
    id: "security",
    label: "Auth & RBAC Security Scan",
    icon: "Lock",
    color: "#ef4444",
    status: "idle",
    duration: null,
    tests: 0,
  },
];

// ─── Chaos events (updated to reflect Rao's QA scenarios) ────────────────────

const INITIAL_CHAOS_EVENTS: ChaosEvent[] = [
  {
    id: "ce-001",
    timestamp: "14:22:07",
    type: "network-throttle",
    severity: "medium",
    description: "Network throttle applied — simulating 3G mobile connection for mobile viewport tests",
    impact: "Page load time increased to 4.2s, LCP degraded on mobile breakpoints",
  },
  {
    id: "ce-002",
    timestamp: "14:31:44",
    type: "api-fault",
    severity: "high",
    description: "API endpoint /api/datasets returned 500 — fault injected for error handling validation",
    impact: "Error boundary triggered, retry logic validated, user-facing error message confirmed",
  },
  {
    id: "ce-003",
    timestamp: "14:38:12",
    type: "session-timeout",
    severity: "medium",
    description: "Session timeout simulated — verifying OTP re-authentication flow",
    impact: "OTP re-auth modal displayed correctly, session restored after verification",
  },
  {
    id: "ce-004",
    timestamp: "14:45:00",
    type: "stress-test",
    severity: "critical",
    description: "Large file upload (2GB) stress test initiated — monitoring memory and timeout behavior",
    impact: "Memory usage peaked at 87%, upload timeout at 120s, progress indicator validated",
  },
];

// ─── Gate rules (updated to Rao's QA standards) ───────────────────────────────

const GATE_RULES = [
  {
    id: "gr-001",
    label: "Pass Rate ≥ 95%",
    current: "97.2%",
    status: "pass" as const,
    description: "All functional and regression test suites must maintain a minimum 95% pass rate before pipeline proceeds.",
  },
  {
    id: "gr-002",
    label: "API Response Time < 500ms",
    current: "142ms",
    status: "pass" as const,
    description: "All Postman/Playwright API integration tests must respond within 500ms under standard load conditions.",
  },
  {
    id: "gr-003",
    label: "Zero Critical Security Failures",
    current: "0",
    status: "pass" as const,
    description: "Auth flows, OTP verification, session handling, and RBAC must pass with zero critical security violations.",
  },
  {
    id: "gr-004",
    label: "Cross-Platform Coverage: macOS, Linux, Windows",
    current: "PASS",
    status: "pass" as const,
    description: "Desktop application tests must pass across all three target platforms before release gate opens.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StageNode({
  stage,
  index,
  isLast,
}: {
  stage: PipelineStage;
  index: number;
  isLast: boolean;
}) {
  const statusColors: Record<StageStatus, string> = {
    idle: "#3f3f46",
    running: "#f59e0b",
    passed: "#10b981",
    failed: "#ef4444",
    skipped: "#6b7280",
  };

  const statusBg: Record<StageStatus, string> = {
    idle: "rgba(63,63,70,0.15)",
    running: "rgba(245,158,11,0.12)",
    passed: "rgba(16,185,129,0.12)",
    failed: "rgba(239,68,68,0.12)",
    skipped: "rgba(107,114,128,0.12)",
  };

  const color = statusColors[stage.status];
  const bg = statusBg[stage.status];

  return (
    <motion.div
      variants={scaleIn}
      className="flex items-center gap-2"
    >
      <div
        className="relative flex flex-col items-center gap-1 px-3 py-3 rounded-lg border min-w-[120px] cursor-default"
        style={{
          borderColor: `${color}40`,
          background: bg,
          boxShadow: stage.status === "running" ? `0 0 16px ${color}30` : "none",
        }}
      >
        {/* Pulsing ring for running */}
        {stage.status === "running" && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ border: `1px solid ${color}` }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}

        <div style={{ color }}>{ICON_MAP[stage.icon]}</div>
        <span className="text-[10px] font-mono text-center leading-tight" style={{ color }}>
          {stage.label}
        </span>
        <span
          className="text-[9px] font-mono uppercase tracking-widest"
          style={{ color: `${color}99` }}
        >
          {stage.status}
        </span>
        {stage.duration !== null && (
          <span className="text-[9px] font-mono" style={{ color: "#52525b" }}>
            {stage.duration}s
          </span>
        )}
        {stage.tests > 0 && (
          <span className="text-[9px] font-mono" style={{ color: "#52525b" }}>
            {stage.tests} tests
          </span>
        )}
      </div>

      {!isLast && (
        <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
      )}
    </motion.div>
  );
}

function ChaosEventCard({ event }: { event: ChaosEvent }) {
  const color = SEVERITY_COLORS[event.severity];
  const bg = SEVERITY_BG[event.severity];

  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-lg border p-3 space-y-1"
      style={{ borderColor: `${color}30`, background: bg }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
          />
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color }}>
            {event.severity}
          </span>
          <span className="text-[10px] font-mono text-zinc-500">{event.type}</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-600">{event.timestamp}</span>
      </div>
      <p className="text-[11px] font-mono text-zinc-300 leading-relaxed">{event.description}</p>
      <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
        <span style={{ color: "#06b6d4" }}>impact: </span>
        {event.impact}
      </p>
    </motion.div>
  );
}

function GateRuleRow({
  rule,
}: {
  rule: (typeof GATE_RULES)[number];
}) {
  const statusColor =
    rule.status === "pass" ? "#10b981" : rule.status === "warn" ? "#f59e0b" : "#ef4444";
  const statusBg =
    rule.status === "pass"
      ? "rgba(16,185,129,0.08)"
      : rule.status === "warn"
      ? "rgba(245,158,11,0.08)"
      : "rgba(239,68,68,0.08)";

  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-start justify-between gap-4 p-3 rounded-lg border"
      style={{ borderColor: `${statusColor}25`, background: statusBg }}
    >
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
          />
          <span className="text-xs font-mono font-semibold" style={{ color: statusColor }}>
            {rule.label}
          </span>
        </div>
        <p className="text-[10px] font-mono text-zinc-500 leading-relaxed pl-3.5">
          {rule.description}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-mono font-bold tabular-nums" style={{ color: statusColor }}>
          {rule.current}
        </div>
        <div
          className="text-[9px] font-mono uppercase tracking-widest"
          style={{ color: `${statusColor}80` }}
        >
          {rule.status}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Chaos Control Panel ──────────────────────────────────────────────────────

function ChaosControlPanel({
  sliders,
  onSliderChange,
  onInjectFault,
  isFaultInjected,
  systemHealth,
  p99Latency,
}: {
  sliders: SliderConfig;
  onSliderChange: (key: keyof SliderConfig, value: number) => void;
  onInjectFault: (type: string) => void;
  isFaultInjected: boolean;
  systemHealth: number;
  p99Latency: number;
}) {
  const sliderDefs: Array<{
    key: keyof SliderConfig;
    label: string;
    unit: string;
    max: number;
    color: string;
    icon: React.ReactNode;
    group: string;
  }> = [
    {
      key: "packetLoss",
      label: "Packet Loss",
      unit: "%",
      max: 100,
      color: "#f59e0b",
      icon: <Wifi size={12} />,
      group: "Network Throttling",
    },
    {
      key: "jitterMs",
      label: "Jitter",
      unit: "ms",
      max: 500,
      color: "#f59e0b",
      icon: <Radio size={12} />,
      group: "Network Throttling",
    },
    {
      key: "cpuStarvation",
      label: "CPU Starvation",
      unit: "%",
      max: 100,
      color: "#ef4444",
      icon: <Cpu size={12} />,
      group: "Server Stress",
    },
    {
      key: "memoryStarvation",
      label: "Memory Starvation",
      unit: "%",
      max: 100,
      color: "#ef4444",
      icon: <MemoryStick size={12} />,
      group: "Server Stress",
    },
  ];

  const networkSliders = sliderDefs.filter((s) => s.group === "Network Throttling");
  const serverSliders = sliderDefs.filter((s) => s.group === "Server Stress");

  const healthColor =
    systemHealth > 80 ? "#10b981" : systemHealth > 50 ? "#f59e0b" : "#ef4444";

  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-xl border p-5 space-y-5"
      style={{
        borderColor: isFaultInjected ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.12)",
        background: isFaultInjected
          ? "rgba(239,68,68,0.04)"
          : "rgba(9,9,11,0.6)",
        backdropFilter: "blur(12px)",
        transition: "border-color 0.4s, background 0.4s",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: isFaultInjected ? "#ef4444" : "#f59e0b" }} />
          <span className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-widest">
            Chaos Control Panel
          </span>
          {isFaultInjected && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}
            >
              FAULT ACTIVE
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono text-zinc-600">SYS HEALTH</div>
            <div className="text-sm font-mono font-bold tabular-nums" style={{ color: healthColor }}>
              {systemHealth.toFixed(1)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-zinc-600">P99</div>
            <div className="text-sm font-mono font-bold tabular-nums" style={{ color: "#06b6d4" }}>
              {p99Latency}ms
            </div>
          </div>
        </div>
      </div>

      {/* Network Throttling */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wifi size={11} className="text-amber-400" />
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
            Network Throttling
          </span>
        </div>
        {networkSliders.map((s) => (
          <div key={s.key} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5" style={{ color: s.color }}>
                {s.icon}
                <span className="text-[10px] font-mono">{s.label}</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums" style={{ color: s.color }}>
                {sliders[s.key]}
                {s.unit}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={s.max}
              value={sliders[s.key]}
              onChange={(e) => onSliderChange(s.key, Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${s.color} ${(sliders[s.key] / s.max) * 100}%, #27272a ${(sliders[s.key] / s.max) * 100}%)`,
                accentColor: s.color,
              }}
            />
          </div>
        ))}
      </div>

      {/* Server Stress */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Cpu size={11} className="text-red-400" />
          <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest">
            Server Stress
          </span>
        </div>
        {serverSliders.map((s) => (
          <div key={s.key} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5" style={{ color: s.color }}>
                {s.icon}
                <span className="text-[10px] font-mono">{s.label}</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums" style={{ color: s.color }}>
                {sliders[s.key]}
                {s.unit}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={s.max}
              value={sliders[s.key]}
              onChange={(e) => onSliderChange(s.key, Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${s.color} ${(sliders[s.key] / s.max) * 100}%, #27272a ${(sliders[s.key] / s.max) * 100}%)`,
                accentColor: s.color,
              }}
            />
          </div>
        ))}
      </div>

      {/* Fault injection buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {[
          { label: "Inject Network Fault", type: "network", color: "#f59e0b" },
          { label: "Inject API 500 Error", type: "api-fault", color: "#ef4444" },
          { label: "Simulate Session Timeout", type: "session-timeout", color: "#06b6d4" },
          { label: "Stress File Upload", type: "stress-test", color: "#ef4444" },
        ].map((btn) => (
          <button
            key={btn.type}
            onClick={() => onInjectFault(btn.type)}
            className="px-3 py-2 rounded-lg border text-[10px] font-mono uppercase tracking-widest transition-all duration-200 hover:opacity-80 active:scale-95"
            style={{
              borderColor: `${btn.color}40`,
              background: `${btn.color}10`,
              color: btn.color,
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const t = useTranslations();
  const metrics = useMetricsStore();

  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [chaosEvents, setChaosEvents] = useState<ChaosEvent[]>(INITIAL_CHAOS_EVENTS);
  const [sliders, setSliders] = useState<SliderConfig>({
    packetLoss: 0,
    jitterMs: 0,
    cpuStarvation: 0,
    memoryStarvation: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const runRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tick, setTick] = useState(0);

  // Tick for live updates
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Slider change handler
  const handleSliderChange = useCallback(
    (key: keyof SliderConfig, value: number) => {
      setSliders((prev) => ({ ...prev, [key]: value }));
      const intensity = value / 10;
      if (intensity > 0) {
        metrics.triggerChaosEvent(intensity);
      }
    },
    [metrics]
  );

  // Inject fault handler
  const handleInjectFault = useCallback(
    (type: string) => {
      metrics.injectFault(type);
      const newEvent: ChaosEvent = {
        id: `ce-${Date.now()}`,
        timestamp: formatTs(new Date()),
        type,
        severity: "critical",
        description: {
          network: "Network throttle applied — simulating 3G mobile connection for mobile viewport tests",
          "api-fault": "API endpoint /api/datasets returned 500 — fault injected for error handling validation",
          "session-timeout": "Session timeout simulated — verifying OTP re-authentication flow",
          "stress-test": "Large file upload (2GB) stress test initiated — monitoring memory and timeout behavior",
        }[type] ?? `Fault injected: ${type}`,
        impact: "System degradation detected — monitoring recovery metrics",
      };
      setChaosEvents((prev) => [newEvent, ...prev.slice(0, 7)]);
    },
    [metrics]
  );

  // Pipeline run simulation
  const handleRunPipeline = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setRunProgress(0);
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: "idle" as StageStatus })));

    const stageIds = INITIAL_STAGES.map((s) => s.id);
    let currentIdx = 0;

    const runNext = () => {
      if (currentIdx >= stageIds.length) {
        setIsRunning(false);
        setRunProgress(100);
        return;
      }

      const id = stageIds[currentIdx];
      setStages((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "running" } : s))
      );
      setRunProgress(Math.round((currentIdx / stageIds.length) * 100));

      const duration = 1200 + Math.random() * 1800;
      runRef.current = setTimeout(() => {
        const passed = Math.random() > 0.12;
        setStages((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: passed ? "passed" : "failed",
                  duration: parseFloat((duration / 1000).toFixed(1)),
                  tests: s.tests || Math.floor(Math.random() * 200 + 50),
                }
              : s
          )
        );
        currentIdx++;
        runNext();
      }, duration);
    };

    runNext();
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (runRef.current) clearTimeout(runRef.current);
    };
  }, []);

  const passedStages = stages.filter((s) => s.status === "passed").length;
  const failedStages = stages.filter((s) => s.status === "failed").length;
  const totalIntensity =
    (sliders.packetLoss / 100 +
      sliders.jitterMs / 500 +
      sliders.cpuStarvation / 100 +
      sliders.memoryStarvation / 100) *
    25;

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 space-y-8">
      {/* Page header */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }}
          />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            {brand.shortName} // chaos-engineering-pipeline-gate
          </span>
        </motion.div>
        <motion.h1
          variants={fadeInUp}
          className="text-2xl md:text-3xl font-mono font-bold text-zinc-100"
        >
          Chaos &amp; Pipeline Gate
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-sm font-mono text-zinc-500 max-w-2xl">
          Multi-stage quality gate enforcement with real-time chaos injection. Validates Rao's QA
          workflow across Lint, Functional, Regression, API, E2E Playwright, and Security stages.
        </motion.p>
      </motion.div>

      {/* Top stats bar */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          {
            label: "Stages Passed",
            value: `${passedStages}/${stages.length}`,
            color: "#10b981",
          },
          {
            label: "Stages Failed",
            value: String(failedStages),
            color: failedStages > 0 ? "#ef4444" : "#10b981",
          },
          {
            label: "System Health",
            value: `${metrics.systemHealth.toFixed(1)}%`,
            color:
              metrics.systemHealth > 80
                ? "#10b981"
                : metrics.systemHealth > 50
                ? "#f59e0b"
                : "#ef4444",
          },
          {
            label: "P99 Latency",
            value: `${metrics.p99Latency}ms`,
            color: metrics.p99Latency > 500 ? "#ef4444" : "#06b6d4",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={scaleIn}
            className="rounded-lg border p-3 text-center"
            style={{
              borderColor: `${stat.color}25`,
              background: `${stat.color}08`,
            }}
          >
            <div
              className="text-xl font-mono font-bold tabular-nums"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-0.5">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pipeline conveyor */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="rounded-xl border p-5 space-y-4"
        style={{
          borderColor: "rgba(16,185,129,0.12)",
          background: "rgba(9,9,11,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch size={14} className="text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-widest">
              Pipeline Conveyor
            </span>
            {isRunning && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}
              >
                RUNNING
              </motion.span>
            )}
          </div>
          <button
            onClick={handleRunPipeline}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-widest transition-all duration-200 hover:opacity-80 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              borderColor: "rgba(16,185,129,0.3)",
              background: "rgba(16,185,129,0.08)",
              color: "#10b981",
            }}
          >
            <RefreshCw size={11} className={isRunning ? "animate-spin" : ""} />
            {isRunning ? "Running…" : "Run Pipeline"}
          </button>
        </div>

        {/* Progress bar */}
        {isRunning && (
          <div className="w-full h-0.5 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "#10b981" }}
              animate={{ width: `${runProgress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}

        {/* Stage nodes */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-2 items-center"
        >
          {stages.map((stage, i) => (
            <StageNode
              key={stage.id}
              stage={stage}
              index={i}
              isLast={i === stages.length - 1}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Chaos Control Panel */}
        <ChaosControlPanel
          sliders={sliders}
          onSliderChange={handleSliderChange}
          onInjectFault={handleInjectFault}
          isFaultInjected={metrics.isFaultInjected}
          systemHealth={metrics.systemHealth}
          p99Latency={metrics.p99Latency}
        />

        {/* Right: Chaos Event Log */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl border p-5 space-y-4"
          style={{
            borderColor: "rgba(16,185,129,0.12)",
            background: "rgba(9,9,11,0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-widest">
              Chaos Event Log
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded ml-auto"
              style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
            >
              {chaosEvents.length} events
            </span>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-2 max-h-80 overflow-y-auto pr-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#27272a transparent" }}
          >
            <AnimatePresence mode="popLayout">
              {chaosEvents.map((event) => (
                <ChaosEventCard key={event.id} event={event} />
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      {/* Gate Rules */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="rounded-xl border p-5 space-y-4"
        style={{
          borderColor: "rgba(16,185,129,0.12)",
          background: "rgba(9,9,11,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-emerald-400" />
          <span className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-widest">
            Quality Gate Rules
          </span>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded ml-auto"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
          >
            {GATE_RULES.filter((r) => r.status === "pass").length}/{GATE_RULES.length} PASSING
          </span>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {GATE_RULES.map((rule) => (
            <GateRuleRow key={rule.id} rule={rule} />
          ))}
        </motion.div>
      </motion.div>

      {/* Chaos intensity indicator */}
      {totalIntensity > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="rounded-xl border p-4"
          style={{
            borderColor: `rgba(239,68,68,${Math.min(0.6, totalIntensity / 100)})`,
            background: `rgba(239,68,68,${Math.min(0.06, totalIntensity / 1000)})`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500"
                style={{ boxShadow: "0 0 8px #ef4444" }}
              />
              <span className="text-xs font-mono text-red-400 uppercase tracking-widest">
                Chaos Intensity Active
              </span>
            </div>
            <span className="text-sm font-mono font-bold tabular-nums text-red-400">
              {totalIntensity.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-red-500"
              animate={{ width: `${Math.min(100, totalIntensity)}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            />
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-2">
            Visual degradation propagated across all shader components. Adjust sliders to modulate
            fault intensity across network throttling and server stress dimensions.
          </p>
        </motion.div>
      )}
    </div>
  );
}
