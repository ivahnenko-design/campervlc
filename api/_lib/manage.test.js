import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateQuote, parseIsoDate } from "../../shared/pricing.js";
import { createMemoryStore } from "./store.js";
import { createManageHandlers, completeChangePayment } from "./manage.js";
import { StoreConflictError } from "./store.js";
import { issueToken } from "./token.js";

const SECRET = "test-secret";
const NOW = Date.UTC(2026, 9, 7, 10, 0); // 2026-10-07 12:00 Madrid
let clock = NOW;

function makeBooking(o = {}) {
  const b = {
    id: "cs_test_1", bookingRef: "CVLC-ABCD", status: "confirmed", createdAt: "2026-09-01T10:00:00.000Z",
    startDate: "2026-11-16", endDate: "2026-11-23", pickupTime: "10:00", returnTime: "10:00",
    extraIds: ["cleaning_fee"], prepaymentOption: "full", promoCode: null,
    paymentIntentId: "pi_original", guestEmail: "Guest@Example.com", guestFirstName: "Ana", guestLastName: "Gil",
    guestPhone: "+34600", adults: 2, children: 0, ...o,
  };
  const q = calculateQuote({ start: parseIsoDate(b.startDate), end: parseIsoDate(b.endDate), pickupTime: b.pickupTime, returnTime: b.returnTime, extraIds: b.extraIds, prepaymentOption: b.prepaymentOption });
  return { ...b, nights: q.nights, totalWithIva: q.finalTotalWithIva, depositAmount: q.depositAmount, remainingAmount: q.remainingAmount };
}

function fakeStripe() {
  const calls = { refunds: [], sessions: [] };
  const seen = new Map();
  const once = (key, fn) => { if (!seen.has(key)) seen.set(key, fn()); return seen.get(key); };
  return {
    calls,
    refunds: { create: async (params, { idempotencyKey }) => once("r" + idempotencyKey, () => { calls.refunds.push({ ...params, idempotencyKey }); return { id: `re_${calls.refunds.length}`, status: "succeeded" }; }) },
    checkout: { sessions: {
      create: async (params, { idempotencyKey }) => once("s" + idempotencyKey, () => { calls.sessions.push({ ...params, idempotencyKey }); return { id: `cs_change_${calls.sessions.length}`, url: "https://checkout.test/pay" }; }),
      retrieve: async () => ({ payment_intent: "pi_original" }),
    } },
  };
}

function setup(bookings, { yescapaOk = true, blocked = [] } = {}) {
  const store = createMemoryStore(bookings);
  const stripe = fakeStripe();
  const emails = [];
  const h = createManageHandlers({
    store, stripe, tokenSecret: SECRET, now: () => clock, siteUrl: () => "https://campervlc.com",
    loadBlocked: async () => ({ dates: new Set(blocked), yescapaOk }),
    sendEmails: async (b, c) => { emails.push({ b, c }); },
  });
  return { store, stripe, emails, h };
}

async function call(handler, body) {
  let status, json;
  await handler({ method: "POST", body }, { status(c) { status = c; return this; }, json(j) { json = j; return this; } });
  return { status, json };
}
const tokenFor = (id) => issueToken(id, clock, SECRET);
const change = (h, id, body) => call(h.change, { token: tokenFor(id), ...body });

test("lookup needs BOTH reference and email; wrong pair is an indistinguishable 404", async () => {
  clock = NOW; const { h } = setup([makeBooking()]);
  assert.equal((await call(h.lookup, { bookingRef: "CVLC-ABCD" })).status, 404);
  assert.equal((await call(h.lookup, { email: "guest@example.com" })).status, 404);
  const wrongEmail = await call(h.lookup, { bookingRef: "CVLC-ABCD", email: "x@y.com" });
  const wrongRef = await call(h.lookup, { bookingRef: "CVLC-ZZZZ", email: "guest@example.com" });
  assert.deepEqual([wrongEmail.status, wrongEmail.json], [wrongRef.status, wrongRef.json]);
  const ok = await call(h.lookup, { bookingRef: " cvlc-abcd ", email: "GUEST@example.com" });
  assert.equal(ok.status, 200);
  assert.ok(ok.json.token);
  assert.equal(ok.json.booking.guestPhone, undefined, "no phone in the guest view");
  assert.equal(ok.json.booking.paymentIntentId, undefined);
});

test("change endpoint rejects missing, forged and expired tokens", async () => {
  clock = NOW; const { h } = setup([makeBooking()]);
  assert.equal((await call(h.change, { action: "view" })).status, 401);
  assert.equal((await call(h.change, { token: "a.b", action: "view" })).status, 401);
  const old = issueToken("cs_test_1", NOW - 31 * 60_000, SECRET);
  assert.equal((await call(h.change, { token: old, action: "view" })).status, 401);
  assert.equal((await change(h, "cs_test_1", { action: "view" })).status, 200);
});

