import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useTranslation } from "../_libs/react-i18next.mjs";
import { E as ChevronLeft, _ as Lightbulb, h as MapPin, j as ArrowRight } from "../_libs/lucide-react.mjs";
import { i as Navbar, t as Footer } from "./Footer-2t9_ZE3B.mjs";
import { t as Route } from "./rutas._slug-DowVPp3B.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rutas._slug-BfZxX2TD.js
var import_jsx_runtime = require_jsx_runtime();
function RoutePageComponent() {
	const { i18n } = useTranslation();
	const route = Route.useLoaderData();
	const lang = i18n.language?.slice(0, 2) ?? "es";
	const t = (field) => field[lang] ?? field.es;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-background text-foreground min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "relative pt-32 pb-20 sm:pt-40 sm:pb-28 border-b border-border/40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" }), lang === "ru" ? "На главную" : lang === "uk" ? "На головну" : lang === "de" ? "Startseite" : lang === "it" ? "Homepage" : lang === "nl" ? "Terug" : lang === "en" ? "Home" : "Inicio"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-sm text-primary/80 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Valencia, España" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-3xl sm:text-5xl lg:text-6xl text-foreground leading-tight text-balance",
							children: t(route.heroTitle)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 text-lg text-muted-foreground",
							children: t(route.heroSubtitle)
						})
					]
				})
			}),
			route.heroImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-full aspect-[16/6] overflow-hidden border-b border-border/40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: route.heroImage,
					alt: t(route.heroTitle),
					width: 1920,
					height: 720,
					loading: "eager",
					fetchPriority: "high",
					className: "w-full h-full object-cover"
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "route-photo-placeholder w-full aspect-[16/6] bg-surface border-b border-border/40 flex items-center justify-center text-muted-foreground/30 text-sm",
				"data-photo": `hero-${route.slug}`,
				children: "[ foto principal ]"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-base sm:text-lg text-muted-foreground leading-relaxed mb-16 max-w-3xl",
						children: t(route.intro)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-20",
						children: route.days.map((day, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl sm:text-3xl text-foreground mb-4",
								children: t(day.title)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground leading-relaxed mb-6",
								children: t(day.text)
							}),
							day.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-full aspect-[16/7] overflow-hidden rounded-2xl border border-border/60",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: day.image,
									alt: day.altText ? t(day.altText) : t(day.title),
									width: 1200,
									height: 525,
									loading: "lazy",
									className: "w-full h-full object-cover"
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "route-photo-placeholder w-full aspect-[16/7] rounded-2xl bg-surface border border-border/60 flex items-center justify-center text-muted-foreground/30 text-sm",
								"data-photo": day.photoSlot,
								children: [
									"[ foto: ",
									day.photoSlot,
									" ]"
								]
							})
						] }, i))
					}),
					route.tips.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "font-display text-2xl sm:text-3xl text-foreground mb-6 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "h-6 w-6 text-primary" }), lang === "ru" ? "Практические советы" : lang === "uk" ? "Практичні поради" : lang === "de" ? "Praktische Tipps" : lang === "it" ? "Consigli pratici" : lang === "nl" ? "Praktische tips" : lang === "en" ? "Practical tips" : "Consejos prácticos"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-3",
							children: route.tips.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-3 rounded-xl border border-border/60 bg-surface p-4 text-sm text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary",
									children: i + 1
								}), t(item.tip)]
							}, i))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-20 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-surface to-coral/5 p-8 sm:p-12 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl sm:text-3xl text-foreground mb-3",
								children: lang === "ru" ? "Готовы к путешествию?" : lang === "uk" ? "Готові до подорожі?" : lang === "de" ? "Bereit für das Abenteuer?" : lang === "it" ? "Pronti per l'avventura?" : lang === "nl" ? "Klaar voor het avontuur?" : lang === "en" ? "Ready for the adventure?" : "¿Listo para la aventura?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground mb-4 max-w-lg mx-auto",
								children: lang === "ru" ? "Забронируйте свои даты в Валенсии и начните приключение." : lang === "uk" ? "Забронюйте свої дати у Валенсії та починайте пригоду." : lang === "de" ? "Buche dein Wohnmobil in Valencia und starte dein Abenteuer." : lang === "it" ? "Prenota il tuo camper a Valencia e inizia l'avventura." : lang === "nl" ? "Boek je camper in Valencia en begin het avontuur." : lang === "en" ? "Book your campervan in Valencia and start the adventure." : "Alquiler autocaravana Valencia — reserva tu autocaravana y empieza la aventura."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground mb-8 max-w-xl mx-auto text-sm",
								children: t(route.ctaText)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: "/#booking",
								className: "inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 transition",
								children: [
									t(route.ctaButton),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { RoutePageComponent as component };
