// The rental conditions live as plain Markdown in /content, one file per
// language; Spanish is the master and the others carry a "Spanish prevails" note.
import es from "../../content/condiciones-web-es.md?raw";
import en from "../../content/condiciones-web-en.md?raw";
import de from "../../content/condiciones-web-de.md?raw";
import it from "../../content/condiciones-web-it.md?raw";
import nl from "../../content/condiciones-web-nl.md?raw";
import ru from "../../content/condiciones-web-ru.md?raw";
import uk from "../../content/condiciones-web-uk.md?raw";

import { DEFAULT_LANGUAGE, normalizeLanguage, type LanguageCode } from "@/i18n/language";

const TEXTS: Record<LanguageCode, string> = { es, en, de, it, nl, ru, uk };

export function conditionsText(language: string | null | undefined): string {
  return TEXTS[normalizeLanguage(language) ?? DEFAULT_LANGUAGE];
}

export const CONDITIONS_PATH = "/condiciones";

/** Browser tab title per language: "Condiciones de alquiler y tarifas | Camper Retreat VLC". */
export const CONDITIONS_META: Record<LanguageCode, { title: string; description: string }> = {
  es: {
    title: "Condiciones de alquiler y tarifas | Camper Retreat VLC",
    description:
      "Qué incluye el precio, tarifas y suplementos, cancelación, fianza y seguro de la autocaravana McLouis Yearling 89 en Valencia.",
  },
  en: {
    title: "Rental conditions and rates | Camper Retreat VLC",
    description:
      "What the price includes, rates and surcharges, cancellation, deposit and insurance for the McLouis Yearling 89 motorhome in Valencia.",
  },
  de: {
    title: "Mietbedingungen und Preise | Camper Retreat VLC",
    description:
      "Was im Preis enthalten ist, Preise und Zuschläge, Stornierung, Kaution und Versicherung für das Wohnmobil McLouis Yearling 89 in Valencia.",
  },
  it: {
    title: "Condizioni di noleggio e tariffe | Camper Retreat VLC",
    description:
      "Cosa include il prezzo, tariffe e supplementi, cancellazione, cauzione e assicurazione del camper McLouis Yearling 89 a Valencia.",
  },
  nl: {
    title: "Huurvoorwaarden en tarieven | Camper Retreat VLC",
    description:
      "Wat de prijs omvat, tarieven en toeslagen, annulering, waarborg en verzekering van de camper McLouis Yearling 89 in Valencia.",
  },
  ru: {
    title: "Условия аренды и тарифы | Camper Retreat VLC",
    description:
      "Что входит в цену, тарифы и доплаты, отмена, залог и страховка автодома McLouis Yearling 89 в Валенсии.",
  },
  uk: {
    title: "Умови оренди та тарифи | Camper Retreat VLC",
    description:
      "Що входить у ціну, тарифи та доплати, скасування, застава і страхування автодому McLouis Yearling 89 у Валенсії.",
  },
};
