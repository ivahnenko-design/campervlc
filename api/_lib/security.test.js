// Regression tests for the security review of 2026-11-16: each test is one hole
// that was open before (see the commit message for the list).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateQuote, parseIsoDate } from "../../shared/pricing.js";
import { cancellationQuote } from "../../shared/cancellation.js";
import { createMemoryStore } from "./store.js";
import { createManageHandlers } from "./manage.js";
import { createCancelHandler } from "./cancel.js";
import { issueToken, verifyToken } from "./token.js";
import { createMemoryLimiter } from "./rate-limit.js";
import { calendarKeyOk, calendarFeedKey } from "./calendar-key.js";
import {
  checkoutKeys,
  contractKeys,
  createDiscountRegistry,
  createMemoryBlob,
  emailKey,
  nameKey,
  phoneKey,
} from "./member-discount.js";

const SECRET = "test-secret";
const NOW = Date.UTC(2026, 9, 7, 10, 0);
let clock = NOW;

function makeBooking(o = {}) {
  const b = {
    id: "cs_test_1", bookingRef: "CVLC-ABCD", status: "confirmed", createdAt: "2026-09-01T10:00:00.000Z",
    startDate: "2026-11-16", endDate: "2026-11-23", pickupTime: "10:00", returnTime: "10:00",
    extraIds: ["cleaning_fee"], prepaymentOption: "full", promoCode: null,
    paymentIntentId: "pi_original", guestEmail: "guest@example.com", guestFirstName: "Ana", guestLastName: "Gil",
    guestPhone: "+34600111222", adults: 2, children: 0, ...o,
  };
  const q = calculateQuote({ start: parseIsoDate(b.startDate), end: parseIsoDate(b.endDate), pickupTime: b.pickupTime, returnTime: b.returnTime, extraIds: b.extraIds, prepaymentOption: b.prepaymentOption });
  return { ...b, nights: q.nights, totalWithIva: q.finalTotalWithIva, depositAmount: q.depositAmount, remainingAmount: q.remainingAmount };
}

/** Stripe fake whose idempotency only covers identical keys, like the real one. */
function fakeStripe() {
  const calls = { refunds: [] };
  const seen = new Map();
  return {
    calls,
    refunds: {
      create: async (params, { idempotencyKey }) => {
        if (!seen.has(idempotencyKey)) {
          calls.refunds.push({ ...params, idempotencyKey });
          seen.set(idempotencyKey, { id: `re_${calls.refunds.length}`, status: "succeeded" });
        }
        return seen.get(idempotencyKey);
      },
    },
    checkout: { sessions: { create: async () => ({ id: "cs_x", url: "https://x" }), retrieve: async () => ({ payment_intent: "pi_original" }) } },
  };
}

async function call(handler, body, headers = {}) {
  let status, json;
  await handler(
    { method: "POST", body, headers },
    { status(c) { status = c; return this; }, json(j) { json = j; return this; }, setHeader() {} },
  );
  return { status, json };
}

// ── 1. parallel refunds ─────────────────────────────────────────────────────

test("parallel booking changes with different changeIds refund at most once", async () => {
  clock = NOW;
  const store = createMemoryStore([makeBooking()]);
  const stripe = fakeStripe();
  const h = createManageHandlers({
    store, stripe, tokenSecret: SECRET, now: () => clock, siteUrl: () => "https://campervlc.com",
    loadBlocked: async () => ({ dates: new Set(), yescapaOk: true }),
    sendEmails: async () => {},
  });
  const token = issueToken("cs_test_1", clock, SECRET);
  const preview = await call(h.change, { token, action: "preview", change: { endDate: "2026-11-20" } });
  const plan = preview.json.plan;
  assert.equal(plan.settlement.type, "refund");
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      call(h.change, { token, action: "apply", changeId: `chg_parallel_${i}`, change: { endDate: "2026-11-20" }, expectedNewTotal: plan.newTotal, confirm: true }),
    ),
  );
  assert.equal(results.filter((r) => r.status === 200).length, 1, JSON.stringify(results.map((r) => r.status)));
  assert.equal(stripe.calls.refunds.length, 1, "only one refund leaves Stripe");
  const saved = (await store.getBooking("cs_test_1")).booking;
  assert.equal(saved.refundLock, null);
  assert.equal(saved.changes.length, 1);
});

// ── 2. moving dates does not lower the cancellation retention ─────────────────

