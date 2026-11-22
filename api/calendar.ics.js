import { blobStore, list } from "./_lib/blob.js";
import { BOOKINGS_PREFIX } from "./_lib/prefix.js";
import { calendarKeyOk } from "./_lib/calendar-key.js";
import { createHash } from "node:crypto";
import { DEFAULT_VEHICLE_ID, getVehicle, vehicleOf } from "../shared/vehicles.js";

function toIcalDate(dateStr) {
  // dateStr is "YYYY-MM-DD"
  return dateStr.replace(/-/g, "");
}

function generateIcal(bookings) {
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const events = bookings
    .map((b) => {
      // DTEND is exclusive (checkout day)
      const endParts = b.endDate.split("-").map(Number);
      const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2] + 1);
      const endStr = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, "0")}${String(endDate.getDate()).padStart(2, "0")}`;

      return [
        "BEGIN:VEVENT",
        // The UID is a hash: the booking id is the Stripe session id, which must
        // not travel in a calendar feed.
        `UID:${createHash("sha256").update(String(b.id)).digest("hex").slice(0, 24)}@campervlc.com`,
        `DTSTAMP:${now}Z`,
        `DTSTART;VALUE=DATE:${toIcalDate(b.startDate)}`,
        `DTEND;VALUE=DATE:${endStr}`,
        // No guest names: the feed leaves the site (Yescapa, calendar apps).
        `SUMMARY:Booked`,
        `STATUS:CONFIRMED`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Camper Retreat VLC//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }
  if (!calendarKeyOk(req.query?.key)) {
    return res.status(404).end();
  }
  // One feed per camper (one Yescapa listing each): ?vehicle=<id>, vehicle 1 without it.
  const vehicleId = typeof req.query?.vehicle === "string" && req.query.vehicle ? req.query.vehicle : DEFAULT_VEHICLE_ID;
  if (!getVehicle(vehicleId)) return res.status(404).end();

  try {
    const { blobs } = await list({ prefix: BOOKINGS_PREFIX });
    const allBookings = (
      await Promise.all(blobs.map(async (blob) => (await blobStore.readJson(blob.pathname))?.data))
    ).filter(Boolean);
    const bookings = allBookings.filter((b) => b.status !== "cancelled" && vehicleOf(b) === vehicleId);

    const ical = generateIcal(bookings);

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="campervlc-bookings${vehicleId === DEFAULT_VEHICLE_ID ? "" : `-${vehicleId}`}.ics"`
    );
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    return res.status(200).send(ical);
  } catch (err) {
    console.error("calendar.ics error:", err);
    return res.status(500).end();
  }
}
