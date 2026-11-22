import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareActas,
  dayRateFor,
  fuelLabel,
  kmAllowance,
  kmPlanFromExtras,
  newDamageMarks,
  rentalNights,
  suggestedCharges,
  wallMinutes,
} from "./acta.js";

const rental = { startDate: "2027-03-01", endDate: "2027-03-05", returnTime: "10:00", extras: [] };
const okList = { freshWater: true, greyWater: true, cassette: true, interiorClean: true, keys: true };
const checkin = { odometerKm: 50_000, fuel: 4, checklist: okList, marks: [{ id: "a", x: 0.2, y: 0.3, type: "scratch", note: "" }] };

test("fuel label in quarters (4-mark gauge)", () => {
  assert.equal(fuelLabel(4), "4/4 (lleno)");
  assert.equal(fuelLabel(3), "3/4 (¾)");
  assert.equal(fuelLabel(2, "ru"), "2/4 (½)");
  assert.equal(fuelLabel(null), "-");
});

test("km allowance: 100/night, 200/night option, unlimited", () => {
  assert.equal(rentalNights("2027-03-01", "2027-03-05"), 4);
  assert.equal(rentalNights("bad", "2027-03-05"), 0);
  assert.equal(kmPlanFromExtras(["bbq"]), "100");
  assert.equal(kmPlanFromExtras(["km_200"]), "200");
  assert.equal(kmPlanFromExtras(["km_200", "km_unlimited"]), "unlimited");
  assert.equal(kmAllowance(4), 400);
  assert.equal(kmAllowance(4, "200"), 800);
  assert.equal(kmAllowance(4, "unlimited"), null);
});

test("a clean return suggests nothing", () => {
  const out = { odometerKm: 50_350, fuel: 4, checklist: okList, marks: [], datetime: "2027-03-05T10:10" };
  const cmp = compareActas(checkin, out, rental);
  assert.equal(cmp.kmDriven, 350);
  assert.equal(cmp.kmIncluded, 400);
  assert.equal(cmp.kmExtra, 0);
  assert.equal(cmp.fuelDiff, 0);
  assert.equal(cmp.lateMinutes, 10);
  const charges = suggestedCharges(cmp, { dayRate: 109 });
  assert.deepEqual(charges.items, []);
  assert.equal(charges.total, 0);
  assert.equal(charges.open, false);
});

test("extra km, fuel, waters and late return are priced from the tariffs", () => {
  const out = {
    odometerKm: 50_520, // 520 driven, 400 included -> 120 extra
    fuel: 1, // 3 quarters missing
    checklist: { ...okList, greyWater: false, cassette: false, freshWater: false },
    marks: [],
    datetime: "2027-03-05T12:20", // 2 h 20 late -> 3 h
  };
  const cmp = compareActas(checkin, out, rental);
  assert.equal(cmp.kmExtra, 120);
  assert.equal(cmp.fuelDiff, -3);
  const { items, total, open } = suggestedCharges(cmp, { dayRate: 109 });
  const by = Object.fromEntries(items.map((i) => [i.key, i.amount]));
  assert.equal(by.km, 36);
  assert.equal(by.fuel, 3 * 25 + 10);
  assert.equal(by.greyWater, 20);
  assert.equal(by.cassette, 90);
  assert.equal(by.freshWater, 20);
  assert.equal(by.late, 150);
  assert.equal(total, 36 + 85 + 20 + 90 + 20 + 150);
  assert.equal(open, false);
});

test("200 km option and unlimited change the allowance", () => {
  const out = { odometerKm: 50_700, fuel: 4, checklist: okList, marks: [] };
  assert.equal(compareActas(checkin, out, { ...rental, extras: ["km_200"] }).kmExtra, 0);
  assert.equal(compareActas(checkin, out, { ...rental, extras: [] }).kmExtra, 300);
  assert.equal(compareActas(checkin, out, { ...rental, kmPlan: "unlimited" }).kmExtra, 0);
  assert.equal(compareActas(checkin, out, { ...rental, kmPlan: "unlimited" }).kmIncluded, null);
});

test("real-cost items have no amount but carry the contract maximum", () => {
  const out = { odometerKm: 50_100, fuel: 4, checklist: { ...okList, interiorClean: false, keys: false, kitchenware: false }, smell: true, marks: [] };
  const { items, open, total } = suggestedCharges(compareActas(checkin, out, rental));
  const by = Object.fromEntries(items.map((i) => [i.key, i]));
  assert.equal(by.cleaning.amount, null);
  assert.equal(by.cleaning.max, 150);
  assert.equal(by.smell.max, 300);
  assert.equal(by.keys.max, 250);
  assert.match(by.equipment.es, /Menaje de cocina/);
  assert.equal(open, true);
  assert.equal(total, 0);
});

test("pets without the option: 50 EUR; with the option: nothing", () => {
  const out = { odometerKm: 50_100, fuel: 4, checklist: okList, marks: [], petsOnBoard: true };
  assert.equal(suggestedCharges(compareActas(checkin, out, rental)).items[0]?.key, "pet");
  assert.deepEqual(suggestedCharges(compareActas(checkin, out, { ...rental, extras: ["pet"] })).items, []);
});

test("new damage = check-out marks not repeating a check-in mark", () => {
  const marks = [
    { id: "b", x: 0.21, y: 0.31, type: "scratch", note: "same one" },
    { id: "c", x: 0.21, y: 0.31, type: "dent", note: "other type" },
    { id: "d", x: 0.7, y: 0.8, type: "scratch", note: "elsewhere" },
  ];
  assert.deepEqual(newDamageMarks(checkin.marks, marks).map((m) => m.id), ["c", "d"]);
  const cmp = compareActas(checkin, { odometerKm: 50_001, fuel: 4, checklist: okList, marks }, rental);
  const dmg = suggestedCharges(cmp).items.find((i) => i.key === "damage");
  assert.equal(dmg.amount, null);
  assert.match(dmg.es, /Daños nuevos: 2/);
});

test("late return: grace, hourly rate and the 3-days-per-day cap", () => {
  assert.equal(wallMinutes("2027-03-05T10:00") + 60, wallMinutes("2027-03-05T11:00"));
  assert.equal(wallMinutes("nope"), null);
  const late = (datetime, dayRate) =>
    suggestedCharges(compareActas(checkin, { odometerKm: 50_001, fuel: 4, checklist: okList, marks: [], datetime }, rental), { dayRate }).items.find((i) => i.key === "late");
  assert.equal(late("2027-03-05T10:15", 100), undefined); // within the grace
  assert.equal(late("2027-03-05T10:16", 100).amount, 50);
  assert.equal(late("2027-03-05T20:00", 200).amount, 500); // 10 h, under the cap of 3 x 200
  assert.equal(late("2027-03-06T09:00", 100).amount, 300); // 23 h but capped at 3 days of 100
  assert.equal(late("2027-03-04T18:00", 100), undefined); // early
});

test("no check-in: no km, fuel compared with a full tank", () => {
  const cmp = compareActas(null, { odometerKm: 60_000, fuel: 2, checklist: {}, marks: [] }, rental);
  assert.equal(cmp.kmDriven, null);
  assert.equal(cmp.kmExtra, 0);
  assert.equal(cmp.fuelDiff, -2);
  assert.equal(suggestedCharges(cmp).items[0].amount, 60);
});

test("day rate on the return date includes IVA", () => {
  assert.equal(dayRateFor("2027-08-10"), Math.round(185 * 1.21));
  assert.equal(dayRateFor("x"), null);
});
