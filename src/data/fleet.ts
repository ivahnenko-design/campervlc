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
    priceFrom: 99,
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
    ],
  },
];

// Extras and their prices live in shared/pricing.js so api/create-checkout.js
// prices them from the same table the calculator shows.
export { EXTRAS, EXCLUSIVE_EXTRA_GROUPS } from "../../shared/pricing.js";
export type { ExtraId, ExtraItem } from "../../shared/pricing.js";
