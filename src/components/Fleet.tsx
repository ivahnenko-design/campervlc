import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  BedDouble, SunMedium, Tv, X, Users,
  PawPrint, Images, Ruler, PackageCheck, UtensilsCrossed,
  Gift, TreePalm, Thermometer, Droplets, Baby, SquareParking, CircleCheck,
  Flame, Sparkles, Gauge } from "lucide-react";
import { type Camper } from "@/data/fleet";
import { MULTI_CAMPER, useChosenCamper } from "@/lib/vehicle-choice";
import { CitySwitch } from "./CitySwitch";
import { Lightbox } from "./Lightbox";

export function Fleet() {
  const { t } = useTranslation();
  const camper = useChosenCamper();
  const [open, setOpen] = useState<Camper | null>(null);
  const [galleryAt, setGalleryAt] = useState<number | null>(null);

  return (
    <section id="fleet" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={MULTI_CAMPER ? t("fleet.title_multi") : t("fleet.title")} subtitle={MULTI_CAMPER ? t("fleet.subtitle_multi") : t("fleet.subtitle")} />
        {/* Several campers: the guest picks the city first (same choice as the booking calendar). */}
        <CitySwitch className="mt-8" />
        <Showcase key={camper.id} camper={camper} onDetails={() => setOpen(camper)} onPhoto={setGalleryAt} />
      </div>

      {open && <SpecModal camper={open} onClose={() => setOpen(null)} />}
      {galleryAt !== null && (
        <Lightbox photos={camper.photos} start={galleryAt} alt={camper.name} closeLabel={t("fleet.close")} onClose={() => setGalleryAt(null)} />
      )}
    </section>
  );
}

/** Text of this camper: its own key when it has one (`textKey`), else vehicle 1's "fleet.*". */
function useCamperText(camper: Camper) {
  const { t, i18n } = useTranslation();
  return (key: string, opts?: Record<string, unknown>) =>
    camper.textKey && i18n.exists(`${camper.textKey}.${key}`)
      ? t(`${camper.textKey}.${key}`, opts)
      : t(`fleet.${key}`, opts);
}

