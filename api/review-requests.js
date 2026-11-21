// Daily cron (see vercel.json): asks guests for a Google review after the trip
// and reminds guests who have not signed their rental contract yet.
// Vercel sends "Authorization: Bearer $CRON_SECRET" on cron invocations.
import { createBlobStore } from "./_lib/store.js";
import { postToResend } from "./_lib/email.js";
import { runReviewRequests } from "./_lib/review.js";
import { createContractStore } from "./_lib/contracts.js";
import { getSigningProvider } from "./_lib/signing-provider.js";
import { runContractReminders } from "./_lib/contract-auto.js";
import { sendUnsignedSoonEmail } from "./_lib/contract-email.js";

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    const result = await runReviewRequests({
      store: createBlobStore(),
      send: (body) => postToResend(body),
      nowMs: Date.now(),
      mode: process.env.REVIEW_EMAILS_MODE || "off",
      testTo: process.env.REVIEW_TEST_TO,
      excludeEmails: (process.env.REVIEW_EXCLUDE_EMAILS || "").split(","),
    });
    console.log("review-requests:", JSON.stringify(result));
    // Same daily run: remind guests who have not signed their contract yet.
    let contracts = null;
    try {
      contracts = await runContractReminders({
        store: createContractStore(),
        provider: getSigningProvider(),
        sendOwner: (rows) => sendUnsignedSoonEmail(rows),
        nowMs: Date.now(),
      });
      console.log("contract-reminders:", JSON.stringify(contracts));
    } catch (err) {
      console.error("contract-reminders failed:", err.message);
    }
    return res.status(200).json({ ...result, contracts });
  } catch (err) {
    console.error("review-requests failed:", err.message);
    return res.status(500).json({ error: "failed" });
  }
}
