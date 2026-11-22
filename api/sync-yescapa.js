import { blobStore } from "./_lib/blob.js";
import { yescapaFeedUrl } from "./_lib/vehicles.js";
import { DEFAULT_VEHICLE_ID, activeVehicles } from "../shared/vehicles.js";

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

async function fetchYescapaDates(vehicleId) {
  const url = yescapaFeedUrl(vehicleId);
  if (!url) throw new Error(`Yescapa feed of ${vehicleId} not set`);

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
  // Cron only: Vercel Cron sends "Authorization: Bearer $CRON_SECRET". Without
  // the secret configured the endpoint stays closed (it fetches Yescapa and
  // writes to Blob, which nobody outside should be able to trigger).
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers["authorization"] !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // One cache per camper; vehicle 1 keeps its old file name.
    const synced = {};
    for (const v of activeVehicles()) {
      const dates = await fetchYescapaDates(v.id);
      const name = v.id === DEFAULT_VEHICLE_ID ? "campervlc-yescapa-cache.json" : `campervlc-yescapa-cache-${v.id}.json`;
      await blobStore.put(name, { vehicleId: v.id, dates, updatedAt: new Date().toISOString() });
      synced[v.id] = dates.length;
    }
    console.log("Yescapa sync:", JSON.stringify(synced));
    return res.status(200).json({ synced: synced[DEFAULT_VEHICLE_ID] ?? 0, vehicles: synced });
  } catch (err) {
    console.error("Yescapa sync error:", err);
    return res.status(500).json({ error: "sync_failed" });
  }
}
