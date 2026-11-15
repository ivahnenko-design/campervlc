// One function serves several jobs (the Vercel Hobby plan allows 12 functions in total):
//  - ?scope=auth   guest accounts: email code, Google, passkeys, session (see _lib/auth-handlers.js)
//  - x-admin-token header   owner: create/resend/cancel contracts, list, download signed PDFs
//  - otherwise     guest signing page /sign/:token: read, email code, sign
import { contractHandlers } from "./_lib/contract-wire.js";
import { authHandler } from "./_lib/auth-wire.js";

export default function handler(req, res) {
  if (req.query?.scope === "auth") return authHandler(req, res);
  const isAdmin = req.headers && "x-admin-token" in req.headers;
  return isAdmin ? contractHandlers.admin(req, res) : contractHandlers.guest(req, res);
}
