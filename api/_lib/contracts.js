// Electronic rental contracts: one JSON record per contract in Vercel Blob,
// a signing link with an unguessable token, an email one-time code and an
// audit trail. Pure logic: the HTTP layer and the email/PDF side effects live
// in contract-handlers.js so this file can be tested without network.
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { blobStore, list } from "./blob.js";
import { DEFAULT_VEHICLE_ID, getVehicle, isActiveVehicleId, vehicleOf } from "../../shared/vehicles.js";

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

export function createContract(input, { now = Date.now(), provider = "own" } = {}) {
  const fields = validateInvite(input);
  const id = randomBytes(6).toString("hex");
  const token = newToken(id);
  const contract = {
    id,
    ...fields,
    version: CONTRACT_VERSION,
    provider,
    externalId: null,
    status: "pending", // pending | signed | cancelled
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
  if (contract.status !== "pending") throw new ContractError("not_pending", "Contract is not pending", 409);
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
  if (!contract || !safeEqual(contract.tokenHash, sha256(String(token)))) return false;
  return contract.status !== "pending" || contract.expiresAt > now;
}

/** What the guest page may see: no hash, no OTP, no audit. */
export function publicView(contract) {
  return {
    id: contract.id,
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
  if (contract.status !== "pending") throw new ContractError("not_pending", "Contract is not pending", 409);
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
  ["licenseNumber", 40],
  ["licenseCountry", 60],
  ["licenseExpiry", 10],
  ["birthDate", 10],
];
const OPTIONAL = [["extraDriverName", 120], ["extraDriverDoc", 40], ["extraDriverLicense", 40]];

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
  if (![data.birthDate, data.docExpiry, data.licenseExpiry].every((d) => ISO_DATE.test(d))) {
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

export function markSigned(contract, { data, consents, signatureHash, pdfHash, basePdfHash, docHashes = {}, ip, userAgent, now = Date.now() }) {
  return {
    ...contract,
    status: "signed",
    otp: null,
    signed: {
      at: now,
      data,
      consents,
      signatureHash,
      pdfHash,
      basePdfHash,
      docHashes,
      ip: clean(ip, 64),
      userAgent: clean(userAgent, 300),
      pdfPath: `${CONTRACT_PREFIX}${contract.id}.pdf`,
    },
    audit: [...contract.audit, { t: now, ev: "signed", ip: clean(ip, 64) }],
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
  return {
    rows,
    pdfs,
    docs,
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
