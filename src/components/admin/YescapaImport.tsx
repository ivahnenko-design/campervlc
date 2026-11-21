// Admin: add a Yescapa booking from a screenshot or copied page text, and the
// list of Yescapa booking emails that arrived through the Gmail forwarder.
import { useCallback, useRef, useState } from "react";
import { ClipboardPaste, Copy, ImageUp, Loader2, Mail, X } from "lucide-react";
import { parseYescapaBooking } from "../../../shared/yescapa-parse.js";

export interface Parsed {
  guestName?: string;
  email?: string;
  phone?: string;
  startDate?: string;
  endDate?: string;
  pickupTime?: string;
  returnTime?: string;
  travellers?: number;
  payout?: number;
  total?: number;
  yescapaRef?: string;
  language?: string;
  found: string[];
}

export interface ImportDraft {
  id: string;
  receivedAt: number;
  subject: string;
  parsed: Parsed;
}

const NEEDED: [keyof Parsed, string][] = [
  ["guestName", "имя"],
  ["email", "email"],
  ["phone", "телефон"],
  ["startDate", "дата выдачи"],
  ["endDate", "дата возврата"],
  ["yescapaRef", "номер брони"],
];

export function missingFields(p: Parsed) {
  return NEEDED.filter(([k]) => !p[k]).map(([, label]) => label);
}

/** Contract form values from a parsed Yescapa booking. */
export function formFromParsed(p: Parsed) {
  const price = p.total ?? p.payout;
  return {
    guestName: p.guestName || "",
    email: p.email || "",
    phone: p.phone || "",
    source: "yescapa",
    language: p.language || "es",
    startDate: p.startDate || "",
    endDate: p.endDate || "",
    pickupTime: p.pickupTime || "10:00",
    returnTime: p.returnTime || "10:00",
    priceTotal: price != null ? String(price) : "",
    bookingRef: p.yescapaRef ? `YES-${p.yescapaRef}` : "",
  };
}

const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50";

async function ocr(file: Blob, onProgress: (p: number) => void) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["spa", "eng"], 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress(m.progress);
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text as string;
  } finally {
    await worker.terminate();
  }
}

export function YescapaPaste({ onParsed, onClose }: { onParsed: (p: Parsed) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fromImage = useCallback(
    async (file: Blob) => {
      setErr(null);
      setBusy(0);
      try {
        const t = await ocr(file, (p) => setBusy(p));
        setText(t);
        onParsed(parseYescapaBooking(t) as Parsed);
      } catch {
        setErr("Не удалось распознать картинку. Скопируйте текст страницы Yescapa (Cmd+A, Cmd+C) и вставьте сюда.");
      } finally {
        setBusy(null);
      }
    },
    [onParsed],
  );

  return (
    <div
      className="rounded-xl border border-border p-4"
      onPaste={(e) => {
        const img = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
        if (img) {
          e.preventDefault();
          const f = img.getAsFile();
          if (f) void fromImage(f);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = [...e.dataTransfer.files].find((x) => x.type.startsWith("image/"));
        if (f) void fromImage(f);
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Заказ с Yescapa</h2>
        <button type="button" onClick={onClose} aria-label="Закрыть">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Откройте бронь на Yescapa и вставьте сюда скриншот (Cmd+V) или перетащите файл. Можно и текст страницы:
        Cmd+A, Cmd+C на странице брони, затем Cmd+V сюда. Текст распознаётся точнее.
      </p>
      <textarea
        id="yescapa-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Вставьте скриншот или текст брони Yescapa"
        className="mt-3 w-full rounded-lg border border-border bg-background p-2 text-sm"
      />
      {busy !== null && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Распознаю скриншот… {Math.round(busy * 100)}%
        </p>
      )}
      {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={!text.trim() || busy !== null} onClick={() => onParsed(parseYescapaBooking(text) as Parsed)}>
          <ClipboardPaste className="h-4 w-4" /> Заполнить договор из текста
        </button>
        <button type="button" className={btn} disabled={busy !== null} onClick={() => fileRef.current?.click()}>
          <ImageUp className="h-4 w-4" /> Выбрать скриншот
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void fromImage(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

export function ImportsPanel({
  imports,
  onUse,
  onDismiss,
}: {
  imports: ImportDraft[];
  onUse: (d: ImportDraft) => void;
  onDismiss: (d: ImportDraft) => void;
}) {
  if (!imports.length) return null;
  return (
    <section className="mt-5 rounded-xl border border-primary/40 bg-primary/5 p-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Mail className="h-4 w-4" /> Новые брони Yescapa из почты ({imports.length})
      </h2>
      <ul className="mt-2 space-y-2 text-sm">
        {imports.map((d) => {
          const p = d.parsed;
          const miss = missingFields(p);
          return (
            <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-background/60 p-2">
              <span className="font-medium">{p.guestName || "Без имени"}</span>
              <span className="text-muted-foreground">
                {p.startDate || "?"} → {p.endDate || "?"}
                {p.yescapaRef ? ` · #${p.yescapaRef}` : ""}
              </span>
              {miss.length > 0 && <span className="text-xs text-amber-500">не найдено: {miss.join(", ")}</span>}
              <span className="ml-auto flex gap-2">
                <button type="button" className={btn} onClick={() => onUse(d)}>
                  Создать договор
                </button>
                <button type="button" className={btn} onClick={() => onDismiss(d)} aria-label="Скрыть">
                  <X className="h-4 w-4" />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function GmailSetup({ setup, onCopied }: { setup: { key: string; script: string } | null; onCopied: () => void }) {
  if (!setup) return null;
  return (
    <details className="mt-4 rounded-xl border border-border p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Автоимпорт броней Yescapa из Gmail</summary>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
        <li>Откройте script.google.com под тем Gmail, куда приходят письма Yescapa, и нажмите «Новый проект».</li>
        <li>Удалите всё в редакторе и вставьте код ниже (кнопка «Копировать»).</li>
        <li>Сохраните, выберите функцию «setup» и нажмите «Выполнить». Google попросит доступ к почте: разрешите.</li>
        <li>Готово: каждые 10 минут новые письма Yescapa о бронях появятся здесь, в блоке «Новые брони Yescapa».</li>
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">В коде есть секретный ключ. Никому не передавайте этот код.</p>
      <div className="mt-2 flex gap-2">
        <textarea readOnly value={setup.script} rows={6} className="w-full rounded-md border border-border bg-background p-2 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
        <button
          type="button"
          className={btn}
          onClick={() => {
            void navigator.clipboard?.writeText(setup.script).catch(() => {});
            onCopied();
          }}
        >
          <Copy className="h-4 w-4" /> Копировать
        </button>
      </div>
    </details>
  );
}
