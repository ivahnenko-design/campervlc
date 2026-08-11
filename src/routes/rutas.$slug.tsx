import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, MapPin, Lightbulb, ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getRouteBySlug, type Lang } from "@/data/routes-content";

export const Route = createFileRoute("/rutas/$slug")({
  head: ({ params }) => {
    const route = getRouteBySlug(params.slug);
    if (!route) return { meta: [{ title: "Ruta no encontrada" }] };
    const base = "https://campervlc.com";
    const langs: Lang[] = ["es", "en", "de", "it", "nl", "ru", "uk"];
    return {
      meta: [
        { title: route.metaTitle.es },
        { name: "description", content: route.metaDescription.es },
        { property: "og:title", content: route.metaTitle.es },
        { property: "og:description", content: route.metaDescription.es },
        { property: "og:type", content: "article" },
        ...langs.map((l) => ({
          property: "og:locale:alternate",
          content: l,
        })),
      ],
      links: [
        { rel: "canonical", href: `${base}/rutas/${params.slug}` },
        { rel: "alternate", hreflang: "x-default", href: `${base}/rutas/${params.slug}` },
        ...langs.map((l) => ({
          rel: "alternate",
          hreflang: l,
          href: `${base}/rutas/${params.slug}?lang=${l}`,
        })),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: route.heroTitle.es,
            description: route.metaDescription.es,
            author: { "@type": "Organization", name: "Camper Retreat VLC" },
            publisher: {
              "@type": "Organization",
              name: "Camper Retreat VLC",
              logo: {
                "@type": "ImageObject",
                url: "https://storage.googleapis.com/gpt-engineer-file-uploads/7AUCddPgEWP1Sj3FUNVJ85dltA63/social-images/social-1782331138031-logonew.webp",
              },
            },
            url: `${base}/rutas/${params.slug}`,
            inLanguage: "es",
          }),
        },
      ],
    };
  },
  loader: ({ params }) => {
    const route = getRouteBySlug(params.slug);
    if (!route) throw notFound();
    return route;
  },
  component: RoutePageComponent,
  notFoundComponent: () => (
    <div className="bg-background text-foreground min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Ruta no encontrada.</p>
    </div>
  ),
});

function RoutePageComponent() {
  const { i18n } = useTranslation();
  const route = Route.useLoaderData();
  const lang = (i18n.language?.slice(0, 2) as Lang) ?? "es";

  const t = <T extends Record<Lang, string>>(field: T): string =>
    field[lang] ?? field.es;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 border-b border-border/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ChevronLeft className="h-4 w-4" />
            {lang === "ru" ? "На главную" : lang === "uk" ? "На головну" : lang === "de" ? "Startseite" : lang === "it" ? "Homepage" : lang === "nl" ? "Terug" : lang === "en" ? "Home" : "Inicio"}
          </Link>

          <div className="flex items-center gap-2 text-sm text-primary/80 mb-4">
            <MapPin className="h-4 w-4" />
            <span>Valencia, España</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-foreground leading-tight text-balance">
            {t(route.heroTitle)}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">{t(route.heroSubtitle)}</p>
        </div>
      </section>

      {/* Hero photo placeholder */}
      <div
        className="route-photo-placeholder w-full aspect-[16/6] bg-surface border-b border-border/40 flex items-center justify-center text-muted-foreground/30 text-sm"
        data-photo="hero-costa-blanca"
      >
        [ foto principal ]
      </div>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

        {/* Intro */}
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-16 max-w-3xl">
          {t(route.intro)}
        </p>

        {/* Day-by-day */}
        <div className="space-y-20">
          {route.days.map((day, i) => (
            <section key={i}>
              <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-4">
                {t(day.title)}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{t(day.text)}</p>
              <div
                className="route-photo-placeholder w-full aspect-[16/7] rounded-2xl bg-surface border border-border/60 flex items-center justify-center text-muted-foreground/30 text-sm"
                data-photo={day.photoSlot}
              >
                [ foto: {day.photoSlot} ]
              </div>
            </section>
          ))}
        </div>

        {/* Tips */}
        {route.tips.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-6 flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              {lang === "ru" ? "Практические советы" : lang === "uk" ? "Практичні поради" : lang === "de" ? "Praktische Tipps" : lang === "it" ? "Consigli pratici" : lang === "nl" ? "Praktische tips" : lang === "en" ? "Practical tips" : "Consejos prácticos"}
            </h2>
            <ul className="space-y-3">
              {route.tips.map((item, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface p-4 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  {t(item.tip)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <div className="mt-20 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-surface to-coral/5 p-8 sm:p-12 text-center">
          <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-3">
            {lang === "ru" ? "Готовы к путешествию?" : lang === "uk" ? "Готові до подорожі?" : lang === "de" ? "Bereit für das Abenteuer?" : lang === "it" ? "Pronti per l'avventura?" : lang === "nl" ? "Klaar voor het avontuur?" : lang === "en" ? "Ready for the adventure?" : "¿Listo para la aventura?"}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            {lang === "ru" ? "Alquiler autocaravana Valencia — забронируйте свои даты прямо сейчас." : lang === "uk" ? "Alquiler autocaravana Valencia — забронюйте свої дати просто зараз." : lang === "de" ? "Buche dein Wohnmobil in Valencia und starte dein Abenteuer." : lang === "it" ? "Prenota il tuo camper a Valencia e inizia l'avventura." : lang === "nl" ? "Boek je camper in Valencia en begin het avontuur." : lang === "en" ? "Book your campervan in Valencia and start the adventure." : "Reserva tu autocaravana en Valencia y empieza la aventura."}
          </p>
          <a
            href="/#booking"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 transition"
          >
            {t(route.ctaText)} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
