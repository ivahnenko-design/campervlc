import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { buildWhatsAppLink } from "@/lib/constants";

function CamperIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14V6h18l6 4v4" />
      <path d="M2 14h28" />
      <circle cx="8" cy="15.5" r="2.5" />
      <circle cx="24" cy="15.5" r="2.5" />
      <path d="M20 6v4h6" />
      <path d="M5 9h6" />
    </svg>
  );
}

const SECTIONS = ["fleet", "booking", "routes", "reviews", "faq", "contact"] as const;

export function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const waLink = buildWhatsAppLink("Hola, me interesa alquilar la camper en Valencia.");

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/75 backdrop-blur-xl border-b border-border/60"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-2 text-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <CamperIcon className="h-5 w-5" />
            </span>
            <span className="font-display text-lg leading-none">
              Camper Retreat <span className="text-primary">VLC</span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-7">
            {SECTIONS.map((s) => (
              <a
                key={s}
                href={`#${s}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t(`nav.${s}`)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 transition"
            >
              {t("nav.cta")}
            </a>
            <button
              className="lg:hidden grid h-9 w-9 place-items-center rounded-md border border-border/60 text-foreground"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-4 flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <a
                key={s}
                href={`#${s}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface/70"
              >
                {t(`nav.${s}`)}
              </a>
            ))}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              {t("nav.cta")}
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
