/**
 * Pricing rules shared by the booking calculator (src/) and the Vercel API
 * functions (api/). Plain ESM JavaScript on purpose: api/*.js cannot import
 * TypeScript, and the season calendar must live in exactly one place.
 * Types for TypeScript callers are in ./pricing.d.ts next to this file.
 */

export const IVA_RATE = 0.21;
export function withIva(amount) {
  return Math.round(amount * (1 + IVA_RATE));
}

/** Nightly rate per season, in euros (before IVA). */
export const PRICES = {
  low: 90,    // Baja
  mid: 125,   // Medio
  high: 155,  // Alta
  super: 180, // Super Alta
};

export const MIN_NIGHTS = {
  low: 3,   // Baja
  mid: 3,   // Medio
  high: 4,  // Alta
  super: 5, // Super Alta
};

/** Last date the booking calendar allows a guest to select. */
export const BOOKING_MAX_DATE = new Date(2028, 0, 6); // Jan 6, 2028

/**
 * Season calendar for specific years, encoded as YYYYMMDD integers.
 * These take priority over the generic calendar below, so a year can
 * follow the real Valencia holiday calendar (Fallas, Semana Santa,
 * puentes) instead of the year-agnostic defaults.
 * Ranges are inclusive and may span a year boundary.
 */
