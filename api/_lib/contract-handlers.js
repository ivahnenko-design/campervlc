// HTTP handlers of the electronic contract: an owner-only admin endpoint (create
// a contract for a booking, e.g. from Yescapa, resend the link, download the
// signed PDF) and the guest endpoint behind /sign/:token (read, email code, sign).
// Dependencies are injected so tests run without Blob, Resend or the network.
import {
  ContractError,
  checkOtp,
  contractNumber,
  uniqueContractNumber,
  DOC_SLOTS,
  createContract,
  decodeDocJpeg,
  decodeSignaturePng,
  issueKiosk,
  issueOtp,
  markGuestSigned,
  markSigned,
  markSubmitted,
  markVerified,
  openToken,
  OPEN_STATUSES,
  sealToken,
  tokenKind,
  UNSIGNED_STATUSES,
  publicView,
  reissueToken,
  requireConsents,
  requiredDocSlots,
  sha256,
  tokenId,
  validateSignData,
} from "./contracts.js";
import { buildSignedPdf } from "./contract-pdf.js";
import { signActa } from "./acta-handlers.js";
import { signingLink } from "./contract-email.js";
import { calendarFeedUrl } from "./calendar-key.js";
import { siteUrl } from "./email.js";
import { adminAccess, adminConfigured, canSee, staffConfig, staffVehicles, visibleTo } from "./staff.js";
import { activeVehicles, vehicleLabel, vehicleOf } from "../../shared/vehicles.js";
import { signRuleProblems } from "../../shared/sign-rules.js";

function reply(res, status, body) {
  return res.status(status).json(body);
}

function fail(res, err) {
  if (err instanceof ContractError) return reply(res, err.status, { error: err.message, code: err.code });
  if (/precondition|conflict/i.test(`${err?.name} ${err?.code}`)) {
    return reply(res, 409, { error: "The contract changed, try again", code: "conflict" });
  }
  console.error("contract handler failed:", err);
  return reply(res, 500, { error: "Internal error", code: "internal" });
}

const forbidden = (res) => reply(res, 403, { error: "Not your camper", code: "forbidden" });

/** Yescapa drafts: the camper found by plate, or null (company owner decides). */
const draftVehicle = (d) => (typeof d.vehicleId === "string" ? d.vehicleId : null);

const vehicleRow = (v) => ({ id: v.id, name: v.name, city: v.city.es, plate: v.plateDisplay, label: vehicleLabel(v) });

function adminRow(c) {
  return {
    id: c.id,
    extras: c.extras || [],
    number: c.number || c.id,
    vehicleId: vehicleOf(c),
    status: c.status,
    guestName: c.guestName,
    email: c.email,
    phone: c.phone || "",
    source: c.source,
    bookingRef: c.bookingRef,
    startDate: c.startDate,
    endDate: c.endDate,
    pickupTime: c.pickupTime,
    returnTime: c.returnTime,
    priceTotal: c.priceTotal,
    createdAt: c.createdAt,
    viewedAt: c.viewedAt || null,
    signedAt: c.signed?.at || null,
    submittedAt: c.submission?.at || null,
    verifiedAt: c.verification?.at || null,
    guestSignedAt: c.guestSignature?.at || null,
    language: c.language,
    provider: c.provider,
  };
}

