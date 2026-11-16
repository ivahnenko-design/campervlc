// Small fixed-window rate limiter kept in Vercel Blob (serverless functions
// share no memory). Best effort: two requests racing on the same counter may
// both pass, which is fine for slowing down guessing and email spam. Put the
// same limits in the Vercel Firewall too; this is the floor when it is not set.
import { createHash } from "node:crypto";
import { BlobPreconditionFailedError } from "@vercel/blob";
import { blobStore } from "./blob.js";

const PREFIX = process.env.RATE_LIMIT_BLOB_PREFIX || "campervlc-ratelimit/";

/** Client IP as Vercel reports it. */
export function clientIp(req) {
  const h = req.headers || {};
  const raw = h["x-vercel-forwarded-for"] || h["x-real-ip"] || h["x-forwarded-for"] || "";
  return String(raw).split(",")[0].trim() || "unknown";
}

/**
 * Counts one hit for `key` in the current window.
 * @returns {Promise<boolean>} true when the request may go on.
 */
export async function hit(key, { limit, windowMs, now = Date.now(), store = blobStore }) {
  const window = Math.floor(now / windowMs);
  const id = createHash("sha256").update(`${key}|${window}`).digest("hex").slice(0, 40);
  const path = `${PREFIX}${id}.json`;
  try {
    const read = await store.readJson(path);
    const count = Number(read?.data?.count) || 0;
    if (count >= limit) return false;
    const body = { count: count + 1, until: (window + 1) * windowMs };
    await store.put(path, body, read ? { ifMatch: read.etag } : {});
    return true;
  } catch (err) {
    if (err instanceof BlobPreconditionFailedError) return true; // a parallel hit wrote first
    // The limiter must never take the site down: let the request through.
    console.error("rate-limit: counter unavailable -", err.message);
    return true;
  }
}

/** In-memory version for tests. */
export function createMemoryLimiter() {
  const counts = new Map();
  return async (key, { limit, windowMs, now = Date.now() }) => {
    const k = `${key}|${Math.floor(now / windowMs)}`;
    const n = counts.get(k) || 0;
    if (n >= limit) return false;
    counts.set(k, n + 1);
    return true;
  };
}
