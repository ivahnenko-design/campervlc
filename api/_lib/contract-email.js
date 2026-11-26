// Emails of the signing flow, sent through Resend. Guest emails come in
// es/en/ru/uk/de/it/nl (any other language falls back to English); the owner copy is Spanish.
import { postToResend, siteUrl } from "./email.js";
import { vehicleLabel, vehicleOf } from "../../shared/vehicles.js";
import { vehicleView } from "./contracts.js";
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


// ── branded layout ──────────────────────────────────────────────────────────
// Table-based, inline styles only (Gmail, Outlook, ukr.net, phones). Navy +
// amber like the site; the logo is the PNG on the site (SVG is blocked by many
// mail clients).

const NAVY = "#0D1B2A";
const AMBER = "#F4A827";
const INK = "#1F2933";
const MUTED = "#5B6573";
const LINE = "#E6E1D6";
const CREAM = "#FBF8F2";
const WHATSAPP = "+34 624 038 085";

const L = {
  en: { pickup: "Pickup", ret: "Return", camper: "Motorhome", ref: "Booking", questions: "Questions? Reply to this email or WhatsApp" },
  es: { pickup: "Recogida", ret: "Devolución", camper: "Autocaravana", ref: "Reserva", questions: "¿Dudas? Responde a este email o escríbenos por WhatsApp" },
  ru: { pickup: "Получение", ret: "Возврат", camper: "Автодом", ref: "Бронь", questions: "Вопросы? Ответьте на это письмо или напишите в WhatsApp" },
  uk: { pickup: "Отримання", ret: "Повернення", camper: "Автобудинок", ref: "Бронювання", questions: "Питання? Дайте відповідь на цей лист або напишіть у WhatsApp" },
  de: { pickup: "Abholung", ret: "Rückgabe", camper: "Wohnmobil", ref: "Buchung", questions: "Fragen? Antworte auf diese E-Mail oder schreib per WhatsApp" },
  it: { pickup: "Ritiro", ret: "Riconsegna", camper: "Camper", ref: "Prenotazione", questions: "Domande? Rispondi a questa email o scrivici su WhatsApp" },
  nl: { pickup: "Ophalen", ret: "Inleveren", camper: "Camper", ref: "Boeking", questions: "Vragen? Beantwoord deze e-mail of stuur een WhatsApp" },
};

const LOCALE = { en: "en-GB", es: "es-ES", ru: "ru-RU", uk: "uk-UA", de: "de-DE", it: "it-IT", nl: "nl-NL" };

export function fmtDay(iso, lang) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso ?? "");
  try {
    return new Intl.DateTimeFormat(LOCALE[lang] || "en-GB", {
      weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    }).format(new Date(`${iso}T12:00:00Z`));
  } catch {
    return iso;
  }
}

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px"><tr><td align="center" bgcolor="${AMBER}" style="border-radius:999px">
<a target="_blank" style="display:inline-block;padding:15px 30px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:${NAVY};text-decoration:none;border-radius:999px" href="${href}">${label}&nbsp;&rarr;</a>
</td></tr></table>`;
}

function summaryCard(contract, lang) {
  const l = L[lang] || L.en;
  const v = vehicleView(contract);
  const row = (k, val) =>
    `<tr><td style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};width:120px;vertical-align:top">${esc(k)}</td><td style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};font-weight:bold">${val}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px;background:${CREAM};border:1px solid ${LINE};border-radius:14px"><tr><td style="padding:14px 18px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${row(l.pickup, `${esc(fmtDay(contract.startDate, lang))} · ${esc(contract.pickupTime || "")}`)}
