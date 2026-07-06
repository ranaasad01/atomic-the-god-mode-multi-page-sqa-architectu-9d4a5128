"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, Check, ChevronDown, ChevronRight, Circle, FileCode, FileText, GitBranch, Lock, Search, Sparkles, Star, Terminal, Eye, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { fadeInUp, fadeIn, staggerContainer, scaleIn, slideInLeft, slideInRight } from "@/lib/motion";
import { useTranslations } from "next-intl";

// ─── Inline mock data ────────────────────────────────────────────────────────

const METHODOLOGY_PILLARS = [
  {
    id: "functional",
    icon: Check,
    color: "#10b981",
    glow: "rgba(16,185,129,0.25)",
    title: "Functional & Regression Testing",
    subtitle: "Systematic coverage of all requirements",
    description:
      "Executed manual testing for Web and Mobile applications covering functional, UI, and usability scenarios. Regression suites ensure new changes do not break existing features.",
    metrics: [
      { label: "Pass Rate", value: "97.2%", delta: "+5%" },
      { label: "Regression Coverage", value: "95%+", delta: "+12%" },
      { label: "Defect Escape Rate", value: "< 3%", delta: "-40%" },
    ],
    practices: [
      "Structured test case creation in ClickUp/Jira",
      "Regression suite execution on every release",
      "UI and usability scenario coverage",
      "Expected vs actual result documentation",
    ],
  },
  {
    id: "api",
    icon: Activity,
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.25)",
    title: "API Testing with Postman",
    subtitle: "Validate every endpoint contract",
    description:
      "Performed API testing to validate request/response behavior, data integrity, status codes, and error handling across RESTful endpoints on the Veridat data marketplace platform.",
    metrics: [
      { label: "Endpoints Tested", value: "150+", delta: "+30%" },
      { label: "Error Scenarios", value: "40+", delta: "+20%" },
      { label: "Response Time", value: "< 200ms", delta: "-15%" },
    ],
    practices: [
      "Request/response validation with Postman",
      "Data integrity checks on all CRUD operations",
      "Error handling and edge case coverage",
      "Authentication header and token validation",
    ],
  },
  {
    id: "automation",
    icon: Terminal,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
    title: "Playwright E2E Automation",
    subtitle: "Critical flow automation at scale",
    description:
      "Implemented test automation using Playwright focusing on critical user flows, regression coverage, and UI validation. Automated auth, payment, dataset, and chat flows on the Veridat platform.",
    metrics: [
      { label: "Automated Flows", value: "50+", delta: "+100%" },
      { label: "Execution Time", value: "< 5 min", delta: "-60%" },
      { label: "Flakiness Rate", value: "< 2%", delta: "-75%" },
    ],
    practices: [
      "Page Object Model architecture",
      "Cross-browser execution (Chromium, Firefox, WebKit)",
      "CI/CD pipeline integration",
      "Screenshot and trace capture on failure",
    ],
  },
  {
    id: "security",
    icon: Lock,
    color: "#ef4444",
    glow: "rgba(239,68,68,0.25)",
    title: "Security & Auth Flow Validation",
    subtitle: "Zero-tolerance for auth vulnerabilities",
    description:
      "Verified authentication and security flows including OTP verification, session handling, role-based access control, Stripe payment flows, and KYC onboarding for buyers and sellers.",
    metrics: [
      { label: "Auth Scenarios", value: "30+", delta: "+50%" },
      { label: "RBAC Rules Tested", value: "15+", delta: "+25%" },
      { label: "Critical Failures", value: "0", delta: "0%" },
    ],
    practices: [
      "OTP and session management testing",
      "Role-based access control validation",
      "Stripe payment and KYC flow testing",
      "Admin-side verification and onboarding flows",
    ],
  },
];

