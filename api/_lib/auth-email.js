// Login code email (es/en/ru/uk, other languages fall back to English).
import { postToResend } from "./email.js";

const FROM = "Camper Retreat VLC <info@campervlc.com>";
const T = {
  en: ["Your login code", (c) => `<p>Your code to log in to campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Valid for 10 minutes. After logging in you get 5% off every booking.</p>`],
  es: ["Tu código de acceso", (c) => `<p>Tu código para entrar en campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Válido durante 10 minutos. Al entrar tienes un 5 % de descuento en cada reserva.</p>`],
  ru: ["Ваш код для входа", (c) => `<p>Ваш код для входа на campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Действует 10 минут. После входа вы получаете скидку 5% на каждую бронь.</p>`],
  uk: ["Ваш код для входу", (c) => `<p>Ваш код для входу на campervlc.com:</p><p style="font-size:26px;letter-spacing:4px"><strong>${c}</strong></p><p>Діє 10 хвилин. Після входу ви отримуєте знижку 5% на кожне бронювання.</p>`],
};

export async function sendLoginCodeEmail(email, code, lang, { send = postToResend } = {}) {
  const [subject, body] = T[lang] || T.en;
  await send({ from: FROM, to: email, reply_to: "info@campervlc.com", subject, html: body(String(code).replace(/\D/g, "")) });
}
