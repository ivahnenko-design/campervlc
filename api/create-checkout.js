import Stripe from "stripe";
import {
  BOOKING_MAX_DATE,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  calculateQuote,
  getMinNights,
  isValidTimeOption,
  parseIsoDate,
} from "../shared/pricing.js";

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
    } = req.body;

    if (!startDate || !endDate || !guest?.email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    if (!start || !end || end <= start) {
      return res.status(400).json({ error: "Invalid dates" });
    }
    if (end > BOOKING_MAX_DATE) {
      return res.status(400).json({ error: "Dates are beyond the booking window" });
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
