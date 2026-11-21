import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemoryContractStore, createContract } from "./contracts.js";
import { autoCreateContract, runContractReminders, madridToday, daysBetween } from "./contract-auto.js";

const booking = {
  bookingRef: "CR-ABC123",
  guestFirstName: "Ana",
  guestLastName: "López",
  guestEmail: "ana@example.com",
  guestPhone: "+34600000000",
  startDate: "2027-05-10",
  endDate: "2027-05-15",
  pickupTime: "10:00",
  returnTime: "10:00",
  totalWithIva: 605,
  language: "de",
};

function fakeProvider() {
  const sent = [];
  return { name: "own", sent, async invite(contract, token, opts = {}) { sent.push({ id: contract.id, token, reminder: !!opts.reminder, lang: contract.language }); } };
}

test("a site booking gets its contract and invite in the guest's language", async () => {
  const store = createMemoryContractStore();
  const provider = fakeProvider();
  const r = await autoCreateContract(booking, { store, provider, now: 1 });
  assert.equal(r.created, true);
  const [c] = await store.list();
  assert.equal(c.bookingRef, "CR-ABC123");
  assert.equal(c.source, "web");
  assert.equal(c.language, "de");
  assert.equal(c.priceTotal, 605);
  assert.equal(provider.sent.length, 1);
});

test("no second contract when one already exists for the booking", async () => {
  const { contract } = createContract({ ...booking, guestName: "Ana López", email: booking.guestEmail, source: "web" }, { now: 1 });
  const store = createMemoryContractStore([contract]);
  const provider = fakeProvider();
  const r = await autoCreateContract({ ...booking, bookingRef: "cr-abc123 " }, { store, provider, now: 2 });
  assert.equal(r.skipped, "exists");
  assert.equal(provider.sent.length, 0);
});

test("reminders go out 7 and 2 days before pickup, once each, with a fresh link", async () => {
  const now = Date.parse("2027-05-03T08:00:00Z"); // 7 days before 2027-05-10
  assert.equal(daysBetween(madridToday(now), "2027-05-10"), 7);
  const { contract } = createContract({ guestName: "Ana", email: "ana@example.com", startDate: "2027-05-10", endDate: "2027-05-15" }, { now: 1 });
  const store = createMemoryContractStore([contract]);
  const provider = fakeProvider();
  const owner = [];
  const r1 = await runContractReminders({ store, provider, sendOwner: async (rows) => owner.push(rows), nowMs: now });
  assert.deepEqual(r1.reminded, [contract.id]);
  assert.equal(provider.sent[0].reminder, true);
  const after = (await store.get(contract.id)).contract;
  assert.notEqual(after.tokenHash, contract.tokenHash);
  // Same day again: no duplicate.
  const r2 = await runContractReminders({ store, provider, sendOwner: async () => {}, nowMs: now + 3_600_000 });
  assert.deepEqual(r2.reminded, []);
  assert.equal(owner.length, 0); // 7 days out is not "soon"
  // Two days before: reminder + owner list.
  const r3 = await runContractReminders({ store, provider, sendOwner: async (rows) => owner.push(rows), nowMs: Date.parse("2027-05-08T08:00:00Z") });
  assert.deepEqual(r3.reminded, [contract.id]);
  assert.equal(owner.length, 1);
  assert.equal(owner[0][0].id, contract.id);
});

test("signed contracts get no reminder", async () => {
  const { contract } = createContract({ guestName: "Ana", email: "ana@example.com", startDate: "2027-05-10", endDate: "2027-05-15" }, { now: 1 });
  const store = createMemoryContractStore([{ ...contract, status: "signed" }]);
  const provider = fakeProvider();
  const r = await runContractReminders({ store, provider, sendOwner: async () => {}, nowMs: Date.parse("2027-05-08T08:00:00Z") });
  assert.deepEqual(r.reminded, []);
  assert.equal(provider.sent.length, 0);
});