const TAG_CLOUD_ITEMS = [
  { label: "Playwright", detail: "E2E Automation", category: "automation", color: "#10b981" },
  { label: "Postman", detail: "API Testing", category: "api", color: "#06b6d4" },
  { label: "JMeter", detail: "Performance Testing", category: "performance", color: "#f59e0b" },
  { label: "ClickUp", detail: "Issue Tracking", category: "management", color: "#06b6d4" },
  { label: "Jira", detail: "Bug Reporting", category: "management", color: "#06b6d4" },
  { label: "Git", detail: "Version Control", category: "devops", color: "#10b981" },
  { label: "Agile", detail: "Methodology", category: "process", color: "#f59e0b" },
  { label: "Scrum", detail: "Framework", category: "process", color: "#f59e0b" },
  { label: "HTML", detail: "Markup", category: "frontend", color: "#10b981" },
  { label: "CSS", detail: "Styling", category: "frontend", color: "#10b981" },
  { label: "JavaScript", detail: "Scripting", category: "frontend", color: "#f59e0b" },
  { label: "MySQL", detail: "Relational DB", category: "database", color: "#06b6d4" },
  { label: "MongoDB", detail: "NoSQL DB", category: "database", color: "#10b981" },
  { label: "Manual Testing", detail: "Core Skill", category: "testing", color: "#10b981" },
  { label: "API Testing", detail: "REST Validation", category: "testing", color: "#06b6d4" },
  { label: "Regression Testing", detail: "Suite Execution", category: "testing", color: "#10b981" },
  { label: "Exploratory Testing", detail: "Ad-hoc Discovery", category: "testing", color: "#f59e0b" },
  { label: "Usability Testing", detail: "UX Validation", category: "testing", color: "#06b6d4" },
  { label: "Compatibility Testing", detail: "Cross-platform", category: "testing", color: "#ef4444" },
  { label: "SDLC", detail: "Dev Lifecycle", category: "process", color: "#f59e0b" },
  { label: "Functional Testing", detail: "Requirements Coverage", category: "testing", color: "#10b981" },
];

const TIMELINE_MILESTONES = [
  {
    year: "Jun 2024",
    title: "Front-End Developer Intern — Tech Hero",
    description:
      "Designed and developed responsive, user-friendly websites using HTML, CSS, JavaScript, and jQuery. Collaborated with clients to understand project requirements and deliver customized front-end solutions.",
    tags: ["HTML", "CSS", "JavaScript", "jQuery"],
    side: "left" as const,
  },
  {
    year: "Nov 2024",
    title: "QA Engineer Intern — Tech Hero",
    description:
      "Conducted manual testing of web and mobile applications. Practiced API testing using Postman on dummy endpoints. Wrote test cases and bug reports. Assisted in QA tasks for mock and academic projects.",
    tags: ["Manual Testing", "Postman", "Bug Reports", "Test Cases"],
    side: "right" as const,
  },
  {
    year: "Oct 2025",
    title: "Software QA Engineer — DaticsAI",
    description:
      "Performed API testing, Desktop/Web/Mobile manual testing, and implemented Playwright automation on the Veridat data marketplace platform. Tested Stripe payments, KYC flows, RBAC, OTP, real-time chat, and dataset workflows.",
    tags: ["Playwright", "Postman", "JMeter", "Veridat Platform"],
    side: "left" as const,
  },
];

const COMPARISON_ROWS = [
  { metric: "Defect Detection Rate", manual: 42, automated: 78, mutation: 94, unit: "%" },
  { metric: "Execution Speed", manual: 15, automated: 85, mutation: 70, unit: "rel" },
  { metric: "Coverage Depth", manual: 55, automated: 80, mutation: 96, unit: "%" },
  { metric: "Repeatability", manual: 60, automated: 99, mutation: 99, unit: "%" },
  { metric: "Maintenance Cost", manual: 20, automated: 55, mutation: 65, unit: "rel" },
];

// ─── Tag Cloud Component (Three.js canvas) ───────────────────────────────────

