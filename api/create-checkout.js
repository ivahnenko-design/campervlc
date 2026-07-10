import Stripe from "stripe";

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
      nights,
      extraIds,
      totalWithIva,
      guest,
      prepaymentOption,
      promoCode,
    } = req.body;

    if (!totalWithIva || !startDate || !endDate || !guest?.email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const isFullPayment = prepaymentOption === "full";
    const depositAmount = isFullPayment ? totalWithIva : Math.round(totalWithIva * 0.5);
    const remainingAmount = totalWithIva - depositAmount;

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
                ? `${startDate} → ${endDate} · ${nights} nights. Paid in full, nothing due on pickup.`
                : `${startDate} → ${endDate} · ${nights} nights. Remaining €${remainingAmount} due on pickup.`,
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
        nights: String(nights),
        extraIds: extraIds.join(","),
        totalWithIva: String(totalWithIva),
        depositAmount: String(depositAmount),
        remainingAmount: String(remainingAmount),
        prepaymentOption: isFullPayment ? "full" : "deposit",
        promoCode: promoCode || "",
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
