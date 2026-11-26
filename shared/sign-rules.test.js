import test from "node:test";
import assert from "node:assert/strict";
import { signRuleProblems, validSpanishId, validPhone } from "./sign-rules.js";

const rental = { startDate: "2026-12-10", endDate: "2026-12-13", today: "2026-11-26" };
const ok = {
  docType: "passport",
  docNumber: "AB123456",
  birthDate: "1983-12-23",
  licenseBSince: "2003-05-01",
  licenseIssued: "2019-04-11",
  licenseExpiry: "2034-04-11",
  docExpiry: "2030-01-01",
  phone: "+34 624 038 085",
};
const codes = (d) => signRuleProblems({ ...ok, ...d }, rental).map((p) => `${p.field}:${p.code}`);

test("valid data passes", () => assert.deepEqual(codes({}), []));
test("age: 25 on the pickup day is fine, a day younger is not", () => {
  assert.deepEqual(codes({ birthDate: "2001-12-10" }), []);
  assert.deepEqual(codes({ birthDate: "2001-12-11" }), ["birthDate:age_under_25"]);
});
test("licence category B must be held 2 years by pickup", () => {
  assert.deepEqual(codes({ licenseBSince: "2024-12-10", licenseIssued: "2024-12-10" }), []);
  assert.deepEqual(codes({ licenseBSince: "2025-01-01", licenseIssued: "2025-01-01" }), ["licenseBSince:license_too_new"]);
});
test("documents valid through the return day", () => {
  assert.deepEqual(codes({ licenseExpiry: "2026-12-12", docExpiry: "2026-12-13" }), ["licenseExpiry:license_expired"]);
  assert.deepEqual(codes({ docExpiry: "2026-12-01" }), ["docExpiry:doc_expired"]);
});
test("dates in the future and in the wrong order", () => {
  assert.deepEqual(codes({ licenseIssued: "2026-11-30" }), ["licenseIssued:date_future"]);
  assert.deepEqual(codes({ licenseIssued: "2001-01-01" }), ["licenseIssued:date_order"]);
});
test("Spanish DNI / NIE control letter", () => {
  assert.equal(validSpanishId("12345678Z"), true);
  assert.equal(validSpanishId("12345678A"), false);
  assert.equal(validSpanishId("Y9433427Z"), true);
  assert.equal(validSpanishId("X1234567L"), true);
  assert.deepEqual(codes({ docType: "nie", docNumber: "Y9433427A" }), ["docNumber:doc_number_invalid"]);
});
test("phone format", () => {
  assert.equal(validPhone("+34 678 72 99 74"), true);
  assert.equal(validPhone("12"), false);
});
