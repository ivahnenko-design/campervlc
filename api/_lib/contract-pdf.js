// Builds the signed contract: the blank contract PDF (CONTRACT_PDF_PATH) plus one extra page
// with the signer's data, the consents, the drawn signature and the audit
// facts (time, IP, hashes). pdf-lib's built-in fonts only cover WinAnsi, so
// text is transliterated for the PDF; the original Unicode data stays in the
// JSON record.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { contractPdfPathOf, vehicleView } from "./contracts.js";

const CYR = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", є: "ye", ё: "e", ж: "zh", з: "z", и: "i", і: "i", ї: "yi",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Text the standard fonts can draw: Latin-1 + euro, Cyrillic transliterated, the rest "?". */
export function pdfText(value) {
  let out = "";
  for (const ch of String(value ?? "").normalize("NFC")) {
    const lower = ch.toLowerCase();
    if (CYR[lower] !== undefined) {
      const t = CYR[lower];
      out += ch === lower ? t : t.charAt(0).toUpperCase() + t.slice(1);
    } else if (ch === "€" || (ch >= " " && ch <= "~") || (ch >= "¡" && ch <= "ÿ")) {
      out += ch;
    } else if (/\s/.test(ch)) {
      out += " ";
    } else {
      out += "?";
    }
  }
  return out;
}

const DOC_LABEL = { dni: "DNI", nie: "NIE", passport: "Pasaporte", id_card: "Documento de identidad" };

function wrap(font, text, size, maxWidth) {
  const words = pdfText(text).split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}


// Where the blank contract has its own signature block ("FIRMAS"): the
// signatures and names are also stamped there, over the "Fdo. ____" lines.
// Coordinates in PDF points from the bottom-left, measured with pdftotext -bbox.
const SIGNATURE_BLOCKS = {
  "/contracts/contrato-v7.pdf": {
    page: 12,
    lessor: { x: 95, line: 841.92 - 211, width: 160 },
    lessee: { x: 371, line: 841.92 - 211, width: 160 },
    lessorName: { x: 37, y: 841.92 - 234 },
    lesseeDoc: { x: 432, y: 841.92 - 221.5 },
  },
  "/contracts/contrato-v8.pdf": {
    page: 12,
    lessor: { x: 95, line: 841.92 - 567.2, width: 160 },
    lessee: { x: 371, line: 841.92 - 567.2, width: 160 },
    lessorName: { x: 37, y: 841.92 - 590.3 },
    lesseeDoc: { x: 432, y: 841.92 - 577.7 },
  },
};

async function stampSignatureBlock(pdf, font, contract, data, signaturePng, owner) {
  const block = SIGNATURE_BLOCKS[contractPdfPathOf(contract)];
  if (!block) return;
  const page = pdf.getPages()[block.page];
  if (!page) return;
  const ink = rgb(0.05, 0.1, 0.3);
  const put = async (png, spot) => {
    if (!png) return;
    const img = await pdf.embedPng(png);
    const scale = Math.min(spot.width / img.width, 34 / img.height);
    page.drawImage(img, { x: spot.x, y: spot.line - 2, width: img.width * scale, height: img.height * scale });
  };
  await put(signaturePng, block.lessee);
  if (owner) {
    await put(owner.signaturePng, block.lessor);
    page.drawText(pdfText(owner.name), { x: block.lessorName.x, y: block.lessorName.y, size: 8.5, font, color: ink });
  }
  const docText = `${DOC_LABEL[data.docType] || ""} ${data.docNumber}`.trim();
  page.drawText(pdfText(docText), { x: block.lesseeDoc.x, y: block.lesseeDoc.y, size: 8, font, color: ink });
}

