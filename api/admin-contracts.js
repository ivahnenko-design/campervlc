// Owner-only: create/resend/cancel electronic contracts and download signed PDFs.
// Needs ADMIN_TOKEN (sent as the x-admin-token header); disabled without it.
import { contractHandlers } from "./_lib/contract-wire.js";

export default contractHandlers.admin;
