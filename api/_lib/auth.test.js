import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AuthError,
  checkLoginCode,
  createMemoryUserStore,
  isEmail,
  issueLoginCode,
  newSession,
  newUser,
  openValue,
  sealValue,
  sessionFromRequest,
  userIdFor,
  verifyGoogleCredential,
} from "./auth.js";
import { createAuthHandlers, relyingParty } from "./auth-handlers.js";
import { MEMBER_DISCOUNT_PCT, PROMO_CODES, calculateQuote } from "../../shared/pricing.js";

const SECRET = "test-secret";

test("sealed values: tamper and expiry are rejected", () => {
  const v = sealValue({ a: 1, exp: 2000 }, SECRET);
  assert.equal(openValue(v, SECRET, 1000).a, 1);
  assert.equal(openValue(v, SECRET, 2001), null);
  assert.equal(openValue(v, "other", 1000), null);
  assert.equal(openValue(`${v.split(".")[0]}.x`, SECRET, 1000), null);
});

test("user id is the same for any casing of the email; sessions read from cookies", () => {
  assert.equal(userIdFor("Anna@Example.com "), userIdFor("anna@example.com"));
  assert.equal(isEmail("a@b.co"), true);
  assert.equal(isEmail("nope"), false);
  const user = newUser("anna@example.com", 0);
  const cookie = `x=1; cv_session=${encodeURIComponent(sealValue(newSession(user, 1000), SECRET))}`;
  assert.equal(sessionFromRequest({ headers: { cookie } }, SECRET, 2000).email, "anna@example.com");
  assert.equal(sessionFromRequest({ headers: { cookie: "" } }, SECRET, 2000), null);
  assert.equal(sessionFromRequest({ headers: { cookie } }, "other", 2000), null);
});

test("login code: resend cooldown, wrong guesses counted, right code passes once", () => {
  const user = newUser("anna@example.com", 0);
  const { code, user: u1 } = issueLoginCode(user, { now: 1000, secret: SECRET });
  assert.throws(() => issueLoginCode(u1, { now: 2000, secret: SECRET }), (e) => e.code === "code_too_soon");
  const wrong = checkLoginCode(u1, code === "000000" ? "111111" : "000000", { now: 3000, secret: SECRET });
  assert.equal(wrong.reason, "code_wrong");
  assert.equal(wrong.user.loginCode.attempts, 1);
  assert.equal(checkLoginCode(u1, code, { now: 3000, secret: SECRET }).ok, true);
  assert.equal(checkLoginCode(u1, code, { now: 1000 + 11 * 60_000, secret: SECRET }).reason, "code_expired");
});

test("Google credential: audience, issuer, expiry and verified email are all checked", async () => {
  const token = (over = {}) => ({
    ok: true,
    json: async () => ({ aud: "cid", iss: "https://accounts.google.com", exp: String(9999999999), email: "g@example.com", email_verified: "true", name: "G", sub: "1", ...over }),
  });
  const ok = await verifyGoogleCredential("tok", { clientId: "cid", fetchImpl: async () => token() });
  assert.equal(ok.email, "g@example.com");
  for (const bad of [{ aud: "other" }, { iss: "evil.com" }, { exp: "1" }, { email_verified: "false" }, { email: "x" }]) {
    await assert.rejects(verifyGoogleCredential("tok", { clientId: "cid", fetchImpl: async () => token(bad) }), AuthError);
  }
  await assert.rejects(verifyGoogleCredential("tok", { clientId: "", fetchImpl: async () => token() }), (e) => e.code === "google_disabled");
});

function res() {
  const r = { code: 0, body: null, headers: {} };
  r.status = (c) => ((r.code = c), r);
  r.json = (b) => ((r.body = b), r);
  r.setHeader = (k, v) => (r.headers[k] = v);
  return r;
}
const HOST = { host: "campervlc.com" };

function setup(over = {}) {
  const users = createMemoryUserStore();
  const sent = [];
  let t = 1_000_000;
  const handler = createAuthHandlers({
    users,
    webauthn: {},
    verifyGoogle: async () => ({ email: "g@example.com", name: "Gina", sub: "42" }),
    sendCode: async (email, code) => sent.push({ email, code }),
    secret: SECRET,
    googleClientId: "cid",
    discountPct: 5,
    now: () => t,
    ...over,
  });
  const call = async (action, body, headers = {}, method = "POST") => {
    const r = res();
    await handler({ method, query: { action }, body, headers: { ...HOST, ...headers } }, r);
    return r;
  };
  return { call, users, sent, tick: (ms) => (t += ms) };
}

const sessionCookie = (r) => String(r.headers["Set-Cookie"]).split(";")[0];

test("email code flow creates the account, sets a session, and me returns the user + discount", async () => {
  const { call, sent, tick } = setup();
  assert.equal((await call("email-code", { email: "nope" })).code, 400);
  const asked = await call("email-code", { email: "Anna@Example.com", lang: "ru" });
  assert.equal(asked.code, 200);
  assert.equal(sent[0].email, "anna@example.com");

  assert.equal((await call("email-verify", { email: "anna@example.com", code: "000000" })).code, 400);
  tick(1000);
  const ok = await call("email-verify", { email: "anna@example.com", code: sent[0].code });
  assert.equal(ok.code, 200);
  assert.equal(ok.body.user.email, "anna@example.com");
  assert.match(String(ok.headers["Set-Cookie"]), /cv_session=.*HttpOnly.*Secure/);

  const me = await call("me", undefined, { cookie: sessionCookie(ok) }, "GET");
  assert.equal(me.body.user.email, "anna@example.com");
  assert.equal(me.body.discountPct, 5);
  assert.equal(me.body.googleClientId, "cid");
  const anon = await call("me", undefined, {}, "GET");
  assert.equal(anon.body.user, null);

  const again = await call("email-verify", { email: "anna@example.com", code: sent[0].code });
  assert.equal(again.code, 400, "a used code does not work twice");
});

