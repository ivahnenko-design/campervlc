import { useRef, useState } from "react";
import { CheckCircle, ClipboardCheck, Loader2, PenLine, ShieldCheck, Tablet } from "lucide-react";
import { DocPhotos } from "@/components/admin/OwnerSignature";
import { signRuleProblems } from "../../../shared/sign-rules.js";

// Signing in person, at pickup (admin side):
// 1. compare what the guest sent with the original documents, tick every item;
// 2. fill in the check-in report (annex I-A of the contract);
// 3. hand the device to the guest: kiosk page, the guest signs (email code);
// 4. the lessor signs last; only then the PDF is built and sent to both.

type Api = (path: string, init?: RequestInit) => Promise<Response>;

export interface HandoverDetail {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  submission: null | { at: number; data: Record<string, string>; docs: string[] };
  verification: null | {
    at: number;
    by: string;
    name: string;
    data: Record<string, string>;
    edits: { field: string; from: string; to: string }[];
  };
  guestSignature: null | { at: number; ip: string; staff: string };
}

const FIELDS: [string, string, "text" | "date"][] = [
  ["fullName", "Имя и фамилия", "text"],
  ["docNumber", "Номер документа", "text"],
  ["docExpiry", "Документ действителен до", "date"],
  ["birthDate", "Дата рождения", "date"],
  ["nationality", "Гражданство", "text"],
  ["street", "Адрес", "text"],
  ["city", "Город", "text"],
  ["postalCode", "Индекс", "text"],
  ["country", "Страна", "text"],
  ["phone", "Телефон", "text"],
  ["licenseNumber", "Номер прав", "text"],
  ["licenseCountry", "Права выданы (страна)", "text"],
  ["licenseIssued", "Права выданы (дата)", "date"],
  ["licenseBSince", "Категория B с", "date"],
  ["licenseExpiry", "Права действительны до", "date"],
  ["extraDriverName", "Доп. водитель", "text"],
  ["extraDriverDoc", "Документ доп. водителя", "text"],
  ["extraDriverLicense", "Права доп. водителя", "text"],
];
const DOC_TYPES: Record<string, string> = {
  passport: "Паспорт",
  dni: "DNI",
  nie: "NIE",
  id_card: "ID-карта",
};

const CHECKS: [string, string][] = [
  ["name", "Имя и фамилия совпадают с документом"],
  ["document", "Номер документа совпадает, документ подлинный"],
  ["birthDate", "Дата рождения совпадает"],
  ["docExpiry", "Документ действителен на весь срок аренды"],
  ["license", "Права: номер, страна и срок совпадают"],
  ["licenseB", "Категория B — с указанной даты (стаж ≥ 2 лет)"],
  ["address", "Адрес и телефон проверены"],
  ["extraDriver", "Документы доп. водителя проверены"],
];

const ERR: Record<string, string> = {
  checks_required: "Отметьте все пункты сверки.",
  acta_required: "Сначала заполните акт выдачи: пробег и топливо.",
  signature_required: "Нарисуйте подпись арендодателя.",
  not_verified: "Сначала сверьте данные.",
  not_guest_signed: "Клиент ещё не подписал.",
  field_required: "Заполните обязательные поля.",
  date_invalid: "Проверьте даты.",
};

const ts = (t: number) =>
  new Date(t).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60";
const btn =
  "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted";
const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary sm:text-sm";

