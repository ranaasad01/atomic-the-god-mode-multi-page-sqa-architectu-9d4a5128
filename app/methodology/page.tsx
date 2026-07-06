"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Activity, Check, Terminal, GitBranch, FileCode, Lock, Star, Circle, Sparkles, ArrowRight, Clock, Eye, AlertTriangle } from 'lucide-react';
import { fadeInUp, fadeIn, staggerContainer, scaleIn } from "@/lib/motion";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AccordionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  content: React.ReactNode;
}

interface TimelineMilestone {
  year: string;
  title: string;
  description: string;
  tags: string[];
  side: "left" | "right";
}

interface ComparisonRow {
  metric: string;
  manual: number;
  automated: number;
  mutation: number;
  unit: string;
}

interface TagItem {
  label: string;
  detail: string;
  category: string;
  color: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const timelineMilestones: TimelineMilestone[] = [
  {
    year: "2018",
    title: "Shift-Left Testing Adoption",
    description:
      "Embedded quality engineers directly into feature squads. Unit test coverage mandated at 80% before any PR merge. Reduced production defect escape rate by 34% in the first quarter.",
    tags: ["Unit Testing", "CI Integration", "Coverage Gates"],
    side: "left",
  },
  {
    year: "2019",
    title: "Contract Testing at Scale",
    description:
      "Introduced Pact-based consumer-driven contract tests across 47 microservices. Eliminated integration environment flakiness caused by schema drift. Mean time to detect breaking changes dropped from 4 days to 12 minutes.",
    tags: ["Pact", "Microservices", "Schema Validation"],
    side: "right",
  },
  {
    year: "2020",
    title: "Mutation Testing Mandate",
    description:
      "Deployed Stryker across all TypeScript repositories. Established mutation score thresholds (MS ≥ 75%) as a hard pipeline gate. Discovered 1,200+ surviving mutants in legacy codebases previously reporting 90% line coverage.",
    tags: ["Stryker", "Mutation Score", "Pipeline Gate"],
    side: "left",
  },
  {
    year: "2021",
    title: "Property-Based Testing Integration",
    description:
      "Adopted fast-check for domain-critical business logic. Generated over 10,000 edge-case inputs per test run. Uncovered 23 previously unknown boundary condition failures in payment processing logic.",
    tags: ["fast-check", "Property Testing", "Edge Cases"],
    side: "right",
  },
  {
    year: "2022",
    title: "Chaos Engineering Framework",
    description:
      "Launched structured chaos experiments using Chaos Monkey and custom fault injection tooling. Defined steady-state hypotheses for all Tier-1 services. Improved MTTR from 47 minutes to 8 minutes through resilience hardening.",
    tags: ["Chaos Monkey", "Fault Injection", "Resilience"],
    side: "left",
  },
  {
    year: "2023",
    title: "AI-Augmented Test Generation",
    description:
      "Integrated LLM-assisted test scaffolding for new feature branches. Reduced test authoring time by 60%. Implemented semantic deduplication to prevent test suite bloat. Maintained mutation score above 82% across all repositories.",
    tags: ["LLM", "Test Generation", "Deduplication"],
    side: "right",
  },
  {
    year: "2024",
    title: "Observability-Driven Quality",
    description:
      "Unified test telemetry with production observability. P99 latency regressions now trigger automated bisect runs. Quality signals feed directly into deployment confidence scores used by the release orchestration system.",
    tags: ["OpenTelemetry", "Deployment Confidence", "Bisect"],
    side: "left",
  },
];

const comparisonRows: ComparisonRow[] = [
  { metric: "Defect Detection Rate", manual: 42, automated: 78, mutation: 94, unit: "%" },
  { metric: "Execution Speed", manual: 8, automated: 72, mutation: 65, unit: "pts" },
  { metric: "Coverage Depth", manual: 35, automated: 81, mutation: 96, unit: "%" },
  { metric: "Regression Confidence", manual: 28, automated: 74, mutation: 91, unit: "%" },
  { metric: "False Positive Rate", manual: 62, automated: 18, mutation: 7, unit: "%" },
  { metric: "Maintenance Cost", manual: 85, automated: 45, mutation: 38, unit: "pts" },
];

const tagItems: TagItem[] = [
  { label: "Property-Based", detail: "Generates thousands of inputs automatically to find edge cases in business logic.", category: "Technique", color: "#10b981" },
  { label: "Mutation Testing", detail: "Injects code mutations to verify test suite actually catches defects, not just executes.", category: "Technique", color: "#f59e0b" },
  { label: "Contract Testing", detail: "Validates API contracts between consumers and providers without full integration environments.", category: "Technique", color: "#06b6d4" },
  { label: "Chaos Engineering", detail: "Deliberately introduces failures to validate system resilience and recovery mechanisms.", category: "Practice", color: "#ef4444" },
  { label: "Shift-Left", detail: "Moves testing earlier in the development lifecycle to reduce cost of defect remediation.", category: "Philosophy", color: "#8b5cf6" },
  { label: "TDD", detail: "Test-Driven Development: write failing tests first, then implement the minimum code to pass.", category: "Practice", color: "#10b981" },
  { label: "BDD", detail: "Behavior-Driven Development: express tests in business-readable Gherkin syntax.", category: "Practice", color: "#06b6d4" },
  { label: "Observability", detail: "Instrument tests with traces and metrics to correlate test failures with system behavior.", category: "Infrastructure", color: "#f59e0b" },
  { label: "Snapshot Testing", detail: "Captures UI component output and alerts on unexpected visual or structural regressions.", category: "Technique", color: "#8b5cf6" },
  { label: "Load Testing", detail: "Validates system behavior under expected and peak traffic using k6 or Gatling.", category: "Performance", color: "#ef4444" },
  { label: "Fuzz Testing", detail: "Feeds malformed or random data to APIs and parsers to surface security and stability bugs.", category: "Security", color: "#10b981" },
  { label: "Visual Regression", detail: "Pixel-level comparison of rendered UI against approved baselines using Percy or Chromatic.", category: "Technique", color: "#06b6d4" },
  { label: "Pact", detail: "Consumer-driven contract testing framework for microservice API compatibility verification.", category: "Tool", color: "#f59e0b" },
  { label: "Stryker", detail: "Industry-leading mutation testing framework for JavaScript and TypeScript codebases.", category: "Tool", color: "#ef4444" },
  { label: "fast-check", detail: "Property-based testing library generating arbitrary inputs with shrinking on failure.", category: "Tool", color: "#8b5cf6" },
  { label: "Playwright", detail: "Cross-browser E2E automation with network interception, tracing, and parallel execution.", category: "Tool", color: "#10b981" },
];

// ─── Animated Math Formula ────────────────────────────────────────────────────

function MutationFormula() {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setAnimated(true);
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="my-6 flex flex-col items-center gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={animated ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex items-center gap-3 px-8 py-5 rounded-2xl"
        style={{
          background: "rgba(16,185,129,0.05)",
          border: "1px solid rgba(16,185,129,0.2)",
          boxShadow: "0 0 40px rgba(16,185,129,0.08)",
        }}
      >
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-2xl font-mono font-bold text-emerald-400"
        >
          MS
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={animated ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-2xl font-mono text-zinc-400"
        >
          =
        </motion.span>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={animated ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <span className="text-xl font-mono font-bold text-cyan-400 border-b border-cyan-400/40 pb-1 px-2">K</span>
          <span className="text-xl font-mono font-bold text-amber-400 pt-1 px-2">D</span>
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={animated ? { opacity: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="text-2xl font-mono text-zinc-400"
        >
          ×
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: 20 }}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-2xl font-mono font-bold text-emerald-400"
        >
          100
        </motion.span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={animated ? { opacity: 1 } : {}}
        transition={{ delay: 1.0, duration: 0.4 }}
        className="flex gap-8 text-xs font-mono"
      >
        <span className="text-cyan-400"><span className="font-bold">K</span> = Killed Mutants</span>
        <span className="text-amber-400"><span className="font-bold">D</span> = Total Mutants</span>
        <span className="text-emerald-400"><span className="font-bold">MS</span> = Mutation Score (%)</span>
      </motion.div>
    </div>
  );
}

// ─── Test Pyramid ─────────────────────────────────────────────────────────────

function TestPyramid() {
  const [hovered, setHovered] = useState<string | null>(null);
  const layers = [
    { id: "e2e", label: "E2E Tests", count: "~120", pct: 5, color: "#ef4444", desc: "Full browser automation via Playwright. Validates critical user journeys end-to-end." },
    { id: "integration", label: "Integration Tests", count: "~840", pct: 20, color: "#f59e0b", desc: "Service boundary tests, contract validation, and database interaction tests." },
    { id: "unit", label: "Unit Tests", count: "~4,200", pct: 75, color: "#10b981", desc: "Fast, isolated tests for business logic. Mutation score gate: MS ≥ 75%." },
  ];

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {layers.map((layer, i) => {
        const widthPct = 30 + i * 30;
        return (
          <motion.div
            key={layer.id}
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
            className="relative cursor-pointer"
            style={{ width: `${widthPct}%` }}
            onMouseEnter={() => setHovered(layer.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="relative flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300"
              style={{
                background: hovered === layer.id
                  ? `${layer.color}22`
                  : `${layer.color}11`,
                border: `1px solid ${layer.color}${hovered === layer.id ? "60" : "30"}`,
                boxShadow: hovered === layer.id ? `0 0 20px ${layer.color}20` : "none",
              }}
            >
              <span className="text-xs font-mono font-bold" style={{ color: layer.color }}>
                {layer.label}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-500">{layer.count}</span>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${layer.color}20`, color: layer.color }}
                >
                  {layer.pct}%
                </span>
              </div>
            </div>
            <AnimatePresence>
              {hovered === layer.id && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-full ml-3 top-0 z-20 w-56 p-3 rounded-xl text-xs font-mono text-zinc-300 leading-relaxed"
                  style={{
                    background: "rgba(9,9,11,0.95)",
                    border: `1px solid ${layer.color}40`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
                  }}
                >
                  {layer.desc}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Tag Cloud 2D (canvas-based, no Three.js import needed) ──────────────────

function TagCloud3D({ onTagHover }: { onTagHover: (tag: TagItem | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tagsRef = useRef<Array<{
    item: TagItem;
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    screenX: number; screenY: number; screenZ: number;
  }>>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef<number>(-1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.38;

    // Distribute tags on sphere surface
    tagsRef.current = tagItems.map((item, i) => {
      const phi = Math.acos(-1 + (2 * i) / tagItems.length);
      const theta = Math.sqrt(tagItems.length * Math.PI) * phi;
      return {
        item,
        x: R * Math.sin(phi) * Math.cos(theta),
        y: R * Math.sin(phi) * Math.sin(theta),
        z: R * Math.cos(phi),
        vx: 0, vy: 0, vz: 0,
        screenX: 0, screenY: 0, screenZ: 0,
      };
    });

    let rotX = 0;
    let rotY = 0;

    const project = (x: number, y: number, z: number) => {
      const fov = 400;
      const scale = fov / (fov + z);
      return { sx: cx + x * scale, sy: cy + y * scale, scale };
    };

    const rotateY = (x: number, z: number, angle: number) => ({
      x: x * Math.cos(angle) - z * Math.sin(angle),
      z: x * Math.sin(angle) + z * Math.cos(angle),
    });

    const rotateX = (y: number, z: number, angle: number) => ({
      y: y * Math.cos(angle) - z * Math.sin(angle),
      z: y * Math.sin(angle) + z * Math.cos(angle),
    });

    const draw = () => {
      rotY += 0.003;
      rotX += 0.001;

      ctx.clearRect(0, 0, W, H);

      // Draw subtle sphere outline
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(16,185,129,0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const tags = tagsRef.current;
      tags.forEach((t) => {
        let { x, y, z } = t;
        const ry = rotateY(x, z, rotY);
        x = ry.x; z = ry.z;
        const rx = rotateX(y, z, rotX);
        y = rx.y; z = rx.z;
        const { sx, sy, scale } = project(x, y, z);
        t.screenX = sx;
        t.screenY = sy;
        t.screenZ = z;
      });

      // Sort by z
      const sorted = [...tags].sort((a, b) => a.screenZ - b.screenZ);

      sorted.forEach((t, idx) => {
        const origIdx = tags.indexOf(t);
        const isHovered = hoveredRef.current === origIdx;
        const fov = 400;
        const scale = fov / (fov + t.screenZ);
        const alpha = Math.max(0.2, (t.screenZ + R) / (2 * R));
        const fontSize = Math.max(9, 13 * scale);

        ctx.save();
        ctx.globalAlpha = isHovered ? 1 : alpha * 0.85;
        ctx.font = `${isHovered ? "bold " : ""}${fontSize}px monospace`;
        ctx.fillStyle = isHovered ? "#ffffff" : t.item.color;
        if (isHovered) {
          ctx.shadowColor = t.item.color;
          ctx.shadowBlur = 12;
        }
        ctx.fillText(t.item.label, t.screenX - ctx.measureText(t.item.label).width / 2, t.screenY);
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseRef.current = { x: mx, y: my };

      let closest = -1;
      let minDist = 30;
      tagsRef.current.forEach((t, i) => {
        const dist = Math.hypot(t.screenX - mx, t.screenY - my);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      hoveredRef.current = closest;
      onTagHover(closest >= 0 ? tagsRef.current[closest]?.item ?? null : null);
    };

    const handleMouseLeave = () => {
      hoveredRef.current = -1;
      onTagHover(null);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mounted, onTagHover]);

  if (!mounted) return <div className="w-full h-80 rounded-2xl" style={{ background: "rgba(16,185,129,0.03)" }} />;

  return (
    <canvas
      ref={canvasRef}
      width={520}
      height={380}
      className="w-full rounded-2xl cursor-crosshair"
      style={{ background: "rgba(9,9,11,0.6)", border: "1px solid rgba(16,185,129,0.1)" }}
    />
  );
}

// ─── Comparison Bar ───────────────────────────────────────────────────────────

function ComparisonBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setTimeout(() => setWidth(value), delay);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, delay]);

  return (
    <div ref={ref} className="relative h-5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          boxShadow: `0 0 8px ${color}40`,
          transitionDelay: `${delay}ms`,
        }}
      />
      <span
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────

const accordionVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

function AccordionSection({ items }: { items: AccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>("property-based");

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <motion.div
            key={item.id}
            variants={fadeInUp}
            className="rounded-xl overflow-hidden"
            style={{
              border: `1px solid ${isOpen ? item.color + "40" : "rgba(255,255,255,0.06)"}`,
              background: isOpen ? `${item.color}08` : "rgba(9,9,11,0.6)",
              transition: "border-color 0.3s, background 0.3s",
            }}
          >
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left group"
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}18`, color: item.color }}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-zinc-100 group-hover:text-white transition-colors">
                    {item.title}
                  </div>
                  <div className="text-xs font-mono text-zinc-500">{item.subtitle}</div>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                style={{ color: item.color }}
              >
                <ChevronDown size={16} />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  variants={accordionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: `${item.color}20` }}>
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MethodologyPage() {
  const t = useTranslations();
  const [hoveredTag, setHoveredTag] = useState<TagItem | null>(null);

  const handleTagHover = useCallback((tag: TagItem | null) => {
    setHoveredTag(tag);
  }, []);

  const accordionItems: AccordionItem[] = [
    {
      id: "property-based",
      title: "Property-Based Testing",
      subtitle: "Generative input exploration with fast-check",
      icon: <Sparkles size={16} />,
      color: "#10b981",
      content: (
        <div className="space-y-4 pt-3">
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Property-based testing shifts the burden of example selection from the engineer to the framework. Instead of specifying concrete inputs, you define invariants that must hold for all valid inputs. The framework generates thousands of cases, then shrinks failures to the minimal reproducing example.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "Arbitrary Generators", desc: "Compose generators for domain types: integers, strings, UUIDs, nested objects, and custom ADTs." },
              { label: "Shrinking", desc: "On failure, fast-check automatically reduces the counterexample to its minimal form for debugging." },
              { label: "Stateful Models", desc: "Model-based testing validates stateful systems by comparing a model against the real implementation." },
              { label: "Replay Seeds", desc: "Every run is seeded. Failed runs can be replayed deterministically in CI using the seed value." },
            ].map((f) => (
              <div
                key={f.label}
                className="p-3 rounded-lg"
                style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}
              >
                <div className="text-xs font-mono font-bold text-emerald-400 mb-1">{f.label}</div>
                <div className="text-xs font-mono text-zinc-500 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
          <div
            className="p-3 rounded-lg font-mono text-xs"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(16,185,129,0.15)" }}
          >
            <div className="text-zinc-500 mb-1">{"// fast-check property example"}</div>
            <div className="text-emerald-400">{"fc.assert("}</div>
            <div className="text-zinc-300 pl-4">{"fc.property(fc.integer(), fc.integer(), (a, b) => {"}</div>
            <div className="text-zinc-300 pl-8">{"return add(a, b) === add(b, a); // commutativity"}</div>
            <div className="text-zinc-300 pl-4">{"}),"}</div>
            <div className="text-emerald-400">{")"}</div>
          </div>
        </div>
      ),
    },
    {
      id: "mutation",
      title: "Mutation Testing",
      subtitle: "Verifying test suite effectiveness with Stryker",
      icon: <Activity size={16} />,
      color: "#f59e0b",
      content: (
        <div className="space-y-4 pt-3">
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Mutation testing answers the question that line coverage cannot: does your test suite actually detect defects? Stryker introduces small, syntactically valid changes (mutants) to your source code and verifies that at least one test fails. A surviving mutant indicates a gap in test effectiveness.
          </p>
          <MutationFormula />
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Killed", value: "1,847", color: "#10b981", desc: "Mutants detected by tests" },
              { label: "Survived", value: "312", color: "#ef4444", desc: "Gaps in test coverage" },
              { label: "Score", value: "85.5%", color: "#f59e0b", desc: "Above 75% gate threshold" },
            ].map((s) => (
              <div
                key={s.label}
                className="p-3 rounded-lg text-center"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}
              >
                <div className="text-lg font-mono font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] font-mono font-bold text-zinc-400 mt-0.5">{s.label}</div>
                <div className="text-[9px] font-mono text-zinc-600 mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Mutation Operators Applied</div>
            <div className="flex flex-wrap gap-2">
              {["ArithmeticOperator", "BooleanLiteral", "ConditionalExpression", "EqualityOperator", "LogicalOperator", "StringLiteral", "BlockStatement"].map((op) => (
                <span
                  key={op}
                  className="text-[10px] font-mono px-2 py-1 rounded-full"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
                >
                  {op}
                </span>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "pyramid",
      title: "Test Pyramid Composition",
      subtitle: "Balanced distribution across test layers",
      icon: <GitBranch size={16} />,
      color: "#06b6d4",
      content: (
        <div className="space-y-4 pt-3">
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            The test pyramid is not a suggestion — it is an economic constraint. E2E tests are 100x slower and 10x more expensive to maintain than unit tests. Our pyramid enforces a 75/20/5 distribution to maximize feedback speed while maintaining confidence at every layer.
          </p>
          <TestPyramid />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            {[
              { layer: "Unit", speed: "~8ms avg", isolation: "Full", feedback: "Immediate", color: "#10b981" },
              { layer: "Integration", speed: "~340ms avg", isolation: "Partial", feedback: "Fast", color: "#f59e0b" },
              { layer: "E2E", speed: "~12s avg", isolation: "None", feedback: "Slow", color: "#ef4444" },
            ].map((l) => (
              <div
                key={l.layer}
                className="p-3 rounded-lg space-y-2"
                style={{ background: `${l.color}08`, border: `1px solid ${l.color}20` }}
              >
                <div className="text-xs font-mono font-bold" style={{ color: l.color }}>{l.layer}</div>
                {[
                  { k: "Speed", v: l.speed },
                  { k: "Isolation", v: l.isolation },
                  { k: "Feedback", v: l.feedback },
                ].map((row) => (
                  <div key={row.k} className="flex justify-between text-[10px] font-mono">
                    <span className="text-zinc-600">{row.k}</span>
                    <span className="text-zinc-300">{row.v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "contract",
      title: "Contract Testing",
      subtitle: "Consumer-driven API compatibility with Pact",
      icon: <FileCode size={16} />,
      color: "#8b5cf6",
      content: (
        <div className="space-y-4 pt-3">
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            In a microservices architecture, integration environments are expensive, slow, and unreliable. Contract testing replaces them for API compatibility verification. Consumers define their expectations as a Pact file; providers verify against it independently. No shared environment required.
          </p>
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {["Consumer", "→ Pact File →", "Pact Broker", "→ Verify →", "Provider"].map((step, i) => (
              <div
                key={i}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-mono ${
                  i % 2 === 0
                    ? "font-bold text-violet-400"
                    : "text-zinc-500"
                }`}
                style={
                  i % 2 === 0
                    ? { background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }
                    : {}
                }
              >
                {step}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Services Covered", value: "47" },
              { label: "Active Contracts", value: "183" },
              { label: "Avg Verify Time", value: "4.2s" },
              { label: "Breaking Changes Caught", value: "94%" },
            ].map((s) => (
              <div
                key={s.label}
                className="p-3 rounded-lg flex justify-between items-center"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}
              >
                <span className="text-xs font-mono text-zinc-500">{s.label}</span>
                <span className="text-sm font-mono font-bold text-violet-400">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "observability",
      title: "Observability-Driven Testing",
      subtitle: "Correlating test signals with production telemetry",
      icon: <Eye size={16} />,
      color: "#06b6d4",
      content: (
        <div className="space-y-4 pt-3">
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Tests are not isolated artifacts — they are probes into system behavior. By instrumenting test runs with OpenTelemetry traces, we correlate test failures with specific service spans, database queries, and network calls. This transforms a red test from a symptom into a root cause.
          </p>
          <div className="space-y-2">
            {[
              { signal: "P99 Latency Spike", action: "Triggers automated bisect run across last 10 commits", color: "#f59e0b" },
              { signal: "Error Rate > 0.1%", action: "Activates canary rollback and regression test suite", color: "#ef4444" },
              { signal: "Mutation Score Drop", action: "Blocks deployment and notifies owning squad", color: "#f59e0b" },
              { signal: "Flakiness Index > 5%", action: "Quarantines test and opens automated Jira ticket", color: "#06b6d4" },
            ].map((item) => (
              <div
                key={item.signal}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.1)" }}
              >
                <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                <div>
                  <div className="text-xs font-mono font-bold text-zinc-200">{item.signal}</div>
                  <div className="text-xs font-mono text-zinc-500 mt-0.5">{item.action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "security",
      title: "Security Testing Integration",
      subtitle: "OWASP ZAP, SAST, and dependency scanning",
      icon: <Lock size={16} />,
      color: "#ef4444",
      content: (
        <div className="space-y-4 pt-3">
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Security is not a phase — it is a continuous signal. SAST runs on every commit via CodeQL. DAST scans execute against staging on every deployment. Dependency vulnerability scanning blocks merges when CVSS score exceeds 7.0. ZAP active scan runs weekly against production-equivalent environments.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { tool: "CodeQL", type: "SAST", frequency: "Every commit", color: "#ef4444" },
              { tool: "OWASP ZAP", type: "DAST", frequency: "Every deploy", color: "#ef4444" },
              { tool: "Snyk", type: "SCA", frequency: "Every PR", color: "#f59e0b" },
              { tool: "Trivy", type: "Container", frequency: "Every image build", color: "#f59e0b" },
            ].map((s) => (
              <div
                key={s.tool}
                className="p-3 rounded-lg"
                style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-mono font-bold" style={{ color: s.color }}>{s.tool}</span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: `${s.color}15`, color: s.color }}
                  >
                    {s.type}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500">{s.frequency}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen md:pl-64" style={{ background: "rgba(9,9,11,1)" }}>
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-12">

        {/* ── Hero Header ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-16"
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
            <div
              className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              Deep-Tech Documentation
            </div>
            <div
              className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest"
              style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}
            >
              v4.2.1
            </div>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-mono font-black text-white tracking-tight text-balance mb-4"
            style={{ textShadow: "0 0 40px rgba(16,185,129,0.2)" }}
          >
            Testing Methodology
            <br />
            <span style={{ color: "#10b981" }}>Ledger</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-sm font-mono text-zinc-400 max-w-2xl leading-relaxed text-pretty"
          >
            A structured compendium of quality engineering practices, mathematical foundations, and toolchain decisions that underpin enterprise-grade software delivery. Every technique documented here is actively enforced in the pipeline.
          </motion.p>

          {/* Stat strip */}
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 mt-8">
            {[
              { label: "Techniques Documented", value: "24", color: "#10b981" },
              { label: "Pipeline Gates Active", value: "8", color: "#06b6d4" },
              { label: "Tools Integrated", value: "12", color: "#f59e0b" },
              { label: "Avg Mutation Score", value: "85.5%", color: "#8b5cf6" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: `${s.color}08`,
                  border: `1px solid ${s.color}20`,
                }}
              >
                <span className="text-xl font-mono font-black tabular-nums" style={{ color: s.color }}>{s.value}</span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Two-column layout: Accordion + Tag Cloud ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mb-20">

          {/* Accordion — 3 cols */}
          <div className="xl:col-span-3">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-5">
                <FileCode size={14} className="text-emerald-400" />
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Methodology Ledger</span>
              </motion.div>
              <AccordionSection items={accordionItems} />
            </motion.div>
          </div>

          {/* Tag Cloud — 2 cols */}
          <div className="xl:col-span-2">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="sticky top-24"
            >
              <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-5">
                <Sparkles size={14} className="text-cyan-400" />
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Technique Sphere</span>
              </motion.div>

              <motion.div variants={scaleIn}>
                <TagCloud3D onTagHover={handleTagHover} />
              </motion.div>

              {/* Tooltip panel */}
              <div className="mt-4 min-h-[100px]">
                <AnimatePresence mode="wait">
                  {hoveredTag ? (
                    <motion.div
                      key={hoveredTag.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 rounded-xl"
                      style={{
                        background: `${hoveredTag.color}0a`,
                        border: `1px solid ${hoveredTag.color}30`,
                        boxShadow: `0 0 24px ${hoveredTag.color}10`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono font-bold" style={{ color: hoveredTag.color }}>
                          {hoveredTag.label}
                        </span>
                        <span
                          className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                          style={{ background: `${hoveredTag.color}15`, color: hoveredTag.color }}
                        >
                          {hoveredTag.category}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                        {hoveredTag.detail}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-xl flex items-center justify-center"
                      style={{ border: "1px dashed rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-xs font-mono text-zinc-600">Hover a tag to explore</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Legend */}
              <motion.div variants={fadeInUp} className="mt-4 flex flex-wrap gap-2">
                {[
                  { cat: "Technique", color: "#10b981" },
                  { cat: "Practice", color: "#06b6d4" },
                  { cat: "Tool", color: "#f59e0b" },
                  { cat: "Infrastructure", color: "#8b5cf6" },
                  { cat: "Security", color: "#ef4444" },
                ].map((l) => (
                  <div key={l.cat} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span className="text-[9px] font-mono text-zinc-500">{l.cat}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* ── Timeline ── */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-20"
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-10">
            <Clock size={14} className="text-amber-400" />
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Testing Philosophy Timeline</span>
          </motion.div>

          <div className="relative">
            {/* Center line */}
            <div
              className="absolute left-1/2 top-0 bottom-0 w-px hidden md:block"
              style={{ background: "linear-gradient(to bottom, transparent, rgba(16,185,129,0.3), transparent)" }}
            />

            <div className="space-y-8">
              {timelineMilestones.map((milestone, i) => (
                <motion.div
                  key={milestone.year}
                  variants={i % 2 === 0 ? {
                    hidden: { opacity: 0, x: -40 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut", delay: i * 0.05 } },
                  } : {
                    hidden: { opacity: 0, x: 40 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut", delay: i * 0.05 } },
                  }}
                  className={`relative flex flex-col md:flex-row items-start gap-4 ${
                    milestone.side === "right" ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Content card */}
                  <div className="flex-1 md:max-w-[calc(50%-2rem)]">
                    <div
                      className="p-5 rounded-2xl"
                      style={{
                        background: "rgba(9,9,11,0.8)",
                        border: "1px solid rgba(16,185,129,0.1)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="text-xs font-mono font-black px-3 py-1 rounded-full"
                          style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}
                        >
                          {milestone.year}
                        </span>
                        <h3 className="text-sm font-mono font-bold text-zinc-100">{milestone.title}</h3>
                      </div>
                      <p className="text-xs font-mono text-zinc-400 leading-relaxed mb-3">
                        {milestone.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {milestone.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(6,182,212,0.08)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.15)" }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden md:flex items-center justify-center w-16 flex-shrink-0 pt-5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: "#10b981",
                        boxShadow: "0 0 12px rgba(16,185,129,0.6)",
                        border: "2px solid rgba(16,185,129,0.3)",
                      }}
                    />
                  </div>

                  {/* Spacer for opposite side */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Comparison Table ── */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-20"
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-8">
            <Activity size={14} className="text-violet-400" />
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Approach Comparison Matrix</span>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(9,9,11,0.8)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
            }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-4 gap-4 px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
            >
              <div className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">Metric</div>
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Manual</div>
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Automated</div>
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Mutation-Tested</div>
            </div>

            {/* Rows */}
            {comparisonRows.map((row, i) => (
              <motion.div
                key={row.metric}
                variants={fadeInUp}
                className="grid grid-cols-4 gap-4 px-6 py-4 items-center"
                style={{
                  borderBottom: i < comparisonRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div className="text-xs font-mono text-zinc-300">{row.metric}</div>
                <div className="space-y-1">
                  <ComparisonBar value={row.manual} color="#6b7280" delay={i * 80} />
                </div>
                <div className="space-y-1">
                  <ComparisonBar value={row.automated} color="#06b6d4" delay={i * 80 + 100} />
                </div>
                <div className="space-y-1">
                  <ComparisonBar value={row.mutation} color="#10b981" delay={i * 80 + 200} />
                </div>
              </motion.div>
            ))}

            {/* Footer note */}
            <div
              className="px-6 py-3 flex items-center gap-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}
            >
              <AlertTriangle size={11} className="text-amber-400 flex-shrink-0" />
              <span className="text-[10px] font-mono text-zinc-600">
                Values represent normalized scores (0-100). Lower is better for False Positive Rate and Maintenance Cost.
              </span>
            </div>
          </motion.div>
        </motion.section>

        {/* ── Principles Grid ── */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-16"
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-8">
            <Star size={14} className="text-emerald-400" />
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Core Engineering Principles</span>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                number: "01",
                title: "Tests as Specifications",
                body: "A test suite is the executable specification of system behavior. If behavior is not tested, it is not specified. Untested behavior is undefined behavior.",
                color: "#10b981",
              },
              {
                number: "02",
                title: "Determinism is Non-Negotiable",
                body: "A flaky test is worse than no test. It erodes trust in the entire suite. Every non-deterministic test must be quarantined, diagnosed, and fixed within 48 hours.",
                color: "#06b6d4",
              },
              {
                number: "03",
                title: "Coverage is a Floor, Not a Ceiling",
                body: "100% line coverage with 0% mutation score is theater. Coverage metrics gate entry; mutation score gates confidence. Both are required.",
                color: "#f59e0b",
              },
              {
                number: "04",
                title: "Fail Fast, Fail Loud",
                body: "A test that silently passes on a broken system is an active liability. Assertions must be precise. Timeouts must be explicit. Errors must propagate.",
                color: "#8b5cf6",
              },
              {
                number: "05",
                title: "Test the Contract, Not the Implementation",
                body: "Tests coupled to implementation details break on refactoring. Test observable behavior and public contracts. Internal state is an implementation detail.",
                color: "#ef4444",
              },
              {
                number: "06",
                title: "Quality is a System Property",
                body: "No single technique achieves quality. The pyramid, mutation testing, chaos engineering, and observability form a system. Remove any layer and the system degrades.",
                color: "#10b981",
              },
            ].map((p) => (
              <motion.div
                key={p.number}
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-5 rounded-2xl cursor-default"
                style={{
                  background: "rgba(9,9,11,0.8)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  className="text-3xl font-mono font-black mb-3 opacity-20"
                  style={{ color: p.color }}
                >
                  {p.number}
                </div>
                <h3 className="text-sm font-mono font-bold text-zinc-100 mb-2">{p.title}</h3>
                <p className="text-xs font-mono text-zinc-500 leading-relaxed">{p.body}</p>
                <div
                  className="mt-4 h-0.5 rounded-full w-8"
                  style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── CTA ── */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.04))",
            border: "1px solid rgba(16,185,129,0.15)",
            boxShadow: "0 0 60px rgba(16,185,129,0.05)",
          }}
        >
          <div>
            <h2 className="text-lg font-mono font-black text-white mb-2">
              See the methodology in action
            </h2>
            <p className="text-xs font-mono text-zinc-400 max-w-md leading-relaxed">
              Explore the live pipeline gate, chaos engineering controls, and real-time automation telemetry that enforce these principles on every commit.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a
              href="/pipeline"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all duration-300"
              style={{
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              Chaos Pipeline <ArrowRight size={12} />
            </a>
            <a
              href="/automation"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all duration-300"
              style={{
                background: "rgba(6,182,212,0.1)",
                color: "#06b6d4",
                border: "1px solid rgba(6,182,212,0.2)",
              }}
            >
              Automation Suite <ArrowRight size={12} />
            </a>
          </div>
        </motion.div>

      </div>
    </main>
  );
}