// Admin: digital handover report (acta de entrega / devolución), filled in on a
// phone at pickup and at return. Autosaves a draft, uploads compressed photos one
// by one, both sides sign on the screen, then the server builds the PDF and
// emails it to the guest and to the camper owner. Russian UI, large targets.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Download, Loader2, Mail, Trash2, X } from "lucide-react";
import {
  CHECKLIST,
  DAMAGE_TYPES,
  EXTRA_LABELS,
  compareActas,
  newDamageMarks,
  suggestedCharges,
  type ActaKind,
  type DamageMark,
  type DamageType,
  type KmPlan,
} from "../../../shared/acta.js";

// ── types ───────────────────────────────────────────────────────────────────

interface Photo {
  id: string;
  takenAt: number;
  size: number;
}

/** Editable fields (what the draft save sends). */
interface Fields {
  datetime: string;
  odometerKm: string;
  fuel: number | null;
  checklist: Record<string, boolean | null>;
  smell: boolean | null;
  petsOnBoard: boolean | null;
  kmPlan: KmPlan;
  extras: string[];
  marks: DamageMark[];
  notes: string;
  staffName: string;
  guestName: string;
}

interface Acta extends Omit<Fields, "odometerKm" | "datetime"> {
  contractId: string;
  kind: ActaKind;
  status: "draft" | "signed";
  datetime: string | null;
  odometerKm: number | null;
  photos: Photo[];
  staffEmail: string | null;
  updatedAt: number;
  signatures: null | { staff: { name: string; at: number }; guest: { name: string; at: number } };
  pdf: null | { sha256: string; at: number; size: number };
}

interface Loaded {
  contract: {
    id: string;
    status: string;
    guestName: string;
    email: string;
    language: string;
    bookingRef: string;
    startDate: string;
    endDate: string;
    pickupTime: string;
    returnTime: string;
  };
  vehicle: {
    id: string;
    name: string;
    plate: string;
    diagram: { path: string; width: number; height: number } | null;
  };
  checkin: Acta | null;
  checkout: Acta | null;
  prefill: null | { extras: string[]; kmPlan: KmPlan };
  dayRate: number | null;
}

type Api = (path: string, init?: RequestInit) => Promise<Response>;

// ── helpers ─────────────────────────────────────────────────────────────────

const TITLE: Record<ActaKind, string> = { checkin: "Акт выдачи", checkout: "Акт возврата" };
const FUEL = ["Пусто", "¼", "½", "¾", "Полный"];
const KM_PLAN_LABEL: Record<KmPlan, string> = {
  "100": "100 км/сутки",
  "200": "200 км/сутки",
  unlimited: "Безлимит",
};
const EXTRA_CHOICES = [
  "bicycle",
  "sup_board",
  "bedding",
  "towels",
  "bbq",
  "festival",
  "extra_driver",
  "pet",
];
const STAFF_NAME_KEY = "campervlcActaStaffName";

const pad = (n: number) => String(n).padStart(2, "0");
const localNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmtTs = (ms: number) =>
  new Date(ms).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const eur = (n: number) => `${n.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} €`;
const fuelText = (n: number | null | undefined) => (n == null ? "—" : FUEL[n]);
const newId = () => Math.random().toString(36).slice(2, 10);

function storedStaffName() {
  try {
    return localStorage.getItem(STAFF_NAME_KEY) || "";
  } catch {
    return "";
  }
}

function fieldsFrom(a: Acta | null, data: Loaded): Fields {
  return {
    datetime: a?.datetime || localNow(),
    odometerKm: a?.odometerKm != null ? String(a.odometerKm) : "",
    fuel: a?.fuel ?? null,
    checklist: a?.checklist || Object.fromEntries(CHECKLIST.map((c) => [c.key, null])),
    smell: a?.smell ?? null,
    petsOnBoard: a?.petsOnBoard ?? null,
    kmPlan: a?.kmPlan || data.prefill?.kmPlan || "100",
    extras: a?.extras || data.prefill?.extras?.filter((id) => !id.startsWith("km_")) || [],
    marks: a?.marks || [],
    notes: a?.notes || "",
    staffName: a?.staffName || storedStaffName(),
    guestName: a?.guestName || data.contract.guestName,
  };
}

