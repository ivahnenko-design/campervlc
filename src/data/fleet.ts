// TODO: fetch from Supabase or external API
export interface Camper {
  id: string;
  name: string;
  location: string;
  capacity: number;
  image: string;
  gallery: string[];
  priceFrom: number;
  available: boolean;
}

export const FLEET: Camper[] = [
  {
    id: "mclouis-yearling-89g",
    name: "McLouis Yearling 89G",
    location: "Valencia",
    capacity: 5,
    image:
      "https://yescapa.twic.pics/rental/picture/b21e5a9f-a4d1-446d-b92c-c86a11a0e037_1728652498",
    gallery: [
      "https://yescapa.twic.pics/rental/picture/b21e5a9f-a4d1-446d-b92c-c86a11a0e037_1728652498",
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200",
      "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1200",
      "https://images.unsplash.com/photo-1519400197429-404ae3e0ee7e?w=1200",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
    ],
    priceFrom: 100,
    available: true,
  },
];

// TODO: Replace with real availability API or Supabase table
export interface Availability {
  camperId: string;
  bookedDates: string[]; // ISO yyyy-MM-dd
}

export const AVAILABILITY: Availability[] = [
  {
    camperId: "mclouis-yearling-89g",
    bookedDates: [
      // sample bookings
      "2026-07-04", "2026-07-05", "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09",
      "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15", "2026-08-16", "2026-08-17", "2026-08-18",
      "2026-09-20", "2026-09-21", "2026-09-22",
      "2026-12-26", "2026-12-27", "2026-12-28", "2026-12-29", "2026-12-30",
    ],
  },
];

export const EXTRAS = [
  { id: "airport_transfer", price: 90 },
  { id: "bicycle", price: 90 },
  { id: "grocery", price: 30 },
  { id: "baby_seat", price: 40 },
  { id: "ext_cleaning", price: 20 },
  { id: "int_cleaning", price: 20 },
  { id: "bedding", price: 20 },
  { id: "bbq", price: 15 },
  { id: "pet", price: 80 },
  { id: "cleaning_fee", price: 50 },
  { id: "welcome_kit", price: 10 },
  { id: "kitchen_kit", price: 10 },
  { id: "board_games", price: 10 },
  { id: "towels", price: 15 },
  { id: "extra_driver", price: 50 },
] as const;

export type ExtraId = (typeof EXTRAS)[number]["id"];
