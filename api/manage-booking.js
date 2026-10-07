// Lookup only: booking reference + email -> short-lived session token.
// This is the one guessable endpoint, so it is the path the Vercel Firewall
// rate-limits (rule: Request Path equals /api/manage-booking, 5 per 10 min).
import { handlers } from "./_lib/wire.js";

export default handlers.lookup;
