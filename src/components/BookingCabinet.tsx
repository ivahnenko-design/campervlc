import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Download,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

// The guest's booking page. After signing, the link from the email opens this
// page instead of the form: the booking, the signed copy, what to bring and
// the phone numbers for the trip.

type Lang = "es" | "en" | "ru" | "uk" | "de" | "it" | "nl";

export interface CabinetContract {
  id: string;
  language: string;
  guestName: string;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  priceTotal: number | null;
  source?: string;
  bookingRef?: string;
  emailHint: string;
  signedAt?: number | null;
  signerName?: string | null;
  vehicle?: {
    name: string;
    plate: string;
    city: string;
    pickupAddress?: string;
    coords?: { lat: number; lng: number } | null;
    insurance?: { company?: string; policy?: string; assistancePhone?: string } | null;
  };
}

const WHATSAPP = "+34 624 038 085";
const WHATSAPP_LINK = "https://wa.me/34624038085";

const T: Record<
  Lang,
  {
    signedTitle: string;
    signedBody: (email: string) => string;
    title: string;
    camper: string;
    pickup: string;
    ret: string;
    samePlace: string;
    ref: string;
    price: string;
    map: string;
    download: string;
    conditions: string;
    bringTitle: string;
    bring: { id: string; licence: string; card: string };
    phonesTitle: string;
    us: string;
    usNote: string;
    emergency: string;
    insurance: string;
    policy: string;
    assistance: string;
    finished: string;
    signedOn: (d: string) => string;
  }
