import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { applyPatch, createMemoryActaStore, decodeJpeg, newActa, requireSignable, validateActaPatch } from "./actas.js";
import { bookingForContract, createActaHandler } from "./acta-handlers.js";
import { guestActaEmail, sendActaEmails } from "./acta-email.js";
import { createMemoryContractStore } from "./contracts.js";
import { SESSION_COOKIE, newSession, sealValue } from "./auth.js";

const PNG = readFileSync(new URL("../../public/images/acta/vlc-yearling.png", import.meta.url));
const JPG = readFileSync(new URL("../../public/images/231030201158_mclouis-yearling-83-059-copy.jpg", import.meta.url));
const pngUrl = `data:image/png;base64,${PNG.toString("base64")}`;
const jpgUrl = `data:image/jpeg;base64,${JPG.toString("base64")}`;

const ENV = { ADMIN_EMAILS: "boss@example.com", MANAGER_EMAILS: "partner@example.com:alc-partner" };
const SECRET = "session-secret";
const NOW = 1_800_000_000_000;
const cookieFor = (email) =>
  `${SESSION_COOKIE}=${encodeURIComponent(sealValue(newSession({ id: "u".repeat(32), email, name: "" }, NOW - 1000), SECRET))}`;

function res() {
  const r = { code: 0, body: null, headers: {} };
  r.status = (c) => ((r.code = c), r);
  r.json = (b) => ((r.body = b), r);
  r.send = (b) => ((r.body = b), r);
  r.setHeader = (k, v) => (r.headers[k] = v);
  return r;
}

const CONTRACTS = [
  { id: "aaaaaaaaaaaa", vehicleId: "vlc-yearling", status: "signed", guestName: "Анна Smith", email: "ann@x.com", language: "ru", bookingRef: "CR-1", startDate: "2027-03-01", endDate: "2027-03-05", pickupTime: "10:00", returnTime: "10:00", version: "v6", createdAt: 1, audit: [] },
  { id: "cccccccccccc", vehicleId: "alc-partner", status: "pending", guestName: "Pat", email: "p@x.com", language: "en", startDate: "2027-04-01", endDate: "2027-04-03", pickupTime: "10:00", returnTime: "10:00", createdAt: 2, audit: [] },
  { id: "dddddddddddd", vehicleId: "vlc-yearling", status: "cancelled", guestName: "Gone", email: "g@x.com", language: "en", startDate: "2027-05-01", endDate: "2027-05-03", createdAt: 3, audit: [] },
];

function setup() {
  const actas = createMemoryActaStore();
  const sent = [];
  const h = createActaHandler({
    actas,
    contracts: createMemoryContractStore(CONTRACTS),
    listBookings: async () => [{ id: "b1", bookingRef: "CR-1", vehicleId: "vlc-yearling", status: "confirmed", extraIds: ["cleaning_fee", "km_200", "bbq"], startDate: "2027-03-01", guestEmail: "ann@x.com" }],
    loadDiagram: async () => PNG,
    sendEmails: (c, a, pdf) => sendActaEmails(c, a, pdf, { send: async (m) => sent.push(m), env: {} }),
    adminToken: "tok",
    sessionSecret: SECRET,
    env: ENV,
    now: () => NOW,
  });
  const call = async (who, method, { query = {}, body } = {}) => {
    const r = res();
    const headers = { "content-type": "application/json", ...(who === "token" ? { "x-admin-token": "tok" } : who ? { cookie: cookieFor(who) } : {}) };
    await h({ method, query: { scope: "acta", ...query }, headers, body }, r);
    return r;
  };
  return { actas, sent, call };
}

// ── validation ──────────────────────────────────────────────────────────────

