import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateQuote, parseIsoDate, withIva } from "./pricing.js";
import {
  RETENTION_SCALE,
  allocateRefund,
  applyPlanToBooking,
  daysUntil,
  planChange,
  removedExtraIds,
  retentionPct,
  zonedDateTimeToUtcMs,
} from "./booking-changes.js";

// "Today" for every test: 2026-10-07 12:00 in Madrid (10:00Z, CEST).
const NOW = Date.UTC(2026, 9, 7, 10, 0);

function makeBooking(overrides) {
  const b = {
    id: "cs_test_1",
    bookingRef: "CVLC-TEST",
    status: "confirmed",
    createdAt: "2026-09-01T10:00:00.000Z",
    startDate: "2026-11-16",
    endDate: "2026-11-23",
    pickupTime: "10:00",
    returnTime: "10:00",
    extraIds: ["cleaning_fee"],
    prepaymentOption: "full",
    promoCode: null,
    paymentIntentId: "pi_original",
    guestEmail: "guest@example.com",
    ...overrides,
  };
  // Store the amounts the original checkout would have produced.
  const q = calculateQuote({
    start: parseIsoDate(b.startDate),
    end: parseIsoDate(b.endDate),
    pickupTime: b.pickupTime,
    returnTime: b.returnTime,
    extraIds: b.extraIds,
    promoCode: b.promoCode,
    prepaymentOption: b.prepaymentOption,
  });
  return {
    ...b,
    nights: q.nights,
    totalWithIva: q.finalTotalWithIva,
    depositAmount: q.depositAmount,
    remainingAmount: q.remainingAmount,
  };
}

function quoteOf(b, dates) {
  return calculateQuote({
    start: parseIsoDate(dates.startDate ?? b.startDate),
    end: parseIsoDate(dates.endDate ?? b.endDate),
    pickupTime: dates.pickupTime ?? b.pickupTime,
    returnTime: dates.returnTime ?? b.returnTime,
    extraIds: dates.extraIds ?? b.extraIds,
    promoCode: b.promoCode,
    prepaymentOption: b.prepaymentOption,
  });
}

test("retention scale per clause 4.1, one config constant", () => {
  assert.equal(RETENTION_SCALE.length, 4);
  assert.equal(retentionPct(40), 10);
  assert.equal(retentionPct(31), 10);
  assert.equal(retentionPct(30), 30);
  assert.equal(retentionPct(15), 30);
  assert.equal(retentionPct(14), 50);
  assert.equal(retentionPct(7), 50);
  assert.equal(retentionPct(6), 100);
  assert.equal(retentionPct(0), 100);
});

test("Madrid time zone, including the October DST switch", () => {
  assert.equal(zonedDateTimeToUtcMs("2026-07-01", "10:00"), Date.UTC(2026, 6, 1, 8, 0));
  assert.equal(zonedDateTimeToUtcMs("2026-10-26", "10:00"), Date.UTC(2026, 9, 26, 9, 0));
  assert.equal(daysUntil("2026-11-16", NOW), 40);
  // 23:30Z on Oct 7 is already Oct 8 in Madrid.
  assert.equal(daysUntil("2026-10-17", Date.UTC(2026, 9, 7, 23, 30)), 9);
});

test("SCENARIO 1: shorten a 100%-paid booking 40 days ahead → 10% retention, refund", () => {
  const b = makeBooking({ startDate: "2026-11-16", endDate: "2026-11-23", prepaymentOption: "full" });
  const r = planChange({ booking: b, request: { endDate: "2026-11-20" }, nowMs: NOW });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const p = r.plan;

  const orig = quoteOf(b, {});
  const next = quoteOf(b, { endDate: "2026-11-20" });
  const removedValue = withIva(Math.round((orig.nightsSubtotal / 7) * 3)); // 3 nights × 99 €
  const retention = Math.round(removedValue * 0.1);

  assert.equal(p.removedNights, 3);
  assert.equal(p.retentionDays, 40);
  assert.equal(p.retentionPct, 10);
  assert.equal(p.removedNightsValue, removedValue);
  assert.equal(p.retention, retention);
  assert.equal(p.newTotal, next.finalTotalWithIva + retention);
  assert.equal(p.amountPaid, b.totalWithIva);
  assert.equal(p.settlement.type, "refund");
  assert.equal(p.settlement.amount, b.totalWithIva - p.newTotal);
  assert.equal(p.newBalanceDue, 0);
  // Prepayment discount still applies (the original option was 100%).
  assert.ok(p.after.quote.prepaymentDiscountAmount > 0);
});