const payload = (f: Fields) => ({
  ...f,
  odometerKm: f.odometerKm.trim() === "" ? null : Number(f.odometerKm),
});

/** Image file -> JPEG data URL, longest side <= max px. */
async function compress(file: File, max: number, quality: number): Promise<string> {
  let source: CanvasImageSource & { width: number; height: number };
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Не удалось прочитать фото"));
        img.src = url;
      });
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
  const scale = Math.min(1, max / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source && typeof source.close === "function") source.close();
  return canvas.toDataURL("image/jpeg", quality);
}

// ── small components ────────────────────────────────────────────────────────

const card = "rounded-2xl border border-border p-4";
const h2 = "mb-3 text-base font-semibold";
const big =
  "w-full rounded-xl border border-border bg-background px-3 py-3 text-lg text-foreground outline-none focus:border-primary";
const btn =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm";

function YesNo({
  value,
  onChange,
  disabled,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 gap-1.5">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === v ? null : v)}
          className={`min-h-11 min-w-14 rounded-xl border px-3 text-sm font-medium ${
            value === v
              ? v
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-red-600 bg-red-600 text-white"
              : "border-border text-muted-foreground"
          }`}
        >
          {v ? "Да" : "Нет"}
        </button>
      ))}
    </div>
  );
}

