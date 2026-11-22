// Reads a Yescapa booking from free text: the text recognised from a
// screenshot of the booking page, the page text copied with Cmd+A / Cmd+C,
// or the body of a Yescapa notification email. Pure function, shared by the
// admin page (browser) and the email import endpoint (server).
import { VEHICLES, normalizePlate } from "./vehicles.js";

const MONTHS = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  janvier: 1, "février": 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, "août": 8, aout: 8,
  septembre: 9, octobre: 10, novembre: 11, "décembre": 12, decembre: 12,
};

const PHONE_LANG = [
  ["+380", "uk"], ["+34", "es"], ["+49", "de"], ["+43", "de"], ["+41", "de"], ["+39", "it"],
  ["+31", "nl"], ["+32", "nl"], ["+7", "ru"], ["+44", "en"], ["+353", "en"], ["+1", "en"],
];

const pad = (n) => String(n).padStart(2, "0");

function isoDate(d, m, y) {
  if (!(d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2024 && y <= 2035)) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

function findDates(text) {
  const out = [];
  const words = /(\d{1,2})\s*(?:de\s+)?([a-záéíóúûèêàç]+)\s*(?:de\s+|,\s*)?(20\d\d)/gi;
  for (const m of text.matchAll(words)) {
    const month = MONTHS[m[2].toLowerCase()];
    const iso = month && isoDate(Number(m[1]), month, Number(m[3]));
    if (iso) out.push({ i: m.index, iso });
  }
  const english = /([a-z]+)\s+(\d{1,2}),?\s+(20\d\d)/gi; // November 27, 2026
  for (const m of text.matchAll(english)) {
    const month = MONTHS[m[1].toLowerCase()];
    const iso = month && isoDate(Number(m[2]), month, Number(m[3]));
    if (iso) out.push({ i: m.index, iso });
  }
  const numeric = /\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d\d)\b/g;
  for (const m of text.matchAll(numeric)) {
    const iso = isoDate(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) out.push({ i: m.index, iso });
  }
  out.sort((a, b) => a.i - b.i);
  const seen = [];
  for (const d of out) if (!seen.includes(d.iso)) seen.push(d.iso);
  return seen;
}

function hhmm(h, m = "00") {
  const hour = Number(h);
  return hour >= 0 && hour <= 23 ? `${pad(hour)}:${pad(Number(m) || 0)}` : null;
}

function money(s) {
  // "1.299,34" | "299,34" | "299.34" -> number
  const t = s.replace(/\s/g, "");
  const normalised = /,\d{1,2}$/.test(t) ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  const n = Number(normalised);
  return Number.isFinite(n) ? n : null;
}

const PLATE_LABEL = /(?:veh[íi]culo|vehicle|v[ée]hicule|fahrzeug|veicolo|voertuig|matr[íi]cula|plate|immatriculation|kennzeichen)\s*:?\s*([^\n]{0,40})/gi;

/**
 * Number plate of the booked camper ("Vehículo 1022MPG" on Yescapa). OCR may
 * split it ("1022 MPG"), add a dash or read a 0 as O. Returns "1022MPG" or undefined.
 */
export function findPlate(text) {
  for (const m of String(text || "").matchAll(PLATE_LABEL)) {
    const tail = m[1];
    // Spanish plate: 4 digits + 3 letters.
    const es = tail.match(/(?:^|[^0-9A-Za-z])([0-9OoIl]{4})\s*-?\s*([A-Za-z]{3})(?![0-9A-Za-z])/);
    if (es && /\d/.test(es[1])) {
      return es[1].replace(/[Oo]/g, "0").replace(/[Il]/g, "1") + es[2].toUpperCase();
    }
    // Anything else: the first token with digits and letters (5-8 characters).
    for (const tok of tail.split(/\s{2,}|[,;|]/)) {
      const p = normalizePlate(tok.split(/\s+/).slice(0, 2).join(""));
      if (p.length >= 5 && p.length <= 8 && /\d/.test(p) && /[A-Z]/.test(p)) return p;
    }
  }
  // No label (a different page layout): a known plate anywhere in the text.
  const flat = normalizePlate(text);
  return VEHICLES.find((v) => v.plate && flat.includes(normalizePlate(v.plate)))?.plate;
}

