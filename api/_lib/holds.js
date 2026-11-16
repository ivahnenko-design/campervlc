// Dates held by a Stripe Checkout that is open but not paid yet. Without a
// hold, two guests could open checkouts for the same days and both pay. A hold
// lives as long as the Checkout session (Stripe's minimum, 30 minutes) and is
// removed by the webhook once the booking is saved.
import { createHash } from "node:crypto";
import { del, list } from "@vercel/blob";
import { blobStore } from "./blob.js";
import { occupiedDays } from "../../shared/booking-changes.js";

export const HOLDS_PREFIX = process.env.HOLDS_BLOB_PREFIX || "campervlc-holds/";
/** Stripe needs expires_at at least 30 minutes ahead; one minute of slack. */
export const CHECKOUT_TTL_MS = 31 * 60_000;

const pathFor = (sessionId) => `${HOLDS_PREFIX}${sessionId}.json`;
/** Who opened the checkout, without storing the address itself. */
export const holdOwner = (email) =>
  createHash("sha256").update(`hold:${String(email || "").trim().toLowerCase()}`).digest("hex").slice(0, 24);

export async function saveHold(sessionId, { startDate, endDate, expiresAt, email }) {
  await blobStore.put(pathFor(sessionId), { sessionId, startDate, endDate, expiresAt, owner: holdOwner(email) });
}

/**
 * Days held by checkouts still open at `now`. The guest's own holds (same
 * email: they closed the payment page and try again) do not block them.
 * Expired holds are cleaned up on the way.
 */
export async function activeHoldDays(now, { exceptSessionId = null, exceptEmail = null } = {}) {
  const mine = exceptEmail ? holdOwner(exceptEmail) : null;
  const days = new Set();
  const expired = [];
  let cursor;
  do {
    const page = await list({ prefix: HOLDS_PREFIX, cursor });
    for (const b of page.blobs) {
      const hold = (await blobStore.readJson(b.pathname))?.data;
      if (!hold) continue;
      if (hold.expiresAt <= now) {
        expired.push(b.url);
        continue;
      }
      if (hold.sessionId === exceptSessionId || (mine && hold.owner === mine)) continue;
      for (const day of occupiedDays(hold.startDate, hold.endDate)) days.add(day);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  if (expired.length) await del(expired).catch((err) => console.warn("holds: cleanup failed -", err.message));
  return days;
}

export async function releaseHold(sessionId) {
  const { blobs } = await list({ prefix: pathFor(sessionId) });
  if (blobs.length) await del(blobs.map((b) => b.url));
}
