// Yescapa bookings sent in by email. Yescapa has no API for owners, so a small
// Google Apps Script in the owner's Gmail forwards each Yescapa booking email
// here (POST /api/contract?scope=import, header x-import-key). The text is read
// with the same parser as the admin screenshot import and kept as a draft the
// owner confirms in /admin/contratos with one click.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { blobStore, list } from "./blob.js";
import { parseYescapaBooking } from "../../shared/yescapa-parse.js";
import { esc, postToResend, siteUrl } from "./email.js";
import { activeVehicles, vehicleByPlate, vehicleLabel } from "../../shared/vehicles.js";
import { ownerTo } from "./vehicles.js";

export const IMPORT_PREFIX = process.env.IMPORTS_BLOB_PREFIX || "campervlc-imports/";

/** Secret for the Gmail script, derived from ADMIN_TOKEN (no extra env var). */
export function importKey(adminToken = process.env.ADMIN_TOKEN) {
  if (!adminToken) return null;
  return createHmac("sha256", adminToken).update("yescapa-import-v1").digest("hex").slice(0, 32);
}

function keyOk(req, key) {
  if (!key) return false;
  const given = Buffer.from(String(req.headers?.["x-import-key"] || ""));
  const want = Buffer.from(key);
  return given.length === want.length && timingSafeEqual(given, want);
}

export function htmlToText(html) {
  return String(html || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d|td)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n");
}

/**
 * The camper of a Yescapa booking: the one with the plate Yescapa shows
 * ("Vehículo 1022MPG"). Without a plate it is only certain while there is one
 * active camper; otherwise null (the company owner decides in the admin).
 */
export function importVehicleId(parsed) {
  const byPlate = vehicleByPlate(parsed?.plate);
  if (byPlate?.active) return byPlate.id;
  const active = activeVehicles();
  return !parsed?.plate && active.length === 1 ? active[0].id : null;
}

export function makeDraft({ subject = "", text = "", html = "", messageId = "", from = "" }, now = Date.now()) {
  const body = String(text || "").trim() || htmlToText(html);
  const parsed = parseYescapaBooking(`${subject}\n${body}`);
  const id = createHash("sha256").update(String(messageId || subject + body)).digest("hex").slice(0, 16);
  return {
    id,
    status: "new", // new | done | dismissed
    receivedAt: now,
    subject: String(subject).slice(0, 200),
    from: String(from).slice(0, 200),
    parsed,
    vehicleId: importVehicleId(parsed),
    snippet: body.slice(0, 4000),
    contractId: null,
  };
}

export function createImportStore(prefix = IMPORT_PREFIX) {
  const path = (id) => `${prefix}${id}.json`;
  return {
    async create(draft) {
      // Create-only: the same email sent twice is stored once.
      await blobStore.put(path(draft.id), draft, { allowOverwrite: false });
    },
    async get(id) {
      const r = await blobStore.readJson(path(id));
      return r ? { draft: r.data, etag: r.etag } : null;
    },
    async save(draft, { etag } = {}) {
      await blobStore.put(path(draft.id), draft, etag ? { ifMatch: etag } : {});
    },
    async list() {
      const names = [];
      let cursor;
      do {
        const page = await list({ prefix, cursor });
        for (const b of page.blobs) if (b.pathname.endsWith(".json")) names.push(b.pathname);
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      const rows = await Promise.all(names.map((n) => blobStore.readJson(n).catch(() => null)));
      return rows.filter(Boolean).map((r) => r.data).sort((a, b) => b.receivedAt - a.receivedAt);
    },
  };
}

async function notifyOwner(draft) {
  const p = draft.parsed || {};
  const company = process.env.CONTRACT_OWNER_EMAIL || process.env.OWNER_EMAIL || "camper.retreat.alicante@gmail.com";
  // Goes to the owner of the camper; unknown camper: the company owner.
  const to = draft.vehicleId ? ownerTo(draft.vehicleId, company) : company;
  await postToResend({
    from: "Camper Retreat VLC <info@campervlc.com>",
    to,
    subject: `Yescapa: ${p.guestName || "nueva reserva"} ${p.startDate || ""} → ${p.endDate || ""}`,
    html: `<p>Ha llegado una reserva de Yescapa. Revisa los datos y crea el contrato con un clic:</p>
      <ul><li>${esc(p.guestName || "—")}</li><li>${esc(p.email || "—")} · ${esc(p.phone || "—")}</li>
      <li>${esc(p.startDate || "?")} ${esc(p.pickupTime || "")} → ${esc(p.endDate || "?")} ${esc(p.returnTime || "")}</li>
      <li>Ref. Yescapa ${esc(p.yescapaRef || "—")}</li>
      <li>Vehículo: ${esc(draft.vehicleId ? vehicleLabel(draft.vehicleId) : p.plate ? `${p.plate} (desconocido)` : "—")}</li></ul>
      <p><a href="${esc(siteUrl())}/admin/contratos">Abrir el panel</a></p>`,
  });
}

/** POST /api/contract?scope=import from the Gmail script. */
export function createImportHandler({ store = createImportStore(), key = importKey(), notify = notifyOwner, now = () => Date.now() } = {}) {
  return async function importHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!keyOk(req, key)) return res.status(401).json({ error: "Unauthorized" });
    const draft = makeDraft(req.body || {}, now());
    // Only booking emails: without dates or a guest email there is nothing to import.
    if (!draft.parsed.startDate && !draft.parsed.email) return res.status(200).json({ ok: true, skipped: "not_a_booking" });
    try {
      await store.create(draft);
    } catch (err) {
      if (/exist|already/i.test(err.message)) return res.status(200).json({ ok: true, duplicate: true, id: draft.id });
      throw err;
    }
    await notify(draft).catch((err) => console.error("import notify failed:", err.message));
    return res.status(201).json({ ok: true, id: draft.id, found: draft.parsed.found });
  };
}

/** Google Apps Script the owner pastes into script.google.com (runs every 10 minutes). */
export function gmailScript(endpoint, key) {
  return `// Camper Retreat VLC: пересылает письма Yescapa о бронях на сайт.
const ENDPOINT = ${JSON.stringify(endpoint)};
const KEY = ${JSON.stringify(key)};
const LABEL = "campervlc-imported";

function importYescapa() {
  const label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
  const threads = GmailApp.search('from:yescapa newer_than:14d -label:' + LABEL, 0, 30);
  for (const thread of threads) {
    for (const msg of thread.getMessages()) {
      UrlFetchApp.fetch(ENDPOINT, {
        method: "post",
        contentType: "application/json",
        headers: { "x-import-key": KEY },
        muteHttpExceptions: true,
        payload: JSON.stringify({
          messageId: msg.getId(),
          subject: msg.getSubject(),
          from: msg.getFrom(),
          text: msg.getPlainBody(),
        }),
      });
    }
    thread.addLabel(label);
  }
}

function setup() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("importYescapa").timeBased().everyMinutes(10).create();
  importYescapa();
}
`;
}
