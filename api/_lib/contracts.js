// Electronic rental contracts: one JSON record per contract in Vercel Blob,
// a signing link with an unguessable token, an email one-time code and an
// audit trail. Pure logic: the HTTP layer and the email/PDF side effects live
// in contract-handlers.js so this file can be tested without network.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { blobStore, list } from "./blob.js";
import { DEFAULT_VEHICLE_ID, getVehicle, isActiveVehicleId, vehicleOf } from "../../shared/vehicles.js";
import { EXTRA_LABELS } from "../../shared/acta.js";

export const CONTRACT_PREFIX = process.env.CONTRACTS_BLOB_PREFIX || "campervlc-contracts/";
// Matches TERMS_VERSION in create-checkout.js and public/contracts/contrato-v8.pdf
// (v7: Spanish | English side by side; clause 17: the Spanish version prevails).
export const CONTRACT_VERSION = "2026-11-v8";
export const CONTRACT_PDF_PATH = "/contracts/contrato-v8.pdf";
// A contract is always signed on the blank of the version it was created with.
const PDF_BY_VERSION = {
  "2026-11-v7": "/contracts/contrato-v7.pdf",
  "2026-11-v8": "/contracts/contrato-v8.pdf",
};
// Page images of the blank, shown on the signing page so the guest reads the
// contract before filling in anything (public/contracts/v8/page-01.webp ...).
const PREVIEW_BY_VERSION = {
  "2026-11-v8": { base: "/contracts/v8/page-", pages: 15 },
};
export const contractPreviewOf = (contract) => PREVIEW_BY_VERSION[contract?.version] || null;

/** Blank contract of the camper (shared/vehicles.js contractPdfPath); vehicle 1: CONTRACT_PDF_PATH. */
export function contractPdfPathOf(contract) {
  return PDF_BY_VERSION[contract?.version] || getVehicle(vehicleOf(contract))?.contractPdfPath || CONTRACT_PDF_PATH;
}

export const OTP_TTL_MS = 10 * 60_000;
export const OTP_RESEND_MS = 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const LINK_TTL_MS = 45 * 24 * 3_600_000;
export const LANGS = ["es", "en", "ru", "uk", "de", "it", "nl"];
export const SOURCES = ["yescapa", "web", "other"];
export const DOC_TYPES = ["dni", "nie", "passport", "id_card"];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class ContractError extends Error {
  constructor(code, message, status = 400) {
    super(message || code);
    this.code = code;
    this.status = status;
  }
}

export const sha256 = (data) => createHash("sha256").update(data).digest("hex");

function clean(value, max = 200) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// ── creating a contract ─────────────────────────────────────────────────────

export function validateInvite(input = {}) {
  const guestName = clean(input.guestName, 120);
  const email = clean(input.email, 160).toLowerCase();
  const startDate = clean(input.startDate, 10);
  const endDate = clean(input.endDate, 10);
  if (guestName.length < 2) throw new ContractError("guest_name_required");
  if (!EMAIL.test(email)) throw new ContractError("email_invalid");
  if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate) || endDate <= startDate) {
    throw new ContractError("dates_invalid");
  }
  const pickupTime = input.pickupTime ? clean(input.pickupTime, 5) : "10:00";
  const returnTime = input.returnTime ? clean(input.returnTime, 5) : "10:00";
  if (!HHMM.test(pickupTime) || !HHMM.test(returnTime)) throw new ContractError("times_invalid");
  const source = SOURCES.includes(input.source) ? input.source : "other";
  // Which camper: none given = vehicle 1 (old admin pages, old bookings).
  const vehicleId = input.vehicleId == null || input.vehicleId === "" ? DEFAULT_VEHICLE_ID : input.vehicleId;
  if (!isActiveVehicleId(vehicleId)) throw new ContractError("vehicle_invalid");
  const language = LANGS.includes(input.language) ? input.language : "en";
  const priceTotal = input.priceTotal === "" || input.priceTotal == null ? null : Number(input.priceTotal);
  if (priceTotal !== null && (!Number.isFinite(priceTotal) || priceTotal < 0 || priceTotal > 100000)) {
    throw new ContractError("price_invalid");
  }
  return {
    vehicleId,
    guestName,
    email,
    phone: clean(input.phone, 40),
    startDate,
    endDate,
    pickupTime,
    returnTime,
    source,
    language,
    priceTotal,
    bookingRef: clean(input.bookingRef, 60),
    note: clean(input.note, 300),
    // Booked options in the vocabulary of the site's bookings (km_200 / km_unlimited
    // = mileage plan; none of them = 100 km per night).
    extras: Array.isArray(input.extras) ? [...new Set(input.extras.filter((x) => x in EXTRA_LABELS))] : [],
  };
}

