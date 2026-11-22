// Server side of the vehicle registry (shared/vehicles.js): owner addresses and
// Yescapa feeds come from environment variables, never from the shared file.
import { DEFAULT_VEHICLE_ID, OWNER_EMAIL_ENV, getVehicle } from "../../shared/vehicles.js";

// Vehicle 1's feed before the registry existed (same fallback as src/lib/ical.functions.ts).
const DEFAULT_ICS_URL =
  "https://www.yescapa.es/ical/xSqLp9AFgxkt4tuxKhsOkVE_dUttqO8l-4__qnei4Ki3kkmlB7plh-YL29aXUxqO/export/";

/**
 * iCal export URL of the camper's Yescapa listing, or null when the variable
 * named in the registry is not set. Vehicle 1 keeps its old fallbacks.
 */
export function yescapaFeedUrl(vehicleId = DEFAULT_VEHICLE_ID, env = process.env) {
  const v = getVehicle(vehicleId);
  if (!v) return null;
  const own = v.yescapaIcalEnv ? env[v.yescapaIcalEnv] : null;
  if (own) return own;
  if (v.id === DEFAULT_VEHICLE_ID) return env.YESCAPA_ICS_URL || env.YESCAPA_ICAL_URL || DEFAULT_ICS_URL;
  return null;
}

/**
 * Who gets a camper's owner emails (bookings, cancellations, changes, signed
 * contracts, Yescapa imports, unsigned-pickup reminders): ONLY that camper's
 * owner. Vehicle 1 belongs to the company owner, so it keeps exactly its
 * current recipient: `company`, the address the caller used before there were
 * several campers (OWNER_EMAIL for bookings, CONTRACT_OWNER_EMAIL for contracts).
 * When a partner's address is not configured, the company owner gets the email
 * instead so nothing is lost.
 * @returns {string[]}
 */
export function ownerRecipients(vehicleId, company, env = process.env) {
  const v = getVehicle(vehicleId) || getVehicle(DEFAULT_VEHICLE_ID);
  if (v.ownerKey !== "owner") {
    const envName = OWNER_EMAIL_ENV[v.ownerKey];
    const addr = envName ? String(env[envName] || "").trim() : "";
    if (addr) return [addr];
    console.warn(`vehicles: no owner email for ${v.id} (${envName || v.ownerKey} not set), sending to the company owner instead`);
  }
  return company ? [String(company).trim()] : [];
}

/** Resend `to` for one camper's owner (a single address, as before). */
export const ownerTo = (vehicleId, company, env = process.env) => ownerRecipients(vehicleId, company, env)[0] || company;
