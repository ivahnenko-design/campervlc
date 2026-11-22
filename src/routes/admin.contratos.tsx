import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { formFromParsed, GmailSetup, ImportsPanel, missingFields, YescapaPaste, type ImportDraft, type Parsed } from "@/components/admin/YescapaImport";
import { LoginDialog } from "@/components/LoginDialog";
import { loadAuth, logout as logoutAccount, openLogin, useAuth } from "@/lib/auth";
import { vehicleByPlate } from "../../shared/vehicles.js";
import {
  Check,
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

type Status = "pending" | "signed" | "cancelled";

interface Row {
  id: string;
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
  staff: null | { admins: string[]; managers: { email: string; vehicleIds: string[] }[]; token: boolean };
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
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Ждёт подписи",
  signed: "Подписан",
  cancelled: "Отменён",
};
const STATUS_CLS: Record<Status, string> = {
  pending: "bg-amber-500/15 text-amber-500",
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
  signed: "Подписан",
  cancelled: "Отменён",
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
  licenseExpiry: "Права до",
  extraDriverName: "Доп. водитель",
  extraDriverDoc: "Документ доп. водителя",
  extraDriverLicense: "Права доп. водителя",
};

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary sm:text-sm";
const btn =
  "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted";
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
  es: (n, l) => `Hola ${n}, aquí tienes el contrato de alquiler para firmar online (5 min): ${l}`,
  en: (n, l) => `Hello ${n}, here is your rental contract to sign online (5 min): ${l}`,
  ru: (n, l) => `Здравствуйте, ${n}! Договор аренды для подписи онлайн (5 минут): ${l}`,
  uk: (n, l) => `Вітаємо, ${n}! Договір оренди для підпису онлайн (5 хвилин): ${l}`,
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
        return setNotice({ kind: "err", text: "Доступ в админку не настроен: задайте ADMIN_EMAILS (или ADMIN_TOKEN) в Vercel." });
      }
      if (r.status === 401) {
        if (token) {
          forgetToken();
          setToken("");
          setNotice({ kind: "err", text: "Сохранённый токен не подошёл. Войдите через аккаунт сайта." });
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
      if (b.ok) setBookings(((await b.json()) as { bookings: Booking[] }).bookings);
      if (cal?.ok) setFeeds(((await cal.json()) as { feeds?: Feed[] }).feeds || []);
      if (imp.ok) {
        const j = (await imp.json()) as { imports: ImportDraft[]; setup: { key: string; script: string } | null };
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
  }, [api, me]);

  useEffect(() => {
    if (phase === "ready") void load();
  }, [phase, load]);

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
    const c = { all: rows.length, pending: 0, signed: 0, cancelled: 0 };
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
          [r.guestName, r.email, r.bookingRef, r.phone].some((v) =>
            (v || "").toLowerCase().includes(q),
          ),
      )
      .sort((a, b) =>
        a.status === "pending" && b.status !== "pending"
          ? -1
          : b.status === "pending" && a.status !== "pending"
            ? 1
            : a.startDate < b.startDate
              ? -1
              : 1,
      );
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
      setNotice({ kind: "err", text: `Номер ${p.plate} не совпадает с вашими автодомами. Проверьте автодом в форме.` });
      return;
    }
    setNotice(
      miss.length
        ? { kind: "err", text: `Проверьте форму: не нашёл ${miss.join(", ")}. Остальное заполнено.` }
        : { kind: "ok", text: "Форма заполнена из брони Yescapa. Проверьте данные и создайте договор." },
    );
  }

  async function dismissImport(d: ImportDraft) {
    await api("", { method: "POST", body: JSON.stringify({ action: "import_dismiss", importId: d.id }) });
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
    });
    setTab("contracts");
    setShowForm(true);
    setNotice({
      kind: "ok",
      text: "Данные брони подставлены. Проверьте язык клиента и нажмите «Создать».",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    const where = (id: string) => (showVehicle ? ` · ${myVehicles.find((v) => v.id === id)?.city || id}` : "");
    for (const r of rows) {
      if (r.status === "cancelled") continue;
      add(r.startDate, r.pickupTime, "Выдача", r.guestName + where(r.vehicleId), r.status === "signed");
      add(r.endDate, r.returnTime, "Возврат", r.guestName + where(r.vehicleId), null);
    }
    for (const b of bookings) {
      if (b.status === "cancelled" || contractFor(b)) continue;
      add(b.startDate, b.pickupTime || "", "Выдача", `${b.guestName} (сайт)${where(b.vehicleId)}`, false);
      add(b.endDate, b.returnTime || "", "Возврат", `${b.guestName} (сайт)${where(b.vehicleId)}`, null);
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
        {phase === "checking" && <Loader2 className="mt-6 h-5 w-5 animate-spin text-muted-foreground" />}
        {phase === "noaccess" && (
          <div className="mt-6 rounded-xl border border-border p-4 text-sm">
            <p>
              У аккаунта <strong>{auth.user?.email}</strong> нет доступа к админке.
            </p>
            <p className="mt-2 text-muted-foreground">
              Попросите владельца добавить этот e-mail в ADMIN_EMAILS или MANAGER_EMAILS, либо войдите другим
              аккаунтом.
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
            <p className="mt-2 text-xs text-muted-foreground">Код на e-mail, Google или ключ доступа (passkey).</p>
            <button className="mt-6 text-xs text-muted-foreground underline" onClick={() => setShowToken((v) => !v)}>
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
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Запомнить
                  на этом устройстве
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
  return (
    <main className="mx-auto max-w-3xl bg-background px-4 pb-16 pt-6 text-foreground">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl">Админка</h1>
          {me?.email && (
            <p className="text-xs text-muted-foreground">
              {me.email} · {me.role === "owner" ? "владелец" : `менеджер: ${myVehicles.map((v) => v.city).join(", ") || "—"}`}
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

      {feeds.length > 0 && (
        <details className="mt-4 rounded-xl border border-border p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Календарь броней сайта (для Yescapa)</summary>
          <p className="mt-2 text-muted-foreground">
            Закрытая ссылка: вставьте её в Yescapa (импорт календаря) или в календарь телефона. Никому
            больше не передавайте — по ней видны даты всех броней.
            {feeds.length > 1 ? " У каждого автодома своя ссылка: вставьте её в объявление этого автодома." : ""}
          </p>
          {feeds.map((f) =>
            f.url ? (
              <div key={f.id} className="mt-2">
                {feeds.length > 1 && <p className="mb-1 text-xs text-muted-foreground">{f.label}</p>}
                <div className="flex gap-2">
                  <input readOnly value={f.url} className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" onFocus={(e) => e.currentTarget.select()} />
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
          <p className="mt-2 text-muted-foreground">Только для просмотра. Меняется в Vercel: ADMIN_EMAILS и MANAGER_EMAILS.</p>
          <ul className="mt-2 space-y-1">
            {me.staff.admins.map((e) => (
              <li key={`a-${e}`}>
                {e} · <span className="text-muted-foreground">владелец, всё</span>
              </li>
            ))}
            {me.staff.managers.map((m) => (
              <li key={`m-${m.email}`}>
                {m.email} · <span className="text-muted-foreground">менеджер: {m.vehicleIds.map(vehicleName).join(", ")}</span>
              </li>
            ))}
            {me.staff.token && <li className="text-muted-foreground">+ общий токен ADMIN_TOKEN (полный доступ)</li>}
          </ul>
        </details>
      )}

      <ImportsPanel imports={imports} onUse={(d) => applyParsed(d.parsed, d.id, d.vehicleId)} onDismiss={(d) => void dismissImport(d)} />
      <GmailSetup setup={importSetup} onCopied={() => setNotice({ kind: "ok", text: "Код скрипта скопирован." })} />

      {upcoming.length > 0 && (
        <section className="mt-5 rounded-xl border border-border p-3">
          <h2 className="text-sm font-semibold">Ближайшие 14 дней</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {upcoming.map((u, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-2">
                <span className="w-36 shrink-0 whitespace-nowrap text-muted-foreground">
                  {fmtDay(u.date)}
                  {u.time ? ` ${u.time}` : ""}
                </span>
                <span className={u.kind === "Выдача" ? "font-medium" : ""}>{u.kind}</span>
                <span>· {u.name}</span>
                {u.kind === "Выдача" && u.signed === false && (
                  <span className="text-xs text-amber-500">договор не подписан</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="mt-5 flex gap-1 rounded-full bg-muted p-1 text-sm">
        {(
          [
            ["contracts", `Договоры (${rows.length})`],
            [
              "bookings",
              `Брони сайта (${bookings.filter((b) => b.status !== "cancelled").length})`,
            ],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-full px-3 py-1.5 ${tab === k ? "bg-background font-semibold shadow-sm" : "text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "contracts" && (
        <section className="mt-4">
          {showYescapa && !showForm && (
            <div className="mb-3">
              <YescapaPaste onParsed={(p) => applyParsed(p, null)} onClose={() => setShowYescapa(false)} />
            </div>
          )}
          {!showForm ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button className={`${btnPrimary} w-full`} onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" /> Новый договор
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
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Создать и отправить клиенту"
                )}
              </button>
              {formError && <p className="mt-2 text-xs text-muted-foreground">{formError}</p>}
            </form>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {(["all", "pending", "signed", "cancelled"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full border px-3 py-1 ${filter === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              >
                {k === "all" ? "Все" : STATUS_LABEL[k]} {counts[k]}
              </button>
            ))}
          </div>
          <label className="relative mt-3 block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Поиск: имя, e-mail, телефон, номер брони"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <ul className="mt-3 space-y-3">
            {visible.map((r) => {
              const d = open[r.id];
              return (
                <li key={r.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{r.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        {fmtDay(r.startDate)} → {fmtDay(r.endDate)} ·{" "}
                        {nights(r.startDate, r.endDate)} ноч.
                        {r.priceTotal != null ? ` · ${r.priceTotal} €` : ""}
                      </p>
                    </div>
                    <Badge status={r.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {showVehicle ? `${vehicleName(r.vehicleId)} · ` : ""}
                    {SOURCE_LABEL[r.source] || r.source}
                    {r.bookingRef ? ` · ${r.bookingRef}` : ""} · {r.language.toUpperCase()} ·{" "}
                    {r.email}
                    {r.phone ? ` · ${r.phone}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.status === "signed"
                      ? `Подписан ${fmtTs(r.signedAt)}`
                      : r.status === "pending"
                        ? r.viewedAt
                          ? `Клиент открыл ссылку ${fmtTs(r.viewedAt)}`
                          : "Клиент ещё не открывал ссылку"
                        : `Создан ${fmtTs(r.createdAt)}`}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.status === "signed" && (
                      <button className={btn} onClick={() => void pdf(r.id)}>
                        <FileText className="h-4 w-4" /> PDF
                      </button>
                    )}
                    {r.status === "pending" && (
                      <>
                        <button className={btn} onClick={() => void reissue(r)}>
                          <RefreshCw className="h-4 w-4" /> Новая ссылка
                        </button>
                        <button className={btn} onClick={() => void cancel(r)}>
                          <X className="h-4 w-4" /> Отменить
                        </button>
                      </>
                    )}
                    <button className={btn} onClick={() => void toggleDetail(r.id)}>
                      {d ? "Скрыть" : r.status === "signed" ? "Данные клиента" : "История"}
                    </button>
                  </div>

                  {d === "loading" && <Loader2 className="mt-3 h-4 w-4 animate-spin" />}
                  {d && d !== "loading" && (
                    <div className="mt-3 space-y-3 border-t border-border pt-3 text-sm">
                      {d.signed && (
                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                          {Object.entries(d.signed.data)
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                              <div key={k} className="contents">
                                <dt className="text-muted-foreground">{FIELD_LABEL[k] || k}</dt>
                                <dd className="break-words">{v}</dd>
                              </div>
                            ))}
                          <dt className="text-muted-foreground">IP</dt>
                          <dd>{d.signed.ip || "—"}</dd>
                        </dl>
                      )}
                      <ol className="space-y-0.5 text-xs text-muted-foreground">
                        {d.audit.map((a, i) => (
                          <li key={i}>
                            {fmtTs(a.t)} · {EVENT_LABEL[a.ev] || a.ev}
                            {a.ip ? ` · ${a.ip}` : ""}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </li>
              );
            })}
            {!visible.length && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                {rows.length ? "Ничего не найдено." : "Договоров пока нет."}
              </li>
            )}
          </ul>
        </section>
      )}

      {tab === "bookings" && (
        <section className="mt-4">
          <div className="flex flex-wrap gap-2 text-sm">
            {(
              [
                ["upcoming", "Предстоящие"],
                ["past", "Прошедшие"],
                ["cancelled", "Отменённые"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setBFilter(k)}
                className={`rounded-full border px-3 py-1 ${bFilter === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="mt-3 space-y-3">
            {(bFilter === "past" ? [...visibleBookings].reverse() : visibleBookings).map((b) => {
              const c = contractFor(b);
              const paidFull = b.remainingAmount <= 0;
              return (
                <li key={b.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{b.guestName || "—"}</p>
                      <p className="text-sm text-muted-foreground">
                        {fmtDay(b.startDate)} → {fmtDay(b.endDate)} · {b.nights} ноч. ·{" "}
                        {b.totalWithIva} €
                      </p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      {b.bookingRef}
                      {showVehicle ? ` · ${vehicleName(b.vehicleId)}` : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paidFull
                      ? "Оплачено полностью"
                      : `Предоплата ${b.depositAmount} €, остаток ${b.remainingAmount} € при выдаче`}{" "}
                    · {b.adults} взр.
                    {b.children ? ` + ${b.children} дет.` : ""}
                    {b.pickupTime ? ` · выдача ${b.pickupTime}` : ""}
                    {b.returnTime ? `, возврат ${b.returnTime}` : ""}
                  </p>
                  {b.extraIds.filter((x) => x !== "cleaning_fee").length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Опции: {b.extraIds.filter((x) => x !== "cleaning_fee").join(", ")}
                    </p>
                  )}
                  {b.message && (
                    <p className="mt-1 text-xs italic text-muted-foreground">«{b.message}»</p>
                  )}
                  <p className="mt-1 text-xs">
                    Договор:{" "}
                    {c ? (
                      <Badge status={c.status} />
                    ) : (
                      <span className="text-amber-500">не создан</span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!c && b.status !== "cancelled" && (
                      <button className={btn} onClick={() => contractFromBooking(b)}>
                        <Plus className="h-4 w-4" /> Создать договор
                      </button>
                    )}
                    {b.guestPhone && (
                      <a
                        className={btn}
                        href={`https://wa.me/${digits(b.guestPhone)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    )}
                    {b.guestEmail && (
                      <a className={btn} href={`mailto:${b.guestEmail}`}>
                        E-mail
                      </a>
                    )}
                    {b.paymentIntentId && (
                      <a
                        className={btn}
                        href={`https://dashboard.stripe.com/payments/${b.paymentIntentId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Stripe
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
            {!visibleBookings.length && (
              <li className="py-6 text-center text-sm text-muted-foreground">Броней нет.</li>
            )}
          </ul>
        </section>
      )}
    </main>
  );
}
