// Wires the handover-report handler to the real Blob store, Resend and the site.
import { createActaHandler } from "./acta-handlers.js";
import { createActaStore } from "./actas.js";
import { sendActaEmails } from "./acta-email.js";
import { createContractStore } from "./contracts.js";
import { createBlobStore } from "./store.js";
import { siteUrl } from "./email.js";
import { authSecret } from "./auth-secret.js";

/** The camper outline is a public file of the site (like the blank contract PDF). */
async function loadDiagram(vehicle) {
  const res = await fetch(`${siteUrl()}${vehicle.diagram.path}`);
  if (!res.ok) throw new Error(`Diagram not available (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

export const actaHandler = createActaHandler({
  actas: createActaStore(),
  contracts: createContractStore(),
  listBookings: () => createBlobStore().listBookings(),
  loadDiagram,
  sendEmails: (contract, acta, pdf) => sendActaEmails(contract, acta, pdf),
  adminToken: process.env.ADMIN_TOKEN,
  sessionSecret: authSecret(),
});
