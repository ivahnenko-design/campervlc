/**
 * Rules for self-service booking changes (/manage-booking). Pure functions,
 * no I/O: the API supplies the stored booking, the current time and the set of
 * blocked dates, and gets back either a list of problems or a full plan with
 * every amount the guest will see and Stripe will move.
 */
import {
  BOOKING_MAX_DATE,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  EXCLUSIVE_EXTRA_GROUPS,
  EXTRAS,
  calculateQuote,
  differenceInCalendarDays,
  getMinNights,
  isValidTimeOption,
  normalizeExtraIds,
  parseIsoDate,
  withIva,
} from "./pricing.js";
import { RETENTION_SCALE, retentionPct } from "./cancellation.js";
import { BUSINESS_TIME_ZONE, daysUntil, hoursUntil } from "./dates.js";

// One scale and one set of date helpers for the whole site (see cancellation.js / dates.js).
export { RETENTION_SCALE, retentionPct } from "./cancellation.js";
export { BUSINESS_TIME_ZONE, daysUntil, hoursUntil, todayInZone, zonedDateTimeToUtcMs } from "./dates.js";

/** Self-service changes close this many hours before the pickup time. */
export const SELF_SERVICE_CUTOFF_HOURS = 48;
/** Paid extras can be removed only when pickup is MORE than this many days away. */
export const EXTRA_REMOVAL_MIN_DAYS = 7;
export const WHATSAPP_CHANGES_NUMBER = "+34 624 038 085";

// ── Booking accessors ───────────────────────────────────────────────────────
// Bookings created before this feature have no amountPaid / pickupTime fields.

export function amountPaidOf(booking) {
  return Number(booking.amountPaid ?? booking.depositAmount) || 0;
}

export function pickupTimeOf(booking) {
  return booking.pickupTime || DEFAULT_PICKUP_TIME;
}

export function returnTimeOf(booking) {
  return booking.returnTime || DEFAULT_RETURN_TIME;
}

export function canSelfServe(booking, nowMs) {
  return (
    booking.status !== "cancelled" &&
    hoursUntil(booking.startDate, pickupTimeOf(booking), nowMs) >= SELF_SERVICE_CUTOFF_HOURS
  );
}

/**
 * A change waiting for the guest to pay the difference. Its Stripe Checkout
 * session expires at `expiresAt`; after that it can never be paid, so it no
 * longer blocks new changes.
 */
export function hasOpenPendingChange(booking, nowMs) {
  const p = booking.pendingChange;
  return Boolean(p && Date.parse(p.expiresAt) > nowMs);
}

export function canRemoveExtras(booking, nowMs) {
  return daysUntil(booking.startDate, nowMs) > EXTRA_REMOVAL_MIN_DAYS;
}

