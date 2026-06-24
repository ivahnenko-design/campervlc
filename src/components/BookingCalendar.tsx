import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Lock, MessageCircle, Sparkles } from "lucide-react";
import { SectionHeader } from "./Fleet";
import { AVAILABILITY, EXTRAS, FLEET, type ExtraId } from "@/data/fleet";
import { calculatePrice, getSeason, MIN_NIGHTS } from "@/utils/pricing";
import { buildWhatsAppLink, INSTAGRAM_HANDLE } from "@/lib/constants";

function isoDay(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function useBookedSet(camperId: string) {
  return useMemo(() => {
    const a = AVAILABILITY.find((x) => x.camperId === camperId);
    return new Set(a?.bookedDates ?? []);
  }, [camperId]);
}

interface Range { start: Date | null; end: Date | null }

export function BookingCalendar() {
  const { t, i18n } = useTranslation();
  const camper = FLEET[0];
  const booked = useBookedSet(camper.id);

  const today = startOfDay(new Date());
  const [monthBase, setMonthBase] = useState<Date>(startOfMonth(today));
  const [range, setRange] = useState<Range>({ start: null, end: null });
  const [selectedExtras, setSelectedExtras] = useState<Set<ExtraId>>(
    () => new Set(EXTRAS.filter((e) => e.mandatory).map((e) => e.id))
  );

  const months = [monthBase, addMonths(monthBase, 1)];

  const handleClick = (d: Date) => {
    if (isBefore(d, today)) return;
    if (booked.has(isoDay(d))) return;
    if (!range.start || (range.start && range.end)) {
      setRange({ start: d, end: null });
      return;
    }
    if (isBefore(d, range.start)) {
      setRange({ start: d, end: null });
      return;
    }
    // ensure no booked day in between
    let cursor = range.start;
    while (!isSameDay(cursor, d)) {
      cursor = addDays(cursor, 1);
      if (booked.has(isoDay(cursor)) && !isSameDay(cursor, d)) {
        setRange({ start: d, end: null });
        return;
      }
    }
    setRange({ start: range.start, end: d });
  };

  const price = useMemo(() => {
    if (range.start && range.end) return calculatePrice(range.start, range.end);
    return null;
  }, [range]);

  const extrasTotal = useMemo(
    () =>
      EXTRAS.filter((e) => selectedExtras.has(e.id)).reduce((s, e) => s + e.price, 0),
    [selectedExtras]
  );

  const finalTotal = (price?.total ?? 0) + extrasTotal;

  const minNights = range.start ? MIN_NIGHTS[getSeason(range.start)] : null;
  const nights = price?.nights ?? 0;
  const meetsMin = !minNights || nights >= minNights;

  const seasonLabel = range.start
    ? t(`booking.season_${getSeason(range.start)}` as const)
    : null;

  const toggleExtra = (id: ExtraId) => {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const dateLocale = i18n.language;
  const fmtDate = (d: Date) => d.toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" });

  const waMessage = t("booking.wa_message", {
    start: range.start ? fmtDate(range.start) : "—",
    end: range.end ? fmtDate(range.end) : "—",
    nights,
    extras: selectedExtras.size
      ? EXTRAS.filter((e) => selectedExtras.has(e.id)).map((e) => t(`extras.${e.id}`)).join(", ")
      : t("booking.none"),
    total: finalTotal,
  });

  const canSubmit = range.start && range.end && meetsMin;

  return (
    <section id="booking" className="relative py-24 sm:py-32 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t("booking.title")}
          subtitle={t("booking.subtitle")}
          eyebrow="01 · Reserva"
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          {/* Calendar */}
          <div className="rounded-2xl border border-border/60 bg-surface p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMonthBase(addMonths(monthBase, -1))}
                disabled={isBefore(addMonths(monthBase, -1), startOfMonth(today))}
                className="grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="prev month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Legend color="bg-emerald-500/70" label={t("booking.legend_available")} />
                <Legend color="bg-primary" label={t("booking.legend_selected")} />
                <Legend color="bg-rose-500/70" label={t("booking.legend_booked")} />
              </div>
              <button
                onClick={() => setMonthBase(addMonths(monthBase, 1))}
                className="grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
                aria-label="next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              {months.map((m) => (
                <MonthGrid
                  key={m.toISOString()}
                  month={m}
                  today={today}
                  booked={booked}
                  range={range}
                  onPick={handleClick}
                  locale={dateLocale}
                />
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-border/60 bg-surface p-5 sm:p-7 self-start sticky top-24">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary/80">
              <Sparkles className="h-3.5 w-3.5" />
              {t("booking.summary")}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <DateBox label={t("booking.checkin")} value={range.start ? fmtDate(range.start) : "—"} />
              <DateBox label={t("booking.checkout")} value={range.end ? fmtDate(range.end) : "—"} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("booking.nights")}: <span className="font-mono-num text-foreground">{nights}</span></span>
              {seasonLabel && <span className="text-primary/80">{seasonLabel}</span>}
            </div>
            {range.start && !meetsMin && (
              <p className="mt-2 text-xs text-coral">{t("booking.minNights", { n: minNights })}</p>
            )}

            {/* Extras */}
            <div className="mt-6">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("extras.title")}</div>
              <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
                {EXTRAS.map((e) => {
                  const active = selectedExtras.has(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleExtra(e.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                        active
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`grid h-4 w-4 place-items-center rounded border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                          {active ? "✓" : ""}
                        </span>
                        {t(`extras.${e.id}`)}
                      </span>
                      <span className="font-mono-num text-xs text-foreground">{e.price} €</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="mt-6 space-y-1.5 text-sm">
              {price && (
                <>
                  <Row label={t("booking.subtotal")} value={`${price.subtotal} €`} />
                  {price.discountPct > 0 && (
                    <Row label={t("booking.discount", { pct: price.discountPct })} value={`-${price.discountAmount} €`} accent />
                  )}
                  <Row label={t("booking.extras")} value={`${extrasTotal} €`} />
                </>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={finalTotal}
                initial={{ scale: 0.98, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-5 flex items-end justify-between border-t border-border/60 pt-4"
              >
                <span className="text-sm text-muted-foreground">{t("booking.total")}</span>
                <span className="font-mono-num text-3xl font-bold text-primary">
                  {finalTotal} €
                </span>
              </motion.div>
            </AnimatePresence>

            <a
              href={canSubmit ? buildWhatsAppLink(waMessage) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!canSubmit}
              onClick={(e) => { if (!canSubmit) e.preventDefault(); }}
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition ${
                canSubmit
                  ? "bg-primary text-primary-foreground glow-amber hover:brightness-110"
                  : "bg-border/60 text-muted-foreground cursor-not-allowed"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              {t("booking.cta")} →
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t("booking.alt_contact", { handle: INSTAGRAM_HANDLE })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function DateBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-base text-foreground">{value}</div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono-num ${accent ? "text-coral" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function MonthGrid({
  month, today, booked, range, onPick, locale,
}: {
  month: Date;
  today: Date;
  booked: Set<string>;
  range: Range;
  onPick: (d: Date) => void;
  locale: string;
}) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const startWeekday = (start.getDay() + 6) % 7; // Monday = 0
  const days: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= end.getDate(); d++) days.push(new Date(start.getFullYear(), start.getMonth(), d));

  const monthLabel = month.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];

  const inRange = (d: Date) => {
    if (range.start && range.end) return isWithinInterval(d, { start: range.start, end: range.end });
    return false;
  };

  return (
    <div>
      <div className="mb-3 text-center font-display text-lg text-foreground capitalize">{monthLabel}</div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        {dayLabels.map((l) => (<div key={l} className="py-1">{l}</div>))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d, idx) => {
          if (!d) return <div key={idx} />;
          const past = isBefore(d, today);
          const iso = isoDay(d);
          const isBooked = booked.has(iso);
          const isStart = range.start && isSameDay(d, range.start);
          const isEnd = range.end && isSameDay(d, range.end);
          const within = inRange(d);
          const disabled = past || isBooked;

          let cls = "aspect-square w-full rounded-md text-sm font-mono-num transition-colors ";
          if (disabled) {
            cls += isBooked
              ? "bg-rose-500/15 text-rose-300/70 line-through cursor-not-allowed"
              : "text-muted-foreground/30 cursor-not-allowed";
          } else if (isStart || isEnd) {
            cls += "bg-primary text-primary-foreground font-bold";
          } else if (within) {
            cls += "bg-primary/25 text-foreground";
          } else {
            cls += "text-foreground hover:bg-primary/15 border border-border/30";
          }

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onPick(d)}
              className={cls}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
