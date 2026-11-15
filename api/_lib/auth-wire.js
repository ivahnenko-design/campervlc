// Wires the guest-account handler to Blob, Resend, Google and SimpleWebAuthn.
import * as webauthn from "@simplewebauthn/server";
import { MEMBER_DISCOUNT_PCT } from "../../shared/pricing.js";
import { createUserStore, verifyGoogleCredential } from "./auth.js";
import { authSecret } from "./auth-secret.js";
import { createAuthHandlers } from "./auth-handlers.js";
import { sendLoginCodeEmail } from "./auth-email.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID || "";

export const authHandler = createAuthHandlers({
  users: createUserStore(),
  webauthn,
  verifyGoogle: (credential) => verifyGoogleCredential(credential, { clientId: googleClientId }),
  sendCode: (email, code, lang) => sendLoginCodeEmail(email, code, lang),
  secret: authSecret(),
  googleClientId,
  discountPct: MEMBER_DISCOUNT_PCT,
});
