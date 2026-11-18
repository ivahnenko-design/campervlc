// SEO guides (content/guides/<lang>.json): one JSON per language, same structure.
import es from "../../content/guides/es.json";
import en from "../../content/guides/en.json";
import de from "../../content/guides/de.json";
import it from "../../content/guides/it.json";
import nl from "../../content/guides/nl.json";
import ru from "../../content/guides/ru.json";
import uk from "../../content/guides/uk.json";
import type { LanguageCode } from "@/i18n/language";

export interface GuideSection {
  h2: string;
  paragraphs: string[];
  list?: string[];
  /** Photo code from src/data/guide-photos.ts, shown after the section text. */
  image?: string;
}
export interface Guide {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** Photo code from src/data/guide-photos.ts, shown under the title and used as og:image. */
  heroImage?: string;
  intro: string;
  updated: string;
  sections: GuideSection[];
  faq: { q: string; a: string }[];
  cta: { text: string; button: string };
}
export interface GuidesUi {
  label: string;
  allGuides: string;
  updated: string;
  faqTitle: string;
  moreGuides: string;
  routes: string;
  breadcrumbHome: string;
  book: string;
  indexTitle: string;
  indexDescription: string;
  calTitle: string;
  calLow: string;
  calMid: string;
  calHigh: string;
  calPeak: string;
  calPerNight: string;
  calMin: string;
  calDiscounts: string;
  calLink: string;
}
interface GuidesFile {
  ui: GuidesUi;
  guides: Record<string, Guide>;
}

const FILES: Record<LanguageCode, GuidesFile> = {
  es: es as GuidesFile,
  en: en as GuidesFile,
  de: de as GuidesFile,
  it: it as GuidesFile,
  nl: nl as GuidesFile,
  ru: ru as GuidesFile,
  uk: uk as GuidesFile,
};

export const GUIDE_SLUGS = Object.keys(es.guides);
/** ISO date of the last content review, for Article.dateModified. */
export const GUIDES_DATE_MODIFIED = "2026-10-08";
/** Guides reviewed after GUIDES_DATE_MODIFIED. */
const GUIDE_DATE_MODIFIED: Record<string, string> = {
  "paises-autocaravana-alquiler": "2026-11-19",
};

export function guideDateModified(slug: string): string {
  return GUIDE_DATE_MODIFIED[slug] ?? GUIDES_DATE_MODIFIED;
}

export function guidesUi(lang: LanguageCode): GuidesUi {
  return (FILES[lang] ?? FILES.es).ui;
}

export function getGuide(lang: LanguageCode, slug: string): Guide | undefined {
  return (FILES[lang] ?? FILES.es).guides[slug] ?? FILES.es.guides[slug];
}
