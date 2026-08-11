export type Lang = "es" | "en" | "de" | "it" | "nl" | "ru" | "uk";

export interface RouteDay {
  title: Record<Lang, string>;
  text: Record<Lang, string>;
  photoSlot: string;
  image?: string;
  altText?: Record<Lang, string>;
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
  heroImage?: string;
  intro: Record<Lang, string>;
  days: RouteDay[];
  tips: RouteTip[];
  ctaText: Record<Lang, string>;
  ctaButton: Record<Lang, string>;
}

// ─── Costa Blanca Norte ──────────────────────────────────────────────────────

const costaBlanca: RouteContent = {
  slug: "costa-blanca",

  metaTitle: {
    es: "Ruta Autocaravana Costa Blanca: Valencia a Alicante en 5 Días | Camper Retreat VLC",
    en: "Costa Blanca Campervan Route: Valencia to Alicante in 5 Days | Camper Retreat VLC",
    de: "Wohnmobil-Route Costa Blanca: Valencia nach Alicante in 5 Tagen | Camper Retreat VLC",
    it: "Itinerario Camper Costa Blanca: Da Valencia ad Alicante in 5 Giorni | Camper Retreat VLC",
    nl: "Camperroute Costa Blanca: Van Valencia naar Alicante in 5 Dagen | Camper Retreat VLC",
    ru: "Маршрут на автодоме Коста-Бланка: из Валенсии в Аликанте за 5 дней | Camper Retreat VLC",
    uk: "Маршрут на автодімі Коста-Бланка: з Валенсії до Аліканте за 5 днів | Camper Retreat VLC",
  },

  metaDescription: {
    es: "Ruta autocaravana Costa Blanca en 5 días desde Valencia: Cullera, Gandía, Dénia, Jávea, Calpe, Altea y Alicante. Alquiler autocaravana Valencia desde 105 €/noche. Guía completa con áreas de servicio y consejos.",
    en: "Costa Blanca campervan route in 5 days from Valencia: Cullera, Gandía, Dénia, Jávea, Calpe, Altea and Alicante. Complete guide with motorhome stopovers and practical tips.",
    de: "Wohnmobil-Route Costa Blanca in 5 Tagen ab Valencia: Cullera, Gandía, Dénia, Jávea, Calpe, Altea und Alicante. Vollständiger Guide mit Stellplätzen und praktischen Tipps.",
    it: "Itinerario camper Costa Blanca in 5 giorni da Valencia: Cullera, Gandía, Dénia, Jávea, Calpe, Altea e Alicante. Guida completa con aree di sosta e consigli pratici.",
    nl: "Camperroute Costa Blanca in 5 dagen vanuit Valencia: Cullera, Gandía, Dénia, Jávea, Calpe, Altea en Alicante. Complete gids met camperplaatsen en praktische tips.",
    ru: "Маршрут на автодоме по Коста-Бланке за 5 дней из Валенсии: Кульера, Гандия, Дения, Хавеа, Кальпе, Альтеа и Аликанте. Полный гид с площадками и советами.",
    uk: "Маршрут на автодімі по Коста-Бланці за 5 днів з Валенсії: Кульєра, Гандія, Денія, Хавеа, Кальпе, Альтеа та Аліканте. Повний гід з майданчиками та порадами.",
  },

  heroTitle: {
    es: "Ruta autocaravana Costa Blanca: de Valencia a Alicante en 5 días",
    en: "Costa Blanca Campervan Route: Valencia to Alicante in 5 Days",
    de: "Wohnmobil-Route Costa Blanca: Von Valencia nach Alicante in 5 Tagen",
    it: "Itinerario Camper Costa Blanca: Da Valencia ad Alicante in 5 Giorni",
    nl: "Camperroute Costa Blanca: Van Valencia naar Alicante in 5 Dagen",
    ru: "Маршрут на автодоме по Коста-Бланке: из Валенсии в Аликанте за 5 дней",
    uk: "Маршрут на автодімі по Коста-Бланці: з Валенсії до Аліканте за 5 днів",
  },

  heroImage: "/images/routes/costa-blanca-hero.jpg",

  heroSubtitle: {
    es: "El itinerario costero perfecto para viajar en autocaravana por primera vez: calas escondidas, pueblos blancos, mercados de pescado fresco y los mejores atardeceres del Mediterráneo.",
    en: "The perfect coastal itinerary for your first campervan trip: hidden coves, white villages, fresh fish markets and the best sunsets in the Mediterranean.",
    de: "Die perfekte Küstenroute für deine erste Wohnmobilreise: versteckte Buchten, weiße Dörfer, Fischmärkte und die schönsten Sonnenuntergänge des Mittelmeers.",
    it: "L'itinerario costiero perfetto per il tuo primo viaggio in camper: calette nascoste, borghi bianchi, mercati del pesce fresco e i tramonti più belli del Mediterraneo.",
    nl: "De perfecte kustroute voor je eerste camperreis: verborgen baaien, witte dorpjes, versvismarkten en de mooiste zonsondergangen van de Middellandse Zee.",
    ru: "Идеальный прибрежный маршрут для первого путешествия на автодоме: скрытые бухты, белые городки, рынки со свежей рыбой и лучшие закаты Средиземноморья.",
    uk: "Ідеальний прибережний маршрут для першої подорожі на автодімі: приховані бухти, білі містечка, ринки зі свіжою рибою та найкращі заходи сонця Середземномор'я.",
  },

  intro: {
    es: "La Costa Blanca es, sin duda, el mejor destino para el alquiler autocaravana Valencia. En apenas 200 kilómetros de litoral lo tienes todo: playas urbanas con toda la infraestructura, calas salvajes donde amanecer a solas con el mar, encantadores pueblos como Altea y Villajoyosa, e infraestructura para caravanistas muy desarrollada — áreas de servicio, campings abiertos todo el año y puntos de agua cada pocos kilómetros. Esta ruta autocaravana Costa Blanca está diseñada para 4-5 días tranquilos, sin madrugones ni etapas agotadoras. Ningún tramo supera la hora de conducción. Perfecta para familias con niños, parejas y para quienes viajar en autocaravana sea algo nuevo. Distancia total: ~380 km ida y vuelta. Mejor época: todo el año.",
    en: "The Costa Blanca is arguably the best destination for a campervan trip from Valencia. In just 200 kilometres of coastline you have everything: urban beaches with full facilities, wild coves where you can greet the sunrise alone by the sea, charming villages like Altea and Villajoyosa, and well-developed infrastructure for campervanners — motorhome stopovers, year-round campsites and water points every few kilometres. This route is designed for 4-5 relaxed days, with no early alarms or exhausting driving legs. No single stage exceeds one hour behind the wheel. Perfect for families with children, couples and first-time campervanners. Total distance: ~380 km return. Best time to go: year-round.",
    de: "Die Costa Blanca ist wohl das beste Ziel für eine Wohnmobilreise ab Valencia. Auf gerade einmal 200 Küstenkilometern findet man alles: Stadtstrände mit vollständiger Infrastruktur, wilde Buchten, in denen man den Sonnenaufgang allein am Meer erleben kann, charmante Ortschaften wie Altea und Villajoyosa sowie eine gut ausgebaute Infrastruktur für Wohnmobilisten — Stellplätze, ganzjährig geöffnete Campingplätze und Wasserpunkte alle paar Kilometer. Die Route ist auf 4–5 entspannte Tage ausgelegt, ohne frühe Aufstehzeiten und erschöpfende Fahretappen. Keine Etappe überschreitet eine Stunde Fahrzeit. Ideal für Familien mit Kindern, Paare und alle, die zum ersten Mal im Wohnmobil unterwegs sind. Gesamtstrecke: ~380 km Hin- und Rückfahrt. Beste Reisezeit: ganzjährig.",
    it: "La Costa Blanca è probabilmente la meta migliore per un viaggio in camper da Valencia. In soli 200 chilometri di costa si trova tutto: spiagge urbane con ogni infrastruttura, calette selvagge dove vivere l'alba in totale solitudine con il mare, affascinanti borghi come Altea e Villajoyosa, e un'infrastruttura per camperisti molto sviluppata — aree di sosta, campeggi aperti tutto l'anno e punti d'acqua ogni pochi chilometri. L'itinerario è pensato per 4-5 giorni rilassati, senza sveglie mattutine né tappe estenuanti. Nessuna tappa supera l'ora di guida. Ideale per famiglie con bambini, coppie e per chi noleggia un camper per la prima volta. Distanza totale: ~380 km andata e ritorno. Periodo migliore: tutto l'anno.",
    nl: "De Costa Blanca is waarschijnlijk de beste bestemming voor een camperreis vanuit Valencia. In slechts 200 kilometer kustlijn vind je alles: stadsstranden met alle faciliteiten, wilde baaien waar je alleen met de zee de zonsopkomst kunt beleven, charmante dorpjes zoals Altea en Villajoyosa, en goed ontwikkelde infrastructuur voor camperaars — camperplaatsen, het hele jaar geopende campings en waterplaatsen elke paar kilometer. De route is ontworpen voor 4-5 ontspannen dagen, zonder vroeg opstaan of vermoeiende ritten. Geen etappe duurt langer dan een uur rijden. Ideaal voor gezinnen met kinderen, stellen en wie voor het eerst in een camper reist. Totale afstand: ~380 km heen en terug. Beste reistijd: het hele jaar.",
    ru: "Коста-Бланка — пожалуй, лучшее направление для путешествия на автодоме из Валенсии. Всего на 200 километрах побережья есть всё: городские пляжи со всей инфраструктурой, дикие бухты, где можно встретить рассвет наедине с морем, очаровательные городки вроде Альтеи и Вильяхойосы, и развитая инфраструктура для кэмперов — площадки для автодомов, кемпинги, работающие круглый год, и точки набора воды каждые несколько километров. Маршрут рассчитан на 4-5 спокойных дней, без ранних подъёмов и утомительных перегонов. Ни один участок не превышает часа за рулём. Идеально для семей с детьми, пар и для тех, кто арендует автодом впервые. Дистанция: ~380 км туда-обратно. Лучшее время: круглый год.",
    uk: "Коста-Бланка — мабуть, найкращий напрямок для подорожі на автодімі з Валенсії. На всього 200 кілометрах узбережжя є все: міські пляжі з повною інфраструктурою, дикі бухти, де можна зустріти світанок наодинці з морем, чарівні містечка на кшталт Альтеї та Вільяхойоси, і розвинена інфраструктура для кемперів — майданчики для автодімів, кемпінги, що працюють цілий рік, і точки набору води кожні кілька кілометрів. Маршрут розрахований на 4-5 спокійних днів, без ранніх підйомів і виснажливих перегонів. Жодна ділянка не перевищує години за кермом. Ідеально для сімей з дітьми, пар і для тих, хто орендує автодім вперше. Відстань: ~380 км туди-назад. Найкращий час: цілий рік.",
  },

  days: [
    {
      photoSlot: "dia-1-cullera",
      image: "/images/routes/dia-1-cullera.jpg",
      altText: {
        es: "Faro de Cullera al amanecer — ruta autocaravana Costa Blanca",
        en: "Cullera lighthouse at sunrise — Costa Blanca campervan route",
        de: "Leuchtturm von Cullera im Morgenlicht — Wohnmobil-Route Costa Blanca",
        it: "Faro di Cullera all'alba — itinerario camper Costa Blanca",
        nl: "Vuurtoren van Cullera bij zonsopgang — camperroute Costa Blanca",
        ru: "Маяк Кульеры на рассвете — маршрут на автодоме по Коста-Бланке",
        uk: "Маяк Кульєри на світанку — маршрут на автодімі по Коста-Бланці",
      },
      title: {
        es: "Día 1: Valencia → Cullera → Gandía (60 km)",
        en: "Day 1: Valencia → Cullera → Gandía (60 km)",
        de: "Tag 1: Valencia → Cullera → Gandía (60 km)",
        it: "Giorno 1: Valencia → Cullera → Gandía (60 km)",
        nl: "Dag 1: Valencia → Cullera → Gandía (60 km)",
        ru: "День 1: Валенсия → Кульера → Гандия (60 км)",
        uk: "День 1: Валенсія → Кульєра → Гандія (60 км)",
      },
      text: {
        es: "Salimos de Valencia por la V-31 hacia el sur. Primera parada: Cullera, a solo 40 minutos. Sube al faro de Cullera — el faro blanco sobre el Mediterráneo es especialmente bonito con la luz de la mañana. La playa del Racó es perfecta para el primer baño: arena fina, agua tranquila y un paseo marítimo para el primer café de la ruta. Por la tarde nos dirigimos a Gandía. El área de autocaravanas de Gandía dispone de todos los servicios: agua, vaciado y electricidad. Opción familiar: Camping La Naranja. Para cenar, fideuá en su lugar de nacimiento — Gandía es la cuna de este plato; pregunta en los restaurantes del puerto.",
        en: "We leave Valencia heading south on the V-31 motorway. First stop: Cullera, just 40 minutes away. Climb up to the Cullera lighthouse — the white tower against the Mediterranean is particularly beautiful in the morning light. Racó beach is perfect for a first swim: fine sand, calm water and a promenade for that first road-trip coffee. In the afternoon we drive to Gandía. The motorhome stopover in Gandía has all services: water, waste disposal and electricity. Family option: Camping La Naranja. For dinner, try fideuá at its place of origin — Gandía is the birthplace of this dish; ask at the port-side restaurants.",
        de: "Wir verlassen Valencia auf der V-31 Richtung Süden. Erste Station: Cullera, nur 40 Minuten entfernt. Steig hinauf zum Leuchtturm von Cullera — der weiße Turm vor dem Mittelmeer leuchtet im Morgenlicht besonders schön. Der Strand Racó ist ideal für das erste Bad: feiner Sand, ruhiges Wasser und eine Uferpromenade für den ersten Kaffee der Reise. Am Nachmittag fahren wir nach Gandía. Der Wohnmobilstellplatz in Gandía bietet alle Versorgungsleistungen: Wasser, Entsorgung und Strom. Familientipp: Camping La Naranja. Zum Abendessen empfehlen wir Fideuá an ihrem Geburtsort — Gandía gilt als Heimat dieses Nudelgerichts; frag in den Restaurants am Hafen.",
        it: "Partiamo da Valencia in direzione sud lungo la V-31. Prima tappa: Cullera, a soli 40 minuti. Salite al faro di Cullera — il bianco faro sul Mediterraneo è splendido nella luce mattutina. La spiaggia del Racó è perfetta per il primo bagno: sabbia fine, acqua calma e un lungomare per il primo caffè di viaggio. Nel pomeriggio ci spostiamo a Gandía. L'area camper di Gandía dispone di tutti i servizi: acqua, scarico e corrente elettrica. Opzione famiglia: Camping La Naranja. A cena, fideuá nel suo luogo d'origine — Gandía è la culla di questo piatto; chiedete nei ristoranti del porto.",
        nl: "We vertrekken vanuit Valencia richting het zuiden via de V-31. Eerste stop: Cullera, slechts 40 minuten rijden. Klim naar de vuurtoren van Cullera — de witte toren met de Middellandse Zee op de achtergrond is bijzonder mooi in het ochtendlicht. Strand Racó is perfect voor de eerste duik: fijn zand, kalm water en een boulevard voor de eerste koffie onderweg. 's Middags rijden we naar Gandía. De camperplaats in Gandía heeft alle voorzieningen: water, afvoer en elektriciteit. Gezinsoptie: Camping La Naranja. Voor het avondeten: fideuá in de geboorteplaats van dit gerecht — Gandía is de bakermat van fideuá; vraag in de restaurants bij de haven.",
        ru: "Выезжаем из Валенсии по трассе V-31 на юг. Первая остановка — Кульера, всего 40 минут пути. Поднимитесь к маяку Кульеры — белый маяк на фоне Средиземного моря особенно хорош в утреннем свете. Пляж Racó идеален для первого купания: мелкий песок, спокойная вода и набережная для первого дорожного кофе. Во второй половине дня едем в Гандию. Площадка для автодомов в Гандии имеет все сервисы: вода, слив, электричество. Семейный вариант — Camping La Naranja. На ужин — фидеуа на её родине: Гандия является родиной этого блюда; спросите в ресторанах у порта.",
        uk: "Виїжджаємо з Валенсії по трасі V-31 на південь. Перша зупинка — Кульєра, всього 40 хвилин шляху. Піднімайтесь до маяка Кульєри — білий маяк на тлі Середземного моря особливо гарний у ранковому світлі. Пляж Racó ідеальний для першого купання: дрібний пісок, спокійна вода і набережна для першої дорожньої кави. У другій половині дня їдемо до Гандії. Майданчик для автодімів у Гандії має всі сервіси: вода, злив, електрика. Сімейний варіант — Camping La Naranja. На вечерю — фідеуа на її батьківщині: Гандія є колискою цієї страви; запитуйте в ресторанах біля порту.",
      },
    },
    {
      photoSlot: "dia-2-denia-javea",
      image: "/images/routes/dia-2-denia-javea.jpg",
      altText: {
        es: "Cabo de Sant Antoni, Jávea — ruta autocaravana Costa Blanca",
        en: "Cape Sant Antoni, Javea — Costa Blanca campervan route",
        de: "Kap Sant Antoni, Javea — Wohnmobil-Route Costa Blanca",
        it: "Capo Sant Antoni, Javea — itinerario camper Costa Blanca",
        nl: "Kaap Sant Antoni, Javea — camperroute Costa Blanca",
        ru: "Мыс Сант-Антони, Хавеа — маршрут на автодоме по Коста-Бланке",
        uk: "Мис Сант-Антоні, Хавея — маршрут на автодімі по Коста-Бланці",
      },
      title: {
        es: "Día 2: Gandía → Dénia → Jávea (50 km)",
        en: "Day 2: Gandía → Dénia → Jávea (50 km)",
        de: "Tag 2: Gandía → Dénia → Jávea (50 km)",
        it: "Giorno 2: Gandía → Dénia → Jávea (50 km)",
        nl: "Dag 2: Gandía → Dénia → Jávea (50 km)",
        ru: "День 2: Гандия → Дения → Хавея (50 км)",
        uk: "День 2: Гандія → Денія → Хавея (50 км)",
      },
      text: {
        es: "Por la mañana, breve trayecto a Dénia por la N-332, una de las carreteras costeras más bonitas. El castillo de Dénia domina la ciudad, el barrio pescador Baix la Mar conserva el alma marinera, y en el mercado municipal encontrarás la famosa gamba roja de Dénia. Tras comer, 15 minutos hasta Jávea. Recomendamos el Wecamp Jávea — camping moderno con amplias parcelas para autocaravanas, piscina y a pie de la playa del Arenal. Al atardecer, sube al mirador del Cap de Sant Antoni — acantilados de 160 metros sobre el mar. Consejo local: las famosas Cala Moraig y Cala Granadella están en todas las guías, pero NO las recomendamos en autocaravana — los accesos son estrechos con curvas cerradas, y en temporada alta es imposible aparcar o maniobrar.",
        en: "A short morning drive to Dénia along the N-332, one of the most scenic coastal roads. Dénia's castle presides over the town, the fishing quarter Baix la Mar retains its seafaring soul, and the municipal market sells the famous red prawn (gamba roja) of Dénia. After lunch, 15 minutes to Jávea. We recommend Wecamp Jávea — a modern campsite with spacious motorhome pitches, a swimming pool and walking distance to Arenal beach. At sunset, climb to the Cap de Sant Antoni viewpoint — 160-metre cliffs above the sea. Local tip: the famous Cala Moraig and Cala Granadella appear in every guidebook, but we do NOT recommend them for a motorhome — the access roads are narrow with tight bends, and in high season it is impossible to park or turn around.",
        de: "Morgens kurze Fahrt nach Dénia auf der N-332, einer der schönsten Küstenstraßen. Das Schloss von Dénia überragt die Stadt, das Fischerviertel Baix la Mar bewahrt seinen maritimen Charakter, und auf dem Stadtmarkt gibt es die berühmte rote Garnele aus Dénia. Nach dem Mittagessen 15 Minuten weiter nach Jávea. Wir empfehlen Wecamp Jávea — ein moderner Campingplatz mit großzügigen Wohnmobilstellplätzen, Schwimmbad und Fußnähe zum Strand Arenal. Bei Sonnenuntergang lohnt sich der Aussichtspunkt Cap de Sant Antoni — 160 Meter hohe Klippen über dem Meer. Geheimtipp: Die berühmten Calas Moraig und Granadella stehen in jedem Reiseführer, aber wir empfehlen sie für Wohnmobile NICHT — die Zufahrten sind eng und kurvenreich, in der Hauptsaison ist Parken oder Wenden unmöglich.",
        it: "Breve spostamento mattutino verso Dénia lungo la N-332, una delle strade costiere più belle. Il castello di Dénia domina la città, il quartiere peschereccio Baix la Mar conserva la sua anima marinara, e al mercato comunale si trovano i celebri gamberoni rossi di Dénia. Dopo pranzo, 15 minuti fino a Jávea. Consigliamo Wecamp Jávea — campeggio moderno con piazzole spaziose per camper, piscina e a due passi dalla spiaggia dell'Arenal. Al tramonto, salite al belvedere del Cap de Sant Antoni — scogliere di 160 metri sul mare. Consiglio locale: le famose Cala Moraig e Cala Granadella compaiono in tutte le guide, ma NON le raccomandiamo con il camper — gli accessi sono stretti con curve strette, e in alta stagione è impossibile parcheggiare o fare inversione.",
        nl: "Een korte ochtendrit naar Dénia via de N-332, een van de mooiste kustroutes. Het kasteel van Dénia domineert de stad, de vissersbuurt Baix la Mar ademt een maritieme sfeer, en op de gemeentemarkt vind je de beroemde rode garnaal uit Dénia. Na de lunch, 15 minuten naar Jávea. We raden Wecamp Jávea aan — een moderne camping met ruime camperplaatsen, een zwembad en op loopafstand van het strand Arenal. Bij zonsondergang is het uitkijkpunt Cap de Sant Antoni de moeite waard — kliffen van 160 meter boven de zee. Lokale tip: de beroemde Cala Moraig en Cala Granadella staan in alle reisgidsen, maar we raden ze NIET aan voor een camper — de toegangswegen zijn smal met scherpe bochten, en in het hoogseizoen is parkeren of keren onmogelijk.",
        ru: "Утром — короткий переезд в Дению по N-332, одной из красивейших прибрежных дорог. Замок Дении возвышается над городом, рыбацкий квартал Baix la Mar хранит морской дух, а на муниципальном рынке продают знаменитую красную креветку из Дении. После обеда — 15 минут до Хавеи. Рекомендуем остановиться в Wecamp Jávea — современный кемпинг с просторными местами для автодомов, бассейном, в пешей доступности от пляжа Ареналь. На закате поднимитесь на смотровую Cap de Sant Antoni — 160-метровые обрывы над морем. Совет от местных: знаменитые Cala Moraig и Cala Granadella есть во всех путеводителях, но мы НЕ рекомендуем их на автодоме — подъезды узкие, с крутыми поворотами, в высокий сезон невозможно припарковаться или развернуться.",
        uk: "Вранці — короткий переїзд до Денії по N-332, одній з найкрасивіших прибережних доріг. Замок Денії височіє над містом, рибальський квартал Baix la Mar зберігає морський дух, а на муніципальному ринку продають знамениту червону креветку з Денії. Після обіду — 15 хвилин до Хавеї. Рекомендуємо зупинитись у Wecamp Jávea — сучасний кемпінг з просторими місцями для автодімів, басейном, у пішій доступності від пляжу Ареналь. На заході сонця піднімайтесь на оглядовий майданчик Cap de Sant Antoni — 160-метрові обриви над морем. Порада від місцевих: знамениті Cala Moraig і Cala Granadella є в усіх путівниках, але ми НЕ рекомендуємо їх на автодімі — під'їзди вузькі, з крутими поворотами, у високий сезон неможливо припаркуватись або розвернутись.",
      },
    },
    {
      photoSlot: "dia-3-calpe-altea",
      image: "/images/routes/dia-3-calpe-altea.jpg",
      altText: {
        es: "Peñón de Ifach, Calpe — ruta autocaravana Costa Blanca",
        en: "Penon de Ifach rising from the sea, Calpe — Costa Blanca campervan route",
        de: "Penon de Ifach, Calpe — Wohnmobil-Route Costa Blanca",
        it: "Penon de Ifach, Calpe — itinerario camper Costa Blanca",
        nl: "Penon de Ifach, Calpe — camperroute Costa Blanca",
        ru: "Пеньон-де-Ифач, Кальпе — маршрут на автодоме по Коста-Бланке",
        uk: "Пеньон-де-Іфач, Кальпе — маршрут на автодімі по Коста-Бланці",
      },
      title: {
        es: "Día 3: Jávea → Calpe → Altea (40 km)",
        en: "Day 3: Jávea → Calpe → Altea (40 km)",
        de: "Tag 3: Jávea → Calpe → Altea (40 km)",
        it: "Giorno 3: Jávea → Calpe → Altea (40 km)",
        nl: "Dag 3: Jávea → Calpe → Altea (40 km)",
        ru: "День 3: Хавея → Кальпе → Альтеа (40 км)",
        uk: "День 3: Хавея → Кальпе → Альтеа (40 км)",
      },
      text: {
        es: "Sobre Calpe se alza el Peñón de Ifach — 332 metros de roca emergiendo del mar. La subida lleva unas 2 horas de ida y vuelta y ofrece vistas impresionantes de la bahía (lleva calzado cerrado). Después, un chiringuito junto al puerto pesquero de Calpe con pescado de la lonja de la mañana. Por la tarde, 20 minutos hasta Altea, el pueblo más fotogénico de la Costa Blanca: casas blancas, callejuelas empedradas, cúpula azul de la iglesia bañada en luz dorada al atardecer. Noche: área de Altea o Camping Cap Blanch junto a la playa de l'Albir.",
        en: "Above Calpe rises the Peñón de Ifach — 332 metres of rock emerging straight from the sea. The ascent takes around 2 hours return and rewards you with stunning views of the bay (wear closed-toe shoes). Afterwards, a chiringuito by Calpe's fishing port serving fish from the morning auction. In the afternoon, 20 minutes to Altea, the most photogenic village on the Costa Blanca: white houses, cobbled lanes, the blue church dome glowing gold in the sunset light. Overnight: Altea area or Camping Cap Blanch near l'Albir beach.",
        de: "Über Calpe thront der Peñón de Ifach — 332 Meter Fels, der direkt aus dem Meer ragt. Der Aufstieg dauert etwa 2 Stunden hin und zurück und bietet beeindruckende Ausblicke auf die Bucht (festes Schuhwerk erforderlich). Danach: ein Strandbistro am Fischerhafen von Calpe mit Fisch aus der Morgenauktion. Am Nachmittag 20 Minuten bis Altea, dem fotogensten Ort der Costa Blanca: weiße Häuser, Kopfsteinpflastergassen, blaue Kirchenkuppel im goldenen Abendsonnenlicht. Übernachtung: Stellplatz Altea oder Camping Cap Blanch beim Strand l'Albir.",
        it: "Sopra Calpe si erge il Peñón de Ifach — 332 metri di roccia che emerge direttamente dal mare. La salita richiede circa 2 ore andata e ritorno e offre viste straordinarie sulla baia (scarpe chiuse obbligatorie). Poi, un chiringuito accanto al porto peschereccio di Calpe con pesce dell'asta mattutina. Nel pomeriggio, 20 minuti fino ad Altea, il borgo più fotografato della Costa Blanca: case bianche, vicoli acciottolati, cupola blu della chiesa avvolta nella luce dorata del tramonto. Pernottamento: area di Altea o Camping Cap Blanch vicino alla spiaggia di l'Albir.",
        nl: "Boven Calpe torent de Peñón de Ifach — 332 meter rots die recht uit zee omhoogsteekt. De beklimming duurt ongeveer 2 uur heen en terug en beloont je met een indrukwekkend uitzicht over de baai (draag gesloten schoenen). Daarna: een strandbistro bij de vissershaven van Calpe met vis van de ochtendveiling. 's Middags, 20 minuten naar Altea, het meest fotogenieke dorp aan de Costa Blanca: witte huizen, geplaveide steegjes, blauwe kerkkoepel badend in gouden avondlicht. Overnachting: camperplaats Altea of Camping Cap Blanch bij strand l'Albir.",
        ru: "Над Кальпе возвышается Пеньон-де-Ифач — 332 метра скалы прямо из моря. Подъём занимает около 2 часов туда-обратно, с вершины — впечатляющий вид на бухту (берите закрытую обувь). После — чирингито у рыбацкого порта Кальпе с рыбой утреннего аукциона. Во второй половине дня — 20 минут до Альтеи, самого фотогеничного городка Коста-Бланки: белые дома, мощёные улочки, синий купол церкви в золотом закатном свете. Ночёвка: площадка Альтеи или Camping Cap Blanch у пляжа l'Albir.",
        uk: "Над Кальпе височіє Пеньон-де-Іфак — 332 метри скелі прямо з моря. Підйом займає близько 2 годин туди-назад, з вершини — вражаючий вид на бухту (беріть закрите взуття). Після — чірінгіто біля рибальського порту Кальпе з рибою ранкового аукціону. У другій половині дня — 20 хвилин до Альтеї, найфотогенічнішого містечка Коста-Бланки: білі будинки, бруковані вулички, синій купол церкви у золотому заходному світлі. Ночівля: майданчик Альтеї або Camping Cap Blanch біля пляжу l'Albir.",
      },
    },
    {
      photoSlot: "dia-4-raco-villajoyosa",
      image: "/images/routes/dia-4-raco-villajoyosa.jpg",
      altText: {
        es: "Casas de colores de Villajoyosa junto al mar — ruta autocaravana Costa Blanca",
        en: "Colourful seafront houses, Villajoyosa — Costa Blanca campervan route",
        de: "Bunte Haeuser am Meer, Villajoyosa — Wohnmobil-Route Costa Blanca",
        it: "Case colorate sul mare, Villajoyosa — itinerario camper Costa Blanca",
        nl: "Kleurrijke huizen aan zee, Villajoyosa — camperroute Costa Blanca",
        ru: "Разноцветные дома у моря в Вильяхойосе — маршрут на автодоме по Коста-Бланке",
        uk: "Різнобарвні будинки біля моря у Вільяхойосі — маршрут на автодімі по Коста-Бланці",
      },
      title: {
        es: "Día 4: Altea → Racó de Conill → Villajoyosa (25 km)",
        en: "Day 4: Altea → Racó de Conill → Villajoyosa (25 km)",
        de: "Tag 4: Altea → Racó de Conill → Villajoyosa (25 km)",
        it: "Giorno 4: Altea → Racó de Conill → Villajoyosa (25 km)",
        nl: "Dag 4: Altea → Racó de Conill → Villajoyosa (25 km)",
        ru: "День 4: Альтеа → Racó de Conill → Вильяхойоса (25 км)",
        uk: "День 4: Альтеа → Racó de Conill → Вільяхойоса (25 км)",
      },
      text: {
        es: "Un día de playas secretas. Entre Benidorm y Villajoyosa se esconde el Racó de Conill — cala de aguas cristalinas sin chiringuito ni música. Llega pronto. Parte de la cala es zona nudista, ambiente tranquilo. Por la tarde, Playa Paradís en Villajoyosa: arena dorada, aguas poco profundas para los niños, mucho menos masificada que Benidorm. Villajoyosa sorprende con sus casas de colores frente al mar y la fábrica de chocolate Valor, con museo gratuito y degustación. Noche: área de Villajoyosa, a 5 minutos a pie de la playa.",
        en: "A day for secret beaches. Tucked between Benidorm and Villajoyosa lies Racó de Conill — a crystal-clear cove with no bar or music. Arrive early. Part of the cove is a naturist zone; the atmosphere is calm throughout. In the afternoon, Playa Paradís in Villajoyosa: golden sand, shallow water great for children, and far fewer people than Benidorm. Villajoyosa surprises with its colourful seafront houses and the Valor chocolate factory, which has a free museum and tasting. Overnight: Villajoyosa stopover, 5 minutes' walk to the beach.",
        de: "Ein Tag für Geheimstrände. Zwischen Benidorm und Villajoyosa versteckt sich Racó de Conill — eine Bucht mit kristallklarem Wasser, ohne Bar oder Musik. Früh ankommen lohnt sich. Ein Teil der Bucht ist FKK-Zone, die Atmosphäre ist überall ruhig. Am Nachmittag: Playa Paradís in Villajoyosa — goldener Sand, flaches Wasser für Kinder, deutlich weniger Betrieb als in Benidorm. Villajoyosa überrascht mit seinen bunten Häusern am Meer und der Schokoladenfabrik Valor mit kostenlosem Museum und Verkostung. Übernachtung: Stellplatz Villajoyosa, 5 Gehminuten zum Strand.",
        it: "Una giornata dedicata alle spiagge segrete. Tra Benidorm e Villajoyosa si nasconde Racó de Conill — una cala dalle acque cristalline senza bar né musica. Arrivate presto. Parte della cala è zona naturista; l'atmosfera è tranquilla ovunque. Nel pomeriggio, Playa Paradís a Villajoyosa: sabbia dorata, acque basse ideali per i bambini, molto meno affollata di Benidorm. Villajoyosa sorprende con le sue case colorate sul mare e la fabbrica di cioccolato Valor, con museo gratuito e degustazione. Pernottamento: area di Villajoyosa, 5 minuti a piedi dalla spiaggia.",
        nl: "Een dag voor geheime stranden. Tussen Benidorm en Villajoyosa verstopt zich Racó de Conill — een baai met kristalhelder water, zonder bar of muziek. Kom vroeg. Een deel van de baai is naturistenzone; de sfeer is overal rustig. 's Middags: Playa Paradís in Villajoyosa — goudkleurig zand, ondiep water voor kinderen en veel minder mensen dan in Benidorm. Villajoyosa verrast met zijn kleurrijke huizen aan zee en de chocoladefabriek Valor met een gratis museum en proeverij. Overnachting: camperplaats Villajoyosa, 5 minuten lopen naar het strand.",
        ru: "День секретных пляжей. Между Бенидормом и Вильяхойосой прячется Racó de Conill — бухта с кристально чистой водой без чирингито и музыки. Приезжайте пораньше. Часть бухты — зона натуристов, атмосфера спокойная. Во второй половине дня — Playa Paradís в Вильяхойосе: золотой песок, мелководье для детей, гораздо меньше людей, чем в Бенидорме. Вильяхойоса удивляет разноцветными домами у моря и шоколадной фабрикой Valor с бесплатным музеем и дегустацией. Ночёвка: площадка Вильяхойосы, 5 минут пешком до пляжа.",
        uk: "День секретних пляжів. Між Бенідормом і Вільяхойосою ховається Racó de Conill — бухта з кришталево чистою водою без чірінгіто та музики. Приїжджайте раніше. Частина бухти — зона нудистів, атмосфера спокійна. У другій половині дня — Playa Paradís у Вільяхойосі: золотий пісок, мілководдя для дітей, набагато менше людей, ніж у Бенідормі. Вільяхойоса вражає різнобарвними будинками біля моря і шоколадною фабрикою Valor з безкоштовним музеєм і дегустацією. Ночівля: майданчик Вільяхойоси, 5 хвилин пішки до пляжу.",
      },
    },
    {
      photoSlot: "dia-5-alicante",
      image: "/images/routes/dia-5-alicante.jpg",
      altText: {
        es: "Castillo de Santa Bárbara sobre Alicante — ruta autocaravana Costa Blanca",
        en: "Santa Barbara castle over Alicante bay — Costa Blanca campervan route",
        de: "Burg Santa Barbara ueber Alicante — Wohnmobil-Route Costa Blanca",
        it: "Castello di Santa Barbara su Alicante — itinerario camper Costa Blanca",
        nl: "Kasteel Santa Barbara boven Alicante — camperroute Costa Blanca",
        ru: "Замок Санта-Барбара над Аликанте — маршрут на автодоме по Коста-Бланке",
        uk: "Замок Санта-Барбара над Аліканте — маршрут на автодімі по Коста-Бланці",
      },
      title: {
        es: "Día 5: Villajoyosa → Alicante → Valencia (180 km)",
        en: "Day 5: Villajoyosa → Alicante → Valencia (180 km)",
        de: "Tag 5: Villajoyosa → Alicante → Valencia (180 km)",
        it: "Giorno 5: Villajoyosa → Alicante → Valencia (180 km)",
        nl: "Dag 5: Villajoyosa → Alicante → Valencia (180 km)",
        ru: "День 5: Вильяхойоса → Аликанте → Валенсия (180 км)",
        uk: "День 5: Вільяхойоса → Аліканте → Валенсія (180 км)",
      },
      text: {
        es: "Final del recorrido: 30 minutos hasta Alicante. El castillo de Santa Bárbara (ascensor desde la playa del Postiguet) ofrece la mejor panorámica de la ciudad. La Explanada de España con su famoso mosaico ondulante, el Mercado Central para hacer compras para el camino de vuelta. Regreso a Valencia por la AP-7, ahora gratuita — menos de 2 horas.",
        en: "Final leg: 30 minutes to Alicante. Castillo de Santa Bárbara (lift from Postiguet beach) offers the best panorama of the city. The Explanada de España with its famous wave-pattern mosaic, the Mercado Central for provisions for the journey home. Return to Valencia via the AP-7, now toll-free — under 2 hours.",
        de: "Schlusstag: 30 Minuten bis Alicante. Die Burg Santa Bárbara (Lift vom Strand Postiguet) bietet das beste Panorama der Stadt. Die Explanada de España mit ihrem berühmten Wellenbodenbelag, der Mercado Central für Einkäufe für die Heimfahrt. Rückfahrt nach Valencia auf der AP-7, inzwischen mautfrei — unter 2 Stunden.",
        it: "Giornata finale: 30 minuti fino ad Alicante. Il Castello di Santa Bárbara (ascensore dalla spiaggia del Postiguet) offre il panorama più bello della città. L'Explanada de España con il suo celebre mosaico ondulato, il Mercado Central per gli acquisti per il viaggio di ritorno. Ritorno a Valencia sull'AP-7, ora gratuita — meno di 2 ore.",
        nl: "Laatste dag: 30 minuten naar Alicante. Castillo de Santa Bárbara (lift vanaf strand Postiguet) biedt het mooiste panorama van de stad. De Explanada de España met zijn beroemde golvende mozaïek, de Mercado Central voor aankopen voor de terugreis. Terug naar Valencia via de AP-7, inmiddels tolvrij — minder dan 2 uur.",
        ru: "Финал: 30 минут до Аликанте. Замок Санта-Барбара (лифт от пляжа Postiguet) — лучшая панорама города. Explanada de España со знаменитой волнистой мозаикой, Центральный рынок для покупок в дорогу. Возвращение в Валенсию по бесплатной AP-7 — менее 2 часов.",
        uk: "Фінал: 30 хвилин до Аліканте. Замок Санта-Барбара (ліфт від пляжу Postiguet) — найкраща панорама міста. Explanada de España зі знаменитою хвилястою мозаїкою, Центральний ринок для покупок у дорогу. Повернення до Валенсії по безкоштовному AP-7 — менше 2 годин.",
      },
    },
  ],

  tips: [
    {
      tip: {
        es: "Agua y vaciado: las áreas de Gandía, Altea y Villajoyosa tienen servicio completo. En los campings está incluido en el precio.",
        en: "Water and waste disposal: the stopovers in Gandía, Altea and Villajoyosa offer full service. At campsites it is included in the price.",
        de: "Wasser und Entsorgung: die Stellplätze in Gandía, Altea und Villajoyosa bieten Vollservice. Auf Campingplätzen ist es im Preis inbegriffen.",
        it: "Acqua e scarico: le aree di Gandía, Altea e Villajoyosa hanno servizio completo. Nei campeggi è incluso nel prezzo.",
        nl: "Water en afvoer: de camperplaatsen in Gandía, Altea en Villajoyosa bieden volledige service. Op campings is het inbegrepen in de prijs.",
        ru: "Вода и слив: площадки Гандии, Альтеи и Вильяхойосы имеют полный сервис. В кемпингах включено в стоимость.",
        uk: "Вода та злив: майданчики Гандії, Альтеї та Вільяхойоси мають повний сервіс. У кемпінгах включено у вартість.",
      },
    },
    {
      tip: {
        es: "App imprescindible: Park4Night para encontrar áreas, puntos de agua y lugares donde pernoctar — la comunidad caravanista comparte reseñas actualizadas en tiempo real.",
        en: "Essential app: Park4Night for finding stopovers, water points and overnight spots — the van-life community shares up-to-date reviews in real time.",
        de: "Unverzichtbare App: Park4Night für die Suche nach Stellplätzen, Wasserpunkten und Übernachtungsorten — die Wohnmobil-Community teilt aktuelle Bewertungen in Echtzeit.",
        it: "App indispensabile: Park4Night per trovare aree di sosta, punti d'acqua e posti dove dormire — la comunità camperistica condivide recensioni aggiornate in tempo reale.",
        nl: "Onmisbare app: Park4Night voor het vinden van camperplaatsen, waterpunten en overnachtingsplekken — de campergemeenschap deelt actuele beoordelingen in real time.",
        ru: "Приложение: рекомендуем Park4Night для поиска площадок, точек воды и мест ночёвки — сообщество кэмперов делится актуальными отзывами в режиме реального времени.",
        uk: "Застосунок: рекомендуємо Park4Night для пошуку майданчиків, точок води та місць ночівлі — спільнота кемперів ділиться актуальними відгуками в режимі реального часу.",
      },
    },
    {
      tip: {
        es: "Temporada alta (julio-agosto): reserva el Wecamp Jávea y los campings con 2-3 semanas de antelación. Las áreas públicas son de libre acceso — llega antes de las 12:00 para asegurar plaza.",
        en: "High season (July–August): book Wecamp Jávea and campsites 2–3 weeks in advance. Public stopovers are first-come first-served — arrive before noon to secure a spot.",
        de: "Hauptsaison (Juli–August): Wecamp Jávea und Campingplätze 2–3 Wochen im Voraus buchen. Öffentliche Stellplätze funktionieren nach dem Prinzip 'Wer zuerst kommt' — vor 12 Uhr ankommen.",
        it: "Alta stagione (luglio-agosto): prenotate Wecamp Jávea e i campeggi con 2-3 settimane di anticipo. Le aree pubbliche sono a disponibilità libera — arrivate prima di mezzogiorno per assicurarvi un posto.",
        nl: "Hoogseizoen (juli-augustus): boek Wecamp Jávea en campings 2-3 weken van tevoren. Publieke camperplaatsen zijn op volgorde van binnenkomst — kom voor 12 uur aan om zeker een plek te hebben.",
        ru: "Высокий сезон (июль-август): бронируйте Wecamp Jávea и кемпинги за 2-3 недели. Публичные площадки — в порядке живой очереди; приезжайте до 12:00, чтобы занять место.",
        uk: "Високий сезон (липень-серпень): бронюйте Wecamp Jávea та кемпінги за 2-3 тижні. Публічні майданчики — у порядку живої черги; приїжджайте до 12:00, щоб зайняти місце.",
      },
    },
    {
      tip: {
        es: "Combustible: repostar en Valencia o Gandía es notablemente más barato que en los pueblos costeros. Llena el depósito antes de salir.",
        en: "Fuel: filling up in Valencia or Gandía is noticeably cheaper than in the coastal resorts. Fill the tank before you leave.",
        de: "Kraftstoff: Tanken in Valencia oder Gandía ist deutlich günstiger als in den Küstenorten. Den Tank vor der Abfahrt füllen.",
        it: "Carburante: fare rifornimento a Valencia o Gandía è sensibilmente più conveniente che nei borghi costieri. Fate il pieno prima di partire.",
        nl: "Brandstof: tanken in Valencia of Gandía is merkbaar goedkoper dan in de kustplaatsen. Vul de tank voordat je vertrekt.",
        ru: "Заправки: заправляться в Валенсии или Гандии заметно дешевле, чем в прибрежных посёлках. Заполните бак перед выездом.",
        uk: "Заправки: заправлятись у Валенсії або Гандії помітно дешевше, ніж у прибережних селищах. Заповніть бак перед виїздом.",
      },
    },
    {
      tip: {
        es: "Conducción: la N-332 es pintoresca pero en verano está saturada. La AP-7 discurre en paralelo y ahora es completamente gratuita — úsala en los tramos largos.",
        en: "Driving: the N-332 is scenic but congested in summer. The AP-7 runs parallel and is now completely toll-free — use it for the longer stretches.",
        de: "Fahren: Die N-332 ist malerisch, im Sommer aber stark befahren. Die AP-7 verläuft parallel und ist inzwischen vollständig mautfrei — auf den längeren Abschnitten nutzen.",
        it: "Guida: la N-332 è panoramica ma in estate è molto trafficata. L'AP-7 corre parallela ed è ora completamente gratuita — usatela per i tratti più lunghi.",
        nl: "Rijden: de N-332 is schilderachtig maar 's zomers druk. De AP-7 loopt parallel en is inmiddels volledig tolvrij — gebruik hem voor de langere stukken.",
        ru: "Вождение: N-332 живописная, но летом загружена. AP-7 идёт параллельно и теперь полностью бесплатна — используйте её на длинных участках.",
        uk: "Водіння: N-332 мальовнича, але влітку завантажена. AP-7 іде паралельно і тепер повністю безкоштовна — використовуйте її на довгих ділянках.",
      },
    },
  ],

  ctaText: {
    es: "Nuestro McLouis Yearling 89G es ideal para esta ruta autocaravana Costa Blanca: compacto para las carreteras costeras, con aire acondicionado, equipado con todo lo necesario — incluyendo 3 sillas de playa y cocina de gas exterior para cenar junto al mar.",
    en: "Our McLouis Yearling 89G is perfect for this route: compact enough for coastal roads, air-conditioned and fully equipped — including 3 beach chairs and an outdoor gas stove for dinner by the sea.",
    de: "Unser McLouis Yearling 89G ist perfekt für diese Route: kompakt genug für Küstenstraßen, klimatisiert und komplett ausgestattet — inklusive 3 Strandstühlen und einem Outdoor-Gaskocher für das Abendessen am Meer.",
    it: "Il nostro McLouis Yearling 89G è perfetto per questo itinerario: compatto per le strade costiere, con aria condizionata e dotato di tutto — incluse 3 sedie da spiaggia e un fornello a gas da esterno per la cena in riva al mare.",
    nl: "Onze McLouis Yearling 89G is ideaal voor deze route: compact genoeg voor kustroutes, met airconditioning en volledig uitgerust — inclusief 3 strandstoelen en een outdoor gaskookplaat voor een diner aan zee.",
    ru: "Наш McLouis Yearling 89G идеален для этого маршрута: компактный для прибрежных дорог, с кондиционером, укомплектован всем — включая 3 пляжных кресла и уличную газовую плиту для ужина у моря.",
    uk: "Наш McLouis Yearling 89G ідеальний для цього маршруту: компактний для прибережних доріг, з кондиціонером, укомплектований усім — включаючи 3 пляжних крісла та вуличну газову плиту для вечері біля моря.",
  },
  ctaButton: {
    es: "Reservar fechas",
    en: "Book your dates",
    de: "Termine buchen",
    it: "Prenota le date",
    nl: "Boek je data",
    ru: "Забронировать даты",
    uk: "Забронювати дати",
  },
};

