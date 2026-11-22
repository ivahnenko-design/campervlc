import { test } from "node:test";
import assert from "node:assert/strict";
import { adminAccess, canSee, resolveStaff, staffConfig, visibleTo } from "./staff.js";
import { SESSION_COOKIE, newSession, sealValue } from "./auth.js";
import { createMemoryContractStore } from "./contracts.js";
import { createContractHandlers } from "./contract-handlers.js";

const ENV = {
  ADMIN_EMAILS: "Boss@Example.com, second@example.com",
  MANAGER_EMAILS: "partner@example.com:alc-partner; helper@example.com:vlc-yearling,alc-partner; bad@example.com:no-such-camper",
};
const SECRET = "session-secret";

function res() {
  const r = { code: 0, body: null, headers: {} };
  r.status = (c) => ((r.code = c), r);
  r.json = (b) => ((r.body = b), r);
  r.send = (b) => ((r.body = b), r);
  r.setHeader = (k, v) => (r.headers[k] = v);
  return r;
}

const cookieFor = (email) =>
  `${SESSION_COOKIE}=${encodeURIComponent(sealValue(newSession({ id: "u".repeat(32), email, name: "" }, 1_000), SECRET))}`;

test("staff roles come from ADMIN_EMAILS and MANAGER_EMAILS", () => {
  const cfg = staffConfig(ENV);
  assert.deepEqual(cfg.admins, ["boss@example.com", "second@example.com"]);
  assert.deepEqual(cfg.managers, [
    { email: "partner@example.com", vehicleIds: ["alc-partner"] },
    { email: "helper@example.com", vehicleIds: ["vlc-yearling", "alc-partner"] },
  ]);
  assert.equal(resolveStaff("boss@example.com", ENV).role, "owner");
  assert.equal(resolveStaff(" BOSS@example.com ", ENV).all, true);
  const p = resolveStaff("partner@example.com", ENV);
  assert.equal(p.role, "manager");
  assert.deepEqual(p.vehicleIds, ["alc-partner"]);
  assert.equal(resolveStaff("bad@example.com", ENV), null); // only unknown campers
  assert.equal(resolveStaff("guest@example.com", ENV), null);
  assert.equal(resolveStaff("", ENV), null);
  assert.equal(resolveStaff("boss@example.com", {}), null);
});

test("managers see only their campers; unknown-camper records are owner-only", () => {
  const owner = resolveStaff("boss@example.com", ENV);
  const partner = resolveStaff("partner@example.com", ENV);
  assert.equal(canSee(owner, "vlc-yearling"), true);
  assert.equal(canSee(owner, null), true);
  assert.equal(canSee(partner, "alc-partner"), true);
  assert.equal(canSee(partner, "vlc-yearling"), false);
  assert.equal(canSee(partner, null), false);
  assert.equal(canSee(null, "vlc-yearling"), false);
  const rows = [{ v: "vlc-yearling" }, { v: "alc-partner" }, { v: null }];
  assert.deepEqual(visibleTo(partner, rows, (r) => r.v), [{ v: "alc-partner" }]);
  assert.equal(visibleTo(owner, rows, (r) => r.v).length, 3);
});

test("admin access: legacy token = full, session = by email, others none", () => {
  const opts = { adminToken: "tok", sessionSecret: SECRET, env: ENV, now: 2_000 };
  assert.equal(adminAccess({ headers: { "x-admin-token": "tok" } }, opts).role, "owner");
  assert.equal(adminAccess({ headers: { "x-admin-token": "wrong" } }, opts), null);
  assert.equal(adminAccess({ headers: { cookie: cookieFor("partner@example.com") } }, opts).role, "manager");
  assert.equal(adminAccess({ headers: { cookie: cookieFor("boss@example.com") } }, opts).role, "owner");
  assert.equal(adminAccess({ headers: { cookie: cookieFor("guest@example.com") } }, opts), null);
  // A cookie signed with another key is ignored.
  assert.equal(adminAccess({ headers: { cookie: cookieFor("boss@example.com") } }, { ...opts, sessionSecret: "other" }), null);
});

