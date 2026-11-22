import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_VEHICLE_ID,
  VEHICLES,
  activeVehicles,
  isActiveVehicleId,
  normalizePlate,
  vehicleByCity,
  vehicleByPlate,
  vehicleOf,
} from "../../shared/vehicles.js";
import { ownerRecipients, yescapaFeedUrl } from "./vehicles.js";
import { bookedDays, loadBlockedDates } from "./availability.js";
import { holdDays, holdOwner } from "./holds.js";

const ICS = (start, end) =>
  `BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:${start}\r\nDTEND;VALUE=DATE:${end}\r\nEND:VEVENT\r\nEND:VCALENDAR`;

test("registry: vehicle 1 is the only active camper for now", () => {
  assert.equal(DEFAULT_VEHICLE_ID, "vlc-yearling");
  assert.deepEqual(activeVehicles().map((v) => v.id), ["vlc-yearling"]);
  assert.ok(VEHICLES.some((v) => v.id === "alc-partner" && !v.active));
  assert.equal(isActiveVehicleId("vlc-yearling"), true);
  assert.equal(isActiveVehicleId("alc-partner"), false);
  assert.equal(isActiveVehicleId("nope"), false);
  assert.equal(vehicleByCity("valencia")?.id, "vlc-yearling");
  assert.equal(vehicleByCity("alicante"), null); // inactive
});

test("vehicleOf: old records without vehicleId belong to vehicle 1", () => {
  assert.equal(vehicleOf({ id: "cs_1" }), "vlc-yearling");
  assert.equal(vehicleOf({ vehicleId: "" }), "vlc-yearling");
  assert.equal(vehicleOf({ vehicleId: "unknown-camper" }), "vlc-yearling");
  assert.equal(vehicleOf(null), "vlc-yearling");
  assert.equal(vehicleOf(undefined), "vlc-yearling");
  assert.equal(vehicleOf({ vehicleId: "alc-partner" }), "alc-partner");
});

test("plates: any spelling finds the camper", () => {
  assert.equal(normalizePlate("1022 mpg"), "1022MPG");
  assert.equal(normalizePlate("1022-MPG"), "1022MPG");
  assert.equal(vehicleByPlate("1022 MPG")?.id, "vlc-yearling");
  assert.equal(vehicleByPlate("9999XYZ"), null);
  assert.equal(vehicleByPlate(""), null);
});

test("owner emails: vehicle 1 as before, partner camper only to the partner", () => {
  const env = { OWNER_EMAIL: "boss@x.com", PARTNER_EMAIL: "partner@y.com" };
  assert.deepEqual(ownerRecipients("vlc-yearling", "boss@x.com", env), ["boss@x.com"]);
  assert.deepEqual(ownerRecipients("alc-partner", "boss@x.com", env), ["partner@y.com"]);
  // Partner address missing: the company owner gets it so nothing is lost.
  assert.deepEqual(ownerRecipients("alc-partner", "boss@x.com", { OWNER_EMAIL: "boss@x.com" }), ["boss@x.com"]);
});

