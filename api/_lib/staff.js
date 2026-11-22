// Who may use /admin/contratos and what they see. Staff are ordinary site
// accounts (email code / Google / passkey, see auth.js) whose email is listed
// in an environment variable:
//   ADMIN_EMAILS    "boss@example.com,other@example.com"
//                   company owner(s): everything
//   MANAGER_EMAILS  "partner@example.com:alc-partner;helper@example.com:vlc-yearling,alc-partner"
//                   camper owners/managers: only the listed campers (ids from shared/vehicles.js)
// The old shared ADMIN_TOKEN (header x-admin-token) still gives full access.
import { timingSafeEqual } from "node:crypto";
import { VEHICLES, activeVehicles, getVehicle } from "../../shared/vehicles.js";
import { normEmail, sessionFromRequest } from "./auth.js";

/** Company mailbox: the default owner address in contract-email.js too. */
export const COMPANY_EMAIL = "camper.retreat.alicante@gmail.com";

const splitList = (v) =>
  String(v || "")
    .split(/[,\s]+/)
    .map(normEmail)
    .filter(Boolean);

/** Parsed staff lists. Unknown vehicle ids are dropped (logged). */
export function staffConfig(env = process.env) {
  // The company mailbox (where bookings and contracts already go) is always an admin,
  // so the owner can log in before ADMIN_EMAILS is set in Vercel.
  const admins = [
    ...new Set([
      ...splitList(env.ADMIN_EMAILS),
      ...splitList(env.OWNER_EMAIL),
      ...splitList(env.CONTRACT_OWNER_EMAIL),
      COMPANY_EMAIL,
    ]),
  ];
  const managers = [];
  for (const entry of String(env.MANAGER_EMAILS || "").split(";")) {
    const i = entry.indexOf(":");
    if (i < 0) continue;
    const email = normEmail(entry.slice(0, i));
    const ids = entry
      .slice(i + 1)
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const vehicleIds = ids.filter((id) => getVehicle(id));
    if (ids.length !== vehicleIds.length) console.warn("staff: MANAGER_EMAILS has unknown vehicle ids for", email);
    if (email && vehicleIds.length) managers.push({ email, vehicleIds });
  }
  return { admins, managers };
}

/**
 * Role of an account email: { role: "owner", all: true } for ADMIN_EMAILS,
 * { role: "manager", vehicleIds } for MANAGER_EMAILS, null otherwise.
 * An admin listed as manager too stays admin.
 */
export function resolveStaff(email, env = process.env) {
  const e = normEmail(email);
  if (!e) return null;
  const cfg = staffConfig(env);
  if (cfg.admins.includes(e)) return { role: "owner", all: true, email: e, vehicleIds: VEHICLES.map((v) => v.id) };
  const ids = [...new Set(cfg.managers.filter((m) => m.email === e).flatMap((m) => m.vehicleIds))];
  return ids.length ? { role: "manager", all: false, email: e, vehicleIds: ids } : null;
}

/**
 * May this staff member see records of `vehicleId`? `null` (a Yescapa email
 * whose camper is unknown) is for the company owner only.
 */
export function canSee(staff, vehicleId) {
  if (!staff) return false;
  if (staff.all) return true;
  return vehicleId != null && staff.vehicleIds.includes(vehicleId);
}

/** Rows the staff member may see; `vehicleOfRow` maps a row to its camper id (or null). */
export function visibleTo(staff, rows, vehicleOfRow) {
  return rows.filter((r) => canSee(staff, vehicleOfRow(r)));
}

/** Active campers this staff member works with (for the admin's camper select). */
export function staffVehicles(staff) {
  return activeVehicles().filter((v) => canSee(staff, v.id));
}

function tokenOk(req, adminToken) {
  if (!adminToken) return false;
  const given = Buffer.from(String(req.headers?.["x-admin-token"] || ""));
  const want = Buffer.from(adminToken);
  return given.length === want.length && timingSafeEqual(given, want);
}

/**
 * Who is calling the admin endpoint: the legacy token (full access), else the
 * logged-in site account if its email is staff, else null.
 */
export function adminAccess(req, { adminToken, sessionSecret, env = process.env, now = Date.now() } = {}) {
  if (tokenOk(req, adminToken)) return { role: "owner", all: true, email: null, via: "token", vehicleIds: VEHICLES.map((v) => v.id) };
  const session = sessionSecret ? sessionFromRequest(req, sessionSecret, now) : null;
  const staff = session ? resolveStaff(session.email, env) : null;
  return staff ? { ...staff, via: "session" } : null;
}

/** True when some way into the admin is configured at all. */
export const adminConfigured = (adminToken, env = process.env) =>
  !!adminToken || !!String(env.ADMIN_EMAILS || "").trim() || !!String(env.MANAGER_EMAILS || "").trim();
