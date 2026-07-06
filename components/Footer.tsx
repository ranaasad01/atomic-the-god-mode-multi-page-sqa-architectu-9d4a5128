"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { footerLinks, brand } from "@/lib/data";
import { useMetricsStore } from "@/lib/store";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { useTranslations } from "next-intl";

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations();
  const systemHealth = useMetricsStore((s) => s.systemHealth);
  const passedCount = useMetricsStore((s) => s.passedCount);
  const failedCount = useMetricsStore((s) => s.failedCount);
  const throughputRPS = useMetricsStore((s) => s.throughputRPS);

  const healthColor =
    systemHealth > 80 ? "#10b981" : systemHealth > 50 ? "#f59e0b" : "#ef4444";

  return (
    <footer
      className="relative z-10 md:pl-64 mt-auto"
      style={{
        borderTop: "1px solid rgba(16,185,129,0.1)",
        background: "rgba(9,9,11,0.8)",
        backdropFilter: "blur(20px)",
      }}
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="max-w-6xl mx-auto px-6 py-12"
      >
        {/* Top row */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10"
        >
          {/* Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: healthColor,
                  boxShadow: `0 0 8px ${healthColor}`,
                }}
              />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                {brand.version}
              </span>
            </div>
            <h2 className="text-sm font-bold font-mono text-emerald-400">
              {brand.name}
            </h2>
            <p className="text-xs font-mono text-zinc-600 max-w-xs">
              Software Quality Assurance Engineer · DaticsAI, Lahore, Pakistan · raomali005@gmail.com
            </p>
          </div>

          {/* Live metrics strip */}
          <div className="flex gap-6">
            {[
              { label: "Health", value: `${systemHealth.toFixed(1)}%`, color: healthColor },
              { label: "Passed", value: passedCount.toLocaleString("en-US"), color: "#10b981" },
              { label: "Failed", value: failedCount.toLocaleString("en-US"), color: "#ef4444" },
              { label: "RPS", value: Math.round(throughputRPS).toLocaleString("en-US"), color: "#06b6d4" },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <div
                  className="text-lg font-mono font-bold tabular-nums"
                  style={{ color: m.color }}
                >
                  {m.value}
                </div>
                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Nav links */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap gap-x-6 gap-y-2 mb-8"
        >
          {footerLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-mono transition-colors duration-200 ${
                  isActive
                    ? "text-emerald-400"
                    : "text-zinc-600 hover:text-emerald-400"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6"
          style={{ borderTop: "1px solid rgba(16,185,129,0.06)" }}
        >
          <p className="text-[10px] font-mono text-zinc-700">
            © {new Date().getFullYear()} {brand.name} · {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#10b981" }}
            />
            <span className="text-[10px] font-mono text-zinc-600">
              {t("footer.telemetry")}
            </span>
            <span className="text-[10px] font-mono text-zinc-700 ml-2">
              {t("footer.stack")}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}