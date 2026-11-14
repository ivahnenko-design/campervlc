// HTTP handlers of the electronic contract: an owner-only admin endpoint (create
// a contract for a booking, e.g. from Yescapa, resend the link, download the
// signed PDF) and the guest endpoint behind /sign/:token (read, email code, sign).
// Dependencies are injected so tests run without Blob, Resend or the network.
import { timingSafeEqual } from "node:crypto";
import {
  ContractError,
  checkOtp,
  createContract,
  decodeSignaturePng,
  issueOtp,
  markSigned,
  matchesToken,
  publicView,
  reissueToken,
  requireConsents,
  sha256,
  tokenId,
  validateSignData,
} from "./contracts.js";
import { buildSignedPdf } from "./contract-pdf.js";
import { signingLink } from "./contract-email.js";

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

function adminOk(req, adminToken) {
  if (!adminToken) return false;
  const given = Buffer.from(String(req.headers?.["x-admin-token"] || ""));
  const want = Buffer.from(adminToken);
  return given.length === want.length && timingSafeEqual(given, want);
}

function adminRow(c) {
  return {
    id: c.id,
    status: c.status,
    guestName: c.guestName,
    email: c.email,
    source: c.source,
    bookingRef: c.bookingRef,
    startDate: c.startDate,
    endDate: c.endDate,
    createdAt: c.createdAt,
    signedAt: c.signed?.at || null,
    language: c.language,
    provider: c.provider,
  };
}

const firstIp = (req) => String(req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();

export function createContractHandlers({
  store,
  provider, // { invite(contract, token) }
  sendCode, // (contract, code) => Promise
  sendSigned, // (contract, pdfBytes) => Promise
  loadBasePdf, // () => Promise<Uint8Array>
  adminToken,
  secret,
  now = () => Date.now(),
}) {
  async function admin(req, res) {
    if (!adminToken) return reply(res, 503, { error: "ADMIN_TOKEN is not configured", code: "admin_disabled" });
    if (!adminOk(req, adminToken)) return reply(res, 401, { error: "Unauthorized", code: "unauthorized" });
    try {
      if (req.method === "GET") {
        const id = typeof req.query?.id === "string" ? req.query.id : null;
        if (id && req.query?.pdf) {
          const found = await store.get(id);
          const pdf = found ? await store.getPdf(found.contract) : null;
          if (!pdf) return reply(res, 404, { error: "No signed PDF", code: "not_found" });
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="contrato-${id}.pdf"`);
          return res.status(200).send(pdf);
        }
        return reply(res, 200, { contracts: (await store.list()).map(adminRow) });
      }
      if (req.method !== "POST") return reply(res, 405, { error: "Method not allowed" });

      const body = req.body || {};
      const action = body.action || "create";
      if (action === "create") {
        const { contract, token } = createContract(body, { now: now(), provider: provider.name });
        await store.save(contract);
        const link = signingLink(token, contract.language);
        let emailSent = true;
        try {
          await provider.invite(contract, token);
        } catch (err) {
          emailSent = false;
          console.error("invite email failed:", err.message);
        }
        return reply(res, 201, { id: contract.id, link, emailSent });
      }
      if (action === "resend" || action === "cancel") {
        const found = await store.get(String(body.id || ""));
        if (!found) return reply(res, 404, { error: "Not found", code: "not_found" });
        if (action === "cancel") {
          if (found.contract.status !== "pending") throw new ContractError("not_pending", "Only a pending contract can be cancelled", 409);
          const cancelled = { ...found.contract, status: "cancelled", audit: [...found.contract.audit, { t: now(), ev: "cancelled" }] };
          await store.save(cancelled, { etag: found.etag });
          return reply(res, 200, { ok: true });
        }
        const { contract, token } = reissueToken(found.contract, { now: now() });
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
      return reply(res, 400, { error: "Unknown action", code: "bad_action" });
    } catch (err) {
      return fail(res, err);
    }
  }

  async function load(token) {
    const id = tokenId(token);
    if (!id) throw new ContractError("not_found", "Link not valid", 404);
    const found = await store.get(id);
    if (!found || !matchesToken(found.contract, token, now())) throw new ContractError("not_found", "Link not valid or expired", 404);
    return found;
  }

  async function guest(req, res) {
    try {
      if (req.method === "GET") {
        const { contract } = await load(req.query?.token);
        return reply(res, 200, { contract: publicView(contract) });
      }
      if (req.method !== "POST") return reply(res, 405, { error: "Method not allowed" });
      const body = req.body || {};
      const found = await load(body.token);
      const t = now();

      if (body.action === "code") {
        const issued = issueOtp(found.contract, { now: t, secret });
        await store.save(issued.contract, { etag: found.etag });
        await sendCode(issued.contract, issued.code);
        return reply(res, 200, { sent: true, emailHint: publicView(issued.contract).emailHint });
      }

      if (body.action === "sign") {
        if (found.contract.status !== "pending") throw new ContractError("not_pending", "Already signed", 409);
        const data = validateSignData(body.data);
        const consents = requireConsents(body.consents);
        const signaturePng = decodeSignaturePng(body.signature);
        const checked = checkOtp(found.contract, body.code, { now: t, secret });
        if (!checked.ok) {
          if (checked.contract !== found.contract) await store.save(checked.contract, { etag: found.etag });
          const status = checked.reason === "too_many_attempts" ? 429 : 400;
          throw new ContractError(checked.reason, `Code check failed: ${checked.reason}`, status);
        }
        const basePdfBytes = await loadBasePdf();
        const basePdfHash = sha256(basePdfBytes);
        const signatureHash = sha256(signaturePng);
        const ip = firstIp(req);
        const userAgent = String(req.headers?.["user-agent"] || "");
        const pdfBytes = await buildSignedPdf({
          basePdfBytes,
          contract: found.contract,
          data,
          signaturePng,
          meta: { signedAt: t, ip, userAgent, basePdfHash, signatureHash },
        });
        const signed = markSigned(found.contract, {
          data,
          consents,
          signatureHash,
          pdfHash: sha256(pdfBytes),
          basePdfHash,
          ip,
          userAgent,
          now: t,
        });
        // The record first (with the etag guard): a second submit loses the race here
        // and never produces a second PDF.
        await store.save(signed, { etag: found.etag });
        await store.putPdf(signed, pdfBytes);
        let emails = [];
        try {
          emails = await sendSigned(signed, pdfBytes);
        } catch (err) {
          console.error("signed copy email failed:", err.message);
        }
        return reply(res, 200, { ok: true, emailed: emails.every((s) => s === "fulfilled") });
      }
      return reply(res, 400, { error: "Unknown action", code: "bad_action" });
    } catch (err) {
      return fail(res, err);
    }
  }

  return { admin, guest };
}
