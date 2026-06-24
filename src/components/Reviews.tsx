import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SectionHeader } from "./Fleet";
import { REVIEWS } from "@/data/reviews";
import { buildWhatsAppLink } from "@/lib/constants";

function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function Reviews() {
  const { t } = useTranslation();
  return (
    <section id="reviews" className="py-24 sm:py-32 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={t("reviews.title")} />

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm text-foreground">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="font-mono-num">{t("reviews.summary")}</span>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <motion.article
              key={r.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`flex flex-col rounded-2xl border border-border/60 bg-surface p-6 ${i % 3 === 1 ? "lg:translate-y-6" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${r.color} text-white font-bold`}>
                  {initials(r.name)}
                </div>
                <div>
                  <div className="font-medium text-foreground">{r.name} <span className="text-base">{r.flag}</span></div>
                  <div className="text-xs text-muted-foreground">{r.date} · {r.source}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-0.5 text-primary">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground italic leading-relaxed">"{r.text}"</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href={buildWhatsAppLink("Hola, ya viajé con Camper Retreat VLC y me gustaría dejar una reseña.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-sm text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {t("reviews.cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
