// Short-lived session token handed out by a successful booking lookup
// (reference + email). Preview/apply calls present it instead of the
// reference/email pair, so the only endpoint that can be used to guess a
// booking is /api/manage-booking — the one the Vercel Firewall rate-limits.
import { createHmac, timingSafeEqual } from "node:crypto";

export const TOKEN_TTL_MS = 30 * 60_000;

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function sign(payload, secret) {
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

export function issueToken(bookingId, nowMs, secret) {
  if (!secret) throw new Error("MANAGE_BOOKING_SECRET is not set");
  const payload = b64url(JSON.stringify({ b: bookingId, exp: nowMs + TOKEN_TTL_MS }));
  return `${payload}.${sign(payload, secret)}`;
}

/** @returns bookingId, or null when the token is malformed, forged or expired. */
export function verifyToken(token, nowMs, secret) {
  if (!secret || typeof token !== "string") return null;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return null;
  const expected = sign(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { b: bookingId, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof bookingId !== "string" || typeof exp !== "number" || exp <= nowMs) return null;
    return bookingId;
  } catch {
    return null;
  }
}
