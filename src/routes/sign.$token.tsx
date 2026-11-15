import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Loader2 } from "lucide-react";

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

type Lang = "es" | "en" | "ru" | "uk";

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
      birthDate: "Date of birth",
      nationality: "Nationality",
      street: "Street and number",
      city: "City",
      postalCode: "Postal code",
      country: "Country",
      phone: "Phone",
      licenseNumber: "Driving licence number",
      licenseCountry: "Licence issued in (country)",
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
      dataProtection: "I have been informed about the processing of my personal data (clause 15).",
    },
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
      birthDate: "Fecha de nacimiento",
      nationality: "Nacionalidad",
      street: "Calle y número",
      city: "Ciudad",
      postalCode: "Código postal",
      country: "País",
      phone: "Teléfono",
      licenseNumber: "Número de permiso de conducir",
      licenseCountry: "Permiso expedido en (país)",
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
      dataProtection: "He sido informado del tratamiento de mis datos personales (apdo. 15).",
    },
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
      birthDate: "Дата рождения",
      nationality: "Гражданство",
      street: "Улица и дом",
      city: "Город",
      postalCode: "Индекс",
      country: "Страна",
      phone: "Телефон",
      licenseNumber: "Номер водительских прав",
      licenseCountry: "Страна выдачи прав",
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
      dataProtection: "Я ознакомлен(а) с обработкой персональных данных (п. 15).",
    },
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
      birthDate: "Дата народження",
      nationality: "Громадянство",
      street: "Вулиця і будинок",
      city: "Місто",
      postalCode: "Індекс",
      country: "Країна",
      phone: "Телефон",
      licenseNumber: "Номер водійського посвідчення",
      licenseCountry: "Країна видачі посвідчення",
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
      dataProtection: "Я ознайомлений(а) з обробкою персональних даних (п. 15).",
    },
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
};

const pickLang = (...candidates: (string | undefined)[]): Lang => {
  for (const c of candidates) if (c === "es" || c === "en" || c === "ru" || c === "uk") return c;
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

const BASE_FIELDS = [
  "fullName",
  "docNumber",
  "birthDate",
  "nationality",
  "street",
  "city",
  "postalCode",
  "country",
  "phone",
  "licenseNumber",
  "licenseCountry",
  "licenseExpiry",
] as const;
const DATE_FIELDS = new Set(["birthDate", "licenseExpiry"]);

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

  const t = TEXT[pickLang(search.lang, contract?.language)];

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
  const errText = (code?: string) => t.errors[code || ""] || t.errors.default;

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
    "dataProtection",
  ].every((k) => consents[k]);

  async function askCode() {
    setError(null);
    if (!filled) return setError(t.fillAll);
    if (!signature) return setError(t.needSignature);
    if (!allConsents) return setError(t.errors.consent_required);
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
        ...BASE_FIELDS,
        "docType",
        "extraDriverName",
        "extraDriverDoc",
        "extraDriverLicense",
      ]) {
        data[k] = (form[k] || "").trim();
      }
      await post({ action: "sign", code: code.trim(), data, consents, signature });
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
        <p className="text-sm">{contract.status === "signed" ? t.signedAlready : t.invalid}</p>
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
          {BASE_FIELDS.map((k) => (
            <label key={k} className="block text-sm">
              <span className="mb-1 block text-muted-foreground">{t.labels[k]}</span>
              <input
                className={inputCls}
                type={DATE_FIELDS.has(k) ? "date" : k === "phone" ? "tel" : "text"}
                value={form[k] || ""}
                onChange={(e) => set(k, e.target.value)}
                autoComplete="off"
              />
            </label>
          ))}
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
        <h2 className="font-semibold">{t.signHere}</h2>
        <div className="mt-2">
          <SignaturePad onChange={setSignature} clearLabel={t.clear} />
        </div>
      </section>

      <section className="mt-5 space-y-2 text-sm">
        {Object.entries(t.consents).map(([k, label]) => (
          <label key={k} className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={!!consents[k]}
              onChange={(e) => setConsents((c) => ({ ...c, [k]: e.target.checked }))}
            />
            <span>{label}</span>
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
