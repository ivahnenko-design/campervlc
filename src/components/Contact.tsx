import { track } from "@/lib/analytics";
import { useTranslation } from "react-i18next";
import { MapPin, Instagram, MessageCircle, Clock, Navigation, ExternalLink } from "lucide-react";
import { SectionHeader } from "./Fleet";
import {
  buildWhatsAppLink,
  INSTAGRAM_URL,
  INSTAGRAM_HANDLE,
  PICKUP_ADDRESS,
  MAPS_OPEN_URL,
  MAPS_ROUTE_URL,
} from "@/lib/constants";

export function Contact() {
  const { t } = useTranslation();
  const waLink = buildWhatsAppLink("Hola, me interesa alquilar la camper en Valencia.");

  return (
    <section id="contact" className="py-24 sm:py-32 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={t("contact.title")} />

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border/60 bg-surface p-7 sm:p-9">
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <span className="text-foreground">
                  <span className="block text-xs uppercase tracking-wider text-muted-foreground">{t("contact.pickup")}</span>
                  <span className="font-mono-num">{PICKUP_ADDRESS}</span>
                </span>
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
                  onClick={() => track("contact_whatsapp", { place: "contact" })}
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

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface">
            <a
              href={MAPS_OPEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("click_map", { action: "open" })}
              className="block"
            >
              <img
                src="/images/map-pickup.jpg"
                alt={t("contact.map_alt")}
                width={1200}
                height={640}
                loading="lazy"
                decoding="async"
                className="aspect-[1200/640] w-full object-cover"
              />
            </a>
            <div className="flex flex-wrap items-center gap-3 p-4">
              <a
                href={MAPS_ROUTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("click_map", { action: "route" })}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
              >
                <Navigation className="h-4 w-4" />
                {t("contact.map_route")}
              </a>
              <a
                href={MAPS_OPEN_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("click_map", { action: "open" })}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm text-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {t("contact.map_open")}
              </a>
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[11px] text-muted-foreground hover:text-foreground"
              >
                {t("contact.map_credit")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
