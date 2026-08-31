import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Bed, BedDouble, Snowflake, Sun, SunMedium, Tv, Bath, X, Users, MapPin,
  ChevronLeft, ChevronRight, PawPrint, Ruler, PackageCheck, UtensilsCrossed,
  Gift, TreePalm, Thermometer, Droplets, Baby, SquareParking, CircleCheck,
  Flame, Sparkles,
} from "lucide-react";
import { FLEET, type Camper } from "@/data/fleet";

export function Fleet() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<Camper | null>(null);

  return (
    <section id="fleet" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={t("fleet.title")} subtitle={t("fleet.subtitle")} />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FLEET.map((c, i) => (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-surface"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <span className="absolute top-3 left-3 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  ● {t("fleet.available")}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-2xl text-foreground">{c.name}</h3>
                <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t("fleet.capacity", { n: c.capacity })}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</span>
                </p>

                <ul className="mt-4 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <Chip icon={<Bed className="h-3 w-3" />}>{t("fleet.features.bed")}</Chip>
                  <Chip icon={<Snowflake className="h-3 w-3" />}>{t("fleet.features.ac")}</Chip>
                  <Chip icon={<Sun className="h-3 w-3" />}>{t("fleet.features.solar")}</Chip>
                  <Chip icon={<Tv className="h-3 w-3" />}>{t("fleet.features.tv")}</Chip>
                  <Chip icon={<Bath className="h-3 w-3" />}>{t("fleet.features.wc")}</Chip>
                  <Chip icon={<PawPrint className="h-3 w-3" />}>{t("fleet.features.pet")}</Chip>
                </ul>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{t("fleet.from")}</div>
                    <div className="font-mono-num text-2xl text-primary">
                      {c.priceFrom} €<span className="text-sm text-muted-foreground">{t("fleet.perNight")}</span>
                      <span className="ml-1 text-xs text-muted-foreground">{t("booking.iva")}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(c)}
                    className="rounded-full border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {t("fleet.details")}
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {open && <SpecModal camper={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-1 border border-border/40">
      {icon}{children}
    </li>
  );
}

const GALLERY_IMAGES = [
  // Hero shots
  "/images/IMG_9452.jpg",
  "/images/IMG_9453.jpg",
  // New lifestyle photos
  "/images/Camper Retreat .jpg",
  "/images/Camper Retreat cafe.jpg",
  "/images/Camper Retreat cafee.jpg",
  "/images/Camper Retreat jugo.jpg",
  "/images/Camper Retreat Patatas.jpg",
  "/images/JUL00889.jpg",
  "/images/JUL00938.jpg",
  "/images/JUL00949.jpg",
  "/images/JUL00950.jpg",
  // Interior & detail series
  "/images/231030205257_mclouis-yearling-83-025-copy.jpg",
  "/images/231030205257_mclouis-yearling-83-029-copy.jpg",
  "/images/231030205257_mclouis-yearling-83-032-copy.jpg",
  "/images/231030205257_mclouis-yearling-83-033-copy.jpg",
  "/images/231030205257_mclouis-yearling-83-040-copy.jpg",
  "/images/231030201158_mclouis-yearling-83-044-copy.jpg",
  "/images/231030201158_mclouis-yearling-83-048-copy.jpg",
  "/images/231030201158_mclouis-yearling-83-050-copy.jpg",
  "/images/231030201158_mclouis-yearling-83-051-copy.jpg",
  "/images/231030201158_mclouis-yearling-83-053-copy.jpg",
  "/images/231030201158_mclouis-yearling-83-056-copy.jpg",
  "/images/231030201158_mclouis-yearling-83-059-copy.jpg",
  "/images/231030201158_mclouis-yearling-83-060-copy.jpg",
  "/images/231030203958_mclouis-yearling-83-061-copy.jpg",
  "/images/231030203958_mclouis-yearling-83-062-copy.jpg",
  "/images/231030203958_mclouis-yearling-83-069-copy.jpg",
  "/images/231030203958_mclouis-yearling-83-071-copy.jpg",
  "/images/231030203958_mclouis-yearling-83-072-copy.jpg",
  "/images/231030203958_mclouis-yearling-83-073-copy.jpg",
  "/images/231030203958_mclouis-yearling-83-076-copy.jpg",
  "/images/231030203958_mclouis-yearling-83-077-copy.jpg",
  "/images/231030203958_mclouis-yearling-83-080-copy.jpg",
  // Floor plan
  "/images/879-PIANTA-GIORNO(con-letto-basculante)_h0x300.png",
];

function GallerySlider({ name }: { name: string }) {
  const [idx, setIdx] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const total = GALLERY_IMAGES.length;
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => { setIsPortrait(false); setIdx((i) => (i - 1 + total) % total); }, [total]);
  const next = useCallback(() => { setIsPortrait(false); setIdx((i) => (i + 1) % total); }, [total]);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setIsPortrait(naturalHeight > naturalWidth);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
    touchStartX.current = null;
  }, [next, prev]);

  return (
    <div
      className="relative w-full h-screen md:h-[400px]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <img
        key={idx}
        src={GALLERY_IMAGES[idx]}
        alt={`${name} — photo ${idx + 1}`}
        onLoad={onImgLoad}
        className={`h-full w-full ${isPortrait ? "object-cover" : "object-contain bg-black"}`}
      />

      {/* Prev / Next */}
      <button
        onClick={prev}
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur hover:bg-background/90 transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next photo"
        className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur hover:bg-background/90 transition"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-3 left-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-mono-num text-foreground backdrop-blur">
        {idx + 1} / {total}
      </div>

      {/* Dots — show max 9 centered around current */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {Array.from({ length: Math.min(total, 9) }, (_, i) => {
          const offset = Math.max(0, Math.min(total - 9, idx - 4));
          const dotIdx = offset + i;
          return (
            <button
              key={dotIdx}
              onClick={() => setIdx(dotIdx)}
              aria-label={`Photo ${dotIdx + 1}`}
              className={`rounded-full transition-all ${
                dotIdx === idx
                  ? "w-4 h-2 bg-primary"
                  : "w-2 h-2 bg-white/60 hover:bg-white/90"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function QuickFact({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-background/40 px-3 py-4 text-center">
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-medium text-foreground leading-tight">{label}</span>
      {sub ? <span className="text-[11px] text-muted-foreground leading-tight">{sub}</span> : null}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-right">{value}</span>
    </div>
  );
}

function EquipCard({ icon, title, items }: { icon: React.ReactNode; title: string; items?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h5 className="text-sm font-semibold text-foreground">{title}</h5>
      </div>
      {items ? <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{items}</p> : null}
    </div>
  );
}

function SpecModal({ camper, onClose }: { camper: Camper; onClose: () => void }) {
  const { t } = useTranslation();

  const beds = [t("fleet.specs.bed1"), t("fleet.specs.bed2"), t("fleet.specs.bed3")];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="relative overflow-hidden">
          <GallerySlider name={camper.name} />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur z-10"
            aria-label={t("fleet.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <h3 className="font-display text-3xl text-foreground">{camper.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("fleet.capacity", { n: camper.capacity })} · {camper.location}
          </p>

          {/* Quick facts */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickFact icon={<Users className="h-5 w-5" />} label={t("fleet.quick.seats")} />
            <QuickFact icon={<BedDouble className="h-5 w-5" />} label={t("fleet.quick.beds")} />
            <a href="#equipamiento" onClick={(e) => { e.preventDefault(); document.getElementById("equipamiento")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="contents">
              <QuickFact icon={<PackageCheck className="h-5 w-5" />} label={t("fleet.quick.allIncluded")} />
            </a>
            <QuickFact icon={<Ruler className="h-5 w-5" />} label={t("fleet.quick.dims")} sub={t("fleet.quick.dimsLabel")} />
          </div>

          {/* Technical specs */}
          <h4 className="mt-8 font-display text-xl text-primary">{t("fleet.tech.title")}</h4>
          <div className="mt-3 grid gap-5 sm:grid-cols-3">
            <div>
              <h5 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{t("fleet.tech.vehicle")}</h5>
              <SpecRow label={t("fleet.tech.brand")} value="McLouis" />
              <SpecRow label={t("fleet.tech.model")} value="Yearling 89G" />
              <SpecRow label={t("fleet.tech.engine")} value={t("fleet.tech.engineValue")} />
              <SpecRow label={t("fleet.tech.transmission")} value={t("fleet.tech.transmissionValue")} />
            </div>
            <div>
              <h5 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{t("fleet.tech.bedsCol")}</h5>
              {beds.map((b) => (
                <p key={b} className="border-b border-border/40 py-1.5 text-sm text-foreground last:border-0">{b}</p>
              ))}
            </div>
            <div>
              <h5 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{t("fleet.tech.capacityCol")}</h5>
              <SpecRow label={t("fleet.tech.freshWater")} value={t("fleet.tech.freshWaterValue")} />
              <p className="border-b border-border/40 py-1.5 text-sm text-foreground">{t("fleet.tech.fridge")}</p>
              <p className="py-1.5 text-sm text-foreground">{t("fleet.tech.sockets")}</p>
            </div>
          </div>

          {/* Equipment */}
          <h4 id="equipamiento" className="mt-8 scroll-mt-4 font-display text-xl text-primary">{t("fleet.equip.title")}</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <EquipCard icon={<BedDouble className="h-4 w-4" />} title={t("fleet.equip.bedKit")} items={t("fleet.equip.bedKitItems")} />
            <EquipCard icon={<UtensilsCrossed className="h-4 w-4" />} title={t("fleet.equip.kitchen")} items={t("fleet.equip.kitchenItems")} />
            <EquipCard icon={<Gift className="h-4 w-4" />} title={t("fleet.equip.welcome")} items={t("fleet.equip.welcomeItems")} />
            <EquipCard icon={<TreePalm className="h-4 w-4" />} title={t("fleet.equip.outdoor")} items={t("fleet.equip.outdoorItems")} />
            <EquipCard icon={<Thermometer className="h-4 w-4" />} title={t("fleet.equip.climate")} />
            <EquipCard icon={<SunMedium className="h-4 w-4" />} title={t("fleet.equip.solar")} />
            <EquipCard icon={<Droplets className="h-4 w-4" />} title={t("fleet.equip.water")} />
            <EquipCard icon={<Tv className="h-4 w-4" />} title={t("fleet.equip.tv")} />
            <EquipCard icon={<Baby className="h-4 w-4" />} title={t("fleet.equip.child")} />
            <EquipCard icon={<PawPrint className="h-4 w-4" />} title={t("fleet.equip.pet")} />
          </div>

          {/* Free inclusions */}
          <div className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <CircleCheck className="h-4 w-4" />
              {t("fleet.included.title")}
            </p>
            <ul className="mt-2 space-y-1.5">
              <li className="flex items-start gap-2 text-sm text-foreground">
                <SquareParking className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {t("fleet.included.parking")}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <Flame className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {t("fleet.included.gasBottles")}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {t("fleet.included.toiletCapsules")}
              </li>
            </ul>
          </div>

          <p className="mt-6 rounded-lg border border-border/50 bg-background/50 p-3 text-xs text-muted-foreground">
            {t("fleet.sections.note")}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function SectionHeader({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl"
    >
      {eyebrow && <div className="mb-2 text-xs uppercase tracking-[0.2em] text-primary/80">{eyebrow}</div>}
      <h2 className="font-display text-3xl sm:text-5xl text-foreground text-balance">{title}</h2>
      {subtitle && <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}