test("draft patch: partial, cleaned, out-of-range values refused", () => {
  assert.deepEqual(validateActaPatch({ fuel: 6 }), { fuel: 6 });
  assert.deepEqual(validateActaPatch({ odometerKm: "51234", fuel: "" }), { odometerKm: 51234, fuel: null });
  assert.throws(() => validateActaPatch({ fuel: 9 }), /0..8/);
  assert.throws(() => validateActaPatch({ odometerKm: -1 }), /Odometer/);
  assert.throws(() => validateActaPatch({ odometerKm: 1.5 }), /Odometer/);
  assert.throws(() => validateActaPatch({ datetime: "2027-03-01 25:00" }), /Date/);
  assert.equal(validateActaPatch({ datetime: "2027-03-01T09:30" }).datetime, "2027-03-01T09:30");
  const c = validateActaPatch({ checklist: { freshWater: true, greyWater: false, gas: "yes", hacker: true } }).checklist;
  assert.equal(c.freshWater, true);
  assert.equal(c.greyWater, false);
  assert.equal(c.gas, null);
  assert.equal("hacker" in c, false);
  assert.deepEqual(validateActaPatch({ extras: ["bbq", "bbq", "cleaning_fee", "nope"] }).extras, ["bbq"]);
  assert.throws(() => validateActaPatch({ kmPlan: "300" }));
  const marks = validateActaPatch({ marks: [{ id: "x1", x: 0.5, y: 0.25, type: "dent", note: " a\u0000b " }] }).marks;
  assert.deepEqual(marks, [{ id: "x1", x: 0.5, y: 0.25, type: "dent", note: "ab" }]);
  assert.throws(() => validateActaPatch({ marks: [{ x: 1.2, y: 0, type: "dent" }] }), /position/);
  assert.throws(() => validateActaPatch({ marks: [{ x: 0.2, y: 0, type: "bomb" }] }), /type/);
  assert.throws(() => validateActaPatch({ marks: Array.from({ length: 61 }, () => ({ x: 0, y: 0, type: "dent" })) }), /Too many/);
  assert.equal(validateActaPatch({ notes: "x".repeat(5000) }).notes.length, 2000);
  // server-managed fields are ignored
  assert.deepEqual(validateActaPatch({ status: "signed", photos: [1], signatures: {} }), {});
});

test("signing needs km, fuel, time and both names; check-out km not below check-in", () => {
  const a = newActa(CONTRACTS[0], "checkout", { vehicleId: "vlc-yearling", now: 1 });
  assert.equal(a.guestName, "Анна Smith");
  assert.throws(() => requireSignable(a), /Odometer/);
  const ok = applyPatch(a, { odometerKm: 100, fuel: 8, datetime: "2027-03-05T10:00", staffName: "Sergii" });
  assert.doesNotThrow(() => requireSignable(ok));
  assert.throws(() => requireSignable(ok, { checkin: { odometerKm: 200 } }), /lower/);
  assert.throws(() => requireSignable({ ...ok, staffName: "" }), /Staff/);
  assert.throws(() => applyPatch({ ...ok, status: "signed" }, { fuel: 1 }), /signed/);
});

test("photos: JPEG only, size-capped", () => {
  assert.equal(decodeJpeg(jpgUrl).length, JPG.length);
  assert.throws(() => decodeJpeg(pngUrl), /JPEG/);
  assert.throws(() => decodeJpeg(`data:image/jpeg;base64,${PNG.toString("base64")}`), /Not a JPEG/);
  assert.throws(() => decodeJpeg(jpgUrl, 1000), /too large/);
});

test("booking of a contract by reference, else by email and start date", () => {
  const bookings = [
    { bookingRef: "X", vehicleId: "vlc-yearling", status: "confirmed", guestEmail: "ann@x.com", startDate: "2027-03-01", extraIds: ["pet"] },
    { bookingRef: "CR-1", vehicleId: "vlc-yearling", status: "cancelled", extraIds: [] },
  ];
  assert.equal(bookingForContract(CONTRACTS[0], bookings).bookingRef, "X");
  assert.equal(bookingForContract(CONTRACTS[1], bookings), null);
});

test("guest email in the contract language, English fallback", () => {
  assert.match(guestActaEmail({ language: "ru", guestName: "Анна S" }, { kind: "checkin" }).subject, /Акт выдачи/);
  assert.match(guestActaEmail({ language: "de", guestName: "A" }, { kind: "checkout" }).subject, /Rückgabeprotokoll/);
  assert.match(guestActaEmail({ language: "pt", guestName: "A" }, { kind: "checkin" }).subject, /handover/);
  assert.match(guestActaEmail({ language: "es", guestName: "<b>x" }, { kind: "checkin" }).html, /&lt;b&gt;x/);
});

// ── access ──────────────────────────────────────────────────────────────────