${row(l.ret, `${esc(fmtDay(contract.endDate, lang))} · ${esc(contract.returnTime || "")}`)}
${row(l.camper, esc([v.name, v.plate].filter(Boolean).join(" · ")))}
${contract.bookingRef ? row(l.ref, esc(contract.bookingRef)) : ""}
</table></td></tr></table>`;
}

/**
 * Wraps a message body in the branded shell.
 * @param {{lang: string, title: string, preheader?: string, body: string}} args
 */
export function brandedHtml({ lang, title, preheader = "", body }) {
  const l = L[lang] || L.en;
  const site = siteUrl();
  const wa = WHATSAPP.replace(/\D/g, "");
  // Paragraph styling for the plain <p> of the message texts.
  const content = body
    .replace(/<p>/g, `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${INK}">`)
    .replace(/<a href=/g, `<a style="color:#B7791F;font-weight:bold" href=`);
  return `<!doctype html>
<html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#EFEBE3">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFEBE3"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td bgcolor="${NAVY}" style="background:${NAVY};padding:22px 28px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="vertical-align:middle"><a href="${site}" target="_blank"><img src="${site}/email-logo.png" width="48" height="48" alt="Camper Retreat VLC" style="display:block;border:0;border-radius:12px"></a></td>
<td style="vertical-align:middle;padding-left:14px">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:bold;color:#ffffff;letter-spacing:.3px">Camper Retreat VLC</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${AMBER};letter-spacing:2px;text-transform:uppercase;margin-top:3px">Rent. Retreat. Repeat.</div>
</td></tr></table>
</td></tr>
<tr><td style="height:4px;background:${AMBER};line-height:4px;font-size:0">&nbsp;</td></tr>
<tr><td style="padding:30px 28px 10px">
<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;font-weight:normal;color:${NAVY}">${esc(title)}</h1>
${content}
</td></tr>
${body.includes(WHATSAPP) ? "" : `<tr><td style="padding:6px 28px 26px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE}"><tr><td style="padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${MUTED}">
${esc(l.questions)}: <a href="https://wa.me/${wa}" style="color:#B7791F;font-weight:bold;text-decoration:none">${esc(WHATSAPP)}</a>
</td></tr></table>
</td></tr>`}
<tr><td style="height:14px;line-height:14px;font-size:0">&nbsp;</td></tr>
<tr><td bgcolor="${NAVY}" style="background:${NAVY};padding:18px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#A9B4C2">
<a href="${site}" style="color:${AMBER};text-decoration:none;font-weight:bold">campervlc.com</a> · CAMPER RETREAT S.L. · Alicante · Valencia
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** The invite: summary card under the intro, the link as a big button. */
function inviteHtml(contract, link) {
  const lang = T[contract.language] ? contract.language : "en";
  const t = T[lang];
  let body = t.inviteBody(contract, link);
  // "<p><a href=...>Open and sign</a></p>" -> summary card + button
  body = body.replace(/<p><a href="([^"]+)">([^<]+)<\/a><\/p>/, (_, href, label) => summaryCard(contract, lang) + button(href, label));
  // The dates are in the card; drop the "(2026-11-27 → 2026-11-30)" from the sentence.
  body = body.replace(/\s*\([0-9-]{10} → [0-9-]{10}\)/, "");
  return brandedHtml({ lang, title: t.inviteSubject, preheader: `${fmtDay(contract.startDate, lang)} → ${fmtDay(contract.endDate, lang)}`, body });
}

function codeHtml(contract, code) {
  const lang = T[contract.language] ? contract.language : "en";
  const t = T[lang];
  const body = t
    .codeBody(code)
    .replace(
      /<p style="font-size:26px;letter-spacing:4px"><strong>([^<]+)<\/strong><\/p>/,
      (_, c) =>
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px"><tr><td style="background:${CREAM};border:1px dashed ${AMBER};border-radius:12px;padding:14px 26px;font-family:'Courier New',monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:${NAVY}">${c}</td></tr></table>`,
    );
  return brandedHtml({ lang, title: t.codeSubject(code), preheader: t.codeSubject(code), body });
}

function signedHtml(contract) {
  const lang = T[contract.language] ? contract.language : "en";
  const t = T[lang];
  const body = t.signedBody(contract).replace(/<p>Camper Retreat VLC<\/p>$/, "") + summaryCard(contract, lang);
  return brandedHtml({ lang, title: t.signedSubject, preheader: t.signedSubject, body });
}

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
    html: inviteHtml(contract, signingLink(token, contract.language)),
  });
}

export async function sendCodeEmail(contract, code, deps = {}) {
  const send = deps.send || postToResend;
  const t = tr(contract.language);
  await send({ from: FROM, to: contract.email, reply_to: REPLY_TO, subject: t.codeSubject(code), html: codeHtml(contract, code) });
}

export async function sendSignedEmails(contract, pdfBytes, deps = {}) {
  const send = deps.send || postToResend;
  const t = tr(contract.language);
  // Greet the guest with the name they signed with, not the one typed in the admin.
  const signedName = contract.signed?.data?.fullName;
  if (signedName) contract = { ...contract, guestName: signedName };
  const attachment = { filename: `contrato-alquiler-${contract.id}.pdf`, content: Buffer.from(pdfBytes).toString("base64") };
  const results = await Promise.allSettled([
    send({ from: FROM, to: contract.email, reply_to: REPLY_TO, subject: t.signedSubject, html: signedHtml(contract), attachments: [attachment] }),
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
