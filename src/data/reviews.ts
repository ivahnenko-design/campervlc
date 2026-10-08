// Real reviews, copied unchanged from the sources below (original language,
// no edits): Yescapa "Mis opiniones" and the Google Maps listing. Private
// messages to the owner are not published. Verified 2026-10-08.
export interface Review {
  name: string;
  rating: number;
  /** yyyy-mm-dd (day omitted by the source for Google: first of the month). */
  date: string;
  /** Language of the text as written by the guest. */
  lang: "es" | "en" | "ru";
  text: string;
  source: "Yescapa" | "Google";
  url: string;
  color: string;
}

const YESCAPA = "https://www.yescapa.es/campers/76347";
const GOOGLE = "https://www.google.com/maps/search/Camper+Retreat+Carrer+de+Nino+Bravo+3+Valencia";

export const REVIEWS: Review[] = [
  {
    name: "Марика И.",
    rating: 5,
    date: "2026-09-01",
    lang: "ru",
    text: "превосходный опыт! Брали в аренду автодом в Валенсии у Camper Retreat. Что хочется отметить : полный набор посуды, кастрюль, сковородок, бокалов. 2 вида подушек: пуховые и эко. одеяла, плед. набор уличной мебели для пикника все бесплатно. жидкости и таблетки для унитаза все входит в стоимость аренды. автодом новый, просторный, 3 отдельных спальных места для 5ти человек. Очень рекомендую маршрут на автодоме от Валенсии до Аликанте с остановками в Javea, Raco de Conill, Playa Paradis. Удобное место выдачи автодома возле города Наук и Искусств в Валенсии.",
    source: "Google",
    url: GOOGLE,
    color: "from-sky-500 to-indigo-500",
  },
  {
    name: "Alba",
    rating: 5,
    date: "2026-07-21",
    lang: "es",
    text: "Reservar con Sergi fue un acierto, la autocaravana tiene todo lo necesario y estuvimos genial. La comunicación con el ha sido fluida y ha sido muy atento. Tuvimos un problema con el aire acondicionado, cosas que pasan, pero enseguida se presto a darnos soluciones y a compensarlo. Muchas gracias!",
    source: "Yescapa",
    url: YESCAPA,
    color: "from-amber-500 to-rose-500",
  },
  {
    name: "Harriet",
    rating: 5,
    date: "2026-05-22",
    lang: "en",
    text: "10/10 service. Would definitely use again. Many thanks Sergii!",
    source: "Yescapa",
    url: YESCAPA,
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Shane",
    rating: 5,
    date: "2026-02-26",
    lang: "en",
    text: "We hired Sergii\u2019s motorhome for 10 days to travel around Valencia and couldn\u2019t have asked for a better experience. The motorhome was spotless, very tidy, and equipped with everything we needed, making it easy and comfortable to operate. Sergii took the time to thoroughly explain how everything worked, which gave us total confidence from the start. Communication was immediate throughout, and any minor issues were sorted straight away. When our flight was delayed, Sergii went the extra mile by collecting us from the airport and later dropping us off after we returned the motorhome. On top of all that, he\u2019s a genuinely great guy. We 100% recommend hiring his motorhome.",
    source: "Yescapa",
    url: YESCAPA,
    color: "from-violet-500 to-blue-500",
  },
  {
    name: "Yevhenii",
    rating: 5,
    date: "2025-11-28",
    lang: "en",
    text: "We rented a motorhome as a group of four (my husband and I and our two children), and it was very comfortable. The motorhome had everything we needed and even a little more\u{1F92D}Highly recommended \u{1F44D}\u{1F3FC}",
    source: "Yescapa",
    url: YESCAPA,
    color: "from-orange-500 to-pink-500",
  },
  {
    name: "Iraya",
    rating: 5,
    date: "2025-08-26",
    lang: "es",
    text: "Muy buena caravana, con todo lo necesario, moderna y limpia. Sergii siempre estuvo atento a nuestras dudas, muy amable.",
    source: "Yescapa",
    url: YESCAPA,
    color: "from-rose-500 to-fuchsia-500",
  },
  {
    name: "Marek",
    rating: 5,
    date: "2024-09-18",
    lang: "en",
    text: "All good. Kind and professional owners. The camper was in good shape, new model and clean. This was our first hire, and our first experience with motorhome life. We are a family of 2 adults and 2 kids 5+7 years. The camper suited our needs perfectly. The car is fitted with a huge AC that works when connected to a electrical socket which made sleeping in +35 Celsius extremely comfortable. All in all a great experience and I highly recommend this van and these owners! \u{1F44D}",
    source: "Yescapa",
    url: YESCAPA,
    color: "from-sky-500 to-cyan-500",
  },
  {
    name: "Bernardo",
    rating: 5,
    date: "2024-08-20",
    lang: "es",
    text: "Realmente una experiencia espectacular, mi primer viaje con autocaravana y ha sido inolvidable tanto para mis hijos como para mi. Sin duda volveré a repetirlo.",
    source: "Yescapa",
    url: YESCAPA,
    color: "from-lime-500 to-emerald-500",
  },
  {
    name: "Juan Luis",
    rating: 4,
    date: "2024-05-02",
    lang: "es",
    text: "La autocaravana muy nueva con toallas sin estrenar, ropa de cama, y menaje nuevo. Muy buena experiencia.",
    source: "Yescapa",
    url: YESCAPA,
    color: "from-fuchsia-500 to-purple-500",
  },
];

export const REVIEWS_AVERAGE = Number(
  (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length).toFixed(1),
);
export const REVIEWS_COUNT = REVIEWS.length;
