import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import es from "./translations/es.json";
import en from "./translations/en.json";
import uk from "./translations/uk.json";
import ru from "./translations/ru.json";
import de from "./translations/de.json";
import it from "./translations/it.json";
import nl from "./translations/nl.json";

export const LANGUAGES = [
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "uk", flag: "🇺🇦", label: "UK" },
  { code: "ru", flag: "🇷🇺", label: "RU" },
  { code: "de", flag: "🇩🇪", label: "DE" },
  { code: "it", flag: "🇮🇹", label: "IT" },
  { code: "nl", flag: "🇳🇱", label: "NL" },
] as const;

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        es: { translation: es },
        en: { translation: en },
        uk: { translation: uk },
        ru: { translation: ru },
        de: { translation: de },
        it: { translation: it },
        nl: { translation: nl },
      },
      fallbackLng: "es",
      supportedLngs: LANGUAGES.map((l) => l.code),
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
    });
}

export default i18n;