> = {
  en: {
    signedTitle: "Contract signed",
    signedBody: (e) =>
      `A copy has been sent to ${e}. This page is your booking: you can come back to it with the same link.`,
    title: "Your booking",
    camper: "Motorhome",
    pickup: "Pickup",
    ret: "Return",
    samePlace: "Same place as pickup",
    ref: "Booking",
    price: "Total price (VAT incl.)",
    map: "Open in Google Maps",
    download: "Download the signed contract (PDF)",
    conditions: "Rental conditions in your language",
    bringTitle: "Bring to the pickup",
    bring: {
      id: "Your ID card or passport (original)",
      licence: "Your driving licence (original or in the official app)",
      card: "A bank card in your name for the 900 € security deposit",
    },
    phonesTitle: "Phone numbers for the trip",
    us: "Camper Retreat VLC (phone and WhatsApp)",
    usNote: "Breakdown, accident or any question: call or write to us first.",
    emergency: "Emergency (police, ambulance, fire)",
    insurance: "Insurance",
    policy: "Policy no.",
    assistance: "Roadside assistance 24 h",
    finished: "This rental has ended. Thank you for travelling with us!",
    signedOn: (d) => `Signed on ${d}`,
  },
  es: {
    signedTitle: "Contrato firmado",
    signedBody: (e) =>
      `Hemos enviado una copia a ${e}. Esta página es tu reserva: puedes volver a ella con el mismo enlace.`,
    title: "Tu reserva",
    camper: "Autocaravana",
    pickup: "Recogida",
    ret: "Devolución",
    samePlace: "En el mismo lugar de la recogida",
    ref: "Reserva",
    price: "Precio total (IVA incl.)",
    map: "Abrir en Google Maps",
    download: "Descargar el contrato firmado (PDF)",
    conditions: "Condiciones del alquiler en tu idioma",
    bringTitle: "Qué traer a la recogida",
    bring: {
      id: "Tu DNI o pasaporte (original)",
      licence: "Tu permiso de conducir (original o en la aplicación oficial)",
      card: "Una tarjeta bancaria a tu nombre para la fianza de 900 €",
    },
    phonesTitle: "Teléfonos para el viaje",
    us: "Camper Retreat VLC (teléfono y WhatsApp)",
    usNote: "Avería, accidente o cualquier duda: llámanos o escríbenos primero.",
    emergency: "Emergencias (policía, ambulancia, bomberos)",
    insurance: "Seguro",
    policy: "Póliza n.º",
    assistance: "Asistencia en carretera 24 h",
    finished: "Este alquiler ha terminado. ¡Gracias por viajar con nosotros!",
    signedOn: (d) => `Firmado el ${d}`,
  },
  ru: {
    signedTitle: "Договор подписан",
    signedBody: (e) =>
      `Копия отправлена на ${e}. Эта страница — ваша бронь: на неё можно вернуться по той же ссылке.`,
    title: "Ваша бронь",
    camper: "Автодом",
    pickup: "Получение",
    ret: "Возврат",
    samePlace: "Там же, где получение",
    ref: "Бронь",
    price: "Итого (с НДС)",
    map: "Открыть в Google Maps",
    download: "Скачать подписанный договор (PDF)",
    conditions: "Условия аренды на вашем языке",
    bringTitle: "Что взять на получение",
    bring: {
      id: "Паспорт или ID-карту (оригинал)",
      licence: "Водительские права (оригинал или в официальном приложении)",
      card: "Банковскую карту на ваше имя для залога 900 €",
    },
    phonesTitle: "Телефоны в поездке",
    us: "Camper Retreat VLC (телефон и WhatsApp)",
    usNote: "Поломка, ДТП или любой вопрос — сначала звоните или пишите нам.",
    emergency: "Экстренные службы (полиция, скорая, пожарные)",
    insurance: "Страховка",
    policy: "Полис №",
    assistance: "Помощь на дороге 24 ч",
    finished: "Аренда завершена. Спасибо, что путешествовали с нами!",
    signedOn: (d) => `Подписан ${d}`,
  },
  uk: {
    signedTitle: "Договір підписано",
    signedBody: (e) =>
      `Копію надіслано на ${e}. Ця сторінка — ваше бронювання: до неї можна повернутися за тим самим посиланням.`,
    title: "Ваше бронювання",
    camper: "Автобудинок",
    pickup: "Отримання",
    ret: "Повернення",
    samePlace: "Там само, де отримання",
    ref: "Бронювання",
    price: "Разом (з ПДВ)",
    map: "Відкрити в Google Maps",
    download: "Завантажити підписаний договір (PDF)",
    conditions: "Умови оренди вашою мовою",
    bringTitle: "Що взяти на отримання",
    bring: {
      id: "Паспорт або ID-картку (оригінал)",
      licence: "Водійське посвідчення (оригінал або в офіційному застосунку)",
      card: "Банківську картку на ваше ім'я для застави 900 €",
    },
    phonesTitle: "Телефони в подорожі",
    us: "Camper Retreat VLC (телефон і WhatsApp)",
    usNote: "Поломка, ДТП чи будь-яке питання — спершу телефонуйте або пишіть нам.",
    emergency: "Екстрені служби (поліція, швидка, пожежники)",
    insurance: "Страхування",
    policy: "Поліс №",
    assistance: "Допомога на дорозі 24 год",
    finished: "Оренду завершено. Дякуємо, що подорожували з нами!",
    signedOn: (d) => `Підписано ${d}`,
  },
  de: {
    signedTitle: "Vertrag unterschrieben",
    signedBody: (e) =>
      `Eine Kopie wurde an ${e} gesendet. Diese Seite ist deine Buchung: Du kannst mit demselben Link jederzeit zurückkommen.`,
    title: "Deine Buchung",
    camper: "Wohnmobil",
    pickup: "Abholung",
    ret: "Rückgabe",
    samePlace: "Am Abholort",
    ref: "Buchung",
    price: "Gesamtpreis (inkl. MwSt.)",
    map: "In Google Maps öffnen",
    download: "Unterschriebenen Vertrag herunterladen (PDF)",
    conditions: "Mietbedingungen in deiner Sprache",
    bringTitle: "Zur Abholung mitbringen",
    bring: {
      id: "Personalausweis oder Reisepass (Original)",
      licence: "Führerschein (Original oder in der offiziellen App)",
      card: "Eine Bankkarte auf deinen Namen für die Kaution von 900 €",
    },
    phonesTitle: "Telefonnummern für die Reise",
    us: "Camper Retreat VLC (Telefon und WhatsApp)",
    usNote: "Panne, Unfall oder jede Frage: zuerst uns anrufen oder schreiben.",
    emergency: "Notruf (Polizei, Rettung, Feuerwehr)",
    insurance: "Versicherung",
    policy: "Police Nr.",
    assistance: "Pannenhilfe 24 h",
    finished: "Diese Miete ist beendet. Danke, dass du mit uns gereist bist!",
    signedOn: (d) => `Unterschrieben am ${d}`,
  },
  it: {
    signedTitle: "Contratto firmato",
    signedBody: (e) =>
      `Abbiamo inviato una copia a ${e}. Questa pagina è la tua prenotazione: puoi tornarci con lo stesso link.`,
    title: "La tua prenotazione",
    camper: "Camper",
    pickup: "Ritiro",
    ret: "Riconsegna",
    samePlace: "Nello stesso luogo del ritiro",
    ref: "Prenotazione",
    price: "Prezzo totale (IVA incl.)",
    map: "Apri in Google Maps",
    download: "Scarica il contratto firmato (PDF)",
    conditions: "Condizioni di noleggio nella tua lingua",
    bringTitle: "Cosa portare al ritiro",
    bring: {
      id: "Carta d'identità o passaporto (originale)",
      licence: "Patente (originale o nell'app ufficiale)",
      card: "Una carta bancaria a tuo nome per la cauzione di 900 €",
    },
    phonesTitle: "Numeri utili per il viaggio",
    us: "Camper Retreat VLC (telefono e WhatsApp)",
    usNote: "Guasto, incidente o qualsiasi domanda: chiamaci o scrivici prima di tutto.",
    emergency: "Emergenze (polizia, ambulanza, vigili del fuoco)",
    insurance: "Assicurazione",
    policy: "Polizza n.",
    assistance: "Assistenza stradale 24 h",
    finished: "Questo noleggio è terminato. Grazie per aver viaggiato con noi!",
    signedOn: (d) => `Firmato il ${d}`,
  },
  nl: {
    signedTitle: "Contract ondertekend",
    signedBody: (e) =>
      `We hebben een kopie gestuurd naar ${e}. Deze pagina is je boeking: je kunt er met dezelfde link naar terugkeren.`,
    title: "Je boeking",
    camper: "Camper",
    pickup: "Ophalen",
    ret: "Inleveren",
    samePlace: "Op dezelfde plek als het ophalen",
    ref: "Boeking",
    price: "Totaalprijs (incl. btw)",
    map: "Openen in Google Maps",
    download: "Ondertekend contract downloaden (PDF)",
    conditions: "Huurvoorwaarden in jouw taal",
    bringTitle: "Meenemen bij het ophalen",
    bring: {
      id: "Je identiteitskaart of paspoort (origineel)",
      licence: "Je rijbewijs (origineel of in de officiële app)",
      card: "Een bankpas op jouw naam voor de borg van 900 €",
    },
    phonesTitle: "Telefoonnummers voor de reis",
    us: "Camper Retreat VLC (telefoon en WhatsApp)",
    usNote: "Pech, ongeluk of een vraag: bel of schrijf eerst ons.",
    emergency: "Noodnummer (politie, ambulance, brandweer)",
    insurance: "Verzekering",
    policy: "Polisnr.",
    assistance: "Pechhulp 24 uur",
    finished: "Deze huur is afgelopen. Bedankt dat je met ons hebt gereisd!",
    signedOn: (d) => `Ondertekend op ${d}`,
  },
};

