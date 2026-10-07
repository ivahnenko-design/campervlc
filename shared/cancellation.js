/**
 * Cancellation by the guest, clause 4.1 of the rental conditions
 * (content/condiciones-web-es.md). One scale, shared by the automatic
 * cancellation endpoint and by partial cancellations in booking management.
 */
import { daysUntil } from "./dates.js";

/**
 * Share of the price the company retains, by whole days from today to the
 * ORIGINAL pickup date. First tier whose minDays the booking reaches wins.
 *   more than 30 days → 10% (management costs)
 *   30 to 15 days     → 30%
 *   14 to 7 days      → 50%
 *   under 7 days / no-show → 100%
 */
export const RETENTION_SCALE = [
  { minDays: 31, pct: 10 },
  { minDays: 15, pct: 30 },
  { minDays: 7, pct: 50 },
  { minDays: -Infinity, pct: 100 },
];

/** Free cancellation: within this many hours of booking... */
export const FREE_CANCELLATION_HOURS = 24;
/** ...as long as pickup is MORE than this many days away at that moment. */
export const FREE_CANCELLATION_MIN_DAYS = 7;

export function retentionPct(daysToPickup) {
  for (const tier of RETENTION_SCALE) {
    if (daysToPickup >= tier.minDays) return tier.pct;
  }
  return 100;
}

/**
 * What a full cancellation costs the guest right now.
 *
 * The retention is a share of the rental price (booking.totalWithIva). Money
 * from an earlier partial cancellation (booking.retainedTotal) is already
 * kept, so only the rest of the price is scaled. The refund can never exceed
 * what was actually paid; any retention beyond that (a 50% deposit booking
 * cancelled with 100% retention) is reported as `unpaidRetention` and is NOT
 * charged automatically.
 */
export function cancellationQuote(booking, nowMs) {
  const total = Number(booking.totalWithIva) || 0;
  const paid = Number(booking.amountPaid ?? booking.depositAmount) || 0;
  const alreadyRetained = Number(booking.retainedTotal) || 0;

  const hoursSinceBooking = (nowMs - Date.parse(booking.createdAt)) / 3_600_000;
  const daysToPickup = daysUntil(booking.startDate, nowMs);

  const free = hoursSinceBooking <= FREE_CANCELLATION_HOURS && daysToPickup > FREE_CANCELLATION_MIN_DAYS;
  const pct = free ? 0 : retentionPct(daysToPickup);
  const retained = free ? 0 : Math.round((total - alreadyRetained) * (pct / 100)) + alreadyRetained;

  return {
    free,
    retentionPct: pct,
    daysToPickup,
    total,
    paid,
    retained,
    refund: Math.max(0, paid - retained),
    unpaidRetention: Math.max(0, retained - paid),
  };
}
