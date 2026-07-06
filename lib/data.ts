export interface NavLink {
  label: string;
  href: string;
  type: "route" | "anchor";
  badge?: string;
}

export interface BrandConstants {
  name: string;
  shortName: string;
  tagline: string;
  version: string;
}

export const brand: BrandConstants = {
  name: "Rao Muhammad Ali",
  shortName: "RMA",
  tagline: "Software Quality Assurance Engineer · DaticsAI, Lahore, Pakistan",
  version: "v1.0.0",
};

export const navLinks: NavLink[] = [
  {
    label: "Mission Control Dashboard",
    href: "/",
    type: "route",
    badge: "LIVE",
  },
  {
    label: "Automation Suite",
    href: "/automation",
    type: "route",
    badge: "HIGH",
  },
  {
    label: "Chaos & Pipeline Gate",
    href: "/pipeline",
    type: "route",
    badge: "GATE",
  },
  {
    label: "Deep-Tech Methodology",
    href: "/methodology",
    type: "route",
  },
];

export const footerLinks: NavLink[] = [
  { label: "Mission Control Dashboard", href: "/", type: "route" },
  { label: "Automation Suite", href: "/automation", type: "route" },
  { label: "Chaos & Pipeline Gate", href: "/pipeline", type: "route" },
  { label: "Deep-Tech Methodology", href: "/methodology", type: "route" },
];

export interface MetricSnapshot {
  label: string;
  value: string;
  unit: string;
  status: "nominal" | "warning" | "critical";
}

export const initialMetrics: MetricSnapshot[] = [
  { label: "System Health", value: "98.4", unit: "%", status: "nominal" },
  { label: "P99 Latency", value: "142", unit: "ms", status: "nominal" },
  { label: "Pass Rate", value: "97.2", unit: "%", status: "nominal" },
  { label: "Throughput", value: "1,847", unit: "RPS", status: "nominal" },
];

export const techStack: string[] = [
  "Playwright",
  "Postman",
  "JMeter",
  "ClickUp",
  "Jira",
  "Git",
  "HTML",
  "CSS",
  "JavaScript",
  "MySQL",
  "MongoDB",
  "Agile/Scrum",
];

export const pipelineStages = [
  { id: "lint", label: "Lint", icon: "FileCode", color: "#06b6d4" },
  { id: "unit", label: "Unit", icon: "Check", color: "#10b981" },
  { id: "mutation", label: "Mutation", icon: "Activity", color: "#f59e0b" },
  { id: "integration", label: "Integration", icon: "GitBranch", color: "#06b6d4" },
  { id: "e2e", label: "E2E", icon: "Terminal", color: "#10b981" },
  { id: "security", label: "Security", icon: "Lock", color: "#ef4444" },
] as const;

export type PipelineStageId = (typeof pipelineStages)[number]["id"];
