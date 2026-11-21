// Automatic side of the contract flow:
//  - a site booking paid through Stripe gets its contract and signing link
//    right away (no admin step);
//  - a daily job reminds guests who have not signed yet (7 and 2 days before
//    pickup) and tells the owner which pickups in the next 2 days are unsigned.
import { createContract, reissueToken, LANGS } from "./contracts.js";

const DAY = 86_400_000;

/** Today's date in Valencia, as YYYY-MM-DD. */
export function madridToday(nowMs = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(nowMs));
}

/** Whole days from `today` to `date` (both YYYY-MM-DD). */
export function daysBetween(today, date) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY);
}

export function contractInputFromBooking(booking) {
  return {
    guestName: [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" "),
    email: booking.guestEmail,
    phone: booking.guestPhone || "",
    startDate: booking.startDate,
    endDate: booking.endDate,
    pickupTime: booking.pickupTime || undefined,
    returnTime: booking.returnTime || undefined,
    source: "web",
    language: LANGS.includes(booking.language) ? booking.language : "es",
    priceTotal: Number.isFinite(booking.totalWithIva) ? booking.totalWithIva : null,
    bookingRef: booking.bookingRef || "",
  };
}

/**
 * Creates and sends the contract of a new site booking, unless one already
 * exists for the same booking reference (e.g. the owner made it by hand).
 * Returns { id, created } or { skipped: reason }.
 */
export async function autoCreateContract(booking, { store, provider, now = Date.now() }) {
  if (!booking?.bookingRef || !booking.guestEmail) return { skipped: "no_ref_or_email" };
  const ref = booking.bookingRef.trim().toUpperCase();
  const existing = (await store.list()).find(
    (c) => c.status !== "cancelled" && String(c.bookingRef || "").trim().toUpperCase() === ref,
  );
  if (existing) return { skipped: "exists", id: existing.id };
  const { contract, token } = createContract(contractInputFromBooking(booking), { now, provider: provider.name });
  const withNote = { ...contract, audit: [...contract.audit, { t: now, ev: "auto_from_booking" }] };
  await store.save(withNote);
  await provider.invite(withNote, token);
  return { id: withNote.id, created: true };
}

export const REMINDER_DAYS = [7, 2];

/**
 * Daily: a new link + reminder for unsigned contracts whose pickup is exactly
 * 7 or 2 days away, and one owner email listing unsigned pickups within 2 days.
 */
export async function runContractReminders({ store, provider, sendOwner, nowMs = Date.now() }) {
  const today = madridToday(nowMs);
  const pending = (await store.list()).filter((c) => c.status === "pending");
  const reminded = [];
  const soon = [];
  for (const c of pending) {
    const days = daysBetween(today, c.startDate);
    if (days >= 0 && days <= 2) soon.push({ ...c, days });
    if (!REMINDER_DAYS.includes(days)) continue;
    if ((c.audit || []).some((a) => a.ev === `reminder_${days}`)) continue;
    const found = await store.get(c.id);
    if (!found || found.contract.status !== "pending") continue;
    const { contract, token } = reissueToken(found.contract, { now: nowMs });
    const marked = { ...contract, audit: [...contract.audit, { t: nowMs, ev: `reminder_${days}` }] };
    await store.save(marked, { etag: found.etag });
    try {
      await provider.invite(marked, token, { reminder: true });
      reminded.push(c.id);
    } catch (err) {
      console.error("contract reminder failed for", c.id, "-", err.message);
    }
  }
  if (soon.length && sendOwner) {
    await sendOwner(soon.sort((a, b) => (a.startDate < b.startDate ? -1 : 1)));
  }
  return { today, pending: pending.length, reminded, unsignedSoon: soon.map((c) => c.id) };
}
