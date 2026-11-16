import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Field, inputCls } from "@/components/GuestForm";

export const Route = createFileRoute("/cancel-booking")({
  head: () => ({
    meta: [
      { title: "Cancel Booking | Camper Retreat VLC" },
      { name: "description", content: "Look up and cancel your camper van booking in Valencia." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { ref?: string } => ({
    ref: typeof search.ref === "string" && search.ref ? search.ref : undefined,
  }),
  component: CancelBookingPage,
});

const lookupSchema = z.object({
  bookingRef: z.string().trim().min(1),
  email: z.string().trim().email(),
});

type LookupData = z.infer<typeof lookupSchema>;

interface Quote {
  bookingRef: string;
  guestFirstName: string;
  startDate: string;
  endDate: string;
  nights: number;
  totalWithIva: number;
  amountPaid: number;
  freeCancellation: boolean;
  retentionPct: number;
  retainedAmount: number;
  refundAmount: number;
  unpaidRetention: number;
  token: string;
}

// lookup: reference + email -> a code is emailed to the booking's address
// code:   the guest types it -> what cancelling costs + a cancel token
type Stage = "lookup" | "code" | "quote" | "done";

async function post(body: Record<string, unknown>) {
  const res = await fetch("/api/cancel-booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const ERROR_KEYS: Record<string, string> = {
  not_found: "cancelBooking.error_not_found",
  already_cancelled: "cancelBooking.error_already_cancelled",
  refund_failed: "cancelBooking.error_refund_failed",
  no_payment_intent: "cancelBooking.error_refund_failed",
  code_wrong: "cancelBooking.error_code_wrong",
  code_expired: "cancelBooking.error_code_expired",
  too_many_attempts: "cancelBooking.error_too_many",
  too_many_requests: "cancelBooking.error_too_many",
  session_expired: "cancelBooking.error_code_expired",
};
const errorKey = (code: string | null) => (code ? ERROR_KEYS[code] || "cancelBooking.error_generic" : null);

function CancelBookingPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const [stage, setStage] = useState<Stage>("lookup");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [identity, setIdentity] = useState<LookupData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LookupData>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { bookingRef: search.ref ?? "" },
  });

  const onRequest = async (data: LookupData) => {
    setError(null);
    try {
      const r = await post({ action: "request", bookingRef: data.bookingRef, email: data.email });
      if (!r.ok) return setError(r.data.error || "generic");
      setIdentity(data);
      setCode("");
      setStage("code");
    } catch {
      setError("generic");
    }
  };

  const onCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) return;
    setBusy(true);
    setError(null);
    try {
      const r = await post({ action: "lookup", ...identity, code });
      if (!r.ok) {
        setError(r.data.error || "generic");
        return;
      }
      setQuote(r.data as Quote);
      setStage("quote");
    } catch {
      setError("generic");
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (!identity) return;
    setBusy(true);
    setError(null);
    try {
      const r = await post({ action: "request", ...identity });
      if (!r.ok) setError(r.data.error || "generic");
    } catch {
      setError("generic");
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (!quote) return;
    setBusy(true);
    setError(null);
    try {
      const r = await post({ action: "confirm", token: quote.token });
      if (!r.ok) {
        setError(r.data.error || "generic");
        setBusy(false);
        return;
      }
      const body = r.data;
      setQuote((q) =>
        q
          ? {
              ...q,
              freeCancellation: body.freeCancellation,
              retentionPct: body.retentionPct,
              retainedAmount: body.retainedAmount,
              refundAmount: body.refundAmount,
              unpaidRetention: body.unpaidRetention,
            }
          : q,
      );
      setStage("done");
    } catch {
      setError("generic");
      setBusy(false);
    }
  };

  const errKey = errorKey(error);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-md px-4 sm:px-6 py-24 sm:py-32">
        <h1 className="font-display text-3xl sm:text-4xl mb-3">{t("cancelBooking.title")}</h1>

        {stage === "lookup" && (
          <>
            <p className="text-muted-foreground mb-8 text-sm">{t("cancelBooking.intro")}</p>
            <form onSubmit={handleSubmit(onRequest)} className="space-y-3">
              <Field label={t("cancelBooking.form_ref")} error={errors.bookingRef ? t("booking.form_required") : undefined}>
                <input
                  {...register("bookingRef")}
                  placeholder={t("cancelBooking.form_ref_placeholder")}
                  className={inputCls(!!errors.bookingRef)}
                />
              </Field>
              <Field label={t("cancelBooking.form_email")} error={errors.email ? t("booking.form_required") : undefined}>
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputCls(!!errors.email)}
                />
              </Field>

              {errKey && <p className="text-sm text-rose-500">{t(errKey)}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("cancelBooking.form_submit")}
              </button>
            </form>
          </>
        )}

        {stage === "code" && identity && (
          <form onSubmit={onCode} className="space-y-4">
            <p className="text-muted-foreground text-sm">{t("cancelBooking.code_sent", { email: identity.email })}</p>
            <Field label={t("cancelBooking.code_label")}>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className={inputCls(false) + " tracking-[0.4em] text-center text-lg"}
              />
            </Field>
            {errKey && <p className="text-sm text-rose-500">{t(errKey)}</p>}
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("cancelBooking.code_submit")}
            </button>
            <div className="flex justify-between text-xs text-muted-foreground">
              <button type="button" onClick={() => { setStage("lookup"); setError(null); }} className="underline hover:text-foreground">
                {t("cancelBooking.quote_back")}
              </button>
              <button type="button" onClick={onResend} disabled={busy} className="underline hover:text-foreground disabled:opacity-60">
                {t("cancelBooking.code_resend")}
              </button>
            </div>
          </form>
        )}

        {stage === "quote" && quote && (
          <div className="rounded-2xl border border-border/60 bg-surface p-6">
            <h2 className="font-display text-lg mb-4">{t("cancelBooking.quote_title")}</h2>
            <div className="text-sm text-muted-foreground space-y-1 mb-4">
              <p>{quote.bookingRef}</p>
              <p>{quote.startDate} → {quote.endDate} · {quote.nights} {t("booking.nights").toLowerCase()}</p>
            </div>
            <p className="text-sm text-foreground mb-2">
              {quote.freeCancellation
                ? t("cancelBooking.quote_free", { amount: quote.refundAmount })
                : quote.refundAmount > 0
                  ? t("cancelBooking.quote_refund", {
                      pct: quote.retentionPct,
                      retained: quote.retainedAmount,
                      amount: quote.refundAmount,
                    })
                  : t("cancelBooking.quote_refund_zero", {
                      pct: quote.retentionPct,
                      retained: quote.retainedAmount,
                    })}
            </p>
            <p className="mb-6 text-xs text-muted-foreground">
              <Link to="/condiciones" hash="cancelacion" className="underline hover:text-foreground transition">
                {t("cancelBooking.quote_policy_link")}
              </Link>
            </p>

            {errKey && <p className="text-sm text-rose-500 mb-3">{t(errKey)}</p>}

            <button
              onClick={onConfirm}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? t("cancelBooking.quote_processing") : t("cancelBooking.quote_confirm")}
            </button>
            <button
              onClick={() => { setStage("lookup"); setError(null); }}
              disabled={busy}
              className="mt-3 flex w-full items-center justify-center rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              {t("cancelBooking.quote_back")}
            </button>
          </div>
        )}

        {stage === "done" && quote && (
          <div className="text-center space-y-6 py-8">
            <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
            <h2 className="font-display text-2xl">{t("cancelBooking.done_title")}</h2>
            <p className="text-muted-foreground text-sm">{t("cancelBooking.done_body")}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              ← {t("cancelBooking.back_home")}
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
