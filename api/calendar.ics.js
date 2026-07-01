import { list } from "@vercel/blob";

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
        `UID:${b.id}@campervlc.com`,
        `DTSTAMP:${now}Z`,
        `DTSTART;VALUE=DATE:${toIcalDate(b.startDate)}`,
        `DTEND;VALUE=DATE:${endStr}`,
        `SUMMARY:Booked – ${b.guestFirstName} ${b.guestLastName}`,
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

  try {
    const { blobs } = await list({ prefix: "campervlc-bookings/" });
    const bookings = await Promise.all(
      blobs.map(async (blob) => {
        const r = await fetch(blob.url);
        return r.json();
      })
    );

    const ical = generateIcal(bookings);

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="campervlc-bookings.ics"'
    );
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).send(ical);
  } catch (err) {
    console.error("calendar.ics error:", err);
    return res.status(500).json({ error: err.message });
  }
}
