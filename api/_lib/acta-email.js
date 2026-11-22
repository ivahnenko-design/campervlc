// Emails with the signed handover report: the guest in the contract language
// (es/en/de/it/nl/ru/uk, else English) and the camper owner in Spanish.
import { esc, postToResend } from "./email.js";
import { ownerTo } from "./vehicles.js";
import { COMPANY_EMAIL } from "./staff.js";
import { vehicleLabel } from "../../shared/vehicles.js";

const FROM = "Camper Retreat VLC <info@campervlc.com>";
const REPLY_TO = "info@campervlc.com";

const T = {
  es: {
    checkin: "Acta de entrega de la autocaravana",
    checkout: "Acta de devolución de la autocaravana",
    body: (n, k) =>
      k === "checkin"
        ? `<p>Hola ${n},</p><p>Adjuntamos en PDF el acta de entrega que habéis firmado al recoger la autocaravana: kilómetros, combustible, estado, daños anotados y fotos. Guárdala durante el viaje.</p><p>¡Buen viaje! Camper Retreat VLC</p>`
        : `<p>Hola ${n},</p><p>Adjuntamos en PDF el acta de devolución firmada. Si contiene importes, te enviaremos la justificación antes de cualquier cargo.</p><p>Gracias por viajar con Camper Retreat VLC.</p>`,
  },
  en: {
    checkin: "Motorhome handover report (check-in)",
    checkout: "Motorhome return report (check-out)",
    body: (n, k) =>
      k === "checkin"
        ? `<p>Hello ${n},</p><p>Attached is the PDF of the handover report you signed at pickup: mileage, fuel, condition, noted damage and photos. Please keep it during your trip.</p><p>Have a great trip! Camper Retreat VLC</p>`
        : `<p>Hello ${n},</p><p>Attached is the PDF of the signed return report. If it lists any amounts, we will send you the justification before any charge.</p><p>Thank you for travelling with Camper Retreat VLC.</p>`,
  },
  de: {
    checkin: "Übergabeprotokoll des Wohnmobils",
    checkout: "Rückgabeprotokoll des Wohnmobils",
    body: (n, k) =>
      k === "checkin"
        ? `<p>Hallo ${n},</p><p>anbei das PDF des Übergabeprotokolls, das Sie bei der Abholung unterschrieben haben: Kilometerstand, Tankfüllung, Zustand, vermerkte Schäden und Fotos. Bitte bewahren Sie es während der Reise auf.</p><p>Gute Reise! Camper Retreat VLC</p>`
        : `<p>Hallo ${n},</p><p>anbei das PDF des unterschriebenen Rückgabeprotokolls. Falls es Beträge enthält, senden wir Ihnen vor jeder Belastung die Begründung.</p><p>Danke, dass Sie mit Camper Retreat VLC gereist sind.</p>`,
  },
  it: {
    checkin: "Verbale di consegna del camper",
    checkout: "Verbale di riconsegna del camper",
    body: (n, k) =>
      k === "checkin"
        ? `<p>Ciao ${n},</p><p>in allegato il PDF del verbale di consegna firmato al ritiro: chilometri, carburante, stato, danni annotati e foto. Conservalo durante il viaggio.</p><p>Buon viaggio! Camper Retreat VLC</p>`
        : `<p>Ciao ${n},</p><p>in allegato il PDF del verbale di riconsegna firmato. Se contiene importi, ti invieremo la giustificazione prima di qualsiasi addebito.</p><p>Grazie per aver viaggiato con Camper Retreat VLC.</p>`,
  },
  nl: {
    checkin: "Overdrachtsrapport van de camper",
    checkout: "Inleverrapport van de camper",
    body: (n, k) =>
      k === "checkin"
        ? `<p>Hallo ${n},</p><p>In de bijlage vind je de pdf van het overdrachtsrapport dat je bij het ophalen hebt ondertekend: kilometerstand, brandstof, staat, genoteerde schade en foto's. Bewaar het tijdens je reis.</p><p>Goede reis! Camper Retreat VLC</p>`
        : `<p>Hallo ${n},</p><p>In de bijlage vind je de pdf van het ondertekende inleverrapport. Als er bedragen in staan, sturen we je de onderbouwing vóór elke afschrijving.</p><p>Bedankt dat je met Camper Retreat VLC reisde.</p>`,
  },
  ru: {
    checkin: "Акт выдачи автодома",
    checkout: "Акт возврата автодома",
    body: (n, k) =>
      k === "checkin"
        ? `<p>Здравствуйте, ${n}!</p><p>Во вложении PDF акта выдачи, который вы подписали при получении автодома: пробег, топливо, состояние, отмеченные повреждения и фото. Сохраните его на время поездки.</p><p>Хорошей поездки! Camper Retreat VLC</p>`
        : `<p>Здравствуйте, ${n}!</p><p>Во вложении PDF подписанного акта возврата. Если в нём указаны суммы, перед любым списанием мы пришлём вам обоснование.</p><p>Спасибо, что путешествовали с Camper Retreat VLC.</p>`,
  },
  uk: {
    checkin: "Акт видачі автобудинку",
    checkout: "Акт повернення автобудинку",
    body: (n, k) =>
      k === "checkin"
        ? `<p>Вітаємо, ${n}!</p><p>У вкладенні PDF акта видачі, який ви підписали під час отримання автобудинку: пробіг, пальне, стан, відмічені пошкодження та фото. Збережіть його на час подорожі.</p><p>Гарної подорожі! Camper Retreat VLC</p>`
        : `<p>Вітаємо, ${n}!</p><p>У вкладенні PDF підписаного акта повернення. Якщо в ньому зазначені суми, перед будь-яким списанням ми надішлемо вам обґрунтування.</p><p>Дякуємо, що подорожували з Camper Retreat VLC.</p>`,
  },
};

