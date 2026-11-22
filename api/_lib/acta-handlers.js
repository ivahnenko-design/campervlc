// HTTP handler of the handover reports (/api/contract?scope=acta). Staff only
// (site account in ADMIN_EMAILS / MANAGER_EMAILS, or the legacy x-admin-token);
// a manager works only with the contracts of his campers.
//   GET  ?contractId=…                      contract + both actas (+ prefill for a new one)
//   GET  ?view=summary                      status of every visible acta (admin list)
//   GET  ?contractId=…&kind=…&photo=<id>    one photo (thumbnail; &full=1 for the original)
//   GET  ?contractId=…&kind=…&pdf=1         the signed PDF
//   POST {action:"save", contractId, kind, acta:{…partial}}   draft autosave
//   POST {action:"photo", contractId, kind, data, thumb, takenAt}  one JPEG per request
//   POST {action:"photo_delete", contractId, kind, photoId}
//   POST {action:"sign", contractId, kind, acta?, staffSignature, guestSignature}
//   POST {action:"email", contractId, kind}  send the signed PDF again
// Dependencies are injected so tests run without Blob, Resend or the network.
import { ContractError, decodeSignaturePng, sha256, vehicleView } from "./contracts.js";
import {
  ActaConflictError,
  MAX_PHOTOS,
  MAX_THUMB_BYTES,
  actaView,
  applyPatch,
  decodeJpeg,
  isContractId,
  isKind,
  isPhotoId,
  newActa,
  newPhotoId,
  requireSignable,
  validateActaPatch,
} from "./actas.js";
import { buildActaPdf } from "./acta-pdf.js";
import { actaFileName } from "./acta-email.js";
import { adminAccess, adminConfigured, canSee, visibleTo } from "./staff.js";
import { dayRateFor, kmPlanFromExtras } from "../../shared/acta.js";
import { getVehicle, vehicleOf } from "../../shared/vehicles.js";

const reply = (res, status, body) => res.status(status).json(body);

function fail(res, err) {
  if (err instanceof ContractError) return reply(res, err.status, { error: err.message, code: err.code });
  if (err instanceof ActaConflictError) return reply(res, 409, { error: err.message, code: "conflict" });
  console.error("acta handler failed:", err);
  return reply(res, 500, { error: "Internal error", code: "internal" });
}

/** The booking of a contract (for its extras): by reference, else same guest email, camper and start. */
export function bookingForContract(contract, bookings) {
  const ref = String(contract.bookingRef || "").trim().toUpperCase();
  const live = bookings.filter((b) => b && b.status !== "cancelled" && vehicleOf(b) === vehicleOf(contract));
  return (
    (ref && live.find((b) => String(b.bookingRef || "").toUpperCase() === ref)) ||
    live.find((b) => String(b.guestEmail || "").toLowerCase() === contract.email && b.startDate === contract.startDate) ||
    null
  );
}

const contractView = (c) => ({
  id: c.id,
  status: c.status,
  guestName: c.guestName,
  email: c.email,
  phone: c.phone || "",
  language: c.language,
  bookingRef: c.bookingRef || "",
  startDate: c.startDate,
  endDate: c.endDate,
  pickupTime: c.pickupTime,
  returnTime: c.returnTime,
});

