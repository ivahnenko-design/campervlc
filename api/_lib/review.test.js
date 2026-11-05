import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "./store.js";
import { selectReviewCandidates, runReviewRequests, buildReviewEmail } from "./review.js";

const NOW = Date.UTC(2026, 10, 20, 8, 0); // 2026-11-20
const b = (o) => ({ id: o.ref, bookingRef: o.ref, status: "confirmed", guestEmail: `${o.ref}@x.com`, guestFirstName: "Ana", endDate: "2026-11-19", ...o });

test("selects only finished, confirmed, unasked, non-excluded trips in the window", () => {
  const list = [
    b({ ref: "ok" }),
    b({ ref: "today", endDate: "2026-11-20" }),
    b({ ref: "old", endDate: "2026-11-10" }),
    b({ ref: "cancelled", status: "cancelled" }),
    b({ ref: "asked", reviewRequestedAt: "2026-11-19T08:00:00Z" }),
    b({ ref: "skip", skipReviewRequest: true }),
    b({ ref: "ex", guestEmail: "Done@Reviewed.com" }),
  ];
  const got = selectReviewCandidates(list, NOW, { excludeEmails: ["done@reviewed.com"] });
  assert.deepEqual(got.map((x) => x.id), ["ok"]);
});

test("off and test modes never touch bookings", async () => {
  const store = createMemoryStore([b({ ref: "ok" })]);
  const sent = [];
  const send = async (m) => sent.push(m);
  assert.equal((await runReviewRequests({ store, send, nowMs: NOW })).sent, 0);
  const t = await runReviewRequests({ store, send, nowMs: NOW, mode: "test", testTo: "me@x.com" });
  assert.equal(t.sent, 1);
  assert.equal(sent[0].to, "me@x.com");
  assert.equal((await store.getBooking("ok")).booking.reviewRequestedAt, undefined);
});

test("live mode sends once and records the flag", async () => {
  const store = createMemoryStore([b({ ref: "ok" })]);
  const sent = [];
  const send = async (m) => sent.push(m);
  const r1 = await runReviewRequests({ store, send, nowMs: NOW, mode: "live" });
  const r2 = await runReviewRequests({ store, send, nowMs: NOW, mode: "live" });
  assert.equal(r1.sent, 1);
  assert.equal(r2.sent, 0);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "ok@x.com");
});

test("a failed send releases the claim so the next run retries", async () => {
  const store = createMemoryStore([b({ ref: "ok" })]);
  const r = await runReviewRequests({ store, send: async () => { throw new Error("boom"); }, nowMs: NOW, mode: "live" });
  assert.equal(r.sent, 0);
  assert.equal(r.failed.length, 1);
  assert.equal((await store.getBooking("ok")).booking.reviewRequestedAt, undefined);
});

test("email escapes the name and carries the review link", () => {
  const m = buildReviewEmail({ guestFirstName: "<b>", bookingRef: "CVLC-1", guestEmail: "a@b.c" });
  assert.ok(!m.html.includes("<b>"));
  assert.ok(m.html.includes("g.page/r/CZURsHE9aJOhEBM/review"));
});
