import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, CreditCard, Sparkles, Tag } from "lucide-react";
import { SectionHeader } from "./Fleet";
import { AVAILABILITY, EXCLUSIVE_EXTRA_GROUPS, EXTRAS, FLEET, type ExtraId } from "@/data/fleet";
import {
  calculateQuote,
  getSeason,
  getMinNights,
  getPriceForDate,
  BOOKING_MAX_DATE,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  promoPctAt,
  TIME_OPTIONS,
  type PrepaymentOption,
} from "@/utils/pricing";
import { MIN_NOTICE_HOURS, startTooSoon } from "@/utils/notice";
import { track } from "@/lib/analytics";
import { fetchYescapaBookedDates } from "@/lib/ical.functions";
import { useQuery } from "@tanstack/react-query";
import { GuestForm, type GuestData } from "./GuestForm";

function isoDay(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function useBookedSet(camperId: string) {
  const local = useMemo(() => {
    const a = AVAILABILITY.find((x) => x.camperId === camperId);
    return a?.bookedDates ?? [];
  }, [camperId]);

  const { data } = useQuery({
    queryKey: ["yescapa-ical"],
    queryFn: () => fetchYescapaBookedDates(),
    staleTime: 30 * 60_000,
    refetchInterval: 30 * 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });


  // Bookings made on this site; Yescapa only learns about them later, if at all.
  const { data: own } = useQuery({
    queryKey: ["own-bookings"],
    queryFn: async (): Promise<{ dates: string[] }> => {
      const res = await fetch("/api/availability");
      if (!res.ok) return { dates: [] };
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  return useMemo(() => {
    const set = new Set<string>(local);
    for (const d of data?.dates ?? []) set.add(d);
    for (const d of own?.dates ?? []) set.add(d);
    return set;
  }, [local, data, own]);
}


interface Range { start: Date | null; end: Date | null }

export function BookingCalendar() {
  const { t, i18n } = useTranslation();
  const camper = FLEET[0];
  const booked = useBookedSet(camper.id);

  const today = startOfDay(new Date());
  const [monthBase, setMonthBase] = useState<Date>(startOfMonth(today));
  const [range, setRange] = useState<Range>({ start: null, end: null });
  const [pickupTime, setPickupTime] = useState<string>(DEFAULT_PICKUP_TIME);
  const [returnTime, setReturnTime] = useState<string>(DEFAULT_RETURN_TIME);
  const [selectedExtras, setSelectedExtras] = useState<Set<ExtraId>>(
    () => new Set(EXTRAS.filter((e) => e.mandatory).map((e) => e.id))
  );
  const [prepaymentOption, setPrepaymentOption] = useState<PrepaymentOption>("deposit");
  const [promoInput, setPromoInput] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);

  const months = [monthBase, addMonths(monthBase, 1)];

  // A start day is only selectable when the pickup is at least MIN_NOTICE_HOURS
  // away at the chosen pickup time.
  const tooSoon = (d: Date) => startTooSoon(isoDay(d), pickupTime);

  // Changing the pickup time can push an already chosen start under the limit.
  const startNowTooSoon = !!range.start && tooSoon(range.start);
  useEffect(() => {
    if (startNowTooSoon) setRange({ start: null, end: null });
  }, [startNowTooSoon]);

  const handleClick = (d: Date) => {
    if (isBefore(d, today)) return;
    if (booked.has(isoDay(d))) return;
    if (!range.start || (range.start && range.end)) {
      if (tooSoon(d)) return;
      setRange({ start: d, end: null });
      return;
    }
    if (isBefore(d, range.start)) {
      if (tooSoon(d)) return;
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
    track("select_dates", { start: isoDay(range.start), end: isoDay(d) });
  };

  // Same function api/create-checkout.js runs, so the total shown here is the
  // total the server will charge.
  const price = useMemo(() => {
    if (!range.start || !range.end) return null;
    return calculateQuote({
      start: range.start,
      end: range.end,
      pickupTime,
      returnTime,
      extraIds: Array.from(selectedExtras),
      promoCode: appliedPromoCode,
      prepaymentOption,
    });
  }, [range, pickupTime, returnTime, selectedExtras, appliedPromoCode, prepaymentOption]);

  const minNights = range.start ? getMinNights(range.start) : null;
  const nights = price?.nights ?? 0;
  const meetsMin = !minNights || nights >= minNights;

  const mandatoryTotal = EXTRAS.filter((e) => e.mandatory).reduce((s, e) => s + e.price, 0);
  const extrasTotal = price?.extrasTotal ?? 0;
  const promoDiscountAmount = price?.promoDiscountAmount ?? 0;
  const prepaymentDiscountAmount = price?.prepaymentDiscountAmount ?? 0;
  const finalTotal = price?.finalTotal ?? mandatoryTotal;
  const finalTotalWithIva = price?.finalTotalWithIva ?? 0;

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (promoPctAt(code)) {
      setAppliedPromoCode(code);
      setPromoStatus("valid");
    } else {
      setAppliedPromoCode(null);
      setPromoStatus("invalid");
    }
  };

  const seasonLabel = range.start
    ? t(`booking.season_${getSeason(range.start)}` as const)
    : null;

  const perNightRate = range.start ? getPriceForDate(range.start) : 0;

  const mileagePlan = MILEAGE_PLANS.find((e) => selectedExtras.has(e.id))?.id ?? null;
  const setMileage = (id: ExtraId | null) => {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      for (const e of MILEAGE_PLANS) next.delete(e.id);
      if (id) next.add(id);
      return next;
    });
  };

  const toggleExtra = (id: ExtraId) => {
    const extra = EXTRAS.find((e) => e.id === id);
    if (extra?.mandatory) return;
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Clicking the active option clears it, so neither mileage option is required.
        next.delete(id);
      } else {
        next.add(id);
        // Radio-style: selecting one member of an exclusive group drops the others,
        // otherwise the customer would be charged for both mileage plans.
        for (const group of EXCLUSIVE_EXTRA_GROUPS) {
          if (!group.includes(id)) continue;
          for (const other of group) if (other !== id) next.delete(other);
        }
      }
      return next;
    });
  };

  const dateLocale = i18n.language;
  const fmtDate = (d: Date) => d.toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" });

  const canSubmit = range.start && range.end && meetsMin;
  // Paying needs the rental conditions ticked; the WhatsApp link does not.
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const canPay = Boolean(canSubmit && acceptedTerms);

  const [showForm, setShowForm] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleGuestSubmit = async (guest: GuestData) => {
    if (!range.start || !range.end) return;
    if (!acceptedTerms) {
      setCheckoutError(t("booking.terms_required"));
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: format(range.start, "yyyy-MM-dd"),
          endDate: format(range.end, "yyyy-MM-dd"),
          pickupTime,
          returnTime,
          nights,
          extraIds: EXTRAS.filter((e) => selectedExtras.has(e.id)).map((e) => e.id),
          totalWithIva: finalTotalWithIva,
          guest,
          prepaymentOption,
          promoCode: appliedPromoCode,
          acceptedTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment error");
      track("add_payment_info", { currency: "EUR", value: finalTotalWithIva });
      window.location.href = data.url;
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Unknown error");
      setCheckoutLoading(false);
    }
  };

  return (
    <section id="booking" className="relative scroll-mt-16 py-24 sm:py-32 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t("booking.title")}
          subtitle={t("booking.subtitle")}
          eyebrow={t("booking.eyebrow")}
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          {/* Calendar + pickup/return time */}
          <div className="rounded-2xl border border-border/60 bg-surface p-5 sm:p-7 lg:p-5">
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
                disabled={
                  !isBefore(
                    startOfMonth(addMonths(monthBase, 1)),
                    startOfMonth(BOOKING_MAX_DATE),
                  )
                }
                className="grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {months.map((m) => (
                <div key={m.toISOString()}>
                  <MonthGrid
                    month={m}
                    today={today}
                    booked={booked}
                    range={range}
                    onPick={handleClick}
                    tooSoon={tooSoon}
                    pickingStart={!range.start || !!range.end}
                    locale={dateLocale}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TimeSelect
                id="pickup-time"
                label={t("booking.pickup_time")}
                value={pickupTime}
                onChange={setPickupTime}
              />
              <TimeSelect
                id="return-time"
                label={t("booking.return_time")}
                value={returnTime}
                onChange={setReturnTime}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("booking.min_notice", { hours: MIN_NOTICE_HOURS })}</p>
          </div>


          {/* Summary: last on phones so the extras come before the pay button */}
          <div className="order-last rounded-2xl border border-border/60 bg-surface p-5 sm:p-7 lg:order-none lg:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary/80">
                <Sparkles className="h-3.5 w-3.5" />
                {t("booking.summary")}
              </div>
              {seasonLabel && <span className="text-xs text-primary/80">{seasonLabel}</span>}
            </div>

            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="font-display text-base text-foreground">
                {range.start ? `${fmtDate(range.start)} ${pickupTime}` : "—"}
                <span className="mx-2 text-muted-foreground">→</span>
                {range.end ? `${fmtDate(range.end)} ${returnTime}` : "—"}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("booking.nights")}: <span className="font-mono-num text-foreground">{nights}</span>
              </span>
            </div>
            {range.start && !meetsMin && (
              <p className="mt-2 text-xs text-coral">{t("booking.minNights", { n: minNights })}</p>
            )}

            {/* Prepayment option */}
            <div className="mt-4">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("booking.prepayment_title")}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPrepaymentOption("deposit")}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    prepaymentOption === "deposit"
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${prepaymentOption === "deposit" ? "border-primary bg-primary" : "border-border"}`}>
                      {prepaymentOption === "deposit" && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                    </span>
                    {t("booking.prepayment_deposit")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrepaymentOption("full")}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    prepaymentOption === "full"
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${prepaymentOption === "full" ? "border-primary bg-primary" : "border-border"}`}>
                      {prepaymentOption === "full" && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                    </span>
                    {t("booking.prepayment_full")}
                  </span>
                </button>
              </div>
            </div>

            {/* Promo code */}
            <div className="mt-4">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("booking.promo_label")}</div>
              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value);
                    setPromoStatus("idle");
                  }}
                  placeholder={t("booking.promo_placeholder")}
                  className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="shrink-0 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition"
                >
                  {t("booking.promo_apply")}
                </button>
              </div>
              {promoStatus === "valid" && appliedPromoCode && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-500">
                  <Tag className="h-3 w-3" />
                  {t("booking.promo_success", { pct: promoPctAt(appliedPromoCode) })}
                </p>
              )}
              {promoStatus === "invalid" && (
                <p className="mt-1.5 text-xs text-rose-500">{t("booking.promo_invalid")}</p>
              )}
            </div>

            {/* Price breakdown */}
            <div className="mt-4 space-y-1 text-sm">
              {price && (
                <>
                  <Row
                    label={t("booking.price_breakdown", { price: perNightRate, count: nights })}
                    value={`${price.nightsSubtotal} €`}
                  />
                  {price.surcharge > 0 && (
                    <Row
                      label={t("booking.late_return_surcharge", {
                        hours: price.excessHours.toLocaleString(dateLocale, { maximumFractionDigits: 1 }),
                      })}
                      value={`${price.surcharge} €`}
                    />
                  )}
                  {price.discountPct > 0 && (
                    <Row label={t("booking.discount", { pct: price.discountPct })} value={`-${price.discountAmount} €`} accent />
                  )}
                  <Row label={t("booking.extras")} value={`${extrasTotal} €`} />
                  <Row label={t("booking.cleaning")} value={`${mandatoryTotal} €`} />
                  {promoDiscountAmount > 0 && (
                    <Row
                      label={t("booking.promo_discount_row", { code: appliedPromoCode })}
                      value={`-${promoDiscountAmount} €`}
                      accent
                    />
                  )}
                  {prepaymentDiscountAmount > 0 && (
                    <Row label={t("booking.prepayment_discount")} value={`-${prepaymentDiscountAmount} €`} accent />
                  )}
                </>
              )}
              {!price && (
                <Row label={t("booking.cleaning")} value={`${mandatoryTotal} €`} />
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={finalTotal}
                initial={{ scale: 0.98, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-4 border-t border-border/60 pt-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-sm text-muted-foreground">{t("booking.total")}</span>
                  <span className="flex flex-wrap items-baseline justify-end gap-x-3">
                    <span className="font-mono-num text-sm text-muted-foreground/70">
                      {finalTotal} € {t("booking.iva")}
                    </span>
                    <span className="font-mono-num text-3xl font-bold text-primary drop-shadow-[0_0_14px_rgba(251,191,36,0.35)]">
                      {finalTotalWithIva} €
                    </span>
                    <span className="text-xs text-primary/80">{t("booking.total_with_iva")}</span>
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Deposit note */}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {prepaymentOption === "full" ? t("booking.full_payment_note") : t("booking.deposit_note")}
            </p>

            {/* Rental conditions (required) with the pay button beside them */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label
                htmlFor="accept-terms"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-sm text-foreground"
              >
                <input
                  id="accept-terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked) setCheckoutError(null);
                  }}
                  aria-required="true"
                  className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                />
                <span>
                  <Trans
                    i18nKey="booking.terms_accept"
                    components={{
                      terms: (
                        <Link
                          to="/condiciones"
                          target="_blank"
                          rel="noopener"
                          className="underline underline-offset-2 hover:text-primary"
                        />
                      ),
                    }}
                  />
                </span>
              </label>

              {/* Primary CTA: Pay deposit */}
              {!showForm && (
                <button
                  disabled={!canPay}
                  onClick={() => {
                    track("begin_checkout", { currency: "EUR", value: finalTotalWithIva, nights, option: prepaymentOption });
                    setShowForm(true);
                  }}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    canPay
                      ? "bg-primary text-primary-foreground glow-amber hover:brightness-110"
                      : "bg-border/60 text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  {prepaymentOption === "full" ? t("booking.cta_full_payment") : t("booking.cta_deposit")}
                </button>
              )}
            </div>

            {/* Guest form (shown after "Pay deposit" click) */}
            {showForm && canSubmit && (
              <>
                <GuestForm onSubmit={handleGuestSubmit} isLoading={checkoutLoading} />
                {checkoutError && (
                  <p className="mt-2 text-center text-xs text-rose-500">{checkoutError}</p>
                )}
              </>
            )}

          </div>

          {/* Options: full width under the calendar and the summary */}
          <div className="rounded-2xl border border-border/60 bg-surface p-5 sm:p-7 lg:col-span-2 lg:p-5">
            {/* Extras */}
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("extras.title")}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {EXTRAS.filter((e) => !e.mandatory && !isMileage(e.id)).map((e) => (
                  <OptionRow
                    key={e.id}
                    active={selectedExtras.has(e.id)}
                    onClick={() => toggleExtra(e.id)}
                    label={t(`extras.${e.id}`)}
                    price={e.price > 0 ? `${e.price} €` : null}
                    unit={e.perNight ? t("extras.perNight") : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Mileage: one plan at a time, 100 km/night is the default */}
            <div className="mt-4">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("extras.mileage")}</div>
              <div className="grid gap-2 sm:grid-cols-3">
                <OptionRow
                  radio
                  active={!mileagePlan}
                  onClick={() => setMileage(null)}
                  label={t("extras.km_100")}
                  price={t("extras.included")}
                />
                {MILEAGE_PLANS.map((e) => (
                  <OptionRow
                    key={e.id}
                    radio
                    active={mileagePlan === e.id}
                    onClick={() => setMileage(e.id)}
                    label={t(`extras.${e.id}`)}
                    price={`+${e.price} €`}
                    unit={t("extras.perNight")}
                  />
                ))}
              </div>
            </div>

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

// The mileage plans are an exclusive group with a free default (100 km/night),
// so they are rendered as radios in their own block rather than as checkboxes.
const MILEAGE_PLANS = EXTRAS.filter((e) => EXCLUSIVE_EXTRA_GROUPS.some((g) => g.includes(e.id)));
const isMileage = (id: ExtraId) => MILEAGE_PLANS.some((e) => e.id === id);

function OptionRow({
  active, onClick, label, price, unit, radio,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  price: string | null;
  unit?: string;
  radio?: boolean;
}) {
  return (
    <button
      type="button"
      role={radio ? "radio" : "checkbox"}
      aria-checked={active}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm leading-snug transition ${
        active
          ? "border-primary/60 bg-primary/10 text-foreground"
          : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center border text-[10px] ${radio ? "rounded-full" : "rounded"} ${
          active ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {active && (radio ? <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" /> : "✓")}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      {price && (
        <span className="shrink-0 whitespace-nowrap font-mono-num text-xs text-foreground">
          {price}
          {unit && <span className="text-muted-foreground">{unit}</span>}
        </span>
      )}
    </button>
  );
}

function TimeSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="rounded-lg border border-border/50 bg-background/40 px-3 py-2">
      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full bg-transparent font-display text-base text-foreground focus:outline-none"
      >
        {TIME_OPTIONS.map((time) => (
          <option key={time} value={time} className="bg-surface text-foreground">
            {time}
          </option>
        ))}
      </select>
    </label>
  );
}

function Row({ label, value, accent, iva }: { label: string; value: string; accent?: boolean; iva?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono-num ${accent ? "text-coral" : "text-foreground"}`}>
        {value}
        {iva && <span className="ml-1 text-xs text-muted-foreground">{iva}</span>}
      </span>
    </div>
  );
}

function MonthGrid({
  month, today, booked, range, onPick, locale, tooSoon, pickingStart,
}: {
  month: Date;
  today: Date;
  booked: Set<string>;
  range: Range;
  onPick: (d: Date) => void;
  locale: string;
  tooSoon: (d: Date) => boolean;
  pickingStart: boolean;
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
          const beyondMax = isAfter(d, BOOKING_MAX_DATE);
          const iso = isoDay(d);
          const isBooked = booked.has(iso);
          const isStart = range.start && isSameDay(d, range.start);
          const isEnd = range.end && isSameDay(d, range.end);
          const within = inRange(d);
          const soon = !past && (pickingStart || (!!range.start && isBefore(d, range.start))) && tooSoon(d);
          const disabled = past || soon || beyondMax || isBooked;

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
