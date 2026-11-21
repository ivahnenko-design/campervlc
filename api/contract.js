// One function serves several jobs (the Vercel Hobby plan allows 12 functions in total):
//  - ?scope=auth   guest accounts: email code, Google, passkeys, session (see _lib/auth-handlers.js)
//  - ?scope=import Yescapa booking emails from the owner's Gmail script (x-import-key)
//  - ?scope=promo  is a promo code valid? -> { pct } (the codes themselves never reach the browser)
//  - x-admin-token header   owner: create/resend/cancel contracts, list, download signed PDFs
//  - otherwise     guest signing page /sign/:token: read, email code, sign
import { contractHandlers } from "./_lib/contract-wire.js";
import { authHandler } from "./_lib/auth-wire.js";
import { promoPctAt } from "../shared/promo-codes.js";
import { createImportHandler } from "./_lib/yescapa-import.js";

const importHandler = createImportHandler();

function promoHandler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  return res.status(200).json({ pct: promoPctAt(req.query?.code) });
}

export default function handler(req, res) {
  if (req.query?.scope === "auth") return authHandler(req, res);
  if (req.query?.scope === "promo") return promoHandler(req, res);
  if (req.query?.scope === "import") return importHandler(req, res);
  const isAdmin = req.headers && "x-admin-token" in req.headers;
  return isAdmin ? contractHandlers.admin(req, res) : contractHandlers.guest(req, res);
}
