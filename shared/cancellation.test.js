import { test } from "node:test";
import assert from "node:assert/strict";
import { RETENTION_SCALE, cancellationQuote, retentionPct } from "./cancellation.js";
import { daysUntil, zonedDateTimeToUtcMs } from "./dates.js";

// "Now" for every test: 2026-10-07 12:00 in Madrid (10:00Z, CEST).
const NOW = Date.UTC(2026, 9, 7, 10, 0);
const hoursAgo = (h) => new Date(NOW - h * 3_600_000).toISOString();

function booking(overrides) {
  return {
    createdAt: hoursAgo(24 * 20),
    startDate: "2026-11-16", // 40 days ahead
    totalWithIva: 1000,
    amountPaid: 1000,
    ...overrides,
  };
}

test("clause 4.1 scale is one config constant", () => {
  assert.equal(RETENTION_SCALE.length, 4);
  assert.deepEqual(
    [40, 31, 30, 15, 14, 7, 6, 0, -3].map(retentionPct),
    [10, 10, 30, 30, 50, 50, 100, 100, 100],
  );
});

test("Madrid calendar days and DST", () => {
  assert.equal(daysUntil("2026-11-16", NOW), 40);
  // 23:30Z on Oct 7 is already Oct 8 in Madrid.
  assert.equal(daysUntil("2026-10-17", Date.UTC(2026, 9, 7, 23, 30)), 9);
  assert.equal(zonedDateTimeToUtcMs("2026-07-01", "10:00"), Date.UTC(2026, 6, 1, 8, 0));
  assert.equal(zonedDateTimeToUtcMs("2026-10-26", "10:00"), Date.UTC(2026, 9, 26, 9, 0));
});

test("100%-paid booking: refund is paid minus retention of the TOTAL price", () => {
  const q = cancellationQuote(booking({ startDate: "2026-11-16" }), NOW); // 40 days → 10%
  assert.equal(q.retentionPct, 10);
  assert.equal(q.retained, 100);
  assert.equal(q.refund, 900);
  assert.equal(q.free, false);

  const mid = cancellationQuote(booking({ startDate: "2026-10-27" }), NOW); // 20 days → 30%
  assert.deepEqual([mid.retentionPct, mid.retained, mid.refund], [30, 300, 700]);

  const near = cancellationQuote(booking({ startDate: "2026-10-17" }), NOW); // 10 days → 50%
  assert.deepEqual([near.retentionPct, near.retained, near.refund], [50, 500, 500]);

  const late = cancellationQuote(booking({ startDate: "2026-10-12" }), NOW); // 5 days → 100%
  assert.deepEqual([late.retentionPct, late.retained, late.refund, late.unpaidRetention], [100, 1000, 0, 0]);
});

test("50%-deposit booking: refund capped by what was paid, unpaid share not charged", () => {
  const dep = booking({ amountPaid: 500 });
  const far = cancellationQuote({ ...dep, startDate: "2026-11-16" }, NOW); // 10% of 1000 = 100
  assert.deepEqual([far.retained, far.refund, far.unpaidRetention], [100, 400, 0]);

  const half = cancellationQuote({ ...dep, startDate: "2026-10-17" }, NOW); // 50% = 500 = paid
  assert.deepEqual([half.retained, half.refund, half.unpaidRetention], [500, 0, 0]);

  const late = cancellationQuote({ ...dep, startDate: "2026-10-12" }, NOW); // 100% = 1000, paid 500
  assert.deepEqual([late.retained, late.refund, late.unpaidRetention], [1000, 0, 500]);
});

test("24-hour free cancellation: only while pickup is MORE than 7 days away", () => {
  const fresh = booking({ createdAt: hoursAgo(2), startDate: "2026-10-15" }); // 8 days
  const q = cancellationQuote(fresh, NOW);
  assert.deepEqual([q.free, q.retentionPct, q.refund], [true, 0, 1000]);

  // Exactly 7 days is not "more than 7": normal scale applies (14–7 days → 50%).
  const sevenDays = cancellationQuote(booking({ createdAt: hoursAgo(2), startDate: "2026-10-14" }), NOW);
  assert.deepEqual([sevenDays.free, sevenDays.retentionPct], [false, 50]);

  // Booked 25 hours ago: the free window is over.
  const stale = cancellationQuote(booking({ createdAt: hoursAgo(25), startDate: "2026-10-27" }), NOW);
  assert.deepEqual([stale.free, stale.retentionPct], [false, 30]);

  // Free also for a 50% deposit: everything paid comes back.
  const dep = cancellationQuote(booking({ createdAt: hoursAgo(1), startDate: "2026-11-16", amountPaid: 500 }), NOW);
  assert.deepEqual([dep.free, dep.refund], [true, 500]);
});

test("earlier partial-cancellation retention is kept and not scaled again", () => {
  // Total 900 of which 100 was already retained; paid in full (900).
  const b = booking({ totalWithIva: 900, amountPaid: 900, retainedTotal: 100, startDate: "2026-10-17" }); // 50%
  const q = cancellationQuote(b, NOW);
  assert.equal(q.retained, Math.round(800 * 0.5) + 100); // 500
  assert.equal(q.refund, 400);
});
