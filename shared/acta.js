// Handover reports (acta de entrega / devolución): the checklist, damage types,
// fuel gauge and the check-out comparison with SUGGESTED charges. Pure logic,
// shared by the API (PDF) and the admin page (summary card). Nothing here
// charges anybody: the owner decides what to claim.
// Types for TypeScript callers are in ./acta.d.ts next to this file.
//
// Tariffs: content/condiciones-web-es.md, "Tarifas y suplementos" and 3.4, 3.7, 3.8, 6.3.
import { differenceInCalendarDays, getPriceForDate, parseIsoDate, withIva } from "./pricing.js";

export const ACTA_KINDS = ["checkin", "checkout"];

/** Paper annex I-A / I-B, same order. `group`: estado (state) or equipo (equipment). */
export const CHECKLIST = [
  { key: "freshWater", group: "estado", es: "Depósito de agua limpia lleno", ru: "Бак чистой воды полный" },
  { key: "greyWater", group: "estado", es: "Aguas grises vacías", ru: "Серая вода слита" },
  { key: "cassette", group: "estado", es: "Casete del WC vacío y limpio", ru: "Кассета туалета пустая и чистая" },
  { key: "gas", group: "estado", es: "2 bombonas de gas", ru: "2 газовых баллона" },
  { key: "interiorClean", group: "estado", es: "Limpieza interior correcta", ru: "Салон чистый" },
  { key: "tyresLights", group: "estado", es: "Neumáticos y luces OK", ru: "Шины и фары в порядке" },
  { key: "documents", group: "estado", es: "Documentación del vehículo", ru: "Документы на автомобиль" },
  { key: "keys", group: "estado", es: "Llaves (1 juego)", ru: "Ключи (1 комплект)" },
  { key: "campingTable", group: "equipo", es: "Mesa y sillas de camping", ru: "Кемпинговый стол и стулья" },
  { key: "beachChairs", group: "equipo", es: "3 sillas de playa · sombrilla", ru: "3 пляжных стула и зонт" },
  { key: "kitchenware", group: "equipo", es: "Menaje de cocina", ru: "Кухонная посуда" },
  { key: "bedding", group: "equipo", es: "Almohadas y mantas", ru: "Подушки и одеяла" },
  { key: "bookedExtras", group: "equipo", es: "Opciones contratadas", ru: "Заказанные опции" },
  { key: "cableHose", group: "equipo", es: "Cable eléctrico y manguera", ru: "Электрокабель и шланг" },
];
export const CHECKLIST_KEYS = CHECKLIST.map((c) => c.key);

/** Damage marks; `symbol` is the paper annex legend. */
export const DAMAGE_TYPES = {
  dent: { symbol: "X", es: "Golpe / abolladura", ru: "Вмятина / удар" },
  scratch: { symbol: "/", es: "Arañazo", ru: "Царапина" },
  crack: { symbol: "O", es: "Rotura / fisura", ru: "Трещина / поломка" },
  missing: { symbol: "●", es: "Falta pieza", ru: "Нет детали" },
};
export const DAMAGE_TYPE_KEYS = Object.keys(DAMAGE_TYPES);

/** Extras as the acta names them (cleaning fee and mileage plans are not equipment). */
export const EXTRA_LABELS = {
  bicycle: { es: "Bicicleta", ru: "Велосипед" },
  sup_board: { es: "Tabla de paddle surf", ru: "SUP-доска" },
  bedding: { es: "Ropa de cama", ru: "Постельное бельё" },
  towels: { es: "Toallas", ru: "Полотенца" },
  bbq: { es: "Barbacoa", ru: "Барбекю" },
  festival: { es: "Pack festival", ru: "Фестивальный пакет" },
  extra_driver: { es: "Conductor adicional", ru: "Доп. водитель" },
  pet: { es: "Mascota", ru: "Питомец" },
  km_200: { es: "200 km por noche", ru: "200 км в сутки" },
  km_unlimited: { es: "Kilometraje ilimitado", ru: "Безлимитный пробег" },
};

// ── tariffs (IVA included) ──────────────────────────────────────────────────
export const TARIFFS = {
  kmIncludedPerNight: 100,
  kmPlan200PerNight: 200,
  extraKm: 0.3, // € per km over the allowance
  fuelPerEighth: 25, // € per missing mark ("raya") of the gauge
  fuelService: 10, // € refuelling service
  greyWater: 20,
  cassette: 90,
  freshWater: 20,
  cleaningMax: 150, // real cost, max
  smellMax: 300, // real cost, max (tobacco / animals, ozone)
  keysMax: 250, // real cost, max
  pet: 50, // per booking, when pets travelled without the option
  lateHour: 50, // € per hour of unagreed delay
  lateMaxDaysPerDay: 3, // max 3 rental days per day of delay
  lateGraceMin: 15, // minutes tolerated before suggesting anything
  excess: 900, // insurance excess per claim
};

