// Who has already had the first-booking discount (MEMBER_DISCOUNT_PCT). An
// account alone is not enough: anyone can open a new account with another
// email. So every discounted booking also records the guest's identity —
// full name, phone, email (Gmail dots and "+tag" folded), and once the
// contract is signed the ID/passport and driving licence numbers. A new
// booking matching any of them gets no discount.
//
// One small blob per identity key, named by an HMAC of the key, so the store
// holds no readable names or numbers.
import { createHmac } from "node:crypto";
import { blobStore } from "./blob.js";

export const DISCOUNTS_PREFIX = process.env.MEMBER_DISCOUNTS_BLOB_PREFIX || "campervlc-member-discounts/";

const strip = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** "José  García-López" and "garcia lopez jose" give the same key. */
export function nameKey(...parts) {
  const words = strip(parts.join(" "))
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 0);
  if (words.length < 2) return null; // a single word is too weak to tell people apart
  return `name:${[...new Set(words)].sort().join(" ")}`;
}

/** Last 9 digits: "+34 624 03 80 85" and "624038085" give the same key. */
export function phoneKey(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length < 7) return null;
  return `phone:${digits.slice(-9)}`;
}

/** Mailbox, not spelling: case, "+tag" and Gmail dots do not make a new person. */
export function emailKey(email) {
  const e = String(email ?? "").trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return null;
  let local = e.slice(0, at).split("+")[0];
  let domain = e.slice(at + 1);
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  if (!local || !domain.includes(".")) return null;
  return `email:${local}@${domain}`;
}

/** ID card / passport / licence number, letters and digits only. */
export function docKey(kind, number) {
  const n = String(number ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (n.length < 5) return null;
  return `${kind}:${n}`;
}

/** Keys known when the guest pays (booking form + logged-in account). */
export function checkoutKeys({ firstName, lastName, phone, email, accountEmail }) {
  return [nameKey(firstName, lastName), phoneKey(phone), emailKey(email), emailKey(accountEmail)].filter(Boolean);
}

/** Keys the signed contract adds. */
export function contractKeys(data) {
  return [
    docKey("doc", data.docNumber),
    docKey("licence", data.licenseNumber),
    nameKey(data.fullName),
    phoneKey(data.phone),
  ].filter(Boolean);
}

/**
 * @param secret  AUTH_SECRET (keys are stored as HMACs of it)
 * @param store   blobStore-like { readJson, put }
 */
export function createDiscountRegistry({ secret, store = blobStore, prefix = DISCOUNTS_PREFIX }) {
  const path = (key) => `${prefix}${createHmac("sha256", secret).update(key).digest("hex").slice(0, 40)}.json`;

  async function read(key) {
    const r = await store.readJson(path(key));
    return r ? { rec: r.data, etag: r.etag } : null;
  }

  /** A record that stops this guest: a used discount, or a live reservation by someone else. */
  const blocks = (rec, { now, userId }) =>
    rec.status === "used" || (rec.status === "reserved" && rec.expiresAt > now && rec.userId !== userId);

  return {
    /** Keys that already had the discount (or are reserved by another checkout). */
    async taken(keys, { now = Date.now(), userId = null } = {}) {
      const hits = [];
      for (const key of keys) {
        const found = await read(key);
        if (found && blocks(found.rec, { now, userId })) hits.push({ key, ...found.rec });
      }
      return hits;
    },

    /**
     * Holds the discount for a checkout until it is paid or expires, so two
     * parallel checkouts can not both get it. @returns true when every key was held.
     */
    async reserve(keys, { userId, expiresAt, now = Date.now() }) {
      for (const key of keys) {
        const rec = { status: "reserved", userId, expiresAt, at: now };
        const found = await read(key);
        try {
          if (!found) await store.put(path(key), rec, { allowOverwrite: false });
          else if (!blocks(found.rec, { now, userId })) await store.put(path(key), rec, { ifMatch: found.etag });
          else return false;
        } catch (err) {
          // Someone else wrote this key between our read and our write.
          console.warn("member-discount: reservation lost a race -", err.message);
          return false;
        }
      }
      return true;
    },

    /**
     * Marks the keys as used by `bookingId`. @returns the keys that were already
     * used by ANOTHER booking (the discount was given twice: tell the owner).
     */
    async markUsed(keys, { bookingId, now = Date.now() }) {
      const clashes = [];
      for (const key of keys) {
        const found = await read(key);
        if (found?.rec.status === "used" && found.rec.bookingId !== bookingId) {
          clashes.push({ key, bookingId: found.rec.bookingId });
          continue;
        }
        try {
          await store.put(path(key), { status: "used", bookingId, at: now });
        } catch (err) {
          console.error("member-discount: could not record", key.split(":")[0], "-", err.message);
        }
      }
      return clashes;
    },
  };
}

/** In-memory store with the blobStore contract the registry uses, for tests. */
export function createMemoryBlob() {
  const rows = new Map();
  let v = 0;
  return {
    rows,
    async readJson(p) {
      const r = rows.get(p);
      return r ? { data: JSON.parse(r.json), etag: r.etag } : null;
    },
    async put(p, data, opts = {}) {
      const cur = rows.get(p);
      if (opts.allowOverwrite === false && cur) throw new Error("exists");
      if (opts.ifMatch && cur?.etag !== opts.ifMatch) throw new Error("precondition");
      rows.set(p, { json: JSON.stringify(data), etag: `e${++v}` });
    },
  };
}
