import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy | Camper Retreat VLC" },
      { name: "description", content: "Cookie policy for campervlc.com — types of cookies used, duration and how to manage them." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <h1 className="font-display text-3xl sm:text-4xl mb-2">{t("cookies.title")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("cookies.subtitle")}</p>
        <p className="text-sm text-muted-foreground mb-10">{t("cookies.intro")}</p>

        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border/60">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">{t("cookies.table_type")}</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">{t("cookies.table_name")}</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">{t("cookies.table_purpose")}</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">{t("cookies.table_duration")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {(["row1", "row2", "row3"] as const).map((row) => (
                <tr key={row} className="bg-background">
                  <td className="px-4 py-3 text-muted-foreground">{t(`cookies.${row}_type`)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{t(`cookies.${row}_name`)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t(`cookies.${row}_purpose`)}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{t(`cookies.${row}_duration`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-sm text-muted-foreground leading-relaxed">{t("cookies.manage")}</p>

        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="text-primary underline hover:brightness-110 transition">
            {t("footer.privacy")}
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
