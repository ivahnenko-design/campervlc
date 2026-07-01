import { put } from "@vercel/blob";

function parseIcsDate(str) {
  // Handles VALUE=DATE (YYYYMMDD) and datetime (YYYYMMDDTHHmmssZ)
  const s = str.split("T")[0];
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function expandRange(start, end) {
  const dates = [];
  let cur = start;
  while (cur < end) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }
  return dates;
}

async function fetchYescapaDates() {
  const url = process.env.YESCAPA_ICAL_URL || process.env.YESCAPA_ICS_URL;
  if (!url) throw new Error("YESCAPA_ICAL_URL not set");

  const res = await fetch(url, {
    headers: { "User-Agent": "CamperRetreatVLC/1.0" },
  });
  const text = await res.text();

  const dates = [];
  const lines = text.replace(/\r\n|\r/g, "\n").split("\n");
  let inEvent = false;
  let dtstart = null;
  let dtend = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") { inEvent = true; dtstart = null; dtend = null; continue; }
    if (line === "END:VEVENT" && inEvent) {
      if (dtstart && dtend) {
        const expanded = expandRange(dtstart, dtend);
        for (const d of expanded) dates.push(d);
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;
    if (line.startsWith("DTSTART")) dtstart = parseIcsDate(line.split(":")[1]);
    if (line.startsWith("DTEND")) dtend = parseIcsDate(line.split(":")[1]);
  }

  return [...new Set(dates)];
}

export default async function handler(req, res) {
  // Vercel Cron passes Authorization header with CRON_SECRET
  const authHeader = req.headers["authorization"];
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const dates = await fetchYescapaDates();
    await put(
      "campervlc-yescapa-cache.json",
      JSON.stringify({ dates, updatedAt: new Date().toISOString() }),
      { access: "public", contentType: "application/json", addRandomSuffix: false }
    );

    console.log(`Yescapa sync: ${dates.length} dates cached`);
    return res.status(200).json({ synced: dates.length });
  } catch (err) {
    console.error("Yescapa sync error:", err);
    return res.status(500).json({ error: err.message });
  }
}
