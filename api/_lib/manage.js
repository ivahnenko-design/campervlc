// Self-service booking management: lookup, preview and apply a change.
// Dependencies are injected so the whole flow runs in tests with an in-memory
// store and a fake Stripe; api/manage-booking.js wires the real ones.
import {
  EXTRA_REMOVAL_MIN_DAYS,
  SELF_SERVICE_CUTOFF_HOURS,
  WHATSAPP_CHANGES_NUMBER,
  allocateRefund,
  amountPaidOf,
  applyPlanToBooking,
  canRemoveExtras,
  canSelfServe,
  hasOpenPendingChange,
  occupiedDays,
  paymentsOf,
  pickupTimeOf,
  planChange,
  returnTimeOf,
} from "../../shared/booking-changes.js";
import { EXTRAS, normalizeExtraIds } from "../../shared/pricing.js";
import { issueToken, verifyToken } from "./token.js";
import { StoreConflictError } from "./store.js";

const REF_PATTERN = /^CVLC-[0-9A-Z]{4,8}$/;
const CHANGE_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
/** Stripe's minimum Checkout lifetime; the change stays reserved this long. */
const CHECKOUT_TTL_MS = 30 * 60_000;

const MANDATORY_IDS = EXTRAS.filter((e) => e.mandatory).map((e) => e.id);

function normEmail(v) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function normRef(v) {
  return typeof v === "string" ? v.trim().toUpperCase() : "";
}

/** What the guest may see about their own booking — no phone, no Stripe ids. */
export function bookingView(b, nowMs) {
  return {
    bookingRef: b.bookingRef,
    status: b.status,
    guestFirstName: b.guestFirstName,
    guestLastName: b.guestLastName,
    adults: b.adults,
    children: b.children,
    startDate: b.startDate,
    endDate: b.endDate,
    pickupTime: pickupTimeOf(b),
    returnTime: returnTimeOf(b),
    nights: b.nights,
    extraIds: normalizeExtraIds([...(b.extraIds || []), ...MANDATORY_IDS]),
    totalWithIva: Number(b.totalWithIva) || 0,
    amountPaid: amountPaidOf(b),
    balanceDue: Number(b.remainingAmount) || 0,
    prepaymentOption: b.prepaymentOption === "full" ? "full" : "deposit",
    promoCode: b.promoCode || null,
    canSelfServe: canSelfServe(b, nowMs),
    canRemoveExtras: canRemoveExtras(b, nowMs),
    pendingPayment: hasOpenPendingChange(b, nowMs),
    rules: {
      cutoffHours: SELF_SERVICE_CUTOFF_HOURS,
      extraRemovalMinDays: EXTRA_REMOVAL_MIN_DAYS,
      whatsapp: WHATSAPP_CHANGES_NUMBER,
    },
    changesCount: (b.changes || []).length,
  };
}

/**
 * Keeps only the fields a change may set. Values are passed on as sent so
 * planChange rejects a bad date or time instead of silently ignoring it.
 */
function sanitizeRequest(change) {
  const c = change && typeof change === "object" ? change : {};
  const out = {};
  for (const key of ["startDate", "endDate", "pickupTime", "returnTime"]) {
    if (typeof c[key] === "string") out[key] = c[key];
  }
  if (Array.isArray(c.extraIds)) out.extraIds = c.extraIds.filter((id) => typeof id === "string");
  return out;
}

function logStripe(label, data) {
  console.log(`stripe ${label}`, JSON.stringify(data));
}

/**
 * @param deps.store        { listBookings, getBooking, saveBooking }
 * @param deps.stripe       Stripe client (refunds.create, checkout.sessions.create, checkout.sessions.retrieve)
 * @param deps.tokenSecret  HMAC secret for session tokens (MANAGE_BOOKING_SECRET)
 * @param deps.loadBlocked  ({ bookings, exceptBookingId }) => { dates: Set, yescapaOk }
 * @param deps.sendEmails   (booking, change) => Promise
 * @param deps.now          () => epoch ms
 * @param deps.siteUrl      () => origin for Stripe return URLs
 *
 * Returns { lookup, change }: `lookup` (reference + email → session token) is
 * the only guessable surface and is rate-limited by the Vercel Firewall;
 * `change` (view / preview / apply) needs the token.
 */