// ─── Valencia → Barcelona ─────────────────────────────────────────────────────

const valenciaBarcalona: RouteContent = {
  slug: "valencia-barcelona",

  metaTitle: {
    es: "Ruta Autocaravana Valencia Barcelona: Delta del Ebro y Costa Dorada en 5 Días | Camper Retreat VLC",
    en: "Valencia to Barcelona Campervan Route: Northern Coast in 4-5 Days | Camper Retreat VLC",
    de: "Wohnmobil-Route Valencia–Barcelona: Nordküste in 4-5 Tagen | Camper Retreat VLC",
    it: "Itinerario Camper Valencia–Barcellona: Costa Nord in 4-5 Giorni | Camper Retreat VLC",
    nl: "Camperroute Valencia–Barcelona: Noordkust in 4-5 Dagen | Camper Retreat VLC",
    ru: "Маршрут на автодоме Валенсия–Барселона: северное побережье за 4-5 дней | Camper Retreat VLC",
    uk: "Маршрут на автодімі Валенсія–Барселона: північне узбережжя за 4-5 днів | Camper Retreat VLC",
  },

  metaDescription: {
    es: "Ruta autocaravana Valencia Barcelona en 5 días: Peñíscola, delta del ebro autocaravana, Tarragona, Sitges y Barcelona. Viajar en autocaravana costa dorada desde 105 €/noche. Guía completa con áreas de servicio.",
    en: "Valencia to Barcelona campervan route in 5 days: Peñíscola, Ebro Delta, Tarragona, Sitges and Barcelona. Complete guide with motorhome stopovers, practical tips and budget breakdown.",
    de: "Wohnmobil-Route Valencia–Barcelona in 5 Tagen: Peñíscola, Ebro-Delta, Tarragona, Sitges und Barcelona. Vollständiger Guide mit Stellplätzen, Tipps und Kostenübersicht.",
    it: "Itinerario camper Valencia–Barcellona in 5 giorni: Peñíscola, Delta dell'Ebro, Tarragona, Sitges e Barcellona. Guida completa con aree di sosta e consigli pratici.",
    nl: "Camperroute Valencia–Barcelona in 5 dagen: Peñíscola, Ebrodelta, Tarragona, Sitges en Barcelona. Complete gids met camperplaatsen, tips en budget.",
    ru: "Маршрут на автодоме из Валенсии в Барселону за 5 дней: Пеньискола, дельта Эбро, Таррагона, Ситжес и Барселона. Полный гид с площадками и советами.",
    uk: "Маршрут на автодімі з Валенсії до Барселони за 5 днів: Пеньіскола, дельта Ебро, Таррагона, Сітжес та Барселона. Повний гід з майданчиками та порадами.",
  },

  heroTitle: {
    es: "Ruta autocaravana Valencia–Barcelona: delta del Ebro y Costa Dorada en 5 días",
    en: "Valencia to Barcelona Campervan Route: Northern Coast in 4-5 Days",
    de: "Wohnmobil-Route Valencia–Barcelona: Nordküste in 4-5 Tagen",
    it: "Itinerario Camper Valencia–Barcellona: Costa Nord in 4-5 Giorni",
    nl: "Camperroute Valencia–Barcelona: Noordkust in 4-5 Dagen",
    ru: "Путешествие на автодоме из Валенсии в Барселону: северное побережье за 4-5 дней",
    uk: "Подорож на автодімі з Валенсії до Барселони: північне узбережжя за 4-5 днів",
  },

  heroSubtitle: {
    es: "Fortalezas medievales, el Delta del Ebro con flamencos rosas, las cimas de Sitges y el final en la capital catalana — un itinerario en que cada día es completamente distinto.",
    en: "Medieval fortresses, the Ebro Delta with pink flamingos, the coves of Sitges and a grand finale in the Catalan capital — an itinerary where every day is completely different.",
    de: "Mittelalterliche Festungen, das Ebro-Delta mit rosa Flamingos, die Buchten von Sitges und das Finale in der katalanischen Hauptstadt — eine Route, bei der jeder Tag voellig anders ist.",
    it: "Fortezze medievali, il Delta dell'Ebro con fenicotteri rosa, le calette di Sitges e il gran finale nella capitale catalana — un itinerario in cui ogni giorno e' completamente diverso.",
    nl: "Middeleeuwse vestingen, de Ebrodelta met roze flamingo's, de baaien van Sitges en het slotakkoord in de Catalaanse hoofdstad — een route waarbij elke dag compleet anders is.",
    ru: "Античные крепости, дельта Эбро с розовыми фламинго, винные бухты Ситжеса и финал в столице Каталонии — маршрут, в котором каждый день не похож на предыдущий.",
    uk: "Античні фортеці, дельта Ебро з рожевими фламінго, бухти Сітжеса та фінал у столиці Каталонії — маршрут, де кожен день не схожий на попередній.",
  },

  intro: {
    es: "La carretera al norte desde Valencia es pura diversidad. En 4-5 días descubrirás una ciudad medieval encaramada en una roca, la mayor zona arrocera de España, una de las joyas naturales más impresionantes del Mediterráneo — el delta del Ebro — y cerrarás el viaje en Barcelona. Esta ruta autocaravana Valencia Barcelona está diseñada para que el último tramo de vuelta se haga en una sola mañana por la AP-7, ahora gratuita. Es también uno de los más económicos: casi todas las noches son posibles en áreas municipales gratuitas o de bajo coste. Viajar en autocaravana costa dorada es una experiencia única que combina naturaleza, historia y gastronomía. Distancia: ~700 km. Mejor época: abril-junio y septiembre-octubre.",
    en: "The road north from Valencia is pure variety. In 4-5 days you'll discover a medieval city perched on a rock, Spain's largest rice-growing region, one of the Mediterranean's greatest natural gems — the Ebro Delta — and cap it all off in Barcelona. The route is designed so the final leg home takes just one morning along the now toll-free AP-7. It's also one of the most budget-friendly itineraries: almost every overnight is possible at free or low-cost municipal stopovers. Distance: ~700 km. Best time: April–June and September–October.",
    de: "Die Strecke nach Norden aus Valencia ist pure Abwechslung. In 4-5 Tagen entdeckst du eine auf einem Fels thronende mittelalterliche Stadt, Spaniens groesstes Reisanbaugebiet, eines der bedeutendsten Naturjuwele des Mittelmeers — das Ebro-Delta — und schliessst die Reise in Barcelona ab. Die Route ist so geplant, dass die Rueckfahrt in einem einzigen Morgen auf der inzwischen mautfreien AP-7 bewaeltigt werden kann. Es ist auch eine der preiswertesten Routen: Fast alle Uebernachtungen sind auf kostenlosen oder guenstigen Kommunalstellplaetzen moeglich. Strecke: ca. 700 km. Beste Reisezeit: April bis Juni und September bis Oktober.",
    it: "La strada verso nord da Valencia e' pura varieta'. In 4-5 giorni scoprirete una citta' medievale arroccata su una roccia, la piu' grande zona di produzione del riso in Spagna, una delle piu' grandi gemme naturali del Mediterraneo — il Delta dell'Ebro — e chiuderete il viaggio a Barcellona. Il percorso e' pensato affinche' l'ultima tappa di ritorno si percorra in una sola mattinata sull'AP-7, ora gratuita. E' anche uno degli itinerari piu' economici: quasi tutte le notti sono possibili in aree di sosta municipali gratuite o a basso costo. Distanza: circa 700 km. Periodo migliore: aprile-giugno e settembre-ottobre.",
    nl: "De weg naar het noorden vanuit Valencia is pure variatie. In 4-5 dagen ontdek je een middeleeuwse stad op een rots, Spanje's grootste rijstgebied, een van de grootste natuurparels van de Middellandse Zee — de Ebrodelta — en sluit je de reis af in Barcelona. De route is zo ontworpen dat de laatste etappe terug een ochtend kost over de inmiddels tolvrije AP-7. Het is ook een van de voordeligste routes: bijna alle overnachtingen zijn mogelijk op gratis of goedkope gemeentelijke camperplaatsen. Afstand: ca. 700 km. Beste reistijd: april-juni en september-oktober.",
    ru: "Дорога на север из Валенсии — это разнообразие. За 4-5 дней вы увидите средневековый город на скале, крупнейший рисовый регион Испании, одну из главных природных жемчужин Средиземноморья — дельту реки Эбро — и завершите путешествие в Барселоне. Маршрут построен так, что финальный перегон обратно занимает одно утро по бесплатной AP-7. Это один из самых экономичных маршрутов: почти все ночёвки возможны на бесплатных или недорогих муниципальных площадках. Дистанция: ~700 км. Лучшее время: апрель-июнь и сентябрь-октябрь.",
    uk: "Дорога на північ з Валенсії — це різноманіття. За 4-5 днів ви побачите середньовічне місто на скелі, найбільший рисовий регіон Іспанії, одну з головних природних перлин Середземномор'я — дельту ріки Ебро — і завершите подорож у Барселоні. Маршрут побудований так, що фінальний переїзд назад займає один ранок по безкоштовному AP-7. Це один з найекономічніших маршрутів: майже всі ночівлі можливі на безкоштовних або дешевих муніципальних майданчиках. Відстань: ~700 км. Найкращий час: квітень-червень та вересень-жовтень.",
  },

  days: [
    {
      photoSlot: "dia-1-peniscola",
      title: {
        es: "Día 1: Valencia → Sagunto → Peñíscola (150 km)",
        en: "Day 1: Valencia → Sagunto → Peñíscola (150 km)",
        de: "Tag 1: Valencia → Sagunto → Peniscola (150 km)",
        it: "Giorno 1: Valencia → Sagunto → Peniscola (150 km)",
        nl: "Dag 1: Valencia → Sagunto → Peniscola (150 km)",
        ru: "День 1: Валенсия → Сагунто → Пеньискола (150 км)",
        uk: "День 1: Валенсія → Сагунто → Пеньіскола (150 км)",
      },
      text: {
        es: "Primera parada a 30 minutos de Valencia: Sagunto, con su teatro romano y una fortaleza de un kilómetro de largo en lo alto del cerro — acceso gratuito y vistas sobre los naranjales hasta el mar. Luego, hora y veinte por la AP-7 hasta Peñíscola. El casco antiguo sobre la roca, rodeado de mar por tres lados, es conocido como el Gibraltar Valenciano. El castillo de los Templarios — escenario de Juego de Tronos —, las callejuelas encaladas y la playa junto a las murallas son parada obligatoria. La vista sobre el casco antiguo desde la playa norte es la postal clásica, especialmente al atardecer. Noche: área de autocaravanas de Peñíscola — amplia, a 10 minutos a pie de la playa, con agua y vaciado.",
        en: "First stop, 30 minutes from Valencia: Sagunto, with its Roman theatre and a kilometre-long hilltop fortress — free to visit, with views over orange groves all the way to the sea. Then an hour and twenty minutes up the AP-7 to Peniscola. The old town on its rock, surrounded by sea on three sides, is known as the Gibraltar of Valencia. The Knights Templar castle — a Game of Thrones filming location —, whitewashed lanes and a beach beside the walls are unmissable. The view over the old town from the north beach is the classic postcard shot, especially at sunset. Overnight: the Peniscola motorhome area — spacious, 10 minutes' walk to the beach, with water and waste disposal.",
        de: "Erste Station, 30 Minuten von Valencia entfernt: Sagunto mit seinem roemischen Theater und einer kilometerlangen Burganlage auf dem Huegelkamm — kostenlos zu besichtigen, mit Blick ueber Orangenhaine bis zum Meer. Dann eineinhalb Stunden auf der AP-7 bis Peniscola. Die Altstadt auf dem Fels, von drei Seiten vom Meer umgeben, wird als das Gibraltar Valencias bezeichnet. Die Templerburg — Drehort fuer Game of Thrones —, die weiss getuenchten Gassen und der Strand an den Stadtmauern sind ein Muss. Der Blick auf die Altstadt vom Nordstrand aus ist die klassische Ansichtskarte, besonders im Abendlicht. Uebernachtung: Wohnmobilstellplatz Peniscola — weitlaeu fig, 10 Gehminuten zum Strand, mit Wasser und Entsorgung.",
        it: "Prima tappa, a 30 minuti da Valencia: Sagunto, con il suo teatro romano e una fortezza di un chilometro in cima alla collina — ingresso gratuito, con viste sugli agrumeti fino al mare. Poi un'ora e venti sull'AP-7 fino a Peniscola. Il centro storico sulla roccia, circondato dal mare su tre lati, e' noto come la Gibilterra valenciana. Il castello dei Templari — location di Game of Thrones —, i vicoli imbiancati a calce e la spiaggia accanto alle mura sono imperdibili. La vista sul centro storico dalla spiaggia nord e' la cartolina classica, soprattutto al tramonto. Pernottamento: area camper di Peniscola — ampia, a 10 minuti a piedi dalla spiaggia, con acqua e scarico.",
        nl: "Eerste stop, 30 minuten van Valencia: Sagunto, met zijn Romeins theater en een kilometerslange vesting op de heuvelrug — gratis te bezoeken, met uitzicht over sinaasappelgaarden tot aan de zee. Daarna anderhalf uur over de AP-7 naar Peniscola. De oude stad op de rots, aan drie kanten omgeven door zee, staat bekend als het Gibraltar van Valencia. Het kasteel van de Tempeliers — een filmlocatie van Game of Thrones —, de gekalkte straatjes en het strand bij de stadsmuren zijn een must. Het uitzicht op de oude stad vanaf het noordstrand is de klassieke ansichtkaart, zeker bij zonsondergang. Overnachting: camperplaats Peniscola — ruim, 10 minuten lopen van het strand, met water en afvoer.",
        ru: "Первая остановка в 30 минутах от Валенсии — Сагунто: римский театр и километровая крепость на хребте холма, бесплатный подъём и виды на апельсиновые плантации до моря. Дальше — час двадцать по AP-7 до Пеньисколы. Старый город на скале, окружённый морем с трёх сторон, называют Гибралтаром Валенсии. Замок тамплиеров, где снимали Игру престолов, белёные улочки и пляж у крепостных стен. Вид на старый город с северного пляжа — классическая открытка, особенно на закате. Ночёвка: área de autocaravanas Peñíscola — большая площадка в 10 минутах пешком от пляжа, с водой и сливом.",
        uk: "Перша зупинка за 30 хвилин від Валенсії — Сагунто: римський театр і кілометрова фортеця на хребті пагорба, безкоштовний підйом і краєвиди на апельсинові плантації до моря. Далі — година двадцять по AP-7 до Пеньісколи. Старе місто на скелі, оточене морем з трьох боків, називають Гібралтаром Валенсії. Замок тамплієрів, де знімали Гру престолів, побілені вулички і пляж біля фортечних мурів. Вид на старе місто з північного пляжу — класична листівка, особливо на заході сонця. Ночівля: área de autocaravanas Peñíscola — великий майданчик за 10 хвилин пішки від пляжу, з водою та зливом.",
      },
    },
    {
      photoSlot: "dia-2-delta-ebro",
      title: {
        es: "Día 2: Peñíscola → Delta del Ebro (80 km)",
        en: "Day 2: Peniscola → Ebro Delta (80 km)",
        de: "Tag 2: Peniscola → Ebro-Delta (80 km)",
        it: "Giorno 2: Peniscola → Delta dell'Ebro (80 km)",
        nl: "Dag 2: Peniscola → Ebrodelta (80 km)",
        ru: "День 2: Пеньискола → Дельта Эбро (80 км)",
        uk: "День 2: Пеньіскола → Дельта Ебро (80 км)",
      },
      text: {
        es: "Una hora de trayecto y el paisaje cambia radicalmente: arrozales hasta el horizonte, canales, garzas y flamencos rosas. El Delta del Ebro es el segundo mayor humedal del Mediterráneo occidental — un paraíso para la delta del ebro autocaravana. Qué hacer: pedalear en bici por los diques entre los arrozales, llegar caminando al faro del Fangar a través de las dunas, probar el arroz local en los restaurantes de Poble Nou del Delta. Al atardecer, ve a la laguna de la Encanyissada, donde se alimentan los flamencos: siluetas rosas en agua dorada — el mejor plano de todo el itinerario. Noche: área en Deltebre o Sant Jaume d'Enveja. Tranquilo, oscuro; por la mañana solo te despiertan los pájaros.",
        en: "One hour of driving and the landscape changes completely: rice paddies to the horizon, canals, herons and pink flamingos. The Ebro Delta is the second-largest wetland in the western Mediterranean. Things to do: cycle along the dykes between the rice fields, walk to the Fangar lighthouse through the dunes, try the local rice at restaurants in Poble Nou del Delta. At sunset, head to the Encanyissada lagoon where flamingos feed: pink silhouettes against golden water — the best shot of the whole trip. Overnight: stopover in Deltebre or Sant Jaume d'Enveja. Quiet, dark; in the morning only birdsong wakes you.",
        de: "Eine Stunde Fahrt und die Landschaft aendert sich schlagartig: Reisfelder bis zum Horizont, Kanaele, Reiher und rosa Flamingos. Das Ebro-Delta ist das zweitgroesste Feuchtgebiet im westlichen Mittelmeer. Aktivitaeten: Radfahren auf den Daemmen zwischen den Reisfeldern, zu Fuss zum Leuchtturm Fangar durch die Duenen, lokalen Reis in den Restaurants von Poble Nou del Delta probieren. Bei Sonnenuntergang zur Lagune Encanyissada fahren, wo Flamingos fressen: rosa Silhouetten im goldenen Wasser — der schoenste Schnappschuss der ganzen Tour. Uebernachtung: Stellplatz in Deltebre oder Sant Jaume d'Enveja. Ruhig, dunkel; morgens wecken nur Voegel.",
        it: "Un'ora di guida e il paesaggio cambia radicalmente: risaie a perdita d'occhio, canali, aironi e fenicotteri rosa. Il Delta dell'Ebro e' la seconda zona umida piu' grande del Mediterraneo occidentale. Cosa fare: pedalare sugli argini tra le risaie, raggiungere a piedi il faro del Fangar attraverso le dune, assaggiare il riso locale nei ristoranti di Poble Nou del Delta. Al tramonto, dirigetevi alla laguna dell'Encanyissada, dove si nutrono i fenicotteri: sagome rosa sull'acqua dorata — lo scatto piu' bello di tutto l'itinerario. Pernottamento: area a Deltebre o Sant Jaume d'Enveja. Silenzio, buio; al mattino vi svegliano solo gli uccelli.",
        nl: "Een uur rijden en het landschap verandert volledig: rijstvelden tot aan de horizon, kanalen, reigers en roze flamingo's. De Ebrodelta is het op een na grootste waterrijke gebied in de westelijke Middellandse Zee. Wat te doen: fietsen over de dijken tussen de rijstvelden, wandelen naar de vuurtoren van Fangar door de duinen, lokale rijst proeven in de restaurants van Poble Nou del Delta. Bij zonsondergang naar de lagune Encanyissada, waar flamingo's foerageren: roze silhouetten tegen gouden water — de mooiste foto van de hele trip. Overnachting: camperplaats in Deltebre of Sant Jaume d'Enveja. Stil, donker; 's ochtends wekken alleen vogels je.",
        ru: "Час пути — и пейзаж меняется радикально: рисовые поля до горизонта, каналы, цапли и розовые фламинго. Дельта Эбро — второй по величине водно-болотный заповедник Западного Средиземноморья. Что делать: прокатиться на велосипедах по дамбам между рисовых полей, дойти до маяка Fangar через дюны, попробовать местный рис в ресторанах Poble Nou del Delta. На закате — к лагуне Encanyissada, где кормятся фламинго: розовые силуэты в золотой воде — лучший кадр всего маршрута. Ночёвка: área в Deltebre или Sant Jaume d'Enveja. Тихо, темно, утром будят только птицы.",
        uk: "Година шляху — і пейзаж змінюється кардинально: рисові поля до горизонту, канали, чаплі та рожеві фламінго. Дельта Ебро — другий за величиною водно-болотний заповідник Західного Середземномор'я. Що робити: прокататись на велосипеді по дамбах між рисовими полями, дійти до маяка Fangar через дюни, скуштувати місцевий рис у ресторанах Poble Nou del Delta. На заході сонця — до лагуни Encanyissada, де годуються фламінго: рожеві силуети в золотій воді — найкращий кадр всього маршруту. Ночівля: área в Deltebre або Sant Jaume d'Enveja. Тихо, темно, вранці будять тільки птахи.",
      },
    },
    {
      photoSlot: "dia-3-tarragona-sitges",
      title: {
        es: "Día 3: Delta del Ebro → Tarragona → Sitges (120 km)",
        en: "Day 3: Ebro Delta → Tarragona → Sitges (120 km)",
        de: "Tag 3: Ebro-Delta → Tarragona → Sitges (120 km)",
        it: "Giorno 3: Delta dell'Ebro → Tarragona → Sitges (120 km)",
        nl: "Dag 3: Ebrodelta → Tarragona → Sitges (120 km)",
        ru: "День 3: Дельта Эбро → Таррагона → Ситжес (120 км)",
        uk: "День 3: Дельта Ебро → Таррагона → Сітжес (120 км)",
      },
      text: {
        es: "Por la mañana, Tarragona, capital romana de Hispania: el anfiteatro sobre el mar, el acueducto de Les Ferreres y la catedral gótica. Para el almuerzo, el Mercado Central: marisco a la mitad del precio de Barcelona. Al caer la tarde, 40 minutos hasta Sitges, el pueblo más elegante de la costa catalana: casas blancas, 17 playas, galerías de arte y un paseo con palmeras. La iglesia de Sant Bartomeu sobre la roca es el símbolo de Sitges. Noche: Camping Sitges — a pie del centro, abierto todo el año; en verano reserva con antelación.",
        en: "Morning in Tarragona, Roman capital of Hispania: the amphitheatre above the sea, the Les Ferreres aqueduct and the Gothic cathedral. Lunch at the Mercat Central: seafood at half the Barcelona price. In the late afternoon, 40 minutes to Sitges, the chicest town on the Catalan coast: white houses, 17 beaches, art galleries and a palm-lined promenade. The church of Sant Bartomeu on the rock is the symbol of Sitges. Overnight: Camping Sitges — walking distance from the centre, open year-round; book ahead in summer.",
        de: "Morgens Tarragona, die antike Hauptstadt der roemischen Hispania: das Amphitheater ueber dem Meer, das Aquaedukt Les Ferreres und die gotische Kathedrale. Mittagessen auf dem Mercado Central: Meeresfruechte zur Haelfte des Barceloneser Preises. Am Nachmittag 40 Minuten bis Sitges, dem schicksten Ort der katalanischen Kueste: weisse Haeuser, 17 Straende, Kunstgalerien und eine Palmenpromenade. Die Kirche Sant Bartomeu auf dem Fels ist das Wahrzeichen von Sitges. Uebernachtung: Camping Sitges, zu Fuss ins Zentrum, ganzjaehrig geoeffnet — im Sommer im Voraus buchen.",
        it: "Mattinata a Tarragona, capitale romana dell'Hispania: l'anfiteatro sul mare, l'acquedotto di Les Ferreres e la cattedrale gotica. Pranzo al Mercat Central: frutti di mare a meta' del prezzo di Barcellona. Nel tardo pomeriggio, 40 minuti fino a Sitges, il paese piu' elegante della costa catalana: case bianche, 17 spiagge, gallerie d'arte e un lungomare con palme. La chiesa di Sant Bartomeu sulla roccia e' il simbolo di Sitges. Pernottamento: Camping Sitges, a piedi dal centro, aperto tutto l'anno — prenotate in anticipo d'estate.",
        nl: "Ochtend in Tarragona, de Romeinse hoofdstad van Hispania: het amfitheater boven zee, het aquaduct van Les Ferreres en de gotische kathedraal. Lunch op de Mercat Central: zeevruchten voor de helft van de Barcelonese prijs. In de middag, 40 minuten naar Sitges, het chicste stadje van de Catalaanse kust: witte huizen, 17 stranden, kunstgalerijen en een palmboulevard. De kerk Sant Bartomeu op de rots is het symbool van Sitges. Overnachting: Camping Sitges, op loopafstand van het centrum, het hele jaar geopend — in de zomer van tevoren boeken.",
        ru: "Утром — Таррагона, античная столица римской Испании: амфитеатр над морем, акведук Les Ferreres, готический собор. На обед — рынок Central: морепродукты вдвое дешевле барселонских. К вечеру — 40 минут до Ситжеса, самого стильного городка каталонского побережья: белые дома, 17 пляжей, арт-галереи, набережная с пальмами. Церковь Sant Bartomeu на скале над пляжем — символ Ситжеса. Ночёвка: Camping Sitges — пешком до центра, работает круглый год; летом бронируйте заранее.",
        uk: "Вранці — Таррагона, антична столиця римської Іспанії: амфітеатр над морем, акведук Les Ferreres, готичний собор. На обід — ринок Central: морепродукти вдвічі дешевші за барселонські. Ввечері — 40 хвилин до Сітжеса, найстильнішого містечка каталонського узбережжя: білі будинки, 17 пляжів, арт-галереї, набережна з пальмами. Церква Sant Bartomeu на скелі над пляжем — символ Сітжеса. Ночівля: Camping Sitges — пішки до центру, працює цілий рік; влітку бронюйте заздалегідь.",
      },
    },
    {
      photoSlot: "dia-4-barcelona",
      title: {
        es: "Día 4: Sitges → Barcelona (40 km)",
        en: "Day 4: Sitges → Barcelona (40 km)",
        de: "Tag 4: Sitges → Barcelona (40 km)",
        it: "Giorno 4: Sitges → Barcellona (40 km)",
        nl: "Dag 4: Sitges → Barcelona (40 km)",
        ru: "День 4: Ситжес → Барселона (40 км)",
        uk: "День 4: Сітжес → Барселона (40 км)",
      },
      text: {
        es: "Media hora por la pintoresca C-32 costera y estás en Barcelona. ¿Dónde dejar el autocaravana? En el Área de Autocaravanas de Barcelona (zona Fòrum) — aparcamiento vigilado con servicios completos, 20 minutos en metro hasta el centro. Lo imprescindible: la Sagrada Família (entradas online con antelación), el Barrio Gótico, La Rambla y el Mercat de la Boqueria, la Barceloneta. Panorámica desde Montjuïc o el Parque Güell — al atardecer la ciudad se vuelve dorada. Consejo: no dejes la visita para el último día — pasea hoy, duerme en el área y sal tranquilo por la mañana.",
        en: "Half an hour along the scenic coastal C-32 and you're in Barcelona. Where to leave the motorhome? The Area de Autocaravanas de Barcelona (Forum district) — a supervised parking area with full services, 20 minutes by metro to the centre. Essentials: the Sagrada Familia (book online in advance!), the Gothic Quarter, La Rambla and Mercat de la Boqueria, Barceloneta beach. Panoramic views from Montjuic or Park Guell — at sunset the city turns golden. Tip: don't leave sightseeing to the last day — explore today, sleep at the stopover and leave calmly in the morning.",
        de: "Eine halbe Stunde auf der malerischen Kuestenstras se C-32 und du bist in Barcelona. Wo das Wohnmobil abstellen? Im Area de Autocaravanas de Barcelona (Forum-Viertel) — bewachter Stellplatz mit Vollservice, 20 Minuten mit der Metro ins Zentrum. Pflichtprogramm: Sagrada Familia (Tickets unbedingt online vorbuchen!), Gotisches Viertel, La Rambla und Mercat de la Boqueria, Barceloneta-Strand. Panorama von Montjuic oder Park Guell — bei Sonnenuntergang erstrahlt die Stadt golden. Tipp: Den Stadtbesuch nicht auf den letzten Tag verschieben — heute erkunden, am Stellplatz schlafen und morgen frueh entspannt losfahren.",
        it: "Mezz'ora sulla panoramica C-32 costiera e siete a Barcellona. Dove lasciare il camper? All'Area de Autocaravanas de Barcelona (zona Forum) — parcheggio sorvegliato con servizi completi, 20 minuti in metro dal centro. L'essenziale: la Sagrada Familia (biglietti online in anticipo!), il Quartiere Gotico, La Rambla e il Mercat de la Boqueria, la Barceloneta. Panorama da Montjuic o da Park Guell — al tramonto la citta' si tinge d'oro. Consiglio: non lasciate la visita all'ultimo giorno — girate oggi, dormite in area e partite sereni domani mattina.",
        nl: "Een halfuur over de schilderachtige kustweg C-32 en je bent in Barcelona. Waar de camper parkeren? Op de Area de Autocaravanas de Barcelona (Forum-wijk) — beveiligd terrein met volledige diensten, 20 minuten met de metro naar het centrum. Niet missen: de Sagrada Familia (kaartjes online vooruit boeken!), de Gotische Wijk, La Rambla en de Mercat de la Boqueria, strand Barceloneta. Panorama vanaf Montjuic of Park Guell — bij zonsondergang kleurt de stad goud. Tip: laat het stadsbezoek niet voor de laatste dag — verken vandaag, slaap op de camperplaats en vertrek morgenochtend ontspannen.",
        ru: "Полчаса по живописной прибрежной C-32 — и вы в Барселоне. Главный вопрос: где оставить автодом? Área de Autocaravanas de Barcelona (район Форум) — охраняемая площадка с сервисами, 20 минут на метро до центра. Классика: Саграда Фамилия (билеты онлайн заранее!), Готический квартал, Рамбла и рынок Бокерия, Барселонета. Панорама города с Монжуика или из парка Гуэля — на закате город становится золотым. Совет: не оставляйте осмотр города на последний день — погуляйте сегодня, переночуйте на площадке и спокойно выезжайте утром.",
        uk: "Пів години по мальовничій прибережній C-32 — і ви в Барселоні. Головне питання: де залишити автодім? Área de Autocaravanas de Barcelona (район Форум) — охоронювана стоянка з сервісами, 20 хвилин на метро до центру. Класика: Саграда Фаміліа (квитки онлайн заздалегідь!), Готичний квартал, Рамбла та ринок Бокерія, Барселонета. Панорама міста з Монжуіка або парку Гуєль — на заході сонця місто стає золотим. Порада: не залишайте огляд на останній день — гуляйте сьогодні, переночуйте на майданчику і спокійно виїжджайте вранці.",
      },
    },
    {
      photoSlot: "dia-5-regreso",
      title: {
        es: "Día 5: Barcelona → Valencia (350 km)",
        en: "Day 5: Barcelona → Valencia (350 km)",
        de: "Tag 5: Barcelona → Valencia (350 km)",
        it: "Giorno 5: Barcellona → Valencia (350 km)",
        nl: "Dag 5: Barcelona → Valencia (350 km)",
        ru: "День 5: Барселона → Валенсия (350 км)",
        uk: "День 5: Барселона → Валенсія (350 км)",
      },
      text: {
        es: "El tramo de vuelta por la AP-7 — 3,5 horas de conducción suave. La autopista es gratuita. Por el camino, comida en Peñíscola o Castellón, o sin paradas — y llegarás a tiempo para el último baño en la playa de la Malvarrosa de Valencia.",
        en: "The return leg via the AP-7 — 3.5 hours of easy driving. The motorway is toll-free. Stop for lunch in Peniscola or Castellon along the way, or drive straight through — you'll be back in time for a last swim at Valencia's Malvarrosa beach.",
        de: "Die Rueckfahrt auf der AP-7 — 3,5 Stunden angenehmes Fahren. Die Autobahn ist mautfrei. Unterwegs Mittagspause in Peniscola oder Castellon, oder ohne Zwischenstopp — und du kommst noch rechtzeitig zum letzten Bad am Strand von Valencia an.",
        it: "Il rientro sull'AP-7 — 3,5 ore di guida tranquilla. L'autostrada e' gratuita. Lungo la strada, pranzo a Peniscola o Castellon, oppure senza soste — e arriverete in tempo per l'ultimo bagno alla Malvarrosa di Valencia.",
        nl: "De terugreis over de AP-7 — 3,5 uur rustig rijden. De snelweg is tolvrij. Onderweg lunchen in Peniscola of Castellon, of rechtstreeks doorrijden — en je bent op tijd voor het laatste bad aan het Malvarrosa-strand van Valencia.",
        ru: "Обратный перегон по AP-7 — 3,5 часа чистой езды. Автострада бесплатная. По пути — обед в Пеньисколе или Кастельоне, или без остановок — и успеете на последнее купание на городском пляже Малварроса в Валенсии.",
        uk: "Зворотний переїзд по AP-7 — 3,5 години комфортної їзди. Автострада безкоштовна. По дорозі — обід у Пеньісколі або Кастельоні, або без зупинок — і встигнете на останнє купання на міському пляжі Малварроса у Валенсії.",
      },
    },
  ],

  tips: [
    {
      tip: {
        es: "Presupuesto: alquiler desde 105 €/noche + combustible ~90 € para 700 km + áreas ~60 €. Más barato que hotel más coche de alquiler, y con una libertad incomparable.",
        en: "Budget: hire from 105 EUR/night + fuel approx. 90 EUR for 700 km + stopovers approx. 60 EUR. Cheaper than a hotel plus rental car, and with incomparably more freedom.",
        de: "Budget: Miete ab 105 Euro pro Nacht + Kraftstoff ca. 90 Euro fuer 700 km + Stellplaetze ca. 60 Euro. Guenstiger als Hotel plus Mietwagen — und mit unvergleichlich mehr Freiheit.",
        it: "Budget: noleggio da 105 euro a notte + carburante circa 90 euro per 700 km + aree di sosta circa 60 euro. Piu' economico di hotel piu' auto a noleggio, con una liberta' incomparabile.",
        nl: "Budget: huur vanaf 105 euro per nacht + brandstof ca. 90 euro voor 700 km + camperplaatsen ca. 60 euro. Goedkoper dan hotel plus huurauto, en met onvergelijkbaar veel meer vrijheid.",
        ru: "Бюджет: аренда от 105 €/ночь + топливо ~90 € на 700 км + площадки ~60 €. Дешевле, чем отель + аренда машины, а свободы несравнимо больше.",
        uk: "Бюджет: оренда від 105 €/ніч + паливо ~90 € на 700 км + майданчики ~60 €. Дешевше, ніж готель + оренда авто, а свободи незрівнянно більше.",
      },
    },
    {
      tip: {
        es: "Agua y vaciado: las áreas de Peñíscola, Deltebre y Barcelona tienen servicio completo. Entre ellas, gasolineras Repsol con puntos de servicio (filtra 'servicios' en Park4Night).",
        en: "Water and waste disposal: the stopovers in Peniscola, Deltebre and Barcelona offer full service. In between, Repsol fuel stations have service points (filter by 'services' in Park4Night).",
        de: "Wasser und Entsorgung: Die Stellplaetze in Peniscola, Deltebre und Barcelona haben Vollservice. Dazwischen: Repsol-Tankstellen mit Servicepunkten (in Park4Night nach 'Entsorgung' filtern).",
        it: "Acqua e scarico: le aree di Peniscola, Deltebre e Barcellona hanno servizio completo. Nel mezzo, le stazioni Repsol con punti di servizio (filtrate 'servizi' su Park4Night).",
        nl: "Water en afvoer: de camperplaatsen in Peniscola, Deltebre en Barcelona bieden volledige service. Daartussenin: Repsol-tankstations met servicepunten (filter op 'services' in Park4Night).",
        ru: "Вода и слив: площадки в Пеньисколе, Deltebre и Барселоне имеют полный сервис. Между ними — заправки Repsol с точками обслуживания (фильтр 'servicios' в Park4Night).",
        uk: "Вода та злив: майданчики в Пеньісколі, Deltebre та Барселоні мають повний сервіс. Між ними — заправки Repsol з точками обслуговування (фільтр 'servicios' у Park4Night).",
      },
    },
    {
      tip: {
        es: "Apps: Park4Night es el compañero indispensable del viajero en autocaravana en España — todas las áreas del itinerario están con reseñas actualizadas.",
        en: "Apps: Park4Night is the essential companion for campervanning in Spain — every stopover on this route is listed with up-to-date reviews.",
        de: "Apps: Park4Night ist der unverzichtbare Begleiter fuer Wohnmobilisten in Spanien — alle Stellplaetze dieser Route sind dort mit Bewertungen eingetragen.",
        it: "App: Park4Night e' il compagno indispensabile del camperista in Spagna — tutte le aree dell'itinerario sono censite con recensioni aggiornate.",
        nl: "Apps: Park4Night is de onmisbare reisgenoot voor camperaars in Spanje — alle plaatsen op deze route staan er met actuele beoordelingen in.",
        ru: "Приложения: Park4Night — главный помощник в путешествии на автодоме по Испании, все площадки маршрута там с отзывами.",
        uk: "Застосунки: Park4Night — головний помічник кемперів в Іспанії, всі майданчики маршруту там з відгуками.",
      },
    },
    {
      tip: {
        es: "Temporada alta: Camping Sitges y el área de Barcelona se llenan en verano — reserva con antelación y llega pronto.",
        en: "High season: Camping Sitges and the Barcelona stopover fill up in summer — book ahead and arrive early.",
        de: "Hauptsaison: Camping Sitges und der Stellplatz in Barcelona sind im Sommer schnell ausgebucht — fruehzeitig buchen und frueh anreisen.",
        it: "Alta stagione: Camping Sitges e l'area di Barcellona si esauriscono in estate — prenotate in anticipo e arrivate presto.",
        nl: "Hoogseizoen: Camping Sitges en de camperplaats in Barcelona zijn in de zomer snel vol — boek van tevoren en kom vroeg aan.",
        ru: "Высокий сезон: Camping Sitges и площадка в Барселоне летом заполняются — бронируйте заранее и приезжайте пораньше.",
        uk: "Високий сезон: Camping Sitges та майданчик у Барселоні влітку швидко заповнюються — бронюйте заздалегідь і приїжджайте раніше.",
      },
    },
    {
      tip: {
        es: "Viento en el Delta del Ebro: en primavera y otoño puede soplar una fuerte tramontana. Consulta la previsión — si hay rachas superiores a 60 km/h, mejor quedarse un día más.",
        en: "Wind in the Ebro Delta: strong Tramontana winds are common in spring and autumn. Check the forecast — if gusts exceed 60 km/h, it's better to stay put for an extra day.",
        de: "Wind im Ebro-Delta: Im Fruehjahr und Herbst kann die Tramontana kraeftig blasen. Wettervorhersage checken — bei Boeen ueber 60 km/h besser einen Tag laenger bleiben.",
        it: "Vento nel Delta dell'Ebro: in primavera e autunno puo' soffiare forte la Tramontana. Controllate le previsioni — con raffiche superiori a 60 km/h, meglio restare fermi un giorno in piu'.",
        nl: "Wind in de Ebrodelta: in voor- en najaar kan de Tramontana hard blazen. Controleer de weersvoorspelling — bij windstoten boven 60 km/u kun je beter een dag extra ter plaatse blijven.",
        ru: "Ветер в дельте Эбро: весной и осенью бывает сильный северный ветер. Проверяйте прогноз — при порывах выше 60 км/ч лучше переждать день на месте.",
        uk: "Вітер у дельті Ебро: навесні та восени буває сильний північний вітер. Перевіряйте прогноз — при поривах понад 60 км/год краще пережити день на місці.",
      },
    },
  ],

  ctaText: {
    es: "Nuestro McLouis Yearling 89G está hecho para rutas como esta ruta autocaravana Valencia Barcelona: diésel eficiente para los traslados, aire acondicionado, una cocina completa para preparar arroz del delta del Ebro junto a los arrozales, y cocina de gas exterior para cenar bajo las estrellas.",
    en: "Our McLouis Yearling 89G is built for trips like this: efficient diesel for the longer hauls, air conditioning, a full kitchen to cook Ebro Delta rice right beside the rice paddies, and an outdoor gas stove for dinners under the stars.",
    de: "Unser McLouis Yearling 89G ist fuer genau solche Routen gemacht: sparsamer Diesel fuer die langen Strecken, Klimaanlage, eine vollstaendige Kueche, um Ebro-Delta-Reis direkt an den Reisfeldern zuzubereiten, und ein Outdoor-Gaskocher fuer Abende unter dem Sternenhimmel.",
    it: "Il nostro McLouis Yearling 89G e' fatto per itinerari come questo: diesel efficiente per i trasferimenti, aria condizionata, una cucina completa per cucinare il riso del Delta dell'Ebro proprio in mezzo alle risaie, e un fornello a gas da esterno per le cene sotto le stelle.",
    nl: "Onze McLouis Yearling 89G is gemaakt voor routes als deze: zuinige diesel voor de langere ritten, airconditioning, een volledige keuken om Ebrorijst pal naast de rijstvelden te koken, en een outdoor gaskookplaat voor avonden onder de sterren.",
    ru: "Наш McLouis Yearling 89G создан для таких маршрутов: экономичный дизель для перегонов, кондиционер, полноценная кухня, чтобы готовить рис из дельты Эбро прямо у рисовых полей, и уличная газовая плита для ужинов под звёздами.",
    uk: "Наш McLouis Yearling 89G створений для таких маршрутів: економічний дизель для переїздів, кондиціонер, повноцінна кухня, щоб готувати рис з дельти Ебро прямо біля рисових полів, і вулична газова плита для вечерь під зорями.",
  },

  ctaButton: {
    es: "Reservar fechas",
    en: "Book your dates",
    de: "Termine buchen",
    it: "Prenota le date",
    nl: "Boek je data",
    ru: "Забронировать даты",
    uk: "Забронювати дати",
  },
};

export const ROUTE_PAGES: RouteContent[] = [costaBlanca, valenciaBarcalona];

export function getRouteBySlug(slug: string): RouteContent | undefined {
  return ROUTE_PAGES.find((r) => r.slug === slug);
}
