// Where a contract gets signed. "own" is the page /sign/:token of this site.
// To move to an external service (Signaturit, Yousign, DocuSign...):
//   1. implement createExternalProvider below: invite() creates the envelope
//      at the service and stores its id in contract.externalId;
//   2. add a webhook endpoint that, when the service reports "signed", fetches
//      the signed PDF, stores it with store.putPdf and sets contract.status;
//   3. set SIGNING_PROVIDER=external in Vercel.
// The admin form, the records, the emails and the PDF storage stay the same.
import { ContractError } from "./contracts.js";
import { sendInviteEmail } from "./contract-email.js";

export function createOwnProvider({ send } = {}) {
  return {
    name: "own",
    async invite(contract, token, opts = {}) {
      await sendInviteEmail(contract, token, { send, reminder: !!opts.reminder });
    },
  };
}

export function createExternalProvider() {
  return {
    name: "external",
    async invite() {
      throw new ContractError(
        "provider_not_configured",
        "The external signing provider is not connected yet (see api/_lib/signing-provider.js)",
        501,
      );
    },
  };
}

export function getSigningProvider(name = process.env.SIGNING_PROVIDER || "own", deps = {}) {
  return name === "external" ? createExternalProvider() : createOwnProvider(deps);
}
