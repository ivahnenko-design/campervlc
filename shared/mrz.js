// Machine-readable zone (ICAO 9303) of passports (TD3: 2 lines x 44) and ID /
// residence cards (TD1: 3 lines x 30). Used on the signing page to fill the
// form from a document photo read with OCR in the guest's browser, and on the
// server. A reading is accepted only when its check digits are right; common
// OCR confusions (O/0, I/1, S/5 ...) are corrected in the numeric fields first.

const charValue = (c) => (c === "<" ? 0 : /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 55);
export function checkDigit(s) {
  const w = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += charValue(s[i]) * w[i % 3];
  return String(sum % 10);
}

const TO_DIGIT = { O: "0", Q: "0", D: "0", U: "0", I: "1", L: "1", T: "1", Z: "2", S: "5", B: "8", G: "6" };
const digits = (s) => s.replace(/[A-Z]/g, (c) => TO_DIGIT[c] || c);

function mrzDate(yymmdd, future) {
  if (!/^\d{6}$/.test(yymmdd)) return "";
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  const nowYY = new Date().getUTCFullYear() % 100;
  const century = future ? (yy < 70 ? 2000 : 1900) : yy > nowYY ? 1900 : 2000;
  return `${century + yy}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`;
}
const text = (s) => s.replace(/<+$/g, "").replace(/</g, " ").replace(/\s+/g, " ").trim();
// Name words; lone K / L are misread "<" filler, not names.
const words = (s) =>
  s
    .split("<")
    .filter((w) => w && !/^[KL]{1,2}$/.test(w))
    .join(" ");
function names(s) {
  const parts = s.replace(/^[<KL]+/, "").split(/<[<KL]?</);
  const [surname = "", given = ""] = parts;
  // namesClean: the surname / given names separator was found (no guessing).
  return { surname: words(surname), givenNames: words(given), namesClean: parts.length > 1 && !!words(given) };
}

/** The document number may contain letters; when its check digit fails, try digit fixes. */
function docNumber(raw, check) {
  if (checkDigit(raw) === check) return raw;
  // Letters are valid in document numbers: only fix the confusions that are never meant.
  const fixed = raw.replace(/[OQ]/g, "0").replace(/I/g, "1");
  return checkDigit(fixed) === check ? fixed : null;
}

function td3(a, b) {
  const num = docNumber(b.slice(0, 9), digits(b[9]));
  const birth = digits(b.slice(13, 19));
  const expiry = digits(b.slice(21, 27));
  if (!num || checkDigit(birth) !== digits(b[19]) || checkDigit(expiry) !== digits(b[27])) return null;
  return {
    kind: "passport",
    issuingState: a.slice(2, 5).replace(/</g, ""),
    ...names(a.slice(5)),
    documentNumber: text(num),
    personalNumber: text(b.slice(28, 42)),
    nationality: b.slice(10, 13).replace(/</g, ""),
    birthDate: mrzDate(birth, false),
    expiryDate: mrzDate(expiry, true),
  };
}

function td1(a, b, c) {
  const num = docNumber(a.slice(5, 14), digits(a[14]));
  const birth = digits(b.slice(0, 6));
  const expiry = digits(b.slice(8, 14));
  if (!num || checkDigit(birth) !== digits(b[6]) || checkDigit(expiry) !== digits(b[14])) return null;
  return {
    kind: a[0] === "I" || a[0] === "A" || a[0] === "C" ? "id_card" : "other",
    issuingState: a.slice(2, 5).replace(/</g, ""),
    ...names(c),
    documentNumber: text(num),
    // Spanish DNI / TIE: the DNI or NIE number is in the optional data.
    personalNumber: text(a.slice(15, 30)),
    nationality: b.slice(15, 18).replace(/</g, ""),
    birthDate: mrzDate(birth, false),
    expiryDate: mrzDate(expiry, true),
  };
}

// OCR often reads the "<" filler as K or L: a run of them with several "<" is filler.
const cleanFiller = (line) =>
  line.replace(/[<KL]{5,}/g, (run) => ((run.match(/</g) || []).length >= 3 ? "<".repeat(run.length) : run));

const fit = (line, n) => (line.length >= n ? line.slice(0, n) : line + "<".repeat(n - line.length));

/**
 * Finds and parses an MRZ in OCR text (any noise around it).
 * @returns {null | {kind, issuingState, surname, givenNames, documentNumber, personalNumber, nationality, birthDate, expiryDate}}
 */
