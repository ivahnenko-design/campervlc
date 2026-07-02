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
  component: CancelBookingPage,
});

const lookupSchema = z
  .object({
    bookingRef: z.string().trim().optional(),
    email: z.string().trim().optional(),
    lastName: z.string().trim().min(1),
  })
  .refine((d) => !!d.bookingRef || !!d.email, {
    message: "form_required",
    path: ["bookingRef"],
  });

type LookupData = z.infer<typeof lookupSchema>;

interface Quote {
  bookingRef: string;
  guestFirstName: string;
  startDate: string;
  endDate: string;
  nights: number;
  depositAmount: number;
  refundPct: number;
  refundAmount: number;
}

type Stage = "lookup" | "quote" | "done";

function CancelBookingPage() {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>("lookup");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [identity, setIdentity] = useState<{ bookingRef?: string; email?: string; lastName: string } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LookupData>({
    resolver: zodResolver(lookupSchema),
  });

  const onLookup = async (data: LookupData) => {
    setLookupError(null);
    try {
      const res = await fetch("/api/cancel-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lookup",
          bookingRef: data.bookingRef || undefined,
          email: data.email || undefined,
          lastName: data.lastName,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setLookupError(body.error || "not_found");
        return;
      }
      setQuote(body);
      setIdentity({
        bookingRef: data.bookingRef || undefined,
        email: data.email || undefined,
        lastName: data.lastName,
      });
      setStage("quote");
    } catch {
      setLookupError("generic");
    }
  };

  const onConfirm = async () => {
    if (!identity) return;
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      const res = await fetch("/api/cancel-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", ...identity }),
      });
      const body = await res.json();
      if (!res.ok) {
        setConfirmError(body.error || "generic");
        setConfirmLoading(false);
        return;
      }
      setQuote((q) => (q ? { ...q, refundPct: body.refundPct, refundAmount: body.refundAmount } : q));
      setStage("done");
    } catch {
      setConfirmError("generic");
      setConfirmLoading(false);
    }
  };

  const lookupErrorKey = lookupError
    ? {
        not_found: "cancelBooking.error_not_found",
        ambiguous: "cancelBooking.error_ambiguous",
        already_cancelled: "cancelBooking.error_already_cancelled",
      }[lookupError] || "cancelBooking.error_generic"
    : null;

  const confirmErrorKey = confirmError
    ? {
        already_cancelled: "cancelBooking.error_already_cancelled",
        refund_failed: "cancelBooking.error_refund_failed",
        no_payment_intent: "cancelBooking.error_refund_failed",
      }[confirmError] || "cancelBooking.error_generic"
    : null;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-md px-4 sm:px-6 py-24 sm:py-32">
        <h1 className="font-display text-3xl sm:text-4xl mb-3">{t("cancelBooking.title")}</h1>

        {stage === "lookup" && (
          <>
            <p className="text-muted-foreground mb-8 text-sm">{t("cancelBooking.intro")}</p>
            <form onSubmit={handleSubmit(onLookup)} className="space-y-3">
              <Field label={t("cancelBooking.form_ref")} error={errors.bookingRef?.message ? t(`cancelBooking.${errors.bookingRef.message}`) : undefined}>
                <input
                  {...register("bookingRef")}
                  placeholder={t("cancelBooking.form_ref_placeholder")}
                  className={inputCls(!!errors.bookingRef)}
                />
              </Field>
              <div className="text-center text-xs uppercase tracking-widest text-muted-foreground">
                {t("cancelBooking.form_or")}
              </div>
              <Field label={t("cancelBooking.form_email")}>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className={inputCls(false)}
                />
              </Field>
              <Field label={t("cancelBooking.form_lastname")} error={errors.lastName?.message ? t("booking.form_required") : undefined}>
                <input {...register("lastName")} className={inputCls(!!errors.lastName)} />
              </Field>

              {lookupErrorKey && (
                <p className="text-sm text-rose-500">{t(lookupErrorKey)}</p>
              )}

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

        {stage === "quote" && quote && (
          <div className="rounded-2xl border border-border/60 bg-surface p-6">
            <h2 className="font-display text-lg mb-4">{t("cancelBooking.quote_title")}</h2>
            <div className="text-sm text-muted-foreground space-y-1 mb-4">
              <p>{quote.bookingRef}</p>
              <p>{quote.startDate} → {quote.endDate} · {quote.nights} {t("booking.nights").toLowerCase()}</p>
            </div>
            <p className="text-sm text-foreground mb-6">
              {quote.refundPct > 0
                ? t("cancelBooking.quote_refund_full", { pct: quote.refundPct, amount: quote.refundAmount })
                : t("cancelBooking.quote_refund_zero")}
            </p>

            {confirmErrorKey && (
              <p className="text-sm text-rose-500 mb-3">{t(confirmErrorKey)}</p>
            )}

            <button
              onClick={onConfirm}
              disabled={confirmLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {confirmLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLoading ? t("cancelBooking.quote_processing") : t("cancelBooking.quote_confirm")}
            </button>
            <button
              onClick={() => setStage("lookup")}
              disabled={confirmLoading}
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
