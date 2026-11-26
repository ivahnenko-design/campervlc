import test from "node:test";
import assert from "node:assert/strict";
import { parseMrz, toFormFields, extractDocFields } from "./doc-extract.js";

test("passport MRZ (ICAO sample) with valid check digits", () => {
  const m = parseMrz("P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10");
  assert.equal(m.documentNumber, "L898902C3");
  assert.equal(m.birthDate, "1974-08-12");
  assert.equal(m.expiryDate, "2012-04-15");
});

test("ID card MRZ (ICAO sample) and a corrupted one", () => {
  const ok = "I<UTOD231458907<<<<<<<<<<<<<<<\n7408122F1204159UTO<<<<<<<<<<<6\nERIKSSON<<ANNA<MARIA<<<<<<<<<<";
  assert.equal(parseMrz(ok).documentNumber, "D23145890");
  assert.equal(parseMrz(ok.replace("D23145890", "D23145891")), null);
});

test("form fields from a reading; name mismatch is flagged", () => {
  const { fields, warnings } = toFormFields({
    identity: { kind: "residence_permit", issuingCountry: "Spain", surname: "IVAKHNENKO", givenNames: "SERGII", documentNumber: "Y9433427Z", nationality: "Ukraine", birthDate: "1983-12-23", issueDate: "", expiryDate: "2027-03-04", street: "", city: "", postalCode: "", mrz: "" },
    licence: { present: true, issuingCountry: "Spain", surname: "IVAKHNENKO", givenNames: "SERHII", birthDate: "1983-12-23", number: "Y9433427Z", issueDate: "2024-04-11", expiryDate: "2034-04-11", categoryBDate: "2003-06-01" },
  });
  assert.equal(fields.docType, "nie");
  assert.equal(fields.fullName, "SERGII IVAKHNENKO");
  assert.equal(fields.licenseBSince, "2003-06-01");
  assert.deepEqual(warnings, []);
  const other = toFormFields({ identity: { kind: "passport", surname: "SMITH", birthDate: "1980-01-01", mrz: "" }, licence: { present: true, surname: "JONES", birthDate: "1981-01-01" } });
  assert.deepEqual(other.warnings.sort(), ["birth_mismatch", "name_mismatch"]);
});

test("switched off without an API key", async () => {
  assert.equal(await extractDocFields({ idFront: Buffer.from("x") }, { apiKey: "" }), null);
});
