// Days already taken by bookings made on this site (the Yescapa feed is read
// separately by the calendar). Dates only, no personal data, so it is public.
import { createBlobStore } from "./_lib/store.js";
import { occupiedDays } from "../shared/booking-changes.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const bookings = await createBlobStore().listBookings();
    const dates = new Set();
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      for (const day of occupiedDays(b.startDate, b.endDate)) dates.add(day);
    }
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({ dates: [...dates].sort() });
  } catch (err) {
    console.error("availability failed -", err.message);
    return res.status(500).json({ dates: [], error: "unavailable" });
  }
}
