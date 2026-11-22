// Handover reports (acta de entrega / devolución): one JSON record per contract
// and kind in Vercel Blob, photos and signatures as separate private blobs.
// Pure validation + storage; HTTP in acta-handlers.js, PDF in acta-pdf.js.
import { randomBytes } from "node:crypto";
import { blobStore, list } from "./blob.js";
import { ContractError } from "./contracts.js";
import { ACTA_KINDS, CHECKLIST_KEYS, DAMAGE_TYPE_KEYS, kmPlanFromExtras } from "../../shared/acta.js";
import { EXTRAS } from "../../shared/pricing.js";

export const ACTA_PREFIX = process.env.ACTAS_BLOB_PREFIX || "campervlc-actas/";
export const MAX_PHOTOS = 40;
export const MAX_MARKS = 60;
// The client compresses to <= 1600 px JPEG; the JSON body (base64) must stay under 4 MB.
export const MAX_PHOTO_BYTES = 2_800_000;
export const MAX_THUMB_BYTES = 300_000;

const CONTRACT_ID = /^[0-9a-f]{12}$/;
const PHOTO_ID = /^[0-9a-f]{16}$/;
const DATETIME = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
const KM_PLANS = ["100", "200", "unlimited"];
const EXTRA_IDS = EXTRAS.map((e) => e.id).filter((id) => id !== "cleaning_fee");

const clean = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max) : "");
const triBool = (v) => (v === true ? true : v === false ? false : null);

export const isContractId = (v) => typeof v === "string" && CONTRACT_ID.test(v);
export const isKind = (v) => ACTA_KINDS.includes(v);
export const isPhotoId = (v) => typeof v === "string" && PHOTO_ID.test(v);
export const actaId = (contractId, kind) => `${contractId}-${kind}`;

/** A new draft for this contract: prefilled from the contract and the booking's extras. */
export function newActa(contract, kind, { vehicleId, extras = [], staffEmail = null, now = Date.now() } = {}) {
  const ex = (Array.isArray(extras) ? extras : []).filter((id) => EXTRA_IDS.includes(id));
  return {
    id: actaId(contract.id, kind),
    contractId: contract.id,
    vehicleId,
    kind,
    status: "draft", // draft | signed
    createdAt: now,
    updatedAt: now,
    staffEmail,
    datetime: null, // wall-clock "YYYY-MM-DDTHH:mm" (Spain)
    odometerKm: null,
    fuel: null, // eighths 0..8
    checklist: Object.fromEntries(CHECKLIST_KEYS.map((k) => [k, null])),
    smell: null,
    petsOnBoard: null,
    kmPlan: kmPlanFromExtras(ex),
    extras: ex,
    marks: [],
    photos: [],
    notes: "",
    staffName: "",
    guestName: contract.guestName || "",
    signatures: null,
    pdf: null,
    audit: [{ t: now, ev: "created", by: staffEmail }],
  };
}

function validMark(m, i) {
  if (!m || typeof m !== "object") throw new ContractError("mark_invalid", `Mark ${i} is not valid`);
  const x = Number(m.x);
  const y = Number(m.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
    throw new ContractError("mark_invalid", `Mark ${i}: position out of the drawing`);
  }
  if (!DAMAGE_TYPE_KEYS.includes(m.type)) throw new ContractError("mark_invalid", `Mark ${i}: unknown type`);
  const id = typeof m.id === "string" && /^[A-Za-z0-9_-]{1,16}$/.test(m.id) ? m.id : `m${i + 1}`;
  return { id, x: Math.round(x * 10_000) / 10_000, y: Math.round(y * 10_000) / 10_000, type: m.type, note: clean(m.note, 200) };
}

/**
 * Cleans the fields a draft save may change. Only keys present in `input` are
 * returned (partial updates). Photos, signatures and status are server-managed.
 */