// ── fuel ────────────────────────────────────────────────────────────────────
const FRACTION = { 0: "vacío", 2: "¼", 4: "½", 6: "¾", 8: "lleno" };
const FRACTION_RU = { 0: "пусто", 2: "¼", 4: "½", 6: "¾", 8: "полный" };

/** 6 -> "6/8 (¾)", 8 -> "8/8 (lleno)", 3 -> "3/8". */
export function fuelLabel(eighths, lang = "es") {
  if (!Number.isInteger(eighths)) return "-";
  const f = (lang === "ru" ? FRACTION_RU : FRACTION)[eighths];
  return f ? `${eighths}/8 (${f})` : `${eighths}/8`;
}

// ── mileage ────────────────────────────────────────────────────────────────

/** "100" | "200" | "unlimited" from the booked extras. */
export function kmPlanFromExtras(extraIds) {
  const ids = Array.isArray(extraIds) ? extraIds : [];
  if (ids.includes("km_unlimited")) return "unlimited";
  if (ids.includes("km_200")) return "200";
  return "100";
}

export function rentalNights(startDate, endDate) {
  const a = parseIsoDate(startDate);
  const b = parseIsoDate(endDate);
  return a && b ? Math.max(0, differenceInCalendarDays(b, a)) : 0;
}

/** Included km for the rental, or null = unlimited. */
export function kmAllowance(nights, plan = "100") {
  if (plan === "unlimited") return null;
  const perNight = plan === "200" ? TARIFFS.kmPlan200PerNight : TARIFFS.kmIncludedPerNight;
  return Math.max(0, nights) * perNight;
}

// ── comparison ──────────────────────────────────────────────────────────────

/** "2026-11-22T10:30" -> minutes since epoch, wall-clock (no time zone on purpose). */
export function wallMinutes(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) / 60_000;
}

const NEAR = 0.04; // same spot on the drawing (relative units)

/** Check-out marks that do not repeat a check-in mark of the same type at the same spot. */
export function newDamageMarks(checkinMarks = [], checkoutMarks = []) {
  return checkoutMarks.filter(
    (m) => !checkinMarks.some((p) => p.type === m.type && Math.hypot(p.x - m.x, p.y - m.y) <= NEAR),
  );
}

/**
 * Check-in vs check-out. Missing values give null fields, never a guess.
 * @param {object|null} checkin acta (may be null: no check-in recorded)
 * @param {object} checkout acta
 * @param {object} rental { startDate, endDate, returnTime, kmPlan, extras }
 */
export function compareActas(checkin, checkout, rental = {}) {
  const nights = rentalNights(rental.startDate, rental.endDate);
  const plan = rental.kmPlan || checkout?.kmPlan || kmPlanFromExtras(rental.extras);
  const included = kmAllowance(nights, plan);
  const kmIn = checkin?.odometerKm;
  const kmOut = checkout?.odometerKm;
  const kmDriven = Number.isInteger(kmIn) && Number.isInteger(kmOut) ? kmOut - kmIn : null;
  const kmExtra = kmDriven != null && included != null ? Math.max(0, kmDriven - included) : 0;

  // The camper is handed over full (3.7); without a check-in, full is the baseline.
  const fuelIn = Number.isInteger(checkin?.fuel) ? checkin.fuel : 8;
  const fuelOut = Number.isInteger(checkout?.fuel) ? checkout.fuel : null;
  const fuelDiff = fuelOut == null ? null : fuelOut - fuelIn;

  const failedItems = CHECKLIST.filter((c) => checkout?.checklist?.[c.key] === false).map((c) => c.key);
  const newMarks = newDamageMarks(checkin?.marks || [], checkout?.marks || []);

  const due = wallMinutes(rental.endDate && `${rental.endDate}T${rental.returnTime || "10:00"}`);
  const back = wallMinutes(checkout?.datetime);
  const lateMinutes = due != null && back != null ? Math.max(0, back - due) : null;

  const extras = Array.isArray(rental.extras) ? rental.extras : checkout?.extras || [];
  const pets = checkout?.petsOnBoard === true || checkin?.petsOnBoard === true;

  return {
    nights,
    kmPlan: plan,
    kmIn: Number.isInteger(kmIn) ? kmIn : null,
    kmOut: Number.isInteger(kmOut) ? kmOut : null,
    kmDriven,
    kmIncluded: included,
    kmExtra,
    fuelIn,
    fuelOut,
    fuelDiff,
    failedItems,
    newMarks,
    lateMinutes,
    smell: checkout?.smell === true,
    petsWithoutOption: pets && !extras.includes("pet"),
  };
}

