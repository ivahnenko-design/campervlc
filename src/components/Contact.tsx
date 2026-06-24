import { useTranslation } from "react-i18next";
import { MapPin, Instagram, MessageCircle, Clock } from "lucide-react";
import { SectionHeader } from "./Fleet";
import { buildWhatsAppLink, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/lib/constants";

export function Contact() {
  const { t } = useTranslation();
  const waLink = buildWhatsAppLink("Hola, me interesa alquilar la camper en Valencia.");

  return (
    <section id="contact" className="py-24 sm:py-32 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={t("contact.title")} />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-surface p-7 sm:p-9">
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <span className="text-foreground">{t("contact.location")}</span>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5 text-primary" />
                  <span>{INSTAGRAM_HANDLE}</span>
                </a>
              </li>
              <li>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-[#0a0e1a] hover:brightness-110 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("contact.whatsapp")}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Clock className="mt-0.5 h-4 w-4" />
                <span>{t("contact.hours")}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-surface to-coral/5 p-7 sm:p-9 flex flex-col justify-center">
            <h3 className="font-display text-2xl text-foreground">{t("contact.soon_title")}</h3>
            <p className="mt-3 text-muted-foreground">{t("contact.soon_desc")}</p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 transition"
            >
              <MessageCircle className="h-4 w-4" />
              {t("contact.whatsapp")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
