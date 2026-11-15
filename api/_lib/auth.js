// Guest accounts: one JSON record per user in Vercel Blob, keyed by a hash of the
// email, so the email code, Google and passkeys all land on the same account.
// Sessions are a signed cookie (no session store). A logged-in guest gets the
// member discount (MEMBER_DISCOUNT_PCT in shared/pricing.js) on the FIRST booking only:
// the webhook stamps memberDiscountUsedAt on the account once that booking is paid.
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { blobStore } from "./blob.js";

export const USERS_PREFIX = process.env.USERS_BLOB_PREFIX || "campervlc-users/";
export const SESSION_COOKIE = "cv_session";
export const CHALLENGE_COOKIE = "cv_wa";
export const SESSION_TTL_MS = 30 * 24 * 3_600_000;
export const CHALLENGE_TTL_MS = 5 * 60_000;
export const CODE_TTL_MS = 10 * 60_000;
export const CODE_RESEND_MS = 60_000;
export const CODE_MAX_ATTEMPTS = 5;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class AuthError extends Error {
  constructor(code, status = 400, message) {
    super(message || code);
    this.code = code;
    this.status = status;
  }
}

export const normEmail = (e) => (typeof e === "string" ? e.trim().toLowerCase().slice(0, 160) : "");
export const userIdFor = (email) => createHash("sha256").update(`user:${normEmail(email)}`).digest("hex").slice(0, 32);
export const isEmail = (e) => EMAIL.test(normEmail(e));

const b64 = (s) => Buffer.from(s).toString("base64url");
const sign = (payload, secret) => createHmac("sha256", secret).update(payload).digest("base64url");
function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// ── signed values (session + passkey challenge) ─────────────────────────────

export function sealValue(obj, secret) {
  if (!secret) throw new AuthError("secret_missing", 500, "AUTH_SECRET is not set");
  const payload = b64(JSON.stringify(obj));
  return `${payload}.${sign(payload, secret)}`;
}

export function openValue(value, secret, now = Date.now()) {
  if (!secret || typeof value !== "string") return null;
  const [payload, sig, extra] = value.split(".");
  if (!payload || !sig || extra !== undefined || !safeEqual(sig, sign(payload, secret))) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof obj.exp === "number" && obj.exp > now ? obj : null;
  } catch {
    return null;
  }
}

export function parseCookies(header = "") {
  const out = {};
  for (const part of String(header).split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(name, value, { maxAgeMs, secure = true } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (secure) parts.push("Secure");
  parts.push(`Max-Age=${Math.max(0, Math.floor((maxAgeMs ?? 0) / 1000))}`);
  return parts.join("; ");
}

/** The logged-in user from a request, or null. Used by checkout for the discount. */
export function sessionFromRequest(req, secret, now = Date.now()) {
  const s = openValue(parseCookies(req.headers?.cookie)[SESSION_COOKIE], secret, now);
  return s && typeof s.u === "string" ? { userId: s.u, email: s.e, name: s.n || "" } : null;
}

export function newSession(user, now = Date.now()) {
  return { u: user.id, e: user.email, n: user.name || "", exp: now + SESSION_TTL_MS };
}

// ── users ───────────────────────────────────────────────────────────────────

export function newUser(email, now = Date.now()) {
  const e = normEmail(email);
  return {
    id: userIdFor(e),
    email: e,
    name: "",
    createdAt: now,
    lastLoginAt: null,
    google: null,
    passkeys: [],
    loginCode: null,
    logins: [],
    memberDiscountUsedAt: null,
  };
}

/** True while the account has not used its first-booking discount. Unknown accounts are not eligible. */
export const memberEligible = (user) => !!user && !user.memberDiscountUsedAt;

export function recordLogin(user, method, now = Date.now()) {
  return { ...user, lastLoginAt: now, loginCode: null, logins: [{ t: now, method }, ...(user.logins || [])].slice(0, 20) };
}

/** What the browser may know about the logged-in user. */
export function publicUser(user) {
  return {
    email: user.email,
    name: user.name || "",
    passkeys: (user.passkeys || []).map((p) => ({ id: p.id, createdAt: p.createdAt, device: p.device || "" })),
    google: !!user.google,
    discountAvailable: memberEligible(user),
  };
}

const codeHash = (secret, id, code) => createHmac("sha256", secret).update(`login:${id}:${code}`).digest("hex");

export function issueLoginCode(user, { now = Date.now(), secret }) {
  if (user.loginCode && now - user.loginCode.sentAt < CODE_RESEND_MS) throw new AuthError("code_too_soon", 429);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  return { code, user: { ...user, loginCode: { hash: codeHash(secret, user.id, code), exp: now + CODE_TTL_MS, sentAt: now, attempts: 0 } } };
}

/** @returns {{ ok: boolean, reason?: string, user: object }} */
export function checkLoginCode(user, code, { now = Date.now(), secret }) {
  const c = user?.loginCode;
  if (!c) return { ok: false, reason: "no_code", user };
  if (c.exp <= now) return { ok: false, reason: "code_expired", user };
  if (c.attempts >= CODE_MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts", user };
  if (!safeEqual(c.hash, codeHash(secret, user.id, String(code ?? "").replace(/\D/g, "").slice(0, 6)))) {
    return { ok: false, reason: "code_wrong", user: { ...user, loginCode: { ...c, attempts: c.attempts + 1 } } };
  }
  return { ok: true, user };
}

// ── Google ──────────────────────────────────────────────────────────────────

/**
 * Checks a Google Identity Services ID token with Google's tokeninfo endpoint.
 * @returns {{ email: string, name: string, sub: string }}
 */
export async function verifyGoogleCredential(credential, { clientId, fetchImpl = fetch, now = Date.now() }) {
  if (!clientId) throw new AuthError("google_disabled", 503);
  if (typeof credential !== "string" || credential.length > 4096) throw new AuthError("google_invalid");
  const res = await fetchImpl(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!res.ok) throw new AuthError("google_invalid");
  const t = await res.json();
  const issOk = t.iss === "accounts.google.com" || t.iss === "https://accounts.google.com";
  const fresh = Number(t.exp) * 1000 > now;
  const verified = t.email_verified === true || t.email_verified === "true";
  if (t.aud !== clientId || !issOk || !fresh || !verified || !isEmail(t.email)) throw new AuthError("google_invalid");
  return { email: normEmail(t.email), name: String(t.name || "").slice(0, 120), sub: String(t.sub) };
}

// ── storage ─────────────────────────────────────────────────────────────────

export function createUserStore({ prefix = USERS_PREFIX } = {}) {
  const path = (id) => `${prefix}${id}.json`;
  return {
    async get(id) {
      const r = await blobStore.readJson(path(id));
      return r ? { user: r.data, etag: r.etag } : null;
    },
    async save(user, { etag } = {}) {
      await blobStore.put(path(user.id), user, etag ? { ifMatch: etag } : {});
    },
  };
}

export function createMemoryUserStore() {
  const rows = new Map();
  return {
    rows,
    async get(id) {
      return rows.has(id) ? { user: JSON.parse(rows.get(id)), etag: "e" } : null;
    },
    async save(user) {
      rows.set(user.id, JSON.stringify(user));
    },
  };
}
