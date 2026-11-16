// Promo codes. SERVER ONLY: never import this file from src/ — anything src/
// imports ends up in the public JS bundle, and a code readable there is a code
// anyone can use. The browser checks a code through /api/contract?scope=promo.

export const PROMO_CODES = { CAMPER10: 10, OWNERTEST: 99 };

// Codes that stop working at a fixed moment (UTC). OWNERTEST is a temporary
// owner test code for live checks; it is never listed anywhere on the site.
export const PROMO_EXPIRES_AT = { OWNERTEST: "2026-10-09T20:00:00Z" };

export const normPromoCode = (code) => (typeof code === "string" ? code.trim().toUpperCase().slice(0, 32) : "");

/** Percent off for a promo code at a moment in time, 0 when unknown or expired. */
export function promoPctAt(code, atMs = Date.now()) {
  const c = normPromoCode(code);
  if (!c || !Object.hasOwn(PROMO_CODES, c)) return 0;
  const expires = PROMO_EXPIRES_AT[c];
  if (expires && atMs >= Date.parse(expires)) return 0;
  return PROMO_CODES[c];
}
