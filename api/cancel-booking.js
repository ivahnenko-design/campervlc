import Stripe from "stripe";
import { list, put } from "@vercel/blob";
import { cancellationQuote } from "../shared/cancellation.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

async function loadBookings() {
  try {
    const { blobs } = await list({ prefix: "campervlc-bookings/" });
    if (!blobs.length) return [];
    const bookings = [];
    for (const blob of blobs) {
      const res = await fetch(blob.url);
      const booking = await res.json();
      bookings.push(booking);
    }
    return bookings;
  } catch (err) {
    console.error("loadBookings failed:", err.message);
    return [];
  }
}

async function saveBooking(booking) {
  const key = `campervlc-bookings/${booking.id}.json`;
  await put(key, JSON.stringify(booking), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

// Resend answers 4xx/5xx with a JSON error body, and fetch does NOT reject on
// those statuses — an unchecked call silently "succeeds". Surface the status and
// Resend's payload, then throw so the caller's rejection handling actually runs.
// The API key lives in the request header and is never logged.
async function postToResend(body) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "<response body unreadable>");
    console.error(
      `Resend send FAILED: ${res.status} ${res.statusText} · to=${body.to} · subject=${body.subject} · ${detail}`
    );
    throw new Error(`Resend ${res.status} for ${body.to}: ${detail}`);
  }

  return res.json().catch(() => ({}));
}

async function sendCancellationGuestEmail(booking) {
  const {
    guestFirstName,
    guestEmail,
    bookingRef,
    retentionPct,
    retainedAmount,
    refundAmount,
    freeCancellation,
    startDate,
    endDate,
  } = booking;
  const siteUrl = process.env.SITE_URL || "https://campervlc.com";

  const refundLine = freeCancellation
    ? `<p><strong>Free cancellation:</strong> you cancelled within 24 hours of booking and more than 7 days before pickup, so everything you paid (€${refundAmount}) is being refunded. It typically arrives within 5–10 business days.</p>`
    : refundAmount > 0
      ? `<p><strong>Refund:</strong> €${refundAmount}. Under clause 4.1 of the <a href="${siteUrl}/condiciones#cancelacion">rental conditions</a> we retain ${retentionPct}% of the total price (€${retainedAmount}). The refund is being processed and typically arrives within 5–10 business days.</p>`
      : `<p>Under clause 4.1 of the <a href="${siteUrl}/condiciones#cancelacion">rental conditions</a> we retain ${retentionPct}% of the total price (€${retainedAmount}), which covers what you have paid, so there is nothing to refund. We do not charge any remaining balance automatically.</p>`;

  const body = {
    from: "Camper Retreat VLC <info@campervlc.com>",
    to: guestEmail,
    reply_to: "info@campervlc.com",
    subject: `Booking cancelled – ${bookingRef}`,
    html: `
      <h2>Hi ${guestFirstName}, your booking has been cancelled</h2>
      <p><strong>Booking reference:</strong> ${bookingRef}</p>
      <p><strong>Dates:</strong> ${startDate} → ${endDate}</p>
      <hr />
      ${refundLine}
      <hr />
      <p>Questions? Reply to this email or WhatsApp us.</p>
      <p>— Camper Retreat VLC team</p>
    `,
  };

  await postToResend(body);
}

async function sendCancellationOwnerEmail(booking) {
  const {
    guestFirstName,
    guestLastName,
    bookingRef,
    startDate,
    endDate,
    retentionPct,
    retainedAmount,
    refundAmount,
    unpaidRetention,
    freeCancellation,
  } = booking;

  const body = {
    from: "Camper Retreat VLC <info@campervlc.com>",
    to: process.env.OWNER_EMAIL,
    reply_to: "info@campervlc.com",
    subject: `Booking cancelled: ${guestFirstName} ${guestLastName} · ${bookingRef}`,
    html: `
      <h2>A booking was cancelled</h2>
      <p><strong>Guest:</strong> ${guestFirstName} ${guestLastName}</p>
      <p><strong>Booking reference:</strong> ${bookingRef}</p>
      <p><strong>Dates:</strong> ${startDate} → ${endDate}</p>
      <p><strong>Retention (clause 4.1):</strong> ${freeCancellation ? "none — free cancellation within 24 h" : `${retentionPct}% of the total price (€${retainedAmount})`}</p>
      <p><strong>Refund:</strong> €${refundAmount}</p>
      ${unpaidRetention > 0 ? `<p><strong>Not collected:</strong> €${unpaidRetention} retained beyond what was paid (not charged automatically; claim it manually if you want it).</p>` : ""}
      <p>The dates have been released and will free up in the calendar feed shortly.</p>
    `,
  };

  await postToResend(body);
}

