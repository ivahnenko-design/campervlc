import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ConditionsDocument } from "@/components/ConditionsDocument";
import { CONDITIONS_META, CONDITIONS_PATH, conditionsText } from "@/data/conditions";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  LANGUAGE_QUERY_PARAM,
  resolveLanguage,
  type LanguageCode,
} from "@/i18n/language";

const SITE = "https://campervlc.com";

// Spanish lives at the bare path; the others use ?lang=xx, the same URLs the
// sitemap already publishes for the home page.
const urlFor = (lang: LanguageCode) =>
  lang === DEFAULT_LANGUAGE ? `${SITE}${CONDITIONS_PATH}` : `${SITE}${CONDITIONS_PATH}?${LANGUAGE_QUERY_PARAM}=${lang}`;

export const Route = createFileRoute("/condiciones")({
  head: () => {
    const lang = resolveLanguage();
    const meta = CONDITIONS_META[lang];
    const url = urlFor(lang);
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "Camper Retreat VLC" },
        { property: "og:image", content: `${SITE}/images/og-home.jpg` },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: meta.title },
        { name: "twitter:description", content: meta.description },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "x-default", href: urlFor(DEFAULT_LANGUAGE) },
        ...LANGUAGE_CODES.map((l) => ({ rel: "alternate", hrefLang: l, href: urlFor(l) })),
      ],
    };
  },
  component: ConditionsPage,
});

function ConditionsPage() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("conditions.back")}
        </Link>
        <ConditionsDocument markdown={conditionsText(i18n.language)} tocTitle={t("conditions.toc")} />
      </main>
      <Footer />
    </div>
  );
}
