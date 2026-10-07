// Minimum notice for a new booking: the pickup must be at least this many
// hours away (Madrid time). Used by the calendar and by api/create-checkout.js.
import { hoursUntil } from "./dates.js";

export const MIN_NOTICE_HOURS = 24;

/** True when a pickup on `startIso` at `pickupTime` is closer than the notice allows. */
export function startTooSoon(startIso, pickupTime, nowMs = Date.now()) {
  return hoursUntil(startIso, pickupTime, nowMs) < MIN_NOTICE_HOURS;
}