test("moving the stay later does not lower the cancellation retention", async () => {
  // Pickup in 5 days: cancelling now keeps 100%.
  const soon = makeBooking({ startDate: "2026-10-12", endDate: "2026-10-19", createdAt: "2026-09-01T10:00:00.000Z" });
  assert.equal(cancellationQuote(soon, NOW).retentionPct, 100);
  // The guest moves it two months ahead through /manage-booking...
  const moved = { ...soon, originalStartDate: "2026-10-12", startDate: "2026-12-14", endDate: "2026-12-21" };
  // ...and cancels: still 100%, counted from the original date.
  assert.equal(cancellationQuote(moved, NOW).retentionPct, 100);
  // A booking that was never moved keeps its normal scale.
  assert.equal(cancellationQuote({ ...moved, originalStartDate: undefined }, NOW).retentionPct, 10);
});

// ── 3. cancellation needs the code emailed to the booking address ────────────

function cancelSetup(bookings = [makeBooking({ startDate: "2026-12-20", endDate: "2026-12-27" })]) {
  const store = createMemoryStore(bookings);
  const stripe = fakeStripe();
  const codes = [];
  const handler = createCancelHandler({
    store, stripe, secret: SECRET,
    sendCode: async (b, code) => codes.push({ to: b.guestEmail, code }),
    sendEmails: async () => {},
    allow: createMemoryLimiter(),
    ipOf: () => "1.2.3.4",
    now: () => clock,
  });
  return { store, stripe, codes, handler };
}

test("cancel: name or reference alone does nothing; the code goes only to the booking's email", async () => {
  clock = NOW;
  const { handler, codes, stripe } = cancelSetup();
  // The old attack: reference + last name.
  assert.equal((await call(handler, { action: "confirm", bookingRef: "CVLC-ABCD", lastName: "Gil" })).status, 401);
  assert.equal((await call(handler, { action: "request", bookingRef: "CVLC-ABCD", email: "attacker@evil.com" })).status, 404);
  assert.equal(codes.length, 0);
  const sent = await call(handler, { action: "request", bookingRef: "cvlc-abcd", email: "GUEST@example.com" });
  assert.equal(sent.status, 200);
  assert.deepEqual(codes.map((c) => c.to), ["guest@example.com"]);
  // A manage token is not a cancel token.
  const manageToken = issueToken("cs_test_1", clock, SECRET);
  assert.equal((await call(handler, { action: "confirm", token: manageToken })).status, 401);
  assert.equal(stripe.calls.refunds.length, 0);
});

