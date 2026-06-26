import { createServerFn } from "@tanstack/react-start";

const ICAL_URL = process.env.YESCAPA_ICS_URL;
if (!ICAL_URL) throw new Error("Missing required environment variable: YESCAPA_ICS_URL");

function toIsoDay(yyyymmdd: string): string {
  // "20260704" -> "2026-07-04"
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function parseIcsDate(value: string): string | null {
  // Accepts "20260704" or "20260704T120000Z"
  const m = value.match(/^(\d{8})/);
  return m ? toIsoDay(m[1]) : null;
}

function isAllDay(line: string): boolean {
  // "DTSTART;VALUE=DATE:20240620" vs "DTSTART;TZID=Europe/Madrid:20241021T140000"
  return /VALUE=DATE(?!-TIME)/i.test(line) || !/T\d{6}/.test(line);
}

function parseIcs(text: string): string[] {
  // Unfold lines (RFC 5545): continuation lines start with space/tab
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);

  const dates = new Set<string>();
  let inEvent = false;
  let start: string | null = null;
  let end: string | null = null;
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
        // For all-day events (VALUE=DATE) DTEND is exclusive — subtract 1.
        // For timed events (DTEND has a time component, e.g. return at 20:00)
        // the end day IS occupied — keep as-is.
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
  return Array.from(dates).sort();
}

export const fetchYescapaBookedDates = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ dates: string[]; error?: string }> => {
    try {
      const res = await fetch(ICAL_URL, {
        headers: { Accept: "text/calendar, text/plain, */*" },
      });
      if (!res.ok) {
        return { dates: [], error: `HTTP ${res.status}` };
      }
      const text = await res.text();
      return { dates: parseIcs(text) };
    } catch (e) {
      return { dates: [], error: e instanceof Error ? e.message : "fetch failed" };
    }
  },
);
