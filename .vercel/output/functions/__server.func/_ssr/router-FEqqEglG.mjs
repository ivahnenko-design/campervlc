import { o as __toESM } from "../_runtime.mjs";
import { r as require_react } from "../_libs/@hookform/resolvers+[...].mjs";
import { _ as useRouter, c as HeadContent, d as Outlet, f as lazyRouteComponent, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as QueryClientProvider, r as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useTranslation } from "../_libs/react-i18next.mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
import { t as Route$8 } from "./rutas._slug-DowVPp3B.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-FEqqEglG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BUFjwC2D.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$7 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Alquiler de Autocaravana en Valencia | Camper Retreat VLC" },
			{
				name: "description",
				content: "Alquiler de autocaravanas en Valencia desde 99€/noche. McLouis Yearling 89G para hasta 5 personas. Todo incluido. Reserva por WhatsApp en minutos."
			},
			{
				name: "author",
				content: "Camper Retreat VLC"
			},
			{
				property: "og:title",
				content: "Alquiler de Autocaravana en Valencia | Camper Retreat VLC"
			},
			{
				property: "og:description",
				content: "Alquila nuestra autocaravana McLouis para hasta 5 personas desde 99€/noche. Todo incluido. Reserva por WhatsApp en minutos. Valencia, España."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:title",
				content: "Alquiler de Autocaravana en Valencia | Camper Retreat VLC"
			},
			{
				name: "twitter:description",
				content: "Alquila nuestra autocaravana McLouis para hasta 5 personas desde 99€/noche. Todo incluido. Reserva por WhatsApp en minutos. Valencia, España."
			},
			{
				property: "og:image",
				content: "https://campervlc.com/images/og-home.jpg"
			},
			{
				name: "twitter:image",
				content: "https://campervlc.com/images/og-home.jpg"
			},
			{
				name: "theme-color",
				content: "#0f1b2d"
			}
		],
		scripts: [
			{
				src: "https://www.googletagmanager.com/gtag/js?id=G-83QK16R5R5",
				async: true
			},
			{ children: "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-83QK16R5R5');" },
			{
				type: "application/ld+json",
				children: JSON.stringify({
					"@context": "https://schema.org",
					"@graph": [{
						"@type": ["LocalBusiness", "RentalCarDealer"],
						"@id": "https://campervlc.vercel.app/#business",
						name: "Camper Retreat VLC",
						url: "https://campervlc.vercel.app/",
						logo: "https://storage.googleapis.com/gpt-engineer-file-uploads/7AUCddPgEWP1Sj3FUNVJ85dltA63/social-images/social-1782331138031-logonew.webp",
						image: "https://storage.googleapis.com/gpt-engineer-file-uploads/7AUCddPgEWP1Sj3FUNVJ85dltA63/social-images/social-1782331138031-logonew.webp",
						description: "Alquiler de autocaravana McLouis Yearling 89G en Valencia. Hasta 5 personas, todo incluido. Reserva por WhatsApp.",
						telephone: "+34624038085",
						address: {
							"@type": "PostalAddress",
							addressLocality: "Valencia",
							addressRegion: "Comunitat Valenciana",
							addressCountry: "ES"
						},
						geo: {
							"@type": "GeoCoordinates",
							latitude: 39.4699,
							longitude: -.3763
						},
						sameAs: ["https://www.instagram.com/camper.retreat.vlc"],
						contactPoint: {
							"@type": "ContactPoint",
							contactType: "reservations",
							telephone: "+34624038085",
							contactOption: "TollFree",
							availableLanguage: [
								"Spanish",
								"English",
								"German",
								"Italian",
								"Dutch",
								"Russian",
								"Ukrainian"
							]
						},
						openingHoursSpecification: {
							"@type": "OpeningHoursSpecification",
							dayOfWeek: [
								"Monday",
								"Tuesday",
								"Wednesday",
								"Thursday",
								"Friday",
								"Saturday",
								"Sunday"
							],
							opens: "08:00",
							closes: "21:00"
						},
						priceRange: "€€",
						currenciesAccepted: "EUR",
						paymentAccepted: "Cash, Credit Card, Bank Transfer"
					}, {
						"@type": "Product",
						name: "McLouis Yearling 89G - Alquiler autocaravana Valencia",
						image: ["https://yescapa.twic.pics/rental/picture/b21e5a9f-a4d1-446d-b92c-c86a11a0e037_1728652498"],
						description: "Alquiler de autocaravana para 5 personas en Valencia. A/C, ducha, cocina completa, panel solar, pet friendly.",
						brand: {
							"@type": "Brand",
							name: "McLouis"
						},
						offers: {
							"@type": "AggregateOffer",
							priceCurrency: "EUR",
							lowPrice: "99",
							highPrice: "169",
							offerCount: "4",
							availability: "https://schema.org/InStock"
						},
						aggregateRating: {
							"@type": "AggregateRating",
							ratingValue: "5.0",
							reviewCount: "47"
						}
					}]
				})
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
								text: "Carné de conducir B válido (mínimo 2 años de antigüedad), DNI o pasaporte."
							}
						},
						{
							"@type": "Question",
							name: "¿Cuál es el depósito de garantía?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Se solicita una fianza de 900 € (por confirmar), reembolsable al finalizar el alquiler sin incidencias."
							}
						},
						{
							"@type": "Question",
							name: "¿Está incluido el seguro?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Sí, seguro a todo riesgo incluido en el precio base. Opcionalmente puedes reducir la franquicia."
							}
						},
						{
							"@type": "Question",
							name: "¿Dónde se recoge y entrega la autocaravana?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "En Valencia ciudad. Ofrecemos traslado al aeropuerto de Valencia como opción adicional (90 €)."
							}
						},
						{
							"@type": "Question",
							name: "¿Puedo llevar mascotas?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Sí, somos pet friendly. No cobramos ningún suplemento por mascotas."
							}
						},
						{
							"@type": "Question",
							name: "¿Cuántos kilómetros están incluidos?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "100 km/día incluidos. Kilómetros adicionales: 0,3 €/km (por confirmar)."
							}
						},
						{
							"@type": "Question",
							name: "¿Cuál es la estancia mínima?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Temporada baja (nov–mar): 3 noches. Temporada media (abr–may, oct): 4 noches. Temporada alta (jun–sep): 5 noches."
							}
						},
						{
							"@type": "Question",
							name: "¿Puedo pagar con tarjeta?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Aceptamos tarjeta, bizum y transferencia bancaria."
							}
						},
						{
							"@type": "Question",
							name: "¿Cómo alquilar una autocaravana en Valencia?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Elige tus fechas en el calculador de precio, escríbenos por WhatsApp y te confirmamos disponibilidad en minutos. Para reservar se paga un depósito del 50% (o el 100% con un 5% de descuento). El resto antes de la recogida."
							}
						}
					]
				})
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				sizes: "48x48"
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "16x16",
				href: "/favicon-16x16.png"
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32x32.png"
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon-master.svg"
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png"
			},
			{
				rel: "manifest",
				href: "/site.webmanifest"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "es",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$7.useRouteContext();
	const { t, i18n } = useTranslation();
	(0, import_react.useEffect)(() => {
		const title = t("meta.title");
		const description = t("meta.description");
		document.title = title;
		const metaDesc = document.querySelector("meta[name=\"description\"]");
		if (metaDesc) metaDesc.setAttribute("content", description);
		const ogTitle = document.querySelector("meta[property=\"og:title\"]");
		if (ogTitle) ogTitle.setAttribute("content", title);
		const ogDesc = document.querySelector("meta[property=\"og:description\"]");
		if (ogDesc) ogDesc.setAttribute("content", description);
		const twTitle = document.querySelector("meta[name=\"twitter:title\"]");
		if (twTitle) twTitle.setAttribute("content", title);
		const twDesc = document.querySelector("meta[name=\"twitter:description\"]");
		if (twDesc) twDesc.setAttribute("content", description);
		document.documentElement.lang = i18n.language;
	}, [i18n.language, t]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
var $$splitComponentImporter$6 = () => import("./terms-BFbvmDAx.mjs");
var Route$6 = createFileRoute("/terms")({
	head: () => ({ meta: [
		{ title: "Terms & Conditions | Camper Retreat VLC" },
		{
			name: "description",
			content: "Terms and conditions for campervan rental at Camper Retreat VLC, Valencia, Spain."
		},
		{
			name: "robots",
			content: "noindex"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./privacy-Dw0iybOo.mjs");
var Route$5 = createFileRoute("/privacy")({
	head: () => ({ meta: [
		{ title: "Privacy Policy | Camper Retreat VLC" },
		{
			name: "description",
			content: "Privacy policy for Camper Retreat VLC campervan rentals in Valencia, Spain. GDPR/LOPD compliant."
		},
		{
			name: "robots",
			content: "noindex"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./cookies-BtK-X2ff.mjs");
var Route$4 = createFileRoute("/cookies")({
	head: () => ({ meta: [
		{ title: "Cookie Policy | Camper Retreat VLC" },
		{
			name: "description",
			content: "Cookie policy for campervlc.com — types of cookies used, duration and how to manage them."
		},
		{
			name: "robots",
			content: "noindex"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./cancellation-policy-BMrh2K8q.mjs");
var Route$3 = createFileRoute("/cancellation-policy")({
	head: () => ({ meta: [{ title: "Cancellation Policy | Camper Retreat VLC" }, {
		name: "description",
		content: "Read our cancellation policy and refund terms for camper van bookings in Valencia."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./cancel-booking-CbZsPMh2.mjs");
var Route$2 = createFileRoute("/cancel-booking")({
	head: () => ({ meta: [{ title: "Cancel Booking | Camper Retreat VLC" }, {
		name: "description",
		content: "Look up and cancel your camper van booking in Valencia."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
objectType({
	bookingRef: stringType().trim().optional(),
	email: stringType().trim().optional(),
	lastName: stringType().trim().min(1)
}).refine((d) => !!d.bookingRef || !!d.email, {
	message: "form_required",
	path: ["bookingRef"]
});
var $$splitComponentImporter$1 = () => import("./booking-success-CtS719UQ.mjs");
var Route$1 = createFileRoute("/booking-success")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./routes-oFlupduz.mjs");
var Route = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Alquiler de Autocaravana en Valencia | Camper Retreat VLC" }, {
		name: "description",
		content: "Alquiler de autocaravanas en Valencia desde 99€/noche. McLouis Yearling 89G para hasta 5 personas. Todo incluido. Reserva por WhatsApp en minutos."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var TermsRoute = Route$6.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => Route$7
});
var PrivacyRoute = Route$5.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => Route$7
});
var CookiesRoute = Route$4.update({
	id: "/cookies",
	path: "/cookies",
	getParentRoute: () => Route$7
});
var CancellationPolicyRoute = Route$3.update({
	id: "/cancellation-policy",
	path: "/cancellation-policy",
	getParentRoute: () => Route$7
});
var CancelBookingRoute = Route$2.update({
	id: "/cancel-booking",
	path: "/cancel-booking",
	getParentRoute: () => Route$7
});
var BookingSuccessRoute = Route$1.update({
	id: "/booking-success",
	path: "/booking-success",
	getParentRoute: () => Route$7
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$7
	}),
	BookingSuccessRoute,
	CancelBookingRoute,
	CancellationPolicyRoute,
	CookiesRoute,
	PrivacyRoute,
	TermsRoute,
	RutasSlugRoute: Route$8.update({
		id: "/rutas/$slug",
		path: "/rutas/$slug",
		getParentRoute: () => Route$7
	})
};
var routeTree = Route$7._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