function findBooking(bookings, { bookingRef, email, lastName }) {
  const lastNameNorm = (lastName || "").trim().toLowerCase();
  if (!lastNameNorm) {
    return { error: "not_found" };
  }

  if (bookingRef) {
    const refNorm = bookingRef.trim().toUpperCase();
    const match = bookings.find(
      (b) => b.bookingRef === refNorm && (b.guestLastName || "").trim().toLowerCase() === lastNameNorm
    );
    return match ? { booking: match } : { error: "not_found" };
  }

  if (email) {
    const emailNorm = email.trim().toLowerCase();
    const allMatches = bookings.filter(
      (b) =>
        (b.guestEmail || "").trim().toLowerCase() === emailNorm &&
        (b.guestLastName || "").trim().toLowerCase() === lastNameNorm
    );
    if (allMatches.length === 0) return { error: "not_found" };

    // Disambiguate only among active bookings — a guest with one cancelled and
    // one active booking under the same email shouldn't hit "ambiguous".
    const activeMatches = allMatches.filter((b) => b.status !== "cancelled");
    if (activeMatches.length > 1) return { error: "ambiguous" };
    if (activeMatches.length === 1) return { booking: activeMatches[0] };

    // No active bookings — surface the most recently cancelled one so the
    // caller gets "already_cancelled" instead of a misleading "not_found".
    const mostRecentCancelled = [...allMatches].sort(
      (a, b) => new Date(b.cancelledAt || b.createdAt) - new Date(a.cancelledAt || a.createdAt)
    )[0];
    return { booking: mostRecentCancelled };
  }

  return { error: "not_found" };
}

function buildQuote(booking) {
  const q = cancellationQuote(booking, Date.now());
  return {
    bookingRef: booking.bookingRef,
    guestFirstName: booking.guestFirstName,
    startDate: booking.startDate,
    endDate: booking.endDate,
    nights: booking.nights,
    totalWithIva: q.total,
    amountPaid: q.paid,
    freeCancellation: q.free,
    retentionPct: q.retentionPct,
    retainedAmount: q.retained,
    refundAmount: q.refund,
    unpaidRetention: q.unpaidRetention,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, bookingRef, email, lastName } = req.body || {};

  if (action !== "lookup" && action !== "confirm") {
    return res.status(400).json({ error: "invalid_action" });
  }

  const hasRefPair = !!bookingRef && !!lastName;
  const hasEmailPair = !!email && !!lastName;
  if (!hasRefPair && !hasEmailPair) {
    return res.status(400).json({ error: "missing_fields" });
  }

  const bookings = await loadBookings();
  const found = findBooking(bookings, { bookingRef, email, lastName });

  if (found.error === "ambiguous") {
    return res.status(409).json({ error: "ambiguous" });
  }
  if (found.error === "not_found") {
    return res.status(404).json({ error: "not_found" });
  }

  const booking = found.booking;

  if (booking.status === "cancelled") {
    return res.status(409).json({ error: "already_cancelled" });
  }

  if (action === "lookup") {
    return res.status(200).json(buildQuote(booking));
  }

  // action === "confirm" — never trust any client-supplied percentage/amount,
  // recompute from scratch since time may have passed since the lookup step.
  const quote = cancellationQuote(booking, Date.now());
  const amountCents = Math.round(quote.refund * 100);

  let refundId = null;

  if (amountCents > 0) {
    let paymentIntentId = booking.paymentIntentId;
    if (!paymentIntentId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId || booking.id);
        paymentIntentId = session.payment_intent;
      } catch (err) {
        console.error("Failed to retrieve session for refund:", err.message);
      }
    }

    if (!paymentIntentId) {
      return res.status(500).json({
        error: "no_payment_intent",
        message: "Cannot process refund — contact support.",
      });
    }

    try {
      const refund = await stripe.refunds.create(
        { payment_intent: paymentIntentId, amount: amountCents },
        { idempotencyKey: `refund-${booking.id}` }
      );
      refundId = refund.id;
    } catch (err) {
      console.error("Stripe refund failed:", err.message);
      return res.status(502).json({ error: "refund_failed", message: err.message });
    }
  }

  const updatedBooking = {
    ...booking,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    freeCancellation: quote.free,
    retentionPct: quote.retentionPct,
    retainedAmount: quote.retained,
    unpaidRetention: quote.unpaidRetention,
    refundAmount: amountCents / 100,
    // Share of the amount paid that came back (kept for older records/readers).
    refundPct: quote.paid > 0 ? Math.round((quote.refund / quote.paid) * 100) : 0,
    refundId,
  };

  await saveBooking(updatedBooking);

  // The refund is already issued and the booking already saved as cancelled, so
  // an email failure must never turn a completed cancellation into a 500. Log it
  // and still return success to the customer.
  const emailResults = await Promise.allSettled([
    sendCancellationGuestEmail(updatedBooking),
    sendCancellationOwnerEmail(updatedBooking),
  ]);
  const [guestMail, ownerMail] = emailResults;
  if (guestMail.status === "rejected") {
    console.error("sendCancellationGuestEmail failed for", updatedBooking.bookingRef, "-", guestMail.reason);
  }
  if (ownerMail.status === "rejected") {
    console.error("sendCancellationOwnerEmail failed for", updatedBooking.bookingRef, "-", ownerMail.reason);
  }

  return res.status(200).json({
    bookingRef: updatedBooking.bookingRef,
    freeCancellation: updatedBooking.freeCancellation,
    retentionPct: updatedBooking.retentionPct,
    retainedAmount: updatedBooking.retainedAmount,
    refundAmount: updatedBooking.refundAmount,
    unpaidRetention: updatedBooking.unpaidRetention,
    status: "cancelled",
  });
}
