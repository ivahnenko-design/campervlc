// Reads the guest's document photos (ID/passport and driving licence) with
// Claude and returns the form fields, so the signing page can fill them in for
// the guest to check and correct. The machine-readable zone (MRZ) of passports
// and ID cards is verified with its check digits and, when valid, wins over
// what was read from the printed text.
import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { parseMrz } from "../../shared/mrz.js";

const MODEL = "claude-opus-5-5";

const str = { type: "string" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["identity", "licence"],
  properties: {
    identity: {
      type: "object",
      additionalProperties: false,
      required: [
        "kind",
        "issuingCountry",
        "surname",
        "givenNames",
        "documentNumber",
        "nationality",
        "birthDate",
        "issueDate",
        "expiryDate",
        "street",
        "city",
        "postalCode",
        "mrz",
      ],
      properties: {
        kind: { type: "string", enum: ["passport", "id_card", "residence_permit", "other", "none"] },
        issuingCountry: str,
        surname: str,
        givenNames: str,
        documentNumber: str,
        nationality: str,
        birthDate: str,
        issueDate: str,
        expiryDate: str,
        street: str,
        city: str,
        postalCode: str,
        mrz: str,
      },
    },
    licence: {
      type: "object",
      additionalProperties: false,
      required: [
        "present",
        "issuingCountry",
        "surname",
        "givenNames",
        "birthDate",
        "number",
        "issueDate",
        "expiryDate",
        "categoryBDate",
      ],
      properties: {
        present: { type: "boolean" },
        issuingCountry: str,
        surname: str,
        givenNames: str,
        birthDate: str,
        number: str,
        issueDate: str,
        expiryDate: str,
        categoryBDate: str,
      },
    },
  },
};

const PROMPT = `These photos are the identity document and the driving licence a motorhome rental customer uploaded to sign their rental contract. Read them and fill in the JSON.

Rules:
- Copy values exactly as printed; do not guess. Use "" for anything not visible or not legible.
- Dates as YYYY-MM-DD. Countries as their English name (e.g. "Spain", "Ukraine").
- identity.kind: "passport", "id_card" (national ID card, e.g. Spanish DNI), "residence_permit" (e.g. Spanish NIE/TIE card), "other", or "none" if there is no identity document.
- identity.surname / givenNames: as on the document (Latin script when the document has it).
- identity.documentNumber: the document number (for a Spanish TIE/NIE card, the NIE number like Y1234567X, not the card serial).
- identity.street / city / postalCode: only if an address is printed (e.g. back of a Spanish DNI), else "".
- identity.mrz: the machine-readable zone lines (the lines with <<<), separated by \\n, exactly; "" if none.
- licence: the driving licence. On EU licences: 1 surname, 2 given names, 3 date of birth, 4a issue date, 4b expiry date, 5 licence number. categoryBDate is the date in column 10 (date of first issue) of the row for category B on the back; "" if the back is not shown. A screenshot of an official app (e.g. miDGT) counts as the licence.`;

// MRZ parsing is shared with the signing page (shared/mrz.js).
export { parseMrz };

// ── form fields ─────────────────────────────────────────────────────────────

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const iso = (v) => (ISO.test(v || "") ? v : "");
const NIE = /^[XYZ]\d{7}[A-Z]$/;
const DNI = /^\d{8}[A-Z]$/;
const norm = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

/** Turn the model's reading into form fields plus warnings for the guest. */
export function toFormFields(read) {
  const id = read.identity || {};
  const lic = read.licence || {};
  const mrz = parseMrz(id.mrz);
  const fields = {};
  const warnings = [];

  if (id.kind && id.kind !== "none") {
    let number = (mrz?.personalNumber && (NIE.test(mrz.personalNumber) || DNI.test(mrz.personalNumber)) ? mrz.personalNumber : null) ||
      id.documentNumber ||
      mrz?.documentNumber ||
      "";
    number = number.replace(/\s/g, "").toUpperCase();
    const spain = /spain|espa/i.test(id.issuingCountry || "");
    fields.docType =
      id.kind === "passport" ? "passport" : NIE.test(number) ? "nie" : spain && DNI.test(number) ? "dni" : "id_card";
    fields.docNumber = number;
    fields.fullName = [id.givenNames, id.surname].filter(Boolean).join(" ").trim();
    fields.birthDate = mrz?.birthDate || iso(id.birthDate);
    fields.docExpiry = mrz?.expiryDate || iso(id.expiryDate);
    fields.nationality = id.nationality || "";
    if (id.street) fields.street = id.street;
    if (id.city) fields.city = id.city;
    if (id.postalCode) fields.postalCode = id.postalCode;
    if (id.mrz && !mrz) warnings.push("mrz_unreadable");
  }
  if (lic.present) {
    if (lic.number) fields.licenseNumber = lic.number.trim();
    fields.licenseCountry = lic.issuingCountry || "";
    fields.licenseIssued = iso(lic.issueDate);
    fields.licenseExpiry = iso(lic.expiryDate);
    fields.licenseBSince = iso(lic.categoryBDate);
    if (!fields.fullName) fields.fullName = [lic.givenNames, lic.surname].filter(Boolean).join(" ").trim();
    if (!fields.birthDate) fields.birthDate = iso(lic.birthDate);
    // The two documents must belong to the same person.
    if (id.surname && lic.surname && norm(id.surname) !== norm(lic.surname)) warnings.push("name_mismatch");
    const idBirth = mrz?.birthDate || iso(id.birthDate);
    if (idBirth && iso(lic.birthDate) && idBirth !== lic.birthDate) warnings.push("birth_mismatch");
  }
  for (const k of Object.keys(fields)) if (!fields[k]) delete fields[k];
  return { fields, warnings };
}

/**
 * @param {Record<string, Buffer>} docs JPEG photos by slot (idFront, idBack, licenseFront, licenseBack)
 * @returns {Promise<{fields: Record<string,string>, warnings: string[]} | null>} null when switched off or unreadable
 */
export async function extractDocFields(docs, { apiKey = process.env.ANTHROPIC_API_KEY, client } = {}) {
  if (!client && !apiKey) return null;
  const anthropic = client || new Anthropic({ apiKey, timeout: 90_000, maxRetries: 1 });
  const content = [];
  for (const [slot, jpg] of Object.entries(docs)) {
    content.push({ type: "text", text: `Photo: ${slot}` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: Buffer.from(jpg).toString("base64") } });
  }
  content.push({ type: "text", text: PROMPT });
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: jsonSchemaOutputFormat(SCHEMA) },
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  return toFormFields(response.parsed_output);
}
