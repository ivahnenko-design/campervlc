import i18n, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import es from "./translations/es.json";
import en from "./translations/en.json";
import uk from "./translations/uk.json";
import ru from "./translations/ru.json";
import de from "./translations/de.json";
import it from "./translations/it.json";
import nl from "./translations/nl.json";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  LANGUAGES,
  resolveLanguage,
  type LanguageCode,
} from "./language";

export {
  LANGUAGES,
  LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  resolveLanguage,
  persistLanguage,
  readStoredLanguage,
  normalizeLanguage,
  LANGUAGE_COOKIE,
  LANGUAGE_QUERY_PARAM,
  LANGUAGE_STORAGE_KEY,
  type LanguageCode,
} from "./language";

const resources = {
  es: { translation: es },
  en: { translation: en },
  uk: { translation: uk },
  ru: { translation: ru },
  de: { translation: de },
  it: { translation: it },
  nl: { translation: nl },
};

// The browser language detector is deliberately NOT used: it only works on the
// client, so the server always fell back to Spanish and the first client render
// disagreed with it. The language is resolved from the request instead (see
// ./language) and the detected value is handed to the client via <html lang>.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    // On the server the per-request language comes from cloneInstance below, so
    // this singleton just needs a valid default. Calling resolveLanguage() here
    // would run outside a request context.
    lng: typeof document !== "undefined" ? resolveLanguage() : DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGE_CODES,
    interpolation: { escapeValue: false },
  });
}

/**
 * i18next instance to render with.
 *
 * On the client this is the shared singleton, already initialised with the
 * language the server rendered. On the server every request gets its own clone,
 * because the module-level singleton is shared across concurrent requests and
 * mutating its language would leak one visitor's language into another's page.
 */
export function getI18nForLanguage(lang: LanguageCode): I18nInstance {
  if (typeof document !== "undefined") return i18n;
  return i18n.cloneInstance({ lng: lang });
}

export default i18n;
