import Stripe from "stripe";
import { BOOKINGS_PREFIX } from "./_lib/prefix.js";
import { blobStore, list } from "./_lib/blob.js";
import { randomInt } from "node:crypto";
import { createBlobStore } from "./_lib/store.js";
import { completeChangePayment } from "./_lib/manage.js";
import { esc, sendChangeEmails } from "./_lib/email.js";
import { createUserStore } from "./_lib/auth.js";
import { authSecret } from "./_lib/auth-secret.js";
import { checkoutKeys, createDiscountRegistry } from "./_lib/member-discount.js";
import { loadBlockedDates } from "./_lib/availability.js";
import { releaseHold } from "./_lib/holds.js";
import { occupiedDays } from "../shared/booking-changes.js";

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
    const { blobs } = await list({ prefix: BOOKINGS_PREFIX });
    if (!blobs.length) return [];
    const bookings = [];
    for (const blob of blobs) {
      const read = await blobStore.readJson(blob.pathname);
      if (read) bookings.push(read.data);
    }
    return bookings;
  } catch (err) {
    console.error("loadBookings failed:", err.message);
    return [];
  }
}

async function saveBooking(booking, { onlyIfNew = false } = {}) {
  const key = `${BOOKINGS_PREFIX}${booking.id}.json`;
  await blobStore.put(key, booking, onlyIfNew ? { allowOverwrite: false } : {});
}

async function ownerAlert(subject, html) {
  try {
    await postToResend({ from: "Camper Retreat VLC <info@campervlc.com>", to: process.env.OWNER_EMAIL, subject, html });
  } catch (err) {
    console.error("owner alert failed:", subject, "-", err.message);
  }
}

/** Paid for dates that were taken meanwhile: give the money back, tell both sides. */
async function refundDoubleBooking(booking, clash) {
  let refundId = null;
  try {
    const refund = await stripe.refunds.create(
      { payment_intent: booking.paymentIntentId, metadata: { reason: "dates_taken", sessionId: booking.id } },
      { idempotencyKey: `double-booking-${booking.id}` },
    );
    refundId = refund.id;
    console.log("double booking refunded", booking.id, refund.id);
  } catch (err) {
    console.error("CRITICAL double booking refund FAILED", booking.id, "-", err.message);
  }
  await ownerAlert(
    `Double booking refunded: ${booking.startDate}–${booking.endDate}`,
    `<p>A guest paid for dates that were already taken (${esc(clash.join(", "))}). ${refundId ? `The payment was refunded automatically (${esc(refundId)}).` : "<strong>The automatic refund FAILED — refund it in Stripe.</strong>"} No booking was created.</p>
     <p>Guest: ${esc(booking.guestFirstName)} ${esc(booking.guestLastName)} · ${esc(booking.guestEmail)} · ${esc(booking.guestPhone)}<br/>Stripe session: ${esc(booking.id)}</p>`,
  );
  try {
    await postToResend({
      from: "Camper Retreat VLC <info@campervlc.com>",
      to: booking.guestEmail,
      reply_to: "info@campervlc.com",
      subject: "Your payment has been refunded – dates no longer available",
      html: `<p>Hi ${esc(booking.guestFirstName)},</p>
        <p>Sorry — while you were paying, someone else booked some of the days you chose (${esc(booking.startDate)} → ${esc(booking.endDate)}). We have refunded your payment in full; it usually arrives within 5–10 business days.</p>
        <p>Reply to this email or WhatsApp us and we'll help you find other dates.</p>
        <p>— Camper Retreat VLC team</p>`,
    });
  } catch (err) {
    console.error("double booking guest email failed", booking.id, "-", err.message);
  }
}

