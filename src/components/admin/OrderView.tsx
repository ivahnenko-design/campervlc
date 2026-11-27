import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { EXTRA_LABELS } from "../../../shared/acta.js";

// One order = one page: the client, the contract at whatever stage it is, both
// handover reports and the booking itself, all reachable at any time.

type Api = (path: string, init?: RequestInit) => Promise<Response>;

export interface OrderRow {
  id: string;
  number?: string;
  status: string;
  guestName: string;
  email: string;
  phone: string;
  source: string;
  bookingRef: string;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  priceTotal: number | null;
  language: string;
  extras?: string[];
}
export interface OrderBooking {
  bookingRef: string;
  startDate: string;
  endDate: string;
  pickupTime: string | null;
  returnTime: string | null;
  nights: number;
  totalWithIva: number;
  depositAmount: number;
  remainingAmount: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  adults: number;
  children: number;
  extraIds: string[];
  message: string;
  paymentIntentId: string | null;
}
interface Detail {
  note: string;
  signed: null | { at: number; data: Record<string, string>; guestAt?: number | null };
  submission: null | { at: number; data: Record<string, string>; byStaff?: string | null };
  verification: null | { at: number; name: string; data: Record<string, string> };
  guestSignature: null | { at: number };
  staffDraft: Record<string, string> | null;
  audit: { t: number; ev: string; ip?: string; by?: string }[];
}
interface Acta {
  status: "draft" | "signed";
  datetime: string | null;
  odometerKm: number | null;
  fuel: number | null;
  marks: unknown[];
  photos: unknown[];
  notes: string;
  chargesText?: string;
}

const FUEL = ["пусто", "¼", "½", "¾", "полный"];
const SOURCE: Record<string, string> = { yescapa: "Yescapa", web: "Сайт", other: "Другое" };
const DOC_TYPE: Record<string, string> = {
  passport: "Паспорт",
  dni: "DNI",
  nie: "NIE / TIE",
  id_card: "ID-карта",
};
const FIELDS: [string, string][] = [
  ["fullName", "Имя и фамилия"],
  ["birthDate", "Дата рождения"],
  ["nationality", "Гражданство"],
  ["docNumber", "Номер документа"],
  ["docExpiry", "Документ до"],
  ["street", "Адрес"],
  ["city", "Город"],
  ["postalCode", "Индекс"],
  ["country", "Страна"],
  ["licenseNumber", "Права №"],
  ["licenseCountry", "Права выданы"],
  ["licenseIssued", "Права: дата выдачи"],
  ["licenseBSince", "Категория B с"],
  ["licenseExpiry", "Права до"],
  ["extraDriverName", "Второй водитель"],
  ["extraDriverDoc", "Его документ"],
  ["extraDriverLicense", "Его права"],
];
const DOC_SLOTS: [string, string][] = [
  ["idFront", "Документ"],
  ["idBack", "Оборот"],
  ["licenseFront", "Права"],
  ["licenseBack", "Права, оборот"],
];
const EVENT: Record<string, string> = {
  created: "Создан",
  link_reissued: "Новая ссылка клиенту",
  viewed: "Клиент открыл ссылку",
  contract_read: "Клиент прочитал договор",
  submitted: "Клиент отправил данные",
  resubmitted: "Клиент исправил данные",
  filled_by_staff: "Данные ввёл сотрудник",
  verified: "Данные сверены с оригиналами",
  unverified: "Сверка отменена",
  kiosk_opened: "Телефон передан клиенту",
  code_sent: "Отправлен код",
  code_wrong: "Неверный код",
  guest_signed: "Клиент подписал",
  signed_without_code: "Подпись без кода из письма",
  signed: "Подписан обеими сторонами",
  cancelled: "Отменён",
  docs_read: "Распознавание документов",
};

const card = "rounded-2xl border border-border p-4";
const primary =
  "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground";
const rowBtn =
  "flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-border px-4 text-left text-base";
const chip = "inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm";
const digits = (p: string) => p.replace(/[^\d]/g, "");
const day = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
const ts = (t: number) =>
  new Date(t).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
const wall = (v: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/.exec(v || "");
  return m ? `${m[3]}.${m[2]} ${m[4]}` : "";
};