/** Big photo with headline, booking strip, three interior tiles. */
function Showcase({ camper, onDetails, onPhoto }: { camper: Camper; onDetails: () => void; onPhoto: (i: number) => void }) {
  const { t } = useTranslation();
  const vt = useCamperText(camper);
  const tiles = camper.tiles.map((tile) => ({ src: tile.src, label: vt(`showcase.${tile.labelKey}`), at: tile.at }));
  const photos = camper.photos;
  return (
    <div className="mt-12">
      <div className="relative overflow-hidden rounded-3xl border border-border/60">
        <button type="button" onClick={() => onPhoto(0)} className="block w-full cursor-zoom-in" aria-label={t("fleet.showcase.photos", { n: photos.length })}>
          <img src={camper.image} alt={camper.name} loading="lazy" className="h-[340px] w-full object-cover sm:h-[460px] lg:h-[520px]" />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-background/10 to-background/80" />
        <button
          type="button"
          onClick={() => onPhoto(0)}
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-background/85 px-4 py-2 text-sm font-medium text-foreground backdrop-blur hover:bg-background transition"
        >
          <Images className="h-4 w-4" /> {t("fleet.showcase.photos", { n: photos.length })}
        </button>
        <div className="pointer-events-none absolute left-5 right-5 top-5 sm:left-10 sm:top-10">
          <span className="mb-3 inline-block rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            ● {t("fleet.available")}
          </span>
          <h3 className="font-display max-w-2xl text-3xl leading-[1.05] text-foreground text-balance sm:text-5xl lg:text-6xl">
            {vt("showcase.headline")}
          </h3>
          <p className="mt-3 text-sm text-foreground/85 sm:text-base">{camper.name} · {t("fleet.capacity", { n: camper.capacity })}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
        {tiles.map((tile) => (
          <figure key={tile.src} onClick={() => onPhoto(tile.at)} className="relative cursor-zoom-in overflow-hidden rounded-2xl border border-border/60">
            <img src={tile.src} alt={tile.label} loading="lazy" className="aspect-square w-full object-cover sm:aspect-[16/10]" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-xs font-semibold text-white sm:px-4 sm:pb-3 sm:pt-8 sm:text-sm">
              {tile.label}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={onDetails}
          className="rounded-full border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          {t("fleet.showcase.equipment")}
        </button>
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
  const vt = useCamperText(camper);

  const beds = [vt("specs.bed1"), vt("specs.bed2"), vt("specs.bed3")];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur z-10"
          aria-label={vt("close")}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6 sm:p-8">
          <h3 className="font-display text-3xl text-foreground">{camper.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {vt("capacity", { n: camper.capacity })} · {camper.location}
          </p>

          {/* Quick facts */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickFact icon={<Users className="h-5 w-5" />} label={vt("quick.seats")} />
            <QuickFact icon={<BedDouble className="h-5 w-5" />} label={vt("quick.beds")} />
            <a href="#equipamiento" onClick={(e) => { e.preventDefault(); document.getElementById("equipamiento")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="contents">
              <QuickFact icon={<PackageCheck className="h-5 w-5" />} label={vt("quick.allIncluded")} />
            </a>
            <QuickFact icon={<Ruler className="h-5 w-5" />} label={vt("quick.dims")} sub={vt("quick.dimsLabel")} />
          </div>

          {/* Technical specs */}
          <h4 className="mt-8 font-display text-xl text-primary">{vt("tech.title")}</h4>
          <div className="mt-3 grid gap-5 sm:grid-cols-3">
            <div>
              <h5 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{vt("tech.vehicle")}</h5>
              <SpecRow label={vt("tech.brand")} value={camper.vehicle.brand} />
              <SpecRow label={vt("tech.model")} value={camper.vehicle.model} />
              <SpecRow label={vt("tech.engine")} value={vt("tech.engineValue")} />
              <SpecRow label={vt("tech.transmission")} value={vt("tech.transmissionValue")} />
            </div>
            <div>
              <h5 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{vt("tech.bedsCol")}</h5>
              {beds.map((b) => (
                <p key={b} className="border-b border-border/40 py-1.5 text-sm text-foreground last:border-0">{b}</p>
              ))}
            </div>
            <div>
              <h5 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{vt("tech.capacityCol")}</h5>
              <SpecRow label={vt("tech.freshWater")} value={vt("tech.freshWaterValue")} />
              <p className="border-b border-border/40 py-1.5 text-sm text-foreground">{vt("tech.fridge")}</p>
              <p className="py-1.5 text-sm text-foreground">{vt("tech.sockets")}</p>
            </div>
          </div>

          {/* Equipment */}
          <h4 id="equipamiento" className="mt-8 scroll-mt-4 font-display text-xl text-primary">{vt("equip.title")}</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <EquipCard icon={<BedDouble className="h-4 w-4" />} title={vt("equip.bedKit")} items={vt("equip.bedKitItems")} />
            <EquipCard icon={<UtensilsCrossed className="h-4 w-4" />} title={vt("equip.kitchen")} items={vt("equip.kitchenItems")} />
            <EquipCard icon={<Gift className="h-4 w-4" />} title={vt("equip.welcome")} items={vt("equip.welcomeItems")} />
            <EquipCard icon={<TreePalm className="h-4 w-4" />} title={vt("equip.outdoor")} items={vt("equip.outdoorItems")} />
            <EquipCard icon={<Thermometer className="h-4 w-4" />} title={vt("equip.climate")} />
            <EquipCard icon={<SunMedium className="h-4 w-4" />} title={vt("equip.solar")} />
            <EquipCard icon={<Droplets className="h-4 w-4" />} title={vt("equip.water")} />
            <EquipCard icon={<Tv className="h-4 w-4" />} title={vt("equip.tv")} />
            <EquipCard icon={<Baby className="h-4 w-4" />} title={vt("equip.child")} />
            <EquipCard icon={<PawPrint className="h-4 w-4" />} title={vt("equip.pet")} />
          </div>

          {/* Free inclusions */}
          <div className="mt-6 rounded-xl border border-primary/40 bg-primary/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <CircleCheck className="h-4 w-4" />
              {vt("included.title")}
            </p>
            <ul className="mt-2 space-y-1.5">
              <li className="flex items-start gap-2 text-sm text-foreground">
                <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {vt("included.km")}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <SquareParking className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {vt("included.parking")}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <Flame className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {vt("included.gasBottles")}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {vt("included.toiletCapsules")}
              </li>
            </ul>
          </div>

          <p className="mt-6 rounded-lg border border-border/50 bg-background/50 p-3 text-xs text-muted-foreground">
            {vt("sections.note")}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function SectionHeader({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <motion.div
      initial={{ y: 20 }}
      whileInView={{ y: 0 }}
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