/**
 * @returns {{guestName?:string,email?:string,phone?:string,startDate?:string,endDate?:string,
 *   pickupTime?:string,returnTime?:string,travellers?:number,payout?:number,total?:number,
 *   yescapaRef?:string,language?:string,plate?:string,found:string[]}}
 */
export function parseYescapaBooking(raw) {
  const text = String(raw || "").replace(/\r/g, "").replace(/[ \t ]+/g, " ");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const r = {};

  const emails = [...text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((m) => m[0].toLowerCase());
  r.email = emails.find((e) => !/yescapa|campervlc|noreply|no-reply/.test(e));

  const phone = text.match(/\+\d{1,3}(?:[ -]?\d){7,12}/);
  if (phone) r.phone = phone[0].replace(/-/g, " ").replace(/\s+/g, " ").trim();

  const ref =
    text.match(/referencia\s*:?\s*#?\s*(\d{5,9})/i) ||
    text.match(/(?:reserva|booking|r[ée]servation)\s*(?:n\.?[ºo°]?|#|no\.?)\s*:?\s*(\d{5,9})/i) ||
    text.match(/bookings\/(\d{5,9})/i) ||
    text.match(/#\s?(\d{6,9})\b/);
  if (ref) {
    // OCR often reads the "#" before the number as a 4: Yescapa references have 7 digits.
    r.yescapaRef = ref[1].length === 8 && ref[1].startsWith("4") ? ref[1].slice(1) : ref[1];
  }

  const dates = findDates(text);
  if (dates[0]) r.startDate = dates[0];
  if (dates[1] && dates[1] > dates[0]) r.endDate = dates[1];

  const from = text.match(/(?:a partir de las|desde las|from|à partir de)\s*(\d{1,2})(?::(\d{2}))?(?![\d/.-])/i);
  const until = text.match(/(?:antes de las|hasta las|before|avant)\s*(\d{1,2})(?::(\d{2}))?(?![\d/.-])/i);
  if (from) r.pickupTime = hhmm(from[1], from[2]);
  if (until) r.returnTime = hhmm(until[1], until[2]);

  const trav = text.match(/(?:n[úu]mero de viajeros|viajeros|travell?ers|voyageurs|personas)\D{0,12}(\d{1,2})\b/i);
  if (trav) r.travellers = Number(trav[1]);

  const payout = text.match(/remuneraci[óo]n\s*:?\s*([\d.,\s]+)\s*€/i) || text.match(/(?:payout|earnings|revenus?)\s*:?\s*€?\s*([\d.,]+)/i);
  if (payout) r.payout = money(payout[1]);
  const total = text.match(/(?:precio total|importe total|total price|total)\s*:?\s*([\d.,\s]+)\s*€/i);
  if (total) r.total = money(total[1]);

  // Name: the "Viajero" block, else the closest plausible line above the email.
  const isName = (l) =>
    /^[\p{L}][\p{L}'’.-]*(?:\s+[\p{L}][\p{L}'’.-]*){1,4}$/u.test(l) &&
    !/reserva|viajero|enviar|mensaje|yescapa|confirmad|traveller|booking|detalles|fianza|seguro/i.test(l);
  const vi = lines.findIndex((l) => /^(viajero|traveller|traveler|voyageur)\b/i.test(l));
  if (vi >= 0) r.guestName = lines.slice(vi + 1, vi + 6).find(isName);
  if (!r.guestName && r.email) {
    const ei = lines.findIndex((l) => l.toLowerCase().includes(r.email));
    for (let i = ei - 1; i >= Math.max(0, ei - 4); i--) if (isName(lines[i])) { r.guestName = lines[i]; break; }
  }

  // The avatar initial sits on the same line in screenshots: "S Saul Jara".
  if (r.guestName) r.guestName = r.guestName.replace(/^\p{Lu}\s+(?=\p{Lu})/u, "");

  r.plate = findPlate(text);

  if (r.phone) {
    const hit = PHONE_LANG.find(([p]) => r.phone.replace(/\s/g, "").startsWith(p));
    if (hit) r.language = hit[1];
  }

  r.found = Object.keys(r).filter((k) => r[k] !== undefined && r[k] !== null);
  for (const k of Object.keys(r)) if (r[k] === undefined || r[k] === null) delete r[k];
  return r;
}
