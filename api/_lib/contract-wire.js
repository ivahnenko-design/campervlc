// Wires the contract handlers to the real Blob store, Resend and the site.
import { createContractStore } from "./contracts.js";
import { createContractHandlers } from "./contract-handlers.js";
import { sendCodeEmail, sendSignedEmails, signingLink } from "./contract-email.js";
import { extractDocFields } from "./doc-extract.js";
import { getSigningProvider } from "./signing-provider.js";
import { esc, postToResend, siteUrl } from "./email.js";
import { authSecret } from "./auth-secret.js";
import { contractKeys, createDiscountRegistry } from "./member-discount.js";
import { contractPdfPathOf } from "./contracts.js";
import { createBlobStore } from "./store.js";
import { createImportStore, gmailScript, importKey } from "./yescapa-import.js";

async function loadBasePdf(contract) {
  const res = await fetch(`${siteUrl()}${contractPdfPathOf(contract)}`);
  if (!res.ok) throw new Error(`Base contract PDF not available (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * The first-booking discount is per person. The booking form only knows a name,
 * phone and email; the contract adds the ID/passport and licence numbers. If
 * this booking had the discount and the same document already had it on
 * another booking, the owner is told how much to claim.
 */
async function checkMemberDiscount(contract) {
  if (!contract.bookingRef || !contract.signed?.data) return;
  const ref = contract.bookingRef.trim().toUpperCase();
  const booking = (await createBlobStore().listBookings()).find((b) => b.bookingRef === ref);
  if (!booking?.memberDiscount || booking.status === "cancelled") return;
  const clashes = await createDiscountRegistry({ secret: authSecret() }).markUsed(contractKeys(contract.signed.data), {
    bookingId: booking.id,
  });
  if (!clashes.length) return;
  const what = [...new Set(clashes.map((c) => ({ doc: "ID/passport", licence: "driving licence", name: "full name", phone: "phone" })[c.key.split(":")[0]] || c.key.split(":")[0]))];
  await postToResend({
    from: "Camper Retreat VLC <info@campervlc.com>",
    to: process.env.OWNER_EMAIL,
    subject: `First-booking discount reused: ${booking.bookingRef}`,
    html: `<p>The guest of booking <strong>${esc(booking.bookingRef)}</strong> (${esc(booking.guestFirstName)} ${esc(booking.guestLastName)}, ${esc(booking.startDate)} → ${esc(booking.endDate)}) got the 5% first-booking discount, but the contract they just signed has the same <strong>${esc(what.join(", "))}</strong> as an earlier booking that already had it.</p>
      <p>The discount is meant once per person: you may ask the guest for the difference (5% of the booking).</p>`,
  });
}

export const contractHandlers = createContractHandlers({
  store: createContractStore(),
  provider: getSigningProvider(),
  sendCode: (contract, code) => sendCodeEmail(contract, code),
  sendSigned: (contract, pdf, token) =>
    sendSignedEmails(contract, pdf, { link: token ? signingLink(token, contract.language) : null }),
  loadBasePdf,
  listBookings: () => createBlobStore().listBookings(),
  onSigned: checkMemberDiscount,
  // Document recognition runs only with an Anthropic API key in the environment.
  extractDocs: process.env.ANTHROPIC_API_KEY ? (docs) => extractDocFields(docs) : null,
  imports: createImportStore(),
  importSetup: () => {
    const key = importKey();
    return key ? { key, script: gmailScript(`${siteUrl()}/api/contract?scope=import`, key) } : null;
  },
  adminToken: process.env.ADMIN_TOKEN,
  sessionSecret: authSecret(),
  secret: process.env.CONTRACT_SECRET || process.env.ADMIN_TOKEN,
});
