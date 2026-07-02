import Stripe from "stripe";
import { list, put, get } from "@vercel/blob";
import { randomInt } from "node:crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

// No 0/O/1/I — avoids visually ambiguous characters in a human-typed reference.
const REF_CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateBookingRef() {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += REF_CHARSET[randomInt(REF_CHARSET.length)];
  }
  return `CVLC-${code}`;
}

async function getUniqueBookingRef(existingBookings) {
  const taken = new Set(existingBookings.map((b) => b.bookingRef));
  for (let attempt = 0; attempt < 10; attempt++) {
    const ref = generateBookingRef();
    if (!taken.has(ref)) return ref;
  }
  // Astronomically unlikely at this booking volume — fall back to a longer code.
  return `CVLC-${generateBookingRef().slice(5)}${generateBookingRef().slice(5)}`;
}

// Disable body parsing — Stripe signature verification needs the raw body
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

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
  } catch (err) {
    console.error("loadBookings failed:", err.message);
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

async function sendGuestEmail(booking) {
  const {
    guestFirstName,
    guestEmail,
    startDate,
    endDate,
    nights,
    depositAmount,
    remainingAmount,
    totalWithIva,
    bookingRef,
  } = booking;

  const siteUrl = process.env.SITE_URL || "https://campervlc.com";

  const body = {
    from: "Camper Retreat VLC <onboarding@resend.dev>",
    to: guestEmail,
    reply_to: process.env.OWNER_EMAIL,
    subject: `Booking confirmed – ${startDate} → ${endDate}`,
    html: `
      <h2>Hi ${guestFirstName}! Your booking is confirmed 🎉</h2>
      <p style="font-size:18px"><strong>Booking reference: ${bookingRef}</strong></p>
      <p style="color:#666">Save this reference — you'll need it (along with your last name) if you ever need to cancel.</p>
      <p><strong>Dates:</strong> ${startDate} → ${endDate} (${nights} nights)</p>
      <hr />
      <p><strong>Total (incl. IVA 21%):</strong> €${totalWithIva}</p>
      <p><strong>Deposit paid (50%):</strong> €${depositAmount} ✅</p>
      <p><strong>Remaining balance (50%):</strong> €${remainingAmount} — due on pickup of the campervan in Valencia.</p>
      <hr />
      <p>Need to cancel? Visit <a href="${siteUrl}/cancel-booking">${siteUrl}/cancel-booking</a> using your booking reference and last name. See our <a href="${siteUrl}/cancellation-policy">cancellation policy</a> for refund terms.</p>
      <hr />
      <p>We'll be in touch to confirm pickup details. Questions? Reply to this email or WhatsApp us.</p>
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

async function sendOwnerEmail(booking) {
  const {
    guestFirstName,
    guestLastName,
    guestEmail,
    guestPhone,
    adults,
    children,
    message,
    startDate,
    endDate,
    nights,
    depositAmount,
    remainingAmount,
    totalWithIva,
    extraIds,
    bookingRef,
  } = booking;

  const body = {
    from: "Booking System <onboarding@resend.dev>",
    to: process.env.OWNER_EMAIL,
    subject: `New booking: ${guestFirstName} ${guestLastName} · ${bookingRef} · ${startDate}–${endDate}`,
    html: `
      <h2>New booking received</h2>
      <p style="font-size:18px"><strong>Booking reference: ${bookingRef}</strong></p>
      <p><strong>Guest:</strong> ${guestFirstName} ${guestLastName}</p>
      <p><strong>Email:</strong> ${guestEmail}</p>
      <p><strong>WhatsApp/Phone:</strong> ${guestPhone}</p>
      <p><strong>Dates:</strong> ${startDate} → ${endDate} (${nights} nights)</p>
      <p><strong>Adults:</strong> ${adults} · <strong>Children:</strong> ${children}</p>
      <p><strong>Extras:</strong> ${extraIds || "none"}</p>
      <p><strong>Message:</strong> ${message || "—"}</p>
      <hr />
      <p><strong>Total (incl. IVA):</strong> €${totalWithIva}</p>
      <p><strong>Deposit received:</strong> €${depositAmount}</p>
      <p><strong>Balance due on pickup:</strong> €${remainingAmount}</p>
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const m = session.metadata;

    const existingBookings = await loadBookings();
    const bookingRef = await getUniqueBookingRef(existingBookings);

    const booking = {
      id: session.id,
      bookingRef,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      startDate: m.startDate,
      endDate: m.endDate,
      nights: Number(m.nights),
      extraIds: m.extraIds ? m.extraIds.split(",").filter(Boolean) : [],
      totalWithIva: Number(m.totalWithIva),
      depositAmount: Number(m.depositAmount),
      remainingAmount: Number(m.remainingAmount),
      guestFirstName: m.guestFirstName,
      guestLastName: m.guestLastName,
      guestEmail: m.guestEmail,
      guestPhone: m.guestPhone,
      adults: Number(m.adults),
      children: Number(m.children),
      message: m.message,
      stripeSessionId: session.id,
      paymentIntentId: session.payment_intent,
      cancelledAt: null,
      refundPct: null,
      refundAmount: null,
      refundId: null,
    };

    const results = await Promise.allSettled([
      saveBooking(booking),
      sendGuestEmail(booking),
      sendOwnerEmail(booking),
    ]);

    const [saveResult, guestEmailResult, ownerEmailResult] = results;
    if (saveResult.status === "rejected") {
      console.error("saveBooking FAILED for", booking.id, "bookingRef", booking.bookingRef, "-", saveResult.reason);
    } else {
      console.log("Booking saved:", booking.id, booking.bookingRef);
    }
    if (guestEmailResult.status === "rejected") {
      console.error("sendGuestEmail failed for", booking.id, "-", guestEmailResult.reason);
    }
    if (ownerEmailResult.status === "rejected") {
      console.error("sendOwnerEmail failed for", booking.id, "-", ownerEmailResult.reason);
    }
  }

  return res.status(200).json({ received: true });
}
