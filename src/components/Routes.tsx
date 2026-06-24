import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { SectionHeader } from "./Fleet";

const ROUTES = [
  { id: "r1", emoji: "🏖️", gradient: "from-amber-500/30 to-rose-500/20" },
  { id: "r2", emoji: "🏰", gradient: "from-coral/40 to-primary/20" },
  { id: "r3", emoji: "⛰️", gradient: "from-violet-500/30 to-indigo-500/20" },
  { id: "r4", emoji: "🦩", gradient: "from-pink-400/30 to-cyan-500/20" },
] as const;

export function Routes() {
  const { t } = useTranslation();
  return (
    <section id="routes" className="py-24 sm:py-32 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={t("routes.title")} subtitle={t("routes.subtitle")} />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {ROUTES.map((r, i) => (
            <motion.article
              key={r.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${r.gradient} bg-surface p-6 sm:p-8`}
            >
              <div className="text-6xl">{r.emoji}</div>
              <div className="mt-4 flex items-center gap-3">
                <h3 className="font-display text-2xl text-foreground">{t(`routes.${r.id}_name`)}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-0.5 text-xs text-foreground/80">
                  <Clock className="h-3 w-3" />{t(`routes.${r.id}_dur`)} {t("routes.days")}
                </span>
              </div>
              <p className="mt-2 text-sm text-foreground/80">{t(`routes.${r.id}_high`)}</p>
              <p className="mt-3 italic text-muted-foreground">"{t(`routes.${r.id}_tag`)}"</p>
              <button className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all">
                {t("routes.view")} <ArrowRight className="h-4 w-4" />
              </button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