test("Yescapa feed: vehicle 1 keeps its variable and fallback, others need their own", () => {
  assert.equal(yescapaFeedUrl("vlc-yearling", { YESCAPA_ICS_URL: "https://a" }), "https://a");
  assert.equal(yescapaFeedUrl("vlc-yearling", { YESCAPA_ICAL_URL: "https://b" }), "https://b");
  assert.match(yescapaFeedUrl("vlc-yearling", {}), /^https:\/\/www\.yescapa\.es\/ical\//);
  assert.equal(yescapaFeedUrl("alc-partner", { YESCAPA_ICS_URL: "https://a" }), null);
  assert.equal(yescapaFeedUrl("alc-partner", { YESCAPA_ICS_URL_ALC: "https://c" }), "https://c");
});

const bookings = [
  { id: "a", startDate: "2027-05-01", endDate: "2027-05-03", status: "confirmed" }, // old, no vehicleId
  { id: "b", vehicleId: "vlc-yearling", startDate: "2027-06-01", endDate: "2027-06-02", status: "confirmed" },
  { id: "c", vehicleId: "alc-partner", startDate: "2027-07-01", endDate: "2027-07-02", status: "confirmed" },
  { id: "d", vehicleId: "vlc-yearling", startDate: "2027-08-01", endDate: "2027-08-02", status: "cancelled" },
];

test("availability: only the same camper's bookings block its days", () => {
  const v1 = bookedDays(bookings, { vehicleId: "vlc-yearling" });
  assert.ok(v1.has("2027-05-01") && v1.has("2027-06-01"));
  assert.ok(!v1.has("2027-07-01"));
  assert.ok(!v1.has("2027-08-01"));
  const v2 = bookedDays(bookings, { vehicleId: "alc-partner" });
  assert.ok(!v2.has("2027-05-01") && !v2.has("2027-06-01"));
  assert.ok(v2.has("2027-07-01"));
  const except = bookedDays(bookings, { vehicleId: "vlc-yearling", exceptBookingId: "a" });
  assert.ok(!except.has("2027-05-01"));
});

test("availability: each camper reads its own Yescapa feed", async () => {
  const seen = [];
  const fetchImpl = async (url) => {
    seen.push(url);
    return { ok: true, text: async () => (url === "https://alc" ? ICS("20270901", "20270903") : ICS("20271001", "20271002")) };
  };
  const env = { YESCAPA_ICS_URL: "https://vlc", YESCAPA_ICS_URL_ALC: "https://alc" };
  const v1 = await loadBlockedDates({ bookings, vehicleId: "vlc-yearling", fetchImpl, env });
  assert.equal(v1.yescapaOk, true);
  assert.ok(v1.dates.has("2027-10-01") && !v1.dates.has("2027-09-01") && !v1.dates.has("2027-07-01"));
  const v2 = await loadBlockedDates({ bookings, vehicleId: "alc-partner", fetchImpl, env });
  assert.ok(v2.dates.has("2027-09-01") && v2.dates.has("2027-07-01") && !v2.dates.has("2027-10-01") && !v2.dates.has("2027-05-01"));
  assert.deepEqual(seen, ["https://vlc", "https://alc"]);
  // Default call (old callers) = vehicle 1.
  const legacy = await loadBlockedDates({ bookings, fetchImpl, env });
  assert.ok(legacy.dates.has("2027-05-01"));
});

test("availability: a camper without its feed configured is not bookable (fail closed)", async () => {
  const r = await loadBlockedDates({ bookings, vehicleId: "alc-partner", fetchImpl: async () => ({ ok: true, text: async () => "" }), env: {} });
  assert.equal(r.yescapaOk, false);
});

test("holds: only open checkouts of the same camper block days", () => {
  const now = 1_000;
  const holds = [
    { sessionId: "s1", startDate: "2027-05-01", endDate: "2027-05-02", expiresAt: 2_000, owner: holdOwner("x@x.com") }, // old: vehicle 1
    { sessionId: "s2", vehicleId: "alc-partner", startDate: "2027-06-01", endDate: "2027-06-02", expiresAt: 2_000, owner: holdOwner("y@y.com") },
    { sessionId: "s3", vehicleId: "vlc-yearling", startDate: "2027-07-01", endDate: "2027-07-02", expiresAt: 500, owner: holdOwner("z@z.com") }, // expired
    { sessionId: "s4", vehicleId: "vlc-yearling", startDate: "2027-08-01", endDate: "2027-08-02", expiresAt: 2_000, owner: holdOwner("me@me.com") },
  ];
  const v1 = holdDays(holds, now, { vehicleId: "vlc-yearling" });
  assert.ok(v1.has("2027-05-01") && v1.has("2027-08-01"));
  assert.ok(!v1.has("2027-06-01") && !v1.has("2027-07-01"));
  const v2 = holdDays(holds, now, { vehicleId: "alc-partner" });
  assert.ok(v2.has("2027-06-01") && !v2.has("2027-05-01"));
  // The guest's own hold does not block them; nor does the given session.
  const mine = holdDays(holds, now, { vehicleId: "vlc-yearling", exceptEmail: "ME@me.com", exceptSessionId: "s1" });
  assert.ok(!mine.has("2027-08-01") && !mine.has("2027-05-01"));
});
