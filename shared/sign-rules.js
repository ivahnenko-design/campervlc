// Checks on the data a guest enters before signing, shared by the signing page
// (instant feedback) and the API (the same rules enforced on the server).
// Contract 2.1: drivers at least 25, licence category B held for more than
// 2 years (the insurer's condition); documents valid for the whole rental.

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

export const MIN_AGE = 25;
export const MIN_LICENCE_YEARS = 2;

/** Same date `years` earlier (29 Feb -> 28 Feb). */
function minusYears(iso, years) {
  const [y, m, d] = iso.split("-").map(Number);
  const day = Math.min(d, new Date(Date.UTC(y - years, m, 0)).getUTCDate());
  return `${String(y - years).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Spanish DNI (12345678Z) or NIE (X1234567L) with its control letter. */
export function validSpanishId(value) {
  const v = String(value || "")
    .toUpperCase()
    .replace(/[\s.-]/g, "");
  const m = /^([XYZ]?)(\d{7,8})([A-Z])$/.exec(v);
  if (!m) return false;
  const [, prefix, digits, letter] = m;
  if (prefix ? digits.length !== 7 : digits.length !== 8) return false;
  const n = Number(`${prefix ? "XYZ".indexOf(prefix) : ""}${digits}`);
  return DNI_LETTERS[n % 23] === letter;
}

export function validPhone(value) {
  const digits = String(value || "").replace(/[\s().-]/g, "");
  return /^\+?\d{7,15}$/.test(digits);
}

/**
 * @param {Record<string, string>} data the form (ISO dates)
 * @param {{ startDate: string, endDate: string, today?: string }} rental
 * @returns {{ field: string, code: string }[]} empty when everything is fine
 */
export function signRuleProblems(data, { startDate, endDate, today = new Date().toISOString().slice(0, 10) }) {
  const out = [];
  const add = (field, code) => out.push({ field, code });
  const date = (k) => (ISO.test(data[k] || "") ? data[k] : null);

  for (const k of ["birthDate", "licenseIssued", "licenseBSince"]) {
    if (date(k) && data[k] > today) add(k, "date_future");
  }
  const birth = date("birthDate");
  if (birth && birth > minusYears(startDate, MIN_AGE)) add("birthDate", "age_under_25");
  const bSince = date("licenseBSince");
  if (bSince && bSince > minusYears(startDate, MIN_LICENCE_YEARS)) add("licenseBSince", "license_too_new");
  if (bSince && birth && bSince <= birth) add("licenseBSince", "date_order");
  if (bSince && date("licenseIssued") && data.licenseIssued < bSince) add("licenseIssued", "date_order");
  if (date("licenseExpiry") && data.licenseExpiry < endDate) add("licenseExpiry", "license_expired");
  if (date("docExpiry") && data.docExpiry < endDate) add("docExpiry", "doc_expired");
  if ((data.docType === "dni" || data.docType === "nie") && data.docNumber && !validSpanishId(data.docNumber)) {
    add("docNumber", "doc_number_invalid");
  }
  if (data.phone && !validPhone(data.phone)) add("phone", "phone_invalid");
  return out;
}