// The blanks of the particular conditions (pages 1-2) are filled in like a
// paper contract: the dotted line is covered with white and the value written
// over it. Boxes from pdftotext -bbox of contrato-v7.pdf (top-left origin,
// points); toPdf() flips them. The version line under the title is hidden.
const H = 841.92;
const FILL_BLANKS = {
  "/contracts/contrato-v7.pdf": {
    hide: [{ page: 0, x0: 140, x1: 456, top: 73.5, bottom: 84 }],
    fields: [
      // page 1: place and date, lessee, additional driver, booking
      { page: 0, key: "placeDate", boxes: [[92.4, 189.7, 117.4, 127.1], [364.0, 461.3, 117.4, 127.1]], maxX: [291, 558] },
      { page: 0, key: "fullName", line: 320.6 },
      { page: 0, key: "doc", line: 333.4 },
      { page: 0, key: "docDates", line: 345.4 },
      { page: 0, key: "licenseNumber", line: 358.1 },
      { page: 0, key: "licenseCountry", line: 381.4 },
      { page: 0, key: "licenseDates", line: 394.1 },
      { page: 0, key: "birth", line: 406.1 },
      { page: 0, key: "nationality", line: 418.9 },
      { page: 0, key: "address", line: 430.9 },
      { page: 0, key: "contact", line: 454.9 },
      { page: 0, key: "taxResidence", line: 466.9 },
      { page: 0, key: "extraDriverName", line: 497.6 },
      { page: 0, key: "extraDriverDoc", line: 509.6 },
      { page: 0, key: "extraDriverLicense", line: 522.4 },
      { page: 0, key: "bookingRef", boxes: [[126.4, 161.2, 776.6, 786.4], [395.5, 430.3, 776.6, 786.4]], maxX: [291, 558] },
      // page 2: dates and price
      { page: 1, key: "pickup", boxes: [[126.1, 223.4, 37.1, 46.9], [407.5, 504.8, 37.1, 46.9]], maxX: [291, 558] },
      { page: 1, key: "return", boxes: [[163.4, 260.7, 62.6, 72.4], [419.0, 516.3, 62.6, 72.4]], maxX: [291, 558] },
      { page: 1, key: "price", boxes: [[186.2, 283.5, 99.4, 109.1], [434.7, 532.0, 99.4, 109.1]], maxX: [291, 558] },
    ],
    // ☐ campervlc.com / Yescapa / other, Spanish and English column
    sourceBoxes: {
      web: [[150.7, 767.5, 157.9, 775.4], [396.0, 767.5, 403.2, 775.4]],
      yescapa: [[219.5, 767.5, 226.6, 775.4], [464.8, 767.5, 471.9, 775.4]],
      other: [[261.4, 767.5, 268.5, 775.4], [506.7, 767.5, 513.8, 775.4]],
    },
  },
  "/contracts/contrato-v8.pdf": {
    hide: [],
    fields: [
      { page: 0, key: "placeDate", boxes: [[92.4, 189.7, 100.9, 110.6], [364.0, 461.3, 100.9, 110.6]], maxX: [291, 558] },
      { page: 0, key: "fullName", line: 304.9 },
      { page: 0, key: "doc", line: 317.6 },
      { page: 0, key: "docDates", line: 329.6 },
      { page: 0, key: "licenseNumber", line: 342.4 },
      { page: 0, key: "licenseCountry", line: 365.6 },
      { page: 0, key: "licenseDates", line: 377.6 },
      { page: 0, key: "birth", line: 390.4 },
      { page: 0, key: "nationality", line: 402.4 },
      { page: 0, key: "address", line: 415.1 },
      { page: 0, key: "contact", line: 438.4 },
      { page: 0, key: "taxResidence", line: 451.1 },
      { page: 0, key: "extraDriverName", line: 481.9 },
      { page: 0, key: "extraDriverDoc", line: 493.9 },
      { page: 0, key: "extraDriverLicense", line: 506.6 },
      { page: 0, key: "bookingRef", boxes: [[126.4, 161.2, 760.9, 770.6], [395.5, 430.3, 760.9, 770.6]], maxX: [291, 558] },
      { page: 0, key: "pickup", boxes: [[126.1, 223.4, 773.6, 783.4], [407.5, 504.8, 773.6, 783.4]], maxX: [291, 558] },
      { page: 1, key: "return", boxes: [[163.4, 260.7, 37.1, 46.9], [419.0, 516.3, 37.1, 46.9]], maxX: [291, 558] },
      { page: 1, key: "price", boxes: [[186.2, 283.5, 73.9, 83.6], [434.7, 532.0, 73.9, 83.6]], maxX: [291, 558] },
    ],
    sourceBoxes: {
      web: [[150.7, 751.8, 157.9, 759.6], [396.0, 751.8, 403.2, 759.6]],
      yescapa: [[219.5, 751.8, 226.6, 759.6], [464.8, 751.8, 471.9, 759.6]],
      other: [[261.4, 751.8, 268.5, 759.6], [506.7, 751.8, 513.8, 759.6]],
    },
  },
};

const dmy = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? iso.split("-").reverse().join("/") : iso || "");

