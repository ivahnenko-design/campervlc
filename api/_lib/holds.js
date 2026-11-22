// Dates held by a Stripe Checkout that is open but not paid yet. Without a
// hold, two guests could open checkouts for the same days and both pay. A hold
// lives as long as the Checkout session (Stripe's minimum, 30 minutes) and is
// removed by the webhook once the booking is saved.
import { createHash } from "node:crypto";
import { del, list } from "@vercel/blob";
import { blobStore } from "./blob.js";
import { occupiedDays } from "../../shared/booking-changes.js";
import { DEFAULT_VEHICLE_ID, vehicleOf } from "../../shared/vehicles.js";

export const HOLDS_PREFIX = process.env.HOLDS_BLOB_PREFIX || "campervlc-holds/";
/** Stripe needs expires_at at least 30 minutes ahead; one minute of slack. */
export const CHECKOUT_TTL_MS = 31 * 60_000;

const pathFor = (sessionId) => `${HOLDS_PREFIX}${sessionId}.json`;
/** Who opened the checkout, without storing the address itself. */
export const holdOwner = (email) =>
  createHash("sha256").update(`hold:${String(email || "").trim().toLowerCase()}`).digest("hex").slice(0, 24);

export async function saveHold(sessionId, { startDate, endDate, expiresAt, email, vehicleId = DEFAULT_VEHICLE_ID }) {
  await blobStore.put(pathFor(sessionId), { sessionId, vehicleId, startDate, endDate, expiresAt, owner: holdOwner(email) });
}

/**
 * Days blocked by these holds for one camper at `now`: expired holds, holds of
 * other campers (holds without vehicleId are vehicle 1's), the given checkout
 * session and the guest's own holds (same email: they closed the payment page
 * and try again) do not count.
 */
export function holdDays(holds, now, { vehicleId = DEFAULT_VEHICLE_ID, exceptSessionId = null, exceptEmail = null } = {}) {
  const mine = exceptEmail ? holdOwner(exceptEmail) : null;
  const days = new Set();
  for (const hold of holds) {
    if (!hold || hold.expiresAt <= now) continue;
    if (vehicleOf(hold) !== vehicleId) continue;
    if (hold.sessionId === exceptSessionId || (mine && hold.owner === mine)) continue;
    for (const day of occupiedDays(hold.startDate, hold.endDate)) days.add(day);
  }
  return days;
}

/** Days held by checkouts of this camper still open at `now`. Expired holds are cleaned up on the way. */
export async function activeHoldDays(now, { vehicleId = DEFAULT_VEHICLE_ID, exceptSessionId = null, exceptEmail = null } = {}) {
  const holds = [];
  const expired = [];
  let cursor;
  do {
    const page = await list({ prefix: HOLDS_PREFIX, cursor });
    for (const b of page.blobs) {
      const hold = (await blobStore.readJson(b.pathname))?.data;
      if (!hold) continue;
      if (hold.expiresAt <= now) expired.push(b.url);
      else holds.push(hold);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  if (expired.length) await del(expired).catch((err) => console.warn("holds: cleanup failed -", err.message));
  return holdDays(holds, now, { vehicleId, exceptSessionId, exceptEmail });
}

export async function releaseHold(sessionId) {
  const { blobs } = await list({ prefix: pathFor(sessionId) });
  if (blobs.length) await del(blobs.map((b) => b.url));
}