export function createManageHandlers(deps) {
  const { store, stripe, loadBlocked, sendEmails, now, siteUrl, tokenSecret } = deps;

  async function findBooking(bookingRef, email) {
    const ref = normRef(bookingRef);
    const mail = normEmail(email);
    if (!REF_PATTERN.test(ref) || !mail) return null;
    const bookings = await store.listBookings();
    // Both must match. The reference alone is short and guessable.
    const match = bookings.find((b) => b.bookingRef === ref && normEmail(b.guestEmail) === mail);
    return match ? { match, bookings } : null;
  }

  // Fields a retry must find unchanged before it may rebase onto a newer copy
  // of the booking: the plan and any refund were computed from these.
  const sameMaterial = (a, b) =>
    ["startDate", "endDate", "pickupTime", "returnTime", "totalWithIva", "amountPaid", "retainedTotal", "status", "prepaymentOption"].every(
      (k) => a[k] === b[k],
    ) &&
    JSON.stringify(a.extraIds) === JSON.stringify(b.extraIds) &&
    (a.pendingChange?.changeId ?? null) === (b.pendingChange?.changeId ?? null) &&
    (a.changes || []).length === (b.changes || []).length;

  /**
   * Saves `build(booking)` guarded by the ETag. On a conflicting write it re-reads
   * and tries again when nothing the plan depends on moved (other writes are
   * harmless, e.g. a double click). With `final` (money already moved) the last
   * round is written without the guard. A conflict that is a real change, or the
   * same change already applied, is rethrown for the caller to handle.
   */
  async function saveRebased(booking, etag, changeId, build, { final = false } = {}) {
    let current = { booking, etag };
    for (let round = 0; ; round += 1) {
      const next = build(current.booking);
      try {
        await store.saveBooking(next, final && round >= 2 ? {} : { etag: current.etag });
        if (round) console.warn("manage-booking: save needed", round, "retries for", booking.bookingRef, changeId);
        return next;
      } catch (err) {
        if (!(err instanceof StoreConflictError) || round >= 2) throw err;
        const latest = await store.getBooking(booking.id);
        if (!latest || (latest.booking.changes || []).some((c) => c.id === changeId)) throw err;
        if (!sameMaterial(booking, latest.booking)) throw err;
        current = latest;
      }
    }
  }

  async function blockedFor(bookings, bookingId) {
    return loadBlocked({ bookings, exceptBookingId: bookingId });
  }

  async function refundParts(booking, plan, changeId) {
    let current = booking;
    if (!paymentsOf(current).length && current.stripeSessionId) {
      // Very old bookings may lack paymentIntentId; recover it from the session.
      const session = await stripe.checkout.sessions.retrieve(current.stripeSessionId);
      current = { ...current, paymentIntentId: session.payment_intent };
    }
    const { parts, unallocated } = allocateRefund(current, plan.settlement.amount);
    if (unallocated > 0) {
      const err = new Error(`Refund of €${plan.settlement.amount} exceeds what the booking's payments hold`);
      err.code = "refund_unallocated";
      throw err;
    }
    const refunds = [];
    for (const part of parts) {
      const idempotencyKey = `booking-change-${changeId}-refund-${part.paymentIntentId}`;
      try {
        const refund = await stripe.refunds.create(
          {
            payment_intent: part.paymentIntentId,
            amount: Math.round(part.amount * 100),
            metadata: { bookingRef: booking.bookingRef, bookingId: booking.id, changeId },
          },
          { idempotencyKey },
        );
        logStripe("refund ok", {
          bookingRef: booking.bookingRef,
          changeId,
          refundId: refund.id,
          status: refund.status,
          paymentIntentId: part.paymentIntentId,
          amount: part.amount,
          idempotencyKey,
        });
        refunds.push({ refundId: refund.id, paymentIntentId: part.paymentIntentId, amount: part.amount });
      } catch (err) {
        logStripe("refund FAILED", {
          bookingRef: booking.bookingRef,
          changeId,
          paymentIntentId: part.paymentIntentId,
          amount: part.amount,
          idempotencyKey,
          error: err.message,
          code: err.code,
        });
        throw err;
      }
    }
    return { refunds, booking: current };
  }

  async function startCheckout(booking, plan, changeId, request) {
    const expiresAtMs = now() + CHECKOUT_TTL_MS + 60_000; // Stripe needs ≥ 30 min
    const idempotencyKey = `booking-change-${changeId}-checkout`;
    const origin = siteUrl();
    const manageUrl = `${origin}/manage-booking?ref=${encodeURIComponent(booking.bookingRef)}`;
    let session;
    try {
      session = await stripe.checkout.sessions.create(
        {
          payment_method_types: ["card"],
          mode: "payment",
          customer_email: booking.guestEmail,
          expires_at: Math.floor(expiresAtMs / 1000),
          line_items: [
            {
              price_data: {
                currency: "eur",
                product_data: {
                  name: `Camper Retreat VLC — Booking change ${booking.bookingRef}`,
                  description: `${plan.after.startDate} ${plan.after.pickupTime} → ${plan.after.endDate} ${plan.after.returnTime} · ${plan.after.nights} nights. Difference to the amount already paid.`,
                },
                unit_amount: Math.round(plan.settlement.amount * 100),
              },
              quantity: 1,
            },
          ],
          success_url: `${manageUrl}&change=paid`,
          cancel_url: `${manageUrl}&change=cancelled`,
          metadata: {
            kind: "booking_change",
            bookingId: booking.id,
            bookingRef: booking.bookingRef,
            changeId,
            amount: String(plan.settlement.amount),
          },
        },
        { idempotencyKey },
      );
      logStripe("change checkout created", {
        bookingRef: booking.bookingRef,
        changeId,
        sessionId: session.id,
        amount: plan.settlement.amount,
        idempotencyKey,
      });
    } catch (err) {
      logStripe("change checkout FAILED", { bookingRef: booking.bookingRef, changeId, idempotencyKey, error: err.message });
      throw err;
    }
    return {
      session,
      pendingChange: {
        changeId,
        request,
        plan,
        checkoutSessionId: session.id,
        checkoutUrl: session.url,
        createdAt: new Date(now()).toISOString(),
        expiresAt: new Date(expiresAtMs).toISOString(),
      },
    };
  }

  /** Same response for a wrong reference and a wrong email: no enumeration. */
  async function lookup(req, res) {
    if (req.method !== "POST") return res.status(405).json({ code: "method_not_allowed" });
    if (!tokenSecret) {
      console.error("manage-booking: MANAGE_BOOKING_SECRET is not set");
      return res.status(503).json({ code: "unavailable" });
    }
    const { bookingRef, email } = req.body || {};

    let found;
    try {
      found = await findBooking(bookingRef, email);
    } catch (err) {
      console.error("manage-booking: loading bookings failed -", err.message);
      return res.status(500).json({ code: "server_error" });
    }
    if (!found) return res.status(404).json({ code: "not_found" });

    const nowMs = now();
    const booking = found.match;
    const { dates } = await blockedFor(found.bookings, booking.id);
    // The booking's own days stay selectable even if Yescapa echoes them back.
    const own = new Set(occupiedDays(booking.startDate, booking.endDate));
    const blockedDates = [...dates].filter((d) => !own.has(d)).sort();
    return res.status(200).json({
      token: issueToken(booking.id, nowMs, tokenSecret),
      booking: bookingView(booking, nowMs),
      blockedDates,
    });
  }

  async function change(req, res) {
    if (req.method !== "POST") return res.status(405).json({ code: "method_not_allowed" });

    const { token, action, change, changeId, expectedNewTotal, confirm } = req.body || {};
    if (!["view", "preview", "apply"].includes(action)) {
      return res.status(400).json({ code: "invalid_action" });
    }

    const nowMs = now();
    const bookingId = verifyToken(token, nowMs, tokenSecret);
    if (!bookingId) return res.status(401).json({ code: "session_expired" });

    // Re-read the single file for its etag: the change is priced and saved
    // against exactly this version.
    const fresh = await store.getBooking(bookingId);
    if (!fresh) return res.status(404).json({ code: "not_found" });
    const { booking, etag } = fresh;

    if (action === "apply") {
      if (typeof changeId !== "string" || !CHANGE_ID_PATTERN.test(changeId)) {
        return res.status(400).json({ code: "invalid_change_id" });
      }
      // Idempotency: a repeated click returns what the first one did.
      if ((booking.changes || []).some((c) => c.id === changeId)) {
        return res.status(200).json({ result: "applied", alreadyApplied: true, booking: bookingView(booking, nowMs) });
      }
      if (booking.pendingChange?.changeId === changeId && hasOpenPendingChange(booking, nowMs)) {
        return res.status(200).json({ result: "checkout", url: booking.pendingChange.checkoutUrl });
      }
    }

    if (action === "view") {
      const bookings = await store.listBookings();
      const { dates } = await blockedFor(bookings, booking.id);
      const own = new Set(occupiedDays(booking.startDate, booking.endDate));
      return res.status(200).json({
        booking: bookingView(booking, nowMs),
        blockedDates: [...dates].filter((d) => !own.has(d)).sort(),
      });
    }

    const request = sanitizeRequest(change);
    const datesRequested = ["startDate", "endDate"].some((k) => request[k] && request[k] !== booking[k]);
    const bookings = await store.listBookings();
    const { dates: blockedDates, yescapaOk } = await blockedFor(bookings, booking.id);
    if (datesRequested && !yescapaOk) {
      return res.status(503).json({ code: "availability_unavailable" });
    }

    const result = planChange({ booking, request, nowMs, blockedDates });
    if (!result.ok) {
      return res.status(422).json({ code: "invalid_change", errors: result.errors });
    }
    const { plan } = result;

    if (action === "preview") {
      return res.status(200).json({ plan });
    }

    // ── apply ──
    if (confirm !== true) return res.status(400).json({ code: "confirmation_required" });
    // The guest confirmed specific amounts; if anything moved since (a new day
    // shifted the retention tier, a booking took a date), make them look again.
    if (Number(expectedNewTotal) !== plan.newTotal) {
      return res.status(409).json({ code: "amount_changed", plan });
    }

    try {
      if (plan.settlement.type === "charge") {
        const { pendingChange } = await startCheckout(booking, plan, changeId, request);
        await saveRebased(booking, etag, changeId, (b) => ({ ...b, pendingChange }));
        return res.status(200).json({ result: "checkout", url: pendingChange.checkoutUrl });
      }

      let refunds = [];
      let base = booking;
      if (plan.settlement.type === "refund") {
        ({ refunds, booking: base } = await refundParts(booking, plan, changeId));
      }

      const nowIso = new Date(nowMs).toISOString();
      let updated;
      try {
        updated = await saveRebased(
          booking,
          etag,
          changeId,
          (b) => applyPlanToBooking({ ...b, paymentIntentId: base.paymentIntentId ?? b.paymentIntentId }, plan, { changeId, nowIso, refunds }),
          { final: refunds.length > 0 },
        );
      } catch (err) {
        if (refunds.length) {
          // Money already left. A retry with the same changeId replays the same
          // Stripe refunds (idempotency keys) and saves again.
          console.error("CRITICAL manage-booking: refunds issued but booking not saved", {
            bookingRef: booking.bookingRef,
            changeId,
            refunds,
            error: err.message,
          });
        }
        throw err;
      }
      await sendEmails(updated, updated.changes.at(-1));
      return res.status(200).json({ result: "applied", booking: bookingView(updated, nowMs), settlement: plan.settlement });
    } catch (err) {
      if (err instanceof StoreConflictError) {
        // Someone (most likely the same guest's second click) saved first.
        const latest = await store.getBooking(booking.id);
        if (latest && (latest.booking.changes || []).some((c) => c.id === changeId)) {
          return res.status(200).json({ result: "applied", alreadyApplied: true, booking: bookingView(latest.booking, nowMs) });
        }
        if (latest?.booking.pendingChange?.changeId === changeId) {
          return res.status(200).json({ result: "checkout", url: latest.booking.pendingChange.checkoutUrl });
        }
        console.error("manage-booking: conflicting save for", booking.bookingRef, changeId);
        return res.status(409).json({ code: "conflict" });
      }
      console.error("manage-booking: apply failed for", booking.bookingRef, changeId, "-", err.message);
      return res.status(502).json({ code: err.code === "refund_unallocated" ? "refund_unallocated" : "payment_error" });
    }
  }

  return { lookup, change };
}