const LOCALE: Record<Lang, string> = {
  en: "en-GB",
  es: "es-ES",
  ru: "ru-RU",
  uk: "uk-UA",
  de: "de-DE",
  it: "it-IT",
  nl: "nl-NL",
};

function fmtDay(iso: string, lang: Lang) {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(LOCALE[lang], {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function BookingCabinet({
  contract,
  token,
  lang,
  justSigned,
}: {
  contract: CabinetContract;
  token: string;
  lang: Lang;
  justSigned: boolean;
}) {
  const t = T[lang] || T.en;
  const v = contract.vehicle;
  const ins = v?.insurance;
  const today = new Date().toISOString().slice(0, 10);
  const finished = contract.endDate < today;
  const mapUrl = v?.coords
    ? `https://www.google.com/maps/search/?api=1&query=${v.coords.lat},${v.coords.lng}`
    : v?.pickupAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.pickupAddress)}`
      : null;
  const pdfUrl = `/api/contract?token=${encodeURIComponent(token)}&pdf=1`;
  const name = contract.signerName || contract.guestName;

  return (
    <div>
      {justSigned && (
        <div className="mb-5 rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-green-500">
            <CheckCircle className="h-5 w-5" /> {t.signedTitle}
          </p>
          <p className="mt-1 text-muted-foreground">{t.signedBody(contract.emailHint)}</p>
        </div>
      )}

      <h1 className="font-display text-2xl">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{name}</p>

      {finished && <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm">{t.finished}</p>}

      <section className="mt-5 rounded-xl border border-border p-4 text-sm">
        {v && (
          <p className="font-semibold">
            {v.name}
            {v.plate ? (
              <span className="font-normal text-muted-foreground"> · {v.plate}</span>
            ) : null}
          </p>
        )}
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="h-4 w-4" /> {t.pickup}
          </dt>
          <dd className="font-medium">
            {fmtDay(contract.startDate, lang)} · {contract.pickupTime}
          </dd>
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="h-4 w-4" /> {t.ret}
          </dt>
          <dd className="font-medium">
            {fmtDay(contract.endDate, lang)} · {contract.returnTime}
          </dd>
          {v?.pickupAddress && (
            <>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {v.city}
              </dt>
              <dd>
                {v.pickupAddress}
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block text-primary underline underline-offset-2"
                  >
                    {t.map}
                  </a>
                )}
                <span className="mt-0.5 block text-xs text-muted-foreground">{t.samePlace}</span>
              </dd>
            </>
          )}
          {contract.bookingRef && (
            <>
              <dt className="text-muted-foreground">{t.ref}</dt>
              <dd>
                {contract.bookingRef}
                {contract.source === "yescapa" ? " · Yescapa" : ""}
              </dd>
            </>
          )}
          {contract.priceTotal != null && (
            <>
              <dt className="text-muted-foreground">{t.price}</dt>
              <dd>{contract.priceTotal} €</dd>
            </>
          )}
        </dl>
      </section>

      <a
        href={pdfUrl}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        <Download className="h-4 w-4" /> {t.download}
      </a>
      {contract.signedAt && (
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          {t.signedOn(new Date(contract.signedAt).toLocaleDateString(LOCALE[lang]))}
        </p>
      )}
      <a
        href={`/condiciones?lang=${lang}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 text-sm text-primary underline underline-offset-2"
      >
        <FileText className="h-4 w-4" /> {t.conditions}
      </a>

      {!finished && (
        <section className="mt-6 text-sm">
          <h2 className="font-semibold">{t.bringTitle}</h2>
          <ul className="mt-2 space-y-1.5">
            {[
              t.bring.id,
              t.bring.licence,
              ...(contract.source === "yescapa" ? [] : [t.bring.card]),
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 text-sm">
        <h2 className="font-semibold">{t.phonesTitle}</h2>
        <div className="mt-2 space-y-2">
          <div className="rounded-xl border border-border p-3">
            <p className="text-muted-foreground">{t.us}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <a
                href={`tel:${WHATSAPP.replace(/\s/g, "")}`}
                className="flex items-center gap-1.5 font-semibold"
              >
                <Phone className="h-4 w-4" /> {WHATSAPP}
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-primary underline underline-offset-2"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t.usNote}</p>
          </div>
          {ins && (ins.company || ins.assistancePhone) && (
            <div className="rounded-xl border border-border p-3">
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="h-4 w-4" /> {t.insurance}
                {ins.company ? `: ${ins.company}` : ""}
              </p>
              {ins.policy && (
                <p className="mt-1">
                  {t.policy} {ins.policy}
                </p>
              )}
              {ins.assistancePhone && (
                <a
                  href={`tel:${ins.assistancePhone.replace(/\s/g, "")}`}
                  className="mt-1 flex items-center gap-1.5 font-semibold"
                >
                  <Phone className="h-4 w-4" /> {t.assistance}: {ins.assistancePhone}
                </a>
              )}
            </div>
          )}
          <div className="rounded-xl border border-border p-3">
            <a href="tel:112" className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-4 w-4 text-destructive" /> 112
            </a>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.emergency}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
