import { differenceInCalendarDays, addDays } from "date-fns";

export const IVA_RATE = 0.21;
export function withIva(amount: number): number {
  return Math.round(amount * (1 + IVA_RATE));
}

export type Season = "low" | "mid" | "high" | "super";

export const PRICES: Record<Season, number> = {
  low: 105,   // Jan, Feb, Mar, Nov, Dec
  mid: 125,   // Apr, May, Jun, Oct
  high: 155,  // Jul, Sep
  super: 169, // Aug
};

export const MIN_NIGHTS: Record<Season, number> = {
  low: 3,
  mid: 4,
  high: 5,
  super: 5,
};

const MIN_NIGHTS_BY_MONTH: Record<number, number> = {
  1: 3,  // Jan — low
  2: 3,  // Feb — low
  3: 3,  // Mar — low
  4: 4,  // Apr — mid
  5: 4,  // May — mid
  6: 4,  // Jun — mid
  7: 4,  // Jul — high (was 5)
  8: 5,  // Aug — super
  9: 3,  // Sep — high (was 5)
  10: 3, // Oct — mid (was 4)
  11: 3, // Nov — low
  12: 3, // Dec — low
};

export function getMinNights(date: Date): number {
  return MIN_NIGHTS_BY_MONTH[date.getMonth() + 1];
}

export function getSeason(date: Date): Season {
  const m = date.getMonth() + 1;
  if (m === 8) return "super";
  if ([7, 9].includes(m)) return "high";
  if ([4, 5, 6, 10].includes(m)) return "mid";
  return "low";
}

export function getMinNightsForRange(start: Date): number {
  return MIN_NIGHTS[getSeason(start)];
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
    const d = addDays(start, i);
    subtotal += PRICES[getSeason(d)];
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