/** Every calendar day from start to end inclusive, as "yyyy-MM-dd". */
export function occupiedDays(startIso, endIso) {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  const out = [];
  if (!start || !end) return out;
  for (let d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return out;
}

function quoteFor(booking, { startDate, endDate, pickupTime, returnTime, extraIds }) {
  return calculateQuote({
    start: parseIsoDate(startDate),
    end: parseIsoDate(endDate),
    pickupTime,
    returnTime,
    extraIds,
    promoCode: booking.promoCode || null,
    prepaymentOption: booking.prepaymentOption === "full" ? "full" : "deposit",
  });
}

const PRICE_BY_ID = new Map(EXTRAS.map((e) => [e.id, e.price]));

/**
 * Extras the guest gives up. Swapping inside an exclusive group for an option
 * that costs at least as much (200 km → unlimited) is an upgrade, not a removal.
 */
export function removedExtraIds(oldIds, newIds) {
  const removed = oldIds.filter((id) => !newIds.includes(id));
  return removed.filter((id) => {
    const group = EXCLUSIVE_EXTRA_GROUPS.find((g) => g.includes(id));
    if (!group) return true;
    const replacement = newIds.find((other) => other !== id && group.includes(other));
    return !(replacement && PRICE_BY_ID.get(replacement) >= PRICE_BY_ID.get(id));
  });
}

function sameList(a, b) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

/**
 * Validates a requested change and prices it.
 *
 * @param booking       stored booking record
 * @param request       { startDate, endDate, pickupTime, returnTime, extraIds } —
 *                      omitted fields keep the booking's current value
 * @param nowMs         current time
 * @param blockedDates  Set of "yyyy-MM-dd" taken by Yescapa or OTHER site bookings
 * @returns { ok: false, errors: [{ code, ...details }] } or { ok: true, plan }
 */
export function planChange({ booking, request = {}, nowMs, blockedDates = new Set() }) {
  const errors = [];

  if (booking.status === "cancelled") {
    return { ok: false, errors: [{ code: "cancelled" }] };
  }
  if (!canSelfServe(booking, nowMs)) {
    return { ok: false, errors: [{ code: "cutoff_passed", whatsapp: WHATSAPP_CHANGES_NUMBER }] };
  }
  if (hasOpenPendingChange(booking, nowMs)) {
    return { ok: false, errors: [{ code: "pending_payment" }] };
  }

  const mandatoryIds = EXTRAS.filter((e) => e.mandatory).map((e) => e.id);
  const oldExtraIds = normalizeExtraIds([...(booking.extraIds || []), ...mandatoryIds]);

  const before = {
    startDate: booking.startDate,
    endDate: booking.endDate,
    pickupTime: pickupTimeOf(booking),
    returnTime: returnTimeOf(booking),
    extraIds: oldExtraIds,
  };

  const next = {
    startDate: request.startDate ?? before.startDate,
    endDate: request.endDate ?? before.endDate,
    pickupTime: request.pickupTime ?? before.pickupTime,
    returnTime: request.returnTime ?? before.returnTime,
    extraIds: normalizeExtraIds([...(request.extraIds ?? oldExtraIds), ...mandatoryIds]),
  };

  const start = parseIsoDate(next.startDate);
  const end = parseIsoDate(next.endDate);
  if (!start || !end || end <= start) {
    return { ok: false, errors: [{ code: "invalid_dates" }] };
  }
  if (!isValidTimeOption(next.pickupTime) || !isValidTimeOption(next.returnTime)) {
    return { ok: false, errors: [{ code: "invalid_time" }] };
  }

  const datesChanged =
    next.startDate !== before.startDate ||
    next.endDate !== before.endDate ||
    next.pickupTime !== before.pickupTime ||
    next.returnTime !== before.returnTime;
  const extrasChanged = !sameList(next.extraIds, before.extraIds);

  if (!datesChanged && !extrasChanged) {
    return { ok: false, errors: [{ code: "no_changes" }] };
  }

  if (datesChanged) {
    if (hoursUntil(next.startDate, next.pickupTime, nowMs) < SELF_SERVICE_CUTOFF_HOURS) {
      errors.push({ code: "too_soon", hours: SELF_SERVICE_CUTOFF_HOURS });
    }
    if (end > BOOKING_MAX_DATE) {
      errors.push({ code: "beyond_max_date" });
    }
    const nightsRequested = differenceInCalendarDays(end, start);
    const minNights = getMinNights(start);
    if (nightsRequested < minNights) {
      errors.push({ code: "min_nights", n: minNights });
    }
    // Days this booking already holds stay available to it whatever the
    // calendar feeds say (Yescapa may echo our own booking back).
    const ownDays = new Set(occupiedDays(before.startDate, before.endDate));
    const clashes = occupiedDays(next.startDate, next.endDate).filter(
      (day) => !ownDays.has(day) && blockedDates.has(day),
    );
    if (clashes.length) {
      errors.push({ code: "unavailable", dates: clashes });
    }
  }

  const removedExtras = removedExtraIds(before.extraIds, next.extraIds);
  const addedExtras = next.extraIds.filter((id) => !before.extraIds.includes(id));
  if (removedExtras.length && !canRemoveExtras(booking, nowMs)) {
    errors.push({ code: "extra_removal_window", days: EXTRA_REMOVAL_MIN_DAYS, extraIds: removedExtras });
  }

  if (errors.length) return { ok: false, errors };

  // ── Price the new booking with today's rules ──
  const originalQuote = quoteFor(booking, before);
  const newQuote = quoteFor(booking, next);

  // ── Retention for removed nights (clause 4.1) ──
  const removedNights = Math.max(0, originalQuote.nights - newQuote.nights);
  const retentionDays = daysUntil(booking.startDate, nowMs);
  const pct = removedNights > 0 ? retentionPct(retentionDays) : 0;
  const removedNightsValue =
    removedNights > 0
      ? withIva(Math.round((originalQuote.nightsSubtotal / originalQuote.nights) * removedNights))
      : 0;
  const retention = Math.round(removedNightsValue * (pct / 100));
  const previousRetention = Number(booking.retainedTotal) || 0;

  // ── Settlement ──
  const newTotal = newQuote.finalTotalWithIva + previousRetention + retention;
  const amountPaid = amountPaidOf(booking);
  const difference = newTotal - amountPaid;
  const isFullPayment = booking.prepaymentOption === "full";

  let settlement;
  if (difference < 0) settlement = { type: "refund", amount: -difference };
  else if (difference > 0 && isFullPayment) settlement = { type: "charge", amount: difference };
  else if (difference > 0) settlement = { type: "balance", amount: difference };
  else settlement = { type: "none", amount: 0 };

  const newBalanceDue = settlement.type === "balance" ? difference : 0;

  return {
    ok: true,
    plan: {
      datesChanged,
      extrasChanged,
      before: {
        ...before,
        nights: originalQuote.nights,
        totalWithIva: Number(booking.totalWithIva) || 0,
        amountPaid,
        balanceDue: Number(booking.remainingAmount) || 0,
      },
      after: {
        ...next,
        nights: newQuote.nights,
        quote: {
          nightsSubtotal: newQuote.nightsSubtotal,
          excessHours: newQuote.excessHours,
          surcharge: newQuote.surcharge,
          discountPct: newQuote.discountPct,
          discountAmount: newQuote.discountAmount,
          extrasTotal: newQuote.extrasTotal,
          mandatoryTotal: newQuote.mandatoryTotal,
          promoCode: newQuote.appliedPromoCode,
          promoDiscountAmount: newQuote.promoDiscountAmount,
          prepaymentDiscountAmount: newQuote.prepaymentDiscountAmount,
          finalTotal: newQuote.finalTotal,
          finalTotalWithIva: newQuote.finalTotalWithIva,
        },
      },
      addedExtraIds: addedExtras,
      removedExtraIds: removedExtras,
      removedNights,
      retentionDays,
      retentionPct: pct,
      removedNightsValue,
      retention,
      previousRetention,
      newTotal,
      amountPaid,
      difference,
      settlement,
      newBalanceDue,
    },
  };
}

/**
 * The booking record after a plan has been settled. `payment` is the extra
 * charge collected for it (if any), `refunds` the Stripe refunds issued.
 */
export function applyPlanToBooking(booking, plan, { changeId, nowIso, payment = null, refunds = [] }) {
  const refundedTotal = refunds.reduce((s, r) => s + r.amount, 0);
  const chargedTotal = payment ? payment.amount : 0;
  const amountPaid = plan.amountPaid - refundedTotal + chargedTotal;

  const payments = [...paymentsOf(booking)];
  if (payment) payments.push({ paymentIntentId: payment.paymentIntentId, amount: payment.amount, changeId });
  const allRefunds = [...(booking.refunds || []), ...refunds.map((r) => ({ ...r, changeId }))];

  const after = plan.after;
  return {
    ...booking,
    startDate: after.startDate,
    endDate: after.endDate,
    pickupTime: after.pickupTime,
    returnTime: after.returnTime,
    nights: after.nights,
    lateReturnHours: after.quote.excessHours,
    lateReturnSurcharge: after.quote.surcharge,
    extraIds: after.extraIds,
    totalWithIva: plan.newTotal,
    retainedTotal: plan.previousRetention + plan.retention,
    amountPaid,
    // depositAmount is what the cancellation flow refunds against — keep it in
    // step with the money actually held.
    depositAmount: amountPaid,
    remainingAmount: plan.newBalanceDue,
    payments,
    refunds: allRefunds,
    pendingChange: null,
    updatedAt: nowIso,
    changes: [
      ...(booking.changes || []),
      {
        id: changeId,
        at: nowIso,
        old: {
          startDate: plan.before.startDate,
          endDate: plan.before.endDate,
          pickupTime: plan.before.pickupTime,
          returnTime: plan.before.returnTime,
          nights: plan.before.nights,
          extraIds: plan.before.extraIds,
          totalWithIva: plan.before.totalWithIva,
          amountPaid: plan.before.amountPaid,
          balanceDue: plan.before.balanceDue,
        },
        new: {
          startDate: after.startDate,
          endDate: after.endDate,
          pickupTime: after.pickupTime,
          returnTime: after.returnTime,
          nights: after.nights,
          extraIds: after.extraIds,
          totalWithIva: plan.newTotal,
          amountPaid,
          balanceDue: plan.newBalanceDue,
        },
        removedNights: plan.removedNights,
        retentionPct: plan.retentionPct,
        retention: plan.retention,
        settlement: plan.settlement,
        refunds: refunds.map((r) => ({ refundId: r.refundId, paymentIntentId: r.paymentIntentId, amount: r.amount })),
        payment: payment ? { paymentIntentId: payment.paymentIntentId, amount: payment.amount } : null,
      },
    ],
  };
}

/** Payments that brought money in, oldest (the original booking) first. */
export function paymentsOf(booking) {
  if (Array.isArray(booking.payments) && booking.payments.length) return booking.payments;
  if (!booking.paymentIntentId) return [];
  return [{ paymentIntentId: booking.paymentIntentId, amount: Number(booking.depositAmount) || 0, changeId: null }];
}

/**
 * Splits a refund across the booking's payments: the original payment intent
 * first, then later change payments, never more than each still holds.
 */
export function allocateRefund(booking, amount) {
  const refundedByPi = new Map();
  for (const r of booking.refunds || []) {
    refundedByPi.set(r.paymentIntentId, (refundedByPi.get(r.paymentIntentId) || 0) + r.amount);
  }
  const parts = [];
  let left = amount;
  for (const p of paymentsOf(booking)) {
    if (left <= 0) break;
    const available = p.amount - (refundedByPi.get(p.paymentIntentId) || 0);
    if (available <= 0) continue;
    const take = Math.min(available, left);
    parts.push({ paymentIntentId: p.paymentIntentId, amount: take });
    left -= take;
  }
  return { parts, unallocated: left };
}