/** Everything the owner may see about one contract: no token hash, no code hash. */
function adminDetail(c) {
  return {
    ...adminRow(c),
    note: c.note || "",
    expiresAt: c.expiresAt,
    signed: c.signed
      ? {
          at: c.signed.at,
          data: c.signed.data,
          consents: c.signed.consents,
          ip: c.signed.ip,
          userAgent: c.signed.userAgent,
          pdfHash: c.signed.pdfHash,
          docs: Object.keys(c.signed.docHashes || {}),
          verified: c.signed.verified || null,
          owner: c.signed.owner ? { name: c.signed.owner.name, at: c.signed.owner.at } : null,
          guestAt: c.signed.guestAt || null,
        }
      : null,
    // In-person signing: what the guest sent, what staff checked, the guest signature.
    submission: c.submission
      ? { at: c.submission.at, data: c.submission.data, docs: Object.keys(c.submission.docHashes || {}), byStaff: c.submission.byStaff || null }
      : null,
    verification: c.verification
      ? { at: c.verification.at, by: c.verification.by, name: c.verification.name, data: c.verification.data, edits: c.verification.edits || [] }
      : null,
    guestSignature: c.guestSignature ? { at: c.guestSignature.at, ip: c.guestSignature.ip, staff: c.guestSignature.staff } : null,
    staffDraft: c.staffDraft?.data || null,
    audit: (c.audit || []).map(({ t, ev, ip, by }) => ({ t, ev, ...(ip ? { ip } : {}), ...(by ? { by } : {}) })),
  };
}

/** Site bookings (Stripe) for the admin list: only what the owner needs. */
function bookingRow(b) {
  return {
    id: b.id,
    vehicleId: vehicleOf(b),
    bookingRef: b.bookingRef || "",
    status: b.status,
    createdAt: b.createdAt || null,
    startDate: b.startDate,
    endDate: b.endDate,
    pickupTime: b.pickupTime || null,
    returnTime: b.returnTime || null,
    nights: b.nights,
    totalWithIva: b.totalWithIva,
    depositAmount: b.depositAmount,
    remainingAmount: b.remainingAmount,
    prepaymentOption: b.prepaymentOption,
    guestName: [b.guestFirstName, b.guestLastName].filter(Boolean).join(" "),
    guestEmail: b.guestEmail || "",
    guestPhone: b.guestPhone || "",
    adults: b.adults,
    children: b.children,
    extraIds: b.extraIds || [],
    message: b.message || "",
    paymentIntentId: b.paymentIntentId || null,
  };
}

/** The check-in report fields printed on annex I-A (what the guest sees and signs). */
export function actaFields(a) {
  return {
    datetime: a.datetime || null,
    odometerKm: Number.isInteger(a.odometerKm) ? a.odometerKm : null,
    fuel: Number.isInteger(a.fuel) ? a.fuel : null,
    checklist: a.checklist || {},
    marks: a.marks || [],
    notes: a.notes || "",
    petsOnBoard: a.petsOnBoard ?? null,
    photos: (a.photos || []).map((p) => ({ id: p.id, takenAt: p.takenAt })),
  };
}

/** The same fields as a report patch (photos stay as they are). */
const actaPatch = (fields) => {
  const { photos: _photos, ...rest } = fields;
  return rest;
};

/** "YYYY-MM-DDTHH:mm" in Spain (the reports keep wall-clock times). */
export function spainWallClock(ms) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