test("SCENARIO 2: shorten a 50%-deposit booking 10 days ahead → 50% retention", () => {
  const b = makeBooking({ startDate: "2026-10-17", endDate: "2026-10-24", prepaymentOption: "deposit" });
  const r = planChange({ booking: b, request: { endDate: "2026-10-21" }, nowMs: NOW });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const p = r.plan;

  const orig = quoteOf(b, {});
  const next = quoteOf(b, { endDate: "2026-10-21" });
  const removedValue = withIva(Math.round((orig.nightsSubtotal / 7) * 3));
  const retention = Math.round(removedValue * 0.5);

  assert.equal(p.retentionDays, 10);
  assert.equal(p.retentionPct, 50);
  assert.equal(p.retention, retention);
  assert.equal(p.newTotal, next.finalTotalWithIva + retention);
  assert.equal(p.after.quote.prepaymentDiscountAmount, 0);
  // Deposit (50% of the old total) is still below the new total → balance shrinks.
  assert.equal(p.settlement.type, "balance");
  assert.equal(p.newBalanceDue, p.newTotal - b.depositAmount);
  assert.ok(p.newBalanceDue < b.remainingAmount);
});

test("SCENARIO 3a: extend a 100%-paid booking → charge the difference, no retention", () => {
  const b = makeBooking({ startDate: "2026-11-16", endDate: "2026-11-20", prepaymentOption: "full" });
  const r = planChange({ booking: b, request: { endDate: "2026-11-23" }, nowMs: NOW });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const next = quoteOf(b, { endDate: "2026-11-23" });
  assert.equal(r.plan.retention, 0);
  assert.equal(r.plan.after.quote.discountPct, 5); // now 7 nights
  assert.equal(r.plan.settlement.type, "charge");
  assert.equal(r.plan.settlement.amount, next.finalTotalWithIva - b.totalWithIva);
});

test("SCENARIO 3b: extend a 50%-deposit booking → higher balance due on pickup", () => {
  const b = makeBooking({ startDate: "2026-11-16", endDate: "2026-11-20", prepaymentOption: "deposit" });
  const r = planChange({ booking: b, request: { endDate: "2026-11-23" }, nowMs: NOW });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.plan.settlement.type, "balance");
  assert.ok(r.plan.newBalanceDue > b.remainingAmount);
  assert.equal(r.plan.newBalanceDue, r.plan.newTotal - b.depositAmount);
});

test("SCENARIO 4: add an extra", () => {
  const b = makeBooking({ prepaymentOption: "full" });
  const r = planChange({ booking: b, request: { extraIds: ["cleaning_fee", "bbq"] }, nowMs: NOW });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.plan.addedExtraIds, ["bbq"]);
  assert.equal(r.plan.datesChanged, false);
  assert.equal(r.plan.settlement.type, "charge");
  const next = quoteOf(b, { extraIds: ["cleaning_fee", "bbq"] });
  assert.equal(r.plan.settlement.amount, next.finalTotalWithIva - b.totalWithIva);
});

test("moving dates without shortening keeps no retention", () => {
  const b = makeBooking({ startDate: "2026-11-16", endDate: "2026-11-20", prepaymentOption: "full" });
  const r = planChange({ booking: b, request: { startDate: "2026-11-23", endDate: "2026-11-27" }, nowMs: NOW });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.plan.removedNights, 0);
  assert.equal(r.plan.retention, 0);
  assert.equal(r.plan.settlement.type, "none");
});

test("availability: other bookings block, the booking's own days do not", () => {
  const b = makeBooking({ startDate: "2026-11-16", endDate: "2026-11-20" });
  const blocked = new Set(["2026-11-16", "2026-11-17", "2026-11-22"]);
  const shift = planChange({ booking: b, request: { endDate: "2026-11-21" }, nowMs: NOW, blockedDates: blocked });
  assert.equal(shift.ok, true, "own days 16–17 must not count as taken");
  const clash = planChange({ booking: b, request: { endDate: "2026-11-23" }, nowMs: NOW, blockedDates: blocked });
  assert.equal(clash.ok, false);
  assert.deepEqual(clash.errors.find((e) => e.code === "unavailable").dates, ["2026-11-22"]);
});

