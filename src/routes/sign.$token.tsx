import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Loader2 } from "lucide-react";
import { BookingCabinet, type CabinetContract } from "@/components/BookingCabinet";
import { DocScanner, type ScanTexts } from "@/components/DocScanner";

export const Route = createFileRoute("/sign/$token")({
  validateSearch: (s: Record<string, unknown>): { lang?: string } => ({
    lang: typeof s.lang === "string" ? s.lang : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign your rental contract | Camper Retreat VLC" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignPage,
});

type Lang = "es" | "en" | "ru" | "uk" | "de" | "it" | "nl";

interface ContractView {
  id: string;
  status: "pending" | "signed" | "cancelled";
  language: string;
  guestName: string;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  priceTotal: number | null;
  emailHint: string;
  pdfPath: string;
  source?: string;
  bookingRef?: string;
  signedAt?: number | null;
  signerName?: string | null;
  vehicle?: CabinetContract["vehicle"];
}

const TEXT: Record<
  Lang,
  {
    title: string;
    intro: string;
    rental: string;
    pickup: string;
    ret: string;
    price: string;
    openContract: string;
    yourData: string;
    labels: Record<string, string>;
    docTypes: Record<string, string>;
    extraDriver: string;
    signHere: string;
    clear: string;
    consents: Record<string, string>;
    /** Text of the link to /condiciones inside the languageNotice consent ({link}). */
    conditionsLink: string;
    sendCode: string;
    codeSent: (hint: string) => string;
    codeLabel: string;
    sign: string;
    signing: string;
    doneTitle: string;
    doneBody: string;
    signedAlready: string;
    invalid: string;
    needSignature: string;
    fillAll: string;
    errors: Record<string, string>;
  }
> = {
  en: {
    title: "Rental contract",
    intro:
      "Please check your details, read the contract and sign it with your finger. You will get a copy by email.",
    rental: "Your rental",
    pickup: "Pickup",
    ret: "Return",
    price: "Total price (VAT incl.)",
    openContract: "Open the contract (PDF)",
    yourData: "Your details (as on your documents)",
    labels: {
      fullName: "Full name",
      docType: "Document",
      docNumber: "Document number",
      docExpiry: "Document expiry date",
      birthDate: "Date of birth",
      nationality: "Nationality",
      street: "Street and number",
      city: "City",
      postalCode: "Postal code",
      country: "Country",
      phone: "Phone",
      licenseNumber: "Driving licence number (if shown)",
      licenseCountry: "Licence issued in (country)",
      licenseIssued: "Licence issue date",
      licenseExpiry: "Licence expiry date",
      extraDriverName: "Name",
      extraDriverDoc: "Document number",
      extraDriverLicense: "Licence number",
    },
    docTypes: { passport: "Passport", dni: "DNI", nie: "NIE", id_card: "ID card" },
    extraDriver: "Additional driver (optional)",
    signHere: "Sign here",
    clear: "Clear",
    consents: {
      readContract: "I have read and accept the rental contract.",
      electronicSignature:
        "I agree to sign electronically; it has the same validity as a paper signature (clause 16).",
      cardAuthorization: "I authorise later charges to my card as described in clause 5.6.",
      liabilityClauses:
        "I accept that, if I or my drivers are responsible, I pay towing, the pound and recovery of the vehicle, the lawyers and legal costs, damage on ferries, and compensation for the days the camper cannot be rented while it is repaired (clauses 5.5, 5.9, 7.4 and 11.7).",
      dataProtection: "I have been informed about the processing of my personal data (clause 15).",
      languageNotice:
        "I have read the rental conditions in a language I understand ({link}) and I know that the Spanish version of the contract prevails (clause 17).",
    },
    conditionsLink: "Conditions in your language",
    sendCode: "Send me the confirmation code",
    codeSent: (h) => `We sent a 6-digit code to ${h}.`,
    codeLabel: "Confirmation code",
    sign: "Sign the contract",
    signing: "Signing...",
    doneTitle: "Contract signed",
    doneBody: "Thank you. We have emailed you a PDF copy. Keep it with you during the trip.",
    signedAlready: "This contract is already signed.",
    invalid:
      "This link is not valid or has expired. Please contact us on WhatsApp +34 624 038 085.",
    needSignature: "Please draw your signature.",
    fillAll: "Please fill in all the required fields.",
    errors: {
      code_wrong: "The code is not correct.",
      code_expired: "The code has expired. Ask for a new one.",
      too_many_attempts: "Too many attempts. Ask for a new code later.",
      code_too_soon: "Please wait a minute before asking for another code.",
      no_code: "Ask for a confirmation code first.",
      consent_required: "Please tick all the confirmations.",
      signature_invalid: "The signature is not valid. Please draw it again.",
      not_pending: "This contract cannot be signed any more.",
      conflict: "Something changed, please try again.",
      default: "Something went wrong. Please try again or contact us.",
    },
  },
  es: {
    title: "Contrato de alquiler",
    intro:
      "Revisa tus datos, lee el contrato y fírmalo con el dedo. Recibirás una copia por email.",
    rental: "Tu alquiler",
    pickup: "Recogida",
    ret: "Devolución",
    price: "Precio total (IVA incl.)",
    openContract: "Abrir el contrato (PDF)",
    yourData: "Tus datos (como en tus documentos)",
    labels: {
      fullName: "Nombre y apellidos",
      docType: "Documento",
      docNumber: "Número de documento",
      docExpiry: "Caducidad del documento",
      birthDate: "Fecha de nacimiento",
      nationality: "Nacionalidad",
      street: "Calle y número",
      city: "Ciudad",
      postalCode: "Código postal",
      country: "País",
      phone: "Teléfono",
      licenseNumber: "Número de permiso de conducir (si figura)",
      licenseCountry: "Permiso expedido en (país)",
      licenseIssued: "Fecha de expedición del permiso",
      licenseExpiry: "Caducidad del permiso",
      extraDriverName: "Nombre",
      extraDriverDoc: "Número de documento",
      extraDriverLicense: "Número de permiso",
    },
    docTypes: { passport: "Pasaporte", dni: "DNI", nie: "NIE", id_card: "Documento de identidad" },
    extraDriver: "Conductor adicional (opcional)",
    signHere: "Firma aquí",
    clear: "Borrar",
    consents: {
      readContract: "He leído y acepto el contrato de alquiler.",
      electronicSignature:
        "Acepto firmar electrónicamente, con la misma validez que la firma en papel (apdo. 16).",
      cardAuthorization: "Autorizo los cargos posteriores en mi tarjeta descritos en el apdo. 5.6.",
      liabilityClauses:
        "Acepto que, si la causa es imputable a mí o a mis conductores, pago la grúa, el depósito y la recuperación del vehículo, los abogados y gastos judiciales, los daños en ferry y la indemnización por los días en que la autocaravana no pueda alquilarse mientras se repara (apdos. 5.5, 5.9, 7.4 y 11.7).",
      dataProtection: "He sido informado del tratamiento de mis datos personales (apdo. 15).",
      languageNotice:
        "He leído las condiciones del alquiler en un idioma que comprendo ({link}) y sé que prevalece la versión en español del contrato (apdo. 17).",
    },
    conditionsLink: "Condiciones en tu idioma",
    sendCode: "Enviarme el código de confirmación",
    codeSent: (h) => `Hemos enviado un código de 6 dígitos a ${h}.`,
    codeLabel: "Código de confirmación",
    sign: "Firmar el contrato",
    signing: "Firmando...",
    doneTitle: "Contrato firmado",
    doneBody:
      "Gracias. Te hemos enviado una copia en PDF por email. Llévala contigo durante el viaje.",
    signedAlready: "Este contrato ya está firmado.",
    invalid: "El enlace no es válido o ha caducado. Escríbenos por WhatsApp al +34 624 038 085.",
    needSignature: "Dibuja tu firma.",
    fillAll: "Rellena todos los campos obligatorios.",
    errors: {
      code_wrong: "El código no es correcto.",
      code_expired: "El código ha caducado. Pide uno nuevo.",
      too_many_attempts: "Demasiados intentos. Pide un código nuevo más tarde.",
      code_too_soon: "Espera un minuto antes de pedir otro código.",
      no_code: "Pide primero un código de confirmación.",
      consent_required: "Marca todas las confirmaciones.",
      signature_invalid: "La firma no es válida. Dibújala de nuevo.",
      not_pending: "Este contrato ya no se puede firmar.",
      conflict: "Algo ha cambiado, inténtalo de nuevo.",
      default: "Ha ocurrido un error. Inténtalo de nuevo o contáctanos.",
    },
  },
  ru: {
    title: "Договор аренды",
    intro:
      "Проверьте свои данные, прочитайте договор и подпишите его пальцем. Копия придёт вам на почту.",
    rental: "Ваша аренда",
    pickup: "Получение",
    ret: "Возврат",
    price: "Общая стоимость (с НДС)",
    openContract: "Открыть договор (PDF)",
    yourData: "Ваши данные (как в документах)",
    labels: {
      fullName: "Фамилия и имя",
      docType: "Документ",
      docNumber: "Номер документа",
      docExpiry: "Срок действия документа",
      birthDate: "Дата рождения",
      nationality: "Гражданство",
      street: "Улица и дом",
      city: "Город",
      postalCode: "Индекс",
      country: "Страна",
      phone: "Телефон",
      licenseNumber: "Номер водительских прав (если есть)",
      licenseCountry: "Страна выдачи прав",
      licenseIssued: "Дата выдачи прав",
      licenseExpiry: "Срок действия прав",
      extraDriverName: "Имя",
      extraDriverDoc: "Номер документа",
      extraDriverLicense: "Номер прав",
    },
    docTypes: { passport: "Паспорт", dni: "DNI", nie: "NIE", id_card: "ID-карта" },
    extraDriver: "Дополнительный водитель (если есть)",
    signHere: "Подпись",
    clear: "Очистить",
    consents: {
      readContract: "Я прочитал(а) договор аренды и принимаю его условия.",
      electronicSignature:
        "Я согласен(на) подписать электронно, подпись имеет ту же силу, что и на бумаге (п. 16).",
      cardAuthorization: "Я разрешаю последующие списания с моей карты по п. 5.6.",
      liabilityClauses:
        "Я согласен(на), что если виноват(а) я или мои водители, я оплачиваю эвакуатор, штрафстоянку и возврат автодома, адвокатов и судебные расходы, повреждения на пароме и компенсацию за дни, когда автодом нельзя сдавать, пока он в ремонте (пп. 5.5, 5.9, 7.4 и 11.7).",
      dataProtection: "Я ознакомлен(а) с обработкой персональных данных (п. 15).",
      languageNotice:
        "Я прочитал(а) условия аренды на понятном мне языке ({link}) и знаю, что приоритет имеет испанская версия договора (п. 17).",
    },
    conditionsLink: "Условия на вашем языке",
    sendCode: "Отправить мне код подтверждения",
    codeSent: (h) => `Мы отправили 6-значный код на ${h}.`,
    codeLabel: "Код подтверждения",
    sign: "Подписать договор",
    signing: "Подписываем...",
    doneTitle: "Договор подписан",
    doneBody: "Спасибо. Копия в PDF отправлена на вашу почту. Возьмите её с собой в поездку.",
    signedAlready: "Этот договор уже подписан.",
    invalid: "Ссылка недействительна или устарела. Напишите нам в WhatsApp +34 624 038 085.",
    needSignature: "Нарисуйте подпись.",
    fillAll: "Заполните все обязательные поля.",
    errors: {
      code_wrong: "Неверный код.",
      code_expired: "Код устарел. Запросите новый.",
      too_many_attempts: "Слишком много попыток. Запросите новый код позже.",
      code_too_soon: "Подождите минуту перед новым запросом.",
      no_code: "Сначала запросите код подтверждения.",
      consent_required: "Отметьте все подтверждения.",
      signature_invalid: "Подпись не распознана. Нарисуйте её ещё раз.",
      not_pending: "Этот договор уже нельзя подписать.",
      conflict: "Данные изменились, попробуйте ещё раз.",
      default: "Произошла ошибка. Попробуйте ещё раз или свяжитесь с нами.",
    },
  },
  uk: {
    title: "Договір оренди",
    intro:
      "Перевірте свої дані, прочитайте договір і підпишіть його пальцем. Копія прийде вам на пошту.",
    rental: "Ваша оренда",
    pickup: "Отримання",
    ret: "Повернення",
    price: "Загальна вартість (з ПДВ)",
    openContract: "Відкрити договір (PDF)",
    yourData: "Ваші дані (як у документах)",
    labels: {
      fullName: "Прізвище та ім'я",
      docType: "Документ",
      docNumber: "Номер документа",
      docExpiry: "Термін дії документа",
      birthDate: "Дата народження",
      nationality: "Громадянство",
      street: "Вулиця і будинок",
      city: "Місто",
      postalCode: "Індекс",
      country: "Країна",
      phone: "Телефон",
      licenseNumber: "Номер водійського посвідчення (якщо є)",
      licenseCountry: "Країна видачі посвідчення",
      licenseIssued: "Дата видачі посвідчення",
      licenseExpiry: "Термін дії посвідчення",
      extraDriverName: "Ім'я",
      extraDriverDoc: "Номер документа",
      extraDriverLicense: "Номер посвідчення",
    },
    docTypes: { passport: "Паспорт", dni: "DNI", nie: "NIE", id_card: "ID-картка" },
    extraDriver: "Додатковий водій (за потреби)",
    signHere: "Підпис",
    clear: "Очистити",
    consents: {
      readContract: "Я прочитав(ла) договір оренди та приймаю його умови.",
      electronicSignature:
        "Я погоджуюсь підписати електронно, підпис має ту саму силу, що й на папері (п. 16).",
      cardAuthorization: "Я дозволяю подальші списання з моєї картки за п. 5.6.",
      liabilityClauses:
        "Я погоджуюсь, що якщо винен(на) я або мої водії, я оплачую евакуатор, штрафмайданчик і повернення автобудинку, адвокатів і судові витрати, пошкодження на поромі та компенсацію за дні, коли автобудинок не можна здавати, поки він у ремонті (пп. 5.5, 5.9, 7.4 і 11.7).",
      dataProtection: "Я ознайомлений(а) з обробкою персональних даних (п. 15).",
      languageNotice:
        "Я прочитав(ла) умови оренди мовою, яку розумію ({link}), і знаю, що пріоритет має іспанська версія договору (п. 17).",
    },
    conditionsLink: "Умови вашою мовою",
    sendCode: "Надіслати мені код підтвердження",
    codeSent: (h) => `Ми надіслали 6-значний код на ${h}.`,
    codeLabel: "Код підтвердження",
    sign: "Підписати договір",
    signing: "Підписуємо...",
    doneTitle: "Договір підписано",
    doneBody: "Дякуємо. Копію в PDF надіслано на вашу пошту. Візьміть її з собою в подорож.",
    signedAlready: "Цей договір уже підписано.",
    invalid: "Посилання недійсне або застаріло. Напишіть нам у WhatsApp +34 624 038 085.",
    needSignature: "Намалюйте підпис.",
    fillAll: "Заповніть усі обов'язкові поля.",
    errors: {
      code_wrong: "Невірний код.",
      code_expired: "Код застарів. Запросіть новий.",
      too_many_attempts: "Забагато спроб. Запросіть новий код пізніше.",
      code_too_soon: "Зачекайте хвилину перед новим запитом.",
      no_code: "Спочатку запросіть код підтвердження.",
      consent_required: "Позначте всі підтвердження.",
      signature_invalid: "Підпис не розпізнано. Намалюйте його ще раз.",
      not_pending: "Цей договір уже не можна підписати.",
      conflict: "Дані змінилися, спробуйте ще раз.",
      default: "Сталася помилка. Спробуйте ще раз або зв'яжіться з нами.",
    },
  },
  de: {
    title: "Mietvertrag",
    intro:
      "Bitte prüfe deine Angaben, lies den Vertrag und unterschreibe mit dem Finger. Eine Kopie bekommst du per E-Mail.",
    rental: "Deine Miete",
    pickup: "Abholung",
    ret: "Rückgabe",
    price: "Gesamtpreis (inkl. MwSt.)",
    openContract: "Vertrag öffnen (PDF)",
    yourData: "Deine Angaben (wie in deinen Dokumenten)",
    labels: {
      fullName: "Vor- und Nachname",
      docType: "Dokument",
      docNumber: "Dokumentnummer",
      docExpiry: "Dokument gültig bis",
      birthDate: "Geburtsdatum",
      nationality: "Staatsangehörigkeit",
      street: "Straße und Hausnummer",
      city: "Ort",
      postalCode: "Postleitzahl",
      country: "Land",
      phone: "Telefon",
      licenseNumber: "Führerscheinnummer (falls vorhanden)",
      licenseCountry: "Führerschein ausgestellt in (Land)",
      licenseIssued: "Führerschein ausgestellt am",
      licenseExpiry: "Führerschein gültig bis",
      extraDriverName: "Name",
      extraDriverDoc: "Dokumentnummer",
      extraDriverLicense: "Führerscheinnummer",
    },
    docTypes: { passport: "Reisepass", dni: "DNI", nie: "NIE", id_card: "Personalausweis" },
    extraDriver: "Zusätzlicher Fahrer (optional)",
    signHere: "Hier unterschreiben",
    clear: "Löschen",
    consents: {
      readContract: "Ich habe den Mietvertrag gelesen und akzeptiere ihn.",
      electronicSignature:
        "Ich bin mit der elektronischen Unterschrift einverstanden; sie gilt wie eine Unterschrift auf Papier (Ziffer 16).",
      cardAuthorization: "Ich erlaube spätere Belastungen meiner Karte gemäß Ziffer 5.6.",
      liabilityClauses:
        "Ich akzeptiere: Wenn ich oder meine Fahrer verantwortlich sind, zahle ich Abschleppen, Verwahrstelle und Rückholung des Fahrzeugs, Anwälte und Gerichtskosten, Schäden auf Fähren sowie die Entschädigung für die Tage, an denen das Wohnmobil wegen der Reparatur nicht vermietet werden kann (Ziffern 5.5, 5.9, 7.4 und 11.7).",
      dataProtection: "Ich wurde über die Verarbeitung meiner personenbezogenen Daten informiert (Ziffer 15).",
      languageNotice:
        "Ich habe die Mietbedingungen in einer Sprache gelesen, die ich verstehe ({link}), und weiß, dass die spanische Fassung des Vertrags maßgeblich ist (Ziffer 17).",
    },
    conditionsLink: "Bedingungen in deiner Sprache",
    sendCode: "Bestätigungscode senden",
    codeSent: (h) => `Wir haben einen 6-stelligen Code an ${h} gesendet.`,
    codeLabel: "Bestätigungscode",
    sign: "Vertrag unterschreiben",
    signing: "Wird unterschrieben...",
    doneTitle: "Vertrag unterschrieben",
    doneBody: "Danke. Wir haben dir eine PDF-Kopie per E-Mail geschickt. Hab sie während der Reise dabei.",
    signedAlready: "Dieser Vertrag ist bereits unterschrieben.",
    invalid:
      "Dieser Link ist ungültig oder abgelaufen. Schreib uns bitte per WhatsApp: +34 624 038 085.",
    needSignature: "Bitte unterschreibe im Feld.",
    fillAll: "Bitte fülle alle Pflichtfelder aus.",
    errors: {
      code_wrong: "Der Code ist nicht korrekt.",
      code_expired: "Der Code ist abgelaufen. Fordere einen neuen an.",
      too_many_attempts: "Zu viele Versuche. Fordere später einen neuen Code an.",
      code_too_soon: "Bitte warte eine Minute, bevor du einen neuen Code anforderst.",
      no_code: "Fordere zuerst einen Bestätigungscode an.",
      consent_required: "Bitte bestätige alle Punkte.",
      signature_invalid: "Die Unterschrift ist ungültig. Bitte unterschreibe noch einmal.",
      not_pending: "Dieser Vertrag kann nicht mehr unterschrieben werden.",
      conflict: "Etwas hat sich geändert, bitte versuche es erneut.",
      default: "Etwas ist schiefgelaufen. Versuche es erneut oder kontaktiere uns.",
    },
  },
  it: {
    title: "Contratto di noleggio",
    intro:
      "Controlla i tuoi dati, leggi il contratto e firmalo con il dito. Riceverai una copia via email.",
    rental: "Il tuo noleggio",
    pickup: "Ritiro",
    ret: "Riconsegna",
    price: "Prezzo totale (IVA inclusa)",
    openContract: "Apri il contratto (PDF)",
    yourData: "I tuoi dati (come nei documenti)",
    labels: {
      fullName: "Nome e cognome",
      docType: "Documento",
      docNumber: "Numero del documento",
      docExpiry: "Scadenza del documento",
      birthDate: "Data di nascita",
      nationality: "Nazionalità",
      street: "Via e numero civico",
      city: "Città",
      postalCode: "CAP",
      country: "Paese",
      phone: "Telefono",
      licenseNumber: "Numero della patente (se presente)",
      licenseCountry: "Patente rilasciata in (paese)",
      licenseIssued: "Data di rilascio della patente",
      licenseExpiry: "Scadenza della patente",
      extraDriverName: "Nome",
      extraDriverDoc: "Numero del documento",
      extraDriverLicense: "Numero della patente",
    },
    docTypes: { passport: "Passaporto", dni: "DNI", nie: "NIE", id_card: "Carta d'identità" },
    extraDriver: "Conducente aggiuntivo (facoltativo)",
    signHere: "Firma qui",
    clear: "Cancella",
    consents: {
      readContract: "Ho letto e accetto il contratto di noleggio.",
      electronicSignature:
        "Accetto di firmare elettronicamente; la firma ha lo stesso valore di quella su carta (clausola 16).",
      cardAuthorization: "Autorizzo gli addebiti successivi sulla mia carta come descritto alla clausola 5.6.",
      liabilityClauses:
        "Accetto che, se la responsabilità è mia o dei miei conducenti, pago carro attrezzi, deposito e recupero del veicolo, avvocati e spese legali, danni sui traghetti e l'indennizzo per i giorni in cui il camper non si può noleggiare perché in riparazione (clausole 5.5, 5.9, 7.4 e 11.7).",
      dataProtection: "Sono stato informato sul trattamento dei miei dati personali (clausola 15).",
      languageNotice:
        "Ho letto le condizioni di noleggio in una lingua che comprendo ({link}) e so che prevale la versione spagnola del contratto (clausola 17).",
    },
    conditionsLink: "Condizioni nella tua lingua",
    sendCode: "Inviami il codice di conferma",
    codeSent: (h) => `Abbiamo inviato un codice di 6 cifre a ${h}.`,
    codeLabel: "Codice di conferma",
    sign: "Firma il contratto",
    signing: "Firma in corso...",
    doneTitle: "Contratto firmato",
    doneBody: "Grazie. Ti abbiamo inviato una copia in PDF via email. Tienila con te durante il viaggio.",
    signedAlready: "Questo contratto è già firmato.",
    invalid:
      "Questo link non è valido o è scaduto. Scrivici su WhatsApp al +34 624 038 085.",
    needSignature: "Disegna la tua firma.",
    fillAll: "Compila tutti i campi obbligatori.",
    errors: {
      code_wrong: "Il codice non è corretto.",
      code_expired: "Il codice è scaduto. Richiedine uno nuovo.",
      too_many_attempts: "Troppi tentativi. Richiedi un nuovo codice più tardi.",
      code_too_soon: "Attendi un minuto prima di richiedere un altro codice.",
      no_code: "Richiedi prima un codice di conferma.",
      consent_required: "Spunta tutte le conferme.",
      signature_invalid: "La firma non è valida. Disegnala di nuovo.",
      not_pending: "Questo contratto non può più essere firmato.",
      conflict: "Qualcosa è cambiato, riprova.",
      default: "Qualcosa è andato storto. Riprova o contattaci.",
    },
  },
  nl: {
    title: "Huurcontract",
    intro:
      "Controleer je gegevens, lees het contract en onderteken met je vinger. Je krijgt een kopie per e-mail.",
    rental: "Je huur",
    pickup: "Ophalen",
    ret: "Terugbrengen",
    price: "Totaalprijs (incl. btw)",
    openContract: "Contract openen (PDF)",
    yourData: "Je gegevens (zoals op je documenten)",
    labels: {
      fullName: "Voor- en achternaam",
      docType: "Document",
      docNumber: "Documentnummer",
      docExpiry: "Document geldig tot",
      birthDate: "Geboortedatum",
      nationality: "Nationaliteit",
      street: "Straat en huisnummer",
      city: "Plaats",
      postalCode: "Postcode",
      country: "Land",
      phone: "Telefoon",
      licenseNumber: "Rijbewijsnummer (indien vermeld)",
      licenseCountry: "Rijbewijs afgegeven in (land)",
      licenseIssued: "Rijbewijs afgegeven op",
      licenseExpiry: "Rijbewijs geldig tot",
      extraDriverName: "Naam",
      extraDriverDoc: "Documentnummer",
      extraDriverLicense: "Rijbewijsnummer",
    },
    docTypes: { passport: "Paspoort", dni: "DNI", nie: "NIE", id_card: "Identiteitskaart" },
    extraDriver: "Extra bestuurder (optioneel)",
    signHere: "Hier ondertekenen",
    clear: "Wissen",
    consents: {
      readContract: "Ik heb het huurcontract gelezen en ga ermee akkoord.",
      electronicSignature:
        "Ik ga akkoord met elektronisch ondertekenen; dit geldt als een handtekening op papier (artikel 16).",
      cardAuthorization: "Ik geef toestemming voor latere afschrijvingen van mijn kaart volgens artikel 5.6.",
      liabilityClauses:
        "Ik aanvaard dat ik, als ik of mijn bestuurders verantwoordelijk zijn, betaal voor wegslepen, depot en ophalen van het voertuig, advocaten en proceskosten, schade op veerboten en de vergoeding voor de dagen dat de camper door reparatie niet verhuurd kan worden (artikelen 5.5, 5.9, 7.4 en 11.7).",
      dataProtection: "Ik ben geïnformeerd over de verwerking van mijn persoonsgegevens (artikel 15).",
      languageNotice:
        "Ik heb de huurvoorwaarden gelezen in een taal die ik begrijp ({link}) en ik weet dat de Spaanse versie van het contract prevaleert (artikel 17).",
    },
    conditionsLink: "Voorwaarden in jouw taal",
    sendCode: "Stuur me de bevestigingscode",
    codeSent: (h) => `We hebben een code van 6 cijfers gestuurd naar ${h}.`,
    codeLabel: "Bevestigingscode",
    sign: "Contract ondertekenen",
    signing: "Bezig met ondertekenen...",
    doneTitle: "Contract ondertekend",
    doneBody: "Bedankt. We hebben je een PDF-kopie gemaild. Houd die tijdens de reis bij je.",
    signedAlready: "Dit contract is al ondertekend.",
    invalid:
      "Deze link is ongeldig of verlopen. Neem contact op via WhatsApp: +34 624 038 085.",
    needSignature: "Teken je handtekening.",
    fillAll: "Vul alle verplichte velden in.",
    errors: {
      code_wrong: "De code klopt niet.",
      code_expired: "De code is verlopen. Vraag een nieuwe aan.",
      too_many_attempts: "Te veel pogingen. Vraag later een nieuwe code aan.",
      code_too_soon: "Wacht een minuut voordat je een nieuwe code aanvraagt.",
      no_code: "Vraag eerst een bevestigingscode aan.",
      consent_required: "Vink alle bevestigingen aan.",
      signature_invalid: "De handtekening is ongeldig. Teken opnieuw.",
      not_pending: "Dit contract kan niet meer ondertekend worden.",
      conflict: "Er is iets veranderd, probeer het opnieuw.",
      default: "Er ging iets mis. Probeer het opnieuw of neem contact met ons op.",
    },
  },
};


// Photos of the ID document and the driving licence (contract clause 15.4).
type DocSlot = "idFront" | "idBack" | "licenseFront" | "licenseBack";
const DOCS_TEXT: Record<
  Lang,
  ScanTexts & {
    title: string;
    intro: string;
    labels: Record<DocSlot, string>;
    passportPage: string;
    needDocs: string;
    errors: { docs_required: string; doc_invalid: string };
  }
> = {
  en: {
    title: "Photos of your documents",
    intro: "Your ID or passport and your driving licence, both sides. Take them on a flat, well-lit surface without glare; all text must be readable. They are stored privately and only used for this rental (clause 15.4).",
    labels: { idFront: "ID document, front", idBack: "ID document, back", licenseFront: "Driving licence, front", licenseBack: "Driving licence, back" },
    passportPage: "Passport, photo page",
    scan: "Scan with camera",
    upload: "Upload photo",
    retake: "Retake",
    uploading: "Uploading…",
    uploaded: "Uploaded",
    failed: "The photo could not be uploaded. Try again.",
    frameHint: "Fit the document inside the frame, avoid glare, hold still.",
    shoot: "Take photo",
    cancel: "Close",
    noCamera: "The camera is not available. Upload a photo instead.",
    needDocs: "Please add the photos of your documents.",
    errors: { docs_required: "Please add the photos of your documents.", doc_invalid: "The photo is not valid. Take it again." },
  },
  es: {
    title: "Fotos de tus documentos",
    intro: "Tu DNI, NIE o pasaporte y tu permiso de conducir, por ambas caras. Hazlas sobre una superficie plana, con buena luz y sin reflejos; todo el texto debe leerse. Se guardan de forma privada y solo se usan para este alquiler (apdo. 15.4).",
    labels: { idFront: "Documento de identidad, anverso", idBack: "Documento de identidad, reverso", licenseFront: "Permiso de conducir, anverso", licenseBack: "Permiso de conducir, reverso" },
    passportPage: "Pasaporte, página de la foto",
    scan: "Escanear con la cámara",
    upload: "Subir foto",
    retake: "Repetir",
    uploading: "Subiendo…",
    uploaded: "Subida",
    failed: "No se ha podido subir la foto. Inténtalo de nuevo.",
    frameHint: "Encaja el documento en el marco, evita los reflejos y no te muevas.",
    shoot: "Hacer foto",
    cancel: "Cerrar",
    noCamera: "La cámara no está disponible. Sube una foto.",
    needDocs: "Añade las fotos de tus documentos.",
    errors: { docs_required: "Añade las fotos de tus documentos.", doc_invalid: "La foto no es válida. Hazla de nuevo." },
  },
  ru: {
    title: "Фото документов",
    intro: "Паспорт или ID и водительское удостоверение с обеих сторон. Снимайте на ровной поверхности при хорошем свете, без бликов: весь текст должен читаться. Фото хранятся закрыто и используются только для этой аренды (п. 15.4).",
    labels: { idFront: "Документ (ID), лицевая сторона", idBack: "Документ (ID), оборотная сторона", licenseFront: "Водительское удостоверение, лицевая сторона", licenseBack: "Водительское удостоверение, оборотная сторона" },
    passportPage: "Паспорт, страница с фото",
    scan: "Сканировать камерой",
    upload: "Загрузить фото",
    retake: "Переснять",
    uploading: "Загрузка…",
    uploaded: "Загружено",
    failed: "Не удалось загрузить фото. Попробуйте ещё раз.",
    frameHint: "Поместите документ в рамку, избегайте бликов, не двигайте телефон.",
    shoot: "Сделать снимок",
    cancel: "Закрыть",
    noCamera: "Камера недоступна. Загрузите фото.",
    needDocs: "Добавьте фото документов.",
    errors: { docs_required: "Добавьте фото документов.", doc_invalid: "Фото не подходит. Сделайте его заново." },
  },
  uk: {
    title: "Фото документів",
    intro: "Паспорт або ID та водійське посвідчення з обох боків. Знімайте на рівній поверхні за гарного світла, без відблисків: увесь текст має читатися. Фото зберігаються закрито й використовуються лише для цієї оренди (п. 15.4).",
    labels: { idFront: "Документ (ID), лицьовий бік", idBack: "Документ (ID), зворотний бік", licenseFront: "Водійське посвідчення, лицьовий бік", licenseBack: "Водійське посвідчення, зворотний бік" },
    passportPage: "Паспорт, сторінка з фото",
    scan: "Сканувати камерою",
    upload: "Завантажити фото",
    retake: "Перезняти",
    uploading: "Завантаження…",
    uploaded: "Завантажено",
    failed: "Не вдалося завантажити фото. Спробуйте ще раз.",
    frameHint: "Розмістіть документ у рамці, уникайте відблисків, не рухайте телефон.",
    shoot: "Зробити знімок",
    cancel: "Закрити",
    noCamera: "Камера недоступна. Завантажте фото.",
    needDocs: "Додайте фото документів.",
    errors: { docs_required: "Додайте фото документів.", doc_invalid: "Фото не підходить. Зробіть його знову." },
  },
  de: {
    title: "Fotos deiner Dokumente",
    intro: "Ausweis oder Reisepass und Führerschein, jeweils beide Seiten. Fotografiere sie auf einer flachen Unterlage, bei gutem Licht und ohne Spiegelungen; der ganze Text muss lesbar sein. Sie werden vertraulich gespeichert und nur für diese Miete verwendet (Ziffer 15.4).",
    labels: { idFront: "Ausweis, Vorderseite", idBack: "Ausweis, Rückseite", licenseFront: "Führerschein, Vorderseite", licenseBack: "Führerschein, Rückseite" },
    passportPage: "Reisepass, Seite mit Foto",
    scan: "Mit Kamera scannen",
    upload: "Foto hochladen",
    retake: "Neu aufnehmen",
    uploading: "Wird hochgeladen…",
    uploaded: "Hochgeladen",
    failed: "Das Foto konnte nicht hochgeladen werden. Bitte erneut versuchen.",
    frameHint: "Dokument in den Rahmen legen, Spiegelungen vermeiden, ruhig halten.",
    shoot: "Foto aufnehmen",
    cancel: "Schließen",
    noCamera: "Die Kamera ist nicht verfügbar. Lade stattdessen ein Foto hoch.",
    needDocs: "Bitte füge die Fotos deiner Dokumente hinzu.",
    errors: { docs_required: "Bitte füge die Fotos deiner Dokumente hinzu.", doc_invalid: "Das Foto ist ungültig. Bitte neu aufnehmen." },
  },
  it: {
    title: "Foto dei tuoi documenti",
    intro: "Carta d'identità o passaporto e patente di guida, fronte e retro. Scattale su una superficie piana, con buona luce e senza riflessi; tutto il testo deve essere leggibile. Sono conservate in modo riservato e usate solo per questo noleggio (punto 15.4).",
    labels: { idFront: "Documento d'identità, fronte", idBack: "Documento d'identità, retro", licenseFront: "Patente di guida, fronte", licenseBack: "Patente di guida, retro" },
    passportPage: "Passaporto, pagina con la foto",
    scan: "Scansiona con la fotocamera",
    upload: "Carica foto",
    retake: "Rifai",
    uploading: "Caricamento…",
    uploaded: "Caricata",
    failed: "Non è stato possibile caricare la foto. Riprova.",
    frameHint: "Inquadra il documento nella cornice, evita i riflessi e resta fermo.",
    shoot: "Scatta",
    cancel: "Chiudi",
    noCamera: "La fotocamera non è disponibile. Carica una foto.",
    needDocs: "Aggiungi le foto dei tuoi documenti.",
    errors: { docs_required: "Aggiungi le foto dei tuoi documenti.", doc_invalid: "La foto non è valida. Rifalla." },
  },
  nl: {
    title: "Foto's van je documenten",
    intro: "Je identiteitskaart of paspoort en je rijbewijs, beide kanten. Maak ze op een vlakke ondergrond, met goed licht en zonder schittering; alle tekst moet leesbaar zijn. Ze worden vertrouwelijk bewaard en alleen voor deze huur gebruikt (artikel 15.4).",
    labels: { idFront: "Identiteitsbewijs, voorkant", idBack: "Identiteitsbewijs, achterkant", licenseFront: "Rijbewijs, voorkant", licenseBack: "Rijbewijs, achterkant" },
    passportPage: "Paspoort, pagina met foto",
    scan: "Scannen met camera",
    upload: "Foto uploaden",
    retake: "Opnieuw",
    uploading: "Uploaden…",
    uploaded: "Geüpload",
    failed: "De foto kon niet worden geüpload. Probeer het opnieuw.",
    frameHint: "Plaats het document in het kader, vermijd schittering en houd stil.",
    shoot: "Foto maken",
    cancel: "Sluiten",
    noCamera: "De camera is niet beschikbaar. Upload een foto.",
    needDocs: "Voeg de foto's van je documenten toe.",
    errors: { docs_required: "Voeg de foto's van je documenten toe.", doc_invalid: "De foto is ongeldig. Maak hem opnieuw." },
  },
};

const docSlotsFor = (docType: string | undefined): DocSlot[] =>
  docType === "passport" ? ["idFront", "licenseFront", "licenseBack"] : ["idFront", "idBack", "licenseFront", "licenseBack"];

const pickLang = (...candidates: (string | undefined)[]): Lang => {
  for (const c of candidates) if (c === "es" || c === "en" || c === "ru" || c === "uk" || c === "de" || c === "it" || c === "nl") return c;
  return "en";
};

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function SignaturePad({
  onChange,
  clearLabel,
}: {
  onChange: (png: string | null) => void;
  clearLabel: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const point = (e: React.PointerEvent) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  };
  const start = (e: React.PointerEvent) => {
    ref.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext("2d")!;
    const p = point(e);
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    onChange(ref.current!.toDataURL("image/png"));
  };
  const clear = () => {
    const c = ref.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={700}
        height={220}
        className="w-full touch-none rounded-lg border border-dashed border-border bg-white"
        style={{ aspectRatio: "700 / 220" }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
      />
      <button
        type="button"
        onClick={clear}
        disabled={!hasInk}
        className="mt-1 text-xs text-muted-foreground underline disabled:opacity-40"
      >
        {clearLabel}
      </button>
    </div>
  );
}

// The languageNotice consent links to the published conditions in the guest's
// language (the contract PDF itself is Spanish | English).
function withConditionsLink(label: string, linkText: string, lang: Lang) {
  const [before, after = ""] = label.split("{link}");
  return (
    <>
      {before}
      <a
        href={`/condiciones?lang=${lang}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        {linkText}
      </a>
      {after}
    </>
  );
}

// The guest's own fields, in the order shown. Not every licence shows a number,
// so that one is optional; its issue and expiry dates are required.
const MAIN_FIELDS = [
  "fullName",
  "docNumber",
  "docExpiry",
  "birthDate",
  "nationality",
  "street",
  "city",
  "postalCode",
  "country",
  "phone",
  "licenseNumber",
  "licenseCountry",
  "licenseIssued",
  "licenseExpiry",
] as const;
const OPTIONAL_FIELDS = new Set<string>(["licenseNumber"]);
const BASE_FIELDS = MAIN_FIELDS.filter((k) => !OPTIONAL_FIELDS.has(k));
const DATE_FIELDS = new Set(["birthDate", "docExpiry", "licenseIssued", "licenseExpiry"]);

function SignPage() {
  const { token } = Route.useParams();
  const search = Route.useSearch();
  const [contract, setContract] = useState<ContractView | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ docType: "passport" });
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [uploaded, setUploaded] = useState<Partial<Record<DocSlot, boolean>>>({});
  // After a failed "send code" every missing item is outlined in red.
  const [tried, setTried] = useState(false);

  const lang = pickLang(search.lang, contract?.language);
  const t = TEXT[lang];
  const d = DOCS_TEXT[lang];

  useEffect(() => {
    fetch(`/api/contract?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("bad");
        const j = (await r.json()) as { contract: ContractView };
        setContract(j.contract);
        setForm((f) => ({ ...f, fullName: f.fullName ?? j.contract.guestName }));
      })
      .catch(() => setLoadFailed(true));
  }, [token]);

  const set = useCallback((k: string, v: string) => setForm((f) => ({ ...f, [k]: v })), []);
  const errText = (code?: string) =>
    (d.errors as Record<string, string>)[code || ""] || t.errors[code || ""] || t.errors.default;

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/contract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...body }),
    });
    const j = (await r.json().catch(() => ({}))) as { code?: string } & Record<string, unknown>;
    if (!r.ok) throw Object.assign(new Error("request failed"), { code: j.code });
    return j;
  }

  const filled = BASE_FIELDS.every((k) => (form[k] || "").trim());
  const allConsents = [
    "readContract",
    "electronicSignature",
    "cardAuthorization",
    "liabilityClauses",
    "dataProtection",
    "languageNotice",
  ].every((k) => consents[k]);

  const docsDone = docSlotsFor(form.docType).every((k) => uploaded[k]);

  async function askCode() {
    setError(null);
    const problem = !filled
      ? t.fillAll
      : !docsDone
        ? d.needDocs
        : !signature
          ? t.needSignature
          : !allConsents
            ? t.errors.consent_required
            : null;
    if (problem) {
      setTried(true);
      setError(problem);
      // Bring the first missing item into view once React has outlined it.
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>("[data-missing='true']");
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
      });
      return;
    }
    setBusy(true);
    try {
      const j = await post({ action: "code" });
      setCodeSent(String(j.emailHint || ""));
    } catch (e) {
      setError(errText((e as { code?: string }).code));
    } finally {
      setBusy(false);
    }
  }

  async function sign() {
    setError(null);
    setBusy(true);
    try {
      const data: Record<string, string> = {};
      for (const k of [
        ...MAIN_FIELDS,
        "docType",
        "extraDriverName",
        "extraDriverDoc",
        "extraDriverLicense",
      ]) {
        data[k] = (form[k] || "").trim();
      }
      await post({ action: "sign", code: code.trim(), data, consents, signature });
      // Reload: the same link now opens the booking page with the signed copy.
      const r = await fetch(`/api/contract?token=${encodeURIComponent(token)}`);
      if (r.ok) setContract(((await r.json()) as { contract: ContractView }).contract);
      setDone(true);
    } catch (e) {
      setError(errText((e as { code?: string }).code));
    } finally {
      setBusy(false);
    }
  }

  if (loadFailed)
    return (
      <Shell>
        <p className="text-sm">{TEXT.en.invalid}</p>
        <p className="mt-2 text-sm">{TEXT.es.invalid}</p>
      </Shell>
    );
  if (!contract)
    return (
      <Shell>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Shell>
    );
  if (contract.status === "signed") {
    return (
      <Shell>
        <BookingCabinet contract={contract} token={token} lang={lang} justSigned={done} />
      </Shell>
    );
  }
  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
          <h1 className="mt-3 font-display text-2xl">{t.doneTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.doneBody}</p>
        </div>
      </Shell>
    );
  }
  if (contract.status !== "pending") {
    return (
      <Shell>
        <p className="text-sm">{t.invalid}</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-2xl">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.intro}</p>

      <section className="mt-5 rounded-xl border border-border p-4 text-sm">
        <h2 className="font-semibold">{t.rental}</h2>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">{t.pickup}</dt>
          <dd>
            {contract.startDate} · {contract.pickupTime}
          </dd>
          <dt className="text-muted-foreground">{t.ret}</dt>
          <dd>
            {contract.endDate} · {contract.returnTime}
          </dd>
          {contract.priceTotal != null && (
            <>
              <dt className="text-muted-foreground">{t.price}</dt>
              <dd>{contract.priceTotal} €</dd>
            </>
          )}
        </dl>
        <a
          href={contract.pdfPath}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-primary underline"
        >
          {t.openContract}
        </a>
      </section>

      <section className="mt-5">
        <h2 className="font-semibold">{t.yourData}</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">{t.labels.docType}</span>
            <select
              className={inputCls}
              value={form.docType}
              onChange={(e) => set("docType", e.target.value)}
            >
              {Object.entries(t.docTypes).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          {MAIN_FIELDS.map((k) => {
            const required = !OPTIONAL_FIELDS.has(k);
            const missing = required && tried && !(form[k] || "").trim();
            return (
              <label key={k} className="block text-sm">
                <span className={`mb-1 block ${missing ? "text-destructive" : "text-muted-foreground"}`}>
                  {t.labels[k]} {required && <span className="text-destructive">*</span>}
                </span>
                <input
                  className={`${inputCls} ${missing ? "border-destructive ring-1 ring-destructive" : ""}`}
                  type={DATE_FIELDS.has(k) ? "date" : k === "phone" ? "tel" : "text"}
                  value={form[k] || ""}
                  onChange={(e) => set(k, e.target.value)}
                  autoComplete="off"
                  aria-invalid={missing || undefined}
                  data-missing={missing || undefined}
                />
              </label>
            );
          })}
        </div>

        <h3 className="mt-5 text-sm font-semibold">{t.extraDriver}</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {(["extraDriverName", "extraDriverDoc", "extraDriverLicense"] as const).map((k) => (
            <label key={k} className="block text-sm">
              <span className="mb-1 block text-muted-foreground">{t.labels[k]}</span>
              <input
                className={inputCls}
                value={form[k] || ""}
                onChange={(e) => set(k, e.target.value)}
                autoComplete="off"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="font-semibold">{d.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{d.intro}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {docSlotsFor(form.docType).map((slot) => (
            <DocScanner
              key={slot}
              label={slot === "idFront" && form.docType === "passport" ? d.passportPage : d.labels[slot]}
              passport={slot === "idFront" && form.docType === "passport"}
              missing={tried && !uploaded[slot]}
              texts={d}
              onImage={async (image) => {
                setUploaded((u) => ({ ...u, [slot]: false }));
                await post({ action: "doc", slot, image });
                setUploaded((u) => ({ ...u, [slot]: true }));
              }}
            />
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="font-semibold">{t.signHere}</h2>
        <div
          className={`mt-2 rounded-lg ${tried && !signature ? "ring-2 ring-destructive" : ""}`}
          data-missing={(tried && !signature) || undefined}
        >
          <SignaturePad onChange={setSignature} clearLabel={t.clear} />
        </div>
      </section>

      <section className="mt-5 space-y-2 text-sm">
        {Object.entries(t.consents).map(([k, label]) => (
          <label
            key={k}
            className={`flex items-start gap-2 ${tried && !consents[k] ? "rounded-md text-destructive ring-1 ring-destructive" : ""}`}
            data-missing={(tried && !consents[k]) || undefined}
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={!!consents[k]}
              onChange={(e) => setConsents((c) => ({ ...c, [k]: e.target.checked }))}
            />
            <span>{k === "languageNotice" ? withConditionsLink(label, t.conditionsLink, lang) : label}</span>
          </label>
        ))}
      </section>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {!codeSent ? (
        <button
          type="button"
          disabled={busy}
          onClick={askCode}
          className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t.sendCode}
        </button>
      ) : (
        <div className="mt-5 rounded-xl border border-border p-4">
          <p className="text-sm">{t.codeSent(codeSent)}</p>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-muted-foreground">{t.codeLabel}</span>
            <input
              className={inputCls}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <button
            type="button"
            disabled={busy || code.length !== 6}
            onClick={sign}
            className="mt-4 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? t.signing : t.sign}
          </button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-background px-4 py-8 text-foreground">
      <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">
        Camper Retreat VLC
      </p>
      {children}
    </main>
  );
}