export function parseMrz(raw) {
  const lines = String(raw || "")
    .toUpperCase()
    .replace(/[«‹]/g, "<")
    .split(/\n/)
    .map((l) => cleanFiller(l.replace(/[^A-Z0-9<]/g, "")))
    .filter((l) => l.length >= 26 && (l.includes("<") || /\d{6}/.test(l)));
  for (let i = 0; i < lines.length; i++) {
    const a = lines[i];
    const b = lines[i + 1];
    const c = lines[i + 2];
    if (b && a.length >= 30 && b.length >= 40) {
      const r = td3(fit(a, 44), fit(b, 44));
      if (r) return r;
    }
    if (b && c && a.length < 40 && b.length < 40) {
      const r = td1(fit(a, 30), fit(b, 30), fit(c, 30));
      if (r) return r;
    }
  }
  return null;
}

/**
 * Name words read in several OCR passes: a stray K / L glued to a word (a
 * misread "<") appears in fewer passes than the word itself. Each word is
 * replaced by its variant without leading / trailing K, L when that variant
 * occurs in more of the passes' texts; ties keep the word as read.
 */
export function refineNames(m, texts) {
  if (!m) return m;
  const all = texts.map((t) => String(t).toUpperCase());
  const count = (w) => all.filter((t) => t.includes(w)).length;
  const best = (w) => {
    const variants = [w, w.replace(/^[KL]/, ""), w.replace(/[KL]$/, ""), w.replace(/^[KL]/, "").replace(/[KL]$/, "")];
    return variants.filter((v) => v.length >= 2).reduce((a, v) => (count(v) > count(a) ? v : a), w);
  };
  const fix = (s) => s.split(" ").filter(Boolean).map(best).join(" ");
  return { ...m, surname: fix(m.surname), givenNames: fix(m.givenNames) };
}

const COUNTRY = {
  ESP: "Spain", UKR: "Ukraine", RUS: "Russia", BLR: "Belarus", POL: "Poland", DEU: "Germany", D: "Germany",
  FRA: "France", ITA: "Italy", PRT: "Portugal", NLD: "Netherlands", BEL: "Belgium", GBR: "United Kingdom",
  IRL: "Ireland", CHE: "Switzerland", AUT: "Austria", SWE: "Sweden", NOR: "Norway", DNK: "Denmark",
  FIN: "Finland", CZE: "Czech Republic", SVK: "Slovakia", HUN: "Hungary", ROU: "Romania", BGR: "Bulgaria",
  GRC: "Greece", HRV: "Croatia", SVN: "Slovenia", LTU: "Lithuania", LVA: "Latvia", EST: "Estonia",
  MDA: "Moldova", GEO: "Georgia", ARM: "Armenia", KAZ: "Kazakhstan", ISR: "Israel", TUR: "Turkey",
  USA: "United States", CAN: "Canada", MEX: "Mexico", ARG: "Argentina", BRA: "Brazil", COL: "Colombia",
  VEN: "Venezuela", CHL: "Chile", PER: "Peru", ECU: "Ecuador", URY: "Uruguay", AUS: "Australia",
  NZL: "New Zealand", MAR: "Morocco", CHN: "China", JPN: "Japan", KOR: "South Korea", IND: "India",
};
export const countryName = (code) => COUNTRY[code] || code || "";

const NIE = /^[XYZ]\d{7}[A-Z]$/;
const DNI = /^\d{8}[A-Z]$/;
const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
// Letters OCR tends to read as these characters.
const LOOKS_LIKE = { 7: "Z", 2: "Z", 5: "S", 8: "B", 0: "OQD", 1: "IL", 6: "G", 4: "A" };

/**
 * Spanish DNI / NIE in the optional data of a Spanish card. The control letter
 * is computed from the digits (OCR often misreads it or adds a character).
 */
function spanishId(v) {
  const nie = /([XYZ])(\d{7})/.exec(v);
  if (nie) return `${nie[1]}${nie[2]}${DNI_LETTERS[Number(`${"XYZ".indexOf(nie[1])}${nie[2]}`) % 23]}`;
  const dni = /^(\d{8})/.exec(v);
  if (dni) return `${dni[1]}${DNI_LETTERS[Number(dni[1]) % 23]}`;
  return null;
}

/** Form fields of the signing page from a parsed MRZ. */
export function mrzToFields(m) {
  // (m.namesClean false: the name could not be split; the guest corrects it.)
  if (!m) return {};
  const personal = (m.personalNumber || "").replace(/\s/g, "");
  const spanish = m.issuingState === "ESP" && m.kind !== "passport" ? spanishId(personal) : null;
  const number = spanish || m.documentNumber.replace(/\s/g, "");
  return {
    docType: m.kind === "passport" ? "passport" : NIE.test(number) ? "nie" : DNI.test(number) ? "dni" : "id_card",
    docNumber: number,
    fullName: [m.givenNames, m.surname].filter(Boolean).join(" "),
    birthDate: m.birthDate,
    docExpiry: m.expiryDate,
    nationality: countryName(m.nationality),
  };
}
