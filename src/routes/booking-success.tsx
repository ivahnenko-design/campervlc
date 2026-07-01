import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle } from "lucide-react";

export const Route = createFileRoute("/booking-success")({
  component: BookingSuccessPage,
});

function BookingSuccessPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 py-24">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />

        <h1 className="font-display text-3xl sm:text-4xl text-foreground">
          {t("success.title", "Booking confirmed!")}
        </h1>
        <p className="text-muted-foreground">
          {t(
            "success.desc",
            "Your deposit has been received. We'll email you the details shortly."
          )}
        </p>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-foreground text-left space-y-1">
          <p>✅ {t("success.deposit_paid", "Deposit (50%) paid")}</p>
          <p>📅 {t("success.pickup_note", "Remaining 50% is due on pickup of the campervan in Valencia.")}</p>
          <p>📧 {t("success.email_note", "Check your inbox for a confirmation email.")}</p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          ← {t("success.back", "Back to homepage")}
        </Link>
      </div>
    </main>
  );
}
