// Key for guest sessions and passkey challenges. AUTH_SECRET if set; otherwise
// derived from ADMIN_TOKEN so the feature works without one more variable.
import { createHmac } from "node:crypto";

export function authSecret(env = process.env) {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;
  if (env.ADMIN_TOKEN) return createHmac("sha256", env.ADMIN_TOKEN).update("guest-sessions").digest("hex");
  return "";
}
