// Post-trip "leave us a Google review" email. Pure selection + builder here;
// the cron endpoint (api/review-requests.js) does the I/O.
import { siteUrl, manageBookingUrl } from "./email.js";

// Same link as GOOGLE_REVIEW_URL in src/lib/constants.ts.
export const GOOGLE_REVIEW_URL = "https://g.page/r/CZURsHE9aJOhEBM/review";

const FROM = "Camper Retreat VLC <info@campervlc.com>";
const REPLY_TO = "info@campervlc.com";
const WINDOW_DAYS = 3; // tolerate a few missed cron runs, never go further back

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function isoDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Bookings whose trip ended yesterday (or up to WINDOW_DAYS ago) and were never asked. */
export function selectReviewCandidates(bookings, nowMs, { excludeEmails = [] } = {}) {
  const today = isoDay(nowMs);
  const oldest = isoDay(nowMs - WINDOW_DAYS * 86_400_000);
  const excluded = new Set(excludeEmails.map((e) => e.trim().toLowerCase()).filter(Boolean));
  return bookings.filter(
    (b) =>
      b.status === "confirmed" &&
      b.guestEmail &&
      b.endDate < today &&
      b.endDate >= oldest &&
      !b.reviewRequestedAt &&
      !b.skipReviewRequest &&
      !excluded.has(String(b.guestEmail).trim().toLowerCase()),
  );
}

export function buildReviewEmail(booking, { to } = {}) {
  const name = esc(booking.guestFirstName || "");
  const manage = manageBookingUrl(booking.bookingRef);
  return {
    from: FROM,
    to: to || booking.guestEmail,
    reply_to: REPLY_TO,
    subject: "How was your trip? / ¿Qué tal el viaje?",
    html: `
      <p>Hi ${name}!</p>
      <p>Thank you for travelling with Camper Retreat VLC. We hope you had a great trip and enjoyed the road.</p>
      <p>If you have a minute, a short Google review helps other travellers find us, and means a lot to a small family business:</p>
      <p><a href="${GOOGLE_REVIEW_URL}" style="display:inline-block;background:#f59e0b;color:#111;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Leave a Google review</a></p>
      <p>Anything that was not right? Just reply to this email and we will fix it.</p>
      <hr />
      <p>¡Hola ${name}!</p>
      <p>Gracias por viajar con Camper Retreat VLC. Esperamos que hayas disfrutado del viaje. Si tienes un minuto, una reseña en Google nos ayuda mucho:</p>
      <p><a href="${GOOGLE_REVIEW_URL}">Dejar una reseña en Google</a></p>
      <p>Si algo no fue como esperabas, responde a este correo y lo solucionamos.</p>
      <p style="color:#666;font-size:12px">Booking ${esc(booking.bookingRef)} · <a href="${manage}">${esc(siteUrl())}/manage-booking</a></p>
      <p>— Camper Retreat VLC</p>
    `,
  };
}

/**
 * mode: "off" (default) does nothing, "test" sends one sample to testTo and
 * touches no booking, "live" sends to guests and records reviewRequestedAt.
 */
export async function runReviewRequests({ store, send, nowMs, mode = "off", testTo, excludeEmails = [] }) {
  if (mode === "test") {
    if (!testTo) return { mode, sent: 0, note: "REVIEW_TEST_TO not set" };
    const sample = { guestFirstName: "Test", bookingRef: "CVLC-TEST" };
    await send(buildReviewEmail(sample, { to: testTo }));
    return { mode, sent: 1, sample: true };
  }
  if (mode !== "live") return { mode: "off", sent: 0 };

  const candidates = selectReviewCandidates(await store.listBookings(), nowMs, { excludeEmails });
  let sent = 0;
  const failed = [];
  for (const c of candidates) {
    const read = await store.getBooking(c.id);
    if (!read || read.booking.reviewRequestedAt) continue;
    const claimed = { ...read.booking, reviewRequestedAt: new Date(nowMs).toISOString() };
    try {
      // Claim first (etag-guarded) so two overlapping runs cannot both send.
      await store.saveBooking(claimed, { etag: read.etag });
    } catch (err) {
      failed.push({ ref: c.bookingRef, step: "claim", error: String(err.message) });
      continue;
    }
    try {
      await send(buildReviewEmail(claimed));
      sent++;
    } catch (err) {
      failed.push({ ref: c.bookingRef, step: "send", error: String(err.message) });
      const { reviewRequestedAt, ...rest } = claimed; // release so tomorrow retries
      await store.saveBooking(rest).catch(() => {});
    }
  }
  return { mode, candidates: candidates.length, sent, failed };
}