function TagCloud() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.38;

    const tags = TAG_CLOUD_ITEMS.map((item, i) => {
      const phi = Math.acos(-1 + (2 * i) / TAG_CLOUD_ITEMS.length);
      const theta = Math.sqrt(TAG_CLOUD_ITEMS.length * Math.PI) * phi;
      return {
        ...item,
        x: R * Math.cos(theta) * Math.sin(phi),
        y: R * Math.sin(theta) * Math.sin(phi),
        z: R * Math.cos(phi),
        rotX: 0,
        rotY: 0,
      };
    });

    let rotX = 0;
    let rotY = 0;

    const draw = () => {
      const mx = (mouseRef.current.x - cx) / cx;
      const my = (mouseRef.current.y - cy) / cy;
      rotY += (mx * 0.012 - rotY) * 0.05;
      rotX += (-my * 0.012 - rotX) * 0.05;
      rotY += 0.003;

      ctx.clearRect(0, 0, W, H);

      const projected = tags.map((tag) => {
        // Rotate Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = tag.x * cosY + tag.z * sinY;
        const z1 = -tag.x * sinY + tag.z * cosY;
        // Rotate X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = tag.y * cosX - z1 * sinX;
        const z2 = tag.y * sinX + z1 * cosX;
        const scale = (z2 + R * 1.5) / (R * 2.5);
        return {
          ...tag,
          px: cx + x1 * scale,
          py: cy + y2 * scale,
          scale,
          depth: z2,
        };
      });

      projected
        .sort((a, b) => a.depth - b.depth)
        .forEach((tag) => {
          const alpha = 0.3 + tag.scale * 0.7;
          const fontSize = Math.round(9 + tag.scale * 8);
          ctx.font = `${fontSize}px monospace`;
          ctx.globalAlpha = alpha;

          const isHovered = hoveredTag === tag.label;
          const color = isHovered ? "#ffffff" : tag.color;

          if (isHovered) {
            ctx.shadowColor = tag.color;
            ctx.shadowBlur = 12;
          } else {
            ctx.shadowBlur = 4;
            ctx.shadowColor = tag.color;
          }

          ctx.fillStyle = color;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(tag.label, tag.px, tag.py);
          ctx.shadowBlur = 0;
        });

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [hoveredTag]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={520}
        height={400}
        className="w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredTag(null)}
      />
      {hoveredTag && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded text-xs font-mono border"
          style={{
            background: "rgba(9,9,11,0.9)",
            borderColor: "rgba(16,185,129,0.3)",
            color: "#10b981",
          }}
        >
          {hoveredTag}
        </div>
      )}
    </div>
  );
}

// ─── Accordion Pillar Card ────────────────────────────────────────────────────