const firstIp = (req) => String(req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();

export function createContractHandlers({
  store,
  provider, // { invite(contract, token) }
  sendCode, // (contract, code) => Promise
  sendSigned, // (contract, pdfBytes) => Promise
  loadBasePdf, // (contract) => Promise<Uint8Array>, the blank contract of its camper
  listBookings = async () => [], // site bookings, for the admin list
  onSigned = async () => {}, // (signedContract) => Promise, after the PDF is stored
  onSubmitted = async () => {}, // (contract) => Promise, the guest sent the data (owner notice)
  imports = null, // Yescapa email drafts: { list, get, save }
  importSetup = () => null, // () => { key, script } for the Gmail forwarder
  adminToken,
  sessionSecret = null, // guest-session key: staff log in with their site account
  env = process.env, // ADMIN_EMAILS / MANAGER_EMAILS
  secret,
  ownerSignerName = process.env.CONTRACT_OWNER_SIGNER || "Ivakhnenko Sergii",
  extractDocs = null, // (docs by slot) => {fields, warnings} | null; null: recognition switched off
  actas = null, // createActaStore(): the check-in report is annex I-A of the contract
  loadDiagram = async () => null, // (vehicle) => PNG of the camper outline, for the report PDF
  now = () => Date.now(),
}) {
  async function admin(req, res) {
    res.setHeader?.("Cache-Control", "no-store");
    if (!adminConfigured(adminToken, env)) return reply(res, 503, { error: "No admin access is configured", code: "admin_disabled" });
    const staff = adminAccess(req, { adminToken, sessionSecret, env, now: now() });
    if (!staff) return reply(res, 401, { error: "Unauthorized", code: "unauthorized" });
    const owner = staff.role === "owner";
    // Cookie-authenticated changes must come from our own page (JSON fetch), not a cross-site form.
    if (staff.via === "session" && req.method === "POST" && !/application\/json/i.test(String(req.headers?.["content-type"] || ""))) {
      return reply(res, 415, { error: "JSON only", code: "bad_content_type" });
    }
    try {
      if (req.method === "GET") {
        const id = typeof req.query?.id === "string" ? req.query.id : null;
        if (req.query?.view === "me") {
          const cfg = owner ? staffConfig(env) : null;
          return reply(res, 200, {
            role: staff.role,
            email: staff.email,
            via: staff.via,
            vehicles: staffVehicles(staff).map(vehicleRow),
            multiVehicle: activeVehicles().length > 1,
            // Owner only: who has access, straight from the environment.
            staff: cfg ? { admins: cfg.admins, managers: cfg.managers, token: !!adminToken } : null,
            ownerSignature: owner ? !!(await store.getOwnerSignature?.()) : null,
            ownerSignerName: owner ? ownerSignerName : null,
          });
        }
        if (req.query?.view === "calendar") {
          if (!owner) return forbidden(res);
          const feeds = activeVehicles().map((v) => ({ ...vehicleRow(v), url: calendarFeedUrl(siteUrl(), process.env, v.id) }));
          return reply(res, 200, { url: feeds[0]?.url || null, feeds });
        }
        if (req.query?.view === "imports") {
          const drafts = imports ? visibleTo(staff, (await imports.list()).filter((d) => d.status === "new"), draftVehicle) : [];
          return reply(res, 200, { imports: drafts, setup: owner ? importSetup() : null });
        }
        if (req.query?.view === "bookings") {
          const rows = visibleTo(staff, await listBookings(), vehicleOf).map(bookingRow).sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
          return reply(res, 200, { bookings: rows });
        }
        if (req.query?.view === "owner-signature") {
          if (!owner) return forbidden(res);
          const png = await store.getOwnerSignature?.();
          if (!png) return reply(res, 404, { error: "No signature yet", code: "not_found" });
          res.setHeader("Content-Type", "image/png");
          return res.status(200).send(png);
        }
        if (id && typeof req.query?.doc === "string") {
          if (!DOC_SLOTS.includes(req.query.doc)) return reply(res, 400, { error: "Unknown document", code: "bad_doc" });
          const found = await store.get(id);
          if (!found) return reply(res, 404, { error: "Not found", code: "not_found" });
          if (!canSee(staff, vehicleOf(found.contract))) return forbidden(res);
          const jpg = await store.getDoc(id, req.query.doc);
          if (!jpg) return reply(res, 404, { error: "No photo", code: "not_found" });
          res.setHeader("Content-Type", "image/jpeg");
          return res.status(200).send(jpg);
        }
        if (id && req.query?.detail) {
          const found = await store.get(id);
          if (!found) return reply(res, 404, { error: "Not found", code: "not_found" });
          if (!canSee(staff, vehicleOf(found.contract))) return forbidden(res);
          return reply(res, 200, { contract: adminDetail(found.contract) });
        }
        if (id && req.query?.pdf) {
          const found = await store.get(id);
          if (found && !canSee(staff, vehicleOf(found.contract))) return forbidden(res);
          // The copy with the return annex when there is one (?original=1: as signed at pickup).
          const pdf = found
            ? (!req.query.original && (await store.getFinalPdf?.(found.contract).catch(() => null))) || (await store.getPdf(found.contract))
            : null;
          if (!pdf) return reply(res, 404, { error: "No signed PDF", code: "not_found" });
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="contrato-${id}.pdf"`);
          return res.status(200).send(pdf);
        }
        return reply(res, 200, { contracts: visibleTo(staff, await store.list(), vehicleOf).map(adminRow) });
      }
      if (req.method !== "POST") return reply(res, 405, { error: "Method not allowed" });

      const body = req.body || {};
      const action = body.action || "create";
      if (action === "create") {
        // A manager works with his campers only; without a choice, his first one.
        const vehicleId = body.vehicleId || (owner ? undefined : staffVehicles(staff)[0]?.id);
        if (vehicleId && !canSee(staff, vehicleId)) return forbidden(res);
        if (!vehicleId && !owner) return forbidden(res);
        let draft = null;
        if (imports && typeof body.importId === "string" && body.importId) {
          draft = await imports.get(body.importId).catch(() => null);
          if (draft && !canSee(staff, draftVehicle(draft.draft))) return forbidden(res);
        }
        const { contract, token } = createContract({ ...body, vehicleId }, { now: now(), provider: provider.name });
        contract.tokenSeal = sealToken(token, secret);
        await store.save(contract);
        const link = signingLink(token, contract.language);
        let emailSent = true;
        try {
          await provider.invite(contract, token);
        } catch (err) {
          emailSent = false;
          console.error("invite email failed:", err.message);
        }
        if (draft) {
          await imports.save({ ...draft.draft, status: "done", contractId: contract.id }, { etag: draft.etag }).catch(() => {});
        }
        return reply(res, 201, { id: contract.id, link, emailSent });
      }
      if (action === "owner_signature") {
        if (!owner) return forbidden(res);
        const png = decodeSignaturePng(body.signature);
        await store.putOwnerSignature(png);
        return reply(res, 200, { ok: true });
      }
      if (action === "import_dismiss") {
        const d = imports ? await imports.get(String(body.importId || "")) : null;
        if (!d) return reply(res, 404, { error: "Not found", code: "not_found" });
        if (!canSee(staff, draftVehicle(d.draft))) return forbidden(res);
        await imports.save({ ...d.draft, status: "dismissed" }, { etag: d.etag });
        return reply(res, 200, { ok: true });
      }
      if (action === "resend" || action === "cancel") {
        const found = await store.get(String(body.id || ""));
        if (!found) return reply(res, 404, { error: "Not found", code: "not_found" });
        if (!canSee(staff, vehicleOf(found.contract))) return forbidden(res);
        if (action === "cancel") {
          if (!UNSIGNED_STATUSES.includes(found.contract.status)) throw new ContractError("not_pending", "Only an unsigned contract can be cancelled", 409);
          const cancelled = { ...found.contract, status: "cancelled", audit: [...found.contract.audit, { t: now(), ev: "cancelled" }] };
          await store.save(cancelled, { etag: found.etag });
          return reply(res, 200, { ok: true });
        }
        const reissued = reissueToken(found.contract, { now: now() });
        const token = reissued.token;
        const contract = { ...reissued.contract, tokenSeal: sealToken(token, secret) };
        await store.save(contract, { etag: found.etag });
        let emailSent = true;
        try {
          await provider.invite(contract, token);
        } catch (err) {
          emailSent = false;
          console.error("invite email failed:", err.message);
        }
        return reply(res, 200, { link: signingLink(token, contract.language), emailSent });
      }
      if (["verify", "unverify", "kiosk", "countersign", "doc", "draft"].includes(action)) {
        const found = await store.get(String(body.id || ""));
        if (!found) return reply(res, 404, { error: "Not found", code: "not_found" });
        if (!canSee(staff, vehicleOf(found.contract))) return forbidden(res);
        const staffName = owner ? ownerSignerName : String(body.name || "").trim().slice(0, 120) || staff.email || "";
        const t = now();
        // What staff typed so far at pickup, saved as they type: leaving the screen
        // (handover report, a call, a reload) must not lose it.
        if (action === "draft") {
          if (!OPEN_STATUSES.includes(found.contract.status)) return reply(res, 200, { ok: true, saved: false });
          const raw = body.data && typeof body.data === "object" ? body.data : {};
          const data = Object.fromEntries(
            Object.entries(raw)
              .filter(([k, v]) => /^[A-Za-z]{2,24}$/.test(k) && typeof v === "string")
              .slice(0, 30)
              .map(([k, v]) => [k, v.slice(0, 200)]),
          );
          await store.save({ ...found.contract, staffDraft: { at: t, by: staff.email || "admin-token", data } }, { etag: found.etag });
          return reply(res, 200, { ok: true, saved: true });
        }
        // Staff photograph the documents themselves (the guest sent nothing before pickup).
        if (action === "doc") {
          if (!OPEN_STATUSES.includes(found.contract.status)) throw new ContractError("not_open", "The data is already checked", 409);
          if (!DOC_SLOTS.includes(body.slot)) throw new ContractError("doc_invalid", "Unknown document side");
          await store.putDoc(found.contract.id, body.slot, decodeDocJpeg(body.image));
          return reply(res, 200, { ok: true, slot: body.slot });
        }
        if (action === "verify") {
          const data = validateSignData(body.data);
          const problem = signRuleProblems(data, found.contract)[0];
          if (problem) throw new ContractError(problem.code, `Rule failed: ${problem.field} ${problem.code}`);
          let base = found.contract;
          if (base.status === "pending") {
            // Typed by staff from the original documents at pickup: the photos are required too.
            const docHashes = {};
            for (const slot of DOC_SLOTS) {
              const jpg = await store.getDoc(base.id, slot);
              if (jpg) docHashes[slot] = sha256(jpg);
            }
            const missing = requiredDocSlots(data.docType).filter((slot) => !docHashes[slot]);
            if (missing.length) throw new ContractError("docs_required", `Missing document photos: ${missing.join(", ")}`);
            base = markSubmitted(base, { data, docHashes, ip: firstIp(req), userAgent: String(req.headers?.["user-agent"] || ""), now: t });
            base = { ...base, submission: { ...base.submission, byStaff: staff.email || "admin-token" } };
            base.audit[base.audit.length - 1] = { ...base.audit[base.audit.length - 1], ev: "filled_by_staff", by: staff.email || "admin-token" };
          }
          const verified = markVerified(base, { data, checks: body.checks || {}, by: staff.email || "admin-token", name: staffName, now: t });
          await store.save(verified, { etag: found.etag });
          return reply(res, 200, { contract: adminDetail(verified) });
        }
        if (action === "unverify") {
          // Back to the guest's data (e.g. the guest wants to change something before signing).
          if (!["verified", "guest_signed"].includes(found.contract.status)) throw new ContractError("not_verified", "Nothing to undo", 409);
          const back = {
            ...found.contract,
            status: "submitted",
            kiosk: null,
            otp: null,
            guestSignature: null,
            audit: [...found.contract.audit, { t, ev: "unverified", by: staff.email || "admin-token" }],
          };
          await store.save(back, { etag: found.etag });
          return reply(res, 200, { contract: adminDetail(back) });
        }
        if (action === "kiosk") {
          await requireCheckin(found.contract);
          const issued = issueKiosk(found.contract, { by: staff.email || "admin-token", now: t });
          await store.save(issued.contract, { etag: found.etag });
          return reply(res, 200, { url: `/sign/${issued.token}?lang=${found.contract.language}` });
        }
        // countersign: the lessor signs last; only now the PDF is built and sent.
        const c = found.contract;
        if (c.status !== "guest_signed") throw new ContractError("not_guest_signed", "The guest has not signed yet", 409);
        let ownerPng = null;
        if (body.signature) ownerPng = decodeSignaturePng(body.signature);
        else if (owner) ownerPng = await store.getOwnerSignature?.().catch(() => null);
        if (!ownerPng) throw new ContractError("signature_required", "Draw the lessor signature");
        const guestPng = await store.getSignature(c.id, "guest");
        if (!guestPng) throw new ContractError("signature_missing", "The guest signature is missing", 409);
        const data = c.verification.data;
        const docs = {};
        for (const slot of DOC_SLOTS) {
          const jpg = await store.getDoc(c.id, slot);
          if (jpg) docs[slot] = jpg;
        }
        const basePdfBytes = await loadBasePdf(c);
        const basePdfHash = sha256(basePdfBytes);
        const number = uniqueContractNumber(
          contractNumber(c.startDate, data.fullName, data.surname && data.fullName.toUpperCase().includes(data.surname.toUpperCase()) ? data.surname : ""),
          await store.list(),
          c.id,
        );
        const contractNow = { ...c, number };
        const acta = c.guestSignature.acta || null;
        const pdfBytes = await buildSignedPdf({
          basePdfBytes,
          contract: contractNow,
          data,
          signaturePng: guestPng,
          docs,
          owner: { name: staffName, signaturePng: ownerPng },
          acta,
          meta: {
            signedAt: t,
            guestSignedAt: c.guestSignature.at,
            verified: { at: c.verification.at, by: c.verification.by, name: c.verification.name },
            readAt: c.audit.find((a) => a.ev === "contract_read")?.t || null,
            ip: c.guestSignature.ip,
            userAgent: c.guestSignature.userAgent,
            basePdfHash,
            signatureHash: c.guestSignature.signatureHash,
            emailCode: c.guestSignature.emailCode !== false,
          },
        });
        const signed = markSigned(contractNow, {
          pdfHash: sha256(pdfBytes),
          basePdfHash,
          owner: { name: staffName, by: staff.email || "admin-token", signatureHash: sha256(ownerPng) },
          now: t,
        });
        await store.save(signed, { etag: found.etag });
        await store.putPdf(signed, pdfBytes);
        await store.putSignature(c.id, "lessor", ownerPng).catch(() => {});
        // The check-in report gets the same two signatures (it is annex I-A).
        if (actas && acta) {
          try {
            const current = await actas.get(c.id, "checkin");
            if (current?.acta?.status === "draft") {
              await signActa({
                actas,
                loadDiagram,
                contract: signed,
                kind: "checkin",
                by: staff.email || "admin-token",
                patch: { ...actaPatch(acta), staffName, guestName: data.fullName },
                staffSignature: ownerPng,
                guestSignature: guestPng,
                now,
              });
            }
          } catch (err) {
            console.error("check-in report signing failed:", err.message);
          }
        }
        try {
          await onSigned(signed);
        } catch (err) {
          console.error("after-sign check failed:", err.message);
        }
        let emails = [];
        try {
          emails = await sendSigned(signed, pdfBytes, openToken(c.tokenSeal, secret));
        } catch (err) {
          console.error("signed copy email failed:", err.message);
        }
        return reply(res, 200, { contract: adminDetail(signed), emailed: emails.length > 0 && emails.every((x) => x === "fulfilled") });
      }
      return reply(res, 400, { error: "Unknown action", code: "bad_action" });
    } catch (err) {
      return fail(res, err);
    }
  }

  /** The check-in report must have at least the mileage and the fuel before the signatures. */
  async function requireCheckin(contract) {
    const acta = actas ? (await actas.get(contract.id, "checkin"))?.acta : null;
    if (!acta || !Number.isInteger(acta.odometerKm) || !Number.isInteger(acta.fuel)) {
      throw new ContractError("acta_required", "Fill in the check-in report (mileage and fuel) first", 409);
    }
    return acta;
  }

  async function load(token) {
    const id = tokenId(token);
    if (!id) throw new ContractError("not_found", "Link not valid", 404);
    const found = await store.get(id);
    const via = found ? tokenKind(found.contract, token, now()) : null;
    if (!via) throw new ContractError("not_found", "Link not valid or expired", 404);
    return { ...found, via };
  }

  /** The kiosk (signature in person) only works on a device where staff is logged in. */
  function requireStaffHere(req, contract) {
    const staff = adminAccess(req, { adminToken, sessionSecret, env, now: now() });
    if (!staff || !canSee(staff, vehicleOf(contract))) {
      throw new ContractError("staff_session_required", "Open this page from the admin on the staff device", 403);
    }
    return staff;
  }

  async function guest(req, res) {
    try {
      if (req.method === "GET") {
        const found = await load(req.query?.token);
        const c = found.contract;
        // The signed copy, for the guest's booking page (the link from the email is the key).
        if (req.query?.pdf) {
          const pdf =
            c.status === "signed" && found.via === "guest"
              ? (await store.getFinalPdf?.(c).catch(() => null)) || (await store.getPdf(c))
              : null;
          if (!pdf) return reply(res, 404, { error: "No signed PDF", code: "not_found" });
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="contrato-alquiler-${c.number || c.id}.pdf"`);
          return res.status(200).send(pdf);
        }
        // First opening only, so the owner sees "opened" without a write per page view.
        if (found.via === "guest" && c.status === "pending" && !c.viewedAt) {
          const t = now();
          const viewed = { ...c, viewedAt: t, audit: [...c.audit, { t, ev: "viewed" }] };
          await store.save(viewed, { etag: found.etag }).catch(() => {});
        }
        const view = publicView(c);
        if (found.via === "guest" && c.status === "submitted") view.submitted = c.submission?.data || null;
        if (found.via === "kiosk") {
          const acta = actas ? (await actas.get(c.id, "checkin"))?.acta : null;
          view.kiosk = true;
          view.data = c.verification.data;
          view.verified = { at: c.verification.at, name: c.verification.name };
          view.acta = acta ? actaFields(acta) : null;
          view.email = c.email;
        }
        return reply(res, 200, { contract: view });
      }
      if (req.method !== "POST") return reply(res, 405, { error: "Method not allowed" });
      const body = req.body || {};
      const found = await load(body.token);
      const c = found.contract;
      const t = now();
      const guestOpen = () => {
        if (found.via !== "guest" || !OPEN_STATUSES.includes(c.status)) {
          throw new ContractError("not_open", "The data is already being checked", 409);
        }
      };

      // ── on the guest's own device, before pickup ──
      if (body.action === "doc") {
        guestOpen();
        if (!DOC_SLOTS.includes(body.slot)) throw new ContractError("doc_invalid", "Unknown document side");
        const jpg = decodeDocJpeg(body.image);
        await store.putDoc(c.id, body.slot, jpg);
        return reply(res, 200, { ok: true, slot: body.slot });
      }

      // The guest scrolled through the whole contract on the signing page (once).
      if (body.action === "read") {
        if (!c.audit.some((a) => a.ev === "contract_read")) {
          const read = { ...c, audit: [...c.audit, { t, ev: "contract_read", ...(found.via === "kiosk" ? { kiosk: true } : {}) }] };
          await store.save(read, { etag: found.etag });
        }
        return reply(res, 200, { ok: true });
      }

      // Read the uploaded document photos and suggest the form fields (guest checks them).
      if (body.action === "extract") {
        guestOpen();
        if (!extractDocs) return reply(res, 200, { ok: false, reason: "off" });
        const used = c.audit.filter((a) => a.ev === "docs_read").length;
        if (used >= 8) return reply(res, 200, { ok: false, reason: "limit" });
        const docs = {};
        for (const slot of DOC_SLOTS) {
          const jpg = await store.getDoc(c.id, slot);
          if (jpg) docs[slot] = jpg;
        }
        if (!Object.keys(docs).length) return reply(res, 200, { ok: false, reason: "no_photos" });
        let result = null;
        try {
          result = await extractDocs(docs);
        } catch (err) {
          console.error("document reading failed:", err.message);
        }
        const logged = { ...c, audit: [...c.audit, { t, ev: "docs_read", ok: !!result }] };
        await store.save(logged, { etag: found.etag }).catch(() => {});
        if (!result) return reply(res, 200, { ok: false, reason: "unread" });
        return reply(res, 200, { ok: true, ...result });
      }

      // Data + document photos sent; the signature happens at pickup, in person.
      if (body.action === "submit") {
        guestOpen();
        const data = validateSignData(body.data);
        const problem = signRuleProblems(data, c)[0];
        if (problem) throw new ContractError(problem.code, `Rule failed: ${problem.field} ${problem.code}`);
        const docHashes = {};
        for (const slot of DOC_SLOTS) {
          const jpg = await store.getDoc(c.id, slot);
          if (jpg) docHashes[slot] = sha256(jpg);
        }
        const missing = requiredDocSlots(data.docType).filter((slot) => !docHashes[slot]);
        if (missing.length) throw new ContractError("docs_required", `Missing document photos: ${missing.join(", ")}`);
        const submitted = markSubmitted(c, { data, docHashes, ip: firstIp(req), userAgent: String(req.headers?.["user-agent"] || ""), now: t });
        await store.save(submitted, { etag: found.etag });
        try {
          await onSubmitted(submitted);
        } catch (err) {
          console.error("submitted notice failed:", err.message);
        }
        return reply(res, 200, { ok: true });
      }

      // ── on the staff device, at pickup (kiosk link from the admin) ──
      if (body.action === "code" || body.action === "sign") {
        if (found.via !== "kiosk") throw new ContractError("in_person_required", "The contract is signed in person at pickup", 403);
        const staff = requireStaffHere(req, c);
        if (body.action === "code") {
          const issued = issueOtp(c, { now: t, secret });
          await store.save(issued.contract, { etag: found.etag });
          await sendCode(issued.contract, issued.code);
          return reply(res, 200, { sent: true, emailHint: publicView(issued.contract).emailHint });
        }
        const consents = requireConsents(body.consents);
        const signaturePng = decodeSignaturePng(body.signature);
        const acta = await requireCheckin(c);
        // The email code, unless the guest cannot open the mailbox at pickup: then the
        // identity rests on the original documents staff have just checked (logged).
        const noCode = body.noCode === true;
        if (!noCode) {
          const checked = checkOtp(c, body.code, { now: t, secret });
          if (!checked.ok) {
            if (checked.contract !== c) await store.save(checked.contract, { etag: found.etag });
            const status = checked.reason === "too_many_attempts" ? 429 : 400;
            throw new ContractError(checked.reason, `Code check failed: ${checked.reason}`, status);
          }
        }
        await store.putSignature(c.id, "guest", signaturePng);
        const guestSigned = markGuestSigned(c, {
          consents,
          signatureHash: sha256(signaturePng),
          ip: firstIp(req),
          userAgent: String(req.headers?.["user-agent"] || ""),
          staff: staff.email || "admin-token",
          now: t,
        });
        // What the guest saw on annex I-A when signing: the PDF is built from this copy.
        guestSigned.guestSignature.acta = { ...actaFields(acta), datetime: acta.datetime || spainWallClock(t) };
        guestSigned.guestSignature.emailCode = !noCode;
        if (noCode) guestSigned.audit.push({ t, ev: "signed_without_code", by: staff.email || "admin-token" });
        await store.save(guestSigned, { etag: found.etag });
        return reply(res, 200, { ok: true, id: c.id });
      }
      return reply(res, 400, { error: "Unknown action", code: "bad_action" });
    } catch (err) {
      return fail(res, err);
    }
  }

  return { admin, guest };
}
