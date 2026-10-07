/**
 * Calendar arithmetic in the business time zone. Vercel functions run in UTC
 * but pickups happen in Valencia, so "days until pickup" must be counted in
 * Madrid time. Intl does the DST work; no time zone library is needed.
 */
import { differenceInCalendarDays, parseIsoDate } from "./pricing.js";

export const BUSINESS_TIME_ZONE = "Europe/Madrid";

function zoneOffsetMs(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** "2026-10-07" + "10:00" in Madrid → epoch ms. */
export function zonedDateTimeToUtcMs(dateIso, time, timeZone = BUSINESS_TIME_ZONE) {
  const [y, m, d] = dateIso.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  let result = naive - zoneOffsetMs(naive, timeZone);
  // Second pass settles DST-transition days.
  result = naive - zoneOffsetMs(result, timeZone);
  return result;
}

/** Calendar date in Madrid for an instant, as "yyyy-MM-dd". */
export function todayInZone(nowMs, timeZone = BUSINESS_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(nowMs));
}

/** Whole calendar days from today (Madrid) to `dateIso`. */
export function daysUntil(dateIso, nowMs) {
  return differenceInCalendarDays(parseIsoDate(dateIso), parseIsoDate(todayInZone(nowMs)));
}

export function hoursUntil(dateIso, time, nowMs) {
  return (zonedDateTimeToUtcMs(dateIso, time) - nowMs) / 3_600_000;
}
