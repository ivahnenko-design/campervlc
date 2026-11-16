// Wires the guest-account handler to Blob, Resend, Google and SimpleWebAuthn.
import * as webauthn from "@simplewebauthn/server";
import { MEMBER_DISCOUNT_PCT } from "../../shared/pricing.js";
import { createUserStore, verifyGoogleCredential } from "./auth.js";
import { authSecret } from "./auth-secret.js";
import { createAuthHandlers } from "./auth-handlers.js";
import { sendLoginCodeEmail } from "./auth-email.js";
import { clientIp, hit } from "./rate-limit.js";
import { createDiscountRegistry, emailKey } from "./member-discount.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID || "";

export const authHandler = createAuthHandlers({
  users: createUserStore(),
  webauthn,
  verifyGoogle: (credential) => verifyGoogleCredential(credential, { clientId: googleClientId }),
  sendCode: (email, code, lang) => sendLoginCodeEmail(email, code, lang),
  secret: authSecret(),
  googleClientId,
  discountPct: MEMBER_DISCOUNT_PCT,
  allow: (key, opts) => hit(key, opts),
  ipOf: clientIp,
  // The banner should not promise 5% to a mailbox that already had it (Gmail
  // dots / "+tag" variants of an address count as the same mailbox).
  discountTaken: async (email) => {
    const key = emailKey(email);
    if (!key) return false;
    try {
      return (await createDiscountRegistry({ secret: authSecret() }).taken([key])).length > 0;
    } catch {
      return false;
    }
  },
});
