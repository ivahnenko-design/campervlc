import { useMemo, useState } from "react";
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
import { ChevronLeft, ChevronRight, CreditCard, MessageCircle, Sparkles, Tag } from "lucide-react";
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
import { buildWhatsAppLink, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/constants";
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


  return useMemo(() => {
    const set = new Set<string>(local);
    for (const d of data?.dates ?? []) set.add(d);
    return set;
  }, [local, data]);
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

  const waMessage = t("booking.wa_message", {
    start: range.start ? `${fmtDate(range.start)} ${pickupTime}` : "—",
    end: range.end ? `${fmtDate(range.end)} ${returnTime}` : "—",
    nights,
    extras: selectedExtras.size
      ? EXTRAS.filter((e) => selectedExtras.has(e.id)).map((e) => t(`extras.${e.id}`)).join(", ")
      : t("booking.none"),
    total: finalTotal,
  });

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
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("booking.nights")}: <span className="font-mono-num text-foreground">{nights}</span></span>
              {seasonLabel && <span className="text-primary/80">{seasonLabel}</span>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("booking.km_included")}</p>
            {range.start && !meetsMin && (
              <p className="mt-2 text-xs text-coral">{t("booking.minNights", { n: minNights })}</p>
            )}

            {/* Extras */}
            <div className="mt-4">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("extras.title")}</div>
              <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
                {EXTRAS.filter((e) => !e.mandatory).map((e) => {
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
                        <span
                          className={`grid h-4 w-4 place-items-center border ${
                            EXCLUSIVE_EXTRA_GROUPS.some((g) => g.includes(e.id)) ? "rounded-full" : "rounded"
                          } ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                        >
                          {active ? "✓" : ""}
                        </span>
                        {t(`extras.${e.id}`)}
                      </span>
                      <span className="font-mono-num text-xs text-foreground">
                        {e.price} €
                        <span className="ml-0.5 text-muted-foreground">
                          {e.perNight ? t("extras.perNight") : t("extras.perBooking")}
                        </span>
                      </span>
                    </button>
                  );
                })}
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

            {/* Prepayment option */}
            <div className="mt-4">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("booking.prepayment_title")}</div>
              <div className="grid grid-cols-2 gap-2">
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

            {/* Price breakdown */}
            <div className="mt-6 space-y-1.5 text-sm">
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
                  <Row label={t("booking.subtotal")} value={`${price.subtotal} €`} iva={t("booking.iva")} />
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
                className="mt-5 border-t border-border/60 pt-4"
              >
                <div className="flex items-end justify-between">
                  <span className="text-sm text-muted-foreground">{t("booking.total")}</span>
                  <div className="text-right">
                    <span className="font-mono-num text-3xl font-bold text-primary">
                      {finalTotal} €
                    </span>
                    <span className="ml-1.5 text-xs text-muted-foreground">{t("booking.iva")}</span>
                  </div>
                </div>
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {finalTotalWithIva} € {t("booking.total_with_iva")}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Deposit note */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {prepaymentOption === "full" ? t("booking.full_payment_note") : t("booking.deposit_note")}
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              <Link to="/condiciones" hash="cancelacion" className="underline hover:text-foreground transition">
                {t("booking.see_cancellation_policy")}
              </Link>
            </p>

            {/* Rental conditions: required before any payment */}
            <label
              htmlFor="accept-terms"
              className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm text-foreground"
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
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
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

            {/* Guest form (shown after "Pay deposit" click) */}
            {showForm && canSubmit && (
              <>
                <GuestForm onSubmit={handleGuestSubmit} isLoading={checkoutLoading} />
                {checkoutError && (
                  <p className="mt-2 text-center text-xs text-rose-500">{checkoutError}</p>
                )}
              </>
            )}

            {/* Primary CTA: Pay deposit */}
            {!showForm && (
              <button
                disabled={!canPay}
                onClick={() => setShowForm(true)}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition ${
                  canPay
                    ? "bg-primary text-primary-foreground glow-amber hover:brightness-110"
                    : "bg-border/60 text-muted-foreground cursor-not-allowed"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                {prepaymentOption === "full" ? t("booking.cta_full_payment") : t("booking.cta_deposit")}
              </button>
            )}

            {/* Secondary: WhatsApp */}
            <a
              href={canSubmit ? buildWhatsAppLink(waMessage) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!canSubmit}
              onClick={(e) => { if (!canSubmit) e.preventDefault(); }}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                canSubmit
                  ? "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                  : "border-border/30 text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              {t("booking.cta_whatsapp")}
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t("booking.alt_contact", { handle: "" })}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition"
              >
                {INSTAGRAM_HANDLE}
              </a>
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
          const beyondMax = isAfter(d, BOOKING_MAX_DATE);
          const iso = isoDay(d);
          const isBooked = booked.has(iso);
          const isStart = range.start && isSameDay(d, range.start);
          const isEnd = range.end && isSameDay(d, range.end);
          const within = inRange(d);
          const disabled = past || beyondMax || isBooked;

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
