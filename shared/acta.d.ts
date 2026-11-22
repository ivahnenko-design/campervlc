// Hand-written types for ./acta.js (plain ESM shared with api/).
// Keep in sync with the exports there.

export type ActaKind = "checkin" | "checkout";
export type DamageType = "dent" | "scratch" | "crack" | "missing";
export type KmPlan = "100" | "200" | "unlimited";

export interface ChecklistItem {
  key: string;
  group: "estado" | "equipo";
  es: string;
  ru: string;
}

export interface DamageMark {
  id: string;
  x: number;
  y: number;
  type: DamageType;
  note: string;
}

export interface ActaLike {
  datetime?: string | null;
  odometerKm?: number | null;
  fuel?: number | null;
  checklist?: Record<string, boolean | null>;
  marks?: DamageMark[];
  petsOnBoard?: boolean | null;
  smell?: boolean | null;
  kmPlan?: KmPlan;
  extras?: string[];
}

export interface Comparison {
  nights: number;
  kmPlan: KmPlan;
  kmIn: number | null;
  kmOut: number | null;
  kmDriven: number | null;
  kmIncluded: number | null;
  kmExtra: number;
  fuelIn: number;
  fuelOut: number | null;
  fuelDiff: number | null;
  failedItems: string[];
  newMarks: DamageMark[];
  lateMinutes: number | null;
  smell: boolean;
  petsWithoutOption: boolean;
}

export interface ChargeItem {
  key: string;
  es: string;
  ru: string;
  amount: number | null;
  max?: number;
}

export const ACTA_KINDS: readonly ActaKind[];
export const CHECKLIST: readonly ChecklistItem[];
export const CHECKLIST_KEYS: readonly string[];
export const DAMAGE_TYPES: Record<DamageType, { symbol: string; es: string; ru: string }>;
export const DAMAGE_TYPE_KEYS: readonly DamageType[];
export const EXTRA_LABELS: Record<string, { es: string; ru: string }>;
export const TARIFFS: Record<string, number>;

export function fuelLabel(eighths: number | null | undefined, lang?: string): string;
export function kmPlanFromExtras(extraIds: unknown): KmPlan;
export function rentalNights(startDate: string, endDate: string): number;
export function kmAllowance(nights: number, plan?: KmPlan): number | null;
export function wallMinutes(value: unknown): number | null;
export function newDamageMarks(checkinMarks?: DamageMark[], checkoutMarks?: DamageMark[]): DamageMark[];
export function compareActas(
  checkin: ActaLike | null,
  checkout: ActaLike,
  rental?: { startDate?: string; endDate?: string; returnTime?: string; kmPlan?: KmPlan; extras?: string[] },
): Comparison;
export function dayRateFor(endDate: string): number | null;
export function suggestedCharges(
  cmp: Comparison,
  opts?: { dayRate?: number | null },
): { items: ChargeItem[]; total: number; open: boolean };
