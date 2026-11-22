// PDF of a signed handover report (acta de entrega / devolución), in Spanish
// like annexes I-A / I-B of the paper contract. pdf-lib standard fonts only
// cover WinAnsi: text goes through pdfText (Cyrillic transliterated).
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { pdfText } from "./contract-pdf.js";
import { CHECKLIST, DAMAGE_TYPES, EXTRA_LABELS, compareActas, fuelLabel, newDamageMarks, suggestedCharges } from "../../shared/acta.js";

const A4 = [595.28, 841.89];
const M = 40;
const INK = rgb(0.1, 0.1, 0.1);
const GREY = rgb(0.45, 0.45, 0.45);
const LIGHT = rgb(0.75, 0.75, 0.75);
const RED = rgb(0.82, 0.1, 0.1);

export const CLAUSE =
  "El Arrendatario acepta la descripción del estado del vehículo y del equipamiento reflejada en esta Acta. Todo daño que no conste en ella se presumirá producido durante el alquiler, salvo prueba en contrario (apdo. 3.2).";

const TITLE = { checkin: "ACTA DE ENTREGA (CHECK-IN)", checkout: "ACTA DE DEVOLUCIÓN (CHECK-OUT)" };
const ANNEX = { checkin: "Anexo I-A del contrato de alquiler", checkout: "Anexo I-B del contrato de alquiler" };

