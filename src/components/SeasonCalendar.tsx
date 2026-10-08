import { useMemo } from "react";
import { MIN_NIGHTS, PRICES, getSeason, type Season } from "@/utils/pricing";
import { guidesUi } from "@/data/guides";
import type { LanguageCode } from "@/i18n/language";

// Season colours (same as the Instagram calendar and the site's palette).
const COLOR: Record<Season, string> = {
  low: "74 222 128",
  mid: "250 204 21",
  high: "251 146 60",
  super: "167 139 250",
};
const ORDER: Season[] = ["low", "mid", "high", "super"];

/**
 * Real HTML calendar of the season prices for one year, built from the same
 * getSeason() the booking calculator uses, so it never disagrees with the price
 * a guest is charged. Text, not an image: indexable, translatable, scalable.
 */
export function SeasonCalendar({ year = 2027, lang }: { year?: number; lang: LanguageCode }) {
  const ui = guidesUi(lang);
  const names: Record<Season, string> = { low: ui.calLow, mid: ui.calMid, high: ui.calHigh, super: ui.calPeak };

  const { months, weekdays } = useMemo(() => {
    const month = new Intl.DateTimeFormat(lang, { month: "long" });
    const wd = new Intl.DateTimeFormat(lang, { weekday: "short", timeZone: "UTC" });
    // 2024-01-01 is a Monday: Monday-first weekday labels, two letters
    const weekdays = Array.from({ length: 7 }, (_, i) => {
      const t = wd.format(new Date(Date.UTC(2024, 0, 1 + i))).replace(".", "");
      return t.charAt(0).toUpperCase() + t.slice(1, 2);
    });
    const months = Array.from({ length: 12 }, (_, m) => {
      const first = (new Date(year, m, 1).getDay() + 6) % 7;
      const count = new Date(year, m + 1, 0).getDate();
      const days = Array.from({ length: count }, (_, i) => ({ day: i + 1, season: getSeason(new Date(year, m, i + 1)), weekend: (first + i) % 7 >= 5 }));
      const label = month.format(new Date(year, m, 1));
      return { label: label.charAt(0).toUpperCase() + label.slice(1), first, days };
    });
    return { months, weekdays };
  }, [lang, year]);

  return (
    <figure className="my-10" aria-label={ui.calTitle}>
      <figcaption className="mb-4 font-display text-xl text-foreground">{ui.calTitle}</figcaption>
      <ul className="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/90">
        {ORDER.map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span className="season-dot h-4 w-4" style={{ ["--c" as string]: COLOR[s] }} aria-hidden="true" />
            <span className="font-medium">{names[s]}</span>
            <span className="text-muted-foreground">
              {PRICES[s]} € · {ui.calPerNight} · {ui.calMin.replace("{{n}}", String(MIN_NIGHTS[s]))}
            </span>
          </li>
        ))}
      </ul>
      <p className="-mt-3 mb-6 text-sm text-muted-foreground">{ui.calDiscounts}</p>
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
        {months.map((m) => (
          <div key={m.label}>
            <div className="mb-2 text-sm font-semibold text-foreground">{m.label}</div>
            <div className="grid grid-cols-7 gap-[3px] text-center text-[10px] font-semibold text-muted-foreground" aria-hidden="true">
              {weekdays.map((w, i) => (
                <div key={i} className={i >= 5 ? "text-primary" : undefined}>
                  {w}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-[3px]">
              {Array.from({ length: m.first }, (_, i) => (
                <div key={`e${i}`} />
              ))}
              {m.days.map((d) => (
                <span
                  key={d.day}
                  className={`season-cell flex aspect-square items-center justify-center font-mono-num text-[11px] sm:text-sm ${d.weekend ? "font-semibold text-primary" : "font-medium text-foreground"}`}
                  style={{ ["--c" as string]: COLOR[d.season] }}
                  aria-label={`${d.day} ${m.label}: ${names[d.season]}`}
                >
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
