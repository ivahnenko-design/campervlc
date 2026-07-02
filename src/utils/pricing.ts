import { differenceInCalendarDays, addDays } from "date-fns";

export const IVA_RATE = 0.21;
export function withIva(amount: number): number {
  return Math.round(amount * (1 + IVA_RATE));
}

export type Season = "low" | "mid" | "high" | "super";

export const MIN_NIGHTS: Record<Season, number> = {
  low: 3,   // Baja
  mid: 4,   // Medio
  high: 4,  // Alta
  super: 5, // Super Alta
};

export function getMinNights(date: Date): number {
  return MIN_NIGHTS[getSeason(date)];
}

// Date ranges encoded as MMDD integers for fast comparison.
// Dec 25 – Jan 4 (SUPER ALTA) wraps the year boundary and is handled separately.
const RANGES: Array<{ from: number; to: number; price: number; season: Season }> = [
  // BAJA — TEMP 50 €/night for payment testing (was 105 €/night)
  { from: 112,  to: 315,  price: 50, season: "low"   }, // Jan 12 – Mar 15
  { from: 323,  to: 329,  price: 50, season: "low"   }, // Mar 23 – Mar 29
  { from: 1019, to: 1206, price: 50, season: "low"   }, // Oct 19 – Dec 6
  // MEDIO — 125 €/night
  { from: 413,  to: 426,  price: 125, season: "mid"   }, // Apr 13 – Apr 26
  { from: 504,  to: 531,  price: 125, season: "mid"   }, // May 4  – May 31
  { from: 914,  to: 1004, price: 125, season: "mid"   }, // Sep 14 – Oct 4  (note: 1004 = Oct 4)
  { from: 1207, to: 1218, price: 125, season: "mid"   }, // Dec 7  – Dec 18
  // ALTA — 155 €/night
  { from: 316,  to: 322,  price: 155, season: "high"  }, // Mar 16 – Mar 22
  { from: 330,  to: 412,  price: 155, season: "high"  }, // Mar 30 – Apr 12
  { from: 427,  to: 503,  price: 155, season: "high"  }, // Apr 27 – May 3
  { from: 601,  to: 731,  price: 155, season: "high"  }, // Jun 1  – Jul 31
  { from: 901,  to: 913,  price: 155, season: "high"  }, // Sep 1  – Sep 13
  { from: 1219, to: 1224, price: 155, season: "high"  }, // Dec 19 – Dec 24
  // SUPER ALTA — 169 €/night
  { from: 801,  to: 831,  price: 169, season: "super" }, // Aug 1  – Aug 31
  { from: 1225, to: 1231, price: 169, season: "super" }, // Dec 25 – Dec 31 (→ wraps to Jan 4)
];

function toMMDD(date: Date): number {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

export function getPriceForDate(date: Date): number {
  const mmdd = toMMDD(date);
  if (mmdd <= 104) return 169; // Jan 1–4: SUPER ALTA (continuation of Dec 25–Jan 4)
  for (const r of RANGES) {
    if (mmdd >= r.from && mmdd <= r.to) return r.price;
  }
  return 50; // TEMP default BAJA for any uncovered date (e.g. Jan 5–11) — was 105
}

export function getSeason(date: Date): Season {
  const mmdd = toMMDD(date);
  if (mmdd <= 104) return "super";
  for (const r of RANGES) {
    if (mmdd >= r.from && mmdd <= r.to) return r.season;
  }
  return "low";
}

export function getMinNightsForRange(start: Date): number {
  return getMinNights(start);
}

export interface PriceBreakdown {
  nights: number;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  total: number;
  totalWithIva: number;
  perNightAvg: number;
}

export function calculatePrice(start: Date, end: Date): PriceBreakdown {
  const nights = Math.max(0, differenceInCalendarDays(end, start));
  let subtotal = 0;
  for (let i = 0; i < nights; i++) {
    subtotal += getPriceForDate(addDays(start, i));
  }
  let discountPct = 0;
  if (nights >= 14) discountPct = 10;
  else if (nights >= 7) discountPct = 5;
  const discountAmount = Math.round(subtotal * (discountPct / 100));
  const total = subtotal - discountAmount;
  return {
    nights,
    subtotal,
    discountPct,
    discountAmount,
    total,
    totalWithIva: withIva(total),
    perNightAvg: nights > 0 ? Math.round(total / nights) : 0,
  };
}
