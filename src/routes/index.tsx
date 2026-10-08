import { createFileRoute } from "@tanstack/react-router";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  LANGUAGE_QUERY_PARAM,
  resolveLanguage,
  type LanguageCode,
} from "@/i18n/language";
import es from "@/i18n/translations/es.json";
import en from "@/i18n/translations/en.json";
import de from "@/i18n/translations/de.json";
import it from "@/i18n/translations/it.json";
import nl from "@/i18n/translations/nl.json";
import ru from "@/i18n/translations/ru.json";
import uk from "@/i18n/translations/uk.json";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Fleet } from "@/components/Fleet";
import { HowItWorks } from "@/components/HowItWorks";
import { BookingCalendar } from "@/components/BookingCalendar";
import { SeasonStrip } from "@/components/SeasonStrip";
import { Routes as RoutesSection } from "@/components/Routes";
import { Reviews } from "@/components/Reviews";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

const SITE = "https://campervlc.com";
const META: Record<LanguageCode, { title: string; description: string }> = {
  es: es.meta, en: en.meta, de: de.meta, it: it.meta, nl: nl.meta, ru: ru.meta, uk: uk.meta,
};

// Spanish lives at "/", the other languages at "/?lang=xx" (the URLs in the sitemap).
const homeUrl = (lang: LanguageCode) =>
  lang === DEFAULT_LANGUAGE ? `${SITE}/` : `${SITE}/?${LANGUAGE_QUERY_PARAM}=${lang}`;

export const Route = createFileRoute("/")({
  // Rendered per language on the server so Google sees a matching title,
  // description, canonical and hreflang set for every language version.
  head: () => {
    const lang = resolveLanguage();
    const { title, description } = META[lang];
    const url = homeUrl(lang);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "x-default", href: homeUrl(DEFAULT_LANGUAGE) },
        ...LANGUAGE_CODES.map((l) => ({ rel: "alternate", hrefLang: l, href: homeUrl(l) })),
      ],
    };
  },
  component: Index,
});

function Index() {
  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Fleet />
        <HowItWorks />
        <BookingCalendar />
        <SeasonStrip />
        <RoutesSection />
        <Reviews />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
