import { test } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import {
  CONSENT_KEYS,
  CONTRACT_PDF_PATH,
  CONTRACT_VERSION,
  ContractError,
  OTP_MAX_ATTEMPTS,
  checkOtp,
  contractPdfPathOf,
  contractNumber,
  uniqueContractNumber,
  validateSignData,
  createContract,
  createMemoryContractStore,
  decodeSignaturePng,
  issueOtp,
  matchesToken,
  tokenId,
  requireConsents,
  validateInvite,
} from "./contracts.js";
import { VEHICLES } from "../../shared/vehicles.js";
import { createContractHandlers } from "./contract-handlers.js";
import { createMemoryActaStore } from "./actas.js";
import { createOwnProvider, createExternalProvider } from "./signing-provider.js";
import { pdfText } from "./contract-pdf.js";

const INVITE = {
  guestName: "Anna Kowalska",
  email: "Anna@Example.com",
  startDate: "2026-12-10",
  endDate: "2026-12-15",
  source: "yescapa",
  language: "es",
  priceTotal: "620",
  bookingRef: "YC-123",
};

// A real (small, noisy) PNG: pdf-lib has to be able to embed it.
function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (const byte of buf) {
    c = (crc ^ byte) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function fakePng() {
  const w = 60;
  const h = 30;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 37) % 251;
  for (let y = 0; y < h; y++) raw[y * (w * 4 + 1)] = 0; // filter type none
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

const DOC_JPEG = `data:image/jpeg;base64,${readFileSync(new URL("./fixtures/doc.jpg", import.meta.url)).toString("base64")}`;

const SIGN_DATA = {
  fullName: "Anna Kowalska",
  docType: "passport",
  docNumber: "AB1234567",
  birthDate: "1990-05-01",
  nationality: "Polish",
  street: "Marszalkowska 1",
  city: "Warsaw",
  postalCode: "00-001",
  country: "Poland",
  phone: "+48123456789",
  licenseNumber: "L123",
  licenseCountry: "Poland",
  licenseIssued: "2015-01-01",
  licenseBSince: "2005-06-01",
  licenseExpiry: "2030-01-01",
  docExpiry: "2031-05-05",
};
const CONSENTS = { readContract: true, electronicSignature: true, cardAuthorization: true, liabilityClauses: true, dataProtection: true, languageNotice: true };

test("validateInvite cleans fields and rejects bad input", () => {
  const ok = validateInvite(INVITE);
  assert.equal(ok.email, "anna@example.com");
  assert.equal(ok.pickupTime, "10:00");
  assert.equal(ok.priceTotal, 620);
  assert.throws(() => validateInvite({ ...INVITE, email: "nope" }), (e) => e.code === "email_invalid");
  assert.throws(() => validateInvite({ ...INVITE, endDate: "2026-12-10" }), (e) => e.code === "dates_invalid");
  assert.throws(() => validateInvite({ ...INVITE, guestName: "" }), (e) => e.code === "guest_name_required");
});

test("v8: bilingual contract PDF for every camper and the language consent is required", () => {
  assert.equal(CONTRACT_VERSION, "2026-11-v8");
  assert.equal(CONTRACT_PDF_PATH, "/contracts/contrato-v8.pdf");
  for (const v of VEHICLES) assert.equal(v.contractPdfPath, CONTRACT_PDF_PATH, v.id);
  assert.ok(CONSENT_KEYS.includes("languageNotice"));
  assert.deepEqual(Object.keys(requireConsents(CONSENTS)).sort(), [...CONSENT_KEYS].sort());
  assert.throws(() => requireConsents({ ...CONSENTS, languageNotice: false }), (e) => e instanceof ContractError && e.code === "consent_required");
});

test("licence: number optional, issue and expiry dates required", () => {
  const { licenseNumber, ...noNumber } = SIGN_DATA;
  assert.ok(licenseNumber);
  assert.equal(validateSignData({ ...noNumber, docType: "passport" }).licenseNumber, "");
  const { licenseIssued, ...noIssued } = SIGN_DATA;
  assert.ok(licenseIssued);
  assert.throws(() => validateSignData({ ...noIssued, docType: "passport" }), (e) => e instanceof ContractError && e.code === "field_required");
});

test("invite keeps known options (mileage plan + extras) only", () => {
  assert.deepEqual(validateInvite({ ...INVITE, extras: ["km_200", "pet", "pet", "rocket"] }).extras, ["km_200", "pet"]);
  assert.deepEqual(validateInvite(INVITE).extras, []);
});

test("human contract number: pickup date + surname(s)", () => {
  assert.equal(contractNumber("2026-11-27", "Saúl Jara Sánchez"), "20261127_JARA-SANCHEZ");
  assert.equal(contractNumber("2026-12-10", "Sergii Ivakhnenko (TEST 3)"), "20261210_IVAKHNENKO");
  assert.equal(contractNumber("2026-12-10", "Сергей Ивахненко"), "20261210_IVAKHNENKO");
  assert.equal(contractNumber("2026-12-10", "IVAKHNENKO Sergii"), "20261210_IVAKHNENKO", "surname in capitals");
  assert.equal(contractNumber("2026-12-10", "SERGII IVAKHNENKO", "IVAKHNENKO"), "20261210_IVAKHNENKO", "surname from the MRZ");
  assert.equal(uniqueContractNumber("X", [{ id: "a", number: "X" }, { id: "b", number: "X-2" }], "c"), "X-3");
  assert.equal(uniqueContractNumber("X", [{ id: "a", number: "X" }], "a"), "X");
});

test("a contract keeps the blank of the version it was created with", () => {
  assert.equal(contractPdfPathOf({ version: "2026-11-v7", vehicleId: VEHICLES[0].id }), "/contracts/contrato-v7.pdf");
  assert.equal(contractPdfPathOf({ version: "2026-11-v8", vehicleId: VEHICLES[0].id }), "/contracts/contrato-v8.pdf");
});

test("token authenticates the contract and carries its id", () => {
  const { contract, token } = createContract(INVITE, { now: 1000 });
  assert.equal(tokenId(token), contract.id);
  assert.equal(matchesToken(contract, token, 2000), true);
  assert.equal(matchesToken(contract, `${contract.id}.${"x".repeat(24)}`, 2000), false);
  assert.equal(matchesToken(contract, token, contract.expiresAt + 1), false);
  assert.equal(JSON.stringify(contract).includes(token), false, "the raw token must never be stored");
});

test("one-time code: wrong guesses are counted and capped, right code passes", () => {
  const { contract: fresh } = createContract(INVITE, { now: 0 });
  assert.throws(() => issueOtp(fresh, { now: 1000, secret: "s" }), (e) => e.code === "not_verified", "no code before the in-person check");
  const contract = { ...fresh, status: "verified" };
  const { code, contract: c1 } = issueOtp(contract, { now: 1000, secret: "s" });
  assert.throws(() => issueOtp(c1, { now: 2000, secret: "s" }), (e) => e.code === "code_too_soon");
  let cur = c1;
  for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
    const r = checkOtp(cur, "000000" === code ? "111111" : "000000", { now: 3000, secret: "s" });
    assert.equal(r.reason, "code_wrong");
    cur = r.contract;
  }
  assert.equal(checkOtp(cur, code, { now: 3000, secret: "s" }).reason, "too_many_attempts");
  assert.equal(checkOtp(c1, code, { now: 3000, secret: "s" }).ok, true);
  assert.equal(checkOtp(c1, code, { now: 1000 + 11 * 60_000, secret: "s" }).reason, "code_expired");
});