test("access: no login 401, guests 401, managers only their campers", async () => {
  const { call } = setup();
  assert.equal((await call(null, "GET", { query: { contractId: "aaaaaaaaaaaa" } })).code, 401);
  assert.equal((await call("guest@example.com", "GET", { query: { contractId: "aaaaaaaaaaaa" } })).code, 401);
  assert.equal((await call("partner@example.com", "GET", { query: { contractId: "aaaaaaaaaaaa" } })).code, 403);
  assert.equal((await call("partner@example.com", "POST", { body: { action: "save", contractId: "aaaaaaaaaaaa", kind: "checkin", acta: { fuel: 1 } } })).code, 403);
  assert.equal((await call("partner@example.com", "GET", { query: { contractId: "cccccccccccc" } })).code, 200);
  assert.equal((await call("boss@example.com", "GET", { query: { contractId: "cccccccccccc" } })).code, 200);
  assert.equal((await call("token", "GET", { query: { contractId: "aaaaaaaaaaaa" } })).code, 200);
  assert.equal((await call("boss@example.com", "GET", { query: { contractId: "../etc" } })).code, 404);
  // a cookie POST that is not JSON (cross-site form) is refused
  const r = res();
  const h = createActaHandler({ actas: createMemoryActaStore(), contracts: createMemoryContractStore(CONTRACTS), adminToken: "tok", sessionSecret: SECRET, env: ENV, now: () => NOW });
  await h({ method: "POST", query: {}, headers: { cookie: cookieFor("boss@example.com"), "content-type": "application/x-www-form-urlencoded" }, body: {} }, r);
  assert.equal(r.code, 415);
});

test("summary lists only the actas of visible campers", async () => {
  const { call } = setup();
  await call("boss@example.com", "POST", { body: { action: "save", contractId: "aaaaaaaaaaaa", kind: "checkin", acta: { fuel: 8 } } });
  await call("partner@example.com", "POST", { body: { action: "save", contractId: "cccccccccccc", kind: "checkin", acta: { fuel: 4 } } });
  const boss = (await call("boss@example.com", "GET", { query: { view: "summary" } })).body.actas;
  const partner = (await call("partner@example.com", "GET", { query: { view: "summary" } })).body.actas;
  assert.equal(boss.length, 2);
  assert.deepEqual(partner.map((a) => a.contractId), ["cccccccccccc"]);
  assert.equal(partner[0].status, "draft");
});

test("a cancelled contract gets no new acta", async () => {
  const { call } = setup();
  const r = await call("boss@example.com", "POST", { body: { action: "save", contractId: "dddddddddddd", kind: "checkin", acta: { fuel: 8 } } });
  assert.equal(r.code, 409);
});

// ── the whole flow ──────────────────────────────────────────────────────────

const OK = { freshWater: true, greyWater: true, cassette: true, gas: true, interiorClean: true, tyresLights: true, documents: true, keys: true };

