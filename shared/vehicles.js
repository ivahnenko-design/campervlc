// The campers Camper Retreat S.L. rents out: one registry for the server (api/)
// and the browser (src/). Prices, seasons, minimum nights and extras are the
// same for every camper and stay in ./pricing.js.
//
// Adding a camper = filling in its entry here (+ photos and texts in
// src/data/fleet.ts) and setting `active: true`. While only one camper is
// active the public site looks exactly as with a single camper (no city switch).
//
// No secrets and no email addresses here: this file ends up in the browser.
// `ownerKey` and `yescapaIcalEnv` only NAME environment variables that the
// server reads (see api/_lib/vehicles.js).

/** @typedef {"es"|"en"|"de"|"it"|"nl"|"ru"|"uk"} Lang */

export const VEHICLES = [
  {
    id: "vlc-yearling",
    active: true,
    city: {
      slug: "valencia",
      es: "Valencia",
      en: "Valencia",
      de: "Valencia",
      it: "Valencia",
      nl: "Valencia",
      ru: "Валенсия",
      uk: "Валенсія",
    },
    pickupAddress: "Carrer de Nino Bravo, 3, 46013 Valencia",
    coords: { lat: 39.4570837, lng: -0.3583681 },
    plate: "1022MPG",
    plateDisplay: "1022 MPG",
    brand: "McLouis",
    model: "Yearling 89G",
    name: "McLouis Yearling 89G",
    capacity: 5,
    // Who gets this camper's bookings, cancellations and signed contracts.
    // "owner" is the company owner himself (OWNER_EMAIL / CONTRACT_OWNER_EMAIL).
    ownerKey: "owner",
    // Env var with the iCal export URL of this camper's Yescapa listing.
    yescapaIcalEnv: "YESCAPA_ICS_URL",
    // Blank rental contract (public/...) the guest signs for this camper.
    contractPdfPath: "/contracts/contrato-v6.pdf",
  },
  {
    // Placeholder for the partner's camper, rented from Alicante. Fill in the
    // data (plate, model, address...), add photos in src/data/fleet.ts and set
    // active: true. Until then it is invisible everywhere.
    id: "alc-partner",
    active: false,
    city: {
      slug: "alicante",
      es: "Alicante",
      en: "Alicante",
      de: "Alicante",
      it: "Alicante",
      nl: "Alicante",
      ru: "Аликанте",
      uk: "Аліканте",
    },
    pickupAddress: "",
    coords: { lat: 38.3452, lng: -0.481 },
    plate: "",
    plateDisplay: "",
    brand: "Knaus",
    model: "Boxlife 600 DQ Platinum Selection",
    name: "Knaus Boxlife 600 DQ",
    capacity: 4,
    // Announced on the home page ("coming soon") while not bookable yet.
    comingSoon: { from: "2026-12" },
    ownerKey: "partner",
    yescapaIcalEnv: "YESCAPA_ICS_URL_ALC",
    contractPdfPath: "/contracts/contrato-v6.pdf",
  },
];

/** Vehicle 1. Records saved before there was a second camper belong to it. */
export const DEFAULT_VEHICLE_ID = "vlc-yearling";

/** Env var holding the address of each camper owner (server only). */
export const OWNER_EMAIL_ENV = { owner: "OWNER_EMAIL", partner: "PARTNER_EMAIL" };

const byId = new Map(VEHICLES.map((v) => [v.id, v]));

export function getVehicle(id) {
  return byId.get(id) || null;
}

/** Announced campers: not bookable yet, shown as "coming soon". */
export function comingSoonVehicles() {
  return VEHICLES.filter((v) => !v.active && v.comingSoon);
}

export function activeVehicles() {
  return VEHICLES.filter((v) => v.active);
}

export function isActiveVehicleId(id) {
  return typeof id === "string" && !!byId.get(id)?.active;
}

export function defaultVehicle() {
  return byId.get(DEFAULT_VEHICLE_ID);
}

/**
 * The camper a booking, hold, contract or import belongs to. Records without
 * (or with an unknown) vehicleId were made when there was one camper: vehicle 1.
 */
export function vehicleOf(record) {
  const id = record && typeof record === "object" ? record.vehicleId : undefined;
  return typeof id === "string" && byId.has(id) ? id : DEFAULT_VEHICLE_ID;
}

/** "1022 mpg", "1022-MPG"... -> "1022MPG" (letters upper-case, no spaces or dashes). */
export function normalizePlate(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");
}

/** The camper with this number plate (any spelling), or null. */
export function vehicleByPlate(plate) {
  const p = normalizePlate(plate);
  if (!p) return null;
  return VEHICLES.find((v) => v.plate && normalizePlate(v.plate) === p) || null;
}

/** Active camper for a city slug ("alicante"), or null. */
export function vehicleByCity(slug) {
  const s = String(slug ?? "").trim().toLowerCase();
  return activeVehicles().find((v) => v.city.slug === s) || null;
}

/** City name in a language (falls back to Spanish). */
export function cityName(vehicle, lang) {
  const v = typeof vehicle === "string" ? getVehicle(vehicle) : vehicle;
  if (!v) return "";
  return v.city[String(lang || "").slice(0, 2)] || v.city.es;
}

/** "McLouis Yearling 89G · 1022 MPG" for emails and admin lists. */
export function vehicleLabel(vehicle) {
  const v = typeof vehicle === "string" ? getVehicle(vehicle) : vehicle;
  if (!v) return "";
  return [v.name || v.city.es, v.plateDisplay].filter(Boolean).join(" · ");
}
