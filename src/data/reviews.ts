export interface ReviewSeed {
  name: string;
  flag: string;
  rating: number;
  date: string;
  text: string;
  source: "Yescapa" | "Google" | "Instagram";
  color: string;
}

export const REVIEWS: ReviewSeed[] = [
  {
    name: "Ana M.",
    flag: "🇪🇸",
    rating: 5,
    date: "Mayo 2025",
    text: "Todo perfecto desde el primer momento. La camper estaba impecable, equipada con todo lo que necesitas. La entrega muy detallada. Repetiremos seguro.",
    source: "Yescapa",
    color: "from-amber-500 to-rose-500",
  },
  {
    name: "Dmytro K.",
    flag: "🇺🇦",
    rating: 5,
    date: "Julio 2025",
    text: "Fantastic camper, everything worked perfectly. The solar panel meant we never had to worry about power. The beach chair and parasol were a lovely touch. 10/10!",
    source: "Google",
    color: "from-sky-500 to-indigo-500",
  },
  {
    name: "Marco & Laura",
    flag: "🇩🇪",
    rating: 5,
    date: "Agosto 2025",
    text: "Wunderschöner Camper, top ausgestattet. Wir haben die Costa Blanca entdeckt und hatten das Gefühl, zuhause zu sein. Sehr zu empfehlen!",
    source: "Yescapa",
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Sophie V.",
    flag: "🇳🇱",
    rating: 5,
    date: "Junio 2025",
    text: "Geweldige ervaring! De camper was brandschoon en uitstekend uitgerust. De begeleiding bij het ophalen was heel duidelijk. Zeker voor herhaling vatbaar!",
    source: "Instagram",
    color: "from-orange-500 to-pink-500",
  },
  {
    name: "Valentina R.",
    flag: "🇮🇹",
    rating: 5,
    date: "Settembre 2025",
    text: "Esperienza incredibile! Il camper era perfetto per 4 persone, tutto funzionava alla perfezione. I pannelli solari ci hanno permesso di stare in libertà totale.",
    source: "Yescapa",
    color: "from-rose-500 to-fuchsia-500",
  },
  {
    name: "James T.",
    flag: "🇬🇧",
    rating: 5,
    date: "October 2025",
    text: "Best camper rental experience I've ever had. The handover was thorough, the van spotless, and the outdoor furniture was a great bonus. Valencia to Cabo de Gata in 8 days — unforgettable.",
    source: "Google",
    color: "from-violet-500 to-blue-500",
  },
];
