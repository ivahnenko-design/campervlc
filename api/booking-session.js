import Stripe from "stripe";
import { list } from "@vercel/blob";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

// The booking reference is minted by the Stripe webhook, which races the
// browser redirect. If the blob is not there yet the page just retries.
async function findBookingRef(sessionId) {
  try {
    const { blobs } = await list({ prefix: `campervlc-bookings/${sessionId}.json` });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url);
    if (!res.ok) return null;
    const booking = await res.json();
    return booking.bookingRef || null;
  } catch (err) {
    console.error("booking-session: blob lookup failed for", sessionId, "-", err.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionId = req.query?.session_id;
  if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return res.status(400).json({ error: "Missing or malformed session_id" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Only ever describe a session that actually completed.
    if (session.payment_status !== "paid") {
      return res.status(409).json({ error: "Session is not paid", paid: false });
    }

    const m = session.metadata || {};
    const bookingRef = await findBookingRef(sessionId);

    // Deliberately narrow: no phone, no email, no free-text message. Anyone
    // holding the session id gets a payment summary and nothing more.
    return res.status(200).json({
      paid: true,
      bookingRef,
      prepaymentOption: m.prepaymentOption === "full" ? "full" : "deposit",
      amountPaid: Number(m.depositAmount) || session.amount_total / 100,
      remainingAmount: Number(m.remainingAmount) || 0,
      totalWithIva: Number(m.totalWithIva) || 0,
      startDate: m.startDate || null,
      endDate: m.endDate || null,
      nights: m.nights ? Number(m.nights) : null,
      guestFirstName: m.guestFirstName || null,
      promoCode: m.promoCode || null,
    });
  } catch (err) {
    console.error("booking-session failed for", sessionId, "-", err.message);
    return res.status(500).json({ error: "Could not load booking session" });
  }
}
