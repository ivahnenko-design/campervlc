import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Camper Retreat VLC" },
      { name: "description", content: "Privacy policy for Camper Retreat VLC campervan rentals in Valencia, Spain. GDPR/LOPD compliant." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"] as const;

function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <h1 className="font-display text-3xl sm:text-4xl mb-2">{t("privacy.title")}</h1>
        <p className="text-sm text-muted-foreground mb-10">{t("privacy.subtitle")}</p>

        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <div key={s} className="rounded-2xl border border-border/60 bg-surface p-6">
              <h2 className="font-display text-lg text-foreground mb-2">
                {t(`privacy.${s}_title`)}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`privacy.${s}_body`)}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
