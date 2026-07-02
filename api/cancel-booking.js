import Stripe from "stripe";
import { list, put } from "@vercel/blob";

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
  } catch {
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

// 24h/48h cooling-off override takes precedence over the 30-day tiers — a booking
// cancelled 2h after purchase for a departure 20 days out must get 100%, not fall
// into the "<30 days" 0% bucket.
function computeRefundPct(booking, nowMs) {
  const hoursSinceBooking = (nowMs - new Date(booking.createdAt).getTime()) / 3_600_000;
  const hoursUntilDeparture =
    (new Date(`${booking.startDate}T00:00:00Z`).getTime() - nowMs) / 3_600_000;

  if (hoursSinceBooking <= 24 && hoursUntilDeparture > 48) return 100;
  if (hoursUntilDeparture / 24 >= 30) return 95;
  return 0;
}

function computeRefundAmountCents(depositAmountEur, pct) {
  const depositCents = Math.round(depositAmountEur * 100);
  return Math.round((depositCents * pct) / 100);
}

async function sendCancellationGuestEmail(booking) {
  const { guestFirstName, guestEmail, bookingRef, refundPct, refundAmount, startDate, endDate } = booking;

  const refundLine =
    refundPct > 0
      ? `<p><strong>Refund:</strong> €${refundAmount} (${refundPct}% of your deposit) is being processed and typically arrives within 5–10 business days.</p>`
      : `<p>Per our cancellation policy, your deposit is not refundable for this cancellation.</p>`;

  const body = {
    from: "Camper Retreat VLC <onboarding@resend.dev>",
    to: guestEmail,
    reply_to: process.env.OWNER_EMAIL,
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

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function sendCancellationOwnerEmail(booking) {
  const {
    guestFirstName,
    guestLastName,
    bookingRef,
    startDate,
    endDate,
    refundPct,
    refundAmount,
  } = booking;

  const body = {
    from: "Booking System <onboarding@resend.dev>",
    to: process.env.OWNER_EMAIL,
    subject: `Booking cancelled: ${guestFirstName} ${guestLastName} · ${bookingRef}`,
    html: `
      <h2>A booking was cancelled</h2>
      <p><strong>Guest:</strong> ${guestFirstName} ${guestLastName}</p>
      <p><strong>Booking reference:</strong> ${bookingRef}</p>
      <p><strong>Dates:</strong> ${startDate} → ${endDate}</p>
      <p><strong>Refund:</strong> ${refundPct}% (€${refundAmount})</p>
      <p>The dates have been released and will free up in the calendar feed shortly.</p>
    `,
  };

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
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
    const matches = bookings.filter(
      (b) =>
        (b.guestEmail || "").trim().toLowerCase() === emailNorm &&
        (b.guestLastName || "").trim().toLowerCase() === lastNameNorm &&
        b.status !== "cancelled"
    );
    if (matches.length === 0) return { error: "not_found" };
    if (matches.length > 1) return { error: "ambiguous" };
    return { booking: matches[0] };
  }

  return { error: "not_found" };
}

function buildQuote(booking) {
  const pct = computeRefundPct(booking, Date.now());
  const amountEur = computeRefundAmountCents(booking.depositAmount, pct) / 100;
  return {
    bookingRef: booking.bookingRef,
    guestFirstName: booking.guestFirstName,
    startDate: booking.startDate,
    endDate: booking.endDate,
    nights: booking.nights,
    depositAmount: booking.depositAmount,
    refundPct: pct,
    refundAmount: amountEur,
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
  const pct = computeRefundPct(booking, Date.now());
  const amountCents = computeRefundAmountCents(booking.depositAmount, pct);

  let refundId = null;

  if (pct > 0) {
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
    refundPct: pct,
    refundAmount: amountCents / 100,
    refundId,
  };

  await saveBooking(updatedBooking);

  await Promise.all([
    sendCancellationGuestEmail(updatedBooking),
    sendCancellationOwnerEmail(updatedBooking),
  ]);

  return res.status(200).json({
    bookingRef: updatedBooking.bookingRef,
    refundPct: updatedBooking.refundPct,
    refundAmount: updatedBooking.refundAmount,
    status: "cancelled",
  });
}