test("season minimum nights and booking window", () => {
  const b = makeBooking({ startDate: "2026-11-16", endDate: "2026-11-20" });
  const short = planChange({ booking: b, request: { endDate: "2026-11-18" }, nowMs: NOW });
  assert.equal(short.errors[0].code, "min_nights");
  assert.equal(short.errors[0].n, 3);
  const far = planChange({ booking: b, request: { startDate: "2028-01-03", endDate: "2028-01-10" }, nowMs: NOW });
  assert.ok(far.errors.some((e) => e.code === "beyond_max_date"));
});

test("48 h cutoff: self-service closes, new pickup must also be ≥ 48 h away", () => {
  const soon = makeBooking({ startDate: "2026-10-09", endDate: "2026-10-14", pickupTime: "09:00" });
  // Oct 9 09:00 Madrid is 45 h after NOW.
  const r = planChange({ booking: soon, request: { returnTime: "12:00" }, nowMs: NOW });
  assert.equal(r.errors[0].code, "cutoff_passed");
  assert.equal(r.errors[0].whatsapp, "+34 624 038 085");

  const b = makeBooking({ startDate: "2026-11-16", endDate: "2026-11-20" });
  const tooSoon = planChange({ booking: b, request: { startDate: "2026-10-08", endDate: "2026-10-13" }, nowMs: NOW });
  assert.ok(tooSoon.errors.some((e) => e.code === "too_soon"));
});

test("removing a paid extra only more than 7 days ahead; upgrading mileage always allowed", () => {
  const near = makeBooking({ startDate: "2026-10-14", endDate: "2026-10-19", extraIds: ["cleaning_fee", "km_200", "bbq"] });
  const remove = planChange({ booking: near, request: { extraIds: ["cleaning_fee", "km_200"] }, nowMs: NOW });
  assert.equal(remove.errors[0].code, "extra_removal_window");
  const upgrade = planChange({ booking: near, request: { extraIds: ["cleaning_fee", "km_unlimited", "bbq"] }, nowMs: NOW });
  assert.equal(upgrade.ok, true, JSON.stringify(upgrade.errors));
  assert.deepEqual(upgrade.plan.removedExtraIds, []);

  const far = makeBooking({ extraIds: ["cleaning_fee", "bbq"] });
  const ok = planChange({ booking: far, request: { extraIds: ["cleaning_fee"] }, nowMs: NOW });
  assert.equal(ok.ok, true);
  assert.equal(ok.plan.settlement.type, "refund");

  assert.deepEqual(removedExtraIds(["km_unlimited"], ["km_200"]), ["km_unlimited"]);
  // Cleaning is mandatory and cannot be dropped by the client.
  const noClean = planChange({ booking: far, request: { extraIds: ["bbq"] }, nowMs: NOW });
  assert.equal(noClean.errors[0].code, "no_changes");
});

test("cancelled, pending and no-op requests are rejected", () => {
  assert.equal(planChange({ booking: makeBooking({ status: "cancelled" }), request: {}, nowMs: NOW }).errors[0].code, "cancelled");
  const open = { changeId: "x", expiresAt: new Date(NOW + 10 * 60_000).toISOString() };
  assert.equal(
    planChange({ booking: makeBooking({ pendingChange: open }), request: { endDate: "2026-11-24" }, nowMs: NOW }).errors[0].code,
    "pending_payment",
  );
  // An expired checkout can no longer be paid, so it stops blocking changes.
  const expired = { changeId: "x", expiresAt: new Date(NOW - 60_000).toISOString() };
  assert.equal(
    planChange({ booking: makeBooking({ pendingChange: expired }), request: { endDate: "2026-11-24" }, nowMs: NOW }).ok,
    true,
  );
  assert.equal(planChange({ booking: makeBooking({}), request: {}, nowMs: NOW }).errors[0].code, "no_changes");
});

test("promo code from the original booking keeps applying", () => {
  const b = makeBooking({ promoCode: "CAMPER10", prepaymentOption: "deposit" });
  const r = planChange({ booking: b, request: { endDate: "2026-11-24" }, nowMs: NOW });
  assert.equal(r.plan.after.quote.promoCode, "CAMPER10");
  assert.ok(r.plan.after.quote.promoDiscountAmount > 0);
});

