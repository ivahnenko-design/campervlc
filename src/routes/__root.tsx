import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useMemo, type ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

import appCss from "../styles.css?url";
import es from "../i18n/translations/es.json";
import { FAQ_ITEMS } from "../data/faq";
import { reportLovableError } from "../lib/lovable-error-reporting";
import {
  getI18nForLanguage,
  LANGUAGE_QUERY_PARAM,
  normalizeLanguage,
  persistLanguage,
  readStoredLanguage,
  resolveLanguage,
} from "../i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Alquiler de Autocaravana en Valencia | Camper Retreat VLC" },
      { name: "description", content: "Alquiler de autocaravanas en Valencia desde 90€/noche. McLouis Yearling 89G para hasta 5 personas. Todo incluido. Reserva online en minutos." },
      { name: "author", content: "Camper Retreat VLC" },
      { property: "og:title", content: "Alquiler de Autocaravana en Valencia | Camper Retreat VLC" },
      { property: "og:description", content: "Alquila nuestra autocaravana McLouis para hasta 5 personas desde 90€/noche. Todo incluido. Reserva online en minutos. Valencia, España." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Alquiler de Autocaravana en Valencia | Camper Retreat VLC" },
      { name: "twitter:description", content: "Alquila nuestra autocaravana McLouis para hasta 5 personas desde 90€/noche. Todo incluido. Reserva online en minutos. Valencia, España." },
      { property: "og:image", content: "https://campervlc.com/images/og-home.jpg" },
      { name: "twitter:image", content: "https://campervlc.com/images/og-home.jpg" },
      { name: "theme-color", content: "#0f1b2d" },
    ],
    scripts: [
      {
        src: "https://www.googletagmanager.com/gtag/js?id=G-83QK16R5R5",
        async: true,
      },
      {
        children:
          "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-83QK16R5R5');",
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["LocalBusiness", "RentalCarDealer"],
              "@id": "https://campervlc.com/#business",
              name: "Camper Retreat VLC",
              url: "https://campervlc.com/",
              logo: "https://storage.googleapis.com/gpt-engineer-file-uploads/7AUCddPgEWP1Sj3FUNVJ85dltA63/social-images/social-1782331138031-logonew.webp",
              image: "https://storage.googleapis.com/gpt-engineer-file-uploads/7AUCddPgEWP1Sj3FUNVJ85dltA63/social-images/social-1782331138031-logonew.webp",
              description:
                "Alquiler de autocaravana McLouis Yearling 89G en Valencia. Hasta 5 personas, todo incluido. Reserva online.",
              telephone: "+34624038085",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Valencia",
                addressRegion: "Comunitat Valenciana",
                addressCountry: "ES",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 39.4699,
                longitude: -0.3763,
              },
              sameAs: ["https://www.instagram.com/camper.retreat.vlc"],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "reservations",
                telephone: "+34624038085",
                contactOption: "TollFree",
                availableLanguage: ["Spanish", "English", "German", "Italian", "Dutch", "Russian", "Ukrainian"],
              },
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                opens: "08:00",
                closes: "21:00",
              },
              priceRange: "€€",
              currenciesAccepted: "EUR",
              paymentAccepted: "Credit Card",
            },
            {
              "@type": "Product",
              name: "McLouis Yearling 89G - Alquiler autocaravana Valencia",
              image: [
                "https://yescapa.twic.pics/rental/picture/b21e5a9f-a4d1-446d-b92c-c86a11a0e037_1728652498",
              ],
              description:
                "Alquiler de autocaravana para 5 personas en Valencia. A/C, ducha, cocina completa, panel solar, pet friendly.",
              brand: { "@type": "Brand", name: "McLouis" },
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "EUR",
                lowPrice: "90",
                highPrice: "185",
                offerCount: "4",
                availability: "https://schema.org/InStock",
              },
            },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((n) => ({
            "@type": "Question",
            name: (es.faq as Record<string, string>)[`q${n}`],
            acceptedAnswer: {
              "@type": "Answer",
              text: (es.faq as Record<string, string>)[`a${n}`],
            },
          })),
        }),
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon-master.svg" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Resolved from the request on the server and from <html lang> on the client,
  // so the server markup and the first client render always agree.
  const lang = resolveLanguage();

  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const lang = resolveLanguage();
  // Server: a per-request clone. Client: the shared singleton.
  const i18nInstance = useMemo(() => getI18nForLanguage(lang), [lang]);

  return (
    <I18nextProvider i18n={i18nInstance}>
      <QueryClientProvider client={queryClient}>
        <RootHead />
        <Outlet />
      </QueryClientProvider>
    </I18nextProvider>
  );
}

function RootHead() {
  const { t, i18n } = useTranslation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // Existing visitors kept their choice in localStorage, which the server cannot
  // read. Adopt it once, after hydration, and mirror it into the cookie so every
  // later request is server-rendered in the right language. An explicit ?lang=
  // in the URL always wins.
  useEffect(() => {
    const hasExplicitLang = new URLSearchParams(window.location.search).has(
      LANGUAGE_QUERY_PARAM,
    );
    if (hasExplicitLang) return;
    const stored = readStoredLanguage();
    if (stored && stored !== i18n.language) void i18n.changeLanguage(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const lang = normalizeLanguage(i18n.language);
    if (lang) persistLanguage(lang);
  }, [i18n.language]);

  // The home-page title/description below belong to "/" only. Every other
  // route (routes, conditions, legal pages) renders its own head on the server,
  // and this effect must not overwrite it after hydration.
  useEffect(() => {
    if (pathname !== "/") return;
    const title = t("meta.title");
    const description = t("meta.description");

    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);

    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", title);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", description);

  }, [i18n.language, t, pathname]);

  return null;
}
