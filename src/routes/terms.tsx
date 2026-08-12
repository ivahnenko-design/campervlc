import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Camper Retreat VLC" },
      { name: "description", content: "Terms and conditions for campervan rental at Camper Retreat VLC, Valencia, Spain." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TermsPage,
});

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s9"] as const;

function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <h1 className="font-display text-3xl sm:text-4xl mb-2">{t("terms.title")}</h1>
        <p className="text-sm text-muted-foreground mb-10">{t("terms.subtitle")}</p>

        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <div key={s} className="rounded-2xl border border-border/60 bg-surface p-6">
              <h2 className="font-display text-lg text-foreground mb-2">
                {t(`terms.${s}_title`)}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`terms.${s}_body`)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 bg-surface p-6">
          <h2 className="font-display text-lg text-foreground mb-2">{t("terms.s8_title")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("terms.s8_body")}{" "}
            <Link to="/cancellation-policy" className="text-primary underline hover:brightness-110 transition">
              {t("footer.cancellationPolicy")}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
