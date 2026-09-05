import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/booking-success")({
  component: BookingSuccessPage,
});

interface BookingSession {
  paid: boolean;
  bookingRef: string | null;
  prepaymentOption: "full" | "deposit";
  amountPaid: number;
  remainingAmount: number;
  totalWithIva: number;
  startDate: string | null;
  endDate: string | null;
  nights: number | null;
  guestFirstName: string | null;
  promoCode: string | null;
}

// The webhook that mints the booking reference races this redirect, so give it
// a few seconds before falling back to "it will be in your email".
const REF_RETRIES = 4;
const REF_RETRY_MS = 1500;

function useBookingSession() {
  const [data, setData] = useState<BookingSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempt = 0;

    const load = async () => {
      try {
        const res = await fetch(`/api/booking-session?session_id=${encodeURIComponent(sessionId)}`);
        if (!res.ok) throw new Error(`booking-session ${res.status}`);
        const json: BookingSession = await res.json();
        if (cancelled) return;
        setData(json);
        setLoading(false);
        // Payment facts are already correct; only the reference may still be pending.
        if (!json.bookingRef && attempt < REF_RETRIES) {
          attempt += 1;
          setTimeout(load, REF_RETRY_MS);
        }
      } catch (err) {
        console.error("Could not load booking session:", err);
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

function BookingSuccessPage() {
  const { t } = useTranslation();
  const { data, loading } = useBookingSession();

  const isFullPayment = data?.prepaymentOption === "full";
  const money = (n: number) => `${n} €`;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 py-24">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />

        <h1 className="font-display text-3xl sm:text-4xl text-foreground">
          {t("success.title")}
        </h1>
        <p className="text-muted-foreground">{t("success.desc")}</p>

        {/* Booking reference */}
        {data ? (
          <div className="rounded-xl border border-border/60 bg-surface px-5 py-4 text-left">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("success.ref")}
            </p>
            {data.bookingRef ? (
              <>
                <p className="font-mono-num text-2xl font-semibold text-foreground">
                  {data.bookingRef}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t("success.ref_note")}</p>
              </>
            ) : (
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("success.ref_pending")}
              </p>
            )}
          </div>
        ) : null}

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-foreground text-left space-y-1.5">
          {loading ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("success.loading")}
            </p>
          ) : (
            <>
              <p>
                ✅{" "}
                <strong>
                  {isFullPayment ? t("success.paid_full") : t("success.deposit_paid")}
                </strong>
                {data ? <> — {money(data.amountPaid)}</> : null}
              </p>

              {data?.startDate && data?.endDate ? (
                <p>
                  📅 {t("success.dates")}: {data.startDate} → {data.endDate}
                </p>
              ) : null}

              {isFullPayment ? (
                <p>💶 {t("success.no_balance")}</p>
              ) : (
                <p>
                  💶 {t("success.pickup_note")}
                  {data && data.remainingAmount > 0 ? <> ({money(data.remainingAmount)})</> : null}
                </p>
              )}

              <p>📧 {t("success.email_note")}</p>
            </>
          )}
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          ← {t("success.back")}
        </Link>
      </div>
    </main>
  );
}
