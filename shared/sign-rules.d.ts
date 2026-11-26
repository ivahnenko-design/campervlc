export declare const MIN_AGE: number;
export declare const MIN_LICENCE_YEARS: number;
export declare function validSpanishId(value: string): boolean;
export declare function validPhone(value: string): boolean;
export declare function signRuleProblems(
  data: Record<string, string>,
  rental: { startDate: string; endDate: string; today?: string },
): { field: string; code: string }[];
