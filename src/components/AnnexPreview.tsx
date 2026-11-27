// Annex I-A (handover report) as the guest sees it before signing on the staff
// device: the page image of the blank with the check-in report written over it,
// in the same places as the signed PDF (api/_lib/contract-pdf.js, ACTA_PAGES).
import { CHECKLIST, DAMAGE_TYPES } from "../../shared/acta.js";

export interface AnnexActa {
  datetime: string | null;
  odometerKm: number | null;
  fuel: number | null;
  checklist: Record<string, boolean | null>;
  marks: { id: string; x: number; y: number; type: string; note?: string }[];
  notes: string;
  petsOnBoard: boolean | null;
  photos: { id: string }[];
}

// Page size of contrato-v8.pdf in points; boxes are top-left points, like the PDF code.
const PW = 594.96;
const PH = 841.92;
const SPEC = {
  booking: [357.8, 76.6],
  datetime: [421.5, 100.3],
  km: [392.2, 113.0],
  fuel: { 1: 384.05, 2: 403.89, 3: 423.74, 4: 443.58, top: 127.9 } as Record<
    number | "top",
    number
  >,
  checklistX: 309.74,
  checklistTops: [
    152.65, 165.4, 177.4, 190.15, 202.9, 215.65, 227.65, 240.4, 265.15, 277.9, 290.65, 302.65,
    315.39, 328.14,
  ],
  drawing: { x0: 36.75, x1: 297.74, top: 99.75, bottom: 425.24 },
  lines: { x: 36.75, top: 467.6, width: 503 },
  photos: [259.23, 508.0],
  photosNo: [330.52, 505.86],
  pets: { yes: 488.26, no: 524.9, top: 508.0 },
};

const left = (x: number) => `${(x / PW) * 100}%`;
const top = (y: number) => `${(y / PH) * 100}%`;

/** Same text as actaDamageText() in contract-pdf.js. */
export function damageText(a: AnnexActa): string {
  const items = a.marks.map(
    (m, i) =>
      `${i + 1}. ${(DAMAGE_TYPES as Record<string, { es: string }>)[m.type]?.es || m.type}${m.note ? `: ${m.note}` : ""}`,
  );
  if (a.notes.trim()) items.push(`Interior / otros: ${a.notes.trim()}`);
  return items.length ? items.join("; ") : "Sin daños preexistentes.";
}

const wall = (v: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/.exec(v || "");
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}` : "";
};

export function AnnexPreview({
  acta,
  image,
  bookingRef,
}: {
  acta: AnnexActa;
  image: string;
  bookingRef?: string;
}) {
  const d = SPEC.drawing;
  // Text in points -> a font size relative to the page width (container queries).
  const pt = (n: number) => `${(n / PW) * 100}cqw`;
  const Text = ({
    x,
    y,
    children,
    size = 8.6,
    w,
  }: {
    x: number;
    y: number;
    children: React.ReactNode;
    size?: number;
    w?: number;
  }) => (
    <span
      className="absolute bg-white font-sans font-semibold leading-none text-black"
      style={{ left: left(x), top: top(y), fontSize: pt(size), width: w ? left(w) : undefined }}
    >
      {children}
    </span>
  );
  const X = ({ x, y }: { x: number; y: number }) => (
    <Text x={x + 0.8} y={y - 0.6} size={8}>
      X
    </Text>
  );
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-white"
      style={{ containerType: "inline-size" }}
    >
      <img src={image} alt="Anexo I-A" className="block w-full" />
      {bookingRef && (
        <Text x={SPEC.booking[0]} y={SPEC.booking[1]}>
          {bookingRef}
        </Text>
      )}
      {acta.datetime && (
        <Text x={SPEC.datetime[0]} y={SPEC.datetime[1]}>
          {wall(acta.datetime)}
        </Text>
      )}
      {acta.odometerKm != null && (
        <Text x={SPEC.km[0]} y={SPEC.km[1]}>
          {acta.odometerKm.toLocaleString("es-ES")} km
        </Text>
      )}
      {acta.fuel != null && SPEC.fuel[acta.fuel] != null && (
        <X x={SPEC.fuel[acta.fuel]} y={SPEC.fuel.top} />
      )}
      {CHECKLIST.map((c, i) =>
        acta.checklist?.[c.key] === true ? (
          <X key={c.key} x={SPEC.checklistX} y={SPEC.checklistTops[i]} />
        ) : null,
      )}
      {acta.marks.map((m, i) => (
        <span
          key={m.id}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-red-700 bg-white font-bold text-red-700"
          style={{
            left: left(d.x0 + m.x * (d.x1 - d.x0)),
            top: top(d.top + m.y * (d.bottom - d.top)),
            width: pt(12),
            height: pt(12),
            fontSize: pt(7),
          }}
        >
          {i + 1}
        </span>
      ))}
      <Text x={SPEC.lines.x} y={SPEC.lines.top} w={SPEC.lines.width} size={8.3}>
        <span className="font-normal">{damageText(acta)}</span>
      </Text>
      {acta.photos.length > 0 && (
        <>
          <X x={SPEC.photos[0]} y={SPEC.photos[1]} />
          <Text x={SPEC.photosNo[0]} y={SPEC.photosNo[1]}>
            {acta.photos.length}
          </Text>
        </>
      )}
      {acta.petsOnBoard === true && <X x={SPEC.pets.yes} y={SPEC.pets.top} />}
      {acta.petsOnBoard === false && <X x={SPEC.pets.no} y={SPEC.pets.top} />}
    </div>
  );
}
