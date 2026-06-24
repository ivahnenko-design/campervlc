import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CalendarRange, Settings2, KeyRound } from "lucide-react";
import { SectionHeader } from "./Fleet";

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { Icon: CalendarRange, title: t("how.step1_title"), desc: t("how.step1_desc") },
    { Icon: Settings2, title: t("how.step2_title"), desc: t("how.step2_desc") },
    { Icon: KeyRound, title: t("how.step3_title"), desc: t("how.step3_desc") },
  ];

  return (
    <section className="py-20 sm:py-28 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={t("how.title")} />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-2xl border border-border/60 bg-surface p-6"
            >
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-mono-num font-bold text-primary-foreground">
                0{i + 1}
              </span>
              <s.Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-display text-xl text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
