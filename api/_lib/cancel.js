// Guest cancellation, three steps:
//   request  booking reference + email  -> a 6-digit code is emailed to the
//            address on the booking (proves the guest reads that mailbox)
//   lookup   reference + email + code   -> what cancelling costs now + a
//            short-lived cancel token
//   confirm  cancel token               -> refund, booking marked cancelled
// Nothing here can be done knowing only someone's name: the code goes to the
// booking's own email. Dependencies are injected so tests run without Blob,
// Stripe or Resend; api/cancel-booking.js wires the real ones.
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cancellationQuote } from "../../shared/cancellation.js";
import { allocateRefund, paymentsOf } from "../../shared/booking-changes.js";
import { issueToken, verifyToken } from "./token.js";
import { StoreConflictError } from "./store.js";
import { refundLockedByOther } from "./manage.js";

export const CANCEL_CODE_TTL_MS = 15 * 60_000;
export const CANCEL_CODE_RESEND_MS = 60_000;
export const CANCEL_CODE_MAX_ATTEMPTS = 5;

const REF_PATTERN = /^CVLC-[0-9A-Z]{4,8}$/;
const normEmail = (v) => (typeof v === "string" ? v.trim().toLowerCase().slice(0, 160) : "");
const normRef = (v) => (typeof v === "string" ? v.trim().toUpperCase().slice(0, 20) : "");

