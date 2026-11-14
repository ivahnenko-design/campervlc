// One function serves both sides of the electronic contract (the Vercel Hobby
// plan allows 12 functions in total):
//  - guest (page /sign/:token): read, email code, sign;
//  - owner (page /admin/contratos): sends the x-admin-token header; create,
//    resend, cancel, list, download the signed PDF. Disabled without ADMIN_TOKEN.
import { contractHandlers } from "./_lib/contract-wire.js";

export default function handler(req, res) {
  const isAdmin = req.headers && "x-admin-token" in req.headers;
  return isAdmin ? contractHandlers.admin(req, res) : contractHandlers.guest(req, res);
}