test("cancel: wrong codes are limited, the right one gives a quote and a cancel token", async () => {
  clock = NOW;
  const { handler, codes, stripe, store } = cancelSetup();
  await call(handler, { action: "request", bookingRef: "CVLC-ABCD", email: "guest@example.com" });
  const id = { bookingRef: "CVLC-ABCD", email: "guest@example.com" };
  const wrong = codes[0].code === "000000" ? "111111" : "000000";
  assert.equal((await call(handler, { action: "lookup", ...id, code: wrong })).json.error, "code_wrong");
  const ok = await call(handler, { action: "lookup", ...id, code: codes[0].code });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.retentionPct, 10); // pickup 74 days ahead
  assert.ok(verifyToken(ok.json.token, clock, SECRET, "cancel"));
  const [a, b] = await Promise.all([
    call(handler, { action: "confirm", token: ok.json.token }),
    call(handler, { action: "confirm", token: ok.json.token }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  assert.equal(stripe.calls.refunds.length, 1);
  const saved = (await store.getBooking("cs_test_1")).booking;
  assert.equal(saved.status, "cancelled");
  assert.equal(saved.cancelCode, null);
});

test("cancel: five wrong codes lock the code", async () => {
  clock = NOW;
  const { handler, codes } = cancelSetup();
  const id = { bookingRef: "CVLC-ABCD", email: "guest@example.com" };
  await call(handler, { action: "request", ...id });
  const wrong = codes[0].code === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++) await call(handler, { action: "lookup", ...id, code: wrong });
  const r = await call(handler, { action: "lookup", ...id, code: codes[0].code });
  assert.equal(r.status, 429);
});

// ── 4. calendar feed ──────────────────────────────────────────────────────────

test("calendar feed needs the secret key", () => {
  const env = { MANAGE_BOOKING_SECRET: "s" };
  const key = calendarFeedKey(env);
  assert.ok(key && key.length >= 20);
  assert.equal(calendarKeyOk(key, env), true);
  assert.equal(calendarKeyOk(undefined, env), false);
  assert.equal(calendarKeyOk("x".repeat(key.length), env), false);
  assert.equal(calendarKeyOk("anything", {}), false, "no secret configured -> closed");
  assert.equal(calendarFeedKey({ ...env, CALENDAR_FEED_KEY: "own" }), "own");
});

// ── 5. promo codes stay on the server ─────────────────────────────────────────

test("promo codes are not in the shared pricing module (public bundle)", () => {
  const src = readFileSync(new URL("../../shared/pricing.js", import.meta.url), "utf8");
  assert.ok(!/CAMPER10|OWNERTEST/.test(src));
  // Without a percent from the server a code gives nothing.
  const q = calculateQuote({ start: parseIsoDate("2026-11-16"), end: parseIsoDate("2026-11-23"), promoCode: "CAMPER10" });
  assert.equal(q.appliedPromoCode, null);
});

// ── 6. first-booking discount is per person ───────────────────────────────────

test("identity keys fold spelling variants", () => {
  assert.equal(nameKey("José", "García López"), nameKey("garcia lopez", "JOSE"));
  assert.equal(nameKey("Ana"), null, "one word is not an identity");
  assert.equal(phoneKey("+34 624 03 80 85"), phoneKey("624038085"));
  assert.equal(emailKey("Ivan.Petrov+promo@gmail.com"), emailKey("ivanpetrov@googlemail.com"));
  assert.notEqual(emailKey("ivan.petrov@yahoo.com"), emailKey("ivanpetrov@yahoo.com"), "dots only fold on Gmail");
  assert.equal(emailKey("a+b@yahoo.com"), emailKey("a@yahoo.com"));
});

test("discount registry: a used name, phone or email blocks a new account; contract documents are checked", async () => {
  const reg = createDiscountRegistry({ secret: SECRET, store: createMemoryBlob() });
  const first = checkoutKeys({ firstName: "Ivan", lastName: "Petrov", phone: "+34 600 111 222", email: "ivan@gmail.com", accountEmail: "ivan@gmail.com" });
  assert.deepEqual(await reg.taken(first), []);
  assert.equal(await reg.reserve(first, { userId: "u1", expiresAt: NOW + 1000, now: NOW }), true);
  // While u1 is paying, another account can not take the same identity...
  assert.equal(await reg.reserve(first, { userId: "u2", expiresAt: NOW + 1000, now: NOW }), false);
  // ...but u1 itself can retry its checkout.
  assert.equal(await reg.reserve(first, { userId: "u1", expiresAt: NOW + 2000, now: NOW }), true);
  await reg.markUsed(first, { bookingId: "b1" });

  // Same person, new mailbox, same name: refused.
  const sameName = checkoutKeys({ firstName: "IVAN", lastName: "petrov", phone: "+44 7000 000000", email: "other@mail.com", accountEmail: "other@mail.com" });
  assert.ok((await reg.taken(sameName)).some((t) => t.key.startsWith("name:")));
  // Different name, same phone: refused.
  const samePhone = checkoutKeys({ firstName: "Olga", lastName: "Petrova", phone: "600111222", email: "olga@mail.com" });
  assert.ok((await reg.taken(samePhone)).some((t) => t.key.startsWith("phone:")));
  // Gmail variant of the same mailbox: refused.
  assert.ok((await reg.taken(checkoutKeys({ email: "i.v.a.n+2@gmail.com" }))).length > 0);
  // A different person: allowed.
  assert.deepEqual(await reg.taken(checkoutKeys({ firstName: "Maria", lastName: "Lopez", phone: "699999999", email: "maria@mail.com" })), []);

  // Contract: b1 signs with a passport; a later booking b2 (new name, new phone)
  // that also got the discount signs with the same passport -> clash.
  const doc = { docNumber: "AB 123456", licenseNumber: "X-998877", fullName: "Ivan Petrov", phone: "600111222" };
  assert.deepEqual(await reg.markUsed(contractKeys(doc), { bookingId: "b1" }), [], "own booking is not a clash");
  const clashes = await reg.markUsed(contractKeys({ ...doc, fullName: "John Smith", phone: "+1 555 0101" }), { bookingId: "b2" });
  assert.ok(clashes.some((c) => c.key.startsWith("doc:") && c.bookingId === "b1"));
});
