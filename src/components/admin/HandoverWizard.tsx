import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, FileText, Loader2, X } from "lucide-react";
import { CHECK_TEXT } from "@/components/sign-check-text";
import { signRuleProblems } from "../../../shared/sign-rules.js";

// Pickup, one step per screen (phone first). Everything typed or photographed
// is saved on the server right away, so leaving the screen never loses work:
//   1 documents (photos)  2 guest data (checked against the originals)
//   3 camper (check-in report = annex I-A)  4 guest signs on this device
//   5 the lessor signs -> the PDF is built and sent to both.

type Api = (path: string, init?: RequestInit) => Promise<Response>;

interface Detail {
  id: string;
  status: string;
  guestName: string;
  phone: string;
  language: string;
  startDate: string;
  endDate: string;
  submission: null | {
    at: number;
    data: Record<string, string>;
    docs: string[];
    byStaff?: string | null;
  };
  verification: null | { at: number; name: string; by: string; data: Record<string, string> };
  guestSignature: null | { at: number };
  staffDraft: Record<string, string> | null;
}
interface ActaInfo {
  odometerKm: number | null;
  fuel: number | null;
  marks: unknown[];
  notes: string;
  photos: unknown[];
}

const STEPS = ["Документы", "Данные", "Автодом", "Клиент", "Вы"];
const DOC_TYPES: [string, string][] = [
  ["passport", "Паспорт"],
  ["dni", "DNI"],
  ["nie", "NIE / TIE"],
  ["id_card", "ID-карта"],
];
const SLOT_LABEL: Record<string, string> = {
  idFront: "Документ: сторона с фото",
  idBack: "Документ: оборот",
  licenseFront: "Права: лицевая",
  licenseBack: "Права: оборот",
};
const slotsFor = (docType: string) =>
  docType === "passport"
    ? ["idFront", "licenseFront", "licenseBack"]
    : ["idFront", "idBack", "licenseFront", "licenseBack"];

type F = [key: string, label: string, type: "text" | "date" | "tel", optional?: boolean];
const GROUPS: [string, F[]][] = [
  [
    "Клиент",
    [
      ["fullName", "Имя и фамилия (как в документе)", "text"],
      ["birthDate", "Дата рождения", "date"],
      ["nationality", "Гражданство", "text"],
      ["docNumber", "Номер документа", "text"],
      ["docExpiry", "Документ действителен до", "date"],
    ],
  ],
  [
    "Адрес и телефон",
    [
      ["phone", "Телефон", "tel"],
      ["street", "Улица и дом", "text"],
      ["city", "Город", "text"],
      ["postalCode", "Индекс", "text"],
      ["country", "Страна", "text"],
    ],
  ],
  [
    "Водительские права",
    [
      ["licenseCountry", "Страна выдачи", "text"],
      ["licenseIssued", "Дата выдачи", "date"],
      ["licenseBSince", "Категория B с", "date"],
      ["licenseExpiry", "Действительны до", "date"],
      ["licenseNumber", "Номер прав", "text", true],
    ],
  ],
];
const EXTRA_DRIVER: F[] = [
  ["extraDriverName", "Имя и фамилия", "text", true],
  ["extraDriverDoc", "Номер документа", "text", true],
  ["extraDriverLicense", "Номер прав", "text", true],
];
const REQUIRED = GROUPS.flatMap(([, fs]) => fs.filter((f) => !f[3]));
const ALL_KEYS = [
  ...GROUPS.flatMap(([, fs]) => fs.map((f) => f[0])),
  ...EXTRA_DRIVER.map((f) => f[0]),
  "docType",
  "surname",
];
const ALL_CHECKS = {
  name: true,
  document: true,
  birthDate: true,
  docExpiry: true,
  license: true,
  licenseB: true,
  address: true,
  extraDriver: true,
};
const FUEL = ["пусто", "¼", "½", "¾", "полный"];

const ERR: Record<string, string> = {
  acta_required: "Сначала укажите пробег и топливо в акте выдачи.",
  signature_required: "Нарисуйте подпись.",
  docs_required: "Не хватает фото документов (шаг 1).",
  field_required: "Заполните все обязательные поля.",
  date_invalid: "Проверьте даты.",
  conflict: "Данные изменились, попробуйте ещё раз.",
};
const RULES = CHECK_TEXT.ru.rules as Record<string, string>;

