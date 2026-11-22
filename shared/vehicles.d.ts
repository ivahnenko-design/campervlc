// Hand-written types for ./vehicles.js (plain ESM shared with api/).
// Keep in sync with the exports there.

export type Lang = "es" | "en" | "de" | "it" | "nl" | "ru" | "uk";

export interface Vehicle {
  id: string;
  active: boolean;
  city: Record<Lang, string> & { slug: string };
  pickupAddress: string;
  coords: { lat: number; lng: number };
  /** Normalised: "1022MPG". Empty while unknown. */
  plate: string;
  /** As written on the car: "1022 MPG". */
  plateDisplay: string;
  brand: string;
  model: string;
  name: string;
  capacity: number;
  ownerKey: "owner" | "partner" | string;
  yescapaIcalEnv: string | null;
  contractPdfPath: string;
}

export const VEHICLES: Vehicle[];
export const DEFAULT_VEHICLE_ID: string;
export const OWNER_EMAIL_ENV: Record<string, string>;

export function getVehicle(id: string): Vehicle | null;
export function activeVehicles(): Vehicle[];
export function isActiveVehicleId(id: unknown): boolean;
export function defaultVehicle(): Vehicle;
export function vehicleOf(record: { vehicleId?: unknown } | null | undefined): string;
export function normalizePlate(value: unknown): string;
export function vehicleByPlate(plate: unknown): Vehicle | null;
export function vehicleByCity(slug: unknown): Vehicle | null;
export function cityName(vehicle: Vehicle | string, lang?: string): string;
export function vehicleLabel(vehicle: Vehicle | string): string;
