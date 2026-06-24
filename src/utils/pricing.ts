import { differenceInCalendarDays, addDays } from "date-fns";

export type Season = "low" | "mid" | "high";

export const PRICES: Record<Season, number> = {
  low: 100,  // Nov–Mar
  mid: 140,  // Apr, May, Oct
  high: 170, // Jun–Sep
};

export const MIN_NIGHTS: Record<Season, number> = {
  low: 3,
  mid: 4,
  high: 5,
};

export function getSeason(date: Date): Season {
  const m = date.getMonth() + 1;
  if ([6, 7, 8, 9].includes(m)) return "high";
  if ([4, 5, 10].includes(m)) return "mid";
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
    perNightAvg: nights > 0 ? Math.round(total / nights) : 0,
  };
}