export function createActaHandler({
  actas, // createActaStore()
  contracts, // createContractStore()
  listBookings = async () => [],
  loadDiagram = async () => null, // (vehicle) => Uint8Array PNG or null
  sendEmails = async () => [], // (contract, acta, pdfBytes) => statuses
  adminToken,
  sessionSecret = null,
  env = process.env,
  now = () => Date.now(),
}) {
  async function contractFor(staff, contractId) {
    if (!isContractId(contractId)) throw new ContractError("not_found", "Contract not found", 404);
    const found = await contracts.get(contractId);
    if (!found) throw new ContractError("not_found", "Contract not found", 404);
    if (!canSee(staff, vehicleOf(found.contract))) throw new ContractError("forbidden", "Not your camper", 403);
    return found.contract;
  }

  async function prefill(contract) {
    const booking = bookingForContract(contract, await listBookings().catch(() => []));
    const extras = (booking?.extraIds || []).filter((id) => id !== "cleaning_fee");
    return { extras, kmPlan: kmPlanFromExtras(extras), bookingRef: booking?.bookingRef || null };
  }

  /** get -> change -> save with the etag; retried when someone saved in between. */
  async function mutate(contract, kind, staff, change) {
    for (let attempt = 0; ; attempt++) {
      const found = await actas.get(contract.id, kind);
      let acta = found?.acta;
      if (!acta) {
        if (contract.status === "cancelled") throw new ContractError("contract_cancelled", "The contract is cancelled", 409);
        const p = await prefill(contract);
        acta = newActa(contract, kind, { vehicleId: vehicleOf(contract), extras: p.extras, staffEmail: staff.email, now: now() });
      }
      const next = await change(acta);
      try {
        await actas.save(next, { etag: found?.etag });
        return next;
      } catch (err) {
        if (!(err instanceof ActaConflictError) || attempt >= 2) throw err;
      }
    }
  }

  async function get(req, res, staff) {
    const q = req.query || {};
    if (q.view === "summary") {
      const rows = visibleTo(staff, await actas.list(), (a) => a.vehicleId).map((a) => ({
        contractId: a.contractId,
        kind: a.kind,
        status: a.status,
        updatedAt: a.updatedAt,
        signedAt: a.signatures?.guest?.at || null,
      }));
      return reply(res, 200, { actas: rows });
    }
    const contract = await contractFor(staff, q.contractId);
    if (q.kind !== undefined || q.photo || q.pdf) {
      if (!isKind(q.kind)) throw new ContractError("bad_kind", "Unknown kind");
      const found = await actas.get(contract.id, q.kind);
      if (!found) throw new ContractError("not_found", "No report yet", 404);
      if (q.photo) {
        const p = isPhotoId(q.photo) && found.acta.photos.find((x) => x.id === q.photo);
        const bytes = p ? await actas.getPhoto(contract.id, q.kind, p.id, { thumb: !q.full }) : null;
        if (!bytes) throw new ContractError("not_found", "Photo not found", 404);
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "private, max-age=86400");
        return res.status(200).send(bytes);
      }
      if (q.pdf) {
        const pdf = found.acta.pdf ? await actas.getFile(found.acta.pdf.path) : null;
        if (!pdf) throw new ContractError("not_found", "No signed PDF", 404);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${actaFileName(found.acta)}"`);
        return res.status(200).send(pdf);
      }
      return reply(res, 200, { acta: actaView(found.acta) });
    }
    const [checkin, checkout] = await Promise.all([actas.get(contract.id, "checkin"), actas.get(contract.id, "checkout")]);
    const v = getVehicle(vehicleOf(contract));
    return reply(res, 200, {
      contract: contractView(contract),
      vehicle: { ...vehicleView(contract), diagram: v?.diagram || null },
      checkin: actaView(checkin?.acta) || null,
      checkout: actaView(checkout?.acta) || null,
      prefill: checkin && checkout ? null : await prefill(contract),
      dayRate: dayRateFor(contract.endDate),
    });
  }

  async function sign(body, staff, contract, kind) {
    const staffSignature = decodeSignaturePng(body.staffSignature);
    const guestSignature = decodeSignaturePng(body.guestSignature);
    const patch = body.acta ? validateActaPatch(body.acta) : {};
    for (let attempt = 0; ; attempt++) {
      const found = await actas.get(contract.id, kind);
      if (!found) throw new ContractError("not_found", "Save the report first", 404);
      const t = now();
      const draft = applyPatch(found.acta, patch, { by: staff.email, now: t });
      const checkin = kind === "checkout" ? (await actas.get(contract.id, "checkin"))?.acta || null : null;
      requireSignable(draft, { checkin });
      const vehicle = getVehicle(draft.vehicleId);
      const diagramBytes = vehicle?.diagram ? await loadDiagram(vehicle).catch(() => null) : null;
      const thumbs = [];
      for (const p of draft.photos.slice(0, 12)) {
        const bytes = await actas.getPhoto(contract.id, kind, p.id, { thumb: true }).catch(() => null);
        if (bytes) thumbs.push({ bytes, takenAt: p.takenAt });
      }
      const signatures = {
        staff: { name: draft.staffName, at: t, email: staff.email, sha256: sha256(staffSignature) },
        guest: { name: draft.guestName, at: t, sha256: sha256(guestSignature) },
      };
      const signedDraft = { ...draft, signatures };
      const pdfBytes = await buildActaPdf({
        acta: signedDraft,
        checkin,
        contract,
        vehicle: vehicleView(contract),
        diagram: diagramBytes ? { bytes: diagramBytes } : null,
        staffSignature,
        guestSignature,
        photos: thumbs,
        dayRate: dayRateFor(contract.endDate),
      });
      const hash = sha256(pdfBytes);
      // Files first under names unique to this PDF, then the record with the etag
      // guard: a second submit loses the race and never replaces the signed files.
      const base = `${draft.id}-${hash.slice(0, 12)}`;
      const [pdfPath, staffPath, guestPath] = await Promise.all([
        actas.putFile(`pdf/${base}.pdf`, pdfBytes, "application/pdf"),
        actas.putFile(`sig/${base}-staff.png`, staffSignature, "image/png"),
        actas.putFile(`sig/${base}-guest.png`, guestSignature, "image/png"),
      ]);
      const signed = {
        ...signedDraft,
        status: "signed",
        signatures: { staff: { ...signatures.staff, path: staffPath }, guest: { ...signatures.guest, path: guestPath } },
        pdf: { path: pdfPath, sha256: hash, at: t, size: pdfBytes.length },
        audit: [...(draft.audit || []), { t, ev: "signed", by: staff.email }],
      };
      try {
        await actas.save(signed, { etag: found.etag });
        return { signed, pdfBytes };
      } catch (err) {
        if (!(err instanceof ActaConflictError) || attempt >= 1) throw err;
      }
    }
  }

  async function emailSigned(contract, acta, pdfBytes, staff) {
    let statuses = [];
    try {
      statuses = await sendEmails(contract, acta, pdfBytes);
    } catch (err) {
      console.error("acta email failed:", err.message);
    }
    const emailed = statuses.length > 0 && statuses.every((s) => s === "fulfilled");
    // Best effort: the audit line must not turn a signed report into an error.
    await mutate(contract, acta.kind, staff, (a) => ({ ...a, audit: [...(a.audit || []), { t: now(), ev: emailed ? "emailed" : "email_failed", by: staff.email }] })).catch(() => {});
    return emailed;
  }

  async function post(req, res, staff) {
    const body = req.body || {};
    const contract = await contractFor(staff, body.contractId);
    const kind = body.kind;
    if (!isKind(kind)) throw new ContractError("bad_kind", "Unknown kind");
    const t = now();

    if (body.action === "save") {
      const patch = validateActaPatch(body.acta || {});
      const acta = await mutate(contract, kind, staff, (a) => applyPatch(a, patch, { by: staff.email, now: t }));
      return reply(res, 200, { acta: actaView(acta) });
    }
    if (body.action === "photo") {
      const bytes = decodeJpeg(body.data);
      const thumb = decodeJpeg(body.thumb, MAX_THUMB_BYTES);
      const at = Number(body.takenAt);
      const takenAt = Number.isFinite(at) && at > t - 7 * 86_400_000 && at < t + 300_000 ? Math.round(at) : t;
      const id = newPhotoId();
      const existing = await actas.get(contract.id, kind);
      if (existing && existing.acta.status !== "draft") throw new ContractError("acta_signed", "Already signed", 409);
      if (existing && existing.acta.photos.length >= MAX_PHOTOS) throw new ContractError("too_many_photos", `At most ${MAX_PHOTOS} photos`, 409);
      await actas.putPhoto(contract.id, kind, id, bytes);
      await actas.putPhoto(contract.id, kind, id, thumb, { thumb: true });
      const acta = await mutate(contract, kind, staff, (a) => {
        if (a.status !== "draft") throw new ContractError("acta_signed", "Already signed", 409);
        if (a.photos.length >= MAX_PHOTOS) throw new ContractError("too_many_photos", `At most ${MAX_PHOTOS} photos`, 409);
        return { ...a, updatedAt: t, photos: [...a.photos, { id, takenAt, size: bytes.length, by: staff.email }] };
      });
      return reply(res, 200, { photo: { id, takenAt, size: bytes.length }, count: acta.photos.length });
    }
    if (body.action === "photo_delete") {
      if (!isPhotoId(body.photoId)) throw new ContractError("not_found", "Photo not found", 404);
      const acta = await mutate(contract, kind, staff, (a) => {
        if (a.status !== "draft") throw new ContractError("acta_signed", "Already signed", 409);
        return { ...a, updatedAt: t, photos: a.photos.filter((p) => p.id !== body.photoId) };
      });
      return reply(res, 200, { acta: actaView(acta) });
    }
    if (body.action === "sign") {
      const { signed, pdfBytes } = await sign(body, staff, contract, kind);
      const emailed = await emailSigned(contract, signed, pdfBytes, staff);
      return reply(res, 200, { acta: actaView(signed), emailed });
    }
    if (body.action === "email") {
      const found = await actas.get(contract.id, kind);
      if (!found || found.acta.status !== "signed") throw new ContractError("not_signed", "Not signed yet", 409);
      const pdf = await actas.getFile(found.acta.pdf?.path);
      if (!pdf) throw new ContractError("not_found", "No signed PDF", 404);
      return reply(res, 200, { emailed: await emailSigned(contract, found.acta, pdf, staff) });
    }
    return reply(res, 400, { error: "Unknown action", code: "bad_action" });
  }

  return async function actaHandler(req, res) {
    res.setHeader?.("Cache-Control", "no-store");
    if (!adminConfigured(adminToken, env)) return reply(res, 503, { error: "No admin access is configured", code: "admin_disabled" });
    const staff = adminAccess(req, { adminToken, sessionSecret, env, now: now() });
    if (!staff) return reply(res, 401, { error: "Unauthorized", code: "unauthorized" });
    if (staff.via === "session" && req.method === "POST" && !/application\/json/i.test(String(req.headers?.["content-type"] || ""))) {
      return reply(res, 415, { error: "JSON only", code: "bad_content_type" });
    }
    try {
      if (req.method === "GET") return await get(req, res, staff);
      if (req.method === "POST") return await post(req, res, staff);
      return reply(res, 405, { error: "Method not allowed" });
    } catch (err) {
      return fail(res, err);
    }
  };
}
