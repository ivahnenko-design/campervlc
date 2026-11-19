import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryPhoto } from "@/data/gallery";

/**
 * Full-screen photo viewer: big photo, arrows, keyboard (← → Esc), swipe,
 * counter and a thumbnail strip. Neighbouring photos are preloaded.
 */
export function Lightbox({
  photos,
  start = 0,
  alt,
  closeLabel,
  onClose,
}: {
  photos: GalleryPhoto[];
  start?: number;
  alt: string;
  closeLabel: string;
  onClose: () => void;
}) {
  const total = photos.length;
  const [idx, setIdx] = useState(start);
  const touchX = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, prev, next]);

  // Keep the active thumbnail in view and warm the cache for the neighbours.
  useEffect(() => {
    stripRef.current
      ?.querySelector<HTMLElement>(`[data-i="${idx}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest" });
    for (const j of [idx - 1, idx + 1]) {
      const p = photos[(j + total) % total];
      if (p) new Image().src = p.src;
    }
  }, [idx, photos, total]);

  const photo = photos[idx];

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-[#05090f]"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const d = touchX.current - e.changedTouches[0].clientX;
        if (d > 50) next();
        else if (d < -50) prev();
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))] text-white/90">
        <span className="font-mono-num text-sm">
          {idx + 1} / {total}
        </span>
        <button
          onClick={onClose}
          aria-label={closeLabel}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onClick={onClose}>
        <img
          key={photo.src}
          src={photo.src}
          width={photo.w}
          height={photo.h}
          alt={`${alt} — ${idx + 1}`}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition sm:grid"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition sm:grid"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div
        ref={stripRef}
        className="flex gap-2 overflow-x-auto px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 [scrollbar-width:none]"
      >
        {photos.map((p, i) => (
          <button
            key={p.thumb}
            data-i={i}
            onClick={() => setIdx(i)}
            aria-label={`Photo ${i + 1}`}
            className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-16 sm:w-24 ${
              i === idx ? "border-primary opacity-100" : "border-transparent opacity-50 hover:opacity-90"
            }`}
          >
            <img src={p.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
