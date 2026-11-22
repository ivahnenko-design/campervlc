// Emails of the signing flow, sent through Resend. Guest emails come in
// es/en/ru/uk/de/it/nl (any other language falls back to English); the owner copy is Spanish.
import { postToResend, siteUrl } from "./email.js";
import { vehicleLabel, vehicleOf } from "../../shared/vehicles.js";
import { ownerRecipients } from "./vehicles.js";

const FROM = "Camper Retreat VLC <info@campervlc.com>";
const REPLY_TO = "info@campervlc.com";

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const T = {
  en: {
    inviteSubject: "Sign your motorhome rental contract",
    inviteBody: (c, link) =>
      `<p>Hello ${esc(c.guestName)},</p><p>Your rental of the Camper Retreat VLC motorhome (${esc(c.startDate)} → ${esc(c.endDate)}) is confirmed. Please read and sign the rental contract online before pickup. It takes about 5 minutes: you fill in your details and driving licence data, confirm with a one-time code sent to this email and sign with your finger.</p><p><a href="${esc(link)}">Open the contract and sign</a></p><p>The link is personal; please do not share it. Questions: just reply to this email or WhatsApp +34 624 038 085.</p>`,
    codeSubject: (c) => `${c} is your code to sign the rental contract`,
    codeBody: (code) =>
      `<p>Your one-time code to sign the rental contract:</p><p style="font-size:26px;letter-spacing:4px"><strong>${esc(code)}</strong></p><p>It is valid for 10 minutes. If you did not request it, ignore this email.</p>`,
    signedSubject: "Your signed rental contract",
    signedBody: (c) =>
      `<p>Hello ${esc(c.guestName)},</p><p>Thank you. Your rental contract is signed and attached as a PDF. Keep it with you during the trip together with your driving licence and ID; you may be asked to show it to the police.</p><p>Camper Retreat VLC</p>`,
  },
  es: {
    inviteSubject: "Firma tu contrato de alquiler de autocaravana",
    inviteBody: (c, link) =>
      `<p>Hola ${esc(c.guestName)},</p><p>Tu alquiler de la autocaravana de Camper Retreat VLC (${esc(c.startDate)} → ${esc(c.endDate)}) está confirmado. Lee y firma el contrato de alquiler online antes de la recogida. Son unos 5 minutos: rellenas tus datos y los de tu permiso de conducir, confirmas con un código de un solo uso que recibirás en este email y firmas con el dedo.</p><p><a href="${esc(link)}">Abrir el contrato y firmar</a></p><p>El enlace es personal; no lo compartas. Dudas: responde a este email o escribe por WhatsApp al +34 624 038 085.</p>`,
    codeSubject: (c) => `${c} es tu código para firmar el contrato`,
    codeBody: (code) =>
      `<p>Tu código de un solo uso para firmar el contrato de alquiler:</p><p style="font-size:26px;letter-spacing:4px"><strong>${esc(code)}</strong></p><p>Es válido durante 10 minutos. Si no lo has pedido, ignora este email.</p>`,
    signedSubject: "Tu contrato de alquiler firmado",
    signedBody: (c) =>
      `<p>Hola ${esc(c.guestName)},</p><p>Gracias. Tu contrato de alquiler está firmado y va adjunto en PDF. Llévalo contigo durante el viaje junto con tu permiso de conducir y tu documento de identidad; la policía puede pedírtelo.</p><p>Camper Retreat VLC</p>`,
  },
  ru: {
    inviteSubject: "Подпишите договор аренды автодома",
    inviteBody: (c, link) =>
      `<p>Здравствуйте, ${esc(c.guestName)}!</p><p>Ваша аренда автодома Camper Retreat VLC (${esc(c.startDate)} → ${esc(c.endDate)}) подтверждена. Пожалуйста, прочитайте и подпишите договор онлайн до получения автодома. Это займёт около 5 минут: вы заполните свои данные и данные водительских прав, подтвердите одноразовым кодом из письма и распишетесь пальцем.</p><p><a href="${esc(link)}">Открыть договор и подписать</a></p><p>Ссылка личная, не передавайте её другим. Вопросы: ответьте на это письмо или напишите в WhatsApp +34 624 038 085.</p>`,
    codeSubject: (c) => `${c}: код для подписи договора аренды`,
    codeBody: (code) =>
      `<p>Одноразовый код для подписания договора аренды:</p><p style="font-size:26px;letter-spacing:4px"><strong>${esc(code)}</strong></p><p>Код действует 10 минут. Если вы его не запрашивали, проигнорируйте письмо.</p>`,
    signedSubject: "Ваш подписанный договор аренды",
    signedBody: (c) =>
      `<p>Здравствуйте, ${esc(c.guestName)}!</p><p>Спасибо. Договор аренды подписан и приложен в виде PDF. Возьмите его в поездку вместе с водительскими правами и документом, удостоверяющим личность: полиция может попросить их показать.</p><p>Camper Retreat VLC</p>`,
  },
  uk: {
    inviteSubject: "Підпишіть договір оренди автобудинку",
    inviteBody: (c, link) =>
      `<p>Вітаємо, ${esc(c.guestName)}!</p><p>Вашу оренду автобудинку Camper Retreat VLC (${esc(c.startDate)} → ${esc(c.endDate)}) підтверджено. Будь ласка, прочитайте та підпишіть договір онлайн до отримання автобудинку. Це займе близько 5 хвилин: ви заповните свої дані та дані водійського посвідчення, підтвердите одноразовим кодом з листа й розпишетеся пальцем.</p><p><a href="${esc(link)}">Відкрити договір і підписати</a></p><p>Посилання особисте, не передавайте його іншим. Питання: дайте відповідь на цей лист або напишіть у WhatsApp +34 624 038 085.</p>`,
    codeSubject: (c) => `${c}: код для підпису договору оренди`,
    codeBody: (code) =>
      `<p>Одноразовий код для підписання договору оренди:</p><p style="font-size:26px;letter-spacing:4px"><strong>${esc(code)}</strong></p><p>Код дійсний 10 хвилин. Якщо ви його не запитували, проігноруйте лист.</p>`,
    signedSubject: "Ваш підписаний договір оренди",
    signedBody: (c) =>
      `<p>Вітаємо, ${esc(c.guestName)}!</p><p>Дякуємо. Договір оренди підписано, він доданий у PDF. Візьміть його в подорож разом з водійським посвідченням і документом, що посвідчує особу: поліція може попросити їх показати.</p><p>Camper Retreat VLC</p>`,
  },
  de: {
    inviteSubject: "Unterschreibe deinen Mietvertrag für das Wohnmobil",
    inviteBody: (c, link) =>
      `<p>Hallo ${esc(c.guestName)},</p><p>Deine Miete des Wohnmobils von Camper Retreat VLC (${esc(c.startDate)} → ${esc(c.endDate)}) ist bestätigt. Bitte lies und unterschreibe den Mietvertrag vor der Abholung online. Das dauert etwa 5 Minuten: Du trägst deine Daten und die Führerscheindaten ein, bestätigst mit einem Einmalcode, den du an diese E-Mail-Adresse bekommst, und unterschreibst mit dem Finger.</p><p><a href="${esc(link)}">Vertrag öffnen und unterschreiben</a></p><p>Der Link ist persönlich, bitte gib ihn nicht weiter. Fragen: Antworte einfach auf diese E-Mail oder schreib per WhatsApp an +34 624 038 085.</p>`,
    codeSubject: (c) => `${c} ist dein Code zum Unterschreiben des Mietvertrags`,
    codeBody: (code) =>
      `<p>Dein Einmalcode zum Unterschreiben des Mietvertrags:</p><p style="font-size:26px;letter-spacing:4px"><strong>${esc(code)}</strong></p><p>Er gilt 10 Minuten. Wenn du ihn nicht angefordert hast, ignoriere diese E-Mail.</p>`,
    signedSubject: "Dein unterschriebener Mietvertrag",
    signedBody: (c) =>
      `<p>Hallo ${esc(c.guestName)},</p><p>Danke. Dein Mietvertrag ist unterschrieben und als PDF angehängt. Hab ihn während der Reise zusammen mit Führerschein und Ausweis dabei; die Polizei kann danach fragen.</p><p>Camper Retreat VLC</p>`,
  },
  it: {
    inviteSubject: "Firma il contratto di noleggio del camper",
    inviteBody: (c, link) =>
      `<p>Ciao ${esc(c.guestName)},</p><p>Il noleggio del camper di Camper Retreat VLC (${esc(c.startDate)} → ${esc(c.endDate)}) è confermato. Leggi e firma online il contratto di noleggio prima del ritiro. Bastano circa 5 minuti: inserisci i tuoi dati e quelli della patente, confermi con un codice monouso che ricevi a questa email e firmi con il dito.</p><p><a href="${esc(link)}">Apri il contratto e firma</a></p><p>Il link è personale, non condividerlo. Domande: rispondi a questa email o scrivici su WhatsApp al +34 624 038 085.</p>`,
    codeSubject: (c) => `${c} è il tuo codice per firmare il contratto`,
    codeBody: (code) =>
      `<p>Il tuo codice monouso per firmare il contratto di noleggio:</p><p style="font-size:26px;letter-spacing:4px"><strong>${esc(code)}</strong></p><p>Vale 10 minuti. Se non l'hai richiesto, ignora questa email.</p>`,
    signedSubject: "Il tuo contratto di noleggio firmato",
    signedBody: (c) =>
      `<p>Ciao ${esc(c.guestName)},</p><p>Grazie. Il contratto di noleggio è firmato e lo trovi in allegato in PDF. Tienilo con te durante il viaggio insieme a patente e documento d'identità; la polizia può chiederlo.</p><p>Camper Retreat VLC</p>`,
  },
  nl: {
    inviteSubject: "Onderteken je huurcontract voor de camper",
    inviteBody: (c, link) =>
      `<p>Hallo ${esc(c.guestName)},</p><p>Je huur van de camper van Camper Retreat VLC (${esc(c.startDate)} → ${esc(c.endDate)}) is bevestigd. Lees en onderteken het huurcontract online vóór het ophalen. Het duurt ongeveer 5 minuten: je vult je gegevens en rijbewijsgegevens in, bevestigt met een eenmalige code die je op dit e-mailadres krijgt en ondertekent met je vinger.</p><p><a href="${esc(link)}">Contract openen en ondertekenen</a></p><p>De link is persoonlijk, deel hem niet. Vragen: beantwoord deze e-mail of stuur een WhatsApp naar +34 624 038 085.</p>`,
    codeSubject: (c) => `${c} is je code om het huurcontract te ondertekenen`,
    codeBody: (code) =>
      `<p>Je eenmalige code om het huurcontract te ondertekenen:</p><p style="font-size:26px;letter-spacing:4px"><strong>${esc(code)}</strong></p><p>Hij is 10 minuten geldig. Heb je hem niet aangevraagd, negeer dan deze e-mail.</p>`,
    signedSubject: "Je ondertekende huurcontract",
    signedBody: (c) =>
      `<p>Hallo ${esc(c.guestName)},</p><p>Bedankt. Je huurcontract is ondertekend en als PDF bijgevoegd. Houd het tijdens de reis bij je, samen met je rijbewijs en identiteitsbewijs; de politie kan erom vragen.</p><p>Camper Retreat VLC</p>`,
  },
};

