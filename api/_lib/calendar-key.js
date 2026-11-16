// Secret key of the bookings calendar feed (/api/calendar.ics?key=...). The
// feed is for Yescapa and the owner's calendar app, not for the public: it
// would otherwise list every booking's dates. CALENDAR_FEED_KEY wins when set;
// without it the key is derived from a secret the site already has, so the
// feed keeps working and the owner reads the full URL in /admin/contratos.
import { createHmac, timingSafeEqual } from "node:crypto";

export function calendarFeedKey(env = process.env) {
  if (env.CALENDAR_FEED_KEY) return env.CALENDAR_FEED_KEY;
  const base = env.MANAGE_BOOKING_SECRET || env.ADMIN_TOKEN;
  if (!base) return null;
  return createHmac("sha256", base).update("calendar-feed-v1").digest("base64url").slice(0, 32);
}

export function calendarKeyOk(given, env = process.env) {
  const want = calendarFeedKey(env);
  if (!want || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function calendarFeedUrl(site, env = process.env) {
  const key = calendarFeedKey(env);
  return key ? `${site}/api/calendar.ics?key=${encodeURIComponent(key)}` : null;
}
