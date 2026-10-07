// Blob folder holding booking records. Production leaves BOOKINGS_BLOB_PREFIX
// unset; set it (e.g. "campervlc-bookings-test/") in the Vercel PREVIEW
// environment so test payments never touch real bookings or calendar.ics.
export const BOOKINGS_PREFIX = process.env.BOOKINGS_BLOB_PREFIX || "campervlc-bookings/";
