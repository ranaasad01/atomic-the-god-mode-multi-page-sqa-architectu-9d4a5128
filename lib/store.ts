import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface TerminalLog {
  id: string;
  timestamp: number;
  level: "info" | "warn" | "error" | "pass" | "fail" | "debug";
  message: string;
  source?: string;
}

export interface ChaosEvent {
  id: string;
  type: "network" | "cpu" | "memory" | "fault";
  severity: number;
  timestamp: number;
  active: boolean;
}

export interface ActiveTestRun {
  id: string;
  name: string;
  startedAt: number;
  stage: string;
  workers: number;
  progress: number;
}

export interface MetricsState {
  systemHealth: number;
  activeTestRun: ActiveTestRun | null;
  p99Latency: number;
  passedCount: number;
  failedCount: number;
  throughputRPS: number;
  flakinessIndex: number;
  cpuUsage: number;
  memoryUsage: number;
  networkPacketLoss: number;
  networkJitter: number;
  activeChaosEvents: ChaosEvent[];
  terminalLogs: TerminalLog[];
  isFaultInjected: boolean;
  mutationScore: number;
}

export interface MetricsActions {
  triggerChaosEvent: (type: ChaosEvent["type"], severity: number) => void;
  injectFault: () => void;
  clearFault: () => void;
  streamTerminalLog: (log: Omit<TerminalLog, "id" | "timestamp">) => void;
  setNetworkThrottle: (packetLoss: number, jitter: number) => void;
  setServerStress: (cpu: number, memory: number) => void;
  startTestRun: (name: string, workers: number) => void;
  updateTestProgress: (passed: number, failed: number, progress: number) => void;
  resetMetrics: () => void;
}

export type MetricsStore = MetricsState & MetricsActions;

const initialState: MetricsState = {
  systemHealth: 98.4,
  activeTestRun: null,
  p99Latency: 142,
  passedCount: 0,
  failedCount: 0,
  throughputRPS: 1847,
  flakinessIndex: 2.3,
  cpuUsage: 34,
  memoryUsage: 48,
  networkPacketLoss: 0,
  networkJitter: 0,
  activeChaosEvents: [],
  terminalLogs: [],
  isFaultInjected: false,
  mutationScore: 87.4,
};

export const useMetricsStore = create<MetricsStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    triggerChaosEvent: (type, severity) => {
      const event: ChaosEvent = {
        id: `chaos-${Date.now()}`,
        type,
        severity,
        timestamp: Date.now(),
        active: true,
      };

      const latencyDelta = severity * 8;
      const healthDelta = severity * 0.5;

      set((state) => ({
        activeChaosEvents: [...state.activeChaosEvents.slice(-9), event],
        p99Latency: Math.min(2000, state.p99Latency + latencyDelta),
        systemHealth: Math.max(10, state.systemHealth - healthDelta),
        flakinessIndex: Math.min(50, state.flakinessIndex + severity * 0.3),
      }));

      get().streamTerminalLog({
        level: "warn",
        message: `[CHAOS] ${type.toUpperCase()} event injected — severity ${severity}/10`,
        source: "chaos-controller",
      });

      setTimeout(() => {
        set((state) => ({
          activeChaosEvents: state.activeChaosEvents.map((e) =>
            e.id === event.id ? { ...e, active: false } : e
          ),
          p99Latency: Math.max(80, state.p99Latency - latencyDelta * 0.7),
          systemHealth: Math.min(100, state.systemHealth + healthDelta * 0.6),
        }));
      }, 8000);
    },

    injectFault: () => {
      set({
        isFaultInjected: true,
        p99Latency: 1800,
        systemHealth: 12,
        flakinessIndex: 48,
      });

      get().streamTerminalLog({
        level: "error",
        message: "[FAULT] Critical fault injected — vertex warp engaged",
        source: "fault-injector",
      });

      setTimeout(() => {
        set({
          isFaultInjected: false,
          p99Latency: 142,
          systemHealth: 98.4,
          flakinessIndex: 2.3,
        });
        get().streamTerminalLog({
          level: "info",
          message: "[RECOVERY] System stabilized — fault cleared",
          source: "fault-injector",
        });
      }, 5000);
    },

    clearFault: () => {
      set({
        isFaultInjected: false,
        p99Latency: 142,
        systemHealth: 98.4,
        flakinessIndex: 2.3,
        activeChaosEvents: [],
      });
    },

    streamTerminalLog: (log) => {
      const entry: TerminalLog = {
        ...log,
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      };
      set((state) => ({
        terminalLogs: [...state.terminalLogs.slice(-199), entry],
      }));
    },

    setNetworkThrottle: (packetLoss, jitter) => {
      const latencyBoost = jitter * 0.8 + packetLoss * 3;
      set((state) => ({
        networkPacketLoss: packetLoss,
        networkJitter: jitter,
        p99Latency: Math.max(80, 142 + latencyBoost),
        systemHealth: Math.max(10, 98.4 - packetLoss * 0.4 - jitter * 0.05),
      }));
    },

    setServerStress: (cpu, memory) => {
      set({
        cpuUsage: cpu,
        memoryUsage: memory,
        systemHealth: Math.max(
          10,
          98.4 - Math.max(0, cpu - 70) * 0.3 - Math.max(0, memory - 70) * 0.2
        ),
        throughputRPS: Math.max(
          100,
          1847 - Math.max(0, cpu - 50) * 8 - Math.max(0, memory - 50) * 4
        ),
      });
    },

    startTestRun: (name, workers) => {
      const run: ActiveTestRun = {
        id: `run-${Date.now()}`,
        name,
        startedAt: Date.now(),
        stage: "lint",
        workers,
        progress: 0,
      };
      set({ activeTestRun: run, passedCount: 0, failedCount: 0 });
      get().streamTerminalLog({
        level: "info",
        message: `[RUNNER] Starting test run "${name}" with ${workers} workers`,
        source: "test-runner",
      });
    },

    updateTestProgress: (passed, failed, progress) => {
      set((state) => ({
        passedCount: passed,
        failedCount: failed,
        activeTestRun: state.activeTestRun
          ? { ...state.activeTestRun, progress }
          : null,
      }));
    },

    resetMetrics: () => {
      set(initialState);
    },
  }))
);