test("Google login shares the account with the email login", async () => {
  const { call, users } = setup();
  const g = await call("google", { credential: "tok" });
  assert.equal(g.code, 200);
  assert.equal(g.body.user.google, true);
  assert.equal(users.rows.size, 1);
  assert.ok(users.rows.has(userIdFor("g@example.com")));
});

test("anonymous users cannot touch passkey registration; logout clears the cookie; bad hosts are refused", async () => {
  const { call } = setup();
  assert.equal((await call("passkey-register-options", {})).code, 401);
  const out = await call("logout", {});
  assert.match(String(out.headers["Set-Cookie"]), /Max-Age=0/);
  const bad = res();
  await setup().call("me", undefined, { host: "evil.example" }, "GET").then((r) => assert.equal(r.code, 400));
  assert.throws(() => relyingParty({ headers: { host: "evil.example" } }), AuthError);
  assert.equal(relyingParty({ headers: { host: "localhost:8080" } }).secure, false);
  assert.equal(bad.code, 0);
});

test("passkey registration then login, with the WebAuthn library replaced by a fake", async () => {
  const fake = {
    generateRegistrationOptions: async () => ({ challenge: "reg-chal", rp: {} }),
    verifyRegistrationResponse: async ({ expectedChallenge }) => ({
      verified: expectedChallenge === "reg-chal",
      registrationInfo: { credential: { id: "cred1", publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ["internal"] } },
    }),
    generateAuthenticationOptions: async () => ({ challenge: "auth-chal" }),
    verifyAuthenticationResponse: async ({ expectedChallenge, credential }) => ({
      verified: expectedChallenge === "auth-chal" && credential.id === "cred1",
      authenticationInfo: { newCounter: 7 },
    }),
  };
  const { call, users } = setup({ webauthn: fake });
  const g = await call("google", { credential: "tok" });
  const session = sessionCookie(g);

  const opt = await call("passkey-register-options", {}, { cookie: session });
  assert.equal(opt.code, 200);
  const challenge = String(opt.headers["Set-Cookie"]).split(";")[0];
  const reg = await call("passkey-register", { response: {} }, { cookie: `${session}; ${challenge}`, "user-agent": "iPhone" });
  assert.equal(reg.code, 200);
  assert.equal(reg.body.user.passkeys.length, 1);
  assert.equal(reg.body.user.passkeys[0].device, "iPhone / iPad");

  const noCh = await call("passkey-login", { response: {} });
  assert.equal(noCh.code, 400);

  const lo = await call("passkey-login-options", {});
  const loCookie = String(lo.headers["Set-Cookie"]).split(";")[0];
  const id = userIdFor("g@example.com");
  const login = await call(
    "passkey-login",
    { response: { id: "cred1", response: { userHandle: Buffer.from(id).toString("base64url") } } },
    { cookie: loCookie },
  );
  assert.equal(login.code, 200, JSON.stringify(login.body));
  assert.ok(String(login.headers["Set-Cookie"]).includes("cv_session="));
  const stored = JSON.parse(users.rows.get(id));
  assert.equal(stored.passkeys[0].counter, 7);
  assert.equal(stored.logins[0].method, "passkey");

  const unknown = await call(
    "passkey-login",
    { response: { id: "other", response: { userHandle: Buffer.from(id).toString("base64url") } } },
    { cookie: loCookie },
  );
  assert.equal(unknown.code, 400);
});

test("member discount: 5% off; a valid promo code replaces it and never stacks, even a smaller one", () => {
  const base = { start: new Date(2027, 2, 1), end: new Date(2027, 2, 6) };
  const plain = calculateQuote(base);
  const member = calculateQuote({ ...base, member: true });
  assert.equal(member.memberDiscountApplied, true);
  assert.equal(member.promoDiscountPct, MEMBER_DISCOUNT_PCT);
  assert.equal(member.promoDiscountAmount, Math.round(plain.preDiscountTotal * 0.05));
  assert.ok(member.finalTotalWithIva < plain.finalTotalWithIva);
  assert.equal(member.appliedPromoCode, null);

  const withCode = calculateQuote({ ...base, member: true, promoCode: "CAMPER10" });
  assert.equal(withCode.appliedPromoCode, "CAMPER10");
  assert.equal(withCode.memberDiscountApplied, false);
  assert.equal(withCode.promoDiscountPct, 10);
  assert.equal(calculateQuote({ ...base, promoCode: "CAMPER10" }).finalTotalWithIva, withCode.finalTotalWithIva, "same price with or without login");

  PROMO_CODES.SMALL3 = 3;
  try {
    const small = calculateQuote({ ...base, member: true, promoCode: "SMALL3" });
    assert.equal(small.appliedPromoCode, "SMALL3");
    assert.equal(small.memberDiscountApplied, false);
    assert.equal(small.promoDiscountPct, 3, "the promo code wins even when the member discount is bigger");
  } finally {
    delete PROMO_CODES.SMALL3;
  }
  assert.equal(calculateQuote({ ...base, member: true, promoCode: "NOPE" }).memberDiscountApplied, true, "an unknown code does not remove the member discount");
});
