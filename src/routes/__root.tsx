import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import "../i18n";

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
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
      { name: "description", content: "Alquila nuestra autocaravana McLouis para hasta 5 personas desde 105€/noche. Todo incluido. Reserva por WhatsApp en minutos. Valencia, España." },
      { name: "author", content: "Camper Retreat VLC" },
      { property: "og:title", content: "Alquiler de Autocaravana en Valencia | Camper Retreat VLC" },
      { property: "og:description", content: "Alquila nuestra autocaravana McLouis para hasta 5 personas desde 105€/noche. Todo incluido. Reserva por WhatsApp en minutos. Valencia, España." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Alquiler de Autocaravana en Valencia | Camper Retreat VLC" },
      { name: "twitter:description", content: "Alquila nuestra autocaravana McLouis para hasta 5 personas desde 105€/noche. Todo incluido. Reserva por WhatsApp en minutos. Valencia, España." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/7AUCddPgEWP1Sj3FUNVJ85dltA63/social-images/social-1782331138031-logonew.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/7AUCddPgEWP1Sj3FUNVJ85dltA63/social-images/social-1782331138031-logonew.webp" },
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
              "@id": "https://campervlc.vercel.app/#business",
              name: "Camper Retreat VLC",
              url: "https://campervlc.vercel.app/",
              logo: "https://storage.googleapis.com/gpt-engineer-file-uploads/7AUCddPgEWP1Sj3FUNVJ85dltA63/social-images/social-1782331138031-logonew.webp",
              image: "https://storage.googleapis.com/gpt-engineer-file-uploads/7AUCddPgEWP1Sj3FUNVJ85dltA63/social-images/social-1782331138031-logonew.webp",
              description:
                "Alquiler de autocaravana McLouis Yearling 89G en Valencia. Hasta 5 personas, todo incluido. Reserva por WhatsApp.",
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
              paymentAccepted: "Cash, Credit Card, Bank Transfer",
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
                lowPrice: "99",
                highPrice: "169",
                offerCount: "4",
                availability: "https://schema.org/InStock",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5.0",
                reviewCount: "47",
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
          mainEntity: [
            {
              "@type": "Question",
              name: "¿Qué documentación necesito?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Carné de conducir B válido (mínimo 2 años de antigüedad), DNI o pasaporte.",
              },
            },
            {
              "@type": "Question",
              name: "¿Cuál es el depósito de garantía?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Se solicita una fianza de 900 € (por confirmar), reembolsable al finalizar el alquiler sin incidencias.",
              },
            },
            {
              "@type": "Question",
              name: "¿Está incluido el seguro?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sí, seguro a todo riesgo incluido en el precio base. Opcionalmente puedes reducir la franquicia.",
              },
            },
            {
              "@type": "Question",
              name: "¿Dónde se recoge y entrega la autocaravana?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "En Valencia ciudad. Ofrecemos traslado al aeropuerto de Valencia como opción adicional (90 €).",
              },
            },
            {
              "@type": "Question",
              name: "¿Puedo llevar mascotas?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sí, somos pet friendly. No cobramos ningún suplemento por mascotas.",
              },
            },
            {
              "@type": "Question",
              name: "¿Cuántos kilómetros están incluidos?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "100 km/día incluidos. Kilómetros adicionales: 0,3 €/km (por confirmar).",
              },
            },
            {
              "@type": "Question",
              name: "¿Cuál es la estancia mínima?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Temporada baja (nov–mar): 3 noches. Temporada media (abr–may, oct): 4 noches. Temporada alta (jun–sep): 5 noches.",
              },
            },
            {
              "@type": "Question",
              name: "¿Puedo pagar con tarjeta?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Aceptamos tarjeta, bizum y transferencia bancaria.",
              },
            },
          ],
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
  return (
    <html lang="es">
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
  const { t, i18n } = useTranslation();

  useEffect(() => {
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

    document.documentElement.lang = i18n.language;
  }, [i18n.language, t]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
