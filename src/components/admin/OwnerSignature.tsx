import { useEffect, useRef, useState } from "react";

// The company's signature, drawn once by the owner. It is stamped on every
// contract signed from then on, next to the name (CONTRACT_OWNER_SIGNER,
// "Ivakhnenko Sergii" by default).

type Api = (path: string, init?: RequestInit) => Promise<Response>;

export function OwnerSignature({
  api,
  has,
  name,
  onSaved,
}: {
  api: Api;
  has: boolean;
  name: string;
  onSaved: (ok: boolean) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [ink, setInk] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!has && !version) return;
    let url: string | null = null;
    api("view=owner-signature")
      .then(async (r) => {
        if (!r.ok) return;
        url = URL.createObjectURL(await r.blob());
        setCurrent(url);
      })
      .catch(() => {});
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [api, has, version]);

  const point = (e: React.PointerEvent) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  };
  const down = (e: React.PointerEvent) => {
    ref.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext("2d")!;
    const p = point(e);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0b1f4d";
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    setInk(true);
  };
  const up = () => {
    drawing.current = false;
    last.current = null;
  };
  const clear = () => {
    const c = ref.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setInk(false);
  };

  async function save() {
    setBusy(true);
    try {
      const r = await api("", {
        method: "POST",
        body: JSON.stringify({
          action: "owner_signature",
          signature: ref.current!.toDataURL("image/png"),
        }),
      });
      onSaved(r.ok);
      if (r.ok) {
        clear();
        setVersion((v) => v + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="mt-4 rounded-xl border border-border p-3 text-sm">
      <summary className="cursor-pointer font-semibold">
        Подпись арендодателя в договорах {has || version ? "· есть" : "· не задана"}
      </summary>
      <p className="mt-2 text-muted-foreground">
        Ставится в каждый договор, подписанный после сохранения: в блок «FIRMAS» и на лист подписей,
        с именем «{name}». Уже подписанные договоры не меняются.
      </p>
      {current && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-muted-foreground">Сейчас:</p>
          <img
            src={current}
            alt="Подпись"
            className="h-20 rounded-lg border border-border bg-white object-contain p-1"
          />
        </div>
      )}
      <p className="mt-3 mb-1 text-xs text-muted-foreground">
        {current ? "Нарисовать новую:" : "Нарисуйте подпись пальцем или мышью:"}
      </p>
      <canvas
        ref={ref}
        width={700}
        height={220}
        className="w-full max-w-md touch-none rounded-lg border border-dashed border-border bg-white"
        style={{ aspectRatio: "700 / 220" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!ink || busy}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          Сохранить подпись
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={!ink}
          className="text-xs text-muted-foreground underline disabled:opacity-40"
        >
          Стереть
        </button>
      </div>
    </details>
  );
}

const DOC_LABEL: Record<string, string> = {
  idFront: "Документ: лицевая",
  idBack: "Документ: оборот",
  licenseFront: "Права: лицевая",
  licenseBack: "Права: оборот",
};

/** Thumbnails of the document photos of a signed contract (private, fetched with the admin session). */
export function DocPhotos({ api, id, slots }: { api: Api; id: string; slots: string[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const made: string[] = [];
    let alive = true;
    for (const slot of slots) {
      api(`id=${id}&doc=${slot}`)
        .then(async (r) => {
          if (!r.ok || !alive) return;
          const u = URL.createObjectURL(await r.blob());
          made.push(u);
          setUrls((x) => ({ ...x, [slot]: u }));
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [api, id, slots]);
  if (!slots.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {slots.map((slot) => (
        <a key={slot} href={urls[slot]} target="_blank" rel="noreferrer" className="block">
          <span className="mb-1 block text-xs text-muted-foreground">
            {DOC_LABEL[slot] || slot}
          </span>
          {urls[slot] ? (
            <img
              src={urls[slot]}
              alt={DOC_LABEL[slot] || slot}
              className="h-24 w-full rounded-lg border border-border object-cover"
            />
          ) : (
            <span className="block h-24 w-full animate-pulse rounded-lg bg-muted" />
          )}
        </a>
      ))}
    </div>
  );
}
