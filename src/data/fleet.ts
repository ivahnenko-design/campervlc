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
    ],
  },
];

export interface ExtraItem {
  id: string;
  price: number;
  mandatory?: boolean;
  perNight?: boolean;
}

export const EXTRAS: readonly ExtraItem[] = [
  // Always included (mandatory, free)
  { id: "welcome_kit",           price: 0,  mandatory: true  },
  { id: "kitchen_kit",           price: 0,  mandatory: true  },
  { id: "outdoor_set",           price: 0,  mandatory: true  },
  // Mandatory paid
  { id: "cleaning_fee",          price: 50, mandatory: true  },
  // Optional extras
  { id: "airport_transfer",      price: 80                   },
  { id: "bicycle",               price: 90                   },
  { id: "grocery",               price: 30                   },
  { id: "baby_seat",             price: 20                   },
  { id: "bedding",               price: 20                   },
  { id: "bbq",                   price: 15                   },
  { id: "pet",                   price: 80                   },
  { id: "festival",              price: 150                  },
  { id: "board_games",           price: 10                   },
  { id: "towels",                price: 15                   },
  { id: "extra_driver",          price: 50                   },
  { id: "km_200",                price: 20, perNight: true   },
  { id: "km_unlimited",          price: 40, perNight: true   },
  { id: "sup_board",             price: 90                   },
  { id: "reduced_deductible",    price: 60                   },
] as const;

export type ExtraId = (typeof EXTRAS)[number]["id"];