const inputCls =
  "min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary";
const primary =
  "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground disabled:opacity-50";
const secondary =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 text-base font-medium";
const card = "rounded-2xl border border-border p-4";

/** Photo -> JPEG data URL, longest side at most 1600 px (the server takes up to 3 MB). */
async function toJpeg(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("bad image"));
      i.src = url;
    });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Pad({ onChange }: { onChange: (png: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const point = (e: React.PointerEvent) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  };
  return (
    <div>
      <canvas
        ref={ref}
        width={700}
        height={260}
        className="w-full touch-none rounded-xl border border-dashed border-border bg-white"
        style={{ aspectRatio: "700 / 260" }}
        onPointerDown={(e) => {
          try {
            ref.current?.setPointerCapture(e.pointerId);
          } catch {
            /* synthetic or finished pointer */
          }
          drawing.current = true;
          last.current = point(e);
        }}
        onPointerMove={(e) => {
          if (!drawing.current || !last.current) return;
          const ctx = ref.current!.getContext("2d")!;
          const p = point(e);
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#0b1b3a";
          ctx.beginPath();
          ctx.moveTo(last.current.x, last.current.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          last.current = p;
        }}
        onPointerUp={() => {
          if (drawing.current) onChange(ref.current!.toDataURL("image/png"));
          drawing.current = false;
        }}
        onPointerLeave={() => (drawing.current = false)}
      />
      <button
        type="button"
        className="mt-1 text-sm text-muted-foreground underline"
        onClick={() => {
          ref.current?.getContext("2d")?.clearRect(0, 0, 700, 260);
          onChange(null);
        }}
      >
        Стереть
      </button>
    </div>
  );
}

export function HandoverWizard({
  api,
  actaApi,
  contractId,
  owner,
  ownerHasSignature,
  ownerName,
  onOpenActa,
  onPdf,
  onClose,
}: {
  api: Api;
  actaApi: Api;
  contractId: string;
  owner: boolean;
  ownerHasSignature: boolean;
  ownerName: string;
  onOpenActa: () => void;
  onPdf: () => void;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [acta, setActa] = useState<ActaInfo | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [sig, setSig] = useState<string | null>(null);
  const [useStored, setUseStored] = useState(owner && ownerHasSignature);
  const [name, setName] = useState("");
  const [done, setDone] = useState<{ emailed: boolean } | null>(null);
  const dirty = useRef(false);
  const madeUrls = useRef<string[]>([]);

  const status = detail?.status || "";
  const open = status === "pending" || status === "submitted";
  const docType = data.docType || "passport";
  const slots = slotsFor(docType);
  const docsDone = slots.every((s) => photos[s]);
  const actaReady = !!acta && Number.isInteger(acta.odometerKm) && Number.isInteger(acta.fuel);

  // ── load: contract, document photos, check-in report ──
  const load = useCallback(
    async (jump: boolean) => {
      const [dr, ar] = await Promise.all([
        api(`id=${contractId}&detail=1`),
        actaApi(`contractId=${contractId}`),
      ]);
      if (!dr.ok)
        return setError("Не удалось открыть договор. Проверьте связь и попробуйте ещё раз.");
      const d = ((await dr.json()) as { contract: Detail }).contract;
      const a = ar.ok ? ((await ar.json()) as { checkin: ActaInfo | null }).checkin : null;
      const found: Record<string, string> = {};
      await Promise.all(
        ["idFront", "idBack", "licenseFront", "licenseBack"].map(async (slot) => {
          const r = await api(`id=${contractId}&doc=${slot}`).catch(() => null);
          if (!r?.ok) return;
          const u = URL.createObjectURL(await r.blob());
          madeUrls.current.push(u);
          found[slot] = u;
        }),
      );
      const initial: Record<string, string> = {
        docType: found.idBack ? "dni" : "passport",
        fullName: d.guestName,
        phone: d.phone || "",
        ...(d.submission?.data || {}),
        ...(d.staffDraft || {}),
        ...(d.verification?.data || {}),
      };
      setDetail(d);
      setActa(a);
      setPhotos(found);
      setData(initial);
      setShowExtra(!!initial.extraDriverName);
      if (jump) {
        const haveDocs = slotsFor(initial.docType).every((s) => found[s]);
        const ready = !!a && Number.isInteger(a.odometerKm) && Number.isInteger(a.fuel);
        setStep(
          d.status === "guest_signed" || d.status === "signed"
            ? 4
            : d.status === "verified"
              ? ready
                ? 3
                : 2
              : haveDocs
                ? 1
                : 0,
        );
        if (d.status === "signed") setDone({ emailed: true });
      }
      // Photos are there but nothing typed yet (e.g. the form was lost before):
      // read the passport / ID zone again from the saved photos.
      if (
        (d.status === "pending" || d.status === "submitted") &&
        !(initial.docNumber || "").trim() &&
        found.idFront
      ) {
        void (async () => {
          try {
            const asData = async (u: string) => {
              const blob = await (await fetch(u)).blob();
              return await new Promise<string>((resolve) => {
                const fr = new FileReader();
                fr.onload = () => resolve(String(fr.result));
                fr.readAsDataURL(blob);
              });
            };
            const shots = await Promise.all(
              [found.idBack, found.idFront].filter(Boolean).map(asData),
            );
            const { readMrz } = await import("@/components/mrz-reader");
            const f = await readMrz(shots);
            if (!f) return;
            dirty.current = true;
            setData((cur) => {
              const out = { ...cur };
              for (const [k, v] of Object.entries(f)) {
                if (k !== "docType" && v && (!(cur[k] || "").trim() || k === "fullName"))
                  out[k] = v;
              }
              return out;
            });
          } catch {
            /* typed by hand then */
          }
        })();
      }
    },
    [api, actaApi, contractId],
  );
  useEffect(() => {
    void load(true);
    const urls = madeUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [load]);

  // Every step opens from the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // ── autosave of what staff type (server side, survives leaving the screen) ──
  useEffect(() => {
    if (!dirty.current || !open) return;
    setSaved("saving");
    const t = setTimeout(() => {
      dirty.current = false;
      api("", { method: "POST", body: JSON.stringify({ action: "draft", id: contractId, data }) })
        .then((r) => setSaved(r.ok ? "saved" : "idle"))
        .catch(() => setSaved("idle"));
    }, 700);
    return () => clearTimeout(t);
  }, [data, open, api, contractId]);

  const set = (k: string, v: string) => {
    dirty.current = true;
    setData((d) => ({ ...d, [k]: v }));
  };

  async function call(action: string, body: Record<string, unknown> = {}) {
    setBusy(action);
    setError(null);
    try {
      const r = await api("", {
        method: "POST",
        body: JSON.stringify({ action, id: contractId, ...body }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        code?: string;
        error?: string;
        url?: string;
        emailed?: boolean;
      };
      if (!r.ok) {
        setError(
          ERR[j.code || ""] || RULES[j.code || ""] || j.error || "Ошибка. Попробуйте ещё раз.",
        );
        return null;
      }
      return j;
    } catch {
      setError("Нет связи. Попробуйте ещё раз.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function takePhoto(slot: string, file: File | undefined) {
    if (!file) return;
    setBusy(slot);
    setError(null);
    try {
      const image = await toJpeg(file);
      if (!open) {
        setError(
          "Данные уже сверены. Чтобы заменить фото, вернитесь на шаг «Данные» и нажмите «Изменить».",
        );
        return;
      }
      const r = await api("", {
        method: "POST",
        body: JSON.stringify({ action: "doc", id: contractId, slot, image }),
      });
      if (!r.ok) {
        setError("Фото не сохранилось. Попробуйте ещё раз.");
        return;
      }
      const next = { ...photos, [slot]: image };
      setPhotos(next);
      // The machine-readable zone of the passport / ID fills the empty fields.
      if ((slot === "idFront" || slot === "idBack") && next.idFront?.startsWith("data:")) {
        const { readMrz } = await import("@/components/mrz-reader");
        const shots = [next.idBack, next.idFront].filter(
          (s): s is string => !!s && s.startsWith("data:"),
        );
        const f = await readMrz(shots).catch(() => null);
        if (f) {
          dirty.current = true;
          setData((d) => {
            const out = { ...d };
            for (const [k, v] of Object.entries(f)) {
              if (k !== "docType" && v && (!(d[k] || "").trim() || k === "fullName")) out[k] = v;
            }
            return out;
          });
        }
      }
    } catch {
      setError("Не удалось прочитать фото. Попробуйте ещё раз.");
    } finally {
      setBusy(null);
    }
  }

  const rules = useMemo(
    () =>
      detail
        ? signRuleProblems(data, { startDate: detail.startDate, endDate: detail.endDate })
        : [],
    [data, detail],
  );
  const missing = REQUIRED.filter(([k]) => !(data[k] || "").trim());
  const changedSinceVerify =
    !!detail?.verification &&
    ALL_KEYS.some((k) => (detail.verification!.data[k] || "") !== (data[k] || "").trim());

  async function confirmData() {
    if (!detail) return;
    if (!open && !changedSinceVerify) return setStep(2);
    if (missing.length || rules.length || !confirmed) {
      setTried(true);
      setError(
        missing.length
          ? `Не заполнено: ${missing.map((f) => f[1]).join(", ")}`
          : rules.length
            ? RULES[rules[0].code] || "Проверьте поля, отмеченные красным."
            : "Отметьте, что сверили данные с оригиналами.",
      );
      return;
    }
    if (status === "guest_signed") {
      if (
        !window.confirm(
          "Клиент уже подписал. Если изменить данные, ему придётся подписать заново. Продолжить?",
        )
      )
        return;
      if (!(await call("unverify"))) return;
    }
    const clean: Record<string, string> = {};
    for (const k of ALL_KEYS) clean[k] = (data[k] || "").trim();
    if (!showExtra) for (const [k] of EXTRA_DRIVER) clean[k] = "";
    if (await call("verify", { data: clean, checks: ALL_CHECKS, name })) {
      await load(false);
      setStep(2);
    }
  }

  // ── screens ──
  if (!detail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-foreground">
        {error ? (
          <p className="text-center text-sm text-destructive">{error}</p>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin" />
        )}
        <button className={secondary} onClick={onClose}>
          Назад
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 bg-background p-6 text-center text-foreground">
        <Check className="mx-auto h-14 w-14 rounded-full bg-emerald-600 p-3 text-white" />
        <h1 className="font-display text-2xl">Договор подписан</h1>
        <p className="text-sm text-muted-foreground">
          {done.emailed
            ? "PDF отправлен клиенту и вам на почту. Он также в кабинете клиента."
            : "Письмо не ушло — откройте PDF и отправьте клиенту вручную."}
        </p>
        <button className={primary} onClick={onPdf}>
          <FileText className="h-5 w-5" /> Открыть PDF
        </button>
        <button className={secondary} onClick={onClose}>
          Готово
        </button>
      </div>
    );
  }

  const field = ([k, label, type, optional]: F) => {
    const rule = (data[k] || "").trim() ? rules.find((p) => p.field === k) : undefined;
    const bad = (tried && !optional && !(data[k] || "").trim()) || !!rule;
    return (
      <label key={k} className="block">
        <span
          className={`mb-1 block text-sm ${bad ? "text-destructive" : "text-muted-foreground"}`}
        >
          {label}
        </span>
        <input
          className={`${inputCls} ${bad ? "border-destructive" : ""}`}
          type={type}
          value={data[k] || ""}
          autoComplete="off"
          autoCapitalize={k === "docNumber" || k === "licenseNumber" ? "characters" : undefined}
          onChange={(e) => set(k, e.target.value)}
        />
        {rule && (
          <span className="mt-1 block text-xs text-destructive">
            {RULES[rule.code] || rule.code}
          </span>
        )}
      </label>
    );
  };

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background pb-32 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 pb-3 pt-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">Выдача · {detail.guestName}</h1>
            <p className="text-xs text-muted-foreground">
              Шаг {step + 1} из 5 · {STEPS[step]}
              {saved === "saving" ? " · сохраняем…" : saved === "saved" ? " · сохранено" : ""}
            </p>
          </div>
          <button
            aria-label="Закрыть"
            onClick={onClose}
            className="rounded-full border border-border p-2.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
        {step === 0 && (
          <>
            <section className={card}>
              <h2 className="font-semibold">Какой документ у клиента?</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DOC_TYPES.map(([k, label]) => (
                  <button
                    key={k}
                    disabled={!open}
                    onClick={() => set("docType", k)}
                    className={`min-h-12 rounded-xl border text-base ${docType === k ? "border-primary bg-primary/15 font-semibold text-primary" : "border-border"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
            <section className={card}>
              <h2 className="font-semibold">Сфотографируйте документы</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Нажмите на рамку. Фото сохраняется сразу; с паспорта или ID данные заполнятся сами.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {slots.map((slot) => (
                  <label key={slot} className="block cursor-pointer">
                    <span className="mb-1 flex min-h-8 items-end text-xs text-muted-foreground">
                      {SLOT_LABEL[slot]}
                    </span>
                    {photos[slot] ? (
                      <span className="relative block">
                        <img
                          src={photos[slot]}
                          alt=""
                          className="h-28 w-full rounded-xl border-2 border-emerald-600 object-cover"
                        />
                        <Check className="absolute right-1.5 top-1.5 h-6 w-6 rounded-full bg-emerald-600 p-1 text-white" />
                      </span>
                    ) : (
                      <span className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground">
                        {busy === slot ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Camera className="h-7 w-7" />
                        )}
                        {busy === slot ? "Сохраняем…" : "Снять"}
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        void takePhoto(slot, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                ))}
              </div>
              {detail.submission && !detail.submission.byStaff && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Эти фото клиент прислал сам. Сравните их с оригиналами.
                </p>
              )}
            </section>
          </>
        )}

        {step === 1 && (
          <>
            {!open && !changedSinceVerify && (
              <p className="rounded-xl border border-emerald-600/40 bg-emerald-600/10 px-3 py-2 text-sm">
                Данные сверены. Можно исправить поле ниже — тогда подтвердите сверку ещё раз.
              </p>
            )}
            {GROUPS.map(([title, fields]) => (
              <section key={title} className={card}>
                <h2 className="font-semibold">{title}</h2>
                <div className="mt-3 space-y-3">{fields.map(field)}</div>
              </section>
            ))}
            <section className={card}>
              <label className="flex items-center justify-between gap-3">
                <span className="font-semibold">Есть второй водитель</span>
                <input
                  type="checkbox"
                  className="h-6 w-6"
                  checked={showExtra}
                  onChange={(e) => setShowExtra(e.target.checked)}
                />
              </label>
              {showExtra && <div className="mt-3 space-y-3">{EXTRA_DRIVER.map(field)}</div>}
            </section>
            {!owner && (
              <section className={card}>
                <label className="block">
                  <span className="mb-1 block text-sm text-muted-foreground">
                    Ваше имя (кто сверил)
                  </span>
                  <input
                    className={inputCls}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              </section>
            )}
            {(open || changedSinceVerify) && (
              <label
                className={`flex items-start gap-3 rounded-2xl border p-4 ${tried && !confirmed ? "border-destructive" : "border-primary/50 bg-primary/5"}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-6 w-6 shrink-0"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span className="text-base">
                  Я держал(а) в руках оригиналы документов: данные и фото с ними совпадают.
                </span>
              </label>
            )}
          </>
        )}

        {step === 2 && (
          <section className={card}>
            <h2 className="font-semibold">Акт выдачи автодома</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Пробег, топливо, повреждения на схеме, неисправности внутри. Попадёт на стр. 14
              договора — клиент увидит это перед подписью.
            </p>
            {acta ? (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-base">
                <dt className="text-muted-foreground">Пробег</dt>
                <dd>
                  {acta.odometerKm != null
                    ? `${acta.odometerKm.toLocaleString("ru-RU")} км`
                    : "— не указан"}
                </dd>
                <dt className="text-muted-foreground">Топливо</dt>
                <dd>{acta.fuel != null ? FUEL[acta.fuel] : "— не указано"}</dd>
                <dt className="text-muted-foreground">Повреждения</dt>
                <dd>{acta.marks.length ? `${acta.marks.length} отметок` : "нет отметок"}</dd>
                <dt className="text-muted-foreground">Фото</dt>
                <dd>{acta.photos.length || "нет"}</dd>
              </dl>
            ) : (
              <p className="mt-3 text-base">Ещё не заполнен.</p>
            )}
            {status !== "guest_signed" && (
              <button className={`${actaReady ? secondary : primary} mt-4`} onClick={onOpenActa}>
                {acta ? "Изменить акт" : "Заполнить акт"}
              </button>
            )}
          </section>
        )}

        {step === 3 && (
          <section className={card}>
            {status === "guest_signed" ? (
              <>
                <h2 className="flex items-center gap-2 font-semibold">
                  <Check className="h-5 w-5 text-emerald-600" /> Клиент подписал
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Осталась ваша подпись.</p>
              </>
            ) : (
              <>
                <h2 className="font-semibold">Подпись клиента</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Откроется договор на языке клиента ({detail.language.toUpperCase()}). Передайте
                  ему телефон: он пролистает договор, проверит данные и акт, распишется пальцем.
                  Потом вернёт телефон вам.
                </p>
                <button
                  className={`${primary} mt-4`}
                  disabled={!!busy}
                  onClick={async () => {
                    const j = await call("kiosk");
                    if (j?.url) window.location.assign(j.url);
                  }}
                >
                  {busy === "kiosk" && <Loader2 className="h-5 w-5 animate-spin" />} Передать
                  телефон клиенту
                </button>
              </>
            )}
          </section>
        )}

        {step === 4 && (
          <section className={card}>
            <h2 className="font-semibold">Ваша подпись</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              После неё договор соберётся в PDF и уйдёт на почту клиенту и вам.
            </p>
            {owner && ownerHasSignature && (
              <label className="mt-3 flex items-center gap-3 text-base">
                <input
                  type="checkbox"
                  className="h-6 w-6"
                  checked={useStored}
                  onChange={(e) => setUseStored(e.target.checked)}
                />
                Поставить мою сохранённую подпись ({ownerName})
              </label>
            )}
            {!owner && (
              <label className="mt-3 block">
                <span className="mb-1 block text-sm text-muted-foreground">Ваше имя и фамилия</span>
                <input
                  className={inputCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}
            {!useStored && (
              <div className="mt-3">
                <Pad onChange={setSig} />
              </div>
            )}
          </section>
        )}

        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* ── bottom bar: one main action per step ── */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl gap-2 px-4 py-3">
          {step > 0 && (
            <button
              aria-label="Назад"
              className="flex min-h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border"
              onClick={() => {
                setError(null);
                setStep(step - 1);
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {step === 0 && (
            <button
              className={primary}
              disabled={!!busy}
              onClick={() => {
                if (!docsDone)
                  return setError("Сфотографируйте все документы — остались пустые рамки.");
                setError(null);
                setStep(1);
              }}
            >
              Далее: данные клиента
            </button>
          )}
          {step === 1 && (
            <button className={primary} disabled={!!busy} onClick={() => void confirmData()}>
              {busy && <Loader2 className="h-5 w-5 animate-spin" />}
              {!open && !changedSinceVerify ? "Далее: автодом" : "Данные верны — далее"}
            </button>
          )}
          {step === 2 && (
            <button
              className={primary}
              onClick={() => {
                if (!actaReady) return setError("Укажите в акте пробег и топливо.");
                setError(null);
                setStep(status === "guest_signed" ? 4 : 3);
              }}
            >
              Далее: подпись клиента
            </button>
          )}
          {step === 3 && status === "guest_signed" && (
            <button className={primary} onClick={() => setStep(4)}>
              Далее: ваша подпись
            </button>
          )}
          {step === 4 && (
            <button
              className={primary}
              disabled={
                !!busy ||
                status !== "guest_signed" ||
                (!useStored && !sig) ||
                (!owner && name.trim().length < 2)
              }
              onClick={async () => {
                const j = await call("countersign", {
                  ...(useStored ? {} : { signature: sig }),
                  name,
                });
                if (j) setDone({ emailed: !!j.emailed });
              }}
            >
              {busy === "countersign" && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === "guest_signed"
                ? "Подписать и отправить договор"
                : "Сначала подпись клиента"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
