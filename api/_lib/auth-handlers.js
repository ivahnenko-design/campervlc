// One handler for every guest-account action (/api/auth?action=...):
//   GET  me                     current user (or null) + public config
//   POST email-code / email-verify   one-time code by email
//   POST google                 Google Identity Services ID token
//   POST passkey-login-options / passkey-login
//   POST passkey-register-options / passkey-register   (needs a session)
//   POST logout
// Dependencies are injected so tests run without Blob, Resend, Google or a browser.
import {
  AuthError,
  CHALLENGE_COOKIE,
  CHALLENGE_TTL_MS,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  checkLoginCode,
  cookie,
  isEmail,
  issueLoginCode,
  newSession,
  newUser,
  normEmail,
  openValue,
  parseCookies,
  publicUser,
  recordLogin,
  sealValue,
  sessionFromRequest,
  userIdFor,
} from "./auth.js";

const ALLOWED_HOSTS = /^(www\.)?campervlc\.com$|^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/;

/** rpID and origin for WebAuthn, only for our own hosts. */
export function relyingParty(req) {
  const host = String(req.headers?.host || "").toLowerCase();
  if (!ALLOWED_HOSTS.test(host)) throw new AuthError("bad_host", 400);
  const hostname = host.replace(/:\d+$/, "");
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  return {
    rpID: local ? hostname : "campervlc.com",
    origins: local ? [`http://${host}`] : ["https://campervlc.com", "https://www.campervlc.com"],
    secure: !local,
  };
}

const deviceOf = (ua = "") =>
  /iPhone|iPad/.test(ua) ? "iPhone / iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "";

