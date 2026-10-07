// Booking records in Vercel Blob, one JSON file per booking. Files under
// api/_lib are helpers, not endpoints (Vercel skips "_" paths).
import { BlobPreconditionFailedError } from "@vercel/blob";
import { blobStore, list } from "./blob.js";

import { BOOKINGS_PREFIX } from "./prefix.js";
export { BOOKINGS_PREFIX };

export class StoreConflictError extends Error {
  constructor(id) {
    super(`Booking ${id} changed while it was being updated`);
    this.code = "conflict";
  }
}

async function readJson(pathname) {
  // useCache:false reads from origin: a CDN copy may still hold the version
  // from before the last save, and every change is priced from this read.
  const read = await blobStore.readJson(pathname);
  return read ? { booking: read.data, etag: read.etag } : null;
}

export function createBlobStore({ prefix = BOOKINGS_PREFIX } = {}) {
  const pathFor = (id) => `${prefix}${id}.json`;

  return {
    async listBookings() {
      const pathnames = [];
      let cursor;
      do {
        const page = await list({ prefix, cursor });
        for (const b of page.blobs) pathnames.push(b.pathname);
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      const loaded = await Promise.all(pathnames.map((p) => readJson(p).catch(() => null)));
      return loaded.filter(Boolean).map((r) => r.booking);
    },

    /** { booking, etag } or null. */
    async getBooking(id) {
      return readJson(pathFor(id));
    },

    /**
     * With `etag` the write only lands if nobody saved since that read
     * (throws StoreConflictError otherwise). Without it, overwrites.
     */
    async saveBooking(booking, { etag } = {}) {
      try {
        await blobStore.put(pathFor(booking.id), booking, etag ? { ifMatch: etag } : {});
      } catch (err) {
        if (err instanceof BlobPreconditionFailedError) throw new StoreConflictError(booking.id);
        throw err;
      }
    },
  };
}

/** In-memory store with the same contract, for tests and local scripts. */
export function createMemoryStore(initial = []) {
  const rows = new Map();
  let version = 0;
  const put = (b) => rows.set(b.id, { json: JSON.stringify(b), etag: `v${++version}` });
  initial.forEach(put);
  return {
    rows,
    async listBookings() {
      return [...rows.values()].map((r) => JSON.parse(r.json));
    },
    async getBooking(id) {
      const r = rows.get(id);
      return r ? { booking: JSON.parse(r.json), etag: r.etag } : null;
    },
    async saveBooking(booking, { etag } = {}) {
      const current = rows.get(booking.id);
      if (etag && current && current.etag !== etag) throw new StoreConflictError(booking.id);
      put(booking);
    },
  };
}