test("SCENARIO 1: shorten a 100%-paid booking 40 days ahead -> refund, one Stripe refund even on double click", async () => {
  clock = NOW; const { h, stripe, store, emails } = setup([makeBooking()]);
  const prev = await change(h, "cs_test_1", { action: "preview", change: { endDate: "2026-11-20" } });
  assert.equal(prev.status, 200);
  const plan = prev.json.plan;
  assert.equal(plan.settlement.type, "refund");
  assert.equal(plan.retentionPct, 10);
  const body = { action: "apply", changeId: "chg_abcdefgh1", change: { endDate: "2026-11-20" }, expectedNewTotal: plan.newTotal, confirm: true };
  const [a, b] = await Promise.all([change(h, "cs_test_1", body), change(h, "cs_test_1", body)]);
  assert.deepEqual([a.status, b.status], [200, 200]);
  assert.equal(stripe.calls.refunds.length, 1, "double click must not refund twice");
  assert.equal(stripe.calls.refunds[0].amount, plan.settlement.amount * 100);
  assert.equal(stripe.calls.refunds[0].payment_intent, "pi_original");
  const saved = (await store.getBooking("cs_test_1")).booking;
  assert.equal(saved.endDate, "2026-11-20");
  assert.equal(saved.amountPaid, plan.newTotal);
  assert.equal(saved.changes.length, 1);
  assert.equal(saved.changes[0].refunds[0].refundId, "re_1");
  assert.ok(emails.length >= 1);
});

test("apply refuses without confirm, or when the confirmed total moved", async () => {
  clock = NOW; const { h, stripe } = setup([makeBooking()]);
  const base = { action: "apply", changeId: "chg_abcdefgh2", change: { endDate: "2026-11-20" } };
  assert.equal((await change(h, "cs_test_1", { ...base, expectedNewTotal: 1, confirm: false })).json.code, "confirmation_required");
  const stale = await change(h, "cs_test_1", { ...base, expectedNewTotal: 1, confirm: true });
  assert.equal(stale.status, 409);
  assert.equal(stale.json.code, "amount_changed");
  assert.equal(stripe.calls.refunds.length, 0);
});

test("client-sent totals are ignored: the server prices the change itself", async () => {
  clock = NOW; const { h } = setup([makeBooking()]);
  const r = await change(h, "cs_test_1", { action: "preview", change: { endDate: "2026-11-20", totalWithIva: 1, newTotal: 1, settlement: { type: "refund", amount: 99999 } } });
  assert.notEqual(r.json.plan.newTotal, 1);
  assert.ok(r.json.plan.settlement.amount < 99999);
});

test("SCENARIO 2: shorten a 50%-deposit booking 10 days ahead -> no refund, balance on pickup adjusted", async () => {
  clock = NOW; const b = makeBooking({ startDate: "2026-10-17", endDate: "2026-10-24", prepaymentOption: "deposit" });
  const { h, stripe, store } = setup([b]);
  const prev = (await change(h, "cs_test_1", { action: "preview", change: { endDate: "2026-10-21" } })).json.plan;
  assert.equal(prev.retentionPct, 50);
  assert.equal(prev.settlement.type, "balance");
  const r = await change(h, "cs_test_1", { action: "apply", changeId: "chg_abcdefgh3", change: { endDate: "2026-10-21" }, expectedNewTotal: prev.newTotal, confirm: true });
  assert.equal(r.json.result, "applied");
  assert.equal(stripe.calls.refunds.length, 0);
  const saved = (await store.getBooking("cs_test_1")).booking;
  assert.equal(saved.remainingAmount, prev.newBalanceDue);
  assert.equal(saved.amountPaid, b.depositAmount);
});

test("SCENARIO 3: extend a 100%-paid booking -> Checkout for the difference, applied only after payment", async () => {
  clock = NOW; const { h, stripe, store, emails } = setup([makeBooking({ endDate: "2026-11-20" })]);
  const req = { endDate: "2026-11-23" };
  const plan = (await change(h, "cs_test_1", { action: "preview", change: req })).json.plan;
  assert.equal(plan.settlement.type, "charge");
  const body = { action: "apply", changeId: "chg_abcdefgh4", change: req, expectedNewTotal: plan.newTotal, confirm: true };
  const first = await change(h, "cs_test_1", body);
  const second = await change(h, "cs_test_1", body);
  assert.equal(first.json.result, "checkout");
  assert.equal(second.json.url, first.json.url);
  assert.equal(stripe.calls.sessions.length, 1, "double click creates one Checkout session");
  assert.equal(stripe.calls.sessions[0].line_items[0].price_data.unit_amount, plan.settlement.amount * 100);
  assert.equal((await store.getBooking("cs_test_1")).booking.endDate, "2026-11-20", "not applied before payment");
  // another change while one is awaiting payment is refused
  const blocked = await change(h, "cs_test_1", { action: "preview", change: { extraIds: ["cleaning_fee", "bbq"] } });
  assert.equal(blocked.json.errors[0].code, "pending_payment");

  const session = { id: "cs_change_1", payment_intent: "pi_change", amount_total: plan.settlement.amount * 100, metadata: stripe.calls.sessions[0].metadata };
  const deps = { store, stripe, sendEmails: async (b, c) => emails.push({ b, c }), now: () => clock };
  assert.equal((await completeChangePayment(session, deps)).status, "applied");
  assert.equal((await completeChangePayment(session, deps)).status, "duplicate", "webhook replay is harmless");
  const saved = (await store.getBooking("cs_test_1")).booking;
  assert.equal(saved.endDate, "2026-11-23");
  assert.equal(saved.amountPaid, plan.newTotal);
  assert.equal(saved.pendingChange, null);
  assert.deepEqual(saved.payments.map((p) => p.paymentIntentId), ["pi_original", "pi_change"]);
});