const DATED_RANGES = [
  // ── 2026: October puente, then Christmas widened to Dec 22 – Jan 6 ──
  { from: 20261005, to: 20261007, season: "mid" },   // Oct 5 – Oct 7
  { from: 20261008, to: 20261018, season: "high" },  // puente Comunitat Valenciana + Fiesta Nacional
  { from: 20261019, to: 20261206, season: "low" },   // Oct 19 – Dec 6
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
  { from: 20270406, to: 20270428, season: "mid" },   // Apr 6 – Apr 28
  { from: 20270429, to: 20270503, season: "high" },  // Apr 29 – May 3 (Rocanrola)
  { from: 20270504, to: 20270531, season: "mid" },   // May 4 – May 31
  { from: 20270601, to: 20270731, season: "high" },  // Jun 1 – Jul 31
  { from: 20270801, to: 20270831, season: "super" }, // Aug 1 – Aug 31
  { from: 20270901, to: 20270912, season: "high" },  // Sep 1 – Sep 12
  { from: 20270913, to: 20271007, season: "mid" },   // Sep 13 – Oct 7
  { from: 20271008, to: 20271018, season: "high" },  // puente Comunitat Valenciana + Fiesta Nacional
  { from: 20271019, to: 20271028, season: "low" },   // Oct 19 – Oct 28
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
const RANGES = [
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

function toYMD(date) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function toMMDD(date) {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

/**
 * Resolves the season for a date. Any date not covered by an explicit
 * range falls back to "low" (Baja), so pricing never returns 0.
 */
export function getSeason(date) {
  if (!isValidDate(date)) return "low";

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

export function getPriceForDate(date) {
  return PRICES[getSeason(date)];
}

export function getMinNights(date) {
  return MIN_NIGHTS[getSeason(date)];
}

export function getMinNightsForRange(start) {
  return getMinNights(start);
}

// ── Dates ───────────────────────────────────────────────────────────────────
// date-fns is deliberately not used here so the API functions carry no extra
// dependency. All dates are local-time calendar dates (midnight is irrelevant).

/** Parses "yyyy-MM-dd" into a local Date, or null when malformed/invalid. */
export function parseIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  // new Date(2026, 1, 31) silently rolls over to March — reject those.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Whole calendar days from `start` to `end`, DST-safe. */
export function differenceInCalendarDays(end, start) {
  const a = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const b = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.round((a - b) / 86_400_000);
}

// ── Pickup / return times ───────────────────────────────────────────────────

export const DEFAULT_PICKUP_TIME = "10:00";
export const DEFAULT_RETURN_TIME = "10:00";

/** "09:00" … "20:00" in 30-minute steps — the only values the UI and API accept. */
export const TIME_OPTIONS = (() => {
  const out = [];
  for (let minutes = 9 * 60; minutes <= 20 * 60; minutes += 30) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    out.push(`${h}:${m}`);
  }
  return out;
})();

export function isValidTimeOption(value) {
  return typeof value === "string" && TIME_OPTIONS.includes(value);
}

function timeToMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Hours the return time runs past the pickup time (0 when the camper comes
 * back at or before the pickup hour). May be fractional, e.g. 4.5.
 */
export function excessHours(pickupTime, returnTime) {
  const diff = timeToMinutes(returnTime) - timeToMinutes(pickupTime);
  return diff > 0 ? diff / 60 : 0;
}

/** Share of one night's rate charged for a late return. */
export function lateReturnSurchargePct(hours) {
  if (hours <= 0) return 0;
  if (hours <= 6) return 50;
  return 100;
}

// ── Extras, promo codes, prepayment ─────────────────────────────────────────

export const EXTRAS = [
  // Mandatory paid
  { id: "cleaning_fee",          price: 50, mandatory: true  },
  // Optional extras
  { id: "airport_transfer",      price: 90                   },
  { id: "bicycle",               price: 90                   },
  { id: "sup_board",             price: 90                   },
  { id: "bedding",               price: 20                   },
  { id: "towels",                price: 15                   },
  { id: "bbq",                   price: 15                   },
  { id: "festival",              price: 150                  },
  { id: "extra_driver",          price: 50                   },
  { id: "km_200",                price: 20, perNight: true   },
  { id: "km_unlimited",          price: 40, perNight: true   },
  { id: "reduced_deductible",    price: 60                   },
];

/**
 * Extras that are alternatives rather than add-ons: selecting one deselects the
 * rest of its group, and none of them is required.
 */
export const EXCLUSIVE_EXTRA_GROUPS = [
  ["km_200", "km_unlimited"],
];

export const PROMO_CODES = { CAMPER10: 10, OWNERTEST: 99 };
// Codes that stop working at a fixed moment (UTC). OWNERTEST is a temporary
// owner test code for live checks; it is never listed anywhere on the site.
export const PROMO_EXPIRES_AT = { OWNERTEST: "2026-10-09T20:00:00Z" };
// Stripe refuses charges under 0.50 EUR; prices here are whole euros.
export const MIN_CHARGE_EUR = 1;

/** Percent off for a promo code at a moment in time, 0 when unknown or expired. */
export function promoPctAt(code, atMs = Date.now()) {
  const c = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (!c || !PROMO_CODES[c]) return 0;
  const expires = PROMO_EXPIRES_AT[c];
  if (expires && atMs >= Date.parse(expires)) return 0;
  return PROMO_CODES[c];
}
export const PREPAYMENT_DISCOUNT_PCT = 5;
export const DEPOSIT_SHARE = 0.5;

/**
 * Drops unknown ids and resolves exclusive groups by keeping the last member
 * of each group (the broader mileage plan wins when both arrive).
 */
export function normalizeExtraIds(extraIds) {
  const known = new Set(EXTRAS.map((e) => e.id));
  let ids = Array.isArray(extraIds) ? extraIds.filter((id) => known.has(id)) : [];
  ids = Array.from(new Set(ids));
  for (const group of EXCLUSIVE_EXTRA_GROUPS) {
    const present = group.filter((id) => ids.includes(id));
    if (present.length > 1) {
      const keep = present[present.length - 1];
      ids = ids.filter((id) => !group.includes(id) || id === keep);
    }
  }
  return ids;
}

export function longStayDiscountPct(nights) {
  if (nights >= 14) return 10;
  if (nights >= 7) return 5;
  return 0;
}

// ── Price calculation ───────────────────────────────────────────────────────

/**
 * Nights × nightly rate plus the late-return surcharge, then the long-stay
 * discount on that subtotal. The surcharge uses the RETURN date's season.
 */
export function calculatePrice(start, end, pickupTime = DEFAULT_PICKUP_TIME, returnTime = DEFAULT_RETURN_TIME) {
  const nights = Math.max(0, differenceInCalendarDays(end, start));
  let nightsSubtotal = 0;
  for (let i = 0; i < nights; i++) {
    nightsSubtotal += getPriceForDate(addDays(start, i));
  }

  const hours = nights > 0 ? excessHours(pickupTime, returnTime) : 0;
  const surchargePct = lateReturnSurchargePct(hours);
  const surcharge = Math.round(getPriceForDate(end) * (surchargePct / 100));

  const subtotal = nightsSubtotal + surcharge;
  const discountPct = longStayDiscountPct(nights);
  const discountAmount = Math.round(subtotal * (discountPct / 100));
  const total = subtotal - discountAmount;
  return {
    nights,
    nightsSubtotal,
    excessHours: hours,
    surchargePct,
    surcharge,
    subtotal,
    discountPct,
    discountAmount,
    total,
    totalWithIva: withIva(total),
    perNightAvg: nights > 0 ? Math.round(total / nights) : 0,
  };
}

/**
 * The whole quote the summary panel shows and the amount Stripe charges.
 * Order of operations: nights + surcharge → long-stay discount → extras and
 * cleaning → promo code → prepayment discount → IVA → deposit split.
 */
export function calculateQuote({
  start,
  end,
  pickupTime = DEFAULT_PICKUP_TIME,
  returnTime = DEFAULT_RETURN_TIME,
  extraIds = [],
  promoCode = null,
  prepaymentOption = "deposit",
  promoValidAtMs = Date.now(),
}) {
  const price = calculatePrice(start, end, pickupTime, returnTime);
  const nights = price.nights;
  const cleanExtraIds = normalizeExtraIds(extraIds);
  const selected = new Set(cleanExtraIds);

  const extrasTotal = EXTRAS.filter((e) => selected.has(e.id) && !e.mandatory).reduce(
    (s, e) => s + (e.perNight ? e.price * nights : e.price),
    0,
  );
  const mandatoryTotal = EXTRAS.filter((e) => e.mandatory).reduce((s, e) => s + e.price, 0);

  const preDiscountTotal = price.total + extrasTotal + mandatoryTotal;

  const code = typeof promoCode === "string" ? promoCode.trim().toUpperCase() : "";
  const promoDiscountPct = promoPctAt(code, promoValidAtMs);
  const appliedPromoCode = promoDiscountPct ? code : null;
  // Never discount below the Stripe minimum charge (before IVA, so the
  // amount with IVA is always at least MIN_CHARGE_EUR).
  const promoDiscountAmount = Math.min(
    Math.round(preDiscountTotal * (promoDiscountPct / 100)),
    Math.max(0, preDiscountTotal - MIN_CHARGE_EUR),
  );
  const afterPromoTotal = preDiscountTotal - promoDiscountAmount;

  const isFullPayment = prepaymentOption === "full";
  const prepaymentDiscountAmount = isFullPayment
    ? Math.round(afterPromoTotal * (PREPAYMENT_DISCOUNT_PCT / 100))
    : 0;

  const finalTotal = afterPromoTotal - prepaymentDiscountAmount;
  const finalTotalWithIva = withIva(finalTotal);
  const depositAmount = isFullPayment ? finalTotalWithIva : Math.round(finalTotalWithIva * DEPOSIT_SHARE);
  const remainingAmount = finalTotalWithIva - depositAmount;

  return {
    ...price,
    cleanExtraIds,
    extrasTotal,
    mandatoryTotal,
    preDiscountTotal,
    appliedPromoCode,
    promoDiscountPct,
    promoDiscountAmount,
    afterPromoTotal,
    prepaymentOption: isFullPayment ? "full" : "deposit",
    prepaymentDiscountAmount,
    finalTotal,
    finalTotalWithIva,
    depositAmount,
    remainingAmount,
  };
}
