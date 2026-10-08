import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GUIDE_SLUGS, getGuide, guidesUi } from "@/data/guides";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  LANGUAGE_QUERY_PARAM,
  normalizeLanguage,
  resolveLanguage,
  type LanguageCode,
} from "@/i18n/language";

const SITE = "https://campervlc.com";
const urlFor = (lang: LanguageCode) =>
  lang === DEFAULT_LANGUAGE ? `${SITE}/guias` : `${SITE}/guias?${LANGUAGE_QUERY_PARAM}=${lang}`;

export const Route = createFileRoute("/guias/")({
  head: () => {
    const lang = resolveLanguage();
    const ui = guidesUi(lang);
    return {
      meta: [
        { title: `${ui.indexTitle} | Camper Retreat VLC` },
        { name: "description", content: ui.indexDescription },
        { property: "og:title", content: ui.indexTitle },
        { property: "og:description", content: ui.indexDescription },
        { property: "og:url", content: urlFor(lang) },
      ],
      links: [
        { rel: "canonical", href: urlFor(lang) },
        { rel: "alternate", hrefLang: "x-default", href: urlFor(DEFAULT_LANGUAGE) },
        ...LANGUAGE_CODES.map((l) => ({ rel: "alternate", hrefLang: l, href: urlFor(l) })),
      ],
    };
  },
  component: GuidesIndex,
});

function GuidesIndex() {
  const { i18n } = useTranslation();
  const lang = normalizeLanguage(i18n.language) ?? DEFAULT_LANGUAGE;
  const ui = guidesUi(lang);
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-28 pb-20 sm:pt-36">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4" />
          {ui.breadcrumbHome}
        </Link>
        <h1 className="font-display text-3xl sm:text-5xl text-foreground leading-tight text-balance">{ui.indexTitle}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{ui.indexDescription}</p>
        <ul className="mt-10 space-y-4">
          {GUIDE_SLUGS.map((s) => {
            const g = getGuide(lang, s)!;
            return (
              <li key={s}>
                <Link
                  to="/guias/$slug"
                  params={{ slug: s }}
                  className="block rounded-2xl border border-border/60 bg-surface p-6 transition hover:border-primary/50"
                >
                  <span className="font-display text-xl text-foreground">{g.h1}</span>
                  <span className="mt-2 block text-sm text-muted-foreground">{g.metaDescription}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
