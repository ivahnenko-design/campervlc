// Daily cron (see vercel.json): asks guests for a Google review after the trip.
// Vercel sends "Authorization: Bearer $CRON_SECRET" on cron invocations.
import { createBlobStore } from "./_lib/store.js";
import { postToResend } from "./_lib/email.js";
import { runReviewRequests } from "./_lib/review.js";

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
    return res.status(200).json(result);
  } catch (err) {
    console.error("review-requests failed:", err.message);
    return res.status(500).json({ error: "failed" });
  }
}
