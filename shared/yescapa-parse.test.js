import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYescapaBooking } from "./yescapa-parse.js";

// Text as recognised from a screenshot of the Yescapa booking page.
const PAGE = `Reservas Anuncios Bandeja de entrada Opiniones Cuenta
Reserva del 27 de noviembre de 2026 al 30 de noviembre de 2026
La reserva ha sido confirmada.
Referencia #3499169
Vehículo 1022MPG
27 de noviembre de
2026
A partir de las 14
30 de noviembre de
2026
Antes de las 12
Número de viajeros 3
Remuneración 299,34 €
Seguro Aportado por el propietario profesional
Fianza 900,00 €
Viajero
Enviar un mensaje
S
Saul Jara Sánchez
pescadosymariscossaul@gmail.com
+34 678 72 99 74`;

test("reads a Yescapa booking page", () => {
  const r = parseYescapaBooking(PAGE);
  assert.equal(r.yescapaRef, "3499169");
  assert.equal(r.startDate, "2026-11-27");
  assert.equal(r.endDate, "2026-11-30");
  assert.equal(r.pickupTime, "14:00");
  assert.equal(r.returnTime, "12:00");
  assert.equal(r.travellers, 3);
  assert.equal(r.payout, 299.34);
  assert.equal(r.guestName, "Saul Jara Sánchez");
  assert.equal(r.email, "pescadosymariscossaul@gmail.com");
  assert.equal(r.phone, "+34 678 72 99 74");
  assert.equal(r.language, "es");
});

test("reads an English email with numeric dates", () => {
  const r = parseYescapaBooking(`New booking request confirmed
Booking no. 3500001
Traveller
John Smith
john.smith@example.co.uk
+44 7700 900123
From 05/06/2027 to 12/06/2027
Travellers: 2
Total price: 1.234,50 €
From 15:00 Before 11:00
notifications@yescapa.com`);
  assert.equal(r.yescapaRef, "3500001");
  assert.equal(r.startDate, "2027-06-05");
  assert.equal(r.endDate, "2027-06-12");
  assert.equal(r.guestName, "John Smith");
  assert.equal(r.email, "john.smith@example.co.uk");
  assert.equal(r.language, "en");
  assert.equal(r.total, 1234.5);
  assert.equal(r.pickupTime, "15:00");
  assert.equal(r.returnTime, "11:00");
});
