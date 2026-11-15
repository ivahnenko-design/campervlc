// Wires the contract handlers to the real Blob store, Resend and the site.
import { createContractStore } from "./contracts.js";
import { createContractHandlers } from "./contract-handlers.js";
import { sendCodeEmail, sendSignedEmails } from "./contract-email.js";
import { getSigningProvider } from "./signing-provider.js";
import { siteUrl } from "./email.js";
import { CONTRACT_PDF_PATH } from "./contracts.js";
import { createBlobStore } from "./store.js";

async function loadBasePdf() {
  const res = await fetch(`${siteUrl()}${CONTRACT_PDF_PATH}`);
  if (!res.ok) throw new Error(`Base contract PDF not available (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

export const contractHandlers = createContractHandlers({
  store: createContractStore(),
  provider: getSigningProvider(),
  sendCode: (contract, code) => sendCodeEmail(contract, code),
  sendSigned: (contract, pdf) => sendSignedEmails(contract, pdf),
  loadBasePdf,
  listBookings: () => createBlobStore().listBookings(),
  adminToken: process.env.ADMIN_TOKEN,
  secret: process.env.CONTRACT_SECRET || process.env.ADMIN_TOKEN,
});
