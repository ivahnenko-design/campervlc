import Stripe from "stripe";
import { createBlobStore } from "./_lib/store.js";
import { authSecret } from "./_lib/auth-secret.js";
import { createUserStore, memberEligible, sessionFromRequest } from "./_lib/auth.js";
import { occupiedDays } from "../shared/booking-changes.js";
import { loadBlockedDates } from "./_lib/availability.js";
import { activeHoldDays, saveHold, CHECKOUT_TTL_MS } from "./_lib/holds.js";
import { checkoutKeys, createDiscountRegistry } from "./_lib/member-discount.js";
import { promoPctAt } from "../shared/promo-codes.js";
import { MIN_NOTICE_HOURS, startTooSoon } from "../shared/notice.js";
import {
  BOOKING_MAX_DATE,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  calculateQuote,
  getMinNights,
  isValidTimeOption,
  parseIsoDate,
} from "../shared/pricing.js";

// Version of the rental conditions the guest ticks "I have read" for
// (content/condiciones-web-*.md). Bump it when the contract text changes.
const TERMS_VERSION = "2026-11-v6";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      startDate,
      endDate,
      pickupTime = DEFAULT_PICKUP_TIME,
      returnTime = DEFAULT_RETURN_TIME,
      extraIds,
      totalWithIva: clientTotalWithIva,
      guest,
      prepaymentOption,
      promoCode,
      acceptedTerms,
    } = req.body;

    if (!startDate || !endDate || !guest?.email) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Guest fields go into Stripe metadata (500 characters per value) and into
    // emails: plain strings of a sane length only.
    const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const g = {
      firstName: text(guest.firstName, 80),
      lastName: text(guest.lastName, 80),
      email: text(guest.email, 160),
      phone: text(guest.phone, 40),
      adults: Math.max(1, Math.min(9, Number.parseInt(guest.adults, 10) || 1)),
      children: Math.max(0, Math.min(9, Number.parseInt(guest.children, 10) || 0)),
      message: text(guest.message, 450),
    };
    if (!g.firstName || !g.lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(g.email)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // The checkbox in the calculator is enforced here too: a client that skips
    // it (stale page, crafted request) can not start a payment.
    if (acceptedTerms !== true) {
      return res.status(400).json({
        error: "Please confirm that you have read the rental conditions.",
        code: "terms_not_accepted",
      });
    }

    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    if (!start || !end || end <= start) {
      return res.status(400).json({ error: "Invalid dates" });
    }
    if (end > BOOKING_MAX_DATE) {
      return res.status(400).json({ error: "Dates are beyond the booking window" });
    }

    // Two guests must not pay for the same days: refuse dates taken by a booking
    // made here, by Yescapa, or held by another checkout still in progress. If
    // any of that can not be read, refuse too — better a retry than a double booking.
    try {
      const bookings = await createBlobStore().listBookings();
      const { dates: blocked, yescapaOk } = await loadBlockedDates({ bookings });
      if (!yescapaOk) {
        return res.status(503).json({ error: "We could not check availability right now. Please try again in a minute.", code: "availability_unavailable" });
      }
      for (const day of await activeHoldDays(Date.now(), { exceptEmail: g.email })) blocked.add(day);
      if (occupiedDays(startDate, endDate).some((day) => blocked.has(day))) {
        return res.status(409).json({ error: "These dates are no longer available.", code: "dates_unavailable" });
      }
    } catch (err) {
      console.error("create-checkout: availability check failed -", err.message);
      return res.status(503).json({ error: "We could not check availability right now. Please try again in a minute.", code: "availability_unavailable" });
    }
    if (!isValidTimeOption(pickupTime) || !isValidTimeOption(returnTime)) {
      return res.status(400).json({ error: "Invalid pickup or return time" });
    }
    if (startTooSoon(startDate, pickupTime, Date.now())) {
      return res.status(400).json({
        error: `Bookings need at least ${MIN_NOTICE_HOURS} hours notice before pickup.`,
        code: "too_soon",
      });
    }

    // Every amount is recalculated here from the shared pricing rules; the
    // client total is only compared, never charged. normalizeExtraIds (inside
    // calculateQuote) also drops unknown ids and keeps only one mileage plan.
    // The discount for logged-in guests comes from the signed session cookie, never from the request body.
    // First booking only: the account must exist and not have used the discount yet.
    const sessionUser = sessionFromRequest(req, authSecret());
    let member = false;
    let account = null;
    if (sessionUser) {
      try {
        account = (await createUserStore().get(sessionUser.userId))?.user || null;
        member = memberEligible(account);
      } catch (err) {
        console.error("create-checkout: could not read the guest account, no member discount -", err.message);
      }
    }
    const promoPct = promoPctAt(promoCode);
    const quoteWith = (m) =>
      calculateQuote({ start, end, pickupTime, returnTime, extraIds, promoCode, promoPct, prepaymentOption, member: m });

    // The first-booking discount is per person, not per account: refuse it when
    // this name, phone or email already had it (or is mid-checkout elsewhere).
    const checkoutExpiresAt = Date.now() + CHECKOUT_TTL_MS;
    let discountKeys = [];
    if (member && quoteWith(true).memberDiscountApplied) {
      discountKeys = checkoutKeys({ ...g, accountEmail: account?.email });
      let allowed = false;
      try {
        const registry = createDiscountRegistry({ secret: authSecret() });
        const taken = await registry.taken(discountKeys, { userId: sessionUser.userId });
        allowed = !taken.length && (await registry.reserve(discountKeys, { userId: sessionUser.userId, expiresAt: checkoutExpiresAt }));
        if (taken.length) console.log("create-checkout: member discount refused, already used by", taken.map((t) => t.key.split(":")[0]).join(","));
      } catch (err) {
        console.error("create-checkout: discount registry unavailable, no member discount -", err.message);
      }
      if (!allowed) {
        member = false;
        // The page showed the discounted price: say why it changed.
        if (Number(clientTotalWithIva) === quoteWith(true).finalTotalWithIva) {
          return res.status(409).json({
            error: "The first-booking discount has already been used by this guest.",
            code: "member_discount_used",
          });
        }
      }
    }
    const quote = quoteWith(member);

    if (quote.nights < getMinNights(start)) {
      return res.status(400).json({ error: "Stay is shorter than the minimum for this season" });
    }

    if (Number(clientTotalWithIva) !== quote.finalTotalWithIva) {
      console.warn("create-checkout: client total differs from server quote, rejecting", {
        startDate,
        endDate,
        pickupTime,
        returnTime,
        extraIds,
        promoCode,
        prepaymentOption,
        clientTotalWithIva,
        serverTotalWithIva: quote.finalTotalWithIva,
      });
      return res.status(400).json({
        error: "The price has changed. Please refresh the page and check your booking again.",
        code: "price_mismatch",
      });
    }

    const {
      nights,
      cleanExtraIds,
      finalTotalWithIva: totalWithIva,
      depositAmount,
      remainingAmount,
      surcharge,
      excessHours,
    } = quote;
    const isFullPayment = quote.prepaymentOption === "full";
    const dateRange = `${startDate} ${pickupTime} → ${endDate} ${returnTime}`;

    const origin =
      process.env.SITE_URL ||
      `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: g.email,
      // Stripe's minimum lifetime; the dates (and the discount) are held that long.
      expires_at: Math.floor(checkoutExpiresAt / 1000),
      // The card is saved for the later charges the conditions allow (clause
      // 5.6: damage, surcharges, fines), so a Customer is always created.
      customer_creation: "always",
      payment_intent_data: { setup_future_usage: "off_session" },
      custom_text: {
        submit: {
          message:
            "Your card is saved to charge, after the rental, any damage, surcharges or fines due under clause 5.6 of the rental conditions (you get an email with proof first). / Se guarda tu tarjeta para posibles cargos posteriores conforme al apdo. 5.6 de las condiciones (recibirás antes un email con la justificación).",
        },
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: isFullPayment
                ? "Camper Retreat VLC — Full payment"
                : "Camper Retreat VLC — Deposit (50%)",
              description: isFullPayment
                ? `${dateRange} · ${nights} nights. Paid in full, nothing due on pickup.`
                : `${dateRange} · ${nights} nights. Remaining €${remainingAmount} due on pickup.`,
            },
            unit_amount: depositAmount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#booking`,
      metadata: {
        startDate,
        endDate,
        pickupTime,
        returnTime,
        nights: String(nights),
        lateReturnHours: String(excessHours),
        lateReturnSurcharge: String(surcharge),
        extraIds: cleanExtraIds.join(","),
        totalWithIva: String(totalWithIva),
        depositAmount: String(depositAmount),
        remainingAmount: String(remainingAmount),
        prepaymentOption: isFullPayment ? "full" : "deposit",
        promoCode: quote.appliedPromoCode || "",
        promoPct: quote.appliedPromoCode ? String(quote.promoDiscountPct) : "",
        memberDiscount: quote.memberDiscountApplied ? "true" : "false",
        memberUserId: quote.memberDiscountApplied ? sessionUser.userId : "",
        acceptedTerms: "true",
        termsVersion: TERMS_VERSION,
        language: ["es", "en", "de", "it", "nl", "ru", "uk"].includes(req.body?.language) ? req.body.language : "es",
        guestFirstName: g.firstName,
        guestLastName: g.lastName,
        guestEmail: g.email,
        guestPhone: g.phone,
        adults: String(g.adults),
        children: String(g.children),
        message: g.message,
      },
    });

    try {
      await saveHold(session.id, { startDate, endDate, expiresAt: checkoutExpiresAt, email: g.email });
    } catch (err) {
      // The webhook re-checks the dates anyway; a missing hold only widens the race.
      console.error("create-checkout: could not save the date hold -", err.message);
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe create-checkout error:", err);
    return res.status(500).json({ error: "Payment could not be started. Please try again." });
  }
}
