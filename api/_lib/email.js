// Booking-change emails, sent through Resend from info@campervlc.com.

const FROM = "Camper Retreat VLC <info@campervlc.com>";
const REPLY_TO = "info@campervlc.com";

export function siteUrl() {
  return process.env.SITE_URL || "https://campervlc.com";
}

export function manageBookingUrl(bookingRef) {
  return `${siteUrl()}/manage-booking?ref=${encodeURIComponent(bookingRef)}`;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function range(s) {
  return `${s.startDate} ${s.pickupTime} → ${s.endDate} ${s.returnTime}`;
}

function extrasList(ids) {
  const optional = (ids || []).filter((id) => id !== "cleaning_fee");
  return optional.length ? optional.join(", ") : "none";
}

// Resend answers 4xx/5xx with a JSON body and fetch does not reject on those,
// so check the status and throw. The API key is never logged.
export async function postToResend(body, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "<response body unreadable>");
    console.error(`Resend send FAILED: ${res.status} · to=${body.to} · subject=${body.subject} · ${detail}`);
    throw new Error(`Resend ${res.status} for ${body.to}: ${detail}`);
  }
  return res.json().catch(() => ({}));
}

function settlementLine(change, booking) {
  const s = change.settlement;
  if (s.type === "refund") {
    return `<p><strong>Refund:</strong> €${s.amount} back to your card. It usually arrives within 5–10 business days.</p>`;
  }
  if (s.type === "charge") {
    return `<p><strong>Paid for this change:</strong> €${s.amount} ✅</p>`;
  }
  if (booking.remainingAmount > 0) {
    return `<p><strong>Balance due on pickup:</strong> €${booking.remainingAmount}</p>`;
  }
  return `<p>Nothing more to pay.</p>`;
}

export function buildChangeEmails(booking, change) {
  const old = change.old;
  const now = change.new;
  const datesChanged =
    old.startDate !== now.startDate ||
    old.endDate !== now.endDate ||
    old.pickupTime !== now.pickupTime ||
    old.returnTime !== now.returnTime;
  const added = now.extraIds.filter((id) => !old.extraIds.includes(id));
  const removed = old.extraIds.filter((id) => !now.extraIds.includes(id));
  const retentionLine = change.retention
    ? `<p><strong>Retained for removed nights (${change.retentionPct}%, clause 4.1):</strong> €${change.retention}</p>`
    : "";

  const guest = {
    from: FROM,
    to: booking.guestEmail,
    reply_to: REPLY_TO,
    subject: `Booking updated – ${booking.bookingRef}`,
    html: `
      <h2>Hi ${esc(booking.guestFirstName)}, your booking has been updated</h2>
      <p><strong>Booking reference:</strong> ${esc(booking.bookingRef)}</p>
      <p><strong>Dates:</strong> ${esc(range(now))} (${now.nights} nights)</p>
      ${datesChanged ? `<p style="color:#666">Previously: ${esc(range(old))} (${old.nights} nights)</p>` : ""}
      <p><strong>Extras:</strong> ${esc(extrasList(now.extraIds))}</p>
      <hr />
      <p><strong>New total (incl. IVA 21%):</strong> €${now.totalWithIva}</p>
      ${retentionLine}
      <p><strong>Paid so far:</strong> €${now.amountPaid}</p>
      ${settlementLine(change, booking)}
      <hr />
      <p>See or change your booking: <a href="${manageBookingUrl(booking.bookingRef)}">${manageBookingUrl(booking.bookingRef)}</a></p>
      <p>Questions? Reply to this email or WhatsApp us.</p>
      <p>— Camper Retreat VLC team</p>
    `,
  };

  const stripeIds = [
    ...(change.refunds || []).map((r) => `refund ${r.refundId} (€${r.amount} from ${r.paymentIntentId})`),
    change.payment ? `payment ${change.payment.paymentIntentId} (€${change.payment.amount})` : null,
  ].filter(Boolean);

  const owner = {
    from: FROM,
    to: process.env.OWNER_EMAIL,
    reply_to: REPLY_TO,
    subject: `Booking changed: ${booking.guestFirstName} ${booking.guestLastName} · ${booking.bookingRef}`,
    html: `
      <h2>A guest changed their booking</h2>
      ${
        datesChanged
          ? `<p style="font-size:16px;color:#b42318"><strong>⚠️ Update the Yescapa calendar manually.</strong></p>`
          : ""
      }
      <p><strong>Booking reference:</strong> ${esc(booking.bookingRef)}</p>
      <p><strong>Guest:</strong> ${esc(booking.guestFirstName)} ${esc(booking.guestLastName)} · ${esc(booking.guestEmail)} · ${esc(booking.guestPhone)}</p>
      <p><strong>Dates:</strong> ${esc(range(old))} (${old.nights} nights) → <strong>${esc(range(now))}</strong> (${now.nights} nights)</p>
      <p><strong>Extras added:</strong> ${esc(added.join(", ") || "none")} · <strong>removed:</strong> ${esc(removed.join(", ") || "none")}</p>
      <hr />
      <p><strong>Total:</strong> €${old.totalWithIva} → €${now.totalWithIva}</p>
      ${retentionLine}
      <p><strong>Amount received:</strong> €${old.amountPaid} → €${now.amountPaid}</p>
      <p><strong>Balance due on pickup:</strong> €${old.balanceDue} → €${now.balanceDue}</p>
      <p><strong>Settlement:</strong> ${change.settlement.type} €${change.settlement.amount}</p>
      ${stripeIds.length ? `<p><strong>Stripe:</strong> ${esc(stripeIds.join(" · "))}</p>` : ""}
      <p style="color:#666">Change ${esc(change.id)} at ${esc(change.at)}</p>
    `,
  };

  return { guest, owner, datesChanged };
}

/** Sends both emails; failures are logged, never thrown — the change is already saved. */
export async function sendChangeEmails(booking, change, { send = postToResend } = {}) {
  const { guest, owner } = buildChangeEmails(booking, change);
  const [g, o] = await Promise.allSettled([send(guest), send(owner)]);
  if (g.status === "rejected") console.error("change email to guest failed for", booking.bookingRef, "-", g.reason);
  if (o.status === "rejected") console.error("change email to owner failed for", booking.bookingRef, "-", o.reason);
}