async function recordMemberDiscount(booking, memberUserId) {
  let accountEmail = null;
  if (memberUserId) {
    try {
      const users = createUserStore();
      const found = await users.get(memberUserId);
      accountEmail = found?.user.email || null;
      if (found && !found.user.memberDiscountUsedAt) {
        await users.save(
          { ...found.user, memberDiscountUsedAt: Date.now(), memberDiscountBookingId: booking.id },
          { etag: found.etag },
        );
      }
    } catch (err) {
      console.error("could not mark the member discount as used for", memberUserId, "-", err.message);
    }
  }
  try {
    const keys = checkoutKeys({
      firstName: booking.guestFirstName,
      lastName: booking.guestLastName,
      phone: booking.guestPhone,
      email: booking.guestEmail,
      accountEmail,
    });
    const clashes = await createDiscountRegistry({ secret: authSecret() }).markUsed(keys, { bookingId: booking.id });
    if (clashes.length) {
      await ownerAlert(
        `First-booking discount given twice: ${booking.bookingRef}`,
        `<p>Booking ${esc(booking.bookingRef)} (${esc(booking.guestFirstName)} ${esc(booking.guestLastName)}) got the 5% first-booking discount, but the same ${esc([...new Set(clashes.map((c) => c.key.split(":")[0]))].join(", "))} already had it on another booking. Two checkouts were probably paid at the same time. You may ask the guest for the difference.</p>`,
      );
    }
  } catch (err) {
    console.error("could not record the member discount identity for", booking.id, "-", err.message);
  }
}

// Resend answers 4xx/5xx with a JSON error body, and fetch does NOT reject on
// those statuses — an unchecked call silently "succeeds". Surface the status and
// Resend's payload, then throw so the caller's rejection handling actually runs.
// The API key lives in the request header and is never logged.
async function postToResend(body) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "<response body unreadable>");
    console.error(
      `Resend send FAILED: ${res.status} ${res.statusText} · to=${body.to} · subject=${body.subject} · ${detail}`
    );
    throw new Error(`Resend ${res.status} for ${body.to}: ${detail}`);
  }

  return res.json().catch(() => ({}));
}

