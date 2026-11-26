import test from "node:test";
import assert from "node:assert/strict";
import { parseMrz, mrzToFields, refineNames } from "./mrz.js";

const TD3 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10";
const TD1 = "I<UTOD231458907<<<<<<<<<<<<<<<\n7408122F1204159UTO<<<<<<<<<<<6\nERIKSSON<<ANNA<MARIA<<<<<<<<<<";

test("passport MRZ in noisy OCR text", () => {
  const m = parseMrz(`REPUBLIC OF UTOPIA\nPassport\n${TD3}\n`);
  assert.equal(m.kind, "passport");
  assert.equal(m.surname, "ERIKSSON");
  assert.equal(m.givenNames, "ANNA MARIA");
  assert.equal(m.documentNumber, "L898902C3");
  assert.equal(m.birthDate, "1974-08-12");
});

test("ID card MRZ; OCR confusions in digits are fixed, a wrong check digit is rejected", () => {
  assert.equal(parseMrz(TD1).documentNumber, "D23145890");
  assert.equal(parseMrz(TD1.replace("7408122F", "74O8I22F")).birthDate, "1974-08-12");
  assert.equal(parseMrz(TD1.replace("D23145890", "D23145891")), null);
});

test("lines with missing filler are padded", () => {
  assert.equal(parseMrz(TD3.replace("<<<<<<<<<<<<<<<<<<<", "<<<<<<<<<")).documentNumber, "L898902C3");
});

test("Spanish TIE: NIE taken from the optional data", () => {
  const m = { kind: "id_card", issuingState: "ESP", surname: "IVAKHNENKO", givenNames: "SERGII", documentNumber: "E30034377", personalNumber: "Y9433427Z", nationality: "UKR", birthDate: "1983-12-23", expiryDate: "2027-03-04" };
  const f = mrzToFields(m);
  assert.equal(f.docType, "nie");
  assert.equal(f.docNumber, "Y9433427Z");
  assert.equal(f.nationality, "Ukraine");
  assert.equal(f.fullName, "SERGII IVAKHNENKO");
});

test("real Spanish TIE read by Tesseract: K/L filler and misread NIE letter", () => {
  const ocr = " IRESPE300343779Y94334277<<<<KL<\n8312239M2703040UKR<<<KLKLLLLKLKLK5\nIVAKHNENKO<<SERGII<<<<<<<<LL<LK ";
  const f = mrzToFields(parseMrz(ocr));
  assert.deepEqual(f, { docType: "nie", docNumber: "Y9433427Z", fullName: "SERGII IVAKHNENKO", birthDate: "1983-12-23", docExpiry: "2027-03-04", nationality: "Ukraine" });
});

test("the same TIE as read in the browser: extra digit in the NIE, K/L noise in the names", () => {
  for (const ocr of [
    "IRESPE300343779Y943342717<<<<<<\n8312239M2703040UKR<<<KLKLLLLKLKLKS5\nIVAKHNENKO<<SERGII<<K<K<KLKLLKLLKKLKLKL",
    "IRESPE300343779Y943342717<<<K<K<LL\n8312239M2703040UKR<LL<LLLLLK<LKK<LKLS\nIVAKHNENKO<K<SERGII<K<KLKLKLKLKLLKLLKLKLKL",
  ]) {
    const f = mrzToFields(parseMrz(ocr));
    assert.equal(f.docNumber, "Y9433427Z");
    assert.equal(f.fullName, "SERGII IVAKHNENKO");
    assert.equal(f.birthDate, "1983-12-23");
  }
});

test("name words checked across OCR passes", () => {
  const texts = [
    "IVAKHNENKOK<SERGII<K<K<LKLL",
    "IVAKHNENKOK<SERGII<K<K<KLKL",
    "IVAKHNENKO<K<KSERGII<K<K<K<",
    "IVAKHNENKO<K<SERGII<<K<K<KL",
  ];
  const fixed = refineNames({ surname: "IVAKHNENKO", givenNames: "KSERGII" }, texts);
  assert.equal(fixed.givenNames, "SERGII");
  // A real name starting with K stays: both variants occur equally often.
  assert.equal(refineNames({ surname: "SMITH", givenNames: "KATRIN" }, ["SMITH<<KATRIN<<"]).givenNames, "KATRIN");
});
