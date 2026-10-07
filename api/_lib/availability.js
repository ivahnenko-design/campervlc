// Dates the camper is taken: the Yescapa ICS feed plus this site's own
// bookings. Same parsing rules as src/lib/ical.functions.ts, which feeds the
// booking calendar, so the two never disagree about a day.
import { occupiedDays } from "../../shared/booking-changes.js";

// Same fallback the booking calendar uses (src/lib/ical.functions.ts).
const DEFAULT_ICS_URL =
  "https://www.yescapa.es/ical/xSqLp9AFgxkt4tuxKhsOkVE_dUttqO8l-4__qnei4Ki3kkmlB7plh-YL29aXUxqO/export/";

function toIsoDay(yyyymmdd) {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function addDaysIso(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseIcsDate(value) {
  const m = value.match(/^(\d{8})/);
  return m ? toIsoDay(m[1]) : null;
}

function isAllDay(line) {
  return /VALUE=DATE(?!-TIME)/i.test(line) || !/T\d{6}/.test(line);
}

export function parseIcs(text) {
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const dates = new Set();
  let inEvent = false;
  let start = null;
  let end = null;
  let endAllDay = false;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      start = null;
      end = null;
      endAllDay = false;
      continue;
    }
    if (line === "END:VEVENT") {
      if (start) {
        // All-day DTEND is exclusive; a timed DTEND (return at 20:00) occupies its day.
        const last = end ? (endAllDay ? addDaysIso(end, -1) : end) : start;
        let cursor = start;
        for (let i = 0; i < 366 && cursor <= last; i++) {
          dates.add(cursor);
          cursor = addDaysIso(cursor, 1);
        }
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;
    if (line.startsWith("DTSTART")) {
      const v = line.split(":")[1];
      if (v) start = parseIcsDate(v);
    } else if (line.startsWith("DTEND")) {
      const v = line.split(":")[1];
      if (v) {
        end = parseIcsDate(v);
        endAllDay = isAllDay(line);
      }
    }
  }
  return dates;
}

/**
 * @returns { dates: Set<string>, yescapaOk: boolean }
 * yescapaOk=false means the feed could not be read — callers must not approve
 * new dates on an incomplete calendar.
 */
export async function loadBlockedDates({ bookings, exceptBookingId, fetchImpl = fetch, env = process.env }) {
  const dates = new Set();
  for (const b of bookings) {
    if (b.id === exceptBookingId || b.status === "cancelled") continue;
    for (const day of occupiedDays(b.startDate, b.endDate)) dates.add(day);
  }

  let yescapaOk = false;
  try {
    const url = env.YESCAPA_ICS_URL || env.YESCAPA_ICAL_URL || DEFAULT_ICS_URL;
    const res = await fetchImpl(url, { headers: { Accept: "text/calendar, text/plain, */*" } });
    if (res.ok) {
      for (const day of parseIcs(await res.text())) dates.add(day);
      yescapaOk = true;
    } else {
      console.error("availability: Yescapa feed HTTP", res.status);
    }
  } catch (err) {
    console.error("availability: Yescapa feed failed -", err.message);
  }
  return { dates, yescapaOk };
}