function Stage({
  done,
  now,
  children,
}: {
  done: boolean;
  now?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${done ? "bg-emerald-600 text-white" : now ? "border-2 border-primary" : "border border-border"}`}
      >
        {done && <Check className="h-4 w-4" />}
      </span>
      <span className={done ? "" : now ? "font-semibold" : "text-muted-foreground"}>
        {children}
      </span>
    </li>
  );
}

function ActaCard({
  title,
  acta,
  locked,
  onOpen,
}: {
  title: string;
  acta: Acta | null;
  locked?: string;
  onOpen: () => void;
}) {
  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${acta?.status === "signed" ? "bg-emerald-500/15 text-emerald-500" : acta ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"}`}
        >
          {acta?.status === "signed" ? "Подписан" : acta ? "Черновик" : "Не заполнен"}
        </span>
      </div>
      {acta && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
          {acta.datetime && (
            <>
              <dt className="text-muted-foreground">Когда</dt>
              <dd>{wall(acta.datetime)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Пробег</dt>
          <dd>{acta.odometerKm != null ? `${acta.odometerKm.toLocaleString("ru-RU")} км` : "—"}</dd>
          <dt className="text-muted-foreground">Топливо</dt>
          <dd>{acta.fuel != null ? FUEL[acta.fuel] : "—"}</dd>
          <dt className="text-muted-foreground">Повреждения</dt>
          <dd>{acta.marks.length ? `${acta.marks.length} отм.` : "нет"}</dd>
          <dt className="text-muted-foreground">Фото</dt>
          <dd>{acta.photos.length || "нет"}</dd>
          {acta.notes && (
            <>
              <dt className="text-muted-foreground">Заметки</dt>
              <dd className="break-words">{acta.notes}</dd>
            </>
          )}
          {acta.chargesText && (
            <>
              <dt className="text-muted-foreground">Удержать</dt>
              <dd className="break-words">{acta.chargesText}</dd>
            </>
          )}
        </dl>
      )}
      <button className={`${rowBtn} mt-3`} onClick={onOpen}>
        <span>
          {acta?.status === "signed"
            ? "Открыть акт и PDF"
            : acta
              ? "Продолжить заполнение"
              : "Заполнить"}
        </span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
      {locked && <p className="mt-2 text-xs text-muted-foreground">{locked}</p>}
    </section>
  );
}

export function OrderView({
  api,
  actaApi,
  row,
  booking,
  vehicle,
  onBack,
  onWizard,
  onActa,
  onPdf,
  onReissue,
  onCancel,
  onCreateContract,
}: {
  api: Api;
  actaApi: Api;
  /** The contract of the order; null: a site booking without a contract yet. */
  row: OrderRow | null;
  booking: OrderBooking | null;
  vehicle: string;
  onBack: () => void;
  onWizard: () => void;
  onActa: (kind: "checkin" | "checkout") => void;
  onPdf: () => void;
  onReissue: () => void;
  onCancel: () => void;
  onCreateContract: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [actas, setActas] = useState<{ checkin: Acta | null; checkout: Acta | null } | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const urls = useRef<string[]>([]);
  const id = row?.id;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [d, a] = await Promise.all([api(`id=${id}&detail=1`), actaApi(`contractId=${id}`)]);
      if (!d.ok) return setFailed(true);
      setDetail(((await d.json()) as { contract: Detail }).contract);
      if (a.ok) {
        const j = (await a.json()) as { checkin: Acta | null; checkout: Acta | null };
        setActas({ checkin: j.checkin, checkout: j.checkout });
      } else setActas({ checkin: null, checkout: null });
      const found: Record<string, string> = {};
      await Promise.all(
        DOC_SLOTS.map(async ([slot]) => {
          const r = await api(`id=${id}&doc=${slot}`).catch(() => null);
          if (!r?.ok) return;
          const u = URL.createObjectURL(await r.blob());
          urls.current.push(u);
          found[slot] = u;
        }),
      );
      setPhotos(found);
    } catch {
      setFailed(true);
    }
  }, [api, actaApi, id]);
  useEffect(() => {
    void load();
    const made = urls.current;
    return () => made.forEach((u) => URL.revokeObjectURL(u));
  }, [load]);

  // Always open from the top (the list may have been scrolled).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const name = row?.guestName || booking?.guestName || "—";
  const phone = row?.phone || booking?.guestPhone || "";
  const email = row?.email || booking?.guestEmail || "";
  const start = row?.startDate || booking?.startDate || "";
  const end = row?.endDate || booking?.endDate || "";
  const status = row?.status || "none";
  const unsigned = ["pending", "submitted", "verified", "guest_signed"].includes(status);
  const data =
    detail?.signed?.data ||
    detail?.verification?.data ||
    detail?.staffDraft ||
    detail?.submission?.data ||
    null;
  const hasData = !!data && !!(data.docNumber || "").trim();
  const extras = (row?.extras?.length ? row.extras : booking?.extraIds || []).filter(
    (x) => x !== "cleaning_fee",
  );
  const checkinReady =
    !!actas?.checkin && actas.checkin.odometerKm != null && actas.checkin.fuel != null;
  const verified = ["verified", "guest_signed", "signed"].includes(status);
  const guestSigned = status === "guest_signed" || status === "signed";
  // The first stage that is not done yet.
  const stages = [
    Object.keys(photos).length >= 3,
    verified,
    checkinReady,
    guestSigned,
    status === "signed",
  ];
  const next = stages.indexOf(false);

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-background pb-16 text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          aria-label="Назад к заказам"
          onClick={onBack}
          className="rounded-full border border-border p-2.5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{name}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {day(start)} {row?.pickupTime || booking?.pickupTime || ""} → {day(end)}{" "}
            {row?.returnTime || booking?.returnTime || ""}
            {vehicle ? ` · ${vehicle}` : ""}
          </p>
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
        {/* ── the one thing to do next ── */}
        {!row && status === "none" && (
          <button className={primary} onClick={onCreateContract}>
            Создать договор →
          </button>
        )}
        {unsigned && (
          <button className={primary} onClick={onWizard}>
            {status === "guest_signed"
              ? "Поставить мою подпись →"
              : next > 0
                ? "Продолжить оформление выдачи →"
                : "Оформить выдачу →"}
          </button>
        )}
        {status === "signed" && actas && actas.checkout?.status !== "signed" && (
          <button className={primary} onClick={() => onActa("checkout")}>
            {actas.checkout ? "Продолжить возврат →" : "Оформить возврат →"}
          </button>
        )}
        {status === "signed" && actas?.checkout?.status === "signed" && (
          <p className="rounded-xl border border-emerald-600/40 bg-emerald-600/10 px-4 py-3 text-sm">
            Аренда завершена: договор и возврат подписаны.
          </p>
        )}
        {status === "cancelled" && (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm">Договор отменён.</p>
        )}
        {failed && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Не удалось загрузить заказ. Проверьте связь и откройте его ещё раз.
          </p>
        )}

        {/* ── client ── */}
        <section className={card}>
          <h2 className="font-semibold">Клиент</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {phone && (
              <>
                <a className={chip} href={`tel:${phone.replace(/\s/g, "")}`}>
                  <Phone className="h-4 w-4" /> {phone}
                </a>
                <a
                  className={chip}
                  href={`https://wa.me/${digits(phone)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </>
            )}
            {email && (
              <a className={`${chip} max-w-full`} href={`mailto:${email}`}>
                <Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{email}</span>
              </a>
            )}
          </div>
          {row && !detail && !failed && <Loader2 className="mt-3 h-5 w-5 animate-spin" />}
          {row && detail && (
            <>
              {hasData && data ? (
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
                  <dt className="text-muted-foreground">Документ</dt>
                  <dd>{DOC_TYPE[data.docType] || data.docType || "—"}</dd>
                  {FIELDS.filter(([k]) => (data[k] || "").trim()).map(([k, label]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="break-words">{data[k]}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Данные документов ещё не введены.
                </p>
              )}
              {hasData && !verified && (
                <p className="mt-2 text-xs text-amber-500">
                  Черновик: ещё не сверено с оригиналами.
                </p>
              )}
              {Object.keys(photos).length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {DOC_SLOTS.filter(([slot]) => photos[slot]).map(([slot, label]) => (
                    <a
                      key={slot}
                      href={photos[slot]}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={photos[slot]}
                        alt={label}
                        className="h-16 w-full rounded-lg border border-border object-cover"
                      />
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {label}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── contract ── */}
        {row && status !== "cancelled" && (
          <section className={card}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Договор</h2>
              {row.number && row.number !== row.id && (
                <span className="font-mono text-xs text-muted-foreground">№ {row.number}</span>
              )}
            </div>
            <ol className="mt-3 space-y-2 text-sm">
              <Stage done={stages[0]} now={next === 0}>
                Фото документов
              </Stage>
              <Stage done={stages[1]} now={next === 1}>
                Данные сверены с оригиналами
                {detail?.verification ? ` · ${ts(detail.verification.at)}` : ""}
              </Stage>
              <Stage done={stages[2]} now={next === 2}>
                Акт выдачи: пробег и топливо
              </Stage>
              <Stage done={stages[3]} now={next === 3}>
                Подпись клиента
                {detail?.guestSignature
                  ? ` · ${ts(detail.guestSignature.at)}`
                  : detail?.signed?.guestAt
                    ? ` · ${ts(detail.signed.guestAt)}`
                    : ""}
              </Stage>
              <Stage done={stages[4]} now={next === 4}>
                Ваша подпись{detail?.signed ? ` · ${ts(detail.signed.at)}` : ""}
              </Stage>
            </ol>
            {status === "signed" ? (
              <button className={`${rowBtn} mt-3`} onClick={onPdf}>
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Открыть договор (PDF)
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ) : (
              <button className={`${rowBtn} mt-3`} onClick={onWizard}>
                <span>Открыть оформление договора</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            {(status === "pending" || status === "submitted") && (
              <button className={`${rowBtn} mt-2`} onClick={onReissue}>
                <span>Отправить клиенту ссылку ещё раз</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </section>
        )}

        {/* ── handover reports ── */}
        {row && status !== "cancelled" && actas && (
          <>
            <ActaCard
              title="Акт выдачи"
              acta={actas.checkin}
              locked={unsigned ? "Подписывается вместе с договором (стр. 14)." : undefined}
              onOpen={() => onActa("checkin")}
            />
            <ActaCard
              title="Акт возврата"
              acta={actas.checkout}
              locked={
                status === "signed" ? "После подписи попадает на стр. 15 договора." : undefined
              }
              onOpen={() => onActa("checkout")}
            />
          </>
        )}

        {/* ── the booking itself ── */}
        <section className={card}>
          <h2 className="font-semibold">Заказ</h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
            <dt className="text-muted-foreground">Выдача</dt>
            <dd>
              {day(start)} {row?.pickupTime || booking?.pickupTime || ""}
            </dd>
            <dt className="text-muted-foreground">Возврат</dt>
            <dd>
              {day(end)} {row?.returnTime || booking?.returnTime || ""}
            </dd>
            {vehicle && (
              <>
                <dt className="text-muted-foreground">Автодом</dt>
                <dd>{vehicle}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Источник</dt>
            <dd>
              {row ? SOURCE[row.source] || row.source : "Сайт"}
              {row?.bookingRef || booking?.bookingRef
                ? ` · ${row?.bookingRef || booking?.bookingRef}`
                : ""}
            </dd>
            {(row?.priceTotal != null || booking) && (
              <>
                <dt className="text-muted-foreground">Сумма</dt>
                <dd>{row?.priceTotal ?? booking?.totalWithIva} €</dd>
              </>
            )}
            {booking && (
              <>
                <dt className="text-muted-foreground">Оплата</dt>
                <dd>
                  {booking.remainingAmount <= 0
                    ? "оплачено полностью"
                    : `предоплата ${booking.depositAmount} €, остаток ${booking.remainingAmount} € при выдаче`}
                </dd>
                <dt className="text-muted-foreground">Гости</dt>
                <dd>
                  {booking.adults} взр.{booking.children ? ` + ${booking.children} дет.` : ""}
                </dd>
              </>
            )}
            {extras.length > 0 && (
              <>
                <dt className="text-muted-foreground">Опции</dt>
                <dd>
                  {extras
                    .map((x) => (EXTRA_LABELS as Record<string, { ru: string }>)[x]?.ru || x)
                    .join(", ")}
                </dd>
              </>
            )}
            {row && (
              <>
                <dt className="text-muted-foreground">Язык</dt>
                <dd>{row.language.toUpperCase()}</dd>
              </>
            )}
            {detail?.note && (
              <>
                <dt className="text-muted-foreground">Заметка</dt>
                <dd className="break-words">{detail.note}</dd>
              </>
            )}
          </dl>
          {booking?.message && (
            <p className="mt-2 text-sm italic text-muted-foreground">«{booking.message}»</p>
          )}
          {booking?.paymentIntentId && (
            <a
              className={`${chip} mt-3`}
              href={`https://dashboard.stripe.com/payments/${booking.paymentIntentId}`}
              target="_blank"
              rel="noreferrer"
            >
              Платёж в Stripe
            </a>
          )}
        </section>

        {detail && detail.audit.length > 0 && (
          <details className={card}>
            <summary className="cursor-pointer font-semibold">История</summary>
            <ol className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              {detail.audit.map((a, i) => (
                <li key={i}>
                  {ts(a.t)} · {EVENT[a.ev] || a.ev}
                </li>
              ))}
            </ol>
          </details>
        )}

        {unsigned && (
          <button
            className="w-full py-2 text-center text-sm text-muted-foreground underline"
            onClick={onCancel}
          >
            Отменить договор
          </button>
        )}
      </div>
    </main>
  );
}