const tr = (lang) => T[lang] || T.en;
const OWNER = () => process.env.CONTRACT_OWNER_EMAIL || "camper.retreat.alicante@gmail.com";
/** Owner of the contract's camper (vehicle 1: the company owner, as before). */
const ownerOf = (contract) => ownerRecipients(vehicleOf(contract), OWNER())[0] || OWNER();

export const signingLink = (token, lang) =>
  `${siteUrl()}/sign/${encodeURIComponent(token)}${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`;

const REMINDER_PREFIX = { en: "Reminder: ", es: "Recordatorio: ", ru: "Напоминание: ", uk: "Нагадування: ", de: "Erinnerung: ", it: "Promemoria: ", nl: "Herinnering: " };

export async function sendInviteEmail(contract, token, deps = {}) {
  const send = deps.send || postToResend;
  const t = tr(contract.language);
  const prefix = deps.reminder ? REMINDER_PREFIX[contract.language] || REMINDER_PREFIX.en : "";
  await send({
    from: FROM,
    to: contract.email,
    reply_to: REPLY_TO,
    subject: prefix + t.inviteSubject,
    html: t.inviteBody(contract, signingLink(token, contract.language)),
  });
}

export async function sendCodeEmail(contract, code, deps = {}) {
  const send = deps.send || postToResend;
  const t = tr(contract.language);
  await send({ from: FROM, to: contract.email, reply_to: REPLY_TO, subject: t.codeSubject(code), html: t.codeBody(code) });
}

