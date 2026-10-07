// Wires the manage-booking handlers to the real Stripe, Blob store, Yescapa
// feed and Resend. Tests build the same handlers with fakes instead.
import Stripe from "stripe";
import { createBlobStore } from "./store.js";
import { loadBlockedDates } from "./availability.js";
import { sendChangeEmails, siteUrl } from "./email.js";
import { createManageHandlers } from "./manage.js";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.basil" });
export const store = createBlobStore();

export const handlers = createManageHandlers({
  store,
  stripe,
  tokenSecret: process.env.MANAGE_BOOKING_SECRET,
  loadBlocked: ({ bookings, exceptBookingId }) => loadBlockedDates({ bookings, exceptBookingId }),
  sendEmails: (booking, change) => sendChangeEmails(booking, change),
  now: () => Date.now(),
  siteUrl,
});
