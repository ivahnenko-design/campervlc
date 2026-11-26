export interface Mrz {
  kind: string;
  issuingState: string;
  surname: string;
  givenNames: string;
  documentNumber: string;
  personalNumber: string;
  nationality: string;
  birthDate: string;
  expiryDate: string;
  namesClean: boolean;
}
export declare function checkDigit(s: string): string;
export declare function parseMrz(raw: string): Mrz | null;
export declare function countryName(code: string): string;
export declare function mrzToFields(m: Mrz | null): Record<string, string>;
export declare function refineNames(m: Mrz | null, texts: string[]): Mrz | null;
