import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Bed, Snowflake, Sun, Tv, Bath, X, Users, MapPin } from "lucide-react";
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
                </ul>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{t("fleet.from")}</div>
                    <div className="font-mono-num text-2xl text-primary">
                      {c.priceFrom} €<span className="text-sm text-muted-foreground">{t("fleet.perNight")}</span>
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

function SpecModal({ camper, onClose }: { camper: Camper; onClose: () => void }) {
  const { t } = useTranslation();
  const sections: Array<[string, string[]]> = [
    [t("fleet.sections.sleeping"), [t("fleet.specs.bed1"), t("fleet.specs.bed2"), t("fleet.specs.bed3")]],
    [t("fleet.sections.comfort"), [t("fleet.specs.comfort1"), t("fleet.specs.comfort2"), t("fleet.specs.comfort3")]],
    [t("fleet.sections.autonomy"), [t("fleet.specs.auto1"), t("fleet.specs.auto2")]],
    [t("fleet.sections.kitchen"), [t("fleet.specs.kit1"), t("fleet.specs.kit2"), t("fleet.specs.kit3")]],
    [t("fleet.sections.exterior"), [t("fleet.specs.ext1"), t("fleet.specs.ext2")]],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <img src={camper.image} alt={camper.name} className="h-full w-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur"
            aria-label={t("fleet.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 sm:p-8">
          <h3 className="font-display text-3xl text-foreground">{camper.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("fleet.capacity", { n: camper.capacity })} · {camper.location}</p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {sections.map(([title, items]) => (
              <div key={title}>
                <h4 className="font-display text-lg text-primary">{title}</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {items.map((it) => (<li key={it}>· {it}</li>))}
                </ul>
              </div>
            ))}
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