/**
 * Webhook side of a "charge" settlement: the guest paid the difference, so
 * the pending change is applied now. A payment for a change that is no longer
 * pending (superseded or already applied) is refunded instead of kept.
 */
export async function completeChangePayment(session, { store, stripe, sendEmails, sendOwnerAlert, now }) {
  const m = session.metadata || {};
  const { bookingId, changeId } = m;
  const paid = Math.round(session.amount_total) / 100;
  const paymentIntentId = session.payment_intent;

  // The guest has already paid, so this must end with the change applied. Read,
  // check and save in a loop: a conflicting save (someone wrote in between) makes
  // the next round start from the fresh record; after a few rounds the write is
  // made without the ETag guard, which is safe because the changeId check below
  // makes applying idempotent.
  let updated;
  for (let round = 0; ; round += 1) {
    const record = await store.getBooking(bookingId);
    if (!record) {
      console.error("change payment for unknown booking", bookingId, changeId, session.id);
      return { status: "unknown_booking" };
    }
    const { booking, etag } = record;

    if ((booking.changes || []).some((c) => c.id === changeId)) {
      console.log("change payment webhook repeated, already applied", booking.bookingRef, changeId);
      return { status: "duplicate" };
    }

    const pending = booking.pendingChange;
    if (!pending || pending.changeId !== changeId || pending.checkoutSessionId !== session.id) {
      const idempotencyKey = `booking-change-${changeId}-orphan-refund`;
      try {
        const refund = await stripe.refunds.create(
          { payment_intent: paymentIntentId, metadata: { bookingRef: booking.bookingRef, changeId, reason: "superseded_change" } },
          { idempotencyKey },
        );
        logStripe("orphan change payment refunded", { bookingRef: booking.bookingRef, changeId, refundId: refund.id, paymentIntentId, amount: paid });
      } catch (err) {
        logStripe("orphan change refund FAILED", { bookingRef: booking.bookingRef, changeId, paymentIntentId, error: err.message });
      }
      await sendOwnerAlert?.(
        `Payment for a superseded booking change (${booking.bookingRef}, change ${changeId}, €${paid}, ${paymentIntentId}) was refunded automatically. Check Stripe if the refund failed.`,
      );
      return { status: "orphan_refunded" };
    }

    const nowIso = new Date(now()).toISOString();
    updated = applyPlanToBooking(booking, pending.plan, {
      changeId,
      nowIso,
      payment: { paymentIntentId, amount: paid },
    });
    try {
      await store.saveBooking(updated, round < 2 ? { etag } : {});
      if (round >= 2) console.warn("change payment saved without ETag guard after conflicts", booking.bookingRef, changeId);
      break;
    } catch (err) {
      if (!(err instanceof StoreConflictError) || round >= 2) throw err;
      console.warn("change payment: conflicting save, re-reading", booking.bookingRef, changeId, "round", round, "etag", etag);
    }
  }
  const booking = updated;
  logStripe("change payment applied", { bookingRef: booking.bookingRef, changeId, sessionId: session.id, paymentIntentId, amount: paid });
  await sendEmails(updated, updated.changes.at(-1));
  return { status: "applied", booking: updated };
}