export async function sendSignedEmails(contract, pdfBytes, deps = {}) {
  const send = deps.send || postToResend;
  const t = tr(contract.language);
  const attachment = { filename: `contrato-alquiler-${contract.id}.pdf`, content: Buffer.from(pdfBytes).toString("base64") };
  const results = await Promise.allSettled([
    send({ from: FROM, to: contract.email, reply_to: REPLY_TO, subject: t.signedSubject, html: t.signedBody(contract), attachments: [attachment] }),
    send({
      from: FROM,
      to: ownerOf(contract),
      subject: `Contrato firmado: ${contract.guestName} (${contract.startDate} → ${contract.endDate})`,
      html: `<p>Contrato ${esc(contract.id)} firmado por ${esc(contract.guestName)} (${esc(contract.email)}). Fuente: ${esc(contract.source)}. Vehículo: ${esc(vehicleLabel(vehicleOf(contract)))}. PDF adjunto.</p>`,
      attachments: [attachment],
    }),
  ]);
  return results.map((r) => r.status);
}

/** Owner: pickups in the next 2 days whose contract is still unsigned. One email per camper owner. */
export async function sendUnsignedSoonEmail(rows, deps = {}) {
  const byOwner = new Map();
  for (const c of rows) {
    const to = ownerOf(c);
    byOwner.set(to, [...(byOwner.get(to) || []), c]);
  }
  for (const [to, list] of byOwner) await sendUnsignedSoonTo(to, list, deps);
}

async function sendUnsignedSoonTo(to, rows, deps) {
  const send = deps.send || postToResend;
  const items = rows
    .map((c) => `<li><strong>${esc(c.startDate)} ${esc(c.pickupTime || "")}</strong> · ${esc(c.guestName)} · ${esc(c.email)}${c.phone ? ` · ${esc(c.phone)}` : ""}${c.bookingRef ? ` · ${esc(c.bookingRef)}` : ""}</li>`)
    .join("");
  await send({
    from: FROM,
    to,
    subject: `Contratos sin firmar: ${rows.length} recogida(s) en los próximos 2 días`,
    html: `<p>Estos clientes recogen la autocaravana pronto y todavía no han firmado el contrato:</p><ul>${items}</ul><p>Puedes reenviar el enlace o copiarlo para WhatsApp en ${esc(siteUrl())}/admin/contratos.</p>`,
  });
}
