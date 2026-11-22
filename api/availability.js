// Days already taken by bookings made on this site (the Yescapa feed is read
// separately by the calendar). Dates only, no personal data, so it is public.
// ?vehicle=<id> picks the camper; without it, vehicle 1 (as before).
import { createBlobStore } from "./_lib/store.js";
import { bookedDays } from "./_lib/availability.js";
import { DEFAULT_VEHICLE_ID, isActiveVehicleId } from "../shared/vehicles.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const vehicleId = req.query?.vehicle || DEFAULT_VEHICLE_ID;
  if (!isActiveVehicleId(vehicleId)) return res.status(400).json({ dates: [], error: "unknown_vehicle" });
  try {
    const bookings = await createBlobStore().listBookings();
    const dates = bookedDays(bookings, { vehicleId });
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
    return res.status(200).json({ dates: [...dates].sort() });
  } catch (err) {
    console.error("availability failed -", err.message);
    return res.status(500).json({ dates: [], error: "unavailable" });
  }
}