function codeHash(secret, bookingId, code) {
  return createHmac("sha256", secret).update(`cancel:${bookingId}:${code}`).digest("hex");
}
function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export function quoteView(booking, nowMs) {
  const q = cancellationQuote(booking, nowMs);
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

/**
 * @param deps.store        { listBookings, getBooking, saveBooking }
 * @param deps.stripe       { refunds.create, checkout.sessions.retrieve }
 * @param deps.secret       MANAGE_BOOKING_SECRET (codes + tokens)
 * @param deps.sendCode     (booking, code) => Promise
 * @param deps.sendEmails   (booking) => Promise   guest + owner notices after cancelling
 * @param deps.allow        (key, {limit, windowMs}) => Promise<boolean>  rate limiter
 * @param deps.ipOf         (req) => string
 * @param deps.now          () => epoch ms
 */
export function createCancelHandler({ store, stripe, secret, sendCode, sendEmails, allow, ipOf, now }) {
  async function findBooking(bookingRef, email) {
    const ref = normRef(bookingRef);
    const mail = normEmail(email);
    if (!REF_PATTERN.test(ref) || !mail) return null;
    const bookings = await store.listBookings();
    const match = bookings.find((b) => b.bookingRef === ref && normEmail(b.guestEmail) === mail);
    return match ? store.getBooking(match.id) : null;
  }

  async function request(req, res, body) {
    if (!(await allow(`cancel-request:${ipOf(req)}`, { limit: 10, windowMs: 3_600_000 }))) {
      return res.status(429).json({ error: "too_many_requests" });
    }
    const found = await findBooking(body.bookingRef, body.email);
    if (!found) return res.status(404).json({ error: "not_found" });
    const { booking, etag } = found;
    if (booking.status === "cancelled") return res.status(409).json({ error: "already_cancelled" });
    const t = now();
    const prev = booking.cancelCode;
    if (prev && t - prev.sentAt < CANCEL_CODE_RESEND_MS) {
      // A code went out a moment ago: the guest should use that one.
      return res.status(200).json({ sent: true });
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const cancelCode = { hash: codeHash(secret, booking.id, code), exp: t + CANCEL_CODE_TTL_MS, sentAt: t, attempts: 0 };
    await store.saveBooking({ ...booking, cancelCode }, { etag });
    await sendCode(booking, code);
    return res.status(200).json({ sent: true });
  }

  async function lookup(req, res, body) {
    const found = await findBooking(body.bookingRef, body.email);
    if (!found) return res.status(404).json({ error: "not_found" });
    const { booking, etag } = found;
    if (booking.status === "cancelled") return res.status(409).json({ error: "already_cancelled" });
    const c = booking.cancelCode;
    const t = now();
    if (!c || c.exp <= t) return res.status(400).json({ error: "code_expired" });
    if (c.attempts >= CANCEL_CODE_MAX_ATTEMPTS) return res.status(429).json({ error: "too_many_attempts" });
    const given = String(body.code ?? "").replace(/\D/g, "").slice(0, 6);
    if (!safeEqual(c.hash, codeHash(secret, booking.id, given))) {
      await store.saveBooking({ ...booking, cancelCode: { ...c, attempts: c.attempts + 1 } }, { etag });
      return res.status(400).json({ error: "code_wrong" });
    }
    return res.status(200).json({ ...quoteView(booking, t), token: issueToken(booking.id, t, secret, "cancel") });
  }

  async function confirm(req, res, body) {
    const t = now();
    const bookingId = verifyToken(body.token, t, secret, "cancel");
    if (!bookingId) return res.status(401).json({ error: "session_expired" });
    const found = await store.getBooking(bookingId);
    if (!found) return res.status(404).json({ error: "not_found" });
    const { booking, etag } = found;
    if (booking.status === "cancelled") return res.status(409).json({ error: "already_cancelled" });
    const lockId = `cancel-${booking.id}`;
    if (refundLockedByOther(booking, lockId, t)) return res.status(409).json({ error: "busy" });

    // Never trust a client amount: recompute, time may have passed since lookup.
    const quote = cancellationQuote(booking, t);
    const amountCents = Math.round(quote.refund * 100);

    // Claim the booking before any money moves (ETag-guarded): of two parallel
    // confirms, or a confirm racing a booking change, only one goes on.
    const claimed = { ...booking, refundLock: { changeId: lockId, at: new Date(t).toISOString() }, cancelCode: null };
    try {
      await store.saveBooking(claimed, { etag });
    } catch (err) {
      if (err instanceof StoreConflictError) return res.status(409).json({ error: "busy" });
      throw err;
    }

    const refundIds = [];
    if (amountCents > 0) {
      // A booking changed through /manage-booking can hold several payments
      // (original + top-ups); refund the original first, never more than each holds.
      let current = booking;
      if (!paymentsOf(current).length) {
        try {
          const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId || booking.id);
          current = { ...booking, paymentIntentId: session.payment_intent };
        } catch (err) {
          console.error("cancel: could not retrieve the session for the refund -", err.message);
        }
      }
      const { parts, unallocated } = allocateRefund(current, quote.refund);
      if (!parts.length || unallocated > 0) {
        console.error("cancel: no payment to refund for", booking.bookingRef);
        return res.status(500).json({ error: "no_payment_intent" });
      }
      for (const part of parts) {
        try {
          const refund = await stripe.refunds.create(
            { payment_intent: part.paymentIntentId, amount: Math.round(part.amount * 100) },
            { idempotencyKey: `refund-${booking.id}-${part.paymentIntentId}` },
          );
          console.log("stripe cancel refund ok", JSON.stringify({ bookingRef: booking.bookingRef, refundId: refund.id, paymentIntentId: part.paymentIntentId, amount: part.amount }));
          refundIds.push(refund.id);
        } catch (err) {
          console.error("cancel: Stripe refund failed", booking.bookingRef, part.paymentIntentId, err.message);
          return res.status(502).json({ error: "refund_failed" });
        }
      }
    }

    const updated = {
      ...claimed,
      status: "cancelled",
      cancelledAt: new Date(t).toISOString(),
      freeCancellation: quote.free,
      retentionPct: quote.retentionPct,
      retainedAmount: quote.retained,
      unpaidRetention: quote.unpaidRetention,
      refundAmount: amountCents / 100,
      // Share of the amount paid that came back (kept for older records/readers).
      refundPct: quote.paid > 0 ? Math.round((quote.refund / quote.paid) * 100) : 0,
      refundId: refundIds[0] || null,
      refundIds,
      pendingChange: null,
      refundLock: null,
    };
    // Money has moved: this write must land. Nobody else can be writing (the
    // claim above holds), so it goes without the ETag guard.
    await store.saveBooking(updated);

    // The refund is issued and the booking saved: an email failure must not
    // turn a completed cancellation into an error for the guest.
    try {
      await sendEmails(updated);
    } catch (err) {
      console.error("cancel: emails failed for", updated.bookingRef, "-", err.message);
    }
    return res.status(200).json({
      bookingRef: updated.bookingRef,
      freeCancellation: updated.freeCancellation,
      retentionPct: updated.retentionPct,
      retainedAmount: updated.retainedAmount,
      refundAmount: updated.refundAmount,
      unpaidRetention: updated.unpaidRetention,
      status: "cancelled",
    });
  }

  return async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    res.setHeader("Cache-Control", "no-store");
    if (!secret) {
      console.error("cancel-booking: MANAGE_BOOKING_SECRET is not set");
      return res.status(503).json({ error: "unavailable" });
    }
    const body = req.body && typeof req.body === "object" ? req.body : {};
    try {
      if (body.action === "request") return await request(req, res, body);
      if (body.action === "lookup") return await lookup(req, res, body);
      if (body.action === "confirm") return await confirm(req, res, body);
      return res.status(400).json({ error: "invalid_action" });
    } catch (err) {
      if (err instanceof StoreConflictError) return res.status(409).json({ error: "busy" });
      console.error("cancel-booking failed:", err);
      return res.status(500).json({ error: "generic" });
    }
  };
}
