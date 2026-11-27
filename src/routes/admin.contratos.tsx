import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ActaEditor } from "@/components/admin/ActaEditor";
import { DocPhotos, OwnerSignature } from "@/components/admin/OwnerSignature";
import { HandoverWizard } from "@/components/admin/HandoverWizard";
import { OrderView } from "@/components/admin/OrderView";
import {
  formFromParsed,
  GmailSetup,
  ImportsPanel,
  missingFields,
  YescapaPaste,
  type ImportDraft,
  type Parsed,
} from "@/components/admin/YescapaImport";
import { LoginDialog } from "@/components/LoginDialog";
import { loadAuth, logout as logoutAccount, openLogin, useAuth } from "@/lib/auth";
import { vehicleByPlate } from "../../shared/vehicles.js";
import {
  Check,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { EXTRA_LABELS } from "../../shared/acta.js";

export const Route = createFileRoute("/admin/contratos")({
  head: () => ({
    meta: [
      { title: "Админка | Camper Retreat VLC" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

// ── types ───────────────────────────────────────────────────────────────────

type Status = "pending" | "submitted" | "verified" | "guest_signed" | "signed" | "cancelled";
/** Not signed by both yet: the pickup wizard is the main action. */
const OPEN_FLOW: Status[] = ["pending", "submitted", "verified", "guest_signed"];

interface Row {
  id: string;
  extras?: string[];
  number?: string;
  vehicleId: string;
  status: Status;
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
  createdAt: number;
  viewedAt: number | null;
  signedAt: number | null;
  submittedAt?: number | null;
  verifiedAt?: number | null;
  guestSignedAt?: number | null;
  language: string;
}

interface Detail extends Row {
  note: string;
  expiresAt: number;
  signed: null | {
    at: number;
    ip: string;
    userAgent: string;
    data: Record<string, string>;
    docs?: string[];
  };
  audit: { t: number; ev: string; ip?: string }[];
}

interface Booking {
  id: string;
  vehicleId: string;
  bookingRef: string;
  status: string;
  startDate: string;
  endDate: string;
  pickupTime: string | null;
  returnTime: string | null;
  nights: number;
  totalWithIva: number;
  depositAmount: number;
  remainingAmount: number;
  prepaymentOption: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  adults: number;
  children: number;
  extraIds: string[];
  message: string;
  paymentIntentId: string | null;
}

type Form = typeof EMPTY & { vehicleId?: string };

/** What the server says about the logged-in staff member (GET ?view=me). */
interface Me {
  role: "owner" | "manager";
  email: string | null;
  via: "token" | "session";
  vehicles: { id: string; name: string; city: string; plate: string; label: string }[];
  multiVehicle: boolean;
  staff: null | {
    admins: string[];
    managers: { email: string; vehicleIds: string[] }[];
    token: boolean;
  };
  ownerSignature?: boolean | null;
  ownerSignerName?: string | null;
}
interface Feed {
  id: string;
  label: string;
  city: string;
  url: string | null;
}

// ── helpers ─────────────────────────────────────────────────────────────────

const TOKEN_KEY = "campervlcAdminToken";
const EMPTY = {
  guestName: "",
  email: "",
  phone: "",
  source: "yescapa",
  language: "es",
  startDate: "",
  endDate: "",
  pickupTime: "10:00",
  returnTime: "10:00",
  priceTotal: "",
  bookingRef: "",
  /** km_200 / km_unlimited (mileage plan; none = 100 km/day) and booked options. */
  extras: [] as string[],
};

const OPTION_KEYS = [
  "bedding",
  "towels",
  "bicycle",
  "sup_board",
  "bbq",
  "festival",
  "extra_driver",
  "pet",
];

const STATUS_LABEL: Record<Status, string> = {
  pending: "Не оформлен",
  submitted: "Данные от клиента",
  verified: "Идёт выдача",
  guest_signed: "Ждёт вашей подписи",
  signed: "Подписан",
  cancelled: "Отменён",
};
const STATUS_CLS: Record<Status, string> = {
  pending: "bg-amber-500/15 text-amber-500",
  submitted: "bg-sky-500/15 text-sky-600",
  verified: "bg-sky-500/15 text-sky-600",
  guest_signed: "bg-violet-500/15 text-violet-600",
  signed: "bg-emerald-500/15 text-emerald-500",
  cancelled: "bg-muted text-muted-foreground",
};
const SOURCE_LABEL: Record<string, string> = { yescapa: "Yescapa", web: "Сайт", other: "Другое" };
const EVENT_LABEL: Record<string, string> = {
  created: "Создан",
  link_reissued: "Новая ссылка",
  viewed: "Клиент открыл ссылку",
  code_sent: "Отправлен код",
  code_wrong: "Неверный код",
  signed: "Подписан обеими сторонами",
  cancelled: "Отменён",
  submitted: "Клиент отправил данные",
  resubmitted: "Клиент исправил данные",
  contract_read: "Клиент прочитал договор",
  verified: "Данные сверены с оригиналами",
  unverified: "Сверка отменена",
  kiosk_opened: "Открыта подпись на устройстве",
  guest_signed: "Клиент подписал",
  docs_read: "Распознавание документов",
};
const FIELD_LABEL: Record<string, string> = {
  fullName: "Имя",
  docType: "Тип документа",
  docNumber: "Документ",
  birthDate: "Дата рождения",
  nationality: "Гражданство",
  street: "Адрес",
  city: "Город",
  postalCode: "Индекс",
  country: "Страна",
  phone: "Телефон",
  licenseNumber: "Права №",
  licenseCountry: "Права выданы",
  licenseIssued: "Права выданы (дата)",
  licenseBSince: "Категория B с",
  licenseExpiry: "Права до",
  extraDriverName: "Доп. водитель",
  extraDriverDoc: "Документ доп. водителя",
  extraDriverLicense: "Права доп. водителя",
};

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary sm:text-sm";
const btn =
  "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted";
const bigBtn =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground";
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60";

const dayFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  weekday: "short",
  timeZone: "UTC",
});
const fmtDay = (iso: string) => (iso ? dayFmt.format(new Date(`${iso}T00:00:00Z`)) : "—");
const fmtTs = (ms: number | null) =>
  ms
    ? new Date(ms).toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const nights = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const todayIso = () => new Date().toISOString().slice(0, 10);
const digits = (s: string) => s.replace(/\D/g, "");

const WA_TEXT: Record<string, (name: string, link: string) => string> = {
  es: (n, l) =>
    `Hola ${n}, aquí tienes el contrato de alquiler: léelo y envía tus datos y fotos de tus documentos antes de la recogida (5 min). Lo firmamos juntos en la recogida: ${l}`,
  en: (n, l) =>
    `Hello ${n}, here is your rental contract: please read it and send your details and photos of your documents before pickup (5 min). We sign it together at pickup: ${l}`,
  ru: (n, l) =>
    `Здравствуйте, ${n}! Договор аренды: прочитайте его и отправьте свои данные и фото документов до получения (5 минут). Подпишем вместе при выдаче: ${l}`,
  uk: (n, l) =>
    `Вітаємо, ${n}! Договір оренди: прочитайте його та надішліть свої дані й фото документів до отримання (5 хвилин). Підпишемо разом під час видачі: ${l}`,
};
const waLink = (phone: string, lang: string, name: string, link: string) =>
  `https://wa.me/${digits(phone)}?text=${encodeURIComponent((WA_TEXT[lang] || WA_TEXT.en)(name.split(" ")[0], link))}`;

// ── small components ────────────────────────────────────────────────────────

function Badge({ status }: { status: Status }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function LinkBox({
  link,
  phone,
  lang,
  name,
  onClose,
}: {
  link: string;
  phone: string;
  lang: string;
  name: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">Ссылка для подписи</p>
        <button onClick={onClose} aria-label="Закрыть" className="text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 break-all text-xs text-muted-foreground">{link}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          className={btn}
          onClick={() => {
            void navigator.clipboard.writeText(link).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{" "}
          {copied ? "Скопировано" : "Копировать"}
        </button>
        <a className={btn} href={waLink(phone, lang, name, link)} target="_blank" rel="noreferrer">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Ссылку видно только сейчас: в системе хранится лишь её отпечаток. Потом можно выпустить
        новую.
      </p>
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────────────────

function Admin() {
  // Login: the site account (email code / Google / passkey) of a staff member;
  // the old shared ADMIN_TOKEN still works as a fallback for the owner.
  const auth = useAuth();
  const [token, setToken] = useState("");
  const [phase, setPhase] = useState<"checking" | "login" | "noaccess" | "ready">("checking");
  const [me, setMe] = useState<Me | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [remember, setRemember] = useState(true);
  const [tab, setTab] = useState<"contracts" | "bookings">("contracts");
  const [rows, setRows] = useState<Row[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [newLink, setNewLink] = useState<{
    id: string;
    link: string;
    phone: string;
    lang: string;
    name: string;
  } | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [bFilter, setBFilter] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [open, setOpen] = useState<Record<string, Detail | "loading">>({});
  // Private bookings feed for Yescapa / a calendar app (secret key in the URL).
  const [feeds, setFeeds] = useState<Feed[]>([]);
  // Yescapa: screenshot/text import box, email drafts and the Gmail forwarder setup.
  const [showYescapa, setShowYescapa] = useState(false);
  const [imports, setImports] = useState<ImportDraft[]>([]);
  const [importSetup, setImportSetup] = useState<{ key: string; script: string } | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  // Handover reports: "<contractId>-<kind>" -> draft | signed, and the one open full-screen.
  const [actaStatus, setActaStatus] = useState<Record<string, "draft" | "signed">>({});
  // The open order page: a contract id, or "b:<booking id>" for a booking without a contract.
  const [order, setOrder] = useState<string | null>(null);
  // The pickup wizard (full screen) of one contract.
  const [wizard, setWizard] = useState<string | null>(null);
  const [actaOpen, setActaOpen] = useState<{
    contractId: string;
    kind: "checkin" | "checkout";
  } | null>(null);

  const storedToken = () => {
    try {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return ""; /* storage blocked */
    }
  };
  const forgetToken = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  };

  // Every admin call: ?scope=admin + the session cookie (same origin), and the
  // legacy token header only when one is saved on this device.
  const api = useCallback(
    (path: string, init: RequestInit = {}) =>
      fetch(`/api/contract?scope=admin${path ? `&${path}` : ""}`, {
        ...init,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
          ...(init.headers || {}),
        },
      }),
    [token],
  );

  // Same credentials, ?scope=acta (handover reports).
  const actaApi = useCallback(
    (path: string, init: RequestInit = {}) =>
      fetch(`/api/contract?scope=acta${path ? `&${path}` : ""}`, {
        ...init,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
          ...(init.headers || {}),
        },
      }),
    [token],
  );

  const loadActas = useCallback(async () => {
    try {
      const r = await actaApi("view=summary");
      if (!r.ok) return;
      const j = (await r.json()) as {
        actas: { contractId: string; kind: string; status: "draft" | "signed" }[];
      };
      setActaStatus(
        Object.fromEntries(j.actas.map((a) => [`${a.contractId}-${a.kind}`, a.status])),
      );
    } catch {
      /* the list works without it */
    }
  }, [actaApi]);

  useEffect(() => {
    void loadAuth();
    setToken(storedToken());
  }, []);

  /** Who am I for the admin: staff role and campers, or the login / no-access screen. */
  const checkAccess = useCallback(async () => {
    try {
      const r = await api("view=me");
      if (r.status === 503) {
        setPhase("login");
        return setNotice({
          kind: "err",
          text: "Доступ в админку не настроен: задайте ADMIN_EMAILS (или ADMIN_TOKEN) в Vercel.",
        });
      }
      if (r.status === 401) {
        if (token) {
          forgetToken();
          setToken("");
          setNotice({
            kind: "err",
            text: "Сохранённый токен не подошёл. Войдите через аккаунт сайта.",
          });
          return;
        }
        setPhase(auth.user ? "noaccess" : "login");
        return;
      }
      if (!r.ok) throw new Error();
      setMe((await r.json()) as Me);
      setPhase("ready");
    } catch {
      setPhase("login");
      setNotice({ kind: "err", text: "Не удалось связаться с сервером. Обновите страницу." });
    }
  }, [api, token, auth.user]);

  // Re-check when the session or the saved token changes (e.g. right after logging in).
  useEffect(() => {
    if (!auth.loaded) return;
    void checkAccess();
  }, [auth.loaded, auth.user, token, checkAccess]);

  const logout = useCallback(() => {
    forgetToken();
    setToken("");
    setMe(null);
    setPhase("login");
    setRows([]);
    setBookings([]);
    setImports([]);
    setFeeds([]);
    if (auth.user) void logoutAccount().catch(() => {});
  }, [auth.user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, b, cal, imp] = await Promise.all([
        api(""),
        api("view=bookings"),
        me?.role === "owner" ? api("view=calendar") : Promise.resolve(null),
        api("view=imports"),
      ]);
      if (c.status === 401) {
        setPhase("login");
        setNotice({ kind: "err", text: "Сессия закончилась, войдите снова." });
        return;
      }
      if (!c.ok) throw new Error();
      setRows(((await c.json()) as { contracts: Row[] }).contracts);
      void loadActas();
      if (b.ok) setBookings(((await b.json()) as { bookings: Booking[] }).bookings);
      if (cal?.ok) setFeeds(((await cal.json()) as { feeds?: Feed[] }).feeds || []);
      if (imp.ok) {
        const j = (await imp.json()) as {
          imports: ImportDraft[];
          setup: { key: string; script: string } | null;
        };
        setImports(j.imports || []);
        setImportSetup(j.setup);
      }
    } catch {
      setNotice({
        kind: "err",
        text: "Не удалось загрузить данные. Проверьте соединение и обновите.",
      });
    } finally {
      setLoading(false);
    }
  }, [api, me, loadActas]);

  useEffect(() => {
    if (phase === "ready") void load();
  }, [phase, load]);

  // Back from the guest's signature on this device (/admin/contratos?id=…): open that contract.
  const openedFromLink = useRef(false);
  useEffect(() => {
    if (openedFromLink.current || !rows.length) return;
    const id = new URLSearchParams(window.location.search).get("id");
    openedFromLink.current = true;
    const row = id ? rows.find((r) => r.id === id) : null;
    if (!id || !row) return;
    // Back from the guest's signature: straight to the lessor's signature.
    setOrder(id);
    if (row.status === "guest_signed") setWizard(id);
  }, [rows]);

  function loginWithToken(e: React.FormEvent) {
    e.preventDefault();
    const value = (e.currentTarget as HTMLFormElement).querySelector("input")?.value.trim() || "";
    if (!value) return;
    try {
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, value);
    } catch {
      /* ignore */
    }
    setNotice(null);
    setToken(value);
  }

  // ── campers ──
  const myVehicles = me?.vehicles || [];
  const showVehicle = !!me?.multiVehicle; // labels and the select only with several campers
  const vehicleName = (id: string) => myVehicles.find((v) => v.id === id)?.label || id;
  const defaultVehicleId = myVehicles[0]?.id;

  // ── contracts ──
  const counts = useMemo(() => {
    const c = {
      all: rows.length,
      pending: 0,
      submitted: 0,
      verified: 0,
      guest_signed: 0,
      signed: 0,
      cancelled: 0,
    };
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => filter === "all" || r.status === filter)
      .filter(
        (r) =>
          !q ||
          [r.guestName, r.email, r.bookingRef, r.phone, r.number].some((v) =>
            (v || "").toLowerCase().includes(q),
          ),
      )
      .sort((a, b) => {
        // Unsigned first (closest pickup first), then the rest by date.
        const open = (s: Status) => s !== "signed" && s !== "cancelled";
        if (open(a.status) !== open(b.status)) return open(a.status) ? -1 : 1;
        return a.startDate < b.startDate ? -1 : 1;
      });
  }, [rows, filter, query]);

  const formError = useMemo(() => {
    if (!form.guestName.trim()) return "Укажите имя клиента";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return "Укажите e-mail клиента";
    if (!form.startDate || !form.endDate) return "Укажите даты";
    if (form.endDate <= form.startDate) return "Дата возврата должна быть позже выдачи";
    return null;
  }, [form]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (formError) return setNotice({ kind: "err", text: formError });
    setBusy(true);
    setNotice(null);
    try {
      const r = await api("", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          ...form,
          vehicleId: form.vehicleId || defaultVehicleId,
          ...(importId ? { importId } : {}),
        }),
      });
      const j = (await r.json()) as {
        id?: string;
        link?: string;
        emailSent?: boolean;
        error?: string;
      };
      if (r.status === 403) throw new Error("Нет доступа к этому автодому.");
      if (!r.ok || !j.link || !j.id) throw new Error(j.error || "Ошибка");
      setNewLink({
        id: j.id,
        link: j.link,
        phone: form.phone,
        lang: form.language,
        name: form.guestName,
      });
      setNotice({
        kind: j.emailSent ? "ok" : "err",
        text: j.emailSent
          ? "Договор создан, письмо клиенту отправлено."
          : "Договор создан, но письмо НЕ отправилось. Отправьте ссылку в WhatsApp.",
      });
      setForm(EMPTY);
      setShowForm(false);
      setImportId(null);
      await load();
    } catch (err) {
      setNotice({ kind: "err", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function applyParsed(p: Parsed, fromImport: string | null, draftVehicleId?: string | null) {
    // The camper: from the email draft, else by the plate Yescapa shows ("Vehículo 1022MPG").
    const byPlate = p.plate ? vehicleByPlate(p.plate)?.id : undefined;
    const wanted = draftVehicleId || byPlate;
    const mine = wanted && myVehicles.some((v) => v.id === wanted) ? wanted : defaultVehicleId;
    setForm({ ...formFromParsed(p), vehicleId: mine });
    setImportId(fromImport);
    setShowYescapa(false);
    setTab("contracts");
    setShowForm(true);
    const miss = missingFields(p);
    if (p.plate && wanted !== mine) {
      setNotice({
        kind: "err",
        text: `Номер ${p.plate} не совпадает с вашими автодомами. Проверьте автодом в форме.`,
      });
      return;
    }
    setNotice(
      miss.length
        ? {
            kind: "err",
            text: `Проверьте форму: не нашёл ${miss.join(", ")}. Остальное заполнено.`,
          }
        : {
            kind: "ok",
            text: "Форма заполнена из брони Yescapa. Проверьте данные и создайте договор.",
          },
    );
  }

  async function dismissImport(d: ImportDraft) {
    await api("", {
      method: "POST",
      body: JSON.stringify({ action: "import_dismiss", importId: d.id }),
    });
    setImports((xs) => xs.filter((x) => x.id !== d.id));
  }

  async function reissue(r: Row) {
    const res = await api("", {
      method: "POST",
      body: JSON.stringify({ action: "resend", id: r.id }),
    });
    const j = (await res.json()) as { link?: string; emailSent?: boolean; error?: string };
    if (!res.ok || !j.link) return setNotice({ kind: "err", text: j.error || "Ошибка" });
    setNewLink({ id: r.id, link: j.link, phone: r.phone, lang: r.language, name: r.guestName });
    setNotice({
      kind: "ok",
      text: j.emailSent
        ? "Новая ссылка отправлена на e-mail клиента. Старая больше не работает."
        : "Новая ссылка создана, письмо не отправилось.",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    await load();
  }

  async function cancel(r: Row) {
    if (!window.confirm(`Отменить договор для ${r.guestName}? Ссылка перестанет работать.`)) return;
    const res = await api("", {
      method: "POST",
      body: JSON.stringify({ action: "cancel", id: r.id }),
    });
    if (!res.ok) return setNotice({ kind: "err", text: "Не удалось отменить." });
    setNotice({ kind: "ok", text: "Договор отменён." });
    await load();
  }

  async function toggleDetail(id: string) {
    if (open[id]) {
      setOpen(({ [id]: _, ...rest }) => rest);
      return;
    }
    setOpen((o) => ({ ...o, [id]: "loading" }));
    const res = await api(`id=${id}&detail=1`);
    if (!res.ok) {
      setOpen(({ [id]: _, ...rest }) => rest);
      return setNotice({ kind: "err", text: "Не удалось открыть детали." });
    }
    const j = (await res.json()) as { contract: Detail };
    setOpen((o) => ({ ...o, [id]: j.contract }));
  }

  /** After a step of the in-person signing: the row and its open panel again. */
  async function refreshDetail(id: string) {
    const res = await api(`id=${id}&detail=1`);
    if (res.ok) {
      const j = (await res.json()) as { contract: Detail };
      setOpen((o) => ({ ...o, [id]: j.contract }));
    }
    await load();
  }

  async function pdf(id: string) {
    const win = window.open("", "_blank");
    const res = await api(`id=${id}&pdf=1`);
    if (!res.ok) {
      win?.close();
      return setNotice({ kind: "err", text: "PDF не найден." });
    }
    const url = URL.createObjectURL(await res.blob());
    if (win) win.location.href = url;
    else window.location.href = url;
  }

  // ── bookings ──
  const contractFor = useCallback(
    (b: Booking) =>
      rows.find(
        (r) =>
          r.status !== "cancelled" &&
          r.vehicleId === b.vehicleId &&
          ((b.bookingRef && r.bookingRef === b.bookingRef) ||
            (r.email === b.guestEmail.toLowerCase() && r.startDate === b.startDate)),
      ),
    [rows],
  );

  const visibleBookings = useMemo(() => {
    const today = todayIso();
    return bookings.filter((b) =>
      bFilter === "cancelled"
        ? b.status === "cancelled"
        : b.status !== "cancelled" &&
          (bFilter === "upcoming" ? b.endDate >= today : b.endDate < today),
    );
  }, [bookings, bFilter]);

  function contractFromBooking(b: Booking) {
    setForm({
      guestName: b.guestName,
      email: b.guestEmail,
      phone: b.guestPhone,
      source: "web",
      language: "en",
      startDate: b.startDate,
      endDate: b.endDate,
      pickupTime: b.pickupTime || "10:00",
      returnTime: b.returnTime || "10:00",
      priceTotal: String(b.totalWithIva ?? ""),
      bookingRef: b.bookingRef,
      vehicleId: b.vehicleId,
      extras: (b.extraIds || []).filter((x) => x !== "cleaning_fee"),
    });
    setTab("contracts");
    setShowForm(true);
    setNotice({
      kind: "ok",
      text: "Данные брони подставлены. Проверьте язык клиента и нажмите «Создать».",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── orders: every contract + every site booking that has no contract yet ──
  const orders = useMemo(() => {
    const today = todayIso();
    const q = query.trim().toLowerCase();
    type Order = {
      key: string;
      row: Row | null;
      booking: Booking | null;
      name: string;
      start: string;
      end: string;
      vehicleId: string;
      badge: string;
      badgeCls: string;
      hint: string;
      todo: boolean;
      cancelled: boolean;
      search: string;
    };
    const list: Order[] = [];
    const used = new Set<string>();
    for (const r of rows) {
      const b =
        bookings.find((x) => x.status !== "cancelled" && contractFor(x)?.id === r.id) || null;
      if (b) used.add(b.id);
      const returned = actaStatus[`${r.id}-checkout`] === "signed";
      const hint =
        r.status === "signed"
          ? returned
            ? "Возврат оформлен"
            : r.endDate <= today
              ? "Нужно оформить возврат"
              : "Договор подписан"
          : r.status === "guest_signed"
            ? "Клиент подписал — нужна ваша подпись"
            : r.status === "verified"
              ? "Выдача начата — продолжить"
              : r.status === "submitted"
                ? "Клиент прислал данные — оформить при выдаче"
                : r.status === "pending"
                  ? r.startDate <= today
                    ? "Нужно оформить договор"
                    : "Ждём данные от клиента"
                  : "";
      list.push({
        key: r.id,
        row: r,
        booking: b,
        name: r.guestName,
        start: r.startDate,
        end: r.endDate,
        vehicleId: r.vehicleId,
        badge: returned ? "Завершён" : STATUS_LABEL[r.status],
        badgeCls: returned ? "bg-muted text-muted-foreground" : STATUS_CLS[r.status],
        hint,
        todo:
          r.status !== "cancelled" &&
          (r.status !== "signed" ? r.startDate <= today : !returned && r.endDate <= today),
        cancelled: r.status === "cancelled",
        search: [r.guestName, r.email, r.bookingRef, r.phone, r.number].join(" ").toLowerCase(),
      });
    }
    for (const b of bookings) {
      if (used.has(b.id) || contractFor(b)) continue;
      list.push({
        key: `b:${b.id}`,
        row: null,
        booking: b,
        name: b.guestName || "—",
        start: b.startDate,
        end: b.endDate,
        vehicleId: b.vehicleId,
        badge: "Нет договора",
        badgeCls: "bg-amber-500/15 text-amber-500",
        hint: `Бронь сайта ${b.bookingRef} · создать договор`,
        todo: true,
        cancelled: b.status === "cancelled",
        search: [b.guestName, b.guestEmail, b.bookingRef, b.guestPhone].join(" ").toLowerCase(),
      });
    }
    const shown = list.filter((o) => !q || o.search.includes(q));
    const live = shown.filter((o) => !o.cancelled);
    // Newest date first inside each group, so the page reads as one timeline.
    const desc = (a: Order, b: Order) => (a.start < b.start ? 1 : -1);
    return {
      all: list,
      future: live.filter((o) => o.start > today).sort(desc),
      current: live.filter((o) => o.start <= today && o.end >= today).sort(desc),
      past: live.filter((o) => o.end < today).sort(desc),
      cancelled: shown.filter((o) => o.cancelled).sort(desc),
    };
  }, [rows, bookings, contractFor, actaStatus, query]);

  // ── upcoming handovers (next 14 days) ──
  const upcoming = useMemo(() => {
    const today = todayIso();
    const limit = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
    const items: {
      date: string;
      time: string;
      kind: "Выдача" | "Возврат";
      name: string;
      signed: boolean | null;
    }[] = [];
    const add = (
      date: string,
      time: string,
      kind: "Выдача" | "Возврат",
      name: string,
      signed: boolean | null,
    ) => {
      if (date >= today && date <= limit) items.push({ date, time, kind, name, signed });
    };
    // With several campers, say which one (its city).
    const where = (id: string) =>
      showVehicle ? ` · ${myVehicles.find((v) => v.id === id)?.city || id}` : "";
    for (const r of rows) {
      if (r.status === "cancelled") continue;
      add(
        r.startDate,
        r.pickupTime,
        "Выдача",
        r.guestName + where(r.vehicleId),
        r.status === "signed",
      );
      add(r.endDate, r.returnTime, "Возврат", r.guestName + where(r.vehicleId), null);
    }
    for (const b of bookings) {
      if (b.status === "cancelled" || contractFor(b)) continue;
      add(
        b.startDate,
        b.pickupTime || "",
        "Выдача",
        `${b.guestName} (сайт)${where(b.vehicleId)}`,
        false,
      );
      add(
        b.endDate,
        b.returnTime || "",
        "Возврат",
        `${b.guestName} (сайт)${where(b.vehicleId)}`,
        null,
      );
    }
    return items.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1)).slice(0, 6);
  }, [rows, bookings, contractFor, showVehicle, myVehicles]);

  const field = (
    k: keyof Form,
    label: string,
    type = "text",
    extra: Record<string, string> = {},
  ) => (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <input
        className={inputCls}
        type={type}
        value={form[k]}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        {...extra}
      />
    </label>
  );

  // ── login screens ──
  if (phase !== "ready") {
    return (
      <main className="mx-auto max-w-sm bg-background px-4 py-16 text-foreground">
        <h1 className="font-display text-2xl">Админка</h1>
        <p className="mt-1 text-sm text-muted-foreground">Camper Retreat VLC</p>
        {phase === "checking" && (
          <Loader2 className="mt-6 h-5 w-5 animate-spin text-muted-foreground" />
        )}
        {phase === "noaccess" && (
          <div className="mt-6 rounded-xl border border-border p-4 text-sm">
            <p>
              У аккаунта <strong>{auth.user?.email}</strong> нет доступа к админке.
            </p>
            <p className="mt-2 text-muted-foreground">
              Попросите владельца добавить этот e-mail в ADMIN_EMAILS или MANAGER_EMAILS, либо
              войдите другим аккаунтом.
            </p>
            <button className={`${btn} mt-4`} onClick={logout}>
              <LogOut className="h-4 w-4" /> Выйти
            </button>
          </div>
        )}
        {phase === "login" && (
          <>
            <button className={`${btnPrimary} mt-6 w-full`} onClick={() => openLogin()}>
              Войти через аккаунт сайта
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              Код на e-mail, Google или ключ доступа (passkey).
            </p>
            <button
              className="mt-6 text-xs text-muted-foreground underline"
              onClick={() => setShowToken((v) => !v)}
            >
              Войти по токену (старый способ)
            </button>
            {showToken && (
              <form onSubmit={loginWithToken}>
                <input
                  className={`${inputCls} mt-3`}
                  type="password"
                  placeholder="Токен (ADMIN_TOKEN)"
                  autoComplete="current-password"
                />
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />{" "}
                  Запомнить на этом устройстве
                </label>
                <button className={`${btnPrimary} mt-4 w-full`}>Войти</button>
              </form>
            )}
          </>
        )}
        {notice && <p className="mt-3 text-sm text-destructive">{notice.text}</p>}
        <LoginDialog />
      </main>
    );
  }

  // ── main ──
  if (actaOpen) {
    return (
      <ActaEditor
        contractId={actaOpen.contractId}
        kind={actaOpen.kind}
        api={actaApi}
        onClose={() => {
          setActaOpen(null);
          void loadActas();
        }}
      />
    );
  }

  if (wizard) {
    return (
      <HandoverWizard
        api={api}
        actaApi={actaApi}
        contractId={wizard}
        owner={me?.role === "owner"}
        ownerHasSignature={!!me?.ownerSignature}
        ownerName={me?.ownerSignerName || ""}
        onOpenActa={() => setActaOpen({ contractId: wizard, kind: "checkin" })}
        onPdf={() => void pdf(wizard)}
        onClose={() => {
          setWizard(null);
          void load();
        }}
      />
    );
  }

  const openOrder = order ? orders.all.find((o) => o.key === order) : null;
  if (order && openOrder) {
    const r = openOrder.row;
    return (
      <OrderView
        key={order}
        api={api}
        actaApi={actaApi}
        row={r}
        booking={openOrder.booking}
        vehicle={showVehicle ? vehicleName(openOrder.vehicleId) : ""}
        onBack={() => setOrder(null)}
        onWizard={() => r && setWizard(r.id)}
        onActa={(kind) => r && setActaOpen({ contractId: r.id, kind })}
        onPdf={() => r && void pdf(r.id)}
        onReissue={() => {
          if (!r) return;
          setOrder(null);
          void reissue(r);
        }}
        onCancel={() => {
          if (!r) return;
          void cancel(r).then(() => setOrder(null));
        }}
        onCreateContract={() => {
          if (!openOrder.booking) return;
          setOrder(null);
          contractFromBooking(openOrder.booking);
        }}
      />
    );
  }

  return (
    <main className="mx-auto max-w-3xl bg-background px-4 pb-16 pt-6 text-foreground">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl">Админка</h1>
          {me?.email && (
            <p className="text-xs text-muted-foreground">
              {me.email} ·{" "}
              {me.role === "owner"
                ? "владелец"
                : `менеджер: ${myVehicles.map((v) => v.city).join(", ") || "—"}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className={btn}
            onClick={() => void load()}
            disabled={loading}
            aria-label="Обновить"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className={btn} onClick={logout} aria-label="Выйти">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {notice && (
        <div
          className={`mt-4 flex items-start justify-between gap-2 rounded-lg px-3 py-2 text-sm ${notice.kind === "ok" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Скрыть">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {newLink && (
        <div className="mt-4">
          <LinkBox
            link={newLink.link}
            phone={newLink.phone}
            lang={newLink.lang}
            name={newLink.name}
            onClose={() => setNewLink(null)}
          />
        </div>
      )}

      <ImportsPanel
        imports={imports}
        onUse={(d) => applyParsed(d.parsed, d.id, d.vehicleId)}
        onDismiss={(d) => void dismissImport(d)}
      />
      <section className="mt-4">
        {showYescapa && !showForm && (
          <div className="mb-3">
            <YescapaPaste
              onParsed={(p) => applyParsed(p, null)}
              onClose={() => setShowYescapa(false)}
            />
          </div>
        )}
        {!showForm ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <button className={`${btnPrimary} w-full`} onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Новый заказ
            </button>
            <button className={`${btn} w-full`} onClick={() => setShowYescapa(true)}>
              <Plus className="h-4 w-4" /> Заказ с Yescapa (скриншот)
            </button>
          </div>
        ) : (
          <form onSubmit={create} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Новый договор</h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Закрыть">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {myVehicles.length > 1 && (
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-muted-foreground">Автодом *</span>
                  <select
                    className={inputCls}
                    value={form.vehicleId || defaultVehicleId}
                    onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  >
                    {myVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.city} · {v.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {field("guestName", "Имя клиента *")}
              {field("email", "E-mail клиента *", "email", { inputMode: "email" })}
              {field("phone", "Телефон (для WhatsApp)", "tel", {
                placeholder: "+34 600 000 000",
              })}
              {field("bookingRef", "Номер брони (Yescapa / сайт)")}
              {field("startDate", "Выдача *", "date")}
              {field("pickupTime", "Время выдачи", "time")}
              {field("endDate", "Возврат *", "date")}
              {field("returnTime", "Время возврата", "time")}
              {field("priceTotal", "Сумма, € (с НДС)", "number", { inputMode: "decimal" })}
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">Пробег</span>
                <select
                  className={inputCls}
                  value={
                    form.extras.includes("km_unlimited")
                      ? "km_unlimited"
                      : form.extras.includes("km_200")
                        ? "km_200"
                        : ""
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      extras: [
                        ...form.extras.filter((x) => !x.startsWith("km_")),
                        ...(e.target.value ? [e.target.value] : []),
                      ],
                    })
                  }
                >
                  <option value="">100 км в сутки (включено)</option>
                  <option value="km_200">200 км в сутки</option>
                  <option value="km_unlimited">Без ограничения</option>
                </select>
              </label>
              <fieldset className="text-sm sm:col-span-2">
                <legend className="mb-1 text-muted-foreground">Доп. опции</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {OPTION_KEYS.map((k) => (
                    <label key={k} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={form.extras.includes(k)}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            extras: e.target.checked
                              ? [...form.extras, k]
                              : form.extras.filter((x) => x !== k),
                          })
                        }
                      />
                      {EXTRA_LABELS[k]?.ru || k}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">Источник</span>
                <select
                  className={inputCls}
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                >
                  <option value="yescapa">Yescapa</option>
                  <option value="web">Сайт</option>
                  <option value="other">Другое</option>
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-muted-foreground">
                  Язык письма и страницы подписи
                </span>
                <select
                  className={inputCls}
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                >
                  <option value="es">Испанский</option>
                  <option value="en">Английский</option>
                  <option value="ru">Русский</option>
                  <option value="uk">Украинский</option>
                  <option value="de">Немецкий (страница на английском)</option>
                  <option value="it">Итальянский (страница на английском)</option>
                  <option value="nl">Нидерландский (страница на английском)</option>
                </select>
              </label>
            </div>
            {form.startDate && form.endDate && form.endDate > form.startDate && (
              <p className="mt-2 text-sm text-muted-foreground">
                {nights(form.startDate, form.endDate)} ноч.
              </p>
            )}
            <button
              disabled={busy || !!formError}
              className={`${btnPrimary} mt-4 w-full sm:w-auto`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Создать и отправить клиенту"}
            </button>
            {formError && <p className="mt-2 text-xs text-muted-foreground">{formError}</p>}
          </form>
        )}
      </section>

      <label className="relative mt-4 block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={`${inputCls} pl-9`}
          placeholder="Поиск: имя, телефон, e-mail, номер брони"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {/* ── orders by time: upcoming on top, the current one in the middle, past below ── */}
      {(
        [
          ["future", "Будущие"],
          ["current", "Сейчас в аренде"],
          ["past", "Прошедшие"],
        ] as const
      ).map(([k, title]) => (
        <section key={k} id={`orders-${k}`} className="mt-6 scroll-mt-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title} <span className="font-normal">{orders[k].length}</span>
          </h2>
          {orders[k].length === 0 && (
            <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              {k === "current" ? "Сейчас автодом никто не арендует." : "Нет заказов."}
            </p>
          )}
          <ul className="space-y-2">
            {orders[k].map((o) => (
              <li key={o.key}>
                <button
                  onClick={() => setOrder(o.key)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${k === "current" ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-base font-semibold">{o.name}</span>
                      <span
                        className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${o.badgeCls}`}
                      >
                        {o.badge}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {fmtDay(o.start)} → {fmtDay(o.end)} · {nights(o.start, o.end)} ноч.
                      {showVehicle ? ` · ${vehicleName(o.vehicleId)}` : ""}
                    </span>
                    <span
                      className={`mt-0.5 block text-sm ${o.todo ? "text-amber-500" : "text-muted-foreground"}`}
                    >
                      {o.hint}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {orders.cancelled.length > 0 && (
        <details className="mt-6 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Отменённые ({orders.cancelled.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {orders.cancelled.map((o) => (
              <li key={o.key}>
                <button
                  onClick={() => setOrder(o.key)}
                  className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-2.5 text-left text-muted-foreground"
                >
                  <span className="truncate">
                    {o.name} · {fmtDay(o.start)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Rarely needed: everything that is set up once. */}
      <details className="mt-10 rounded-xl border border-border p-3 text-sm">
        <summary className="cursor-pointer font-semibold text-muted-foreground">Настройки</summary>
        {feeds.length > 0 && (
          <details className="mt-4 rounded-xl border border-border p-3 text-sm">
            <summary className="cursor-pointer font-semibold">
              Календарь броней сайта (для Yescapa)
            </summary>
            <p className="mt-2 text-muted-foreground">
              Закрытая ссылка: вставьте её в Yescapa (импорт календаря) или в календарь телефона.
              Никому больше не передавайте — по ней видны даты всех броней.
              {feeds.length > 1
                ? " У каждого автодома своя ссылка: вставьте её в объявление этого автодома."
                : ""}
            </p>
            {feeds.map((f) =>
              f.url ? (
                <div key={f.id} className="mt-2">
                  {feeds.length > 1 && (
                    <p className="mb-1 text-xs text-muted-foreground">{f.label}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={f.url}
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <button
                      className={btn}
                      onClick={() => {
                        void navigator.clipboard?.writeText(f.url || "");
                        setNotice({ kind: "ok", text: "Ссылка на календарь скопирована." });
                      }}
                    >
                      Копировать
                    </button>
                  </div>
                </div>
              ) : null,
            )}
          </details>
        )}

        {me?.staff && (
          <details className="mt-4 rounded-xl border border-border p-3 text-sm">
            <summary className="cursor-pointer font-semibold">Доступ к админке</summary>
            <p className="mt-2 text-muted-foreground">
              Только для просмотра. Меняется в Vercel: ADMIN_EMAILS и MANAGER_EMAILS.
            </p>
            <ul className="mt-2 space-y-1">
              {me.staff.admins.map((e) => (
                <li key={`a-${e}`}>
                  {e} · <span className="text-muted-foreground">владелец, всё</span>
                </li>
              ))}
              {me.staff.managers.map((m) => (
                <li key={`m-${m.email}`}>
                  {m.email} ·{" "}
                  <span className="text-muted-foreground">
                    менеджер: {m.vehicleIds.map(vehicleName).join(", ")}
                  </span>
                </li>
              ))}
              {me.staff.token && (
                <li className="text-muted-foreground">+ общий токен ADMIN_TOKEN (полный доступ)</li>
              )}
            </ul>
          </details>
        )}

        {me?.role === "owner" && (
          <OwnerSignature
            api={api}
            has={!!me.ownerSignature}
            name={me.ownerSignerName || "Ivakhnenko Sergii"}
            onSaved={(ok) =>
              setNotice(
                ok
                  ? { kind: "ok", text: "Подпись сохранена." }
                  : { kind: "err", text: "Не удалось сохранить подпись." },
              )
            }
          />
        )}

        <GmailSetup
          setup={importSetup}
          onCopied={() => setNotice({ kind: "ok", text: "Код скрипта скопирован." })}
        />
      </details>
    </main>
  );
}
