import Stripe from "stripe";
import { createBlobStore } from "./_lib/store.js";
import { occupiedDays } from "../shared/booking-changes.js";
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
const TERMS_VERSION = "2026-10-v3";

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

    // Two guests must not pay for the same days: refuse dates already taken by a
    // booking made on this site. If the store can not be read the check is
    // skipped rather than blocking every payment.
    try {
      const taken = new Set();
      for (const b of await createBlobStore().listBookings()) {
        if (b.status === "cancelled") continue;
        for (const day of occupiedDays(b.startDate, b.endDate)) taken.add(day);
      }
      if (occupiedDays(startDate, endDate).some((day) => taken.has(day))) {
        return res.status(409).json({ error: "These dates are no longer available.", code: "dates_unavailable" });
      }
    } catch (err) {
      console.error("create-checkout: availability check skipped -", err.message);
    }
    if (!isValidTimeOption(pickupTime) || !isValidTimeOption(returnTime)) {
      return res.status(400).json({ error: "Invalid pickup or return time" });
    }

    // Every amount is recalculated here from the shared pricing rules; the
    // client total is only compared, never charged. normalizeExtraIds (inside
    // calculateQuote) also drops unknown ids and keeps only one mileage plan.
    const quote = calculateQuote({
      start,
      end,
      pickupTime,
      returnTime,
      extraIds,
      promoCode,
      prepaymentOption,
    });

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
      customer_email: guest.email,
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
        acceptedTerms: "true",
        termsVersion: TERMS_VERSION,
        guestFirstName: guest.firstName,
        guestLastName: guest.lastName,
        guestEmail: guest.email,
        guestPhone: guest.phone,
        adults: String(guest.adults),
        children: String(guest.children),
        message: guest.message || "",
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe create-checkout error:", err);
    return res.status(500).json({ error: err.message });
  }
}
