// Hand-written types for ./yescapa-parse.js.
export interface YescapaBooking {
  guestName?: string;
  email?: string;
  phone?: string;
  startDate?: string;
  endDate?: string;
  pickupTime?: string;
  returnTime?: string;
  travellers?: number;
  payout?: number;
  total?: number;
  yescapaRef?: string;
  language?: string;
  found: string[];
}
export function parseYescapaBooking(raw: string): YescapaBooking;
