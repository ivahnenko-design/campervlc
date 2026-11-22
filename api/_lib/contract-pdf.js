// Builds the signed contract: the blank contract PDF (CONTRACT_PDF_PATH) plus one extra page
// with the signer's data, the consents, the drawn signature and the audit
// facts (time, IP, hashes). pdf-lib's built-in fonts only cover WinAnsi, so
// text is transliterated for the PDF; the original Unicode data stays in the
// JSON record.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { vehicleView } from "./contracts.js";

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

const fmtTime = (ms) => new Date(ms).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");

/**
 * @param {object} args
 * @param {Uint8Array} args.basePdfBytes blank contract
 * @param {object} args.contract the record (before it is marked signed)
 * @param {object} args.data cleaned signer data
 * @param {Buffer} args.signaturePng drawn signature
 * @param {object} args.meta { signedAt, ip, userAgent, basePdfHash, signatureHash }
 * @returns {Promise<Uint8Array>}
 */
export async function buildSignedPdf({ basePdfBytes, contract, data, signaturePng, meta }) {
  const pdf = await PDFDocument.load(basePdfBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
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
  row("Documento", `${DOC_LABEL[data.docType] || data.docType} ${data.docNumber}`);
  row("Fecha de nacimiento", data.birthDate);
  row("Nacionalidad", data.nationality);
  row("Domicilio", `${data.street}, ${data.postalCode} ${data.city}, ${data.country}`);
  row("Telefono", data.phone);
  row("Email", contract.email);
  row("Permiso de conducir", `${data.licenseNumber} (${data.licenseCountry}), caduca ${data.licenseExpiry}`);
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
  y -= 6;
  rule();

  text("Firma", { size: 10.5, f: bold });
  const img = await pdf.embedPng(signaturePng);
  const maxW = 230;
  const maxH = 80;
  const scale = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = img.width * scale;
  const h = img.height * scale;
  page.drawRectangle({ x: M, y: y - h - 6, width: maxW + 10, height: h + 12, borderColor: grey, borderWidth: 0.5 });
  page.drawImage(img, { x: M + 5, y: y - h, width: w, height: h });
  y -= h + 22;

  text("Registro de la firma", { size: 10.5, f: bold });
  row("Fecha y hora", fmtTime(meta.signedAt));
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

  pdf.setTitle(`Contrato de alquiler ${contract.id}`);
  pdf.setAuthor("CAMPER RETREAT S.L.");
  pdf.setSubject(`Contrato firmado electronicamente - version ${contract.version}`);
  return pdf.save();
}
