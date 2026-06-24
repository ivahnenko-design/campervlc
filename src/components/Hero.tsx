import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Star, Users, Snowflake, Sun, PawPrint, ArrowRight } from "lucide-react";
import { FLEET } from "@/data/fleet";

function Typewriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const start = window.setTimeout(() => {
      const id = window.setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) window.clearInterval(id);
      }, 38);
    }, delay);
    return () => window.clearTimeout(start);
  }, [text, delay]);
  return <>{shown}<span className="inline-block w-[0.05em]" /></>;
}

export function Hero() {
  const { t } = useTranslation();
  const camper = FLEET[0];

  return (
    <section id="top" className="relative min-h-[100svh] w-full overflow-hidden">
      {/* background image */}
      <div className="absolute inset-0">
        <img
          src={camper.image}
          alt="McLouis Yearling 89G camper on Spanish coastal road"
          className="h-full w-full object-cover scale-105"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/40" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pt-32 pb-44 sm:px-6 lg:px-8 lg:pb-56">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl text-balance max-w-4xl"
        >
          <span className="block"><Typewriter text={t("hero.line1")} /></span>
          <span className="mt-2 block text-primary"><Typewriter text={t("hero.line2")} delay={900} /></span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          {t("hero.subheadline")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9, duration: 0.6 }}
          className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
        >
          <Badge icon={<Star className="h-3.5 w-3.5 fill-primary text-primary" />}>{t("hero.badges.rating")}</Badge>
          <Badge icon={<Users className="h-3.5 w-3.5" />}>{t("hero.badges.capacity")}</Badge>
          <Badge icon={<Snowflake className="h-3.5 w-3.5" />}>{t("hero.badges.ac")}</Badge>
          <Badge icon={<Sun className="h-3.5 w-3.5" />}>{t("hero.badges.solar")}</Badge>
          <Badge icon={<PawPrint className="h-3.5 w-3.5" />}>{t("hero.badges.pet")}</Badge>
        </motion.div>
      </div>

      {/* Floating booking pill */}
      <motion.a
        href="#booking"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.1, duration: 0.6 }}
        className="absolute inset-x-4 bottom-6 z-20 mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-border/60 bg-surface/85 px-4 py-3 backdrop-blur-xl shadow-2xl sm:bottom-10 sm:px-6 sm:py-4"
      >
        <div className="flex items-center gap-4 sm:gap-6 text-left">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("hero.checkin")} → {t("hero.checkout")}</div>
            <div className="font-display text-lg text-foreground sm:text-xl">{t("booking.pickRange")}</div>
          </div>
          <div className="hidden sm:block h-10 w-px bg-border" />
          <div className="hidden sm:block">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("hero.estimated")}</div>
            <div className="font-mono-num text-lg text-primary">desde 100 €/n</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-amber whitespace-nowrap">
          {t("hero.cta")} <ArrowRight className="h-4 w-4" />
        </span>
      </motion.a>
    </section>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-surface/50 px-3 py-1 backdrop-blur-sm">
      {icon}
      <span className="text-foreground/90">{children}</span>
    </span>
  );
}