// "2026-10-07 10:00 → 2026-10-12 14:00". Bookings made before pickup/return
// times existed have none stored, so they keep the date-only form.
function formatDateRange({ startDate, endDate, pickupTime, returnTime }) {
  const from = pickupTime ? `${startDate} ${pickupTime}` : startDate;
  const to = returnTime ? `${endDate} ${returnTime}` : endDate;
  return `${from} → ${to}`;
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
    prepaymentOption,
    promoCode,
  } = booking;

  const siteUrl = process.env.SITE_URL || "https://campervlc.com";
  const isFullPayment = prepaymentOption === "full";

  const paymentLine = isFullPayment
    ? `<p><strong>Paid in full:</strong> €${depositAmount} ✅ — nothing due on pickup.</p>`
    : `<p><strong>Deposit paid (50%):</strong> €${depositAmount} ✅</p>
      <p><strong>Remaining balance (50%):</strong> €${remainingAmount} — due on pickup of the campervan in Valencia.</p>`;

  const promoLine = promoCode
    ? `<p><strong>Promo code applied:</strong> ${esc(promoCode)}</p>`
    : "";

  const body = {
    from: "Camper Retreat VLC <info@campervlc.com>",
    to: guestEmail,
    reply_to: "info@campervlc.com",
    subject: `Booking confirmed – ${startDate} → ${endDate}`,
    html: `
      <h2>Hi ${esc(guestFirstName)}! Your booking is confirmed 🎉</h2>
      <p style="font-size:18px"><strong>Booking reference: ${bookingRef}</strong></p>
      <p style="color:#666">Save this reference — you'll need it (along with this email address) to change or cancel the booking.</p>
      <p><strong>Dates:</strong> ${formatDateRange(booking)} (${nights} nights)</p>
      <hr />
      <p><strong>Total (incl. IVA 21%):</strong> €${totalWithIva}</p>
      ${promoLine}
      ${paymentLine}
      <hr />
      <p><strong>Change dates or add extras:</strong> <a href="${siteUrl}/manage-booking?ref=${encodeURIComponent(bookingRef)}">manage your booking</a> with your booking reference and this email address (online changes close 48 hours before pickup).</p>
      <p>Need to cancel? Visit <a href="${siteUrl}/cancel-booking">${siteUrl}/cancel-booking</a> with your booking reference and this email address — we'll email you a code to confirm. See the <a href="${siteUrl}/condiciones#cancelacion">cancellation terms</a> for refund details.</p>
      <p>Your booking is subject to our <a href="${siteUrl}/condiciones">rental conditions and rates</a>, which you accepted when booking.</p>
      <hr />
      <p>We'll be in touch to confirm pickup details. Questions? Reply to this email or WhatsApp us.</p>
      <p>— Camper Retreat VLC team</p>
    `,
  };

  await postToResend(body);
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
    prepaymentOption,
    promoCode,
    lateReturnHours,
    lateReturnSurcharge,
  } = booking;

  const isFullPayment = prepaymentOption === "full";
  const lateReturnLine = lateReturnSurcharge
    ? `<p><strong>Late return surcharge:</strong> €${lateReturnSurcharge} (+${lateReturnHours} h, before IVA)</p>`
    : "";

  const body = {
    from: "Camper Retreat VLC <info@campervlc.com>",
    to: process.env.OWNER_EMAIL,
    reply_to: "info@campervlc.com",
    subject: `New booking: ${`${guestFirstName} ${guestLastName}`.replace(/[\r\n]/g, " ")} · ${bookingRef} · ${startDate}–${endDate}`,
    html: `
      <h2>New booking received</h2>
      <p style="font-size:18px"><strong>Booking reference: ${bookingRef}</strong></p>
      <p><strong>Guest:</strong> ${esc(guestFirstName)} ${esc(guestLastName)}</p>
      <p><strong>Email:</strong> ${esc(guestEmail)}</p>
      <p><strong>WhatsApp/Phone:</strong> ${esc(guestPhone)}</p>
      <p><strong>Dates:</strong> ${formatDateRange(booking)} (${nights} nights)</p>
      ${lateReturnLine}
      <p><strong>Adults:</strong> ${esc(adults)} · <strong>Children:</strong> ${esc(children)}</p>
      <p><strong>Extras:</strong> ${esc((extraIds || []).join(", ")) || "none"}</p>
      <p><strong>Message:</strong> ${esc(message) || "—"}</p>
      <hr />
      <p><strong>Payment option:</strong> ${isFullPayment ? "100% paid now" : "50% deposit"}</p>
      <p><strong>Promo code used:</strong> ${esc(promoCode) || "none"}</p>${booking.memberDiscount ? "<p><strong>First-booking discount (login):</strong> yes</p>" : ""}
      <p><strong>Rental conditions accepted:</strong> ${booking.acceptedTerms ? `yes (version ${booking.termsVersion || "n/a"})` : "not recorded"}</p>
      <p><strong>Total (incl. IVA):</strong> €${totalWithIva}</p>
      <p><strong>Amount received:</strong> €${depositAmount}</p>
      <p><strong>Balance due on pickup:</strong> €${remainingAmount}</p>
    `,
  };

  await postToResend(body);
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

    // Payment of the difference for a self-service booking change: apply the
    // pending change instead of creating a booking. A 500 makes Stripe retry.
    if (m?.kind === "booking_change") {
      try {
        const result = await completeChangePayment(session, {
          store: createBlobStore(),
          stripe,
          sendEmails: sendChangeEmails,
          sendOwnerAlert: (text) =>
            postToResend({
              from: "Camper Retreat VLC <info@campervlc.com>",
              to: process.env.OWNER_EMAIL,
              subject: "Booking change payment needs attention",
              html: `<p>${text}</p>`,
            }),
          now: () => Date.now(),
        });
        console.log("booking_change webhook:", session.id, result.status);
        return res.status(200).json({ received: true });
      } catch (err) {
        console.error("booking_change webhook failed for", session.id, "-", err.message);
        return res.status(500).json({ error: "booking_change_failed" });
      }
    }

    // Stripe delivers an event at least once. A booking already saved for this
    // session must not be rebuilt: that would issue a new reference, resend the
    // emails and bring back a booking the guest has since changed or cancelled.
    const store = createBlobStore();
    try {
      if (await store.getBooking(session.id)) {
        console.log("checkout webhook repeated, booking already saved:", session.id);
        return res.status(200).json({ received: true, duplicate: true });
      }
    } catch (err) {
      console.error("webhook: could not check for an existing booking", session.id, "-", err.message);
      return res.status(500).json({ error: "store_unavailable" }); // Stripe retries
    }

    const existingBookings = await loadBookings();
    const bookingRef = await getUniqueBookingRef(existingBookings);

    const booking = {
      id: session.id,
      bookingRef,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      startDate: m.startDate,
      endDate: m.endDate,
      pickupTime: m.pickupTime || null,
      returnTime: m.returnTime || null,
      nights: Number(m.nights),
      lateReturnHours: m.lateReturnHours ? Number(m.lateReturnHours) : 0,
      lateReturnSurcharge: m.lateReturnSurcharge ? Number(m.lateReturnSurcharge) : 0,
      extraIds: m.extraIds ? m.extraIds.split(",").filter(Boolean) : [],
      totalWithIva: Number(m.totalWithIva),
      depositAmount: Number(m.depositAmount),
      remainingAmount: Number(m.remainingAmount),
      prepaymentOption: m.prepaymentOption === "full" ? "full" : "deposit",
      promoCode: m.promoCode || null,
      promoPct: m.promoPct ? Number(m.promoPct) : m.promoCode ? undefined : 0,
      memberDiscount: m.memberDiscount === "true",
      acceptedTerms: m.acceptedTerms === "true",
      termsVersion: m.termsVersion || null,
      guestFirstName: m.guestFirstName,
      guestLastName: m.guestLastName,
      guestEmail: m.guestEmail,
      guestPhone: m.guestPhone,
      adults: Number(m.adults),
      children: Number(m.children),
      message: m.message,
      stripeSessionId: session.id,
      paymentIntentId: session.payment_intent,
      stripeCustomerId: session.customer || null,
      cancelledAt: null,
      refundPct: null,
      refundAmount: null,
      refundId: null,
    };

    // The dates were free when the checkout opened, but another booking (here
    // or on Yescapa) may have taken them while the guest was paying. Then the
    // payment goes back and the owner is told; no booking is created.
    let clash = [];
    try {
      const { dates } = await loadBlockedDates({ bookings: existingBookings });
      clash = occupiedDays(booking.startDate, booking.endDate).filter((d) => dates.has(d));
    } catch (err) {
      console.error("webhook: availability re-check failed for", session.id, "-", err.message);
    }
    if (clash.length) {
      await refundDoubleBooking(booking, clash);
      await releaseHold(session.id).catch(() => {});
      return res.status(200).json({ received: true, refunded: true });
    }

    try {
      // Only if no booking file exists yet: a parallel retry of this same event loses here.
      await saveBooking(booking, { onlyIfNew: true });
      console.log("Booking saved:", booking.id, booking.bookingRef);
    } catch (err) {
      if (/exist|already/i.test(err.message)) {
        console.log("checkout webhook raced a retry, booking already saved:", session.id);
        return res.status(200).json({ received: true, duplicate: true });
      }
      console.error("saveBooking FAILED for", booking.id, "bookingRef", booking.bookingRef, "-", err.message);
      return res.status(500).json({ error: "save_failed" }); // Stripe retries
    }
    await releaseHold(session.id).catch((err) => console.warn("could not release the hold", session.id, "-", err.message));

    const [guestEmailResult, ownerEmailResult] = await Promise.allSettled([
      sendGuestEmail(booking),
      sendOwnerEmail(booking),
    ]);
    if (guestEmailResult.status === "rejected") {
      console.error("sendGuestEmail failed for", booking.id, "-", guestEmailResult.reason);
    }
    if (ownerEmailResult.status === "rejected") {
      console.error("sendOwnerEmail failed for", booking.id, "-", ownerEmailResult.reason);
    }

    // The login discount is for the first booking only, per person: use it up on
    // the account and on the guest's name, phone and email.
    if (booking.memberDiscount) {
      await recordMemberDiscount(booking, m.memberUserId);
    }
  }

  return res.status(200).json({ received: true });
}
