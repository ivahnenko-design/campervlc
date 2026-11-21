// Login code email (es/en/ru/uk/de/it/nl, others fall back to English).
import { postToResend } from "./email.js";

const FROM = "Camper Retreat VLC <info@campervlc.com>";
const T = {
  en: [(c) => `${c} is your Camper Retreat login code`, (c) => `<p>Your code to log in to campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Valid for 10 minutes. After logging in you get 5% off your first booking.</p>`],
  es: [(c) => `${c} es tu código de acceso a Camper Retreat`, (c) => `<p>Tu código para entrar en campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Válido durante 10 minutos. Al entrar tienes un 5 % de descuento en tu primera reserva.</p>`],
  ru: [(c) => `${c}: код для входа на Camper Retreat`, (c) => `<p>Ваш код для входа на campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Действует 10 минут. После входа вы получаете скидку 5% на первую бронь.</p>`],
  uk: [(c) => `${c}: код для входу на Camper Retreat`, (c) => `<p>Ваш код для входу на campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Діє 10 хвилин. Після входу ви отримуєте знижку 5% на перше бронювання.</p>`],
  de: [(c) => `${c} ist dein Anmeldecode für Camper Retreat`, (c) => `<p>Dein Code für die Anmeldung auf campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Er gilt 10 Minuten. Wenn du ihn nicht angefordert hast, ignoriere diese E-Mail.</p>`],
  it: [(c) => `${c} è il tuo codice di accesso a Camper Retreat`, (c) => `<p>Il tuo codice per accedere a campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Vale 10 minuti. Se non l'hai richiesto, ignora questa email.</p>`],
  nl: [(c) => `${c} is je inlogcode voor Camper Retreat`, (c) => `<p>Je code om in te loggen op campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Hij is 10 minuten geldig. Heb je hem niet aangevraagd, negeer dan deze e-mail.</p>`],
};

export async function sendLoginCodeEmail(email, code, lang, { send = postToResend } = {}) {
  const [subject, body] = T[lang] || T.en;
  const c = String(code).replace(/\D/g, "");
  // The code goes in the subject too: visible in the notification, and Apple Mail
  // offers it above the keyboard (the inputs use autocomplete="one-time-code").
  await send({ from: FROM, to: email, reply_to: "info@campervlc.com", subject: subject(c), html: body(c) });
}
