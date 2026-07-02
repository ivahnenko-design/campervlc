import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle } from "lucide-react";
import { INSTAGRAM_URL, buildWhatsAppLink } from "@/lib/constants";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/60 bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3 items-start">
          <div>
            <div className="font-display text-2xl">
              Camper Retreat <span className="text-primary">VLC</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">{t("footer.tagline")}</p>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2 md:justify-self-center">
            <li><a href="#" className="hover:text-foreground transition-colors">{t("footer.privacy")}</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">{t("footer.terms")}</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">{t("footer.cookies")}</a></li>
            <li><Link to="/cancellation-policy" className="hover:text-foreground transition-colors">{t("footer.cancellationPolicy")}</Link></li>
          </ul>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="flex gap-3">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={buildWhatsAppLink("Hola, me interesa alquilar la camper en Valencia.")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-[#25D366] hover:text-[#25D366] transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
        <div className="mt-10 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