/** ms -> "22/11/2026 10:31" in Spain. */
export function fmtMadrid(ms) {
  if (!Number.isFinite(ms)) return "-";
  return new Date(ms).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
/** "2026-11-22T10:30" -> "22/11/2026 10:30". */
export const fmtWall = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/.exec(String(s || ""));
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}` : "-";
};
const fmtDate = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? iso.split("-").reverse().join("/") : "-");
const yesNo = (v) => (v === true ? "Sí" : v === false ? "No" : "-");
const eur = (n) => `${Number(n).toFixed(2).replace(".", ",").replace(",00", "")} €`;
const extraNames = (ids) => (ids || []).filter((id) => !id.startsWith("km_")).map((id) => EXTRA_LABELS[id]?.es || id).join(", ");

function wrap(font, text, size, maxWidth) {
  const out = [];
  for (const para of pdfText(text).split("\n")) {
    let line = "";
    for (const w of para.split(" ")) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) <= maxWidth || !line) line = next;
      else {
        out.push(line);
        line = w;
      }
    }
    out.push(line);
  }
  return out;
}

/**
 * @param {object} args
 * @param {object} args.acta the acta (signatures present, with names and times)
 * @param {object|null} args.checkin the signed check-in when this is a check-out
 * @param {object} args.contract the rental contract record
 * @param {{name:string, plate:string}} args.vehicle
 * @param {{bytes:Uint8Array, width:number, height:number}|null} args.diagram PNG of the camper outline
 * @param {Buffer} args.staffSignature PNG
 * @param {Buffer} args.guestSignature PNG
 * @param {{bytes:Buffer, takenAt:number}[]} args.photos JPEG thumbnails (first 12 are drawn)
 * @param {number|null} args.dayRate for the late-return cap
 */
export async function buildActaPdf({ acta, checkin = null, contract, vehicle, diagram = null, staffSignature, guestSignature, photos = [], dayRate = null }) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page;
  let y;
  const W = A4[0] - M * 2;
  const newPage = () => {
    page = pdf.addPage(A4);
    y = A4[1] - M;
  };
  const ensure = (h) => {
    if (y - h < M + 14) newPage();
  };
  const text = (t, { size = 9.5, f = font, x = M, color = INK } = {}) => {
    ensure(size + 4);
    page.drawText(pdfText(t), { x, y: y - size, size, font: f, color });
    y -= size + 4;
  };
  const para = (t, { size = 9, indent = 0, color = INK, f = font, width = W } = {}) => {
    for (const l of wrap(f, t, size, width - indent)) {
      ensure(size + 3);
      page.drawText(l, { x: M + indent, y: y - size, size, font: f, color });
      y -= size + 3;
    }
  };
  const row = (label, value) => {
    const lines = wrap(font, value == null || value === "" ? "-" : String(value), 9.5, W - 140);
    ensure(lines.length * 12 + 2);
    page.drawText(pdfText(label), { x: M, y: y - 9, size: 9, font: bold, color: GREY });
    lines.forEach((l, i) => page.drawText(l, { x: M + 140, y: y - 9.5 - i * 12, size: 9.5, font, color: INK }));
    y -= lines.length * 12 + 2;
  };
  /** Short label/value pairs, two per line. */
  const pairs = (list) => {
    const half = W / 2;
    for (let i = 0; i < list.length; i += 2) {
      ensure(13);
      list.slice(i, i + 2).forEach(([label, value], j) => {
        const x = M + j * half;
        page.drawText(pdfText(label), { x, y: y - 9, size: 9, font: bold, color: GREY });
        page.drawText(pdfText(value || "-"), { x: x + (j ? 105 : 140), y: y - 9.5, size: 9.5, font, color: INK });
      });
      y -= 14;
    }
  };
  const heading = (t) => {
    y -= 6;
    ensure(30);
    page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.5, color: LIGHT });
    y -= 6;
    text(t, { size: 11, f: bold });
  };

  newPage();
  const k = acta.kind;
  text(TITLE[k], { size: 15, f: bold });
  text(`CAMPER RETREAT S.L. (B56742075) - ${ANNEX[k]} (version ${contract.version || "-"})`, { size: 8.5, color: GREY });
  text(`Contrato ${contract.id}${contract.bookingRef ? ` - Reserva ${contract.bookingRef}` : ""}`, { size: 8.5, color: GREY });
  y -= 4;

  heading("Datos");
  row("Vehículo", [vehicle.name, vehicle.plate && `matrícula ${vehicle.plate}`].filter(Boolean).join(" - "));
  row("Arrendatario", acta.guestName || contract.guestName);
  row("Alquiler", `${fmtDate(contract.startDate)} ${contract.pickupTime || ""} -> ${fmtDate(contract.endDate)} ${contract.returnTime || ""}`);
  pairs([
    ["Fecha y hora", fmtWall(acta.datetime)],
    ["Kilómetros", Number.isInteger(acta.odometerKm) ? `${acta.odometerKm.toLocaleString("es-ES")} km` : "-"],
    ["Combustible", fuelLabel(acta.fuel)],
    ["Mascotas a bordo", yesNo(acta.petsOnBoard)],
    ["Kilometraje", acta.kmPlan === "unlimited" ? "ilimitado" : `${acta.kmPlan === "200" ? 200 : 100} km por noche`],
    ...(k === "checkout" ? [["Olor tabaco/animales", yesNo(acta.smell)]] : []),
  ]);
  row("Opciones contratadas", extraNames(acta.extras) || "ninguna");

  // ── checklist in two columns ──
  heading("Estado y equipamiento");
  const colW = W / 2;
  const groups = [
    ["Estado", CHECKLIST.filter((c) => c.group === "estado")],
    ["Equipamiento", CHECKLIST.filter((c) => c.group === "equipo")],
  ];
  const rowsN = Math.max(...groups.map(([, items]) => items.length)) + 1;
  ensure(rowsN * 12 + 4);
  const top = y;
  groups.forEach(([title, items], gi) => {
    const x = M + gi * colW;
    let yy = top;
    page.drawText(title, { x, y: yy - 9, size: 9, font: bold, color: GREY });
    yy -= 12;
    for (const c of items) {
      const v = acta.checklist?.[c.key];
      const mark = v === true ? "[X]" : v === false ? "[  ]" : "[ - ]";
      page.drawText(mark, { x, y: yy - 9, size: 9, font: bold, color: v === false ? RED : INK });
      page.drawText(pdfText(`${c.es}: ${yesNo(v)}`), { x: x + 24, y: yy - 9, size: 9, font, color: INK });
      yy -= 12;
    }
  });
  y = top - rowsN * 12 - 2;

  // ── damage ──
  heading(k === "checkin" ? "Daños preexistentes observados en la entrega" : "Daños observados en la devolución");
  para("Leyenda: X golpe/abolladura · / arañazo · O rotura/fisura · (punto) falta pieza", { size: 8, color: GREY });
  const before = k === "checkout" ? checkin?.marks || [] : [];
  const marks = acta.marks || [];
  const fresh = new Set(k === "checkout" ? newDamageMarks(before, marks).map((m) => m.id) : marks.map((m) => m.id));
  const legend = [
    ...before.map((m, i) => ({ label: `E${i + 1}`, m, color: GREY, tag: "constaba en la entrega" })),
    ...marks.map((m, i) => ({
      label: String(i + 1),
      m,
      color: k === "checkout" && !fresh.has(m.id) ? GREY : RED,
      tag: k === "checkout" ? (fresh.has(m.id) ? "NUEVO" : "ya constaba en la entrega") : "",
    })),
  ];
  const legendLine = (l) =>
    `${l.label}. ${DAMAGE_TYPES[l.m.type]?.es || l.m.type}${l.m.note ? `: ${l.m.note}` : ""}${l.tag ? ` (${l.tag})` : ""}`;
  if (diagram) {
    const img = await pdf.embedPng(diagram.bytes);
    const dw = 160;
    const dh = (dw * img.height) / img.width;
    ensure(dh + 6);
    const x0 = M;
    const y0 = y - dh;
    page.drawImage(img, { x: x0, y: y0, width: dw, height: dh });
    page.drawRectangle({ x: x0, y: y0, width: dw, height: dh, borderColor: LIGHT, borderWidth: 0.5 });
    for (const l of legend) {
      const cx = x0 + l.m.x * dw;
      const cy = y0 + (1 - l.m.y) * dh;
      page.drawCircle({ x: cx, y: cy, size: 6.5, color: rgb(1, 1, 1), borderColor: l.color, borderWidth: 1.2 });
      const tw = bold.widthOfTextAtSize(l.label, 6.5);
      page.drawText(l.label, { x: cx - tw / 2, y: cy - 2.3, size: 6.5, font: bold, color: l.color });
    }
    // legend to the right of the drawing
    const lx = M + dw + 14;
    let ly = y;
    const lw = W - dw - 14;
    if (!legend.length) page.drawText(pdfText("Sin daños marcados."), { x: lx, y: ly - 9, size: 9, font, color: INK });
    let next = 0;
    for (; next < legend.length; next++) {
      const l = legend[next];
      const lines = wrap(font, legendLine(l), 8.5, lw);
      if (ly - lines.length * 11 < y0) break; // the rest continues below the drawing
      for (const line of lines) {
        page.drawText(line, { x: lx, y: ly - 8.5, size: 8.5, font, color: l.color === RED ? RED : INK });
        ly -= 11;
      }
    }
    y = y0 - 6;
    for (const l of legend.slice(next)) para(legendLine(l), { size: 8.5, color: l.color === RED ? RED : INK });
  } else if (legend.length) {
    for (const l of legend) para(legendLine(l), { size: 9, color: l.color === RED ? RED : INK });
  } else {
    para("Sin daños anotados.", { size: 9 });
  }

  if (acta.notes) {
    heading("Observaciones");
    para(acta.notes, { size: 9 });
  }

  // ── check-out: comparison and suggested charges ──
  if (k === "checkout") {
    const cmp = compareActas(checkin, acta, {
      startDate: contract.startDate,
      endDate: contract.endDate,
      returnTime: contract.returnTime,
      kmPlan: acta.kmPlan,
      extras: acta.extras,
    });
    heading("Comparación con el acta de entrega");
    if (!checkin) para("No hay acta de entrega firmada: kilómetros sin comparar, combustible comparado con depósito lleno.", { size: 8.5, color: GREY });
    row("Kilómetros recorridos", cmp.kmDriven != null ? `${cmp.kmDriven} km (${cmp.kmIn} -> ${cmp.kmOut})` : "-");
    row("Incluidos", cmp.kmIncluded == null ? "ilimitado" : `${cmp.kmIncluded} km (${cmp.nights} noches)`);
    row("Exceso", `${cmp.kmExtra} km`);
    row("Combustible", `${fuelLabel(cmp.fuelIn)} -> ${fuelLabel(cmp.fuelOut)} (${cmp.fuelDiff == null ? "-" : `${cmp.fuelDiff > 0 ? "+" : ""}${cmp.fuelDiff}/4`})`);
    row("Puntos no conformes", cmp.failedItems.map((key) => CHECKLIST.find((c) => c.key === key)?.es).join(", ") || "ninguno");
    row("Daños nuevos", cmp.newMarks.length ? String(cmp.newMarks.length) : "ninguno");
    row("Retraso", cmp.lateMinutes ? `${Math.floor(cmp.lateMinutes / 60)} h ${cmp.lateMinutes % 60} min` : "no");

    const charges = suggestedCharges(cmp, { dayRate });
    heading("Importes sugeridos (apdos. 3.4, 3.7, 3.8, 5.4 y 6.3)");
    para("Orientativo, según las tarifas del contrato. El Arrendador decide los importes; no se cobra nada automáticamente. Antes de un cargo posterior se envía la justificación y hay 5 días para alegaciones (apdo. 5.6).", {
      size: 8,
      color: GREY,
    });
    if (!charges.items.length) para("Ninguno.", { size: 9 });
    for (const it of charges.items) {
      const amount = it.amount != null ? eur(it.amount) : it.max ? `coste real, máx. ${eur(it.max)}` : "coste real";
      const lines = wrap(font, it.es, 9, W - 130);
      ensure(lines.length * 11 + 2);
      lines.forEach((l, i) => page.drawText(l, { x: M, y: y - 9 - i * 11, size: 9, font, color: INK }));
      const aw = bold.widthOfTextAtSize(pdfText(amount), 9);
      page.drawText(pdfText(amount), { x: M + W - aw, y: y - 9, size: 9, font: bold, color: INK });
      y -= lines.length * 11 + 2;
    }
    if (charges.items.length) {
      ensure(16);
      page.drawLine({ start: { x: M, y: y - 1 }, end: { x: M + W, y: y - 1 }, thickness: 0.5, color: LIGHT });
      y -= 4;
      const t = `Total sugerido: ${eur(charges.total)}${charges.open ? " + importes a coste real" : ""}`;
      const tw = bold.widthOfTextAtSize(pdfText(t), 10);
      page.drawText(pdfText(t), { x: M + W - tw, y: y - 10, size: 10, font: bold, color: INK });
      y -= 16;
    }
  }

  heading("Conformidad");
  para(`Fotografías fechadas tomadas: ${photos.length ? `sí, ${(acta.photos || []).length}` : "no"}.${k === "checkout" ? " Revisión realizada en presencia del Arrendatario: sí." : ""}`, { size: 9 });
  y -= 2;
  para(CLAUSE, { size: 9, f: bold });
  y -= 6;

  // ── signatures ──
  const boxW = (W - 20) / 2;
  const boxH = 60;
  ensure(boxH + 44);
  const sigs = [
    ["El Arrendador", staffSignature, acta.signatures.staff],
    ["El Arrendatario", guestSignature, acta.signatures.guest],
  ];
  for (let i = 0; i < 2; i++) {
    const [label, png, meta] = sigs[i];
    const x = M + i * (boxW + 20);
    page.drawText(label, { x, y: y - 9, size: 9, font: bold, color: GREY });
    page.drawRectangle({ x, y: y - 14 - boxH, width: boxW, height: boxH, borderColor: LIGHT, borderWidth: 0.5 });
    const img = await pdf.embedPng(png);
    const s = Math.min((boxW - 10) / img.width, (boxH - 8) / img.height, 1);
    page.drawImage(img, { x: x + 5, y: y - 10 - boxH + 4, width: img.width * s, height: img.height * s });
    page.drawText(pdfText(`Fdo.: ${meta.name}`), { x, y: y - 26 - boxH, size: 9, font, color: INK });
    page.drawText(pdfText(`${fmtMadrid(meta.at)} (hora de Madrid)`), { x, y: y - 38 - boxH, size: 8, font, color: GREY });
  }
  y -= boxH + 46;
  para("Firmado en la pantalla del dispositivo del Arrendador en presencia de ambas partes. Copia enviada por email al Arrendatario y al propietario del vehículo.", {
    size: 7.5,
    color: GREY,
  });

  // ── photo thumbnails ──
  const shown = photos.slice(0, 12);
  if (shown.length) {
    newPage();
    text(`Fotografías (${shown.length}${(acta.photos || []).length > shown.length ? ` de ${(acta.photos || []).length}` : ""})`, { size: 11, f: bold });
    y -= 4;
    const cols = 3;
    const gap = 10;
    const cw = (W - gap * (cols - 1)) / cols;
    const ch = cw * 0.75;
    for (let i = 0; i < shown.length; i++) {
      const col = i % cols;
      if (col === 0 && i > 0) y -= ch + 24;
      if (col === 0) ensure(ch + 24);
      const x = M + col * (cw + gap);
      try {
        const img = await pdf.embedJpg(shown[i].bytes);
        const s = Math.min(cw / img.width, ch / img.height);
        const w = img.width * s;
        const h = img.height * s;
        page.drawImage(img, { x: x + (cw - w) / 2, y: y - ch + (ch - h) / 2, width: w, height: h });
      } catch {
        page.drawText("(imagen no legible)", { x: x + 4, y: y - ch / 2, size: 8, font, color: GREY });
      }
      page.drawRectangle({ x, y: y - ch, width: cw, height: ch, borderColor: LIGHT, borderWidth: 0.5 });
      page.drawText(pdfText(`Foto ${i + 1} - ${fmtMadrid(shown[i].takenAt)}`), { x, y: y - ch - 11, size: 8, font, color: GREY });
    }
  }

  // page numbers
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const t = `${TITLE[k]} - contrato ${contract.id} - pág. ${i + 1}/${pages.length}`;
    p.drawText(pdfText(t), { x: M, y: 22, size: 7, font, color: GREY });
  });

  pdf.setTitle(`${TITLE[k]} ${contract.id}`);
  pdf.setAuthor("CAMPER RETREAT S.L.");
  pdf.setSubject(ANNEX[k]);
  return pdf.save();
}