export function newToken(id) {
  return `${id}.${randomBytes(18).toString("base64url")}`;
}

export function tokenId(token) {
  if (typeof token !== "string") return null;
  const m = /^([0-9a-f]{12})\.[A-Za-z0-9_-]{20,40}$/.exec(token);
  return m ? m[1] : null;
}

const CYR_LAT = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", є: "ye", ё: "e", ж: "zh", з: "z", и: "i", і: "i", ї: "yi",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/**
 * Human contract number: pickup date without separators + surname(s), e.g.
 * 20261210_IVAKHNENKO or 20261127_JARA-SANCHEZ. The first word of the name is
 * taken as the given name; text in brackets is ignored.
 */
export function contractNumber(startDate, name, surname = "") {
  const date = String(startDate || "").replace(/-/g, "");
  const toWords = (v) =>
    String(v || "")
      .replace(/\([^)]*\)/g, " ")
      .toLowerCase()
      .split("")
      .map((ch) => (CYR_LAT[ch] !== undefined ? CYR_LAT[ch] : ch))
      .join("")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .filter(Boolean);
  // Surname: given (read from the passport), else the words written in capitals
  // ("IVAKHNENKO Sergii"), else everything after the first word.
  const raw = String(name || "").replace(/\([^)]*\)/g, " ").split(/\s+/).filter(Boolean);
  const caps = raw.filter((w) => w.length > 1 && /\p{L}/u.test(w) && w === w.toUpperCase());
  let words;
  if (surname) words = toWords(surname);
  else if (caps.length && caps.length < raw.length) words = toWords(caps.join(" "));
  else {
    const all = toWords(name);
    words = all.length > 1 ? all.slice(1) : all;
  }
  return `${date}_${words.join("-").slice(0, 40) || "CLIENTE"}`;
}

