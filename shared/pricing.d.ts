// Hand-written types for ./pricing.js (plain ESM shared with api/).
// Keep in sync with the exports there.

export const IVA_RATE: number;
export function withIva(amount: number): number;

export type Season = "low" | "mid" | "high" | "super";
export const PRICES: Record<Season, number>;
export const MIN_NIGHTS: Record<Season, number>;
export const BOOKING_MAX_DATE: Date;

export function getSeason(date: Date): Season;
export function getPriceForDate(date: Date): number;
export function getMinNights(date: Date): number;
export function getMinNightsForRange(start: Date): number;

export function parseIsoDate(value: unknown): Date | null;
export function differenceInCalendarDays(end: Date, start: Date): number;

export const DEFAULT_PICKUP_TIME: string;
export const DEFAULT_RETURN_TIME: string;
export const TIME_OPTIONS: readonly string[];
export function isValidTimeOption(value: unknown): value is string;
export function excessHours(pickupTime: string, returnTime: string): number;
export function lateReturnSurchargePct(hours: number): 0 | 50 | 100;

export type ExtraId =
  | "cleaning_fee"
  | "airport_transfer"
  | "bicycle"
  | "baby_seat"
  | "bedding"
  | "towels"
  | "bbq"
  | "festival"
  | "extra_driver"
  | "km_200"
  | "km_unlimited"
  | "sup_board"
  | "reduced_deductible";

export interface ExtraItem {
  id: ExtraId;
  price: number;
  mandatory?: boolean;
  perNight?: boolean;
}

export const EXTRAS: readonly ExtraItem[];
export const EXCLUSIVE_EXTRA_GROUPS: readonly (readonly ExtraId[])[];
export const PROMO_CODES: Record<string, number>;
export const PREPAYMENT_DISCOUNT_PCT: number;
export const DEPOSIT_SHARE: number;
export function normalizeExtraIds(extraIds: unknown): ExtraId[];
export function longStayDiscountPct(nights: number): number;

export interface PriceBreakdown {
  nights: number;
  nightsSubtotal: number;
  excessHours: number;
  surchargePct: 0 | 50 | 100;
  surcharge: number;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  total: number;
  totalWithIva: number;
  perNightAvg: number;
}

export function calculatePrice(
  start: Date,
  end: Date,
  pickupTime?: string,
  returnTime?: string,
): PriceBreakdown;

export type PrepaymentOption = "deposit" | "full";

export interface QuoteInput {
  start: Date;
  end: Date;
  pickupTime?: string;
  returnTime?: string;
  extraIds?: readonly string[];
  promoCode?: string | null;
  prepaymentOption?: PrepaymentOption | string;
}

export interface Quote extends PriceBreakdown {
  cleanExtraIds: ExtraId[];
  extrasTotal: number;
  mandatoryTotal: number;
  preDiscountTotal: number;
  appliedPromoCode: string | null;
  promoDiscountPct: number;
  promoDiscountAmount: number;
  afterPromoTotal: number;
  prepaymentOption: PrepaymentOption;
  prepaymentDiscountAmount: number;
  finalTotal: number;
  finalTotalWithIva: number;
  depositAmount: number;
  remainingAmount: number;
}

export function calculateQuote(input: QuoteInput): Quote;
