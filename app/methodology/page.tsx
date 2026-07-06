"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Activity, Check, Terminal, GitBranch, FileCode, Lock, Star, Circle, Sparkles, ArrowRight, Clock, Eye, AlertTriangle, GraduationCap, Award, BookOpen, Shield, Cpu, Globe, Layers, Code2 } from 'lucide-react';
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

interface TagItem {
  label: string;
  color: string;
  category: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const timelineMilestones: TimelineMilestone[] = [
  {
    year: "Jun 2024",
    title: "Front-End Developer Intern — Tech Hero",
    description:
      "Designed and developed responsive, user-friendly websites using HTML, CSS, JavaScript, and jQuery. Collaborated with clients to understand project requirements and deliver customized front-end solutions.",
    tags: ["HTML", "CSS", "JavaScript", "jQuery"],
    side: "left",
  },
  {
    year: "Nov 2024",
    title: "QA Engineer Intern — Tech Hero",
    description:
      "Conducted manual testing of web and mobile applications. Practiced API testing using Postman on dummy endpoints. Wrote test cases and bug reports. Assisted in QA tasks for mock and academic projects.",
    tags: ["Manual Testing", "Postman", "Bug Reports", "Test Cases"],
    side: "right",
  },
  {
    year: "Oct 2025",
    title: "Software QA Engineer — DaticsAI",
    description:
      "Performed API testing, cross-platform desktop testing (macOS, Linux, Windows), manual web/mobile testing, and Playwright automation. Core QA contributor on the Veridat data marketplace platform collaborating with developers and product stakeholders.",
    tags: ["Playwright", "Postman", "JMeter", "ClickUp", "Agile"],
    side: "left",
  },
];

const tagItems: TagItem[] = [
  { label: "Playwright", color: "#10b981", category: "automation" },
  { label: "Postman", color: "#f59e0b", category: "api" },
  { label: "JMeter", color: "#ef4444", category: "performance" },
  { label: "ClickUp", color: "#06b6d4", category: "management" },
  { label: "Jira", color: "#06b6d4", category: "management" },
  { label: "Git", color: "#f59e0b", category: "devops" },
  { label: "Agile", color: "#10b981", category: "process" },
  { label: "Scrum", color: "#10b981", category: "process" },
  { label: "HTML", color: "#f59e0b", category: "frontend" },
  { label: "CSS", color: "#06b6d4", category: "frontend" },
  { label: "JavaScript", color: "#f59e0b", category: "frontend" },
  { label: "MySQL", color: "#06b6d4", category: "database" },
  { label: "MongoDB", color: "#10b981", category: "database" },
  { label: "Manual Testing", color: "#10b981", category: "testing" },
  { label: "API Testing", color: "#f59e0b", category: "testing" },
  { label: "Regression Testing", color: "#10b981", category: "testing" },
  { label: "Exploratory Testing", color: "#06b6d4", category: "testing" },
  { label: "Usability Testing", color: "#06b6d4", category: "testing" },
  { label: "Compatibility Testing", color: "#f59e0b", category: "testing" },
  { label: "SDLC", color: "#10b981", category: "process" },
];

const methodologyAccordion: AccordionItem[] = [
  {
    id: "functional",
    title: "Functional & Regression Testing",
    subtitle: "Systematic coverage of all functional requirements",
    icon: <Check size={16} />,
    color: "#10b981",
    content: (
      <div className="space-y-3 text-sm font-mono">
        <p className="text-zinc-300 leading-relaxed">
          Systematic test case execution covering all functional requirements and regression scenarios to ensure new changes do not break existing features.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {["Test Case Design", "Regression Suites", "Boundary Analysis", "Equivalence Partitioning", "Smoke Testing", "Sanity Testing"].map((p) => (
            <div key={p} className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="w-1 h-1 rounded-full bg-emerald-400" />
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "api",
    title: "API Testing",
    subtitle: "Request/response validation with Postman",
    icon: <Globe size={16} />,
    color: "#f59e0b",
    content: (
      <div className="space-y-3 text-sm font-mono">
        <p className="text-zinc-300 leading-relaxed">
          Validating request/response behavior, data integrity, status codes, and error handling using Postman across RESTful endpoints.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {["Status Code Validation", "Schema Verification", "Error Handling", "Auth Token Testing", "Data Integrity", "Endpoint Coverage"].map((p) => (
            <div key={p} className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="w-1 h-1 rounded-full bg-amber-400" />
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "performance",
    title: "Performance Testing",
    subtitle: "Load simulation with JMeter",
    icon: <Activity size={16} />,
    color: "#ef4444",
    content: (
      <div className="space-y-3 text-sm font-mono">
        <p className="text-zinc-300 leading-relaxed">
          Using JMeter to simulate concurrent users and measure throughput, latency, and system behavior under load.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {["Concurrent User Simulation", "Throughput Measurement", "Latency Analysis", "Stress Testing", "Spike Testing", "Endurance Testing"].map((p) => (
            <div key={p} className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="w-1 h-1 rounded-full bg-red-400" />
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "exploratory",
    title: "Exploratory & Usability Testing",
    subtitle: "Hands-on sessions to uncover edge cases",
    icon: <Eye size={16} />,
    color: "#06b6d4",
    content: (
      <div className="space-y-3 text-sm font-mono">
        <p className="text-zinc-300 leading-relaxed">
          Hands-on exploratory sessions to uncover edge cases and usability issues not covered by scripted test cases.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {["Session-Based Testing", "Edge Case Discovery", "UX Evaluation", "Heuristic Analysis", "User Flow Mapping", "Ad-hoc Testing"].map((p) => (
            <div key={p} className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="w-1 h-1 rounded-full bg-cyan-400" />
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "compatibility",
    title: "Compatibility Testing",
    subtitle: "Cross-platform and cross-device validation",
    icon: <Layers size={16} />,
    color: "#f59e0b",
    content: (
      <div className="space-y-3 text-sm font-mono">
        <p className="text-zinc-300 leading-relaxed">
          Ensuring consistent behavior across macOS, Linux, Windows desktop platforms and multiple mobile viewports.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {["macOS Testing", "Linux Testing", "Windows Testing", "Mobile Viewports", "Browser Compatibility", "Responsive Layouts"].map((p) => (
            <div key={p} className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="w-1 h-1 rounded-full bg-amber-400" />
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "security",
    title: "Security & Auth Testing",
    subtitle: "OTP, RBAC, Stripe, and KYC validation",
    icon: <Shield size={16} />,
    color: "#ef4444",
    content: (
      <div className="space-y-3 text-sm font-mono">
        <p className="text-zinc-300 leading-relaxed">
          Verifying OTP flows, session management, RBAC, Stripe payment, and KYC onboarding for security compliance.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {["OTP Verification", "Session Handling", "Role-Based Access", "Stripe Payment Flows", "KYC Onboarding", "Encryption/Decryption"].map((p) => (
            <div key={p} className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="w-1 h-1 rounded-full bg-red-400" />
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

// ─── Tag Cloud Component ──────────────────────────────────────────────────────

function TagCloud() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [positions, setPositions] = useState<Array<{ x: number; y: number; scale: number; rotate: number }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const generated = tagItems.map((_, i) => ({
      x: (i % 5) * 18 + Math.floor(i / 5) * 3,
      y: Math.floor(i / 5) * 22,
      scale: 0.85 + (i % 3) * 0.1,
      rotate: (i % 2 === 0 ? 1 : -1) * (i % 4),
    }));
    setPositions(generated);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    setPositions(
      tagItems.map((_, i) => {
        const baseX = (i % 5) * 18 + Math.floor(i / 5) * 3;
        const baseY = Math.floor(i / 5) * 22;
        const dx = mx - (baseX / 100);
        const dy = my - (baseY / 100);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repel = Math.max(0, 1 - dist * 3);
        return {
          x: baseX - dx * repel * 8,
          y: baseY - dy * repel * 8,
          scale: 0.85 + (i % 3) * 0.1 + repel * 0.15,
          rotate: (i % 2 === 0 ? 1 : -1) * (i % 4),
        };
      })
    );
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPositions(
      tagItems.map((_, i) => ({
        x: (i % 5) * 18 + Math.floor(i / 5) * 3,
        y: Math.floor(i / 5) * 22,
        scale: 0.85 + (i % 3) * 0.1,
        rotate: (i % 2 === 0 ? 1 : -1) * (i % 4),
      }))
    );
  }, []);

  if (!mounted) {
    return (
      <div className="relative w-full h-64 flex flex-wrap gap-2 items-start content-start p-4">
        {tagItems.map((tag) => (
          <span
            key={tag.label}
            className="px-3 py-1 rounded text-xs font-mono border"
            style={{ borderColor: `${tag.color}40`, color: tag.color, background: `${tag.color}10` }}
          >
            {tag.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-64 overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {tagItems.map((tag, i) => {
        const pos = positions[i] ?? { x: 0, y: 0, scale: 1, rotate: 0 };
        return (
          <motion.div
            key={tag.label}
            className="absolute px-3 py-1 rounded text-xs font-mono border cursor-pointer select-none"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              borderColor: `${tag.color}${hoveredTag === tag.label ? "99" : "40"}`,
              color: tag.color,
              background: `${tag.color}${hoveredTag === tag.label ? "25" : "10"}`,
              boxShadow: hoveredTag === tag.label ? `0 0 12px ${tag.color}60` : "none",
            }}
            animate={{
              x: (pos.x - (i % 5) * 18 - Math.floor(i / 5) * 3) * 2,
              scale: pos.scale,
              rotate: pos.rotate,
            }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            onMouseEnter={() => setHoveredTag(tag.label)}
            onMouseLeave={() => setHoveredTag(null)}
          >
            {tag.label}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Accordion Component ──────────────────────────────────────────────────────

function AccordionPanel({ item }: { item: AccordionItem }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      variants={fadeInUp}
      className="border rounded-lg overflow-hidden"
      style={{
        borderColor: open ? `${item.color}40` : "rgba(255,255,255,0.06)",
        background: open ? `${item.color}08` : "rgba(9,9,11,0.6)",
        transition: "border-color 0.3s, background 0.3s",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: `${item.color}20`, color: item.color }}
          >
            {item.icon}
          </div>
          <div>
            <div className="text-sm font-mono font-semibold text-zinc-100">{item.title}</div>
            <div className="text-xs font-mono text-zinc-500 mt-0.5">{item.subtitle}</div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          style={{ color: item.color }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
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
}

// ─── Timeline Component ───────────────────────────────────────────────────────

function Timeline() {
  return (
    <div className="relative">
      {/* Center line */}
      <div
        className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block"
        style={{ background: "linear-gradient(to bottom, transparent, #10b981, #06b6d4, transparent)" }}
      />

      <div className="space-y-12">
        {timelineMilestones.map((milestone, i) => (
          <motion.div
            key={milestone.year}
            variants={fadeInUp}
            className={`relative flex flex-col md:flex-row gap-6 ${
              milestone.side === "right" ? "md:flex-row-reverse" : ""
            }`}
          >
            {/* Content card */}
            <div className="flex-1">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="p-5 rounded-xl border"
                style={{
                  background: "rgba(9,9,11,0.8)",
                  borderColor: i === timelineMilestones.length - 1 ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)",
                  boxShadow: i === timelineMilestones.length - 1 ? "0 0 20px rgba(16,185,129,0.08)" : "none",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
                  >
                    {milestone.year}
                  </span>
                  {i === timelineMilestones.length - 1 && (
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded animate-pulse"
                      style={{ background: "rgba(16,185,129,0.2)", color: "#10b981" }}
                    >
                      CURRENT
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-mono font-bold text-zinc-100 mb-2">{milestone.title}</h3>
                <p className="text-xs font-mono text-zinc-400 leading-relaxed mb-3">{milestone.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {milestone.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded border"
                      style={{ borderColor: "rgba(6,182,212,0.3)", color: "#06b6d4", background: "rgba(6,182,212,0.08)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Center dot */}
            <div className="hidden md:flex items-center justify-center w-8 flex-shrink-0">
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{
                  borderColor: "#10b981",
                  background: i === timelineMilestones.length - 1 ? "#10b981" : "#030303",
                  boxShadow: i === timelineMilestones.length - 1 ? "0 0 12px #10b981" : "none",
                }}
              />
            </div>

            {/* Spacer for opposite side */}
            <div className="flex-1 hidden md:block" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Mutation Score Formula ───────────────────────────────────────────────────

function MutationFormula() {
  const [animated, setAnimated] = useState(false);
  const [k] = useState(847);
  const [d] = useState(1000);
  const ms = ((k / d) * 100).toFixed(1);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      variants={scaleIn}
      className="p-6 rounded-xl border"
      style={{
        background: "rgba(245,158,11,0.05)",
        borderColor: "rgba(245,158,11,0.2)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-amber-400" />
        <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Mutation Score Formula</span>
      </div>

      {/* Formula display */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-4 text-2xl font-mono font-bold">
          <span className="text-zinc-100">MS</span>
          <span className="text-zinc-500">=</span>
          <div className="flex flex-col items-center">
            <span className="text-emerald-400 border-b border-emerald-400/50 pb-1 px-2">K</span>
            <span className="text-red-400 pt-1 px-2">D</span>
          </div>
          <span className="text-zinc-500">×</span>
          <span className="text-zinc-100">100</span>
        </div>

        <div className="mt-4 flex justify-center gap-8 text-xs font-mono text-zinc-500">
          <span><span className="text-emerald-400">K</span> = Killed Mutants</span>
          <span><span className="text-red-400">D</span> = Total Mutants</span>
          <span><span className="text-amber-400">MS</span> = Mutation Score</span>
        </div>
      </div>

      {/* Live calculation */}
      <div
        className="mt-4 p-4 rounded-lg font-mono text-sm"
        style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(245,158,11,0.15)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-500 text-xs">// Applied in regression analysis</span>
          <span className="text-amber-400 text-xs">LIVE CALC</span>
        </div>
        <div className="text-zinc-300">
          MS = (<span className="text-emerald-400">{k}</span> / <span className="text-red-400">{d}</span>) × 100 ={" "}
          <motion.span
            className="text-amber-400 font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: animated ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {ms}%
          </motion.span>
        </div>
        <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
          Applied in regression analysis to measure test suite effectiveness — ensuring critical user flows on the Veridat platform are thoroughly validated.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs font-mono text-zinc-500 mb-1">
          <span>Mutation Score</span>
          <span className="text-amber-400">{ms}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #f59e0b, #10b981)" }}
            initial={{ width: 0 }}
            animate={{ width: animated ? `${ms}%` : "0%" }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Property-Based Testing Section ──────────────────────────────────────────

function PropertyBasedSection() {
  const examples = [
    { input: "email: \"\"  ", result: "FAIL", color: "#ef4444" },
    { input: "email: \"a@b.c\"", result: "PASS", color: "#10b981" },
    { input: "email: null   ", result: "FAIL", color: "#ef4444" },
    { input: "email: \"x\".repeat(256)", result: "FAIL", color: "#ef4444" },
    { input: "email: \"valid@domain.com\"", result: "PASS", color: "#10b981" },
  ];

  return (
    <motion.div
      variants={scaleIn}
      className="p-6 rounded-xl border"
      style={{
        background: "rgba(6,182,212,0.05)",
        borderColor: "rgba(6,182,212,0.2)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Code2 size={16} className="text-cyan-400" />
        <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Property-Based Testing</span>
      </div>
      <p className="text-xs font-mono text-zinc-400 leading-relaxed mb-4">
        Generative data boundaries — the system automatically generates hundreds of edge-case inputs to validate invariants that scripted tests miss.
      </p>
      <div
        className="rounded-lg p-4 font-mono text-xs space-y-1"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(6,182,212,0.15)" }}
      >
        <div className="text-zinc-500 mb-2">// Generated test inputs — email validation</div>
        {examples.map((ex, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-zinc-400">{ex.input}</span>
            <span className="font-bold" style={{ color: ex.color }}>{ex.result}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs font-mono">
        <span className="text-zinc-500">Inputs generated: <span className="text-cyan-400">500+</span></span>
        <span className="text-zinc-500">Edge cases found: <span className="text-red-400">12</span></span>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MethodologyPage() {
  const [activeSection, setActiveSection] = useState<string>("timeline");

  const sections = [
    { id: "timeline", label: "Career Timeline" },
    { id: "methodology", label: "Testing Methodology" },
    { id: "formulas", label: "Formulas & Theory" },
    { id: "tools", label: "Tools & Skills" },
    { id: "education", label: "Education & Awards" },
  ];

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-10"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Deep-Tech Testing Methodology</span>
        </motion.div>
        <motion.h1 variants={fadeInUp} className="text-3xl md:text-4xl font-mono font-bold text-zinc-100 mb-3">
          Rao Muhammad Ali
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-sm font-mono text-zinc-400 max-w-2xl leading-relaxed">
          Software Quality Assurance Engineer at DaticsAI, Lahore, Pakistan. Applying modern testing techniques with a clear understanding of the software development lifecycle. Experienced in functional, regression, usability, compatibility, and exploratory testing.
        </motion.p>
        <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 mt-4">
          {[
            { label: "raomali005@gmail.com", color: "#10b981" },
            { label: "(+92) 300-7228384", color: "#06b6d4" },
            { label: "DaticsAI · Lahore, Pakistan", color: "#f59e0b" },
          ].map((item) => (
            <span
              key={item.label}
              className="text-xs font-mono px-3 py-1 rounded border"
              style={{ borderColor: `${item.color}40`, color: item.color, background: `${item.color}10` }}
            >
              {item.label}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Section Nav */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-2 mb-8"
      >
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="px-4 py-2 rounded text-xs font-mono border transition-all duration-200"
            style={{
              borderColor: activeSection === s.id ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.06)",
              background: activeSection === s.id ? "rgba(16,185,129,0.1)" : "rgba(9,9,11,0.6)",
              color: activeSection === s.id ? "#10b981" : "#71717a",
            }}
          >
            {s.label}
          </button>
        ))}
      </motion.div>

      {/* ── Career Timeline ── */}
      {activeSection === "timeline" && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={fadeInUp}>
            <h2 className="text-lg font-mono font-bold text-zinc-100 mb-2">Career Timeline</h2>
            <p className="text-xs font-mono text-zinc-500 mb-8">Professional journey from front-end development to quality engineering.</p>
            <Timeline />
          </motion.div>
        </motion.div>
      )}

      {/* ── Testing Methodology ── */}
      {activeSection === "methodology" && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <motion.div variants={fadeInUp}>
            <h2 className="text-lg font-mono font-bold text-zinc-100 mb-2">Testing Methodology</h2>
            <p className="text-xs font-mono text-zinc-500 mb-6">Core testing disciplines applied across projects at DaticsAI and Tech Hero.</p>
          </motion.div>
          {methodologyAccordion.map((item) => (
            <AccordionPanel key={item.id} item={item} />
          ))}
        </motion.div>
      )}

      {/* ── Formulas & Theory ── */}
      {activeSection === "formulas" && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={fadeInUp}>
            <h2 className="text-lg font-mono font-bold text-zinc-100 mb-2">Formulas & Theory</h2>
            <p className="text-xs font-mono text-zinc-500 mb-6">Mathematical foundations underpinning quality engineering practices.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            <MutationFormula />
            <PropertyBasedSection />
          </div>

          {/* Veridat Project Highlight */}
          <motion.div
            variants={fadeInUp}
            className="p-6 rounded-xl border"
            style={{ background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Veridat Platform — Key Project</span>
            </div>
            <p className="text-xs font-mono text-zinc-400 leading-relaxed mb-4">
              End-to-end testing of a data marketplace platform including Web, Desktop, and Admin Panel modules at DaticsAI.
            </p>
            <div className="grid md:grid-cols-2 gap-2">
              {[
                "Large file uploads & folder handling",
                "Cloud imports (Google Drive, OneDrive)",
                "Malware scanning & encryption flows",
                "Stripe payment & KYC onboarding",
                "OTP verification & session handling",
                "Real-time chat between buyers/sellers",
                "Role-based access control (RBAC)",
                "Issue tracking in ClickUp with repro steps",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <Check size={10} className="text-emerald-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-3">
              <a
                href="https://veridat-demo.daticsai.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                → veridat-demo.daticsai.com
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Tools & Skills ── */}
      {activeSection === "tools" && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={fadeInUp}>
            <h2 className="text-lg font-mono font-bold text-zinc-100 mb-2">Tools & Skills</h2>
            <p className="text-xs font-mono text-zinc-500 mb-6">Interactive tag cloud — hover to interact with the skill nodes.</p>
          </motion.div>

          {/* Tag Cloud */}
          <motion.div
            variants={scaleIn}
            className="p-6 rounded-xl border"
            style={{ background: "rgba(9,9,11,0.8)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <TagCloud />
          </motion.div>

          {/* Skill categories */}
          <motion.div variants={fadeInUp} className="grid md:grid-cols-3 gap-4">
            {[
              {
                category: "Testing",
                color: "#10b981",
                skills: ["Manual Testing", "Functional Testing", "Regression Testing", "API Testing", "Exploratory Testing", "Usability Testing", "Compatibility Testing"],
              },
              {
                category: "Tools & Frameworks",
                color: "#f59e0b",
                skills: ["Playwright", "Postman", "JMeter", "ClickUp", "Jira", "Git"],
              },
              {
                category: "Development",
                color: "#06b6d4",
                skills: ["HTML", "CSS", "JavaScript", "MySQL", "MongoDB", "SDLC", "Agile/Scrum"],
              },
            ].map((cat) => (
              <div
                key={cat.category}
                className="p-4 rounded-lg border"
                style={{ borderColor: `${cat.color}30`, background: `${cat.color}08` }}
              >
                <div className="text-xs font-mono font-bold mb-3" style={{ color: cat.color }}>
                  {cat.category}
                </div>
                <div className="space-y-1.5">
                  {cat.skills.map((skill) => (
                    <div key={skill} className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      <div className="w-1 h-1 rounded-full" style={{ background: cat.color }} />
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ── Education & Awards ── */}
      {activeSection === "education" && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={fadeInUp}>
            <h2 className="text-lg font-mono font-bold text-zinc-100 mb-2">Education & Awards</h2>
            <p className="text-xs font-mono text-zinc-500 mb-6">Academic background, leadership roles, and certifications.</p>
          </motion.div>

          {/* Education */}
          <motion.div
            variants={fadeInUp}
            className="p-6 rounded-xl border"
            style={{ background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={16} className="text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Education</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-mono font-bold text-zinc-100">COMSATS University of Islamabad</h3>
                <p className="text-xs font-mono text-zinc-400 mt-1">Bachelor of Science in Software Engineering</p>
              </div>
              <span
                className="text-xs font-mono px-2 py-1 rounded flex-shrink-0"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
              >
                Feb 2021 – Mar 2025
              </span>
            </div>
          </motion.div>

          {/* Awards */}
          <motion.div
            variants={fadeInUp}
            className="p-6 rounded-xl border"
            style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} className="text-amber-400" />
              <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Awards & Leadership</span>
            </div>
            <div className="space-y-4">
              <div className="border-l-2 pl-4" style={{ borderColor: "rgba(245,158,11,0.4)" }}>
                <h4 className="text-sm font-mono font-semibold text-zinc-100">Junior Vice President – Skill Development Society, CUI</h4>
                <p className="text-xs font-mono text-zinc-400 mt-1 leading-relaxed">
                  Organized the E-commerce &amp; Financial Literacy Session (Oct 25, 2023) in collaboration with Subtle Commerce. Recognized for leadership, coordination, and event management skills in promoting entrepreneurship and digital financial awareness among students.
                </p>
              </div>
              <div className="border-l-2 pl-4" style={{ borderColor: "rgba(245,158,11,0.4)" }}>
                <h4 className="text-sm font-mono font-semibold text-zinc-100">Joint Secretary – CUI Sports Society</h4>
                <p className="text-xs font-mono text-zinc-400 mt-1 leading-relaxed">
                  Recognized for outstanding contributions as Joint Secretary. Played a key role in planning, organizing, and managing university-level sports events, coordinating with teams, and ensuring smooth execution of activities that promoted physical wellness and student engagement.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Certifications */}
          <motion.div
            variants={fadeInUp}
            className="p-6 rounded-xl border"
            style={{ background: "rgba(6,182,212,0.05)", borderColor: "rgba(6,182,212,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Certifications</span>
            </div>
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(6,182,212,0.15)" }}
              >
                <BookOpen size={18} className="text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-mono font-semibold text-zinc-100">English Works Program</h4>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">U.S. Embassy, Pakistan</p>
                <p className="text-xs font-mono text-zinc-500 mt-1">6-Month English Language &amp; Professional Skills Course</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