/** contractNumber, with -2, -3 ... when another contract already has it. */
export function uniqueContractNumber(base, others, selfId) {
  const taken = new Set(others.filter((c) => c.id !== selfId).map((c) => c.number));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

export const numberOf = (contract) => contract.number || contract.id;

export function createContract(input, { now = Date.now(), provider = "own" } = {}) {
  const fields = validateInvite(input);
  const id = randomBytes(6).toString("hex");
  const token = newToken(id);
  const contract = {
    id,
    number: contractNumber(fields.startDate, fields.guestName),
    ...fields,
    version: CONTRACT_VERSION,
    provider,
    externalId: null,
    // pending -> submitted (guest sent data + document photos) -> verified (staff
    // checked them against the originals, in person) -> guest_signed (on the staff
    // device) -> signed (countersigned by the lessor; PDF built, copies sent).
    status: "pending",
    tokenHash: sha256(token),
    expiresAt: now + LINK_TTL_MS,
    createdAt: now,
    otp: null,
    signed: null,
    audit: [{ t: now, ev: "created" }],
  };
  return { contract, token };
}

/** New link for an existing, still unsigned contract (the old link stops working). */
export function reissueToken(contract, { now = Date.now() } = {}) {
  if (!["pending", "submitted"].includes(contract.status)) throw new ContractError("not_pending", "Contract is not pending", 409);
  const token = newToken(contract.id);
  return {
    token,
    contract: {
      ...contract,
      tokenHash: sha256(token),
      expiresAt: now + LINK_TTL_MS,
      otp: null,
      audit: [...contract.audit, { t: now, ev: "link_reissued" }],
    },
  };
}

export function matchesToken(contract, token, now = Date.now()) {
  return tokenKind(contract, token, now) !== null;
}

/**
 * "guest": the link sent to the guest; "kiosk": the short-lived link opened from
 * the admin on the staff device, for the signature in person; null: no match.
 */
export function tokenKind(contract, token, now = Date.now()) {
  if (!contract) return null;
  const h = sha256(String(token));
  if (safeEqual(contract.tokenHash, h)) return contract.status !== "pending" || contract.expiresAt > now ? "guest" : null;
  if (contract.kiosk && safeEqual(contract.kiosk.hash, h) && contract.kiosk.exp > now && contract.status === "verified") return "kiosk";
  return null;
}

// The guest link is kept sealed with the server secret, so the signed-copy email
// sent at the countersignature can carry the guest's own booking-page link.
const sealKey = (secret) => createHash("sha256").update(`contract-link:${secret}`).digest();
export function sealToken(token, secret) {
  if (!secret) return null;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", sealKey(secret), iv);
  const enc = Buffer.concat([c.update(String(token), "utf8"), c.final()]);
  return `${iv.toString("base64url")}.${enc.toString("base64url")}.${c.getAuthTag().toString("base64url")}`;
}
export function openToken(sealed, secret) {
  try {
    const [iv, enc, tag] = String(sealed || "").split(".");
    const d = createDecipheriv("aes-256-gcm", sealKey(secret), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(enc, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** What the guest page may see: no hash, no OTP, no audit. */
export function publicView(contract) {
  return {
    id: contract.id,
    number: numberOf(contract),
    status: contract.status,
    version: contract.version,
    language: contract.language,
    guestName: contract.guestName,
    startDate: contract.startDate,
    endDate: contract.endDate,
    pickupTime: contract.pickupTime,
    returnTime: contract.returnTime,
    priceTotal: contract.priceTotal,
    source: contract.source,
    bookingRef: contract.bookingRef,
    emailHint: contract.email.replace(/^(.).*(@.*)$/, "$1***$2"),
    pdfPath: contractPdfPathOf(contract),
    vehicle: vehicleView(contract),
    preview: contractPreviewOf(contract),
    readAt: contract.audit?.find((a) => a.ev === "contract_read")?.t || null,
    extras: contract.extras || [],
    signedAt: contract.signed?.at || null,
    signerName: contract.signed?.data?.fullName || null,
  };
}

/** The camper as the guest and the PDF see it. */
export function vehicleView(contract) {
  const v = getVehicle(vehicleOf(contract));
  return {
    id: v.id,
    name: v.name,
    plate: v.plateDisplay,
    city: v.city.es,
    pickupAddress: v.pickupAddress || "",
    coords: v.coords || null,
    // { company, policy, assistancePhone } once known; the booking page shows what is set.
    insurance: v.insurance || null,
  };
}

// ── one-time code by email ──────────────────────────────────────────────────

const otpHash = (secret, id, code) => createHmac("sha256", secret).update(`${id}:${code}`).digest("hex");

export function issueOtp(contract, { now = Date.now(), secret } = {}) {
  if (!secret) throw new ContractError("secret_missing", "CONTRACT_SECRET or ADMIN_TOKEN is not set", 500);
  if (contract.status !== "verified") throw new ContractError("not_verified", "The data has not been checked yet", 409);
  if (contract.otp && now - contract.otp.sentAt < OTP_RESEND_MS) {
    throw new ContractError("code_too_soon", "Wait a minute before asking for another code", 429);
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  return {
    code,
    contract: {
      ...contract,
      otp: { hash: otpHash(secret, contract.id, code), exp: now + OTP_TTL_MS, sentAt: now, attempts: 0 },
      audit: [...contract.audit, { t: now, ev: "code_sent" }],
    },
  };
}

/** @returns {{ok: boolean, reason?: string, contract: object}} contract carries the updated attempt counter */
export function checkOtp(contract, code, { now = Date.now(), secret } = {}) {
  const otp = contract.otp;
  if (!otp) return { ok: false, reason: "no_code", contract };
  if (otp.exp <= now) return { ok: false, reason: "code_expired", contract };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts", contract };
  const good = safeEqual(otp.hash, otpHash(secret, contract.id, clean(String(code), 8)));
  if (!good) {
    return {
      ok: false,
      reason: "code_wrong",
      contract: {
        ...contract,
        otp: { ...otp, attempts: otp.attempts + 1 },
        audit: [...contract.audit, { t: now, ev: "code_wrong" }],
      },
    };
  }
  return { ok: true, contract };
}

// ── signing data ────────────────────────────────────────────────────────────

const REQUIRED = [
  ["fullName", 120],
  ["docNumber", 40],
  ["docExpiry", 10],
  ["nationality", 60],
  ["street", 160],
  ["city", 80],
  ["postalCode", 20],
  ["country", 60],
  ["phone", 40],
  ["licenseCountry", 60],
  ["licenseIssued", 10],
  ["licenseBSince", 10],
  ["licenseExpiry", 10],
  ["birthDate", 10],
];
const OPTIONAL = [["licenseNumber", 40], ["extraDriverName", 120], ["extraDriverDoc", 40], ["extraDriverLicense", 40], ["surname", 80]];

/** @returns the cleaned data the contract is signed with */
export function validateSignData(input = {}) {
  const data = {};
  for (const [key, max] of REQUIRED) {
    data[key] = clean(input[key], max);
    if (!data[key]) throw new ContractError("field_required", `Missing ${key}`);
  }
  for (const [key, max] of OPTIONAL) data[key] = clean(input[key], max);
  data.docType = DOC_TYPES.includes(input.docType) ? input.docType : null;
  if (!data.docType) throw new ContractError("field_required", "Missing docType");
  if (![data.birthDate, data.docExpiry, data.licenseIssued, data.licenseBSince, data.licenseExpiry].every((d) => ISO_DATE.test(d))) {
    throw new ContractError("date_invalid", "Birth date or license expiry is not a valid date");
  }
  return data;
}

// liabilityClauses (v5): the guest ticks, separately, the clauses that put towing,
// impound, legal costs, ferry damage and downtime at their charge (5.5, 5.9, 7.4, 11.7).
// languageNotice (v7): the guest read the conditions in a language they understand
// and knows that the Spanish version of the contract prevails (clause 17).
export const CONSENT_KEYS = [
  "readContract",
  "electronicSignature",
  "cardAuthorization",
  "liabilityClauses",
  "dataProtection",
  "languageNotice",
];

export function requireConsents(input = {}) {
  for (const key of CONSENT_KEYS) {
    if (input[key] !== true) throw new ContractError("consent_required", `Missing consent: ${key}`);
  }
  return Object.fromEntries(CONSENT_KEYS.map((k) => [k, true]));
}

const MAX_SIGNATURE_BYTES = 400_000;

/** @returns {Buffer} PNG bytes of a "data:image/png;base64,..." canvas export */
export function decodeSignaturePng(dataUrl) {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(typeof dataUrl === "string" ? dataUrl : "");
  if (!m) throw new ContractError("signature_required", "Signature image is missing");
  const bytes = Buffer.from(m[1], "base64");
  const isPng = bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!isPng || bytes.length > MAX_SIGNATURE_BYTES || bytes.length < 300) {
    throw new ContractError("signature_invalid", "Signature image is not valid");
  }
  return bytes;
}

// ── document photos ─────────────────────────────────────────────────────────
// The guest photographs the ID document and the driving licence (both sides;
// a passport only has the photo page). JPEGs, stored privately next to the
// contract and hashed into the signed record.

export const DOC_SLOTS = ["idFront", "idBack", "licenseFront", "licenseBack"];
const MAX_DOC_BYTES = 3_000_000;
const MIN_DOC_BYTES = 5_000;

/** Slots the guest must upload for the chosen document type. */
export function requiredDocSlots(docType) {
  return docType === "passport" ? ["idFront", "licenseFront", "licenseBack"] : [...DOC_SLOTS];
}

/** @returns {Buffer} JPEG bytes of a "data:image/jpeg;base64,..." photo */
export function decodeDocJpeg(dataUrl) {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(typeof dataUrl === "string" ? dataUrl : "");
  if (!m) throw new ContractError("doc_invalid", "Photo is missing or not a JPEG");
  const bytes = Buffer.from(m[1], "base64");
  const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isJpeg || bytes.length > MAX_DOC_BYTES || bytes.length < MIN_DOC_BYTES) {
    throw new ContractError("doc_invalid", "Photo is not valid");
  }
  return bytes;
}

// ── signing in person ───────────────────────────────────────────────────────
// 1. submit: the guest sends the data and the document photos from his link.
// 2. verify: at pickup, staff compare them with the original documents (and may
//    correct a typo; every change is logged).
// 3. guest signature on the staff device (kiosk link, email code still required).
// 4. the lessor countersigns: only then the PDF is built and the copies are sent.

/** Statuses in which the guest may still send or change the data. */
export const OPEN_STATUSES = ["pending", "submitted"];
/** Not signed by both parties and not cancelled. */
export const UNSIGNED_STATUSES = ["pending", "submitted", "verified", "guest_signed"];
export const KIOSK_TTL_MS = 45 * 60_000;

// What staff tick against the originals; extraDriver only when there is one.
export const VERIFY_KEYS = ["name", "document", "birthDate", "docExpiry", "license", "licenseB", "address", "extraDriver"];
export const requiredChecks = (data) => VERIFY_KEYS.filter((k) => k !== "extraDriver" || !!data?.extraDriverName);

const audit = (c, ev, extra = {}) => [...(c.audit || []), { t: extra.t, ev, ...extra }];

export function markSubmitted(contract, { data, docHashes = {}, ip, userAgent, now = Date.now() }) {
  if (!OPEN_STATUSES.includes(contract.status)) throw new ContractError("not_open", "The data is already being checked", 409);
  return {
    ...contract,
    status: "submitted",
    submission: { at: now, data, docHashes, ip: clean(ip, 64), userAgent: clean(userAgent, 300) },
    audit: audit(contract, contract.status === "submitted" ? "resubmitted" : "submitted", { t: now, ip: clean(ip, 64) }),
  };
}

/** Staff checked the data against the original documents (in person). */
export function markVerified(contract, { data, checks = {}, by, name, now = Date.now() }) {
  if (!["submitted", "verified"].includes(contract.status)) {
    throw new ContractError("not_submitted", "The guest has not sent the data yet", 409);
  }
  const missing = requiredChecks(data).filter((k) => checks[k] !== true);
  if (missing.length) throw new ContractError("checks_required", `Not checked: ${missing.join(", ")}`);
  const before = contract.verification?.data || contract.submission?.data || {};
  const edits = Object.keys({ ...before, ...data })
    .filter((k) => (before[k] || "") !== (data[k] || ""))
    .map((k) => ({ field: k, from: before[k] || "", to: data[k] || "" }));
  return {
    ...contract,
    status: "verified",
    kiosk: null,
    otp: null,
    verification: {
      at: now,
      by: clean(by, 160),
      name: clean(name, 120),
      checks: Object.fromEntries(requiredChecks(data).map((k) => [k, true])),
      data,
      edits: [...(contract.verification?.edits || []), ...edits],
    },
    audit: audit(contract, "verified", { t: now, by: clean(by, 160), edits: edits.map((e) => e.field) }),
  };
}

/** One short-lived link for the guest's signature on the staff device. */
export function issueKiosk(contract, { by, now = Date.now() } = {}) {
  if (contract.status !== "verified") throw new ContractError("not_verified", "Check the documents first", 409);
  const token = newToken(contract.id);
  return {
    token,
    contract: {
      ...contract,
      kiosk: { hash: sha256(token), exp: now + KIOSK_TTL_MS, by: clean(by, 160) },
      audit: audit(contract, "kiosk_opened", { t: now, by: clean(by, 160) }),
    },
  };
}

export function markGuestSigned(contract, { consents, signatureHash, ip, userAgent, staff, now = Date.now() }) {
  if (contract.status !== "verified") throw new ContractError("not_verified", "Check the documents first", 409);
  return {
    ...contract,
    status: "guest_signed",
    kiosk: null,
    otp: null,
    guestSignature: {
      at: now,
      consents,
      signatureHash,
      ip: clean(ip, 64),
      userAgent: clean(userAgent, 300),
      staff: clean(staff, 160),
    },
    audit: audit(contract, "guest_signed", { t: now, ip: clean(ip, 64) }),
  };
}

/** The lessor's countersignature: the contract is now signed by both parties. */
export function markSigned(contract, { pdfHash, basePdfHash, owner, now = Date.now() }) {
  if (contract.status !== "guest_signed") throw new ContractError("not_guest_signed", "The guest has not signed yet", 409);
  const g = contract.guestSignature;
  return {
    ...contract,
    status: "signed",
    otp: null,
    kiosk: null,
    signed: {
      at: now,
      guestAt: g.at,
      data: contract.verification.data,
      consents: g.consents,
      signatureHash: g.signatureHash,
      pdfHash,
      basePdfHash,
      docHashes: contract.submission?.docHashes || {},
      ip: g.ip,
      userAgent: g.userAgent,
      verified: { at: contract.verification.at, by: contract.verification.by, name: contract.verification.name },
      owner: { name: clean(owner.name, 120), by: clean(owner.by, 160), signatureHash: owner.signatureHash, at: now },
      pdfPath: `${CONTRACT_PREFIX}${contract.id}.pdf`,
    },
    audit: audit(contract, "signed", { t: now, by: clean(owner.by, 160) }),
  };
}

// ── storage ─────────────────────────────────────────────────────────────────

export function createContractStore({ prefix = CONTRACT_PREFIX } = {}) {
  const jsonPath = (id) => `${prefix}${id}.json`;
  return {
    async get(id) {
      const r = await blobStore.readJson(jsonPath(id));
      return r ? { contract: r.data, etag: r.etag } : null;
    },
    async save(contract, { etag } = {}) {
      await blobStore.put(jsonPath(contract.id), contract, etag ? { ifMatch: etag } : {});
    },
    async list() {
      const names = [];
      let cursor;
      do {
        const page = await list({ prefix, cursor });
        for (const b of page.blobs) if (b.pathname.endsWith(".json")) names.push(b.pathname);
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      const rows = await Promise.all(names.map((n) => blobStore.readJson(n).catch(() => null)));
      return rows.filter(Boolean).map((r) => r.data).sort((a, b) => b.createdAt - a.createdAt);
    },
    async putPdf(contract, bytes) {
      await blobStore.putRaw(`${prefix}${contract.id}.pdf`, Buffer.from(bytes), { contentType: "application/pdf" });
    },
    async getPdf(contract) {
      return blobStore.readBuffer(`${prefix}${contract.id}.pdf`);
    },
    async putDoc(id, slot, bytes) {
      await blobStore.putRaw(`${prefix}docs/${id}-${slot}.jpg`, Buffer.from(bytes), { contentType: "image/jpeg" });
    },
    async getDoc(id, slot) {
      return blobStore.readBuffer(`${prefix}docs/${id}-${slot}.jpg`);
    },
    async putSignature(id, who, bytes) {
      await blobStore.putRaw(`${prefix}sig/${id}-${who}.png`, Buffer.from(bytes), { contentType: "image/png" });
    },
    async getSignature(id, who) {
      return blobStore.readBuffer(`${prefix}sig/${id}-${who}.png`);
    },
    async putOwnerSignature(bytes) {
      await blobStore.putRaw(`${prefix}owner-signature.png`, Buffer.from(bytes), { contentType: "image/png" });
    },
    async getOwnerSignature() {
      return blobStore.readBuffer(`${prefix}owner-signature.png`);
    },
  };
}

export function createMemoryContractStore(initial = []) {
  const rows = new Map(initial.map((c) => [c.id, JSON.stringify(c)]));
  const pdfs = new Map();
  const docs = new Map();
  let ownerSignature = null;
  const sigs = new Map();
  return {
    rows,
    pdfs,
    docs,
    sigs,
    async putSignature(id, who, bytes) {
      sigs.set(`${id}-${who}`, Buffer.from(bytes));
    },
    async getSignature(id, who) {
      return sigs.get(`${id}-${who}`) || null;
    },
    async get(id) {
      return rows.has(id) ? { contract: JSON.parse(rows.get(id)), etag: "e" } : null;
    },
    async save(contract) {
      rows.set(contract.id, JSON.stringify(contract));
    },
    async list() {
      return [...rows.values()].map((r) => JSON.parse(r)).sort((a, b) => b.createdAt - a.createdAt);
    },
    async putPdf(contract, bytes) {
      pdfs.set(contract.id, Buffer.from(bytes));
    },
    async getPdf(contract) {
      return pdfs.get(contract.id) || null;
    },
    async putDoc(id, slot, bytes) {
      docs.set(`${id}-${slot}`, Buffer.from(bytes));
    },
    async getDoc(id, slot) {
      return docs.get(`${id}-${slot}`) || null;
    },
    async putOwnerSignature(bytes) {
      ownerSignature = Buffer.from(bytes);
    },
    async getOwnerSignature() {
      return ownerSignature;
    },
  };
}