async function setup() {
  const store = createMemoryContractStore([
    { id: "aaaaaaaaaaaa", vehicleId: "vlc-yearling", status: "pending", guestName: "Ann", email: "a@x.com", startDate: "2027-01-01", endDate: "2027-01-03", createdAt: 3, audit: [] },
    { id: "bbbbbbbbbbbb", status: "signed", guestName: "Old", email: "o@x.com", startDate: "2026-01-01", endDate: "2026-01-03", createdAt: 2, audit: [] }, // before vehicleId: vehicle 1
    { id: "cccccccccccc", vehicleId: "alc-partner", status: "pending", guestName: "Pat", email: "p@x.com", startDate: "2027-03-01", endDate: "2027-03-03", createdAt: 1, audit: [] },
  ]);
  const drafts = new Map(
    [
      { id: "d1", status: "new", vehicleId: "alc-partner", parsed: { found: [] } },
      { id: "d2", status: "new", vehicleId: "vlc-yearling", parsed: { found: [] } },
      { id: "d3", status: "new", vehicleId: null, parsed: { found: [] } },
    ].map((d) => [d.id, d]),
  );
  const imports = {
    list: async () => [...drafts.values()],
    get: async (id) => (drafts.has(id) ? { draft: drafts.get(id), etag: "e" } : null),
    save: async (d) => drafts.set(d.id, d),
  };
  const h = createContractHandlers({
    store,
    provider: { name: "own", invite: async () => {} },
    loadBasePdf: async () => new Uint8Array(),
    listBookings: async () => [
      { id: "cs_1", bookingRef: "CVLC-AAAA", status: "confirmed", startDate: "2027-01-01", endDate: "2027-01-03" },
      { id: "cs_2", vehicleId: "alc-partner", bookingRef: "CVLC-BBBB", status: "confirmed", startDate: "2027-03-01", endDate: "2027-03-03" },
    ],
    imports,
    importSetup: () => ({ key: "k", script: "s" }),
    adminToken: "tok",
    sessionSecret: SECRET,
    env: ENV,
    secret: "otp",
    now: () => 2_000,
  });
  const as = (email) => ({ cookie: cookieFor(email), "content-type": "application/json" });
  const call = async (headers, method, query = {}, body) => {
    const r = res();
    await h.admin({ method, headers, query, body }, r);
    return r;
  };
  return { h, call, as, drafts };
}

test("admin lists are filtered by the manager's campers", async () => {
  const { call, as } = await setup();
  const partner = as("partner@example.com");
  const list = await call(partner, "GET");
  assert.deepEqual(list.body.contracts.map((c) => c.id), ["cccccccccccc"]);
  const bookings = await call(partner, "GET", { view: "bookings" });
  assert.deepEqual(bookings.body.bookings.map((b) => b.bookingRef), ["CVLC-BBBB"]);
  const imp = await call(partner, "GET", { view: "imports" });
  assert.deepEqual(imp.body.imports.map((d) => d.id), ["d1"]);
  assert.equal(imp.body.setup, null); // Gmail importer: owner only
  assert.equal((await call(partner, "GET", { view: "calendar" })).code, 403);
  const me = await call(partner, "GET", { view: "me" });
  assert.equal(me.body.role, "manager");
  assert.equal(me.body.staff, null);

  const boss = as("boss@example.com");
  const all = await call(boss, "GET");
  assert.equal(all.body.contracts.length, 3);
  assert.equal(all.body.contracts.find((c) => c.id === "bbbbbbbbbbbb").vehicleId, "vlc-yearling");
  assert.equal((await call(boss, "GET", { view: "bookings" })).body.bookings.length, 2);
  const bossImp = await call(boss, "GET", { view: "imports" });
  assert.equal(bossImp.body.imports.length, 3);
  assert.ok(bossImp.body.setup);
  assert.equal((await call(boss, "GET", { view: "calendar" })).code, 200);
  const bossMe = await call(boss, "GET", { view: "me" });
  assert.equal(bossMe.body.role, "owner");
  assert.deepEqual(bossMe.body.staff.admins, ["boss@example.com", "second@example.com"]);

  // Legacy token: everything, as before.
  assert.equal((await call({ "x-admin-token": "tok" }, "GET")).body.contracts.length, 3);
  // Not staff.
  assert.equal((await call(as("guest@example.com"), "GET")).code, 401);
});

test("managers can not open or change another camper's records", async () => {
  const { call, as, drafts } = await setup();
  const partner = as("partner@example.com");
  assert.equal((await call(partner, "GET", { id: "aaaaaaaaaaaa", detail: "1" })).code, 403);
  assert.equal((await call(partner, "GET", { id: "bbbbbbbbbbbb", pdf: "1" })).code, 403);
  assert.equal((await call(partner, "GET", { id: "cccccccccccc", detail: "1" })).code, 200);
  assert.equal((await call(partner, "POST", {}, { action: "cancel", id: "aaaaaaaaaaaa" })).code, 403);
  assert.equal((await call(partner, "POST", {}, { action: "resend", id: "bbbbbbbbbbbb" })).code, 403);
  assert.equal((await call(partner, "POST", {}, { action: "import_dismiss", importId: "d2" })).code, 403);
  assert.equal((await call(partner, "POST", {}, { action: "import_dismiss", importId: "d3" })).code, 403);
  assert.equal(drafts.get("d2").status, "new");
  const invite = { action: "create", guestName: "Zed Z", email: "z@x.com", startDate: "2027-05-01", endDate: "2027-05-03" };
  assert.equal((await call(partner, "POST", {}, { ...invite, vehicleId: "vlc-yearling" })).code, 403);
  // Cookie POSTs must be JSON (no cross-site form posts).
  const formPost = await call({ cookie: cookieFor("boss@example.com"), "content-type": "application/x-www-form-urlencoded" }, "POST", {}, invite);
  assert.equal(formPost.code, 415);
  // The owner can, for any active camper.
  const made = await call(as("boss@example.com"), "POST", {}, invite);
  assert.equal(made.code, 201);
});
