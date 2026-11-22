// The campers as the public site shows them. Facts shared with the server
// (city, plate, model, contract...) live in shared/vehicles.js; this file only
// adds what the page needs: photos, interior tiles, price label.
import { VEHICLES, type Vehicle } from "../../shared/vehicles.js";
import { GALLERY, type GalleryPhoto } from "./gallery";

export interface Camper {
  id: string;
  name: string;
  location: string;
  capacity: number;
  image: string;
  /** Photos for the viewer (Lightbox). */
  photos: GalleryPhoto[];
  /** Three interior tiles under the big photo; `at` = index of the same photo in `photos`. */
  tiles: { src: string; labelKey: "kitchen" | "bedroom" | "outside"; at: number }[];
  /**
   * Optional i18n prefix for this camper's own texts (headline, specs,
   * equipment): `${textKey}.showcase.headline` etc. Missing keys fall back to
   * the "fleet.*" texts of vehicle 1.
   */
  textKey?: string;
  priceFrom: number;
  available: boolean;
  vehicle: Vehicle;
}

/** Page-only data per vehicle id. Add an entry when a new camper gets photos. */
const UI: Record<string, Omit<Camper, "id" | "name" | "location" | "capacity" | "vehicle">> = {
  "vlc-yearling": {
    image: "https://yescapa.twic.pics/rental/picture/b21e5a9f-a4d1-446d-b92c-c86a11a0e037_1728652498",
    photos: GALLERY,
    tiles: [
      { src: "/images/tiles/kitchen.jpg", labelKey: "kitchen", at: 16 },
      { src: "/images/tiles/bedroom.jpg", labelKey: "bedroom", at: 11 },
      { src: "/images/tiles/outside.jpg", labelKey: "outside", at: 8 },
    ],
    priceFrom: 90,
    available: true,
  },
  // "alc-partner": {
  //   image: "/images/alicante/cover.jpg",
  //   photos: GALLERY_ALC,            // e.g. src/data/gallery-alicante.ts, files in public/images/alicante/
  //   tiles: [ { src: "/images/alicante/tiles/kitchen.jpg", labelKey: "kitchen", at: 0 }, ... ],
  //   textKey: "fleetAlc",            // texts in src/i18n/translations/*.json under "fleetAlc"
  //   priceFrom: 90,
  //   available: true,
  // },
};

function toCamper(v: Vehicle): Camper | null {
  const ui = UI[v.id];
  if (!ui) return null;
  return { id: v.id, name: v.name, location: v.city.es, capacity: v.capacity, vehicle: v, ...ui };
}

/** Active campers that have page data, vehicle 1 first. */
export const FLEET: Camper[] = VEHICLES.filter((v) => v.active)
  .map(toCamper)
  .filter((c): c is Camper => !!c);

// Extras and their prices live in shared/pricing.js so api/create-checkout.js
// prices them from the same table the calculator shows.
export { EXTRAS, EXCLUSIVE_EXTRA_GROUPS } from "../../shared/pricing.js";
export type { ExtraId, ExtraItem } from "../../shared/pricing.js";
