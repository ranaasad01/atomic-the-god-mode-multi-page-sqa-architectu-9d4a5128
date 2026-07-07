"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const locales = [
    { code: "en", label: "EN" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-zinc-900/80 backdrop-blur text-emerald-400 text-xs font-mono hover:border-emerald-400/60 transition-colors"
        aria-label="Toggle language"
      >
        <Globe size={14} />
        <span>{locale.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 bg-zinc-900/95 border border-emerald-500/20 rounded-lg overflow-hidden shadow-xl">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-xs font-mono text-left transition-colors ${
                locale === l.code
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/5"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
