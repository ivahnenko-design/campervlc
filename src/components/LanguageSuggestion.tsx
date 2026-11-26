// The server renders a URL without ?lang= in Spanish (or in the language the
// visitor chose before), never in the browser language, so crawlers always see
// the page its canonical says. A first-time visitor whose browser speaks one of
// our other languages gets this small offer to switch instead.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import {
  LANGUAGES,
  LANGUAGE_QUERY_PARAM,
  hrefWithLanguage,
  normalizeLanguage,
  persistLanguage,
  pickFromAcceptLanguage,
  readStoredLanguage,
  type LanguageCode,
} from "@/i18n/language";

const OFFER: Record<LanguageCode, { text: string; cta: string }> = {
  es: { text: "Esta página también está en español", cta: "Ver en español" },
  en: { text: "This page is available in English", cta: "Switch to English" },
  uk: { text: "Ця сторінка є українською", cta: "Українською" },
  ru: { text: "Эта страница есть на русском", cta: "На русском" },
  de: { text: "Diese Seite gibt es auch auf Deutsch", cta: "Auf Deutsch" },
  it: { text: "Questa pagina è disponibile in italiano", cta: "In italiano" },
  nl: { text: "Deze pagina is ook in het Nederlands", cta: "In het Nederlands" },
};
const DISMISSED_KEY = "langOfferDismissed";

export function LanguageSuggestion() {
  const { i18n } = useTranslation();
  const [offer, setOffer] = useState<LanguageCode | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has(LANGUAGE_QUERY_PARAM)) return;
    if (readStoredLanguage()) return;
    try {
      if (window.sessionStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // storage blocked: still offer
    }
    const browser = pickFromAcceptLanguage((navigator.languages || [navigator.language]).join(","));
    if (browser && browser !== normalizeLanguage(i18n.language)) setOffer(browser);
  }, [i18n.language]);

  if (!offer) return null;
  const { text, cta } = OFFER[offer];
  const flag = LANGUAGES.find((l) => l.code === offer)?.flag;

  const dismiss = () => {
    setOffer(null);
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  };
  const accept = () => {
    persistLanguage(offer);
    const { pathname, search, hash } = window.location;
    window.location.assign(hrefWithLanguage(`${pathname}${search}${hash}`, offer));
  };

  return (
    <div
      role="dialog"
      aria-label={text}
      lang={offer}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-surface/95 px-4 py-3 text-sm text-foreground shadow-2xl backdrop-blur"
    >
      <span className="text-lg leading-none">{flag}</span>
      <span className="flex-1">{text}</span>
      <button
        onClick={accept}
        className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
      >
        {cta}
      </button>
      <button onClick={dismiss} aria-label="Close" className="shrink-0 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