test("applyPlanToBooking records history and keeps amounts consistent", () => {
  const b = makeBooking({ startDate: "2026-11-16", endDate: "2026-11-23", prepaymentOption: "full" });
  const { plan } = planChange({ booking: b, request: { endDate: "2026-11-20" }, nowMs: NOW });
  const refunds = [{ refundId: "re_1", paymentIntentId: "pi_original", amount: plan.settlement.amount }];
  const updated = applyPlanToBooking(b, plan, { changeId: "chg_1", nowIso: "2026-10-07T10:00:00.000Z", refunds });
  assert.equal(updated.endDate, "2026-11-20");
  assert.equal(updated.nights, 4);
  assert.equal(updated.totalWithIva, plan.newTotal);
  assert.equal(updated.amountPaid, plan.newTotal);
  assert.equal(updated.depositAmount, plan.newTotal);
  assert.equal(updated.remainingAmount, 0);
  assert.equal(updated.retainedTotal, plan.retention);
  assert.equal(updated.changes.length, 1);
  assert.equal(updated.changes[0].old.endDate, "2026-11-23");
  assert.equal(updated.changes[0].new.endDate, "2026-11-20");
  assert.equal(updated.changes[0].refunds[0].refundId, "re_1");
  assert.deepEqual(updated.payments, [{ paymentIntentId: "pi_original", amount: b.depositAmount, changeId: null }]);

  // A second shortening keeps the first retention in the total.
  const second = planChange({ booking: updated, request: { endDate: "2026-11-19" }, nowMs: NOW });
  assert.equal(second.plan.previousRetention, plan.retention);
  assert.equal(second.plan.newTotal, second.plan.after.quote.finalTotalWithIva + plan.retention + second.plan.retention);
});

test("refunds go to the original payment first, never above what each holds", () => {
  const b = {
    payments: [
      { paymentIntentId: "pi_original", amount: 500 },
      { paymentIntentId: "pi_change", amount: 100 },
    ],
    refunds: [{ paymentIntentId: "pi_original", amount: 450 }],
  };
  assert.deepEqual(allocateRefund(b, 120), {
    parts: [
      { paymentIntentId: "pi_original", amount: 50 },
      { paymentIntentId: "pi_change", amount: 70 },
    ],
    unallocated: 0,
  });
  assert.equal(allocateRefund(b, 1000).unallocated, 850);
});

test("24 h free window applies to shortening: paid 2 h ago, 40 days ahead → no retention", () => {
  const b = makeBooking({ createdAt: new Date(NOW - 2 * 3_600_000).toISOString() });
  const r = planChange({ booking: b, request: { endDate: "2026-11-20" }, nowMs: NOW });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.plan.freeWindow, true);
  assert.equal(r.plan.retentionPct, 0);
  assert.equal(r.plan.retention, 0);
  assert.equal(r.plan.settlement.type, "refund");
});

test("24 h free window ends after 24 h or inside 7 days of pickup", () => {
  const late = makeBooking({ createdAt: new Date(NOW - 25 * 3_600_000).toISOString() });
  const a = planChange({ booking: late, request: { endDate: "2026-11-20" }, nowMs: NOW });
  assert.equal(a.plan.freeWindow, false);
  assert.equal(a.plan.retentionPct, 10);

  const near = makeBooking({
    createdAt: new Date(NOW - 2 * 3_600_000).toISOString(),
    startDate: "2026-10-12",
    endDate: "2026-10-19",
  });
  const c = planChange({ booking: near, request: { endDate: "2026-10-16" }, nowMs: NOW });
  assert.equal(c.plan.freeWindow, false);
  assert.equal(c.plan.retentionPct, 100);
});

test("new bookings need 24 h notice before pickup (Madrid time)", async () => {
  const { startTooSoon, MIN_NOTICE_HOURS } = await import("./notice.js");
  assert.equal(MIN_NOTICE_HOURS, 24);
  // NOW = 2026-10-07 12:00 Madrid
  assert.equal(startTooSoon("2026-10-08", "10:00", NOW), true, "22 h away");
  assert.equal(startTooSoon("2026-10-08", "12:00", NOW), false, "exactly 24 h");
  assert.equal(startTooSoon("2026-10-09", "09:00", NOW), false);
  assert.equal(startTooSoon("2026-10-07", "18:00", NOW), true);
});
