import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/cancellation-policy")({
  head: () => ({
    meta: [
      { title: "Cancellation Policy | Camper Retreat VLC" },
      { name: "description", content: "Read our cancellation policy and refund terms for camper van bookings in Valencia." },
    ],
  }),
  component: CancellationPolicyPage,
});

const TIERS = [1, 2, 3, 4] as const;

function CancellationPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <h1 className="font-display text-3xl sm:text-4xl mb-4">{t("cancellationPolicy.title")}</h1>
        <p className="text-muted-foreground mb-10">{t("cancellationPolicy.intro")}</p>

        <div className="space-y-4">
          {TIERS.map((n) => (
            <div key={n} className="rounded-2xl border border-border/60 bg-surface p-6">
              <h2 className="font-display text-lg text-foreground mb-2">
                {t(`cancellationPolicy.tier${n}_title`)}
              </h2>
              <p className="text-sm text-muted-foreground">{t(`cancellationPolicy.tier${n}_body`)}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground">{t("cancellationPolicy.cta_cancel")}</p>
            <Link
              to="/cancel-booking"
              className="mt-2 inline-block text-sm font-medium text-primary underline hover:brightness-110 transition"
            >
              {t("cancellationPolicy.cta_cancel_link")} →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