test("check-in: draft prefilled from the booking, photo, sign -> PDF + 2 emails, then locked", async () => {
  const { call, sent, actas } = setup();
  const g = await call("boss@example.com", "GET", { query: { contractId: "aaaaaaaaaaaa" } });
  assert.equal(g.code, 200);
  assert.equal(g.body.checkin, null);
  assert.deepEqual(g.body.prefill.extras, ["km_200", "bbq"]);
  assert.equal(g.body.vehicle.diagram.path, "/images/acta/vlc-yearling.png");

  const s = await call("boss@example.com", "POST", {
    body: { action: "save", contractId: "aaaaaaaaaaaa", kind: "checkin", acta: { odometerKm: 50000, fuel: 8, datetime: "2027-03-01T10:05", checklist: OK, marks: [{ id: "a", x: 0.3, y: 0.6, type: "scratch", note: "puerta" }] } },
  });
  assert.equal(s.code, 200);
  assert.equal(s.body.acta.kmPlan, "200");
  assert.equal(s.body.acta.staffEmail, "boss@example.com");

  const p = await call("boss@example.com", "POST", { body: { action: "photo", contractId: "aaaaaaaaaaaa", kind: "checkin", data: jpgUrl, thumb: jpgUrl, takenAt: NOW - 60_000 } });
  assert.equal(p.code, 200);
  assert.equal(p.body.count, 1);
  const ph = await call("boss@example.com", "GET", { query: { contractId: "aaaaaaaaaaaa", kind: "checkin", photo: p.body.photo.id } });
  assert.equal(ph.headers["Content-Type"], "image/jpeg");
  assert.equal(ph.body.length, JPG.length);
  assert.equal((await call("partner@example.com", "GET", { query: { contractId: "aaaaaaaaaaaa", kind: "checkin", photo: p.body.photo.id } })).code, 403);

  // both signatures are required
  const half = await call("boss@example.com", "POST", { body: { action: "sign", contractId: "aaaaaaaaaaaa", kind: "checkin", staffSignature: pngUrl } });
  assert.equal(half.code, 400);
  const noName = await call("boss@example.com", "POST", { body: { action: "sign", contractId: "aaaaaaaaaaaa", kind: "checkin", staffSignature: pngUrl, guestSignature: pngUrl } });
  assert.equal(noName.body.code, "staff_name_required");

  const signed = await call("boss@example.com", "POST", {
    body: { action: "sign", contractId: "aaaaaaaaaaaa", kind: "checkin", acta: { staffName: "Sergii" }, staffSignature: pngUrl, guestSignature: pngUrl },
  });
  assert.equal(signed.code, 200, JSON.stringify(signed.body));
  assert.equal(signed.body.acta.status, "signed");
  assert.equal(signed.body.emailed, true);
  assert.equal(signed.body.acta.signatures.guest.name, "Анна Smith");
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to, "ann@x.com");
  assert.match(sent[0].subject, /Акт выдачи/);
  assert.equal(sent[1].to, "camper.retreat.alicante@gmail.com");
  assert.equal(sent[0].attachments[0].filename, "acta-entrega-aaaaaaaaaaaa.pdf");

  const pdf = await call("boss@example.com", "GET", { query: { contractId: "aaaaaaaaaaaa", kind: "checkin", pdf: "1" } });
  assert.equal(pdf.headers["Content-Type"], "application/pdf");
  const doc = await PDFDocument.load(pdf.body);
  assert.ok(doc.getPageCount() >= 2); // report + photo page
  assert.match(doc.getTitle(), /ACTA DE ENTREGA/);
  if (process.env.ACTA_PDF_OUT) writeFileSync(`${process.env.ACTA_PDF_OUT}/checkin.pdf`, pdf.body);

  // no more changes
  assert.equal((await call("boss@example.com", "POST", { body: { action: "save", contractId: "aaaaaaaaaaaa", kind: "checkin", acta: { fuel: 1 } } })).code, 409);
  assert.equal((await call("boss@example.com", "POST", { body: { action: "photo", contractId: "aaaaaaaaaaaa", kind: "checkin", data: jpgUrl, thumb: jpgUrl } })).code, 409);
  assert.equal((await call("boss@example.com", "POST", { body: { action: "sign", contractId: "aaaaaaaaaaaa", kind: "checkin", staffSignature: pngUrl, guestSignature: pngUrl } })).code, 409);
  const stored = (await actas.get("aaaaaaaaaaaa", "checkin")).acta;
  assert.ok(stored.audit.some((a) => a.ev === "emailed"));

  // check-out: compared with the check-in in the PDF
  await call("boss@example.com", "POST", {
    body: {
      action: "save",
      contractId: "aaaaaaaaaaaa",
      kind: "checkout",
      acta: { odometerKm: 51200, fuel: 5, datetime: "2027-03-05T12:30", checklist: { ...OK, cassette: false }, marks: [{ id: "b", x: 0.7, y: 0.2, type: "dent", note: "parachoques" }], petsOnBoard: true, staffName: "Sergii" },
    },
  });
  const low = await call("boss@example.com", "POST", { body: { action: "sign", contractId: "aaaaaaaaaaaa", kind: "checkout", acta: { odometerKm: 49000 }, staffSignature: pngUrl, guestSignature: pngUrl } });
  assert.equal(low.body.code, "odometer_lower");
  const out = await call("boss@example.com", "POST", { body: { action: "sign", contractId: "aaaaaaaaaaaa", kind: "checkout", acta: { odometerKm: 51200 }, staffSignature: pngUrl, guestSignature: pngUrl } });
  assert.equal(out.code, 200, JSON.stringify(out.body));
  const outPdf = await call("boss@example.com", "GET", { query: { contractId: "aaaaaaaaaaaa", kind: "checkout", pdf: "1" } });
  assert.match((await PDFDocument.load(outPdf.body)).getTitle(), /DEVOLUCI/);
  if (process.env.ACTA_PDF_OUT) writeFileSync(`${process.env.ACTA_PDF_OUT}/checkout.pdf`, outPdf.body);
  assert.match(sent[2].subject, /Акт возврата/);
});

test("photo deletion and the photo limit on drafts", async () => {
  const { call } = setup();
  const p = await call("token", "POST", { body: { action: "photo", contractId: "aaaaaaaaaaaa", kind: "checkout", data: jpgUrl, thumb: jpgUrl } });
  assert.equal(p.code, 200);
  const d = await call("token", "POST", { body: { action: "photo_delete", contractId: "aaaaaaaaaaaa", kind: "checkout", photoId: p.body.photo.id } });
  assert.equal(d.body.acta.photos.length, 0);
  const bad = await call("token", "POST", { body: { action: "photo", contractId: "aaaaaaaaaaaa", kind: "checkout", data: pngUrl, thumb: jpgUrl } });
  assert.equal(bad.code, 400);
});
