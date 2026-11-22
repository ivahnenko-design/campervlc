// Guest cancellation endpoint (request code -> lookup with code -> confirm).
// The logic lives in _lib/cancel.js; this file wires Stripe, Blob and Resend.
import Stripe from "stripe";
import { createBlobStore } from "./_lib/store.js";
import { createCancelHandler } from "./_lib/cancel.js";
import { esc, postToResend, siteUrl } from "./_lib/email.js";
import { clientIp, hit } from "./_lib/rate-limit.js";
import { vehicleLabel, vehicleOf } from "../shared/vehicles.js";
import { ownerTo } from "./_lib/vehicles.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

const FROM = "Camper Retreat VLC <info@campervlc.com>";

async function sendCode(booking, code) {
  await postToResend({
    from: FROM,
    to: booking.guestEmail,
    reply_to: "info@campervlc.com",
    subject: `${code} – cancellation code / código de cancelación · ${booking.bookingRef}`,
    html: `
      <p>Hi ${esc(booking.guestFirstName)},</p>
      <p>Someone (hopefully you) asked to cancel booking <strong>${esc(booking.bookingRef)}</strong> (${esc(booking.startDate)} → ${esc(booking.endDate)}). Your code:</p>
      <p style="font-size:28px;letter-spacing:6px"><strong>${code}</strong></p>
      <p>It is valid for 15 minutes. Nothing is cancelled until you enter it and confirm on the site. If you did not ask for this, ignore this email — your booking stays as it is.</p>
      <hr />
      <p>Hola ${esc(booking.guestFirstName)}: tu código para cancelar la reserva ${esc(booking.bookingRef)} es <strong>${code}</strong> (válido 15 minutos). Si no lo has pedido tú, ignora este correo: la reserva sigue igual.</p>
      <p>— Camper Retreat VLC</p>
    `,
  });
}

function guestEmail(booking) {
  const site = siteUrl();
  const terms = `<a href="${site}/condiciones#cancelacion">rental conditions</a>`;
  const refundLine = booking.freeCancellation
    ? `<p><strong>Free cancellation:</strong> you cancelled within 24 hours of booking and more than 7 days before pickup, so everything you paid (€${booking.refundAmount}) is being refunded. It typically arrives within 5–10 business days.</p>`
    : booking.refundAmount > 0
      ? `<p><strong>Refund:</strong> €${booking.refundAmount}. Under clause 4.1 of the ${terms} we retain ${booking.retentionPct}% of the total price (€${booking.retainedAmount}). The refund is being processed and typically arrives within 5–10 business days.</p>`
      : `<p>Under clause 4.1 of the ${terms} we retain ${booking.retentionPct}% of the total price (€${booking.retainedAmount}), which covers what you have paid, so there is nothing to refund. We do not charge any remaining balance automatically.</p>`;
  return {
    from: FROM,
    to: booking.guestEmail,
    reply_to: "info@campervlc.com",
    subject: `Booking cancelled – ${booking.bookingRef}`,
    html: `
      <h2>Hi ${esc(booking.guestFirstName)}, your booking has been cancelled</h2>
      <p><strong>Booking reference:</strong> ${esc(booking.bookingRef)}</p>
      <p><strong>Dates:</strong> ${esc(booking.startDate)} → ${esc(booking.endDate)}</p>
      <hr />
      ${refundLine}
      <hr />
      <p>Questions? Reply to this email or WhatsApp us.</p>
      <p>— Camper Retreat VLC team</p>
    `,
  };
}

function ownerEmail(booking) {
  const name = `${booking.guestFirstName} ${booking.guestLastName}`;
  return {
    from: FROM,
    to: ownerTo(vehicleOf(booking), process.env.OWNER_EMAIL),
    reply_to: "info@campervlc.com",
    subject: `Booking cancelled: ${name.replace(/[\r\n]/g, " ")} · ${booking.bookingRef}`,
    html: `
      <h2>A booking was cancelled</h2>
      <p><strong>Guest:</strong> ${esc(name)}</p>
      <p><strong>Camper:</strong> ${esc(vehicleLabel(vehicleOf(booking)))}</p>
      <p><strong>Booking reference:</strong> ${esc(booking.bookingRef)}</p>
      <p><strong>Dates:</strong> ${esc(booking.startDate)} → ${esc(booking.endDate)}</p>
      <p><strong>Retention (clause 4.1):</strong> ${booking.freeCancellation ? "none — free cancellation within 24 h" : `${booking.retentionPct}% of the total price (€${booking.retainedAmount})`}</p>
      <p><strong>Refund:</strong> €${booking.refundAmount}</p>
      ${booking.unpaidRetention > 0 ? `<p><strong>Not collected:</strong> €${booking.unpaidRetention} retained beyond what was paid (not charged automatically; claim it manually if you want it).</p>` : ""}
      <p>Confirmed by the guest with a code sent to ${esc(booking.guestEmail)}. The dates have been released.</p>
    `,
  };
}

async function sendEmails(booking) {
  const results = await Promise.allSettled([postToResend(guestEmail(booking)), postToResend(ownerEmail(booking))]);
  for (const r of results) {
    if (r.status === "rejected") console.error("cancellation email failed for", booking.bookingRef, "-", r.reason?.message);
  }
}

export default createCancelHandler({
  store: createBlobStore(),
  stripe,
  secret: process.env.MANAGE_BOOKING_SECRET,
  sendCode,
  sendEmails,
  allow: (key, opts) => hit(key, opts),
  ipOf: clientIp,
  now: () => Date.now(),
});