export function validateActaPatch(input = {}) {
  if (!input || typeof input !== "object") throw new ContractError("acta_invalid");
  const out = {};
  const has = (k) => Object.prototype.hasOwnProperty.call(input, k);
  if (has("datetime")) {
    if (input.datetime === null || input.datetime === "") out.datetime = null;
    else if (typeof input.datetime === "string" && DATETIME.test(input.datetime)) out.datetime = input.datetime;
    else throw new ContractError("datetime_invalid", "Date and time is not valid");
  }
  if (has("odometerKm")) {
    const v = input.odometerKm;
    if (v === null || v === "") out.odometerKm = null;
    else {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 2_000_000) throw new ContractError("odometer_invalid", "Odometer is not valid");
      out.odometerKm = n;
    }
  }
  if (has("fuel")) {
    const v = input.fuel;
    if (v === null || v === "") out.fuel = null;
    else {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 8) throw new ContractError("fuel_invalid", "Fuel must be 0..8 eighths");
      out.fuel = n;
    }
  }
  if (has("checklist")) {
    const c = input.checklist && typeof input.checklist === "object" ? input.checklist : {};
    out.checklist = Object.fromEntries(CHECKLIST_KEYS.map((k) => [k, triBool(c[k])]));
  }
  if (has("smell")) out.smell = triBool(input.smell);
  if (has("petsOnBoard")) out.petsOnBoard = triBool(input.petsOnBoard);
  if (has("kmPlan")) {
    if (!KM_PLANS.includes(input.kmPlan)) throw new ContractError("km_plan_invalid");
    out.kmPlan = input.kmPlan;
  }
  if (has("extras")) out.extras = [...new Set((Array.isArray(input.extras) ? input.extras : []).filter((id) => EXTRA_IDS.includes(id)))];
  if (has("marks")) {
    if (!Array.isArray(input.marks) || input.marks.length > MAX_MARKS) throw new ContractError("marks_invalid", "Too many marks");
    out.marks = input.marks.map(validMark);
  }
  if (has("notes")) out.notes = clean(input.notes, 2000);
  if (has("staffName")) out.staffName = clean(input.staffName, 120);
  if (has("guestName")) out.guestName = clean(input.guestName, 120);
  return out;
}

/** Applies a cleaned patch to a draft (signed actas never change). */
export function applyPatch(acta, patch, { by = null, now = Date.now() } = {}) {
  if (acta.status !== "draft") throw new ContractError("acta_signed", "The report is signed and can no longer change", 409);
  return { ...acta, ...patch, updatedAt: now, staffEmail: acta.staffEmail || by };
}

/** What signing needs: km, fuel, both names; the signatures are checked by the caller. */
export function requireSignable(acta, { checkin = null } = {}) {
  if (acta.status !== "draft") throw new ContractError("acta_signed", "Already signed", 409);
  if (!Number.isInteger(acta.odometerKm)) throw new ContractError("odometer_required", "Odometer is required");
  if (!Number.isInteger(acta.fuel)) throw new ContractError("fuel_required", "Fuel level is required");
  if (!acta.datetime) throw new ContractError("datetime_required", "Date and time is required");
  if (clean(acta.staffName, 120).length < 2) throw new ContractError("staff_name_required", "Staff name is required");
  if (clean(acta.guestName, 120).length < 2) throw new ContractError("guest_name_required", "Guest name is required");
  if (acta.kind === "checkout" && Number.isInteger(checkin?.odometerKm) && acta.odometerKm < checkin.odometerKm) {
    throw new ContractError("odometer_lower", "Odometer is lower than at check-in");
  }
}

/** "data:image/jpeg;base64,..." -> Buffer, JPEG only, size-capped. */
export function decodeJpeg(dataUrl, max = MAX_PHOTO_BYTES) {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(typeof dataUrl === "string" ? dataUrl : "");
  if (!m) throw new ContractError("photo_invalid", "JPEG image expected");
  const bytes = Buffer.from(m[1], "base64");
  if (bytes.length < 100 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new ContractError("photo_invalid", "Not a JPEG image");
  }
  if (bytes.length > max) throw new ContractError("photo_too_large", "Photo is too large", 413);
  return bytes;
}

export const newPhotoId = () => randomBytes(8).toString("hex");

/** What the admin page gets: no signature images, photo ids only. */
export function actaView(a) {
  if (!a) return null;
  return {
    ...a,
    photos: (a.photos || []).map(({ id, takenAt, size }) => ({ id, takenAt, size })),
    signatures: a.signatures
      ? {
          staff: { name: a.signatures.staff.name, at: a.signatures.staff.at },
          guest: { name: a.signatures.guest.name, at: a.signatures.guest.at },
        }
      : null,
    pdf: a.pdf ? { sha256: a.pdf.sha256, at: a.pdf.at, size: a.pdf.size } : null,
  };
}