test("signature image must be a real, bounded PNG", () => {
  assert.ok(decodeSignaturePng(fakePng()).length > 300);
  assert.throws(() => decodeSignaturePng("data:image/png;base64,AAAA"), ContractError);
  assert.throws(() => decodeSignaturePng("hello"), ContractError);
});

test("pdfText keeps names readable for the standard PDF fonts", () => {
  assert.equal(pdfText("Іван Шевченко"), "Ivan Shevchenko");
  assert.equal(pdfText("José Núñez 50 €"), "José Núñez 50 €");
  assert.equal(pdfText("日本"), "??");
});

function res() {
  const r = { code: 0, body: null, headers: {} };
  r.status = (c) => ((r.code = c), r);
  r.json = (b) => ((r.body = b), r);
  r.send = (b) => ((r.body = b), r);
  r.setHeader = (k, v) => (r.headers[k] = v);
  return r;
}

async function setup() {
  const store = createMemoryContractStore();
  const actas = createMemoryActaStore();
  const sent = { invites: [], codes: [], signed: [], submitted: [] };
  const base = await PDFDocument.create();
  base.addPage([595, 842]);
  const basePdf = await base.save();
  let t = 1_000_000;
  const provider = { name: "own", invite: async (c, token) => sent.invites.push({ c, token }) };
  const h = createContractHandlers({
    store,
    provider,
    sendCode: async (c, code) => sent.codes.push(code),
    sendSigned: async (c, pdf, link) => (sent.signed.push({ pdf, link }), ["fulfilled", "fulfilled"]),
    onSubmitted: async (c) => sent.submitted.push(c.id),
    actas,
    loadBasePdf: async () => basePdf,
    listBookings: async () => [
      { id: "cs_2", bookingRef: "CR-B", status: "confirmed", startDate: "2027-02-01", endDate: "2027-02-05", guestFirstName: "Bob", guestLastName: "B", guestEmail: "b@x.com", totalWithIva: 500 },
      { id: "cs_1", bookingRef: "CR-A", status: "confirmed", startDate: "2027-01-01", endDate: "2027-01-03", guestFirstName: "Ann", guestLastName: "A", guestEmail: "a@x.com", totalWithIva: 300, secretThing: "x" },
    ],
    adminToken: "admin-secret",
    secret: "otp-secret",
    now: () => t,
  });
  return { h, store, actas, sent, tick: (ms) => (t += ms) };
}

