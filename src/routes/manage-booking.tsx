import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Field, inputCls } from "@/components/GuestForm";
import { EXCLUSIVE_EXTRA_GROUPS, EXTRAS, TIME_OPTIONS } from "@/utils/pricing";

export const Route = createFileRoute("/manage-booking")({
  validateSearch: (s: Record<string, unknown>): { ref?: string; change?: string } => ({
    ref: typeof s.ref === "string" ? s.ref : undefined,
    change: typeof s.change === "string" ? s.change : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Manage booking | Camper Retreat VLC" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManageBookingPage,
});

interface BookingView {
  bookingRef: string;
  status: string;
  guestFirstName: string;
  adults: number;
  children: number;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  nights: number;
  extraIds: string[];
  totalWithIva: number;
  amountPaid: number;
  balanceDue: number;
  prepaymentOption: "full" | "deposit";
  canSelfServe: boolean;
  pendingPayment: boolean;
  rules: { whatsapp: string };
}

interface Plan {
  before: { startDate: string; endDate: string; pickupTime: string; returnTime: string; nights: number; extraIds: string[]; totalWithIva: number; amountPaid: number; balanceDue: number };
  after: { startDate: string; endDate: string; pickupTime: string; returnTime: string; nights: number; extraIds: string[] };
  addedExtraIds: string[];
  removedExtraIds: string[];
  retention: number;
  retentionPct: number;
  removedNights: number;
  newTotal: number;
  settlement: { type: "refund" | "charge" | "balance" | "none"; amount: number };
  newBalanceDue: number;
}

interface ApiError {
  code: string;
  n?: number;
  dates?: string[];
  whatsapp?: string;
}

interface Form {
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  extraIds: string[];
}

const OPTIONAL_EXTRAS = EXTRAS.filter((e) => !e.mandatory);

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // The Vercel Firewall answers a rate-limited caller with a plain-text 429.
  const json = res.status === 429 ? {} : await res.json().catch(() => ({}));
  return { status: res.status, json } as { status: number; json: any };
}

function ManageBookingPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();

  const [ref, setRef] = useState(search.ref ?? "");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [changeId, setChangeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [done, setDone] = useState(false);

  const returnBanner =
    search.change === "paid" ? t("manage.paid_return") : search.change === "cancelled" ? t("manage.cancelled_return") : null;

  const errorText = (e: ApiError): string => {
    switch (e.code) {
      case "min_nights": return t("manage.e_min_nights", { n: e.n });
      case "unavailable": return t("manage.e_unavailable", { dates: (e.dates ?? []).join(", ") });
      case "beyond_max_date": return t("manage.e_beyond");
      case "extra_removal_window": return t("manage.e_extra_window");
      case "too_soon": return t("manage.e_too_soon");
      case "invalid_dates":
      case "invalid_time": return t("manage.e_invalid");
      case "no_changes": return t("manage.e_no_changes");
      case "pending_payment": return t("manage.pending");
      case "cancelled": return t("manage.cancelled");
      case "cutoff_passed": return t("manage.closed", { phone: e.whatsapp ?? "+34 624 038 085" });
      default: return t("manage.generic");
    }
  };

  const failure = (status: number, json: any) => {
    if (status === 429) return setMessage({ kind: "error", text: t("manage.too_many") });
    if (status === 401) {
      setToken(null);
      setBooking(null);
      return setMessage({ kind: "error", text: t("manage.session_expired") });
    }
    if (status === 503 && json.code === "availability_unavailable") return setMessage({ kind: "error", text: t("manage.e_availability") });
    if (status === 409 && json.code === "conflict") return setMessage({ kind: "error", text: t("manage.conflict") });
    if (status === 422 && Array.isArray(json.errors)) return setMessage({ kind: "error", text: json.errors.map(errorText).join(" ") });
    setMessage({ kind: "error", text: t("manage.generic") });
  };

  const toForm = (b: BookingView): Form => ({
    startDate: b.startDate,
    endDate: b.endDate,
    pickupTime: b.pickupTime,
    returnTime: b.returnTime,
    extraIds: b.extraIds.filter((id) => OPTIONAL_EXTRAS.some((e) => e.id === id)),
  });

  const onLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { status, json } = await post("/api/manage-booking", { bookingRef: ref, email }).catch(() => ({ status: 0, json: {} }));
    setBusy(false);
    if (status === 200 && json.token && json.booking) {
      setToken(json.token);
      setBooking(json.booking);
      setForm(toForm(json.booking));
    } else if (status === 404) {
      setMessage({ kind: "error", text: t("manage.not_found") });
    } else failure(status, json);
  };

  const toggleExtra = (id: string) => {
    if (!form) return;
    const next = new Set(form.extraIds);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      for (const group of EXCLUSIVE_EXTRA_GROUPS) {
        if (!group.includes(id as never)) continue;
        for (const other of group) if (other !== id) next.delete(other);
      }
    }
    setForm({ ...form, extraIds: [...next] });
    setPlan(null);
  };

  const review = async () => {
    if (!token || !form) return;
    setBusy(true);
    setMessage(null);
    setPlan(null);
    const { status, json } = await post("/api/manage-booking-change", { token, action: "preview", change: form }).catch(() => ({ status: 0, json: {} }));
    setBusy(false);
    if (status === 200 && json.plan) {
      setPlan(json.plan);
      setChangeId(crypto.randomUUID());
    } else failure(status, json);
  };

  const apply = async () => {
    if (!token || !form || !plan) return;
    setBusy(true);
    setMessage(null);
    const { status, json } = await post("/api/manage-booking-change", {
      token,
      action: "apply",
      changeId,
      change: form,
      expectedNewTotal: plan.newTotal,
      confirm: true,
    }).catch(() => ({ status: 0, json: {} }));
    if (status === 200 && json.result === "checkout" && json.url) {
      setMessage({ kind: "ok", text: t("manage.redirecting") });
      window.location.href = json.url;
      return;
    }
    setBusy(false);
    if (status === 200 && json.result === "applied") {
      setBooking(json.booking);
      setForm(toForm(json.booking));
      setPlan(null);
      setDone(true);
      setMessage({ kind: "ok", text: t("manage.applied") });
    } else if (status === 409 && json.code === "amount_changed") {
      setPlan(json.plan);
      setMessage({ kind: "error", text: t("manage.amount_changed") });
    } else failure(status, json);
  };

  const extraName = (id: string) => t(`extras.${id}`);
  const list = (ids: string[]) => {
    const names = ids.filter((id) => id !== "cleaning_fee").map(extraName);
    return names.length ? names.join(", ") : t("manage.none");
  };
  const range = (b: { startDate: string; endDate: string; pickupTime: string; returnTime: string }) =>
    `${b.startDate} ${b.pickupTime} → ${b.endDate} ${b.returnTime}`;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-24 sm:px-6 sm:py-32">
        <h1 className="mb-3 font-display text-3xl sm:text-4xl">{t("manage.title")}</h1>

        {returnBanner && (
          <p className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">{returnBanner}</p>
        )}
        {message && (
          <p
            role="alert"
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              message.kind === "error" ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {message.text}
          </p>
        )}

        {!booking && (
          <form onSubmit={onLookup} className="space-y-3">
            <p className="mb-6 text-sm text-muted-foreground">{t("manage.intro")}</p>
            <Field label={t("manage.ref")}>
              <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="CVLC-XXXX" autoComplete="off" required className={inputCls(false)} />
            </Field>
            <Field label={t("manage.email")}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className={inputCls(false)} />
            </Field>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 disabled:opacity-60 transition"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("manage.find")}
            </button>
            <p className="pt-2 text-center text-xs text-muted-foreground">
              <Link to="/cancel-booking" className="underline hover:text-foreground">{t("manage.cancel_link")}</Link>
            </p>
          </form>
        )}

        {booking && form && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border/60 bg-surface p-5">
              <h2 className="mb-3 font-display text-lg">{t("manage.your_booking")} · {booking.bookingRef}</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">{t("manage.dates")}</dt><dd>{range(booking)}</dd>
                <dt className="text-muted-foreground">{t("manage.nights_label")}</dt><dd>{booking.nights}</dd>
                <dt className="text-muted-foreground">{t("manage.guests")}</dt><dd>{booking.adults} + {booking.children}</dd>
                <dt className="text-muted-foreground">{t("manage.extras")}</dt><dd>{list(booking.extraIds)}</dd>
                <dt className="text-muted-foreground">{t("manage.total")}</dt><dd className="font-mono-num">{booking.totalWithIva} €</dd>
                <dt className="text-muted-foreground">{t("manage.paid")}</dt>
                <dd className="font-mono-num">{booking.amountPaid} € · {booking.prepaymentOption === "full" ? t("manage.payment_full") : t("manage.payment_deposit")}</dd>
                <dt className="text-muted-foreground">{t("manage.balance")}</dt><dd className="font-mono-num">{booking.balanceDue} €</dd>
              </dl>
            </section>

            {booking.status === "cancelled" && <p className="text-sm text-rose-400">{t("manage.cancelled")}</p>}
            {booking.status !== "cancelled" && !booking.canSelfServe && (
              <p className="rounded-lg border border-border/60 bg-surface px-4 py-3 text-sm">
                {t("manage.closed", { phone: booking.rules.whatsapp })}
              </p>
            )}
            {booking.pendingPayment && <p className="text-sm text-muted-foreground">{t("manage.pending")}</p>}

            {booking.canSelfServe && !booking.pendingPayment && !done && (
              <section className="space-y-4 rounded-2xl border border-border/60 bg-surface p-5">
                <h2 className="font-display text-lg">{t("manage.change_title")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("manage.start")}>
                    <input type="date" value={form.startDate} onChange={(e) => { setForm({ ...form, startDate: e.target.value }); setPlan(null); }} className={inputCls(false)} />
                  </Field>
                  <Field label={t("manage.end")}>
                    <input type="date" value={form.endDate} onChange={(e) => { setForm({ ...form, endDate: e.target.value }); setPlan(null); }} className={inputCls(false)} />
                  </Field>
                  <Field label={t("manage.pickup_time")}>
                    <select value={form.pickupTime} onChange={(e) => { setForm({ ...form, pickupTime: e.target.value }); setPlan(null); }} className={inputCls(false)}>
                      {TIME_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </Field>
                  <Field label={t("manage.return_time")}>
                    <select value={form.returnTime} onChange={(e) => { setForm({ ...form, returnTime: e.target.value }); setPlan(null); }} className={inputCls(false)}>
                      {TIME_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </Field>
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-medium">{t("manage.extras_title")}</h3>
                  <p className="mb-2 text-xs text-muted-foreground">{t("manage.extras_note")}</p>
                  <div className="space-y-1.5">
                    {OPTIONAL_EXTRAS.map((e) => {
                      const active = form.extraIds.includes(e.id);
                      return (
                        <label key={e.id} className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${active ? "border-primary/60 bg-primary/10" : "border-border/40 bg-background/40 text-muted-foreground"}`}>
                          <span className="flex items-center gap-2">
                            <input type="checkbox" checked={active} onChange={() => toggleExtra(e.id)} className="h-4 w-4 accent-primary" />
                            {extraName(e.id)}
                          </span>
                          <span className="font-mono-num text-xs">{e.price} €{e.perNight ? ` ${t("extras.perNight")}` : ""}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={review}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/60 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-60 transition"
                >
                  {busy && !plan ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy && !plan ? t("manage.reviewing") : t("manage.review")}
                </button>
              </section>
            )}

            {plan && (
              <section className="space-y-4 rounded-2xl border border-primary/40 bg-surface p-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">{t("manage.before")}</p>
                    <p>{range(plan.before)}</p>
                    <p className="text-muted-foreground">{t("manage.nights_label")}: {plan.before.nights}</p>
                    <p className="text-muted-foreground">{list(plan.before.extraIds)}</p>
                    <p className="font-mono-num">{plan.before.totalWithIva} €</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-widest text-primary">{t("manage.after")}</p>
                    <p>{range(plan.after)}</p>
                    <p className="text-muted-foreground">{t("manage.nights_label")}: {plan.after.nights}</p>
                    <p className="text-muted-foreground">{list(plan.after.extraIds)}</p>
                    <p className="font-mono-num font-semibold">{plan.newTotal} €</p>
                  </div>
                </div>
                {plan.retention > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("manage.retention", { pct: plan.retentionPct })}: <span className="font-mono-num text-foreground">{plan.retention} €</span>
                  </p>
                )}
                <p className="text-sm font-medium">
                  {plan.settlement.type === "refund" && t("manage.settle_refund", { amount: plan.settlement.amount })}
                  {plan.settlement.type === "charge" && t("manage.settle_charge", { amount: plan.settlement.amount })}
                  {plan.settlement.type === "balance" && t("manage.settle_balance", { amount: plan.newBalanceDue })}
                  {plan.settlement.type === "none" && t("manage.settle_none")}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={apply}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 disabled:opacity-60 transition"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {plan.settlement.type === "charge" ? t("manage.confirm_pay", { amount: plan.settlement.amount }) : t("manage.confirm")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlan(null)}
                    disabled={busy}
                    className="rounded-full border border-border/60 px-5 py-3 text-sm text-muted-foreground hover:text-foreground transition"
                  >
                    {t("manage.back")}
                  </button>
                </div>
              </section>
            )}

            {done && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                {t("manage.applied")}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