export function createAuthHandlers({
  users, // { get(id), save(user, {etag}) }
  webauthn, // { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse }
  verifyGoogle, // (credential) => Promise<{email, name, sub}>
  sendCode, // (email, code, lang) => Promise
  secret,
  googleClientId,
  discountPct,
  allow = async () => true, // (key, {limit, windowMs}) => Promise<boolean>
  ipOf = () => "unknown",
  discountTaken = async () => false, // (email) => Promise<boolean>
  now = () => Date.now(),
}) {
  /** publicUser, with the discount hidden when this mailbox already had it. */
  async function view(user) {
    const pub = publicUser(user);
    if (pub.discountAvailable && (await discountTaken(user.email))) pub.discountAvailable = false;
    return pub;
  }

  function setSession(res, user, secure) {
    res.setHeader("Set-Cookie", cookie(SESSION_COOKIE, sealValue(newSession(user, now()), secret), { maxAgeMs: SESSION_TTL_MS, secure }));
  }

  async function loadOrCreate(email) {
    const found = await users.get(userIdFor(email));
    return found || { user: newUser(email, now()), etag: undefined };
  }

  async function login(res, found, method, secure, patch = {}) {
    const user = recordLogin({ ...found.user, ...patch }, method, now());
    await users.save(user, { etag: found.etag });
    setSession(res, user, secure);
    return view(user);
  }

  async function sessionUser(req) {
    const s = sessionFromRequest(req, secret, now());
    if (!s) return null;
    return users.get(s.userId);
  }

  const actions = {
    async me(req) {
      const found = await sessionUser(req);
      return { user: found ? await view(found.user) : null, discountPct, googleClientId: googleClientId || null };
    },

    async "email-code"(req) {
      const email = normEmail(req.body?.email);
      if (!isEmail(email)) throw new AuthError("email_invalid");
      // Each request emails an address of the caller's choosing: cap it per
      // network so the site can not be used to flood mailboxes.
      if (!(await allow(`email-code:${ipOf(req)}`, { limit: 8, windowMs: 3_600_000 }))) {
        throw new AuthError("too_many_requests", 429);
      }
      const found = await loadOrCreate(email);
      const { code, user } = issueLoginCode(found.user, { now: now(), secret });
      await users.save(user, { etag: found.etag });
      await sendCode(email, code, String(req.body?.lang || "en"));
      return { sent: true };
    },

    async "email-verify"(req, res, rp) {
      const email = normEmail(req.body?.email);
      const found = await users.get(userIdFor(email));
      if (!found) throw new AuthError("no_code");
      if (!(await allow(`email-verify:${ipOf(req)}`, { limit: 30, windowMs: 3_600_000 }))) {
        throw new AuthError("too_many_attempts", 429);
      }
      const r = checkLoginCode(found.user, req.body?.code, { now: now(), secret });
      if (!r.ok) {
        if (r.user !== found.user) await users.save(r.user, { etag: found.etag });
        throw new AuthError(r.reason, r.reason === "too_many_attempts" ? 429 : 400);
      }
      return { user: await login(res, found, "email", rp.secure) };
    },

    async google(req, res, rp) {
      const g = await verifyGoogle(req.body?.credential);
      const found = await loadOrCreate(g.email);
      return { user: await login(res, found, "google", rp.secure, { google: { sub: g.sub }, name: found.user.name || g.name }) };
    },

    async "passkey-register-options"(req, res, rp) {
      const found = await sessionUser(req);
      if (!found) throw new AuthError("login_required", 401);
      const u = found.user;
      const options = await webauthn.generateRegistrationOptions({
        rpName: "Camper Retreat VLC",
        rpID: rp.rpID,
        userName: u.email,
        userDisplayName: u.name || u.email,
        userID: Buffer.from(u.id, "utf8"),
        attestationType: "none",
        excludeCredentials: (u.passkeys || []).map((p) => ({ id: p.id, transports: p.transports })),
        authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
      });
      res.setHeader(
        "Set-Cookie",
        cookie(CHALLENGE_COOKIE, sealValue({ c: options.challenge, u: u.id, exp: now() + CHALLENGE_TTL_MS }, secret), { maxAgeMs: CHALLENGE_TTL_MS, secure: rp.secure }),
      );
      return { options };
    },

    async "passkey-register"(req, res, rp) {
      const found = await sessionUser(req);
      if (!found) throw new AuthError("login_required", 401);
      const ch = openValue(parseCookies(req.headers?.cookie)[CHALLENGE_COOKIE], secret, now());
      if (!ch || ch.u !== found.user.id) throw new AuthError("challenge_expired");
      const v = await webauthn.verifyRegistrationResponse({
        response: req.body?.response,
        expectedChallenge: ch.c,
        expectedOrigin: rp.origins,
        expectedRPID: rp.rpID,
        requireUserVerification: false,
      });
      if (!v.verified || !v.registrationInfo) throw new AuthError("passkey_failed");
      const cred = v.registrationInfo.credential;
      const passkey = {
        id: cred.id,
        publicKey: Buffer.from(cred.publicKey).toString("base64url"),
        counter: cred.counter,
        transports: cred.transports || req.body?.response?.response?.transports || [],
        createdAt: now(),
        device: deviceOf(req.headers?.["user-agent"]),
      };
      const user = { ...found.user, passkeys: [...(found.user.passkeys || []).filter((p) => p.id !== passkey.id), passkey] };
      await users.save(user, { etag: found.etag });
      res.setHeader("Set-Cookie", cookie(CHALLENGE_COOKIE, "", { maxAgeMs: 0, secure: rp.secure }));
      return { user: await view(user) };
    },

    async "passkey-login-options"(req, res, rp) {
      const options = await webauthn.generateAuthenticationOptions({ rpID: rp.rpID, userVerification: "preferred", allowCredentials: [] });
      res.setHeader(
        "Set-Cookie",
        cookie(CHALLENGE_COOKIE, sealValue({ c: options.challenge, u: null, exp: now() + CHALLENGE_TTL_MS }, secret), { maxAgeMs: CHALLENGE_TTL_MS, secure: rp.secure }),
      );
      return { options };
    },

    async "passkey-login"(req, res, rp) {
      const ch = openValue(parseCookies(req.headers?.cookie)[CHALLENGE_COOKIE], secret, now());
      if (!ch) throw new AuthError("challenge_expired");
      const response = req.body?.response;
      const handle = response?.response?.userHandle;
      const userId = typeof handle === "string" ? Buffer.from(handle, "base64url").toString("utf8") : "";
      if (!/^[0-9a-f]{32}$/.test(userId)) throw new AuthError("passkey_unknown");
      const found = await users.get(userId);
      const pk = found?.user.passkeys?.find((p) => p.id === response?.id);
      if (!pk) throw new AuthError("passkey_unknown");
      const v = await webauthn.verifyAuthenticationResponse({
        response,
        expectedChallenge: ch.c,
        expectedOrigin: rp.origins,
        expectedRPID: rp.rpID,
        credential: { id: pk.id, publicKey: new Uint8Array(Buffer.from(pk.publicKey, "base64url")), counter: pk.counter, transports: pk.transports },
        requireUserVerification: false,
      });
      if (!v.verified) throw new AuthError("passkey_failed");
      const passkeys = found.user.passkeys.map((p) => (p.id === pk.id ? { ...p, counter: v.authenticationInfo.newCounter } : p));
      const user = await login(res, found, "passkey", rp.secure, { passkeys });
      res.setHeader("Set-Cookie", [
        cookie(SESSION_COOKIE, sealValue(newSession({ id: found.user.id, email: found.user.email, name: found.user.name }, now()), secret), { maxAgeMs: SESSION_TTL_MS, secure: rp.secure }),
        cookie(CHALLENGE_COOKIE, "", { maxAgeMs: 0, secure: rp.secure }),
      ]);
      return { user };
    },

    async logout(req, res, rp) {
      res.setHeader("Set-Cookie", cookie(SESSION_COOKIE, "", { maxAgeMs: 0, secure: rp.secure }));
      return { ok: true };
    },
  };

  return async function handler(req, res) {
    try {
      const action = String(req.query?.action || req.body?.action || "");
      const fn = actions[action];
      if (!fn) return res.status(400).json({ error: "Unknown action", code: "bad_action" });
      if (action !== "me" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      if (!secret) throw new AuthError("auth_disabled", 503, "AUTH_SECRET is not set");
      const rp = relyingParty(req);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(await fn(req, res, rp));
    } catch (err) {
      if (err instanceof AuthError) return res.status(err.status).json({ error: err.message, code: err.code });
      if (/precondition|conflict/i.test(`${err?.name} ${err?.code}`)) return res.status(409).json({ error: "Try again", code: "conflict" });
      console.error("auth handler failed:", err);
      return res.status(500).json({ error: "Internal error", code: "internal" });
    }
  };
}