test("admin endpoint needs the token and is off without it", async () => {
  const { h } = await setup();
  const r1 = res();
  await h.admin({ method: "GET", headers: {}, query: {} }, r1);
  assert.equal(r1.code, 401);
  const r2 = res();
  await h.admin({ method: "GET", headers: { "x-admin-token": "admin-secret" }, query: {} }, r2);
  assert.equal(r2.code, 200);
  const off = createContractHandlers({ store: createMemoryContractStore(), provider: {}, adminToken: "" });
  const r3 = res();
  await off.admin({ method: "GET", headers: { "x-admin-token": "" }, query: {} }, r3);
  assert.equal(r3.code, 503);
});

const ADMIN = { "x-admin-token": "admin-secret", "content-type": "application/json" };
const ALL_CHECKS = { name: true, document: true, birthDate: true, docExpiry: true, license: true, licenseB: true, address: true };

test("in person: guest sends data, staff verify, guest signs on the staff device, lessor countersigns", async () => {
  const { h, store, actas, sent, tick } = await setup();
  const created = res();
  await h.admin({ method: "POST", headers: { "x-admin-token": "admin-secret" }, body: INVITE }, created);
  assert.equal(created.code, 201);
  assert.match(created.body.link, /\/sign\//);
  const token = sent.invites[0].token;
  const id = created.body.id;

  const view = res();
  await h.guest({ method: "GET", query: { token } }, view);
  assert.equal(view.code, 200);
  assert.equal(view.body.contract.guestName, "Anna Kowalska");
  assert.equal("tokenHash" in view.body.contract, false);

  const bad = res();
  await h.guest({ method: "GET", query: { token: `${id}.${"y".repeat(24)}` } }, bad);
  assert.equal(bad.code, 404);

  // The guest can no longer sign remotely.
  const remote = res();
  await h.guest({ method: "POST", body: { token, action: "code" } }, remote);
  assert.equal(remote.code, 403);
  assert.equal(remote.body.code, "in_person_required");

  const noDocs = res();
  await h.guest({ method: "POST", headers: {}, body: { token, action: "submit", data: SIGN_DATA } }, noDocs);
  assert.equal(noDocs.code, 400);
  assert.equal(noDocs.body.code, "docs_required");

  const badDoc = res();
  await h.guest({ method: "POST", body: { token, action: "doc", slot: "idFront", image: "data:image/jpeg;base64,AAAA" } }, badDoc);
  assert.equal(badDoc.code, 400);
  for (const slot of ["idFront", "licenseFront", "licenseBack"]) {
    const up = res();
    await h.guest({ method: "POST", body: { token, action: "doc", slot, image: DOC_JPEG } }, up);
    assert.equal(up.code, 200, JSON.stringify(up.body));
  }
  const ex = res();
  await h.guest({ method: "POST", body: { token, action: "extract" } }, ex);
  assert.equal(ex.body.ok, false, "recognition is off in tests (no extractDocs)");
  const read = res();
  await h.guest({ method: "POST", body: { token, action: "read" } }, read);
  assert.ok((await store.get(id)).contract.audit.some((a) => a.ev === "contract_read"));

  const submit = res();
  await h.guest({ method: "POST", headers: { "x-forwarded-for": "198.51.100.4" }, body: { token, action: "submit", data: SIGN_DATA } }, submit);
  assert.equal(submit.code, 200, JSON.stringify(submit.body));
  assert.equal((await store.get(id)).contract.status, "submitted");
  assert.deepEqual(sent.submitted, [id]);
  const again = res();
  await h.guest({ method: "GET", query: { token } }, again);
  assert.equal(again.body.contract.submitted.docNumber, SIGN_DATA.docNumber, "the guest may still correct the data");

  // Staff: every item must be ticked against the originals.
  const half = res();
  await h.admin({ method: "POST", headers: ADMIN, body: { action: "verify", id, data: SIGN_DATA, checks: { name: true } } }, half);
  assert.equal(half.code, 400);
  assert.equal(half.body.code, "checks_required");
  const fixed = { ...SIGN_DATA, docNumber: "AB1234568" };
  const verify = res();
  await h.admin({ method: "POST", headers: ADMIN, body: { action: "verify", id, data: fixed, checks: ALL_CHECKS } }, verify);
  assert.equal(verify.code, 200, JSON.stringify(verify.body));
  assert.equal(verify.body.contract.status, "verified");
  assert.deepEqual(verify.body.contract.verification.edits.map((e) => e.field), ["docNumber"]);
  const late = res();
  await h.guest({ method: "POST", body: { token, action: "submit", data: SIGN_DATA } }, late);
  assert.equal(late.code, 409, "after the check the guest cannot change the data");

  // Kiosk link: only with the check-in report (mileage + fuel).
  const noActa = res();
  await h.admin({ method: "POST", headers: ADMIN, body: { action: "kiosk", id } }, noActa);
  assert.equal(noActa.code, 409);
  assert.equal(noActa.body.code, "acta_required");
  const contract = (await store.get(id)).contract;
  await actas.save({
    id: `${id}-checkin`, contractId: id, vehicleId: contract.vehicleId, kind: "checkin", status: "draft",
    datetime: "2026-12-01T10:05", odometerKm: 48210, fuel: 4, checklist: { freshWater: true, keys: true }, marks: [{ id: "m1", x: 0.2, y: 0.1, type: "scratch", note: "rear bumper" }],
    notes: "Cajón de la cocina roto", petsOnBoard: false, photos: [], staffName: "", guestName: "", audit: [],
  });
  const kiosk = res();
  await h.admin({ method: "POST", headers: ADMIN, body: { action: "kiosk", id } }, kiosk);
  assert.equal(kiosk.code, 200, JSON.stringify(kiosk.body));
  const kToken = kiosk.body.url.match(/\/sign\/([^?]+)/)[1];

  const kView = res();
  await h.guest({ method: "GET", query: { token: kToken } }, kView);
  assert.equal(kView.body.contract.kiosk, true);
  assert.equal(kView.body.contract.data.docNumber, "AB1234568");
  assert.equal(kView.body.contract.acta.odometerKm, 48210);
  const gView = res();
  await h.guest({ method: "GET", query: { token } }, gView);
  assert.equal(gView.body.contract.kiosk, undefined, "the guest link does not become a kiosk");

  // The kiosk needs the staff session on the device.
  const noStaff = res();
  await h.guest({ method: "POST", headers: {}, body: { token: kToken, action: "code" } }, noStaff);
  assert.equal(noStaff.code, 403);
  assert.equal(noStaff.body.code, "staff_session_required");
  const asked = res();
  await h.guest({ method: "POST", headers: ADMIN, body: { token: kToken, action: "code" } }, asked);
  assert.equal(asked.code, 200, JSON.stringify(asked.body));
  const code = sent.codes[0];
  const wrong = res();
  await h.guest({ method: "POST", headers: ADMIN, body: { token: kToken, action: "sign", code: "999999", consents: CONSENTS, signature: fakePng() } }, wrong);
  assert.equal(wrong.code, 400);
  const noConsent = res();
  await h.guest({ method: "POST", headers: ADMIN, body: { token: kToken, action: "sign", code, consents: { ...CONSENTS, cardAuthorization: false }, signature: fakePng() } }, noConsent);
  assert.equal(noConsent.body.code, "consent_required");

  tick(5_000);
  const signed = res();
  await h.guest({ method: "POST", headers: { ...ADMIN, "x-forwarded-for": "203.0.113.7, 10.0.0.1", "user-agent": "TestAgent/1" }, body: { token: kToken, action: "sign", code, consents: CONSENTS, signature: fakePng() } }, signed);
  assert.equal(signed.code, 200, JSON.stringify(signed.body));
  let stored = (await store.get(id)).contract;
  assert.equal(stored.status, "guest_signed");
  assert.equal(stored.guestSignature.ip, "203.0.113.7");
  assert.equal(stored.guestSignature.acta.odometerKm, 48210);
  assert.equal(sent.signed.length, 0, "nothing is sent before the lessor signs");
  assert.equal(store.pdfs.size, 0);

  const reuse = res();
  await h.guest({ method: "POST", headers: ADMIN, body: { token: kToken, action: "sign", code, consents: CONSENTS, signature: fakePng() } }, reuse);
  assert.equal(reuse.code, 404, "the kiosk link closes after the signature");

  tick(5_000);
  const counter = res();
  await h.admin({ method: "POST", headers: ADMIN, body: { action: "countersign", id, signature: fakePng() } }, counter);
  assert.equal(counter.code, 200, JSON.stringify(counter.body));
  stored = (await store.get(id)).contract;
  assert.equal(stored.status, "signed");
  assert.match(stored.number, /^\d{8}_[A-Z-]+$/);
  assert.equal(stored.signed.ip, "203.0.113.7");
  assert.equal(stored.signed.data.docNumber, "AB1234568", "the verified data is the signed data");
  assert.ok(stored.signed.verified.at);
  assert.ok(stored.signed.owner.signatureHash);
  assert.ok(store.pdfs.get(id).length > 1000);
  assert.equal(sent.signed.length, 1);
  assert.equal(sent.signed[0].link, token, "the copy links to the guest's own booking page");
  const out = await PDFDocument.load(store.pdfs.get(id));
  assert.equal(out.getPageCount(), 3, "blank contract + signature sheet + document annex");
  assert.deepEqual(Object.keys(stored.signed.docHashes).sort(), ["idFront", "licenseBack", "licenseFront"]);
  assert.equal((await actas.get(id, "checkin")).acta.status, "signed", "the check-in report is signed with the contract");

  const twice = res();
  await h.admin({ method: "POST", headers: ADMIN, body: { action: "countersign", id, signature: fakePng() } }, twice);
  assert.equal(twice.code, 409);

  const photo = res();
  await h.admin({ method: "GET", headers: { "x-admin-token": "admin-secret" }, query: { id, doc: "idFront" } }, photo);
  assert.equal(photo.headers["Content-Type"], "image/jpeg");
  const dl = res();
  await h.admin({ method: "GET", headers: { "x-admin-token": "admin-secret" }, query: { id, pdf: "1" } }, dl);
  assert.equal(dl.headers["Content-Type"], "application/pdf");

  // The guest link is the booking page: signed state and the copy.
  const page = res();
  await h.guest({ method: "GET", query: { token } }, page);
  assert.equal(page.body.contract.status, "signed");
  assert.equal(page.body.contract.signerName, SIGN_DATA.fullName);
  const copy = res();
  await h.guest({ method: "GET", query: { token, pdf: "1" } }, copy);
  assert.equal(copy.headers["Content-Type"], "application/pdf");
  const stranger = res();
  await h.guest({ method: "GET", query: { token: `${id}.${"z".repeat(24)}`, pdf: "1" } }, stranger);
  assert.equal(stranger.code, 404);
});

test("unverify sends the contract back to the guest's data", async () => {
  const { h, store, sent } = await setup();
  const created = res();
  await h.admin({ method: "POST", headers: { "x-admin-token": "admin-secret" }, body: INVITE }, created);
  const token = sent.invites[0].token;
  for (const slot of ["idFront", "licenseFront", "licenseBack"]) await h.guest({ method: "POST", body: { token, action: "doc", slot, image: DOC_JPEG } }, res());
  await h.guest({ method: "POST", headers: {}, body: { token, action: "submit", data: SIGN_DATA } }, res());
  await h.admin({ method: "POST", headers: ADMIN, body: { action: "verify", id: created.body.id, data: SIGN_DATA, checks: ALL_CHECKS } }, res());
  const back = res();
  await h.admin({ method: "POST", headers: ADMIN, body: { action: "unverify", id: created.body.id } }, back);
  assert.equal(back.code, 200);
  assert.equal((await store.get(created.body.id)).contract.status, "submitted");
});

test("resend replaces the link; cancel closes a pending contract", async () => {
  const { h, sent } = await setup();
  const admin = { "x-admin-token": "admin-secret" };
  const created = res();
  await h.admin({ method: "POST", headers: admin, body: INVITE }, created);
  const oldToken = sent.invites[0].token;
  const re = res();
  await h.admin({ method: "POST", headers: admin, body: { action: "resend", id: created.body.id } }, re);
  assert.equal(re.code, 200);
  const old = res();
  await h.guest({ method: "GET", query: { token: oldToken } }, old);
  assert.equal(old.code, 404, "the old link stops working");
  const cancel = res();
  await h.admin({ method: "POST", headers: admin, body: { action: "cancel", id: created.body.id } }, cancel);
  assert.equal(cancel.code, 200);
});

test("delete: only a cancelled or TEST contract, with its files", async () => {
  const { h, store } = await setup();
  const admin = { "x-admin-token": "admin-secret" };
  const real = res();
  await h.admin({ method: "POST", headers: admin, body: INVITE }, real);
  const no = res();
  await h.admin({ method: "POST", headers: admin, body: { action: "delete", id: real.body.id } }, no);
  assert.equal(no.code, 409, "a live contract stays");
  const t = res();
  await h.admin({ method: "POST", headers: admin, body: { ...INVITE, guestName: "Ana Ruiz (TEST 2)" } }, t);
  await store.putDoc(t.body.id, "idFront", Buffer.from("x"));
  const del = res();
  await h.admin({ method: "POST", headers: admin, body: { action: "delete", id: t.body.id } }, del);
  assert.equal(del.code, 200);
  assert.equal(await store.get(t.body.id), null);
  assert.equal(await store.getDoc(t.body.id, "idFront"), null);
  assert.ok(await store.get(real.body.id), "other contracts are untouched");
  await h.admin({ method: "POST", headers: admin, body: { action: "cancel", id: real.body.id } }, res());
  const del2 = res();
  await h.admin({ method: "POST", headers: admin, body: { action: "delete", id: real.body.id } }, del2);
  assert.equal(del2.code, 200, "a cancelled one can go");
});

test("providers: own sends the invite, external is a documented stub", async () => {
  const mails = [];
  const own = createOwnProvider({ send: async (m) => mails.push(m) });
  const { contract, token } = createContract(INVITE, { now: 0 });
  await own.invite(contract, token);
  assert.equal(mails.length, 1);
  assert.match(mails[0].html, /\/sign\//);
  await assert.rejects(createExternalProvider().invite(), (e) => e.code === "provider_not_configured");
});

test("admin views: site bookings sorted by date, contract detail without secrets, first view logged", async () => {
  const { h, sent } = await setup();
  const admin = { "x-admin-token": "admin-secret" };
  const b = res();
  await h.admin({ method: "GET", headers: admin, query: { view: "bookings" } }, b);
  assert.equal(b.code, 200);
  assert.deepEqual(b.body.bookings.map((x) => x.bookingRef), ["CR-A", "CR-B"]);
  assert.equal(b.body.bookings[0].guestName, "Ann A");
  assert.equal("secretThing" in b.body.bookings[0], false);

  const created = res();
  await h.admin({ method: "POST", headers: admin, body: INVITE }, created);
  const token = sent.invites[0].token;
  await h.guest({ method: "GET", query: { token } }, res());
  await h.guest({ method: "GET", query: { token } }, res());

  const d = res();
  await h.admin({ method: "GET", headers: admin, query: { id: created.body.id, detail: "1" } }, d);
  assert.equal(d.code, 200);
  const json = JSON.stringify(d.body);
  assert.equal(json.includes("tokenHash"), false);
  assert.equal(json.includes('"hash"'), false);
  assert.ok(d.body.contract.viewedAt);
  assert.equal(d.body.contract.audit.filter((a) => a.ev === "viewed").length, 1, "only the first opening is written");
});

test("staff fill in the data and photograph the documents when the guest sent nothing", async () => {
  const { h, store, sent } = await setup();
  const created = res();
  await h.admin({ method: "POST", headers: { "x-admin-token": "admin-secret" }, body: INVITE }, created);
  const id = created.body.id;
  const noDocs = res();
  await h.admin({ method: "POST", headers: ADMIN, body: { action: "verify", id, data: SIGN_DATA, checks: ALL_CHECKS } }, noDocs);
  assert.equal(noDocs.body.code, "docs_required");
  for (const slot of ["idFront", "licenseFront", "licenseBack"]) {
    const up = res();
    await h.admin({ method: "POST", headers: ADMIN, body: { action: "doc", id, slot, image: DOC_JPEG } }, up);
    assert.equal(up.code, 200, JSON.stringify(up.body));
  }
  const ok = res();
  await h.admin({ method: "POST", headers: ADMIN, body: { action: "verify", id, data: SIGN_DATA, checks: ALL_CHECKS } }, ok);
  assert.equal(ok.code, 200, JSON.stringify(ok.body));
  const c = (await store.get(id)).contract;
  assert.equal(c.status, "verified");
  assert.ok(c.submission.byStaff);
  assert.ok(c.audit.some((a) => a.ev === "filled_by_staff"));
  assert.equal(sent.submitted.length, 0);
});
