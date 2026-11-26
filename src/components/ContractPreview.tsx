import { useEffect, useRef, useState } from "react";
import { CheckCircle, ChevronsDown, ExternalLink } from "lucide-react";

// The whole contract shown on the signing page, page by page, before the form.
// The guest scrolls through it; reaching the end unlocks the form and is
// recorded (onRead), so nobody can say they never saw the contract.

type Lang = "es" | "en" | "ru" | "uk" | "de" | "it" | "nl";

const T: Record<
  Lang,
  {
    title: string;
    hint: string;
    progress: (p: number) => string;
    done: string;
    openPdf: string;
    page: string;
  }
> = {
  en: {
    title: "Read the contract",
    hint: "Scroll through the whole contract (Spanish on the left, English on the right). The form to fill in appears below once you reach the end. Tap a page to enlarge it.",
    progress: (p) => `Read ${p}% - scroll to the end`,
    done: "You have read the contract to the end",
    openPdf: "Open as PDF",
    page: "Page",
  },
  es: {
    title: "Lee el contrato",
    hint: "Desplázate por todo el contrato (español a la izquierda, inglés a la derecha). El formulario aparecerá debajo cuando llegues al final. Toca una página para ampliarla.",
    progress: (p) => `Leído ${p}% - desplázate hasta el final`,
    done: "Has leído el contrato hasta el final",
    openPdf: "Abrir en PDF",
    page: "Página",
  },
  ru: {
    title: "Прочитайте договор",
    hint: "Пролистайте договор до конца (слева испанский текст, справа английский). Форма для заполнения появится ниже, когда вы дойдёте до конца. Нажмите на страницу, чтобы увеличить её.",
    progress: (p) => `Прочитано ${p}% — пролистайте до конца`,
    done: "Вы прочитали договор до конца",
    openPdf: "Открыть в PDF",
    page: "Страница",
  },
  uk: {
    title: "Прочитайте договір",
    hint: "Прогорніть договір до кінця (ліворуч іспанський текст, праворуч англійський). Форма для заповнення з'явиться нижче, коли ви дійдете до кінця. Натисніть на сторінку, щоб збільшити її.",
    progress: (p) => `Прочитано ${p}% — прогорніть до кінця`,
    done: "Ви прочитали договір до кінця",
    openPdf: "Відкрити в PDF",
    page: "Сторінка",
  },
  de: {
    title: "Lies den Vertrag",
    hint: "Scrolle durch den ganzen Vertrag (links Spanisch, rechts Englisch). Das Formular erscheint darunter, sobald du am Ende bist. Tippe auf eine Seite, um sie zu vergrößern.",
    progress: (p) => `${p}% gelesen - scrolle bis zum Ende`,
    done: "Du hast den Vertrag bis zum Ende gelesen",
    openPdf: "Als PDF öffnen",
    page: "Seite",
  },
  it: {
    title: "Leggi il contratto",
    hint: "Scorri tutto il contratto (spagnolo a sinistra, inglese a destra). Il modulo da compilare apparirà sotto quando arrivi alla fine. Tocca una pagina per ingrandirla.",
    progress: (p) => `Letto ${p}% - scorri fino alla fine`,
    done: "Hai letto il contratto fino alla fine",
    openPdf: "Apri in PDF",
    page: "Pagina",
  },
  nl: {
    title: "Lees het contract",
    hint: "Scrol door het hele contract (links Spaans, rechts Engels). Het formulier verschijnt eronder zodra je het einde bereikt. Tik op een pagina om hem te vergroten.",
    progress: (p) => `${p}% gelezen - scrol tot het einde`,
    done: "Je hebt het contract tot het einde gelezen",
    openPdf: "Openen als PDF",
    page: "Pagina",
  },
};

export function ContractPreview({
  preview,
  pdfPath,
  lang,
  read,
  onRead,
}: {
  preview: { base: string; pages: number };
  pdfPath: string;
  lang: Lang;
  read: boolean;
  onRead: () => void;
}) {
  const t = T[lang] || T.en;
  const boxRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(read ? 100 : 0);
  const fired = useRef(read);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const onScroll = () => {
      const max = box.scrollHeight - box.clientHeight;
      const p = max > 0 ? Math.min(100, Math.round((box.scrollTop / max) * 100)) : 100;
      setProgress((old) => Math.max(old, p));
      if (p >= 98 && !fired.current) {
        fired.current = true;
        onRead();
      }
    };
    box.addEventListener("scroll", onScroll, { passive: true });
    return () => box.removeEventListener("scroll", onScroll);
  }, [onRead]);

  const pages = Array.from(
    { length: preview.pages },
    (_, i) => `${preview.base}${String(i + 1).padStart(2, "0")}.webp`,
  );

  return (
    <section className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">{t.title}</h2>
        <a
          href={pdfPath}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 text-xs text-primary underline underline-offset-2"
        >
          <ExternalLink className="h-3.5 w-3.5" /> {t.openPdf}
        </a>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>

      <div
        ref={boxRef}
        className="mt-3 h-[70vh] overflow-y-auto rounded-xl border border-border bg-neutral-200 p-2"
      >
        {pages.map((src, i) => (
          <a key={src} href={src} target="_blank" rel="noreferrer" className="mb-2 block last:mb-0">
            <img
              src={src}
              alt={`${t.page} ${i + 1}`}
              loading={i < 2 ? "eager" : "lazy"}
              width={1075}
              height={1521}
              className="h-auto w-full rounded bg-white shadow"
            />
          </a>
        ))}
      </div>

      <div className="mt-2">
        {read || progress >= 98 ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-green-500">
            <CheckCircle className="h-4 w-4" /> {t.done}
          </p>
        ) : (
          <>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronsDown className="h-3.5 w-3.5" /> {t.progress(progress)}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