/** Rental day price incl. IVA on the return date (for the late-return cap). */
export function dayRateFor(endDate) {
  const d = parseIsoDate(endDate);
  return d ? withIva(getPriceForDate(d)) : null;
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * SUGGESTED amounts for the check-out, from the tariffs. `amount: null` = real
 * cost to be justified (with `max` when the contract caps it).
 * @returns {{ items: {key:string, es:string, ru:string, amount:number|null, max?:number, detail?:string}[], total:number, open:boolean }}
 */
export function suggestedCharges(cmp, { dayRate = null } = {}) {
  const items = [];
  const add = (key, es, ru, amount, extra = {}) => items.push({ key, es, ru, amount, ...extra });
  const T = TARIFFS;

  if (cmp.kmExtra > 0) {
    add("km", `Kilómetros adicionales: ${cmp.kmExtra} km × 0,30 €`, `Перепробег: ${cmp.kmExtra} км × 0,30 €`, round2(cmp.kmExtra * T.extraKm));
  }
  if (cmp.fuelDiff != null && cmp.fuelDiff < 0) {
    const n = -cmp.fuelDiff;
    add("fuel", `Combustible: faltan ${n}/8 × 25 € + 10 € de servicio`, `Топливо: не хватает ${n}/8 × 25 € + 10 € сервис`, n * T.fuelPerEighth + T.fuelService);
  }
  const failed = new Set(cmp.failedItems);
  if (failed.has("greyWater")) add("greyWater", "Aguas grises sin vaciar", "Серая вода не слита", T.greyWater);
  if (failed.has("cassette")) add("cassette", "Casete del WC sin vaciar o sin limpiar", "Кассета туалета не слита/не чистая", T.cassette);
  if (failed.has("freshWater")) add("freshWater", "Depósito de agua limpia sin llenar", "Бак чистой воды не заполнен", T.freshWater);
  if (failed.has("interiorClean")) {
    add("cleaning", "Limpieza interior insuficiente (coste real)", "Уборка салона (по факту)", null, { max: T.cleaningMax });
  }
  if (cmp.smell) add("smell", "Olor a tabaco o animales, ozonización (coste real)", "Запах табака/животных, озонирование (по факту)", null, { max: T.smellMax });
  if (failed.has("keys")) add("keys", "Pérdida de llaves (coste real)", "Потеря ключей (по факту)", null, { max: T.keysMax });
  const missing = CHECKLIST.filter((c) => c.group === "equipo" || c.key === "gas" || c.key === "documents")
    .filter((c) => failed.has(c.key));
  if (missing.length) {
    add(
      "equipment",
      `Equipamiento que falta o dañado (coste real): ${missing.map((c) => c.es).join(", ")}`,
      `Недостающее/повреждённое оснащение (по факту): ${missing.map((c) => c.ru).join(", ")}`,
      null,
    );
  }
  if (cmp.petsWithoutOption) add("pet", "Mascota sin opción contratada", "Питомец без заказанной опции", T.pet);
  if (cmp.lateMinutes != null && cmp.lateMinutes > T.lateGraceMin) {
    const hours = Math.ceil(cmp.lateMinutes / 60);
    const days = Math.ceil(cmp.lateMinutes / 1440);
    let amount = hours * T.lateHour;
    if (dayRate) amount = Math.min(amount, days * T.lateMaxDaysPerDay * dayRate);
    add("late", `Retraso no pactado: ${hours} h × 50 € (si no se pactó)`, `Опоздание без согласования: ${hours} ч × 50 € (если не согласовано)`, amount);
  }
  if (cmp.newMarks.length) {
    add(
      "damage",
      `Daños nuevos: ${cmp.newMarks.length} (según peritación, franquicia máx. 900 € por siniestro)`,
      `Новые повреждения: ${cmp.newMarks.length} (по оценке, франшиза до 900 € за случай)`,
      null,
      { max: T.excess },
    );
  }
  const total = round2(items.reduce((s, i) => s + (i.amount || 0), 0));
  return { items, total, open: items.some((i) => i.amount == null) };
}