function blankValues(contract, data, signedAt) {
  const docLabel = DOC_LABEL[data.docType] || "";
  const address = [data.street, data.postalCode, data.city, data.country].filter(Boolean).join(", ");
  const v = vehicleView(contract);
  return {
    placeDate: `${v.city || "Valencia"}, ${dmy(new Date(signedAt).toISOString().slice(0, 10))} (firma electronica / e-signature)`,
    fullName: data.fullName,
    doc: `${docLabel} ${data.docNumber}`.trim(),
    docDates: data.docExpiry ? `- / ${dmy(data.docExpiry)}` : "",
    licenseNumber: data.licenseNumber,
    licenseCountry: data.licenseCountry,
    licenseDates: `${data.licenseIssued ? dmy(data.licenseIssued) : "-"} / ${dmy(data.licenseExpiry)}`,
    birth: [dmy(data.birthDate), data.birthCountry].filter(Boolean).join(", "),
    nationality: data.nationality,
    address,
    contact: [data.phone, contract.email].filter(Boolean).join(" / "),
    taxResidence: data.taxResidence || data.country,
    extraDriverName: data.extraDriverName,
    extraDriverDoc: data.extraDriverDoc,
    extraDriverLicense: data.extraDriverLicense,
    bookingRef: contract.bookingRef || "",
    pickup: `${dmy(contract.startDate)} ${contract.pickupTime || ""}`.trim(),
    return: `${dmy(contract.endDate)} ${contract.returnTime || ""}`.trim(),
    price: contract.priceTotal != null ? `${contract.priceTotal} EUR` : "",
  };
}

function fillBlanks(pdf, font, contract, data, signedAt) {
  const spec = FILL_BLANKS[contractPdfPathOf(contract)];
  if (!spec) return;
  const pages = pdf.getPages();
  if (pages.length < 2) return; // not the real contract (tests use a stub)
  const white = rgb(1, 1, 1);
  const ink = rgb(0.05, 0.1, 0.3);
  const cover = (page, x0, x1, top, bottom) =>
    page.drawRectangle({ x: x0 - 0.5, y: H - bottom, width: x1 - x0 + 1, height: bottom - top, color: white });
  // Write `text` from x0 on the line whose box is top..bottom; shrink to fit before maxX.
  const write = (page, text, x0, maxX, bottom) => {
    let size = 8.8;
    const t = pdfText(text);
    while (size > 5.5 && font.widthOfTextAtSize(t, size) > maxX - x0) size -= 0.3;
    page.drawText(t, { x: x0, y: H - bottom + 2.2, size, font, color: ink });
  };
  for (const h of spec.hide) cover(pages[h.page], h.x0, h.x1, h.top, h.bottom);
  const values = blankValues(contract, data, signedAt);
  for (const f of spec.fields) {
    const value = values[f.key];
    if (!value) continue;
    const page = pages[f.page];
    if (f.line != null) {
      // Full-width dotted line of the English column.
      cover(page, 304.2, 498.8, f.line, f.line + 9.8);
      write(page, value, 304.2, 558, f.line + 9.8);
    } else {
      f.boxes.forEach(([x0, x1, top, bottom], i) => {
        cover(page, x0, x1, top, bottom);
        write(page, value, x0, f.maxX[i], bottom);
      });
    }
  }
  const boxes = spec.sourceBoxes[contract.source] || spec.sourceBoxes.other;
  for (const [x0, top, x1, bottom] of boxes) {
    const page = pages[0];
    const size = 8;
    page.drawText("X", { x: x0 + (x1 - x0 - font.widthOfTextAtSize("X", size)) / 2, y: H - bottom + 1.6, size, font, color: ink });
  }
}

const fmtTime = (ms) => new Date(ms).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");

/**
 * @param {object} args
 * @param {Uint8Array} args.basePdfBytes blank contract
 * @param {object} args.contract the record (before it is marked signed)
 * @param {object} args.data cleaned signer data
 * @param {Buffer} args.signaturePng drawn signature
 * @param {Record<string, Buffer>} [args.docs] JPEG photos of the ID and licence by slot
 * @param {{name: string, signaturePng: Buffer|null}} [args.owner] who signs for the company
 * @param {object} args.meta { signedAt, ip, userAgent, basePdfHash, signatureHash }
 * @returns {Promise<Uint8Array>}
 */