function PillarCard({ pillar, index }: { pillar: typeof METHODOLOGY_PILLARS[0]; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const Icon = pillar.icon;

  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: open ? pillar.color + "40" : "rgba(255,255,255,0.06)",
        background: open
          ? `linear-gradient(135deg, rgba(9,9,11,0.95), ${pillar.glow})`
          : "rgba(9,9,11,0.6)",
        transition: "border-color 0.3s, background 0.3s",
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-4 px-6 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: pillar.glow, border: `1px solid ${pillar.color}40` }}
        >
          <Icon size={18} style={{ color: pillar.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-white">{pillar.title}</span>
          </div>
          <div className="text-xs font-mono mt-0.5" style={{ color: pillar.color + "cc" }}>
            {pillar.subtitle}
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        >
          <ChevronDown size={16} className="text-zinc-500" />
        </motion.div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-5">
              {/* Description */}
              <p className="text-sm font-mono text-zinc-400 leading-relaxed">
                {pillar.description}
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3">
                {pillar.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-lg p-3 text-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="text-lg font-mono font-bold" style={{ color: pillar.color }}>
                      {m.value}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-0.5">
                      {m.label}
                    </div>
                    <div
                      className="text-[10px] font-mono mt-1"
                      style={{
                        color: m.delta.startsWith("-") && m.label !== "Defect Escape Rate" && m.label !== "Flakiness Rate" && m.label !== "Critical Failures"
                          ? "#ef4444"
                          : m.delta === "0%"
                          ? "#f59e0b"
                          : "#10b981",
                      }}
                    >
                      {m.delta}
                    </div>
                  </div>
                ))}
              </div>

              {/* Practices */}
              <div className="space-y-2">
                {pillar.practices.map((p) => (
                  <div key={p} className="flex items-start gap-2">
                    <ChevronRight size={12} className="mt-0.5 flex-shrink-0" style={{ color: pillar.color }} />
                    <span className="text-xs font-mono text-zinc-400">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { AnimatePresence } from "framer-motion";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeepTechMethodologyPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen px-4 md:px-8 py-12 max-w-7xl mx-auto space-y-20">

      {/* ── Hero ── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="text-center space-y-4"
      >
        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono"
          style={{ borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.05)", color: "#10b981" }}
        >
          <Sparkles size={12} />
          TESTING METHODOLOGY
        </motion.div>
        <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl font-mono font-bold text-white">
          Rao Muhammad Ali
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-lg font-mono" style={{ color: "#10b981" }}>
          Software Quality Assurance Engineer
        </motion.p>
        <motion.p variants={fadeInUp} className="text-sm font-mono text-zinc-500 max-w-2xl mx-auto">
          DaticsAI, Lahore, Pakistan &nbsp;·&nbsp; raomali005@gmail.com &nbsp;·&nbsp; (+92) 300-7228384
        </motion.p>
        <motion.p variants={fadeInUp} className="text-sm font-mono text-zinc-400 max-w-3xl mx-auto leading-relaxed">
          Applying modern testing techniques with a clear understanding of the software development lifecycle.
          Experienced in functional, regression, usability, compatibility, and exploratory testing,
          using tools like Postman and JMeter to validate performance and quality.
        </motion.p>
      </motion.section>

      {/* ── Methodology Pillars ── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 rounded-full bg-emerald-500" />
          <h2 className="text-xl font-mono font-bold text-white">Testing Methodology Pillars</h2>
        </motion.div>
        <div className="space-y-4">
          {METHODOLOGY_PILLARS.map((pillar, i) => (
            <PillarCard key={pillar.id} pillar={pillar} index={i} />
          ))}
        </div>
      </motion.section>

      {/* ── Mutation Score Formula ── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-amber-500" />
          <h2 className="text-xl font-mono font-bold text-white">Mutation Score Formula</h2>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="rounded-2xl border p-8 text-center"
          style={{
            borderColor: "rgba(245,158,11,0.2)",
            background: "linear-gradient(135deg, rgba(9,9,11,0.95), rgba(245,158,11,0.05))",
          }}
        >
          <div className="text-5xl font-mono font-bold mb-4" style={{ color: "#f59e0b" }}>
            MS = (K / D) × 100
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[
              { symbol: "MS", name: "Mutation Score", desc: "Percentage of mutants killed by the test suite", color: "#f59e0b" },
              { symbol: "K", name: "Killed Mutants", desc: "Number of mutants detected and killed by tests", color: "#10b981" },
              { symbol: "D", name: "Total Mutants", desc: "Total number of mutants generated by the tool", color: "#06b6d4" },
            ].map((item) => (
              <div
                key={item.symbol}
                className="rounded-xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-3xl font-mono font-bold mb-2" style={{ color: item.color }}>
                  {item.symbol}
                </div>
                <div className="text-sm font-mono text-white mb-1">{item.name}</div>
                <div className="text-xs font-mono text-zinc-500">{item.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-xs font-mono text-zinc-500 mt-6">
            A Mutation Score above 85% is considered production-ready. Scores below 75% indicate critical test suite gaps.
          </p>
        </motion.div>
      </motion.section>

      {/* ── Property-Based Testing ── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-cyan-500" />
          <h2 className="text-xl font-mono font-bold text-white">Property-Based Testing</h2>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="rounded-2xl border p-6 md:p-8"
          style={{
            borderColor: "rgba(6,182,212,0.2)",
            background: "linear-gradient(135deg, rgba(9,9,11,0.95), rgba(6,182,212,0.05))",
          }}
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-base font-mono font-bold text-white">Generative Data Boundaries</h3>
              <p className="text-sm font-mono text-zinc-400 leading-relaxed">
                Instead of hand-crafting individual test cases, property-based testing generates thousands of
                inputs automatically, probing boundary conditions that manual testers would never think to check.
                This is especially powerful for validating API contracts and data transformation logic.
              </p>
              <div className="space-y-2">
                {[
                  "Generates 10,000+ edge-case inputs per test run",
                  "Automatically shrinks failing cases to minimal reproducers",
                  "Validates invariants across entire input domains",
                  "Uncovers boundary failures in payment and data processing logic",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <ChevronRight size={12} className="mt-0.5 flex-shrink-0 text-cyan-500" />
                    <span className="text-xs font-mono text-zinc-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-mono font-bold text-white">Example: API Payload Validation</h3>
              <div
                className="rounded-lg p-4 font-mono text-xs leading-relaxed"
                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(6,182,212,0.15)", color: "#06b6d4" }}
              >
                <div className="text-zinc-500 mb-2">{"// Property: any valid dataset upload"}</div>
                <div className="text-zinc-500 mb-2">{"// should return 200 with an id field"}</div>
                <div className="text-emerald-400">fc.assert(</div>
                <div className="pl-4 text-white">fc.property(</div>
                <div className="pl-8 text-cyan-400">fc.record({'{'}fileName: fc.string(), size: fc.integer({'{'}min:1{'}'}){'}'}),</div>
                <div className="pl-8 text-zinc-300">(payload) =&gt; {'{'}  </div>
                <div className="pl-12 text-zinc-300">const res = uploadDataset(payload);</div>
                <div className="pl-12 text-emerald-400">expect(res.status).toBe(200);</div>
                <div className="pl-12 text-emerald-400">expect(res.body.id).toBeDefined();</div>
                <div className="pl-8 text-zinc-300">{'}'}</div>
                <div className="pl-4 text-white">)</div>
                <div className="text-emerald-400">);</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── Comparison Table ── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-emerald-500" />
          <h2 className="text-xl font-mono font-bold text-white">Testing Approach Comparison</h2>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "rgba(16,185,129,0.15)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(16,185,129,0.05)", borderBottom: "1px solid rgba(16,185,129,0.1)" }}>
                  <th className="text-left px-6 py-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">Metric</th>
                  <th className="text-center px-6 py-4 text-xs font-mono uppercase tracking-widest" style={{ color: "#06b6d4" }}>Manual</th>
                  <th className="text-center px-6 py-4 text-xs font-mono uppercase tracking-widest" style={{ color: "#10b981" }}>Automated</th>
                  <th className="text-center px-6 py-4 text-xs font-mono uppercase tracking-widest" style={{ color: "#f59e0b" }}>Mutation</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.metric}
                    style={{
                      borderBottom: i < COMPARISON_ROWS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                    }}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-zinc-300">{row.metric}</td>
                    {[{ val: row.manual, color: "#06b6d4" }, { val: row.automated, color: "#10b981" }, { val: row.mutation, color: "#f59e0b" }].map((cell, ci) => (
                      <td key={ci} className="px-6 py-4">
                        <div className="flex items-center gap-3 justify-center">
                          <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${cell.val}%`, background: cell.color, boxShadow: `0 0 6px ${cell.color}60` }}
                            />
                          </div>
                          <span className="text-xs font-mono tabular-nums" style={{ color: cell.color }}>
                            {cell.val}{row.unit === "%" ? "%" : ""}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.section>

      {/* ── Career Timeline ── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-cyan-500" />
          <h2 className="text-xl font-mono font-bold text-white">Career Timeline</h2>
        </motion.div>

        <div className="relative">
          {/* Center line */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(16,185,129,0.3), transparent)" }}
          />

          <div className="space-y-8">
            {TIMELINE_MILESTONES.map((milestone, i) => (
              <motion.div
                key={milestone.year}
                variants={milestone.side === "left" ? slideInLeft : slideInRight}
                className={`flex flex-col md:flex-row gap-4 md:gap-8 ${
                  milestone.side === "right" ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Content */}
                <div className="flex-1">
                  <div
                    className="rounded-xl border p-5 space-y-3"
                    style={{
                      borderColor: "rgba(16,185,129,0.15)",
                      background: "rgba(9,9,11,0.8)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
                      >
                        {milestone.year}
                      </span>
                    </div>
                    <h3 className="text-sm font-mono font-bold text-white">{milestone.title}</h3>
                    <p className="text-xs font-mono text-zinc-400 leading-relaxed">{milestone.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {milestone.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono px-2 py-0.5 rounded"
                          style={{ background: "rgba(6,182,212,0.08)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.15)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Center dot */}
                <div className="hidden md:flex items-center justify-center w-8 flex-shrink-0">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: "#10b981", boxShadow: "0 0 10px rgba(16,185,129,0.6)" }}
                  />
                </div>

                {/* Spacer */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Education, Certifications & Awards ── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-amber-500" />
          <h2 className="text-xl font-mono font-bold text-white">Education, Certifications & Awards</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Education */}
          <motion.div
            variants={scaleIn}
            className="rounded-xl border p-6 space-y-3"
            style={{ borderColor: "rgba(16,185,129,0.15)", background: "rgba(9,9,11,0.8)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} style={{ color: "#10b981" }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#10b981" }}>Education</span>
            </div>
            <h3 className="text-sm font-mono font-bold text-white">COMSATS University of Islamabad</h3>
            <p className="text-xs font-mono text-zinc-400">Bachelor of Science in Software Engineering</p>
            <p className="text-xs font-mono" style={{ color: "#06b6d4" }}>Feb 2021 – Mar 2025</p>
          </motion.div>

          {/* Certifications */}
          <motion.div
            variants={scaleIn}
            className="rounded-xl border p-6 space-y-3"
            style={{ borderColor: "rgba(6,182,212,0.15)", background: "rgba(9,9,11,0.8)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileCode size={14} style={{ color: "#06b6d4" }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#06b6d4" }}>Certification</span>
            </div>
            <h3 className="text-sm font-mono font-bold text-white">English Works Program</h3>
            <p className="text-xs font-mono text-zinc-400">U.S. Embassy, Pakistan</p>
            <p className="text-xs font-mono text-zinc-500">6-Month English Language & Professional Skills Course</p>
          </motion.div>

          {/* Awards */}
          <motion.div
            variants={scaleIn}
            className="rounded-xl border p-6 space-y-4"
            style={{ borderColor: "rgba(245,158,11,0.15)", background: "rgba(9,9,11,0.8)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} style={{ color: "#f59e0b" }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#f59e0b" }}>Awards</span>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-white">Junior Vice President – Skill Development Society, CUI</h3>
                <p className="text-[10px] font-mono text-zinc-500 mt-1">Organized E-commerce & Financial Literacy Session (Oct 25, 2023) in collaboration with Subtle Commerce.</p>
              </div>
              <div
                className="w-full h-px"
                style={{ background: "rgba(245,158,11,0.1)" }}
              />
              <div>
                <h3 className="text-xs font-mono font-bold text-white">Joint Secretary – CUI Sports Society</h3>
                <p className="text-[10px] font-mono text-zinc-500 mt-1">Planned and managed university-level sports events, coordinating teams and ensuring smooth execution.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Interactive Tag Cloud ── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-emerald-500" />
          <h2 className="text-xl font-mono font-bold text-white">Skills & Tools — Interactive 3D Cloud</h2>
          <span className="text-xs font-mono text-zinc-600">(move cursor to rotate)</span>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="rounded-2xl border overflow-hidden"
          style={{
            borderColor: "rgba(16,185,129,0.15)",
            background: "linear-gradient(135deg, rgba(9,9,11,0.95), rgba(16,185,129,0.03))",
          }}
        >
          <TagCloud />
        </motion.div>

        {/* Tag legend */}
        <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 justify-center">
          {[
            { label: "Testing", color: "#10b981" },
            { label: "API / DB", color: "#06b6d4" },
            { label: "Performance / Process", color: "#f59e0b" },
            { label: "Compatibility", color: "#ef4444" },
          ].map((cat) => (
            <div key={cat.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
              <span className="text-xs font-mono text-zinc-500">{cat.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* ── Core Skills Strip ── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-cyan-500" />
          <h2 className="text-xl font-mono font-bold text-white">Core Skills & Tools</h2>
        </motion.div>
        <motion.div variants={fadeInUp} className="flex flex-wrap gap-2">
          {[
            "Manual Software Testing", "Functional Testing", "Regression Testing",
            "API Testing with Postman", "Performance Testing using JMeter", "Playwright",
            "Exploratory Testing", "Usability Testing", "Compatibility Testing",
            "Test Case & Bug Report Creation (Jira)", "SDLC", "Agile/Scrum",
            "Git Version Control", "HTML", "CSS", "JavaScript", "MySQL", "MongoDB",
          ].map((skill) => (
            <span
              key={skill}
              className="text-xs font-mono px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.15)",
                color: "#10b981",
              }}
            >
              {skill}
            </span>
          ))}
        </motion.div>
      </motion.section>

    </div>
  );
}