function SignaturePad({
  onChange,
  disabled,
}: {
  onChange: (png: string | null) => void;
  disabled?: boolean;
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
    if (disabled) return;
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
        height={240}
        className="w-full touch-none rounded-xl border border-dashed border-border bg-white"
        style={{ aspectRatio: "700 / 240" }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
      />
      <button
        type="button"
        onClick={clear}
        disabled={!hasInk || disabled}
        className="mt-1 min-h-9 text-sm text-muted-foreground underline disabled:opacity-40"
      >
        Стереть
      </button>
    </div>
  );
}

/** Thumbnail through the API (works with the session cookie and the legacy token). */
function Thumb({ api, query, onDelete }: { api: Api; query: string; onDelete?: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    void api(query)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (!b || !alive) return;
        url = URL.createObjectURL(b);
        setSrc(url);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [api, query]);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <Loader2 className="m-auto mt-6 h-5 w-5 animate-spin text-muted-foreground" />
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Удалить фото"
          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── editor ──────────────────────────────────────────────────────────────────

export function ActaEditor({
  contractId,
  kind,
  api,
  onClose,
}: {
  contractId: string;
  kind: ActaKind;
  /** fetch to /api/contract?scope=acta&<path> with the staff credentials */
  api: Api;
  onClose: () => void;
}) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<Fields | null>(null);
  const [acta, setActa] = useState<Acta | null>(null);
  const [save, setSave] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [markType, setMarkType] = useState<DamageType>("scratch");
  const [selected, setSelected] = useState<string | null>(null);
  const [upload, setUpload] = useState<{ done: number; total: number; failed: number } | null>(
    null,
  );
  const [sigStaff, setSigStaff] = useState<string | null>(null);
  const [sigGuest, setSigGuest] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [result, setResult] = useState<{ emailed: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const latest = useRef<Fields | null>(null);
  latest.current = f;

  const load = useCallback(async () => {
    setError(null);
    const r = await api(`contractId=${contractId}`);
    if (r.status === 403) return setError("Это не ваш автодом.");
    if (!r.ok) return setError("Не удалось загрузить акт. Проверьте соединение.");
    const j = (await r.json()) as Loaded;
    setData(j);
    const a = kind === "checkin" ? j.checkin : j.checkout;
    setActa(a);
    setF(fieldsFrom(a, j));
  }, [api, contractId, kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const locked = acta?.status === "signed";
  const checkin = data?.checkin || null;

  // ── autosave ──
  const saveNow = useCallback(async () => {
    const cur = latest.current;
    if (!cur) return true;
    setSave("saving");
    try {
      const r = await api("", {
        method: "POST",
        body: JSON.stringify({ action: "save", contractId, kind, acta: payload(cur) }),
      });
      const j = (await r.json()) as { acta?: Acta; error?: string };
      if (!r.ok || !j.acta) throw new Error(j.error);
      setActa((a) => ({
        ...j.acta!,
        photos: j.acta!.photos.length >= (a?.photos.length || 0) ? j.acta!.photos : a!.photos,
      }));
      // Only "saved" when nothing changed while the request was running.
      setSave(latest.current === cur ? "saved" : "dirty");
      return true;
    } catch {
      setSave("error");
      return false;
    }
  }, [api, contractId, kind]);

  useEffect(() => {
    if (save !== "dirty" || locked) return;
    const t = setTimeout(() => void saveNow(), 1200);
    return () => clearTimeout(t);
  }, [f, save, saveNow, locked]);

  const set = (patch: Partial<Fields>) => {
    if (locked) return;
    setF((x) => (x ? { ...x, ...patch } : x));
    setSave("dirty");
  };
  const setCheck = (key: string, v: boolean | null) =>
    f && set({ checklist: { ...f.checklist, [key]: v } });

  // ── damage marks ──
  const tapDiagram = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!f || locked) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const m: DamageMark = {
      id: newId(),
      x: Math.round(x * 1e4) / 1e4,
      y: Math.round(y * 1e4) / 1e4,
      type: markType,
      note: "",
    };
    set({ marks: [...f.marks, m] });
    setSelected(m.id);
  };
  const updateMark = (id: string, patch: Partial<DamageMark>) =>
    f && set({ marks: f.marks.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const deleteMark = (id: string) => f && set({ marks: f.marks.filter((m) => m.id !== id) });

  // ── photos ──
  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    let failed = 0;
    setUpload({ done: 0, total: list.length, failed: 0 });
    // The draft (with what is typed so far) must exist before its first photo.
    if (!acta) await saveNow();
    for (let i = 0; i < list.length; i++) {
      try {
        let data = await compress(list[i], 1600, 0.8);
        if (data.length > 3_700_000) data = await compress(list[i], 1280, 0.6);
        const thumb = await compress(list[i], 480, 0.7);
        const r = await api("", {
          method: "POST",
          body: JSON.stringify({
            action: "photo",
            contractId,
            kind,
            data,
            thumb,
            takenAt: list[i].lastModified || Date.now(),
          }),
        });
        const j = (await r.json()) as { photo?: Photo; error?: string };
        if (!r.ok || !j.photo) throw new Error(j.error);
        setActa((a) => (a ? { ...a, photos: [...a.photos, j.photo!] } : a));
      } catch {
        failed++;
      }
      setUpload({ done: i + 1, total: list.length, failed });
    }
    if (!failed) setTimeout(() => setUpload(null), 1500);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function deletePhoto(id: string) {
    if (!window.confirm("Удалить это фото?")) return;
    const r = await api("", {
      method: "POST",
      body: JSON.stringify({ action: "photo_delete", contractId, kind, photoId: id }),
    });
    if (r.ok) setActa((a) => (a ? { ...a, photos: a.photos.filter((p) => p.id !== id) } : a));
  }

  // ── check-out comparison ──
  const summary = useMemo(() => {
    if (kind !== "checkout" || !f || !data) return null;
    const cur = { ...payload(f), datetime: f.datetime };
    const cmp = compareActas(checkin, cur, {
      startDate: data.contract.startDate,
      endDate: data.contract.endDate,
      returnTime: data.contract.returnTime,
      kmPlan: f.kmPlan,
      extras: f.extras,
    });
    return { cmp, charges: suggestedCharges(cmp, { dayRate: data.dayRate }) };
  }, [kind, f, data, checkin]);

  // ── signing ──
  const missing = useMemo(() => {
    if (!f) return [];
    const m: string[] = [];
    if (!f.datetime) m.push("дата и время");
    if (f.odometerKm.trim() === "" || !/^\d+$/.test(f.odometerKm.trim())) m.push("пробег");
    if (f.fuel == null) m.push("топливо");
    if (f.staffName.trim().length < 2) m.push("имя сотрудника");
    if (f.guestName.trim().length < 2) m.push("имя арендатора");
    if (!sigStaff) m.push("подпись сотрудника");
    if (!sigGuest) m.push("подпись арендатора");
    return m;
  }, [f, sigStaff, sigGuest]);

  async function signAndSend() {
    if (!f || missing.length) return;
    if (
      !window.confirm(
        "Подписать акт и отправить PDF клиенту и владельцу? После подписи акт нельзя изменить.",
      )
    )
      return;
    setSigning(true);
    setError(null);
    try {
      try {
        localStorage.setItem(STAFF_NAME_KEY, f.staffName.trim());
      } catch {
        /* ignore */
      }
      if (!acta && !(await saveNow())) throw new Error("Не удалось сохранить черновик.");
      const r = await api("", {
        method: "POST",
        body: JSON.stringify({
          action: "sign",
          contractId,
          kind,
          acta: payload(f),
          staffSignature: sigStaff,
          guestSignature: sigGuest,
        }),
      });
      const j = (await r.json()) as {
        acta?: Acta;
        emailed?: boolean;
        error?: string;
        code?: string;
      };
      if (!r.ok || !j.acta) {
        const why: Record<string, string> = {
          odometer_lower: "Пробег меньше, чем в акте выдачи.",
          conflict: "Акт изменился на другом устройстве. Обновите и попробуйте снова.",
          acta_signed: "Акт уже подписан.",
          signature_invalid: "Подпись не распознана, распишитесь ещё раз.",
        };
        throw new Error(why[j.code || ""] || j.error || "Ошибка подписи");
      }
      setActa(j.acta);
      setSave("idle");
      setResult({ emailed: !!j.emailed });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSigning(false);
    }
  }

  async function downloadPdf() {
    const win = window.open("", "_blank");
    const r = await api(`contractId=${contractId}&kind=${kind}&pdf=1`);
    if (!r.ok) {
      win?.close();
      return setError("PDF не найден.");
    }
    const url = URL.createObjectURL(await r.blob());
    if (win) win.location.href = url;
    else window.location.href = url;
  }

  async function resend() {
    const r = await api("", {
      method: "POST",
      body: JSON.stringify({ action: "email", contractId, kind }),
    });
    const j = (await r.json().catch(() => ({}))) as { emailed?: boolean };
    setResult({ emailed: !!j.emailed });
  }

  async function close() {
    if (save === "dirty" || save === "error") await saveNow();
    onClose();
  }

  // ── render ──
  const header = (
    <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold">{TITLE[kind]}</p>
        <p className="truncate text-xs text-muted-foreground">
          {data
            ? `${data.contract.guestName} · ${data.vehicle.name}${data.vehicle.plate ? ` · ${data.vehicle.plate}` : ""}`
            : "…"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {locked
            ? "Подписан"
            : save === "saving"
              ? "Сохраняю…"
              : save === "saved"
                ? "Сохранено"
                : save === "error"
                  ? "Не сохранено!"
                  : save === "dirty"
                    ? "…"
                    : "Черновик"}
        </span>
        <button onClick={() => void close()} className={btn} aria-label="Закрыть">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  if (!data || !f) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-background text-foreground">
        <div className="mx-auto max-w-2xl px-4 pb-24">
          {header}
          {error ? (
            <p className="mt-6 text-red-600">{error}</p>
          ) : (
            <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin" />
          )}
        </div>
      </div>
    );
  }

  const diagram = data.vehicle.diagram;
  const before = kind === "checkout" ? checkin?.marks || [] : [];
  const freshIds = new Set(
    kind === "checkout"
      ? newDamageMarks(before, f.marks).map((m) => m.id)
      : f.marks.map((m) => m.id),
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background text-foreground">
      <div className="mx-auto max-w-2xl space-y-4 px-4 pb-28">
        {header}

        {kind === "checkout" && !checkin && (
          <p className="rounded-xl bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-400">
            Акта выдачи нет: пробег сравнить не с чем, топливо сравнивается с полным баком.
          </p>
        )}
        {kind === "checkout" && checkin && checkin.status !== "signed" && (
          <p className="rounded-xl bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-400">
            Акт выдачи ещё не подписан.
          </p>
        )}

        {locked && acta && (
          <section className={`${card} border-emerald-600/40 bg-emerald-600/5`}>
            <p className="flex items-center gap-2 font-semibold">
              <Check className="h-5 w-5 text-emerald-600" /> Акт подписан{" "}
              {acta.signatures ? fmtTs(acta.signatures.guest.at) : ""}
            </p>
            {result && (
              <p
                className={`mt-1 text-sm ${result.emailed ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}`}
              >
                {result.emailed
                  ? "PDF отправлен клиенту и владельцу автодома."
                  : "PDF сохранён, но письмо НЕ ушло. Отправьте ещё раз или скачайте PDF."}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={`${btn} bg-primary font-semibold text-primary-foreground`}
                onClick={() => void downloadPdf()}
              >
                <Download className="h-4 w-4" /> Скачать PDF
              </button>
              <button className={btn} onClick={() => void resend()}>
                <Mail className="h-4 w-4" /> Отправить ещё раз
              </button>
            </div>
          </section>
        )}

        {/* ── km & fuel ── */}
        <section className={card}>
          <h2 className={h2}>Пробег и топливо</h2>
          <label className="block text-sm text-muted-foreground">
            Дата и время
            <input
              type="datetime-local"
              className={`${big} mt-1`}
              value={f.datetime}
              disabled={locked}
              onChange={(e) => set({ datetime: e.target.value })}
            />
          </label>
          <label className="mt-3 block text-sm text-muted-foreground">
            Пробег, км
            {checkin?.odometerKm != null && kind === "checkout"
              ? ` (при выдаче ${checkin.odometerKm.toLocaleString("ru-RU")})`
              : ""}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`${big} mt-1`}
              value={f.odometerKm}
              disabled={locked}
              placeholder="например 51234"
              onChange={(e) => set({ odometerKm: e.target.value.replace(/\D/g, "").slice(0, 7) })}
            />
          </label>
          <p className="mt-3 text-sm text-muted-foreground">
            Топливо (деления указателя)
            {kind === "checkout" ? ` · при выдаче: ${fuelText(checkin?.fuel ?? 4)}` : ""}
          </p>
          <div className="mt-1 grid grid-cols-5 gap-1.5">
            {FUEL.map((label, i) => (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => set({ fuel: i })}
                className={`min-h-12 rounded-xl border text-sm font-medium ${f.fuel === i ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-sm text-muted-foreground">
            Пробег по брони
            <select
              className={`${big} mt-1`}
              value={f.kmPlan}
              disabled={locked}
              onChange={(e) => set({ kmPlan: e.target.value as KmPlan })}
            >
              {(Object.keys(KM_PLAN_LABEL) as KmPlan[]).map((k) => (
                <option key={k} value={k}>
                  {KM_PLAN_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        </section>

        {/* ── checklist ── */}
        <section className={card}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Чек-лист</h2>
            {!locked && (
              <button
                type="button"
                className={btn}
                onClick={() =>
                  set({
                    checklist: Object.fromEntries(
                      CHECKLIST.map((c) => [c.key, f.checklist[c.key] ?? true]),
                    ),
                  })
                }
              >
                Остальное «Да»
              </button>
            )}
          </div>
          {(["estado", "equipo"] as const).map((g) => (
            <div key={g} className="mb-2">
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                {g === "estado" ? "Состояние" : "Оснащение"}
              </p>
              <ul className="divide-y divide-border">
                {CHECKLIST.filter((c) => c.group === g).map((c) => (
                  <li key={c.key} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm">
                      {c.ru}
                      {c.key === "bookedExtras" && (
                        <span className="block text-xs text-muted-foreground">
                          {f.extras.length
                            ? f.extras.map((id) => EXTRA_LABELS[id]?.ru || id).join(", ")
                            : "нет опций"}
                        </span>
                      )}
                    </span>
                    <YesNo
                      value={f.checklist[c.key] ?? null}
                      disabled={locked}
                      onChange={(v) => setCheck(c.key, v)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="mb-1 mt-3 text-xs uppercase tracking-wide text-muted-foreground">
            Заказанные опции
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EXTRA_CHOICES.map((id) => {
              const on = f.extras.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  disabled={locked}
                  onClick={() =>
                    set({ extras: on ? f.extras.filter((x) => x !== id) : [...f.extras, id] })
                  }
                  className={`min-h-10 rounded-full border px-3 text-sm ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {EXTRA_LABELS[id]?.ru || id}
                </button>
              );
            })}
          </div>
          {kind === "checkout" && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-sm">Запах табака или животных</span>
              <YesNo value={f.smell} disabled={locked} onChange={(v) => set({ smell: v })} />
            </div>
          )}
        </section>

        {/* ── damage ── */}
        <section className={card}>
          <h2 className={h2}>Повреждения</h2>
          {!locked && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(Object.keys(DAMAGE_TYPES) as DamageType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMarkType(t)}
                  className={`min-h-10 rounded-full border px-3 text-sm ${markType === t ? "border-red-600 bg-red-600 text-white" : "border-border"}`}
                >
                  {DAMAGE_TYPES[t].symbol} {DAMAGE_TYPES[t].ru}
                </button>
              ))}
            </div>
          )}
          {diagram ? (
            <>
              {!locked && (
                <p className="mb-2 text-xs text-muted-foreground">
                  Выберите тип и нажмите на место повреждения на схеме.
                </p>
              )}
              <div
                className="relative mx-auto w-full max-w-md cursor-crosshair select-none overflow-hidden rounded-xl border border-border bg-white"
                style={{ aspectRatio: `${diagram.width} / ${diagram.height}` }}
                onClick={tapDiagram}
              >
                <img
                  src={diagram.path}
                  alt="Схема автодома"
                  className="pointer-events-none h-full w-full"
                  draggable={false}
                />
                {before.map((m, i) => (
                  <span
                    key={`b${m.id}`}
                    className="pointer-events-none absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-400 bg-white/90 text-[10px] font-bold text-gray-500"
                    style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                  >
                    E{i + 1}
                  </span>
                ))}
                {f.marks.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(m.id);
                    }}
                    className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-white/90 text-xs font-bold ${
                      freshIds.has(m.id)
                        ? "border-red-600 text-red-600"
                        : "border-gray-400 text-gray-500"
                    } ${selected === m.id ? "ring-4 ring-red-300" : ""}`}
                    style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </>
          ) : (
            !locked && (
              <button
                type="button"
                className={btn}
                onClick={() => {
                  const m: DamageMark = { id: newId(), x: 0, y: 0, type: markType, note: "" };
                  set({ marks: [...f.marks, m] });
                  setSelected(m.id);
                }}
              >
                + Добавить повреждение
              </button>
            )
          )}

          {before.length > 0 && (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Было при выдаче
              </p>
              <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                {before.map((m, i) => (
                  <li key={m.id}>
                    E{i + 1}. {DAMAGE_TYPES[m.type]?.ru}
                    {m.note ? `: ${m.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="mt-3 space-y-2">
            {f.marks.map((m, i) => (
              <li
                key={m.id}
                className={`rounded-xl border p-2 ${selected === m.id ? "border-red-400" : "border-border"}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-8 shrink-0 text-center font-bold ${freshIds.has(m.id) ? "text-red-600" : "text-gray-500"}`}
                  >
                    {i + 1}
                  </span>
                  <select
                    className="min-h-11 flex-1 rounded-xl border border-border bg-background px-2 text-sm"
                    value={m.type}
                    disabled={locked}
                    onChange={(e) => updateMark(m.id, { type: e.target.value as DamageType })}
                  >
                    {(Object.keys(DAMAGE_TYPES) as DamageType[]).map((t) => (
                      <option key={t} value={t}>
                        {DAMAGE_TYPES[t].ru}
                      </option>
                    ))}
                  </select>
                  {!locked && (
                    <button
                      type="button"
                      className={btn}
                      aria-label="Удалить отметку"
                      onClick={() => deleteMark(m.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  placeholder="Комментарий (необязательно)"
                  value={m.note}
                  maxLength={200}
                  disabled={locked}
                  onFocus={() => setSelected(m.id)}
                  onChange={(e) => updateMark(m.id, { note: e.target.value })}
                />
                {kind === "checkout" && !freshIds.has(m.id) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Совпадает с отметкой акта выдачи
                  </p>
                )}
              </li>
            ))}
            {!f.marks.length && (
              <li className="text-sm text-muted-foreground">
                {kind === "checkout" ? "Новых повреждений нет." : "Повреждений не отмечено."}
              </li>
            )}
          </ul>
        </section>

        {/* ── photos ── */}
        <section className={card}>
          <h2 className={h2}>Фото {acta?.photos.length ? `(${acta.photos.length})` : ""}</h2>
          {!locked && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => void addPhotos(e.target.files)}
              />
              <button
                type="button"
                disabled={!!upload && upload.done < upload.total}
                onClick={() => fileRef.current?.click()}
                className={`${btn} w-full min-h-14 text-base`}
              >
                <Camera className="h-5 w-5" /> Сфотографировать / выбрать
              </button>
            </>
          )}
          {upload && (
            <div className="mt-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(upload.done / upload.total) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {upload.done < upload.total
                  ? `Загружаю ${upload.done + 1} из ${upload.total}…`
                  : `Загружено ${upload.total - upload.failed} из ${upload.total}`}
                {upload.failed ? ` · ошибок: ${upload.failed}` : ""}
              </p>
            </div>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(acta?.photos || []).map((p) => (
              <Thumb
                key={p.id}
                api={api}
                query={`contractId=${contractId}&kind=${kind}&photo=${p.id}`}
                onDelete={locked ? undefined : () => void deletePhoto(p.id)}
              />
            ))}
          </div>
          {acta && acta.photos.length > 12 && (
            <p className="mt-2 text-xs text-muted-foreground">
              В PDF попадут первые 12 фото, остальные хранятся в системе.
            </p>
          )}
        </section>

        {/* ── pets & notes ── */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Животные на борту</h2>
            <YesNo
              value={f.petsOnBoard}
              disabled={locked}
              onChange={(v) => set({ petsOnBoard: v })}
            />
          </div>
          <h2 className={`${h2} mt-4`}>Заметки</h2>
          <textarea
            className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-base"
            value={f.notes}
            maxLength={2000}
            disabled={locked}
            placeholder="Попадут в PDF (на испанском или английском лучше)"
            onChange={(e) => set({ notes: e.target.value })}
          />
        </section>

        {/* ── check-out summary ── */}
        {summary && (
          <section className={`${card} border-primary/40`}>
            <h2 className={h2}>Итог возврата</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Проехал</dt>
              <dd>
                {summary.cmp.kmDriven != null ? `${summary.cmp.kmDriven} км` : "—"} · включено{" "}
                {summary.cmp.kmIncluded == null
                  ? "безлимит"
                  : `${summary.cmp.kmIncluded} км (${summary.cmp.nights} ноч.)`}
                {summary.cmp.kmExtra ? ` · перепробег ${summary.cmp.kmExtra} км` : ""}
              </dd>
              <dt className="text-muted-foreground">Топливо</dt>
              <dd>
                {fuelText(summary.cmp.fuelIn)} → {fuelText(summary.cmp.fuelOut)}
                {summary.cmp.fuelDiff
                  ? ` (${summary.cmp.fuelDiff > 0 ? "+" : ""}${summary.cmp.fuelDiff}/4)`
                  : ""}
              </dd>
              <dt className="text-muted-foreground">Не в порядке</dt>
              <dd>
                {summary.cmp.failedItems
                  .map((k) => CHECKLIST.find((c) => c.key === k)?.ru)
                  .join(", ") || "—"}
              </dd>
              <dt className="text-muted-foreground">Новые повреждения</dt>
              <dd>{summary.cmp.newMarks.length || "—"}</dd>
              <dt className="text-muted-foreground">Опоздание</dt>
              <dd>
                {summary.cmp.lateMinutes
                  ? `${Math.floor(summary.cmp.lateMinutes / 60)} ч ${summary.cmp.lateMinutes % 60} мин`
                  : "—"}
              </dd>
            </dl>
            <p className="mt-3 text-sm font-semibold">Предлагаемые суммы</p>
            {summary.charges.items.length ? (
              <ul className="mt-1 divide-y divide-border text-sm">
                {summary.charges.items.map((it) => (
                  <li key={it.key} className="flex justify-between gap-3 py-1.5">
                    <span>{it.ru}</span>
                    <span className="shrink-0 font-medium">
                      {it.amount != null
                        ? eur(it.amount)
                        : it.max
                          ? `по факту, до ${eur(it.max)}`
                          : "по факту"}
                    </span>
                  </li>
                ))}
                <li className="flex justify-between gap-3 py-1.5 font-semibold">
                  <span>Итого{summary.charges.open ? " + суммы по факту" : ""}</span>
                  <span>{eur(summary.charges.total)}</span>
                </li>
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Ничего.</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Подсказка по тарифам договора. Ничего не списывается автоматически: сумму решает
              владелец, клиенту сначала отправляется обоснование (п. 5.6).
            </p>
          </section>
        )}

        {/* ── signatures ── */}
        {!locked && (
          <section className={card}>
            <h2 className={h2}>Подписи</h2>
            <label className="block text-sm text-muted-foreground">
              Сотрудник (арендодатель)
              <input
                className={`${big} mt-1`}
                value={f.staffName}
                placeholder="Имя и фамилия"
                onChange={(e) => set({ staffName: e.target.value })}
              />
            </label>
            <div className="mt-2">
              <SignaturePad onChange={setSigStaff} />
            </div>
            <label className="mt-4 block text-sm text-muted-foreground">
              Арендатор
              <input
                className={`${big} mt-1`}
                value={f.guestName}
                onChange={(e) => set({ guestName: e.target.value })}
              />
            </label>
            <div className="mt-2">
              <SignaturePad onChange={setSigGuest} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Арендатор подтверждает описание состояния автодома и оснащения в этом акте (п. 3.2
              договора).
            </p>
          </section>
        )}

        {error && <p className="rounded-xl bg-red-600/10 p-3 text-sm text-red-600">{error}</p>}

        {!locked && (
          <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
            {missing.length > 0 && (
              <p className="mb-2 text-xs text-muted-foreground">Не хватает: {missing.join(", ")}</p>
            )}
            <button
              type="button"
              disabled={!!missing.length || signing || (!!upload && upload.done < upload.total)}
              onClick={() => void signAndSend()}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground disabled:opacity-50"
            >
              {signing && <Loader2 className="h-5 w-5 animate-spin" />} Подписать и отправить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