export async function buildSignedPdf({ basePdfBytes, contract, data, signaturePng, docs = {}, owner = null, meta }) {
  const pdf = await PDFDocument.load(basePdfBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  fillBlanks(pdf, font, contract, data, meta?.signedAt ?? Date.now());
  await stampSignatureBlock(pdf, font, contract, data, signaturePng, owner);
  const page = pdf.addPage([595.28, 841.89]);
  const M = 48;
  const W = page.getWidth() - M * 2;
  let y = page.getHeight() - M;
  const ink = rgb(0.1, 0.1, 0.1);
  const grey = rgb(0.4, 0.4, 0.4);

  const text = (t, { size = 9.5, f = font, x = M, color = ink } = {}) => {
    page.drawText(pdfText(t), { x, y, size, font: f, color });
    y -= size + 4;
  };
  const para = (t, opts = {}) => {
    const size = opts.size || 9;
    for (const l of wrap(font, t, size, W - (opts.indent || 0))) {
      page.drawText(l, { x: M + (opts.indent || 0), y, size, font: opts.f || font, color: opts.color || ink });
      y -= size + 3;
    }
  };
  const row = (label, value) => {
    page.drawText(pdfText(label), { x: M, y, size: 9, font: bold, color: grey });
    const lines = wrap(font, value || "-", 9.5, W - 150);
    lines.forEach((l, i) => page.drawText(l, { x: M + 150, y: y - i * 12, size: 9.5, font, color: ink }));
    y -= Math.max(1, lines.length) * 12 + 2;
  };
  const rule = () => {
    page.drawLine({ start: { x: M, y: y + 2 }, end: { x: M + W, y: y + 2 }, thickness: 0.5, color: grey });
    y -= 8;
  };

  text("HOJA DE DATOS Y FIRMA ELECTRONICA", { size: 14, f: bold });
  text(`Contrato de alquiler de autocaravana sin conductor - version ${contract.version} - CAMPER RETREAT S.L.`, { size: 8.5, color: grey });
  text(`Referencia: ${contract.id}${contract.bookingRef ? ` - Reserva ${contract.bookingRef}` : ""}`, { size: 8.5, color: grey });
  y -= 6;
  rule();

  text("Arrendatario (conductor principal)", { size: 10.5, f: bold });
  row("Nombre y apellidos", data.fullName);
  row("Documento", `${DOC_LABEL[data.docType] || data.docType} ${data.docNumber}${data.docExpiry ? `, caduca ${data.docExpiry}` : ""}`);
  row("Fecha de nacimiento", data.birthDate);
  row("Nacionalidad", data.nationality);
  row("Domicilio", `${data.street}, ${data.postalCode} ${data.city}, ${data.country}`);
  row("Telefono", data.phone);
  row("Email", contract.email);
  row(
    "Permiso de conducir",
    `${data.licenseNumber ? `${data.licenseNumber} ` : ""}(${data.licenseCountry})${data.licenseIssued ? `, expedido ${data.licenseIssued}` : ""}, caduca ${data.licenseExpiry}`,
  );
  if (data.extraDriverName) {
    row("Conductor adicional", `${data.extraDriverName} - doc. ${data.extraDriverDoc || "-"} - permiso ${data.extraDriverLicense || "-"}`);
  }
  y -= 4;
  rule();

  text("Alquiler", { size: 10.5, f: bold });
  const vehicle = vehicleView(contract);
  row("Vehiculo", [vehicle.name, vehicle.plate && `matricula ${vehicle.plate}`].filter(Boolean).join(" - "));
  row("Entrega", `${contract.startDate} ${contract.pickupTime}`);
  row("Devolucion", `${contract.endDate} ${contract.returnTime}`);
  row("Precio total (IVA incl.)", contract.priceTotal != null ? `${contract.priceTotal} EUR` : "segun reserva");
  row("Origen de la reserva", contract.source);
  y -= 4;
  rule();

  text("Declaraciones del Arrendatario", { size: 10.5, f: bold });
  para("- Ha leido y acepta el contrato (version indicada) y ha recibido una copia.", { indent: 4 });
  para("- Acepta firmar electronicamente con la misma validez que la firma en papel (apdo. 16).", { indent: 4 });
  para("- Autoriza el uso de la tarjeta aportada para los cargos posteriores del apdo. 5.6.", { indent: 4 });
  para(
    "- Acepta expresamente que, si la causa le es imputable a el o a sus conductores, paga la grua, el deposito y la recuperacion del vehiculo, los abogados y gastos judiciales, los danos durante el transporte en ferry y la indemnizacion por paralizacion (apdos. 5.5, 5.9, 7.4 y 11.7).",
    { indent: 4 },
  );
  para("- Ha sido informado del tratamiento de sus datos personales (apdo. 15).", { indent: 4 });
  para(
    "- Ha podido leer las condiciones en un idioma que comprende y sabe que prevalece la version en espanol del contrato (apdo. 17).",
    { indent: 4 },
  );
  y -= 6;
  rule();

  // Two signatures side by side: the guest (drawn now) and the company.
  const boxW = (W - 20) / 2;
  const boxH = 84;
  const top = y;
  const sigBox = async (x, title, name, png) => {
    page.drawText(pdfText(title), { x, y: top, size: 10.5, font: bold, color: ink });
    const by = top - 14 - boxH;
    page.drawRectangle({ x, y: by, width: boxW, height: boxH, borderColor: grey, borderWidth: 0.5 });
    if (png) {
      const img = await pdf.embedPng(png);
      const scale = Math.min((boxW - 12) / img.width, (boxH - 12) / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, { x: x + (boxW - w) / 2, y: by + (boxH - h) / 2, width: w, height: h });
    }
    page.drawText(pdfText(name), { x, y: by - 12, size: 9, font, color: ink });
  };
  await sigBox(M, "Firma del Arrendatario", data.fullName, signaturePng);
  if (owner) {
    await sigBox(M + boxW + 20, "Por el Arrendador, CAMPER RETREAT S.L.", owner.name, owner.signaturePng);
  }
  y = top - 14 - boxH - 30;

  text("Registro de la firma", { size: 10.5, f: bold });
  row("Fecha y hora", fmtTime(meta.signedAt));
  if (meta.readAt) {
    row("Lectura del contrato", `${fmtTime(meta.readAt)} - el Arrendatario recorrio el texto completo del contrato en la pagina de firma`);
  }
  row("Direccion IP", meta.ip || "-");
  row("Dispositivo", meta.userAgent || "-");
  row("Verificacion", "Codigo de un solo uso enviado al email del Arrendatario");
  row("Huella SHA-256 contrato", meta.basePdfHash);
  row("Huella SHA-256 firma", meta.signatureHash);
  y -= 4;
  para(
    "Los datos originales del Arrendatario se conservan en el registro electronico de Camper Retreat S.L. junto con el historial de la operacion. Este documento se envia a ambas partes por email.",
    { size: 8, color: grey },
  );

  const DOC_TITLES = {
    idFront: "Documento de identidad - anverso",
    idBack: "Documento de identidad - reverso",
    licenseFront: "Permiso de conducir - anverso",
    licenseBack: "Permiso de conducir - reverso",
  };
  const photos = Object.keys(DOC_TITLES).filter((k) => docs[k]);
  if (photos.length) {
    const annex = pdf.addPage([595.28, 841.89]);
    let ay = annex.getHeight() - M;
    annex.drawText("ANEXO: COPIA DE LOS DOCUMENTOS DEL ARRENDATARIO", { x: M, y: ay, size: 13, font: bold, color: ink });
    ay -= 14;
    annex.drawText(pdfText(`${data.fullName} - contrato ${contract.id} - aportadas por el Arrendatario al firmar (apdo. 15.4)`), {
      x: M, y: ay, size: 8.5, font, color: grey,
    });
    ay -= 16;
    const cellW = (W - 16) / 2;
    const cellH = (ay - M - 2 * 16) / 2;
    for (let i = 0; i < photos.length; i++) {
      const slot = photos[i];
      const cx = M + (i % 2) * (cellW + 16);
      const cyTop = ay - Math.floor(i / 2) * (cellH + 16);
      annex.drawText(DOC_TITLES[slot], { x: cx, y: cyTop - 10, size: 9, font: bold, color: grey });
      // A fresh copy: pdf-lib's JPEG reader ignores the byteOffset of a Buffer view.
      const img = await pdf.embedJpg(new Uint8Array(docs[slot]));
      const areaH = cellH - 18;
      const scale = Math.min(cellW / img.width, areaH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      annex.drawImage(img, { x: cx + (cellW - w) / 2, y: cyTop - 16 - areaH + (areaH - h), width: w, height: h });
    }
  }

  pdf.setTitle(`Contrato de alquiler ${contract.id}`);
  pdf.setAuthor("CAMPER RETREAT S.L.");
  pdf.setSubject(`Contrato firmado electronicamente - version ${contract.version}`);
  return pdf.save();
}