function Step({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border p-3 ${done ? "border-emerald-600/40 bg-emerald-600/5" : "border-border"}`}
    >
      <h3 className="flex items-center gap-2 font-semibold">
        {done ? (
          <CheckCircle className="h-4 w-4 text-emerald-600" />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
            {n}
          </span>
        )}
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
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
        height={220}
        className="w-full max-w-md touch-none rounded-lg border border-dashed border-border bg-white"
        style={{ aspectRatio: "700 / 220" }}
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
        className="mt-1 text-xs text-muted-foreground underline"
        onClick={() => {
          ref.current?.getContext("2d")?.clearRect(0, 0, 700, 220);
          onChange(null);
        }}
      >
        Стереть
      </button>
    </div>
  );
}

export function HandoverPanel({
  api,
  detail,
  actaState,
  owner,
  ownerHasSignature,
  ownerName,
  onOpenActa,
  onChanged,
  notify,
}: {
  api: Api;
  detail: HandoverDetail;
  actaState?: "draft" | "signed";
  owner: boolean;
  ownerHasSignature: boolean;
  ownerName: string;
  onOpenActa: () => void;
  onChanged: () => void;
  notify: (kind: "ok" | "err", text: string) => void;
}) {
  const sent = detail.verification?.data || detail.submission?.data || {};
  const [data, setData] = useState<Record<string, string>>({ ...sent });
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [sig, setSig] = useState<string | null>(null);
  const [useStored, setUseStored] = useState(owner && ownerHasSignature);
  const [name, setName] = useState("");

  const verified = ["verified", "guest_signed"].includes(detail.status);
  const guestSigned = detail.status === "guest_signed";
  const checkKeys = CHECKS.filter(
    ([k]) => k !== "extraDriver" || (data.extraDriverName || "").trim(),
  );
  const rules = signRuleProblems(data, { startDate: detail.startDate, endDate: detail.endDate });

  async function call(action: string, body: Record<string, unknown> = {}) {
    setBusy(action);
    try {
      const r = await api("", {
        method: "POST",
        body: JSON.stringify({ action, id: detail.id, ...body }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        code?: string;
        error?: string;
        url?: string;
        emailed?: boolean;
      };
      if (!r.ok) {
        notify("err", ERR[j.code || ""] || j.error || "Ошибка");
        return null;
      }
      return j;
    } finally {
      setBusy(null);
    }
  }

  if (!detail.submission) {
    return (
      <p className="rounded-lg bg-muted px-3 py-2 text-sm">
        Клиент ещё не отправил данные и фото документов по своей ссылке. Без них подписание при
        выдаче недоступно — можно переслать ссылку кнопкой «Новая ссылка».
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Step n={1} title="Сверка с оригиналами документов" done={verified}>
        {verified && detail.verification ? (
          <div className="text-sm">
            <p>
              Сверено {ts(detail.verification.at)} ·{" "}
              {detail.verification.name || detail.verification.by}
            </p>
            {detail.verification.edits.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Исправлено:{" "}
                {detail.verification.edits
                  .map((e) => `${e.field}: «${e.from}» → «${e.to}»`)
                  .join("; ")}
              </p>
            )}
            <button
              className={`${btn} mt-2`}
              disabled={!!busy}
              onClick={async () => {
                if (
                  !window.confirm("Вернуть к сверке? Подпись клиента (если есть) будет сброшена.")
                )
                  return;
                if (await call("unverify")) onChanged();
              }}
            >
              Изменить данные
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Клиент отправил {ts(detail.submission.at)}. Возьмите у клиента оригиналы и сравните.
              Опечатку можно исправить прямо здесь — исправление попадёт в журнал.
            </p>
            <div className="mt-2">
              <DocPhotos api={api} id={detail.id} slots={detail.submission.docs} />
            </div>
            <label className="mt-3 block text-sm">
              <span className="mb-1 block text-muted-foreground">Тип документа</span>
              <select
                className={inputCls}
                value={data.docType || ""}
                onChange={(e) => setData({ ...data, docType: e.target.value })}
              >
                {Object.entries(DOC_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {FIELDS.map(([k, label, type]) => {
                const rule = rules.find((p) => p.field === k);
                const changed = (sent[k] || "") !== (data[k] || "");
                return (
                  <label key={k} className="block text-sm">
                    <span
                      className={`mb-1 block ${rule ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {label}
                      {changed && <span className="ml-1 text-amber-600">· исправлено</span>}
                    </span>
                    <input
                      className={`${inputCls} ${rule ? "border-destructive" : ""}`}
                      type={type}
                      value={data[k] || ""}
                      onChange={(e) => setData({ ...data, [k]: e.target.value })}
                    />
                  </label>
                );
              })}
            </div>
            {rules.length > 0 && (
              <p className="mt-2 text-sm text-destructive">
                Не проходят условия аренды: {rules.map((r) => `${r.field} (${r.code})`).join(", ")}
              </p>
            )}
            <div className="mt-3 space-y-1.5 text-sm">
              {checkKeys.map(([k, label]) => (
                <label key={k} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={!!checks[k]}
                    onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <button
              className={`${btnPrimary} mt-3`}
              disabled={!!busy || checkKeys.some(([k]) => !checks[k]) || rules.length > 0}
              onClick={async () => {
                if (await call("verify", { data, checks })) {
                  notify("ok", "Данные сверены с оригиналами.");
                  onChanged();
                }
              }}
            >
              {busy === "verify" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Данные сверены с оригиналами
            </button>
          </>
        )}
      </Step>

      <Step n={2} title="Акт выдачи (приложение I-A договора)" done={guestSigned}>
        <p className="text-xs text-muted-foreground">
          Пробег, топливо, галочки, повреждения на чертеже машины и неисправности внутри — словами в
          поле «Заметки». Всё это впечатается в страницу 14 договора.{" "}
          {guestSigned && "Клиент подписал — акт зафиксирован."}
        </p>
        {!guestSigned && (
          <button className={`${btn} mt-2`} onClick={onOpenActa}>
            <ClipboardCheck className="h-4 w-4" />{" "}
            {actaState ? "Открыть акт выдачи" : "Заполнить акт выдачи"}
          </button>
        )}
      </Step>

      <Step n={3} title="Подпись клиента на этом устройстве" done={guestSigned}>
        {guestSigned && detail.guestSignature ? (
          <p className="text-sm">Клиент подписал {ts(detail.guestSignature.at)}.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Откроется страница договора на языке клиента: проверенные данные, текст договора,
              заполненный акт, согласия, подпись пальцем и код из письма клиенту. Передайте
              устройство клиенту.
            </p>
            <button
              className={`${btnPrimary} mt-2`}
              disabled={!verified || !!busy}
              onClick={async () => {
                const j = await call("kiosk");
                if (j?.url) window.location.assign(j.url);
              }}
            >
              {busy === "kiosk" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Tablet className="h-4 w-4" />
              )}
              Дать клиенту на подпись
            </button>
          </>
        )}
      </Step>

      <Step n={4} title="Ваша подпись (арендодатель)">
        {!guestSigned ? (
          <p className="text-xs text-muted-foreground">Станет доступна после подписи клиента.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              После вашей подписи договор собирается в PDF и уходит на почту клиенту и вам,
              появляется в кабинете клиента и здесь.
            </p>
            {owner && ownerHasSignature && (
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useStored}
                  onChange={(e) => setUseStored(e.target.checked)}
                />
                Поставить сохранённую подпись ({ownerName})
              </label>
            )}
            {!owner && (
              <label className="mt-2 block text-sm">
                <span className="mb-1 block text-muted-foreground">Имя подписанта</span>
                <input
                  className={inputCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}
            {!useStored && (
              <div className="mt-2">
                <Pad onChange={setSig} />
              </div>
            )}
            <button
              className={`${btnPrimary} mt-2`}
              disabled={!!busy || (!useStored && !sig) || (!owner && name.trim().length < 2)}
              onClick={async () => {
                const j = await call("countersign", {
                  ...(useStored ? {} : { signature: sig }),
                  name,
                });
                if (j) {
                  notify(
                    "ok",
                    j.emailed
                      ? "Договор подписан обеими сторонами и отправлен клиенту и вам."
                      : "Договор подписан, но письмо не ушло — скачайте PDF и отправьте вручную.",
                  );
                  onChanged();
                }
              }}
            >
              {busy === "countersign" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PenLine className="h-4 w-4" />
              )}
              Подписать договор
            </button>
          </>
        )}
      </Step>
    </div>
  );
}
