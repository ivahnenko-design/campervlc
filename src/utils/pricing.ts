import { differenceInCalendarDays, addDays } from "date-fns";

export const IVA_RATE = 0.21;
export function withIva(amount: number): number {
  return Math.round(amount * (1 + IVA_RATE));
}

export type Season = "low" | "mid" | "high" | "super";

/** Nightly rate per season, in euros. */
export const PRICES: Record<Season, number> = {
  low: 99,    // Baja
  mid: 125,   // Medio
  high: 155,  // Alta
  super: 169, // Super Alta
};

export const MIN_NIGHTS: Record<Season, number> = {
  low: 3,   // Baja
  mid: 4,   // Medio
  high: 4,  // Alta
  super: 5, // Super Alta
};

/** Last date the booking calendar allows a guest to select. */
export const BOOKING_MAX_DATE = new Date(2028, 0, 6); // Jan 6, 2028

export function getMinNights(date: Date): number {
  return MIN_NIGHTS[getSeason(date)];
}

/**
 * Season calendar for specific years, encoded as YYYYMMDD integers.
 * These take priority over the generic calendar below, so a year can
 * follow the real Valencia holiday calendar (Fallas, Semana Santa,
 * puentes) instead of the year-agnostic defaults.
 * Ranges are inclusive and may span a year boundary.
 */
const DATED_RANGES: Array<{ from: number; to: number; season: Season }> = [
  // ── 2026: Christmas period widened to Dec 22 – Jan 6 ──
  { from: 20261207, to: 20261218, season: "mid" },   // Dec 7 – Dec 18
  { from: 20261219, to: 20261221, season: "high" },  // Dec 19 – Dec 21
  { from: 20261222, to: 20270106, season: "super" }, // Dec 22 – Jan 6 (covers 2027 Jan 1–6)

  // ── 2027: aligned with Valencia official holidays and puentes ──
  { from: 20270107, to: 20270121, season: "low" },   // Jan 7 – Jan 21
  { from: 20270122, to: 20270124, season: "high" },  // puente San Vicente Martir
  { from: 20270125, to: 20270314, season: "low" },   // Jan 25 – Mar 14
  { from: 20270315, to: 20270321, season: "high" },  // Fallas
  { from: 20270322, to: 20270324, season: "low" },   // Mar 22 – Mar 24
  { from: 20270325, to: 20270405, season: "high" },  // Semana Santa
  { from: 20270406, to: 20270429, season: "mid" },   // Apr 6 – Apr 29
  { from: 20270430, to: 20270502, season: "high" },  // Apr 30 – May 2
  { from: 20270503, to: 20270531, season: "mid" },   // May 3 – May 31
  { from: 20270601, to: 20270731, season: "high" },  // Jun 1 – Jul 31
  { from: 20270801, to: 20270831, season: "super" }, // Aug 1 – Aug 31
  { from: 20270901, to: 20270912, season: "high" },  // Sep 1 – Sep 12
  { from: 20270913, to: 20271007, season: "mid" },   // Sep 13 – Oct 7
  { from: 20271008, to: 20271012, season: "high" },  // puente Comunitat Valenciana + Fiesta Nacional
  { from: 20271013, to: 20271028, season: "low" },   // Oct 13 – Oct 28
  { from: 20271029, to: 20271101, season: "high" },  // Todos los Santos
  { from: 20271102, to: 20271202, season: "low" },   // Nov 2 – Dec 2
  { from: 20271203, to: 20271208, season: "high" },  // puente de diciembre
  { from: 20271209, to: 20271221, season: "mid" },   // Dec 9 – Dec 21
  { from: 20271222, to: 20280106, season: "super" }, // Dec 22 – Jan 6, 2028
];

/**
 * Generic year-agnostic calendar, encoded as MMDD integers.
 * Used for any year not covered by DATED_RANGES above.
 * Dec 25 – Jan 4 wraps the year boundary and is handled in getSeason.
 */
const RANGES: Array<{ from: number; to: number; season: Season }> = [
  // BAJA
  { from: 112,  to: 315,  season: "low" },   // Jan 12 – Mar 15
  { from: 323,  to: 329,  season: "low" },   // Mar 23 – Mar 29
  { from: 1019, to: 1206, season: "low" },   // Oct 19 – Dec 6
  // MEDIO
  { from: 413,  to: 426,  season: "mid" },   // Apr 13 – Apr 26
  { from: 504,  to: 531,  season: "mid" },   // May 4  – May 31
  { from: 914,  to: 1004, season: "mid" },   // Sep 14 – Oct 4
  { from: 1207, to: 1218, season: "mid" },   // Dec 7  – Dec 18
  // ALTA
  { from: 316,  to: 322,  season: "high" },  // Mar 16 – Mar 22
  { from: 330,  to: 412,  season: "high" },  // Mar 30 – Apr 12
  { from: 427,  to: 503,  season: "high" },  // Apr 27 – May 3
  { from: 601,  to: 731,  season: "high" },  // Jun 1  – Jul 31
  { from: 901,  to: 913,  season: "high" },  // Sep 1  – Sep 13
  { from: 1219, to: 1224, season: "high" },  // Dec 19 – Dec 24
  // SUPER ALTA
  { from: 801,  to: 831,  season: "super" }, // Aug 1  – Aug 31
  { from: 1225, to: 1231, season: "super" }, // Dec 25 – Dec 31 (wraps to Jan 4)
];

function toYMD(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function toMMDD(date: Date): number {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

/**
 * Resolves the season for a date. Any date not covered by an explicit
 * range falls back to "low" (Baja), so pricing never returns 0.
 */
export function getSeason(date: Date): Season {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "low";

  const ymd = toYMD(date);
  for (const r of DATED_RANGES) {
    if (ymd >= r.from && ymd <= r.to) return r.season;
  }

  const mmdd = toMMDD(date);
  if (mmdd <= 104) return "super"; // Jan 1–4: tail of the Dec 25 – Jan 4 period
  for (const r of RANGES) {
    if (mmdd >= r.from && mmdd <= r.to) return r.season;
  }
  return "low";
}

export function getPriceForDate(date: Date): number {
  return PRICES[getSeason(date)];
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
