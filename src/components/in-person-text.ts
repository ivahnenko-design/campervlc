// Texts of the in-person signing on /sign/:token (7 languages): the guest sends
// the data and document photos before pickup; the contract is signed at pickup
// on the staff device, after the data was checked against the originals.
type Lang = "es" | "en" | "ru" | "uk" | "de" | "it" | "nl";

export interface InPersonText {
  intro: string;
  sendData: string;
  sending: string;
  sentTitle: string;
  sentBody: string;
  editHint: string;
  checkedTitle: string;
  checkedBody: string;
  kioskTitle: string;
  kioskIntro: (name: string) => string;
  checkedData: string;
  annexTitle: string;
  annexIntro: string;
  kioskDoneTitle: string;
  kioskDoneBody: string;
  notOpen: string;
}

export const IN_PERSON_TEXT: Record<Lang, InPersonText> = {
  en: {
    intro:
      "Read the contract and send us your details with photos of your documents. At pickup we check them against your original documents and you sign the contract there.",
    sendData: "Send my details",
    sending: "Sending...",
    sentTitle: "Details sent",
    sentBody:
      "Thank you. Please bring your original ID or passport and driving licence to the pickup: we check them and you sign the contract there. The copy signed by both parties will arrive by email.",
    editHint:
      "You have already sent your details. You can correct them until pickup and send them again.",
    checkedTitle: "Details checked",
    checkedBody:
      "Your details have been checked against your documents. The contract is signed at pickup, in person.",
    kioskTitle: "Signing the rental contract",
    kioskIntro: (n) =>
      `Your details below were checked against your original documents by ${n}. Read the contract and the handover report, then sign.`,
    checkedData: "Your details (checked)",
    annexTitle: "Handover report (annex I-A)",
    annexIntro:
      "Mileage, fuel and the condition of the motorhome at handover. Numbers on the drawing = damage listed below it.",
    kioskDoneTitle: "Thank you, you have signed",
    kioskDoneBody:
      "Please hand the device back. The contract signed by both parties will arrive by email.",
    notOpen: "Your details are already being checked. Please contact us to change anything.",
  },
  es: {
    intro:
      "Lee el contrato y envíanos tus datos con fotos de tus documentos. En la recogida los comprobamos con tus documentos originales y firmas el contrato allí.",
    sendData: "Enviar mis datos",
    sending: "Enviando...",
    sentTitle: "Datos enviados",
    sentBody:
      "Gracias. Trae a la recogida tu documento de identidad o pasaporte y tu permiso de conducir originales: los comprobamos y firmas el contrato allí. Recibirás por email la copia firmada por ambas partes.",
    editHint:
      "Ya has enviado tus datos. Puedes corregirlos hasta la recogida y volver a enviarlos.",
    checkedTitle: "Datos comprobados",
    checkedBody:
      "Tus datos se han comprobado con tus documentos. El contrato se firma en persona en la recogida.",
    kioskTitle: "Firma del contrato de alquiler",
    kioskIntro: (n) =>
      `${n} ha comprobado tus datos con tus documentos originales. Lee el contrato y el acta de entrega y firma.`,
    checkedData: "Tus datos (comprobados)",
    annexTitle: "Acta de entrega (anexo I-A)",
    annexIntro:
      "Kilómetros, combustible y estado de la autocaravana en la entrega. Los números del dibujo = daños de la lista inferior.",
    kioskDoneTitle: "Gracias, has firmado",
    kioskDoneBody:
      "Devuelve el dispositivo, por favor. Recibirás por email el contrato firmado por ambas partes.",
    notOpen: "Tus datos ya se están comprobando. Escríbenos si necesitas cambiar algo.",
  },
  ru: {
    intro:
      "Прочитайте договор и отправьте нам свои данные с фото документов. При получении автодома мы сверим их с оригиналами, и вы подпишете договор на месте.",
    sendData: "Отправить данные",
    sending: "Отправляем...",
    sentTitle: "Данные отправлены",
    sentBody:
      "Спасибо. Возьмите на получение оригиналы паспорта или ID-карты и водительских прав: мы их сверим, и вы подпишете договор на месте. Копия, подписанная обеими сторонами, придёт на почту.",
    editHint:
      "Вы уже отправили данные. До получения автодома их можно исправить и отправить снова.",
    checkedTitle: "Данные проверены",
    checkedBody:
      "Ваши данные сверены с документами. Договор подписывается лично при получении автодома.",
    kioskTitle: "Подписание договора аренды",
    kioskIntro: (n) =>
      `${n} сверил(а) ваши данные с оригиналами документов. Прочитайте договор и акт выдачи, затем подпишите.`,
    checkedData: "Ваши данные (проверены)",
    annexTitle: "Акт выдачи (приложение I-A)",
    annexIntro:
      "Пробег, топливо и состояние автодома при выдаче. Номера на рисунке = повреждения из списка под ним.",
    kioskDoneTitle: "Спасибо, вы подписали",
    kioskDoneBody:
      "Верните, пожалуйста, устройство. Договор, подписанный обеими сторонами, придёт на почту.",
    notOpen: "Ваши данные уже проверяются. Напишите нам, если нужно что-то изменить.",
  },
  uk: {
    intro:
      "Прочитайте договір і надішліть нам свої дані з фото документів. Під час отримання автобудинку ми звіримо їх з оригіналами, і ви підпишете договір на місці.",
    sendData: "Надіслати дані",
    sending: "Надсилаємо...",
    sentTitle: "Дані надіслано",
    sentBody:
      "Дякуємо. Візьміть на отримання оригінали паспорта або ID-картки та водійського посвідчення: ми їх звіримо, і ви підпишете договір на місці. Копія, підписана обома сторонами, надійде на пошту.",
    editHint:
      "Ви вже надіслали дані. До отримання автобудинку їх можна виправити й надіслати знову.",
    checkedTitle: "Дані перевірено",
    checkedBody:
      "Ваші дані звірено з документами. Договір підписується особисто під час отримання автобудинку.",
    kioskTitle: "Підписання договору оренди",
    kioskIntro: (n) =>
      `${n} звірив(ла) ваші дані з оригіналами документів. Прочитайте договір і акт видачі, потім підпишіть.`,
    checkedData: "Ваші дані (перевірено)",
    annexTitle: "Акт видачі (додаток I-A)",
    annexIntro:
      "Пробіг, пальне та стан автобудинку під час видачі. Номери на малюнку = пошкодження зі списку під ним.",
    kioskDoneTitle: "Дякуємо, ви підписали",
    kioskDoneBody:
      "Поверніть, будь ласка, пристрій. Договір, підписаний обома сторонами, надійде на пошту.",
    notOpen: "Ваші дані вже перевіряються. Напишіть нам, якщо потрібно щось змінити.",
  },
  de: {
    intro:
      "Lies den Vertrag und sende uns deine Daten mit Fotos deiner Dokumente. Bei der Abholung prüfen wir sie mit den Originalen und du unterschreibst den Vertrag vor Ort.",
    sendData: "Meine Daten senden",
    sending: "Wird gesendet...",
    sentTitle: "Daten gesendet",
    sentBody:
      "Danke. Bring zur Abholung deinen Original-Ausweis oder Reisepass und deinen Führerschein mit: Wir prüfen sie und du unterschreibst den Vertrag vor Ort. Die von beiden Seiten unterschriebene Kopie kommt per E-Mail.",
    editHint:
      "Du hast deine Daten schon gesendet. Bis zur Abholung kannst du sie korrigieren und erneut senden.",
    checkedTitle: "Daten geprüft",
    checkedBody:
      "Deine Daten wurden mit deinen Dokumenten geprüft. Der Vertrag wird bei der Abholung persönlich unterschrieben.",
    kioskTitle: "Unterschrift des Mietvertrags",
    kioskIntro: (n) =>
      `${n} hat deine Daten mit deinen Originaldokumenten geprüft. Lies den Vertrag und das Übergabeprotokoll und unterschreibe dann.`,
    checkedData: "Deine Daten (geprüft)",
    annexTitle: "Übergabeprotokoll (Anhang I-A)",
    annexIntro:
      "Kilometerstand, Tank und Zustand des Wohnmobils bei der Übergabe. Zahlen in der Zeichnung = Schäden in der Liste darunter.",
    kioskDoneTitle: "Danke, du hast unterschrieben",
    kioskDoneBody:
      "Bitte gib das Gerät zurück. Der von beiden Seiten unterschriebene Vertrag kommt per E-Mail.",
    notOpen: "Deine Daten werden bereits geprüft. Schreib uns, wenn du etwas ändern musst.",
  },
  it: {
    intro:
      "Leggi il contratto e inviaci i tuoi dati con le foto dei documenti. Al ritiro li verifichiamo con gli originali e firmi il contratto sul posto.",
    sendData: "Invia i miei dati",
    sending: "Invio...",
    sentTitle: "Dati inviati",
    sentBody:
      "Grazie. Porta al ritiro il documento d'identità o il passaporto e la patente originali: li verifichiamo e firmi il contratto sul posto. Riceverai via email la copia firmata da entrambe le parti.",
    editHint: "Hai già inviato i tuoi dati. Puoi correggerli fino al ritiro e inviarli di nuovo.",
    checkedTitle: "Dati verificati",
    checkedBody:
      "I tuoi dati sono stati verificati con i documenti. Il contratto si firma di persona al ritiro.",
    kioskTitle: "Firma del contratto di noleggio",
    kioskIntro: (n) =>
      `${n} ha verificato i tuoi dati con i documenti originali. Leggi il contratto e il verbale di consegna, poi firma.`,
    checkedData: "I tuoi dati (verificati)",
    annexTitle: "Verbale di consegna (allegato I-A)",
    annexIntro:
      "Chilometri, carburante e stato del camper alla consegna. I numeri sul disegno = danni elencati sotto.",
    kioskDoneTitle: "Grazie, hai firmato",
    kioskDoneBody:
      "Restituisci il dispositivo, per favore. Riceverai via email il contratto firmato da entrambe le parti.",
    notOpen: "I tuoi dati sono già in verifica. Scrivici se devi cambiare qualcosa.",
  },
  nl: {
    intro:
      "Lees het contract en stuur ons je gegevens met foto's van je documenten. Bij het ophalen controleren we ze met de originelen en onderteken je het contract ter plekke.",
    sendData: "Mijn gegevens sturen",
    sending: "Versturen...",
    sentTitle: "Gegevens verstuurd",
    sentBody:
      "Bedankt. Neem bij het ophalen je originele identiteitsbewijs of paspoort en rijbewijs mee: we controleren ze en je ondertekent het contract ter plekke. De door beide partijen ondertekende kopie komt per e-mail.",
    editHint:
      "Je hebt je gegevens al gestuurd. Tot het ophalen kun je ze corrigeren en opnieuw sturen.",
    checkedTitle: "Gegevens gecontroleerd",
    checkedBody:
      "Je gegevens zijn gecontroleerd met je documenten. Het contract wordt bij het ophalen persoonlijk ondertekend.",
    kioskTitle: "Ondertekening van het huurcontract",
    kioskIntro: (n) =>
      `${n} heeft je gegevens gecontroleerd met je originele documenten. Lees het contract en het overdrachtsrapport en onderteken daarna.`,
    checkedData: "Je gegevens (gecontroleerd)",
    annexTitle: "Overdrachtsrapport (bijlage I-A)",
    annexIntro:
      "Kilometerstand, brandstof en staat van de camper bij de overdracht. Nummers op de tekening = schade in de lijst eronder.",
    kioskDoneTitle: "Bedankt, je hebt ondertekend",
    kioskDoneBody:
      "Geef het apparaat terug, alsjeblieft. Het door beide partijen ondertekende contract komt per e-mail.",
    notOpen: "Je gegevens worden al gecontroleerd. Neem contact op als je iets moet wijzigen.",
  },
};