export const actaFileName = (acta) => `acta-${acta.kind === "checkin" ? "entrega" : "devolucion"}-${acta.contractId}.pdf`;

/** Guest subject + HTML in the contract language (fallback English). */
export function guestActaEmail(contract, acta) {
  const t = T[contract.language] || T.en;
  const first = String(contract.guestName || "").split(" ")[0];
  return { subject: t[acta.kind], html: t.body(esc(first), acta.kind) };
}

/** @returns {Promise<string[]>} allSettled statuses: [guest, owner] */
export async function sendActaEmails(contract, acta, pdfBytes, deps = {}) {
  const send = deps.send || postToResend;
  const env = deps.env || process.env;
  const attachment = { filename: actaFileName(acta), content: Buffer.from(pdfBytes).toString("base64") };
  const g = guestActaEmail(contract, acta);
  const company = env.CONTRACT_OWNER_EMAIL || COMPANY_EMAIL;
  const what = acta.kind === "checkin" ? "Acta de entrega" : "Acta de devolución";
  const results = await Promise.allSettled([
    send({ from: FROM, to: contract.email, reply_to: REPLY_TO, subject: g.subject, html: g.html, attachments: [attachment] }),
    send({
      from: FROM,
      to: ownerTo(acta.vehicleId, company, env),
      subject: `${what} firmada: ${contract.guestName} (${contract.startDate} → ${contract.endDate})`,
      html: `<p>${esc(what)} del contrato ${esc(contract.id)} firmada por ${esc(acta.guestName)} y ${esc(acta.staffName)}${acta.staffEmail ? ` (${esc(acta.staffEmail)})` : ""}. Vehículo: ${esc(vehicleLabel(acta.vehicleId))}. Km: ${esc(acta.odometerKm)}. Combustible: ${esc(acta.fuel)}/8. PDF adjunto.</p>`,
      attachments: [attachment],
    }),
  ]);
  return results.map((r) => r.status);
}
