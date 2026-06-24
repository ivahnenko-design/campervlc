import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { LANGUAGES } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === i18n.language.split("-")[0]) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/60 px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
        aria-label="Change language"
      >
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-base leading-none">{current.flag}</span>
        <span className="font-mono-num text-xs tracking-wider">{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                i18n.changeLanguage(l.code);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-background/60"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{l.flag}</span>
                <span className="font-mono-num text-xs tracking-wider">{l.label}</span>
              </span>
              {current.code === l.code && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
