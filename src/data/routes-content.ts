export type Lang = "es" | "en" | "de" | "it" | "nl" | "ru" | "uk";

export interface RouteDay {
  title: Record<Lang, string>;
  text: Record<Lang, string>;
  photoSlot: string; // data-photo value for placeholder div
}

export interface RouteTip {
  tip: Record<Lang, string>;
}

export interface RouteContent {
  slug: string;
  metaTitle: Record<Lang, string>;
  metaDescription: Record<Lang, string>;
  heroTitle: Record<Lang, string>;
  heroSubtitle: Record<Lang, string>;
  intro: Record<Lang, string>;
  days: RouteDay[];
  tips: RouteTip[];
  ctaText: Record<Lang, string>;
}

// ─── Costa Blanca Norte ──────────────────────────────────────────────────────
// Content will be filled in once source text is provided.
const costaBlanca: RouteContent = {
  slug: "costa-blanca",
  metaTitle: {
    es: "Ruta Autocaravana Costa Blanca Norte 5 Días | Camper Retreat VLC",
    en: "Costa Blanca North Campervan Route 5 Days | Camper Retreat VLC",
    de: "Wohnmobil-Route Costa Blanca Nord 5 Tage | Camper Retreat VLC",
    it: "Itinerario Camper Costa Blanca Nord 5 Giorni | Camper Retreat VLC",
    nl: "Camper Route Costa Blanca Noord 5 Dagen | Camper Retreat VLC",
    ru: "Маршрут на автодоме Коста-Бланка Север 5 дней | Camper Retreat VLC",
    uk: "Маршрут на автодімі Коста-Бланка Північ 5 днів | Camper Retreat VLC",
  },
  metaDescription: {
    es: "Descubre la ruta autocaravana Costa Blanca Norte en 5 días: Cullera, Dénia, Jávea, Calpe y Altea. Salida desde Valencia. Alquiler autocaravana incluido.",
    en: "Explore the Costa Blanca North campervan route in 5 days: Cullera, Dénia, Jávea, Calpe and Altea. Departing from Valencia.",
    de: "Entdecke die Wohnmobil-Route Costa Blanca Nord in 5 Tagen: Cullera, Dénia, Jávea, Calpe und Altea. Start in Valencia.",
    it: "Scopri l'itinerario camper Costa Blanca Nord in 5 giorni: Cullera, Dénia, Jávea, Calpe e Altea. Partenza da Valencia.",
    nl: "Ontdek de camperroute Costa Blanca Noord in 5 dagen: Cullera, Dénia, Jávea, Calpe en Altea. Vertrek vanuit Valencia.",
    ru: "Маршрут на автодоме по Коста-Бланка Север за 5 дней: Кульера, Дения, Хавеа, Кальпе и Альтеа. Отправление из Валенсии.",
    uk: "Маршрут на автодімі по Коста-Бланка Північ за 5 днів: Кульєра, Денія, Хавеа, Кальпе та Альтеа. Виїзд з Валенсії.",
  },
  heroTitle: {
    es: "Ruta autocaravana Costa Blanca Norte: 5 días desde Valencia",
    en: "Costa Blanca North Campervan Route: 5 Days from Valencia",
    de: "Wohnmobil-Route Costa Blanca Nord: 5 Tage ab Valencia",
    it: "Itinerario Camper Costa Blanca Nord: 5 Giorni da Valencia",
    nl: "Camperroute Costa Blanca Noord: 5 Dagen vanuit Valencia",
    ru: "Маршрут на автодоме Коста-Бланка Север: 5 дней из Валенсии",
    uk: "Маршрут на автодімі Коста-Бланка Північ: 5 днів з Валенсії",
  },
  heroSubtitle: {
    es: "Cullera · Dénia · Jávea · Calpe · Altea — calas de ensueño, montañas al mar y pueblos blancos",
    en: "Cullera · Dénia · Jávea · Calpe · Altea — dream coves, mountains at sea and white villages",
    de: "Cullera · Dénia · Jávea · Calpe · Altea — Traumbuchten, Berge am Meer und weiße Dörfer",
    it: "Cullera · Dénia · Jávea · Calpe · Altea — calette da sogno, montagne sul mare e borghi bianchi",
    nl: "Cullera · Dénia · Jávea · Calpe · Altea — droombaaitjes, bergen aan zee en witte dorpjes",
    ru: "Кульера · Дения · Хавеа · Кальпе · Альтеа — сказочные бухты, горы у моря и белые деревни",
    uk: "Кульєра · Денія · Хавеа · Кальпе · Альтеа — казкові бухти, гори біля моря і білі села",
  },
  intro: {
    es: "PLACEHOLDER — se rellenará con el texto fuente proporcionado.",
    en: "PLACEHOLDER — will be filled with the provided source text.",
    de: "PLATZHALTER — wird mit dem bereitgestellten Quelltext ausgefüllt.",
    it: "SEGNAPOSTO — verrà compilato con il testo sorgente fornito.",
    nl: "TIJDELIJKE TEKST — wordt ingevuld met de aangeleverde brontekst.",
    ru: "ЗАГЛУШКА — будет заполнено исходным текстом.",
    uk: "ЗАГЛУШКА — буде заповнено вихідним текстом.",
  },
  days: [
    {
      photoSlot: "dia-1-cullera",
      title: {
        es: "Día 1: Valencia → Cullera",
        en: "Day 1: Valencia → Cullera",
        de: "Tag 1: Valencia → Cullera",
        it: "Giorno 1: Valencia → Cullera",
        nl: "Dag 1: Valencia → Cullera",
        ru: "День 1: Валенсия → Кульера",
        uk: "День 1: Валенсія → Кульєра",
      },
      text: {
        es: "PLACEHOLDER",
        en: "PLACEHOLDER",
        de: "PLATZHALTER",
        it: "SEGNAPOSTO",
        nl: "TIJDELIJKE TEKST",
        ru: "ЗАГЛУШКА",
        uk: "ЗАГЛУШКА",
      },
    },
    {
      photoSlot: "dia-2-denia",
      title: {
        es: "Día 2: Cullera → Dénia",
        en: "Day 2: Cullera → Dénia",
        de: "Tag 2: Cullera → Dénia",
        it: "Giorno 2: Cullera → Dénia",
        nl: "Dag 2: Cullera → Dénia",
        ru: "День 2: Кульера → Дения",
        uk: "День 2: Кульєра → Денія",
      },
      text: {
        es: "PLACEHOLDER",
        en: "PLACEHOLDER",
        de: "PLATZHALTER",
        it: "SEGNAPOSTO",
        nl: "TIJDELIJKE TEKST",
        ru: "ЗАГЛУШКА",
        uk: "ЗАГЛУШКА",
      },
    },
    {
      photoSlot: "dia-3-javea",
      title: {
        es: "Día 3: Dénia → Jávea",
        en: "Day 3: Dénia → Jávea",
        de: "Tag 3: Dénia → Jávea",
        it: "Giorno 3: Dénia → Jávea",
        nl: "Dag 3: Dénia → Jávea",
        ru: "День 3: Дения → Хавеа",
        uk: "День 3: Денія → Хавеа",
      },
      text: {
        es: "PLACEHOLDER",
        en: "PLACEHOLDER",
        de: "PLATZHALTER",
        it: "SEGNAPOSTO",
        nl: "TIJDELIJKE TEKST",
        ru: "ЗАГЛУШКА",
        uk: "ЗАГЛУШКА",
      },
    },
    {
      photoSlot: "dia-4-calpe",
      title: {
        es: "Día 4: Jávea → Calpe",
        en: "Day 4: Jávea → Calpe",
        de: "Tag 4: Jávea → Calpe",
        it: "Giorno 4: Jávea → Calpe",
        nl: "Dag 4: Jávea → Calpe",
        ru: "День 4: Хавеа → Кальпе",
        uk: "День 4: Хавеа → Кальпе",
      },
      text: {
        es: "PLACEHOLDER",
        en: "PLACEHOLDER",
        de: "PLATZHALTER",
        it: "SEGNAPOSTO",
        nl: "TIJDELIJKE TEKST",
        ru: "ЗАГЛУШКА",
        uk: "ЗАГЛУШКА",
      },
    },
    {
      photoSlot: "dia-5-altea",
      title: {
        es: "Día 5: Calpe → Altea → Valencia",
        en: "Day 5: Calpe → Altea → Valencia",
        de: "Tag 5: Calpe → Altea → Valencia",
        it: "Giorno 5: Calpe → Altea → Valencia",
        nl: "Dag 5: Calpe → Altea → Valencia",
        ru: "День 5: Кальпе → Альтеа → Валенсия",
        uk: "День 5: Кальпе → Альтеа → Валенсія",
      },
      text: {
        es: "PLACEHOLDER",
        en: "PLACEHOLDER",
        de: "PLATZHALTER",
        it: "SEGNAPOSTO",
        nl: "TIJDELIJKE TEKST",
        ru: "ЗАГЛУШКА",
        uk: "ЗАГЛУШКА",
      },
    },
  ],
  tips: [
    {
      tip: {
        es: "PLACEHOLDER — consejo práctico 1",
        en: "PLACEHOLDER — practical tip 1",
        de: "PLATZHALTER — praktischer Tipp 1",
        it: "SEGNAPOSTO — consiglio pratico 1",
        nl: "TIJDELIJKE TEKST — praktische tip 1",
        ru: "ЗАГЛУШКА — практический совет 1",
        uk: "ЗАГЛУШКА — практична порада 1",
      },
    },
    {
      tip: {
        es: "PLACEHOLDER — consejo práctico 2",
        en: "PLACEHOLDER — practical tip 2",
        de: "PLATZHALTER — praktischer Tipp 2",
        it: "SEGNAPOSTO — consiglio pratico 2",
        nl: "TIJDELIJKE TEKST — praktische tip 2",
        ru: "ЗАГЛУШКА — практический совет 2",
        uk: "ЗАГЛУШКА — практична порада 2",
      },
    },
  ],
  ctaText: {
    es: "Reservar esta ruta",
    en: "Book this route",
    de: "Diese Route buchen",
    it: "Prenota questo itinerario",
    nl: "Boek deze route",
    ru: "Забронировать этот маршрут",
    uk: "Забронювати цей маршрут",
  },
};

export const ROUTE_PAGES: RouteContent[] = [costaBlanca];

export function getRouteBySlug(slug: string): RouteContent | undefined {
  return ROUTE_PAGES.find((r) => r.slug === slug);
}
