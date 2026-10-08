import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { MIN_NIGHTS, PRICES, type Season } from "@/utils/pricing";
import { guidesUi } from "@/data/guides";
import { DEFAULT_LANGUAGE, normalizeLanguage } from "@/i18n/language";

const COLOR: Record<Season, string> = {
  low: "74 222 128",
  mid: "250 204 21",
  high: "251 146 60",
  super: "167 139 250",
};
const ORDER: Season[] = ["low", "mid", "high", "super"];

/** Compact season/price legend under the booking calendar; the full year lives in the guide. */
export function SeasonStrip() {
  const { i18n } = useTranslation();
  const ui = guidesUi(normalizeLanguage(i18n.language) ?? DEFAULT_LANGUAGE);
  const names: Record<Season, string> = { low: ui.calLow, mid: ui.calMid, high: ui.calHigh, super: ui.calPeak };

  return (
    <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8" aria-label={ui.calTitle}>
      <div className="rounded-2xl border border-border/60 bg-surface p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl text-foreground">{ui.calTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ORDER.map((s) => (
            <li key={s} className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5">
              <span className="season-dot h-5 w-5 shrink-0" style={{ ["--c" as string]: COLOR[s] }} aria-hidden="true" />
              <span className="text-sm">
                <span className="block font-semibold text-foreground">
                  {names[s]} · {PRICES[s]} €
                </span>
                <span className="block text-xs text-muted-foreground">
                  {ui.calPerNight} · {ui.calMin.replace("{{n}}", String(MIN_NIGHTS[s]))}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <Link
          to="/guias/$slug"
          params={{ slug: "mejor-epoca-autocaravana-valencia" }}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {ui.calLink} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
