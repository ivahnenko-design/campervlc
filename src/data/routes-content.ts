export type Lang = "es" | "en" | "de" | "it" | "nl" | "ru" | "uk";

export interface RouteDay {
  title: Record<Lang, string>;
  text: Record<Lang, string>;
  photoSlot: string;
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
        de: "Hauptsaison (Juli–August): Wecamp Jávea und Campingplätze 2–3 Wochen im Voraus buchen. Öffentliche Stellplätze funktionieren nach dem Prinzip „Wer zuerst kommt" — vor 12 Uhr ankommen.",
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
    es: "Nuestro McLouis Yearling 89G es ideal para esta ruta autocaravana Costa Blanca: compacto para las carreteras costeras, con aire acondicionado, equipado con todo lo necesario — incluyendo 3 sillas de playa y cocina de gas exterior para cenar junto al mar. Reservar fechas →",
    en: "Our McLouis Yearling 89G is perfect for this route: compact enough for coastal roads, air-conditioned and fully equipped — including 3 beach chairs and an outdoor gas stove for dinner by the sea. Book your dates →",
    de: "Unser McLouis Yearling 89G ist perfekt für diese Route: kompakt genug für Küstenstraßen, klimatisiert und komplett ausgestattet — inklusive 3 Strandstühlen und einem Outdoor-Gaskocher für das Abendessen am Meer. Reisedaten buchen →",
    it: "Il nostro McLouis Yearling 89G è perfetto per questo itinerario: compatto per le strade costiere, con aria condizionata e dotato di tutto — incluse 3 sedie da spiaggia e un fornello a gas da esterno per la cena in riva al mare. Prenota le tue date →",
    nl: "Onze McLouis Yearling 89G is ideaal voor deze route: compact genoeg voor kustroutes, met airconditioning en volledig uitgerust — inclusief 3 strandstoelen en een outdoor gaskookplaat voor een diner aan zee. Boek je data →",
    ru: "Наш McLouis Yearling 89G идеален для этого маршрута: компактный для прибрежных дорог, с кондиционером, укомплектован всем — включая 3 пляжных кресла и уличную газовую плиту для ужина у моря. Забронировать даты →",
    uk: "Наш McLouis Yearling 89G ідеальний для цього маршруту: компактний для прибережних доріг, з кондиціонером, укомплектований усім — включаючи 3 пляжних крісла та вуличну газову плиту для вечері біля моря. Забронювати дати →",
  },
};

export const ROUTE_PAGES: RouteContent[] = [costaBlanca];

export function getRouteBySlug(slug: string): RouteContent | undefined {
  return ROUTE_PAGES.find((r) => r.slug === slug);
}
