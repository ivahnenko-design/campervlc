import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculatePrice,
  calculateQuote,
  excessHours,
  getPriceForDate,
  isValidTimeOption,
  lateReturnSurchargePct,
  normalizeExtraIds,
  parseIsoDate,
  TIME_OPTIONS,
} from "./pricing.js";

const oct7 = new Date(2026, 9, 7);   // mid season (Oct 5–7): 125 €
const oct12 = new Date(2026, 9, 12); // high season (Oct 8–18): 155 €
const NIGHTS_OCT7_12 = 125 + 155 * 4; // 745

test("time options run 09:00–20:00 in 30-minute steps", () => {
  assert.equal(TIME_OPTIONS[0], "09:00");
  assert.equal(TIME_OPTIONS.at(-1), "20:00");
  assert.equal(TIME_OPTIONS.length, 23);
  assert.ok(isValidTimeOption("14:30"));
  assert.ok(!isValidTimeOption("14:15"));
  assert.ok(!isValidTimeOption("21:00"));
  assert.ok(!isValidTimeOption(undefined));
});

test("excess hours and surcharge tiers", () => {
  assert.equal(excessHours("10:00", "10:00"), 0);
  assert.equal(excessHours("14:00", "10:00"), 0);
  assert.equal(excessHours("10:00", "14:30"), 4.5);
  assert.equal(lateReturnSurchargePct(0), 0);
  assert.equal(lateReturnSurchargePct(6), 50);
  assert.equal(lateReturnSurchargePct(6.5), 100);
});

test("return at or before pickup time: no surcharge", () => {
  const p = calculatePrice(oct7, oct12, "10:00", "10:00");
  assert.equal(p.nights, 5);
  assert.equal(p.surcharge, 0);
  assert.equal(p.subtotal, NIGHTS_OCT7_12);

  const earlier = calculatePrice(oct7, oct12, "14:00", "10:00");
  assert.equal(earlier.surcharge, 0);
});

test("spec example 1: Oct 7 10:00 → Oct 12 14:00 = 5 nights + 50% of return-date rate", () => {
  const p = calculatePrice(oct7, oct12, "10:00", "14:00");
  assert.equal(p.nights, 5);
  assert.equal(p.excessHours, 4);
  assert.equal(p.surchargePct, 50);
  assert.equal(getPriceForDate(oct12), 155);
  assert.equal(p.surcharge, Math.round(155 * 0.5)); // 78
  assert.equal(p.subtotal, NIGHTS_OCT7_12 + 78);
});

test("spec example 2: Oct 7 10:00 → Oct 12 18:00 = 6 nights' worth", () => {
  const p = calculatePrice(oct7, oct12, "10:00", "18:00");
  assert.equal(p.excessHours, 8);
  assert.equal(p.surchargePct, 100);
  assert.equal(p.surcharge, 155);
  assert.equal(p.subtotal, NIGHTS_OCT7_12 + 155);
});

test("long-stay discount applies to subtotal including the surcharge", () => {
  const start = new Date(2026, 10, 2);  // low season
  const end = new Date(2026, 10, 9);    // 7 nights → 5%
  const p = calculatePrice(start, end, "10:00", "12:00");
  assert.equal(p.nights, 7);
  assert.equal(p.surcharge, Math.round(90 * 0.5));
  assert.equal(p.discountPct, 5);
  assert.equal(p.discountAmount, Math.round((90 * 7 + 50) * 0.05));
});

test("quote: promo and prepayment discounts run after extras, on the surcharged total", () => {
  const q = calculateQuote({
    start: oct7,
    end: oct12,
    pickupTime: "10:00",
    returnTime: "14:00",
    extraIds: ["km_200", "bedding"],
    promoCode: "camper10",
    prepaymentOption: "full",
  });
  const base = NIGHTS_OCT7_12 + 78;             // 823, no long-stay discount at 5 nights
  const extras = 20 * 5 + 20;                   // km_200 per night + bedding
  const pre = base + extras + 50;               // + cleaning
  const promo = Math.round(pre * 0.1);
  const afterPromo = pre - promo;
  const prepay = Math.round(afterPromo * 0.05);
  assert.equal(q.appliedPromoCode, "CAMPER10");
  assert.equal(q.extrasTotal, extras);
  assert.equal(q.promoDiscountAmount, promo);
  assert.equal(q.prepaymentDiscountAmount, prepay);
  assert.equal(q.finalTotal, afterPromo - prepay);
  assert.equal(q.finalTotalWithIva, Math.round(q.finalTotal * 1.21));
  assert.equal(q.depositAmount, q.finalTotalWithIva);
  assert.equal(q.remainingAmount, 0);
});

test("quote: deposit split and unknown promo code", () => {
  const q = calculateQuote({ start: oct7, end: oct12, promoCode: "NOPE" });
  assert.equal(q.appliedPromoCode, null);
  assert.equal(q.promoDiscountAmount, 0);
  assert.equal(q.depositAmount, Math.round(q.finalTotalWithIva * 0.5));
  assert.equal(q.depositAmount + q.remainingAmount, q.finalTotalWithIva);
});

test("extras: unknown ids dropped, mileage plans exclusive", () => {
  assert.deepEqual(normalizeExtraIds(["km_200", "km_unlimited", "bogus", "bbq"]), ["km_unlimited", "bbq"]);
  // The broader plan wins regardless of the order the client sent them in.
  assert.deepEqual(normalizeExtraIds(["km_unlimited", "km_200"]), ["km_unlimited"]);
  assert.deepEqual(normalizeExtraIds("not-an-array"), []);
});

test("parseIsoDate rejects malformed and rolled-over dates", () => {
  assert.equal(parseIsoDate("2026-02-31"), null);
  assert.equal(parseIsoDate("2026-1-5"), null);
  assert.equal(parseIsoDate(20261007), null);
  const d = parseIsoDate("2026-10-07");
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 9);
  assert.equal(d.getDate(), 7);
});

test("OWNERTEST: 99% off until it expires, then ignored; floor keeps the charge >= 1 EUR", async () => {
  const { calculateQuote, promoPctAt, parseIsoDate, PROMO_EXPIRES_AT } = await import("./pricing.js");
  const base = { start: parseIsoDate("2026-11-16"), end: parseIsoDate("2026-11-23"), prepaymentOption: "full" };
  const before = Date.parse(PROMO_EXPIRES_AT.OWNERTEST) - 1000;
  const after = Date.parse(PROMO_EXPIRES_AT.OWNERTEST) + 1000;
  const plain = calculateQuote({ ...base, promoValidAtMs: before });
  const test = calculateQuote({ ...base, promoCode: "ownertest", promoValidAtMs: before });
  assert.equal(test.appliedPromoCode, "OWNERTEST");
  assert.ok(test.finalTotalWithIva >= 1 && test.finalTotalWithIva < plain.finalTotalWithIva * 0.05);
  const expired = calculateQuote({ ...base, promoCode: "OWNERTEST", promoValidAtMs: after });
  assert.equal(expired.appliedPromoCode, null);
  assert.equal(expired.finalTotalWithIva, plain.finalTotalWithIva);
  assert.equal(promoPctAt("OWNERTEST", after), 0);
  assert.equal(promoPctAt("CAMPER10", after), 10);
});