// ── storage ─────────────────────────────────────────────────────────────────

const isConflict = (err) => /precondition|already exists|conflict/i.test(`${err?.name} ${err?.code} ${err?.message}`);

export class ActaConflictError extends Error {
  constructor() {
    super("The report changed, reload and try again");
    this.code = "conflict";
  }
}

export function createActaStore({ prefix = ACTA_PREFIX } = {}) {
  const json = (contractId, kind) => `${prefix}${actaId(contractId, kind)}.json`;
  const photo = (contractId, kind, id, thumb) => `${prefix}photos/${actaId(contractId, kind)}/${id}${thumb ? ".thumb" : ""}.jpg`;
  return {
    async get(contractId, kind) {
      const r = await blobStore.readJson(json(contractId, kind));
      return r ? { acta: r.data, etag: r.etag } : null;
    },
    /** With `etag`: only if unchanged; without: only if new. Returns the new etag. */
    async save(acta, { etag } = {}) {
      try {
        const r = await blobStore.put(json(acta.contractId, acta.kind), acta, etag ? { ifMatch: etag } : { allowOverwrite: false });
        return r?.etag || null;
      } catch (err) {
        if (isConflict(err)) throw new ActaConflictError();
        throw err;
      }
    },
    async list() {
      const names = [];
      let cursor;
      do {
        const page = await list({ prefix, cursor });
        for (const b of page.blobs) if (/^[0-9a-f]{12}-(checkin|checkout)\.json$/.test(b.pathname.slice(prefix.length))) names.push(b.pathname);
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      const rows = await Promise.all(names.map((n) => blobStore.readJson(n).catch(() => null)));
      return rows.filter(Boolean).map((r) => r.data);
    },
    async putPhoto(contractId, kind, id, bytes, { thumb = false } = {}) {
      await blobStore.putRaw(photo(contractId, kind, id, thumb), bytes, { contentType: "image/jpeg" });
    },
    getPhoto(contractId, kind, id, { thumb = false } = {}) {
      return blobStore.readBuffer(photo(contractId, kind, id, thumb));
    },
    async putFile(name, bytes, contentType) {
      await blobStore.putRaw(`${prefix}${name}`, Buffer.from(bytes), { contentType });
      return `${prefix}${name}`;
    },
    getFile(path) {
      return path && path.startsWith(prefix) ? blobStore.readBuffer(path) : Promise.resolve(null);
    },
  };
}

/** Same contract in memory, with real etags (tests). */
export function createMemoryActaStore(initial = []) {
  const rows = new Map();
  const files = new Map();
  let v = 0;
  const key = (contractId, kind) => actaId(contractId, kind);
  const put = (a) => {
    const etag = `v${++v}`;
    rows.set(key(a.contractId, a.kind), { json: JSON.stringify(a), etag });
    return etag;
  };
  initial.forEach(put);
  return {
    rows,
    files,
    async get(contractId, kind) {
      const r = rows.get(key(contractId, kind));
      return r ? { acta: JSON.parse(r.json), etag: r.etag } : null;
    },
    async save(acta, { etag } = {}) {
      const cur = rows.get(key(acta.contractId, acta.kind));
      if (etag ? !cur || cur.etag !== etag : cur) throw new ActaConflictError();
      return put(acta);
    },
    async list() {
      return [...rows.values()].map((r) => JSON.parse(r.json));
    },
    async putPhoto(contractId, kind, id, bytes, { thumb = false } = {}) {
      files.set(`photos/${key(contractId, kind)}/${id}${thumb ? ".thumb" : ""}.jpg`, Buffer.from(bytes));
    },
    async getPhoto(contractId, kind, id, { thumb = false } = {}) {
      return files.get(`photos/${key(contractId, kind)}/${id}${thumb ? ".thumb" : ""}.jpg`) || null;
    },
    async putFile(name, bytes) {
      files.set(name, Buffer.from(bytes));
      return name;
    },
    async getFile(path) {
      return files.get(path) || null;
    },
  };
}
