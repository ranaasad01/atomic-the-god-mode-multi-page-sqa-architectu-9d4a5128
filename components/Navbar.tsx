"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { navLinks, brand } from "@/lib/data";
import { useMetricsStore } from "@/lib/store";
import { useTranslations } from "next-intl";

interface CanvasMetrics {
  cpu: number[];
  ram: number[];
}

function NavCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metricsRef = useRef<CanvasMetrics>({ cpu: [], ram: [] });
  const animRef = useRef<number>(0);
  const cpuUsage = useMetricsStore((s) => s.cpuUsage);
  const memoryUsage = useMetricsStore((s) => s.memoryUsage);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const maxPoints = 60;

    const draw = () => {
      const m = metricsRef.current;
      const noisyCpu = Math.min(100, Math.max(0, cpuUsage + (Math.random() - 0.5) * 8));
      const noisyRam = Math.min(100, Math.max(0, memoryUsage + (Math.random() - 0.5) * 5));

      m.cpu.push(noisyCpu);
      m.ram.push(noisyRam);
      if (m.cpu.length > maxPoints) m.cpu.shift();
      if (m.ram.length > maxPoints) m.ram.shift();

      ctx.clearRect(0, 0, W, H);

      const drawLine = (data: number[], color: string, yOffset: number, height: number) => {
        if (data.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        data.forEach((val, i) => {
          const x = (i / (maxPoints - 1)) * W;
          const y = yOffset + height - (val / 100) * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = color.replace(")", ", 0.08)").replace("rgb", "rgba");
        data.forEach((val, i) => {
          const x = (i / (maxPoints - 1)) * W;
          const y = yOffset + height - (val / 100) * height;
          if (i === 0) ctx.moveTo(x, yOffset + height);
          ctx.lineTo(x, y);
        });
        ctx.lineTo(W, yOffset + height);
        ctx.closePath();
        ctx.fill();
      };

      drawLine(m.cpu, "#10b981", 0, H / 2 - 2);
      drawLine(m.ram, "#06b6d4", H / 2 + 2, H / 2 - 2);

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(16,185,129,0.7)";
      ctx.font = "8px monospace";
      ctx.fillText(`CPU ${Math.round(noisyCpu)}%`, 2, 8);
      ctx.fillStyle = "rgba(6,182,212,0.7)";
      ctx.fillText(`RAM ${Math.round(noisyRam)}%`, 2, H / 2 + 10);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [cpuUsage, memoryUsage]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className="w-full opacity-80"
    />
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const t = useTranslations();
  const systemHealth = useMetricsStore((s) => s.systemHealth);
  const p99Latency = useMetricsStore((s) => s.p99Latency);
  const isFaultInjected = useMetricsStore((s) => s.isFaultInjected);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const healthColor =
    systemHealth > 80
      ? "#10b981"
      : systemHealth > 50
      ? "#f59e0b"
      : "#ef4444";

  const badgeColors: Record<string, string> = {
    LIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    HIGH: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    GATE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="fixed left-0 top-0 h-full w-64 z-50 hidden md:flex flex-col"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,9,11,0.98) 0%, rgba(3,3,3,0.98) 100%)",
          borderRight: "1px solid rgba(16,185,129,0.15)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-emerald-500/10">
          <motion.div
            animate={isFaultInjected ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ repeat: isFaultInjected ? Infinity : 0, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: healthColor,
                  boxShadow: `0 0 8px ${healthColor}`,
                }}
              />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                {brand.version}
              </span>
            </div>
            <h1 className="text-sm font-bold text-emerald-400 font-mono tracking-tight leading-tight">
              {brand.name}
            </h1>
            <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">
              {brand.tagline}
            </p>
          </motion.div>
        </div>

        {/* Live canvas */}
        <div className="p-3 border-b border-emerald-500/10">
          <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest mb-1">
            Runner Allocation
          </div>
          <div
            className="rounded overflow-hidden"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(16,185,129,0.1)",
            }}
          >
            <NavCanvas />
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navLinks.map((link, i) => {
            const isActive = pathname === link.href;
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 100, damping: 15 }}
              >
                <Link
                  href={link.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-200 group ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/5 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isActive && (
                      <motion.span
                        layoutId="activeIndicator"
                        className="w-1 h-1 rounded-full bg-emerald-400"
                        style={{ boxShadow: "0 0 6px #10b981" }}
                      />
                    )}
                    {!isActive && (
                      <span className="w-1 h-1 rounded-full bg-zinc-700 group-hover:bg-emerald-500/50 transition-colors" />
                    )}
                    {link.label}
                  </span>
                  {link.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                        badgeColors[link.badge] ?? "bg-zinc-800 text-zinc-500 border-zinc-700"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* System status footer */}
        <div className="p-3 border-t border-emerald-500/10 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
              System Health
            </span>
            <motion.span
              key={Math.round(systemHealth)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-mono"
              style={{ color: healthColor }}
            >
              {systemHealth.toFixed(1)}%
            </motion.span>
          </div>
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${systemHealth}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              style={{ backgroundColor: healthColor, boxShadow: `0 0 8px ${healthColor}` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
              P99 Latency
            </span>
            <motion.span
              key={Math.round(p99Latency)}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-mono"
              style={{
                color: p99Latency > 500 ? "#ef4444" : p99Latency > 200 ? "#f59e0b" : "#10b981",
              }}
            >
              {Math.round(p99Latency)}ms
            </motion.span>
          </div>
          <div className="text-[9px] font-mono text-zinc-700 text-center pt-1">
            {tick % 2 === 0 ? "● TELEMETRY LIVE" : "○ TELEMETRY LIVE"}
          </div>
        </div>
      </motion.aside>

      {/* Mobile top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 md:hidden flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(9,9,11,0.95)",
          borderBottom: "1px solid rgba(16,185,129,0.15)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: healthColor, boxShadow: `0 0 6px ${healthColor}` }}
          />
          <span className="text-xs font-mono text-emerald-400 font-bold">{brand.shortName}</span>
        </div>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="text-zinc-400 hover:text-emerald-400 transition-colors p-1"
          aria-label="Toggle navigation"
        >
          <div className="space-y-1">
            <span className={`block w-5 h-0.5 bg-current transition-all ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`block w-5 h-0.5 bg-current transition-all ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-current transition-all ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="fixed top-12 left-0 right-0 z-40 md:hidden p-4 space-y-1"
            style={{
              background: "rgba(9,9,11,0.98)",
              borderBottom: "1px solid rgba(16,185,129,0.15)",
              backdropFilter: "blur(20px)",
            }}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-zinc-500 hover:text-emerald-400 border border-transparent"
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                        badgeColors[link.badge] ?? "bg-zinc-800 text-zinc-500 border-zinc-700"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}