test("a payment for a superseded change is refunded, not kept", async () => {
  clock = NOW; const { stripe, store } = setup([makeBooking()]);
  const alerts = [];
  const r = await completeChangePayment(
    { id: "cs_x", payment_intent: "pi_orphan", amount_total: 5000, metadata: { bookingId: "cs_test_1", changeId: "chg_gone0001" } },
    { store, stripe, sendEmails: async () => {}, sendOwnerAlert: async (t) => alerts.push(t), now: () => clock },
  );
  assert.equal(r.status, "orphan_refunded");
  assert.equal(stripe.calls.refunds[0].payment_intent, "pi_orphan");
  assert.equal(alerts.length, 1);
});

test("SCENARIO 4: add an extra on a 50%-deposit booking -> balance grows; km upgrade allowed", async () => {
  clock = NOW; const b = makeBooking({ prepaymentOption: "deposit", extraIds: ["cleaning_fee", "km_200"] });
  const { h, store } = setup([b]);
  const req = { extraIds: ["cleaning_fee", "km_unlimited", "bbq"] };
  const plan = (await change(h, "cs_test_1", { action: "preview", change: req })).json.plan;
  assert.deepEqual(plan.addedExtraIds.sort(), ["bbq", "km_unlimited"]);
  assert.equal(plan.settlement.type, "balance");
  await change(h, "cs_test_1", { action: "apply", changeId: "chg_abcdefgh5", change: req, expectedNewTotal: plan.newTotal, confirm: true });
  const saved = (await store.getBooking("cs_test_1")).booking;
  assert.ok(saved.extraIds.includes("km_unlimited") && !saved.extraIds.includes("km_200"));
  assert.ok(saved.remainingAmount > b.remainingAmount);
});

test("availability: taken dates are refused, and an unreadable Yescapa feed blocks date changes", async () => {
  clock = NOW;
  let s = setup([makeBooking({ endDate: "2026-11-20" })], { blocked: ["2026-11-22"] });
  const clash = await change(s.h, "cs_test_1", { action: "preview", change: { endDate: "2026-11-23" } });
  assert.equal(clash.status, 422);
  assert.equal(clash.json.errors[0].code, "unavailable");
  s = setup([makeBooking({ endDate: "2026-11-20" })], { yescapaOk: false });
  assert.equal((await change(s.h, "cs_test_1", { action: "preview", change: { endDate: "2026-11-23" } })).status, 503);
  // extras-only changes do not depend on the calendar
  assert.equal((await change(s.h, "cs_test_1", { action: "preview", change: { extraIds: ["cleaning_fee", "bbq"] } })).status, 200);
});

test("inside 48 h only WhatsApp is offered", async () => {
  clock = NOW; const { h } = setup([makeBooking({ startDate: "2026-10-09", endDate: "2026-10-14", pickupTime: "09:00" })]);
  const r = await change(h, "cs_test_1", { action: "preview", change: { endDate: "2026-10-15" } });
  assert.equal(r.json.errors[0].code, "cutoff_passed");
  assert.equal(r.json.errors[0].whatsapp, "+34 624 038 085");
});

test("a paid change is still applied when the store keeps reporting write conflicts", async () => {
  clock = NOW; const { h, stripe, store, emails } = setup([makeBooking({ endDate: "2026-11-20" })]);
  const req = { endDate: "2026-11-23" };
  const plan = (await change(h, "cs_test_1", { action: "preview", change: req })).json.plan;
  await change(h, "cs_test_1", { action: "apply", changeId: "chg_abcdefgh5", change: req, expectedNewTotal: plan.newTotal, confirm: true });
  const session = { id: "cs_change_1", payment_intent: "pi_change", amount_total: plan.settlement.amount * 100, metadata: stripe.calls.sessions[0].metadata };

  const realSave = store.saveBooking.bind(store);
  let guarded = 0;
  const flaky = { ...store, getBooking: store.getBooking.bind(store), saveBooking: async (b, opts = {}) => {
    if (opts.etag) { guarded += 1; throw new StoreConflictError(b.id); }
    return realSave(b, opts);
  } };
  const deps = { store: flaky, stripe, sendEmails: async (b, c) => emails.push({ b, c }), now: () => clock };
  assert.equal((await completeChangePayment(session, deps)).status, "applied");
  assert.equal(guarded, 2, "two guarded attempts, then the unguarded write");
  assert.equal((await store.getBooking("cs_test_1")).booking.endDate, "2026-11-23");
  assert.equal(emails.length, 1);
});
