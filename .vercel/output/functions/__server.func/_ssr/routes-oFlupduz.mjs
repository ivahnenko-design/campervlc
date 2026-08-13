import { o as __toESM } from "../_runtime.mjs";
import { r as require_react } from "../_libs/@hookform/resolvers+[...].mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { t as useTranslation } from "../_libs/react-i18next.mjs";
import { A as Bath, C as Clock, E as ChevronLeft, O as CalendarRange, S as CreditCard, T as ChevronRight, a as Sun, c as Snowflake, d as PawPrint, f as Minus, h as MapPin, i as Tag, j as ArrowRight, k as Bed, l as Settings2, n as Users, o as Star, p as MessageCircle, r as Tv, s as Sparkles, t as X, u as Plus, v as KeyRound, y as Instagram } from "../_libs/lucide-react.mjs";
import { a as buildWhatsAppLink, i as Navbar, n as INSTAGRAM_HANDLE, r as INSTAGRAM_URL, t as Footer } from "./Footer-2t9_ZE3B.mjs";
import { n as GuestForm } from "./GuestForm-BNkuSVwg.mjs";
import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-C1LGqri2.mjs";
import { n as AnimatePresence, t as motion } from "../_libs/framer-motion.mjs";
import { a as endOfMonth, c as startOfDay, i as startOfMonth, l as addMonths, n as isBefore, o as isSameDay, r as format, s as differenceInCalendarDays, t as isWithinInterval, u as addDays } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-oFlupduz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FLEET = [{
	id: "mclouis-yearling-89g",
	name: "McLouis Yearling 89G",
	location: "Valencia",
	capacity: 5,
	image: "https://yescapa.twic.pics/rental/picture/b21e5a9f-a4d1-446d-b92c-c86a11a0e037_1728652498",
	gallery: [
		"https://yescapa.twic.pics/rental/picture/b21e5a9f-a4d1-446d-b92c-c86a11a0e037_1728652498",
		"https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200",
		"https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1200",
		"https://images.unsplash.com/photo-1519400197429-404ae3e0ee7e?w=1200",
		"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200"
	],
	priceFrom: 99,
	available: true
}];
var AVAILABILITY = [{
	camperId: "mclouis-yearling-89g",
	bookedDates: []
}];
var EXTRAS = [
	{
		id: "cleaning_fee",
		price: 50,
		mandatory: true
	},
	{
		id: "airport_transfer",
		price: 80
	},
	{
		id: "bicycle",
		price: 90
	},
	{
		id: "baby_seat",
		price: 0
	},
	{
		id: "bedding",
		price: 20
	},
	{
		id: "towels",
		price: 15
	},
	{
		id: "bbq",
		price: 15
	},
	{
		id: "festival",
		price: 150
	},
	{
		id: "extra_driver",
		price: 50
	},
	{
		id: "km_200",
		price: 20,
		perNight: true
	},
	{
		id: "km_unlimited",
		price: 40,
		perNight: true
	},
	{
		id: "sup_board",
		price: 90
	},
	{
		id: "reduced_deductible",
		price: 60
	}
];
function Typewriter({ text, delay = 0 }) {
	const [shown, setShown] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [shown, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block w-[0.05em]" })] });
}
function Hero() {
	const { t } = useTranslation();
	const camper = FLEET[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "top",
		className: "relative min-h-[100svh] w-full overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: camper.image,
						alt: "McLouis Yearling 89G camper on Spanish coastal road",
						className: "h-full w-full object-cover scale-105",
						loading: "eager"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/40" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pt-32 pb-44 sm:px-6 lg:px-8 lg:pb-56",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.h1, {
						initial: {
							opacity: 0,
							y: 20
						},
						animate: {
							opacity: 1,
							y: 0
						},
						transition: { duration: .6 },
						className: "font-display text-4xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl text-balance max-w-4xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Typewriter, { text: t("hero.line1") })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-2 block text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Typewriter, {
								text: t("hero.line2"),
								delay: 900
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
						initial: {
							opacity: 0,
							y: 10
						},
						animate: {
							opacity: 1,
							y: 0
						},
						transition: {
							delay: 1.6,
							duration: .6
						},
						className: "mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg",
						children: t("hero.subheadline")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						initial: { opacity: 0 },
						animate: { opacity: 1 },
						transition: {
							delay: 1.9,
							duration: .6
						},
						className: "mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5 fill-primary text-primary" }),
								children: t("hero.badges.rating")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-3.5 w-3.5" }),
								children: t("hero.badges.capacity")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Snowflake, { className: "h-3.5 w-3.5" }),
								children: t("hero.badges.ac")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-3.5 w-3.5" }),
								children: t("hero.badges.solar")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PawPrint, { className: "h-3.5 w-3.5" }),
								children: t("hero.badges.pet")
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.a, {
				href: "#booking",
				initial: {
					opacity: 0,
					y: 24
				},
				animate: {
					opacity: 1,
					y: 0
				},
				transition: {
					delay: 2.1,
					duration: .6
				},
				className: "absolute inset-x-4 bottom-6 z-20 mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-border/60 bg-surface/85 px-4 py-3 backdrop-blur-xl shadow-2xl sm:bottom-10 sm:px-6 sm:py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4 sm:gap-6 text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[10px] uppercase tracking-widest text-muted-foreground",
							children: [
								t("hero.checkin"),
								" → ",
								t("hero.checkout")
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-lg text-foreground sm:text-xl",
							children: t("booking.pickRange")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hidden sm:block h-10 w-px bg-border" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden sm:block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] uppercase tracking-widest text-muted-foreground",
								children: t("hero.estimated")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-mono-num text-lg text-primary",
								children: t("hero.priceFrom")
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-amber whitespace-nowrap",
					children: [
						t("hero.cta"),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })
					]
				})]
			})
		]
	});
}
function Badge({ icon, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-surface/50 px-3 py-1 backdrop-blur-sm",
		children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-foreground/90",
			children
		})]
	});
}
function Fleet() {
	const { t } = useTranslation();
	const [open, setOpen] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "fleet",
		className: "relative py-24 sm:py-32",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
				title: t("fleet.title"),
				subtitle: t("fleet.subtitle")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
				children: FLEET.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.article, {
					initial: {
						opacity: 0,
						y: 30
					},
					whileInView: {
						opacity: 1,
						y: 0
					},
					viewport: {
						once: true,
						margin: "-80px"
					},
					transition: {
						duration: .5,
						delay: i * .05
					},
					className: "group overflow-hidden rounded-2xl border border-border/60 bg-surface",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative aspect-[4/3] overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: c.image,
							alt: c.name,
							loading: "lazy",
							className: "h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "absolute top-3 left-3 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white",
							children: ["● ", t("fleet.available")]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-2xl text-foreground",
								children: c.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 flex items-center gap-3 text-sm text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-3.5 w-3.5" }), t("fleet.capacity", { n: c.capacity })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3.5 w-3.5" }), c.location]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-4 flex flex-wrap gap-1.5 text-xs text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bed, { className: "h-3 w-3" }),
										children: t("fleet.features.bed")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Snowflake, { className: "h-3 w-3" }),
										children: t("fleet.features.ac")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-3 w-3" }),
										children: t("fleet.features.solar")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tv, { className: "h-3 w-3" }),
										children: t("fleet.features.tv")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bath, { className: "h-3 w-3" }),
										children: t("fleet.features.wc")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PawPrint, { className: "h-3 w-3" }),
										children: t("fleet.features.pet")
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex items-end justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: t("fleet.from")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "font-mono-num text-2xl text-primary",
									children: [
										c.priceFrom,
										" €",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm text-muted-foreground",
											children: t("fleet.perNight")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-1 text-xs text-muted-foreground",
											children: t("booking.iva")
										})
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setOpen(c),
									className: "rounded-full border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors",
									children: t("fleet.details")
								})]
							})
						]
					})]
				}, c.id))
			})]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpecModal, {
			camper: open,
			onClose: () => setOpen(null)
		})]
	});
}
function Chip({ icon, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-1 border border-border/40",
		children: [icon, children]
	});
}
var GALLERY_IMAGES = [
	"/images/IMG_9452.jpg",
	"/images/IMG_9453.jpg",
	"/images/Camper Retreat .jpg",
	"/images/Camper Retreat cafe.jpg",
	"/images/Camper Retreat cafee.jpg",
	"/images/Camper Retreat jugo.jpg",
	"/images/Camper Retreat Patatas.jpg",
	"/images/JUL00889.jpg",
	"/images/JUL00938.jpg",
	"/images/JUL00949.jpg",
	"/images/JUL00950.jpg",
	"/images/231030205257_mclouis-yearling-83-025-copy.jpg",
	"/images/231030205257_mclouis-yearling-83-029-copy.jpg",
	"/images/231030205257_mclouis-yearling-83-032-copy.jpg",
	"/images/231030205257_mclouis-yearling-83-033-copy.jpg",
	"/images/231030205257_mclouis-yearling-83-040-copy.jpg",
	"/images/231030201158_mclouis-yearling-83-044-copy.jpg",
	"/images/231030201158_mclouis-yearling-83-048-copy.jpg",
	"/images/231030201158_mclouis-yearling-83-050-copy.jpg",
	"/images/231030201158_mclouis-yearling-83-051-copy.jpg",
	"/images/231030201158_mclouis-yearling-83-053-copy.jpg",
	"/images/231030201158_mclouis-yearling-83-056-copy.jpg",
	"/images/231030201158_mclouis-yearling-83-059-copy.jpg",
	"/images/231030201158_mclouis-yearling-83-060-copy.jpg",
	"/images/231030203958_mclouis-yearling-83-061-copy.jpg",
	"/images/231030203958_mclouis-yearling-83-062-copy.jpg",
	"/images/231030203958_mclouis-yearling-83-069-copy.jpg",
	"/images/231030203958_mclouis-yearling-83-071-copy.jpg",
	"/images/231030203958_mclouis-yearling-83-072-copy.jpg",
	"/images/231030203958_mclouis-yearling-83-073-copy.jpg",
	"/images/231030203958_mclouis-yearling-83-076-copy.jpg",
	"/images/231030203958_mclouis-yearling-83-077-copy.jpg",
	"/images/231030203958_mclouis-yearling-83-080-copy.jpg",
	"/images/879-PIANTA-GIORNO(con-letto-basculante)_h0x300.png"
];
function GallerySlider({ name }) {
	const [idx, setIdx] = (0, import_react.useState)(0);
	const [isPortrait, setIsPortrait] = (0, import_react.useState)(false);
	const total = GALLERY_IMAGES.length;
	const touchStartX = (0, import_react.useRef)(null);
	const prev = (0, import_react.useCallback)(() => {
		setIsPortrait(false);
		setIdx((i) => (i - 1 + total) % total);
	}, [total]);
	const next = (0, import_react.useCallback)(() => {
		setIsPortrait(false);
		setIdx((i) => (i + 1) % total);
	}, [total]);
	const onImgLoad = (0, import_react.useCallback)((e) => {
		const { naturalWidth, naturalHeight } = e.currentTarget;
		setIsPortrait(naturalHeight > naturalWidth);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-screen md:h-[400px]",
		onTouchStart: (0, import_react.useCallback)((e) => {
			touchStartX.current = e.touches[0].clientX;
		}, []),
		onTouchEnd: (0, import_react.useCallback)((e) => {
			if (touchStartX.current === null) return;
			const diff = touchStartX.current - e.changedTouches[0].clientX;
			if (diff > 50) next();
			else if (diff < -50) prev();
			touchStartX.current = null;
		}, [next, prev]),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: GALLERY_IMAGES[idx],
				alt: `${name} — photo ${idx + 1}`,
				onLoad: onImgLoad,
				className: `h-full w-full ${isPortrait ? "object-cover" : "object-contain bg-black"}`
			}, idx),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: prev,
				"aria-label": "Previous photo",
				className: "absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur hover:bg-background/90 transition",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-5 w-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: next,
				"aria-label": "Next photo",
				className: "absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur hover:bg-background/90 transition",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-5 w-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-3 left-3 rounded-full bg-background/70 px-2.5 py-1 text-xs font-mono-num text-foreground backdrop-blur",
				children: [
					idx + 1,
					" / ",
					total
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5",
				children: Array.from({ length: Math.min(total, 9) }, (_, i) => {
					const dotIdx = Math.max(0, Math.min(total - 9, idx - 4)) + i;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setIdx(dotIdx),
						"aria-label": `Photo ${dotIdx + 1}`,
						className: `rounded-full transition-all ${dotIdx === idx ? "w-4 h-2 bg-primary" : "w-2 h-2 bg-white/60 hover:bg-white/90"}`
					}, dotIdx);
				})
			})
		]
	});
}
function SpecModal({ camper, onClose }) {
	const { t } = useTranslation();
	const sections = [
		[t("fleet.sections.sleeping"), [
			t("fleet.specs.bed1"),
			t("fleet.specs.bed2"),
			t("fleet.specs.bed3")
		]],
		[t("fleet.sections.comfort"), [
			t("fleet.specs.comfort1"),
			t("fleet.specs.comfort2"),
			t("fleet.specs.comfort3")
		]],
		[t("fleet.sections.autonomy"), [t("fleet.specs.auto1"), t("fleet.specs.auto2")]],
		[t("fleet.sections.kitchen"), [
			t("fleet.specs.kit1"),
			t("fleet.specs.kit2"),
			t("fleet.specs.kit3")
		]],
		[t("fleet.sections.exterior"), [
			t("fleet.specs.ext1"),
			t("fleet.specs.ext2"),
			t("fleet.specs.ext3")
		]],
		[t("fleet.sections.driving"), [t("fleet.specs.transmission")]]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
			initial: {
				opacity: 0,
				scale: .95,
				y: 10
			},
			animate: {
				opacity: 1,
				scale: 1,
				y: 0
			},
			onClick: (e) => e.stopPropagation(),
			className: "relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GallerySlider, { name: camper.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur z-10",
					"aria-label": t("fleet.close"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-6 sm:p-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-3xl text-foreground",
						children: camper.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: [
							t("fleet.capacity", { n: camper.capacity }),
							" · ",
							camper.location
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 grid gap-6 sm:grid-cols-2",
						children: sections.map(([title, items]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "font-display text-lg text-primary",
							children: title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-2 space-y-1 text-sm text-muted-foreground",
							children: items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", it] }, it))
						})] }, title))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 rounded-lg border border-border/50 bg-background/50 p-3 text-xs text-muted-foreground",
						children: t("fleet.sections.note")
					})
				]
			})]
		})
	});
}
function SectionHeader({ title, subtitle, eyebrow }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		initial: {
			opacity: 0,
			y: 20
		},
		whileInView: {
			opacity: 1,
			y: 0
		},
		viewport: {
			once: true,
			margin: "-60px"
		},
		transition: { duration: .5 },
		className: "max-w-2xl",
		children: [
			eyebrow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 text-xs uppercase tracking-[0.2em] text-primary/80",
				children: eyebrow
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-3xl sm:text-5xl text-foreground text-balance",
				children: title
			}),
			subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-base text-muted-foreground",
				children: subtitle
			})
		]
	});
}
function HowItWorks() {
	const { t } = useTranslation();
	const steps = [
		{
			Icon: CalendarRange,
			title: t("how.step1_title"),
			desc: t("how.step1_desc")
		},
		{
			Icon: Settings2,
			title: t("how.step2_title"),
			desc: t("how.step2_desc")
		},
		{
			Icon: KeyRound,
			title: t("how.step3_title"),
			desc: t("how.step3_desc")
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "py-20 sm:py-28 border-t border-border/40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t("how.title") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-12 grid gap-6 md:grid-cols-3",
				children: steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
					initial: {
						opacity: 0,
						y: 24
					},
					whileInView: {
						opacity: 1,
						y: 0
					},
					viewport: { once: true },
					transition: {
						duration: .5,
						delay: i * .1
					},
					className: "relative rounded-2xl border border-border/60 bg-surface p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-mono-num font-bold text-primary-foreground",
							children: ["0", i + 1]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.Icon, { className: "h-8 w-8 text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-4 font-display text-xl text-foreground",
							children: s.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: s.desc
						})
					]
				}, i))
			})]
		})
	});
}
function withIva(amount) {
	return Math.round(amount * 1.21);
}
var MIN_NIGHTS = {
	low: 3,
	mid: 4,
	high: 4,
	super: 5
};
function getMinNights(date) {
	return MIN_NIGHTS[getSeason(date)];
}
var RANGES = [
	{
		from: 112,
		to: 315,
		price: 99,
		season: "low"
	},
	{
		from: 323,
		to: 329,
		price: 99,
		season: "low"
	},
	{
		from: 1019,
		to: 1206,
		price: 99,
		season: "low"
	},
	{
		from: 413,
		to: 426,
		price: 125,
		season: "mid"
	},
	{
		from: 504,
		to: 531,
		price: 125,
		season: "mid"
	},
	{
		from: 914,
		to: 1004,
		price: 125,
		season: "mid"
	},
	{
		from: 1207,
		to: 1218,
		price: 125,
		season: "mid"
	},
	{
		from: 316,
		to: 322,
		price: 155,
		season: "high"
	},
	{
		from: 330,
		to: 412,
		price: 155,
		season: "high"
	},
	{
		from: 427,
		to: 503,
		price: 155,
		season: "high"
	},
	{
		from: 601,
		to: 731,
		price: 155,
		season: "high"
	},
	{
		from: 901,
		to: 913,
		price: 155,
		season: "high"
	},
	{
		from: 1219,
		to: 1224,
		price: 155,
		season: "high"
	},
	{
		from: 801,
		to: 831,
		price: 169,
		season: "super"
	},
	{
		from: 1225,
		to: 1231,
		price: 169,
		season: "super"
	}
];
function toMMDD(date) {
	return (date.getMonth() + 1) * 100 + date.getDate();
}
function getPriceForDate(date) {
	const mmdd = toMMDD(date);
	if (mmdd <= 104) return 169;
	for (const r of RANGES) if (mmdd >= r.from && mmdd <= r.to) return r.price;
	return 99;
}
function getSeason(date) {
	const mmdd = toMMDD(date);
	if (mmdd <= 104) return "super";
	for (const r of RANGES) if (mmdd >= r.from && mmdd <= r.to) return r.season;
	return "low";
}
function calculatePrice(start, end) {
	const nights = Math.max(0, differenceInCalendarDays(end, start));
	let subtotal = 0;
	for (let i = 0; i < nights; i++) subtotal += getPriceForDate(addDays(start, i));
	let discountPct = 0;
	if (nights >= 14) discountPct = 10;
	else if (nights >= 7) discountPct = 5;
	const discountAmount = Math.round(subtotal * (discountPct / 100));
	const total = subtotal - discountAmount;
	return {
		nights,
		subtotal,
		discountPct,
		discountAmount,
		total,
		totalWithIva: withIva(total),
		perNightAvg: nights > 0 ? Math.round(total / nights) : 0
	};
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var fetchYescapaBookedDates = createServerFn({ method: "GET" }).handler(createSsrRpc("6ab6dbdfdd565ffbf591a5a523c49839d1a61b401eaacbb7ede0ec6d3779943d"));
var PROMO_CODES = { CAMPER10: 10 };
var PREPAYMENT_DISCOUNT_PCT = 5;
function isoDay(d) {
	return format(d, "yyyy-MM-dd");
}
function useBookedSet(camperId) {
	const local = (0, import_react.useMemo)(() => {
		return AVAILABILITY.find((x) => x.camperId === camperId)?.bookedDates ?? [];
	}, [camperId]);
	const { data } = useQuery({
		queryKey: ["yescapa-ical"],
		queryFn: () => fetchYescapaBookedDates(),
		staleTime: 30 * 6e4,
		refetchInterval: 30 * 6e4,
		refetchIntervalInBackground: true,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true
	});
	return (0, import_react.useMemo)(() => {
		const set = new Set(local);
		for (const d of data?.dates ?? []) set.add(d);
		return set;
	}, [local, data]);
}
function BookingCalendar() {
	const { t, i18n } = useTranslation();
	const camper = FLEET[0];
	const booked = useBookedSet(camper.id);
	const today = startOfDay(/* @__PURE__ */ new Date());
	const [monthBase, setMonthBase] = (0, import_react.useState)(startOfMonth(today));
	const [range, setRange] = (0, import_react.useState)({
		start: null,
		end: null
	});
	const [selectedExtras, setSelectedExtras] = (0, import_react.useState)(() => new Set(EXTRAS.filter((e) => e.mandatory).map((e) => e.id)));
	const [prepaymentOption, setPrepaymentOption] = (0, import_react.useState)("deposit");
	const [promoInput, setPromoInput] = (0, import_react.useState)("");
	const [promoStatus, setPromoStatus] = (0, import_react.useState)("idle");
	const [appliedPromoCode, setAppliedPromoCode] = (0, import_react.useState)(null);
	const months = [monthBase, addMonths(monthBase, 1)];
	const handleClick = (d) => {
		if (isBefore(d, today)) return;
		if (booked.has(isoDay(d))) return;
		if (!range.start || range.start && range.end) {
			setRange({
				start: d,
				end: null
			});
			return;
		}
		if (isBefore(d, range.start)) {
			setRange({
				start: d,
				end: null
			});
			return;
		}
		let cursor = range.start;
		while (!isSameDay(cursor, d)) {
			cursor = addDays(cursor, 1);
			if (booked.has(isoDay(cursor)) && !isSameDay(cursor, d)) {
				setRange({
					start: d,
					end: null
				});
				return;
			}
		}
		setRange({
			start: range.start,
			end: d
		});
	};
	const price = (0, import_react.useMemo)(() => {
		if (range.start && range.end) return calculatePrice(range.start, range.end);
		return null;
	}, [range]);
	const minNights = range.start ? getMinNights(range.start) : null;
	const nights = price?.nights ?? 0;
	const meetsMin = !minNights || nights >= minNights;
	const extrasTotal = (0, import_react.useMemo)(() => EXTRAS.filter((e) => selectedExtras.has(e.id) && !e.mandatory).reduce((s, e) => s + (e.perNight ? e.price * nights : e.price), 0), [selectedExtras, nights]);
	const mandatoryTotal = (0, import_react.useMemo)(() => EXTRAS.filter((e) => e.mandatory).reduce((s, e) => s + e.price, 0), []);
	const preDiscountTotal = (price?.total ?? 0) + extrasTotal + mandatoryTotal;
	const promoDiscountPct = appliedPromoCode ? PROMO_CODES[appliedPromoCode] : 0;
	const promoDiscountAmount = Math.round(preDiscountTotal * (promoDiscountPct / 100));
	const afterPromoTotal = preDiscountTotal - promoDiscountAmount;
	const prepaymentDiscountAmount = prepaymentOption === "full" ? Math.round(afterPromoTotal * (PREPAYMENT_DISCOUNT_PCT / 100)) : 0;
	const finalTotal = afterPromoTotal - prepaymentDiscountAmount;
	const finalTotalWithIva = withIva(finalTotal);
	finalTotalWithIva - (prepaymentOption === "full" ? finalTotalWithIva : Math.round(finalTotalWithIva * .5));
	const handleApplyPromo = () => {
		const code = promoInput.trim().toUpperCase();
		if (!code) return;
		if (PROMO_CODES[code]) {
			setAppliedPromoCode(code);
			setPromoStatus("valid");
		} else {
			setAppliedPromoCode(null);
			setPromoStatus("invalid");
		}
	};
	const seasonLabel = range.start ? t(`booking.season_${getSeason(range.start)}`) : null;
	const perNightRate = range.start ? getPriceForDate(range.start) : 0;
	const toggleExtra = (id) => {
		if (EXTRAS.find((e) => e.id === id)?.mandatory) return;
		setSelectedExtras((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const dateLocale = i18n.language;
	const fmtDate = (d) => d.toLocaleDateString(dateLocale, {
		day: "2-digit",
		month: "short",
		year: "numeric"
	});
	const waMessage = t("booking.wa_message", {
		start: range.start ? fmtDate(range.start) : "—",
		end: range.end ? fmtDate(range.end) : "—",
		nights,
		extras: selectedExtras.size ? EXTRAS.filter((e) => selectedExtras.has(e.id)).map((e) => t(`extras.${e.id}`)).join(", ") : t("booking.none"),
		total: finalTotal
	});
	const canSubmit = range.start && range.end && meetsMin;
	const [showForm, setShowForm] = (0, import_react.useState)(false);
	const [checkoutLoading, setCheckoutLoading] = (0, import_react.useState)(false);
	const [checkoutError, setCheckoutError] = (0, import_react.useState)(null);
	const handleGuestSubmit = async (guest) => {
		if (!range.start || !range.end) return;
		setCheckoutLoading(true);
		setCheckoutError(null);
		try {
			const res = await fetch("/api/create-checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					startDate: format(range.start, "yyyy-MM-dd"),
					endDate: format(range.end, "yyyy-MM-dd"),
					nights,
					extraIds: EXTRAS.filter((e) => selectedExtras.has(e.id)).map((e) => e.id),
					totalWithIva: finalTotalWithIva,
					guest,
					prepaymentOption,
					promoCode: appliedPromoCode
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Payment error");
			window.location.href = data.url;
		} catch (err) {
			setCheckoutError(err instanceof Error ? err.message : "Unknown error");
			setCheckoutLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "booking",
		className: "relative py-24 sm:py-32 border-t border-border/40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
				title: t("booking.title"),
				subtitle: t("booking.subtitle"),
				eyebrow: "01 · Reserva"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border/60 bg-surface p-5 sm:p-7",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setMonthBase(addMonths(monthBase, -1)),
								disabled: isBefore(addMonths(monthBase, -1), startOfMonth(today)),
								className: "grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground disabled:opacity-30",
								"aria-label": "prev month",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4 text-sm text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
										color: "bg-emerald-500/70",
										label: t("booking.legend_available")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
										color: "bg-primary",
										label: t("booking.legend_selected")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
										color: "bg-rose-500/70",
										label: t("booking.legend_booked")
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setMonthBase(addMonths(monthBase, 1)),
								className: "grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground",
								"aria-label": "next month",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 grid gap-8 sm:grid-cols-2",
						children: months.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthGrid, {
							month: m,
							today,
							booked,
							range,
							onPick: handleClick,
							locale: dateLocale
						}, m.toISOString()))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border/60 bg-surface p-5 sm:p-7 self-start sticky top-24",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary/80",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }), t("booking.summary")]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateBox, {
								label: t("booking.checkin"),
								value: range.start ? fmtDate(range.start) : "—"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateBox, {
								label: t("booking.checkout"),
								value: range.end ? fmtDate(range.end) : "—"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-center justify-between text-sm text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								t("booking.nights"),
								": ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono-num text-foreground",
									children: nights
								})
							] }), seasonLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-primary/80",
								children: seasonLabel
							})]
						}),
						range.start && !meetsMin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-coral",
							children: t("booking.minNights", { n: minNights })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground",
								children: t("extras.title")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "max-h-72 overflow-y-auto pr-1 space-y-1.5",
								children: EXTRAS.filter((e) => !e.mandatory).map((e) => {
									const active = selectedExtras.has(e.id);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => toggleExtra(e.id),
										className: `flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${active ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `grid h-4 w-4 place-items-center rounded border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`,
												children: active ? "✓" : ""
											}), t(`extras.${e.id}`)]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono-num text-xs text-foreground",
											children: [
												e.price,
												" €",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ml-0.5 text-muted-foreground",
													children: e.perNight ? t("extras.perNight") : t("extras.perBooking")
												})
											]
										})]
									}, e.id);
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground",
									children: t("booking.promo_label")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: promoInput,
										onChange: (e) => {
											setPromoInput(e.target.value);
											setPromoStatus("idle");
										},
										placeholder: t("booking.promo_placeholder"),
										className: "w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: handleApplyPromo,
										className: "shrink-0 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition",
										children: t("booking.promo_apply")
									})]
								}),
								promoStatus === "valid" && appliedPromoCode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1.5 flex items-center gap-1 text-xs text-emerald-500",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "h-3 w-3" }), t("booking.promo_success", { pct: PROMO_CODES[appliedPromoCode] })]
								}),
								promoStatus === "invalid" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1.5 text-xs text-rose-500",
									children: t("booking.promo_invalid")
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground",
								children: t("booking.prepayment_title")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setPrepaymentOption("deposit"),
									className: `rounded-lg border px-3 py-2 text-left text-sm transition ${prepaymentOption === "deposit" ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `grid h-4 w-4 shrink-0 place-items-center rounded-full border ${prepaymentOption === "deposit" ? "border-primary bg-primary" : "border-border"}`,
											children: prepaymentOption === "deposit" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-primary-foreground" })
										}), t("booking.prepayment_deposit")]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setPrepaymentOption("full"),
									className: `rounded-lg border px-3 py-2 text-left text-sm transition ${prepaymentOption === "full" ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `grid h-4 w-4 shrink-0 place-items-center rounded-full border ${prepaymentOption === "full" ? "border-primary bg-primary" : "border-border"}`,
											children: prepaymentOption === "full" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-primary-foreground" })
										}), t("booking.prepayment_full")]
									})
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 space-y-1.5 text-sm",
							children: [price && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: t("booking.price_breakdown", {
										price: perNightRate,
										count: nights
									}),
									value: `${price.subtotal} €`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: t("booking.subtotal"),
									value: `${price.subtotal} €`,
									iva: t("booking.iva")
								}),
								price.discountPct > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: t("booking.discount", { pct: price.discountPct }),
									value: `-${price.discountAmount} €`,
									accent: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: t("booking.extras"),
									value: `${extrasTotal} €`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: t("booking.cleaning"),
									value: `${mandatoryTotal} €`
								}),
								promoDiscountAmount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: t("booking.promo_discount_row", { code: appliedPromoCode }),
									value: `-${promoDiscountAmount} €`,
									accent: true
								}),
								prepaymentDiscountAmount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									label: t("booking.prepayment_discount"),
									value: `-${prepaymentDiscountAmount} €`,
									accent: true
								})
							] }), !price && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: t("booking.cleaning"),
								value: `${mandatoryTotal} €`
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
							mode: "wait",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: {
									scale: .98,
									opacity: .6
								},
								animate: {
									scale: 1,
									opacity: 1
								},
								className: "mt-5 border-t border-border/60 pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-end justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-muted-foreground",
										children: t("booking.total")
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-right",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono-num text-3xl font-bold text-primary",
											children: [finalTotal, " €"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-1.5 text-xs text-muted-foreground",
											children: t("booking.iva")
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-right text-xs text-muted-foreground",
									children: [
										finalTotalWithIva,
										" € ",
										t("booking.total_with_iva")
									]
								})]
							}, finalTotal)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-center text-xs text-muted-foreground",
							children: prepaymentOption === "full" ? t("booking.full_payment_note") : t("booking.deposit_note")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-center text-xs text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/cancellation-policy",
								className: "underline hover:text-foreground transition",
								children: t("booking.see_cancellation_policy")
							})
						}),
						showForm && canSubmit && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuestForm, {
							onSubmit: handleGuestSubmit,
							isLoading: checkoutLoading
						}), checkoutError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-center text-xs text-rose-500",
							children: checkoutError
						})] }),
						!showForm && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							disabled: !canSubmit,
							onClick: () => setShowForm(true),
							className: `mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition ${canSubmit ? "bg-primary text-primary-foreground glow-amber hover:brightness-110" : "bg-border/60 text-muted-foreground cursor-not-allowed"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-4 w-4" }), prepaymentOption === "full" ? t("booking.cta_full_payment") : t("booking.cta_deposit")]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: canSubmit ? buildWhatsAppLink(waMessage) : void 0,
							target: "_blank",
							rel: "noopener noreferrer",
							"aria-disabled": !canSubmit,
							onClick: (e) => {
								if (!canSubmit) e.preventDefault();
							},
							className: `mt-3 flex w-full items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition ${canSubmit ? "border-border/60 text-muted-foreground hover:text-foreground hover:border-border" : "border-border/30 text-muted-foreground/50 cursor-not-allowed"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4" }), t("booking.cta_whatsapp")]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-center text-xs text-muted-foreground",
							children: [t("booking.alt_contact", { handle: "" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: INSTAGRAM_URL,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "underline hover:text-foreground transition",
								children: INSTAGRAM_HANDLE
							})]
						})
					]
				})]
			})]
		})
	});
}
function Legend({ color, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "hidden sm:inline-flex items-center gap-1.5 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2.5 w-2.5 rounded-full ${color}` }), label]
	});
}
function DateBox({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border/50 bg-background/40 px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[10px] uppercase tracking-widest text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-0.5 font-display text-base text-foreground",
			children: value
		})]
	});
}
function Row({ label, value, accent, iva }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: `font-mono-num ${accent ? "text-coral" : "text-foreground"}`,
			children: [value, iva && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ml-1 text-xs text-muted-foreground",
				children: iva
			})]
		})]
	});
}
function MonthGrid({ month, today, booked, range, onPick, locale }) {
	const start = startOfMonth(month);
	const end = endOfMonth(month);
	const startWeekday = (start.getDay() + 6) % 7;
	const days = [];
	for (let i = 0; i < startWeekday; i++) days.push(null);
	for (let d = 1; d <= end.getDate(); d++) days.push(new Date(start.getFullYear(), start.getMonth(), d));
	const monthLabel = month.toLocaleDateString(locale, {
		month: "long",
		year: "numeric"
	});
	const dayLabels = [
		"L",
		"M",
		"X",
		"J",
		"V",
		"S",
		"D"
	];
	const inRange = (d) => {
		if (range.start && range.end) return isWithinInterval(d, {
			start: range.start,
			end: range.end
		});
		return false;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-3 text-center font-display text-lg text-foreground capitalize",
			children: monthLabel
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground",
			children: dayLabels.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "py-1",
				children: l
			}, l))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 grid grid-cols-7 gap-1",
			children: days.map((d, idx) => {
				if (!d) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}, idx);
				const past = isBefore(d, today);
				const iso = isoDay(d);
				const isBooked = booked.has(iso);
				const isStart = range.start && isSameDay(d, range.start);
				const isEnd = range.end && isSameDay(d, range.end);
				const within = inRange(d);
				const disabled = past || isBooked;
				let cls = "aspect-square w-full rounded-md text-sm font-mono-num transition-colors ";
				if (disabled) cls += isBooked ? "bg-rose-500/15 text-rose-300/70 line-through cursor-not-allowed" : "text-muted-foreground/30 cursor-not-allowed";
				else if (isStart || isEnd) cls += "bg-primary text-primary-foreground font-bold";
				else if (within) cls += "bg-primary/25 text-foreground";
				else cls += "text-foreground hover:bg-primary/15 border border-border/30";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					disabled,
					onClick: () => onPick(d),
					className: cls,
					children: d.getDate()
				}, idx);
			})
		})
	] });
}
var ROUTES = [
	{
		id: "r1",
		gradient: "from-amber-500/30 to-rose-500/20",
		slug: "costa-blanca"
	},
	{
		id: "r2",
		gradient: "from-coral/40 to-primary/20",
		slug: "pais-vasco"
	},
	{
		id: "r3",
		gradient: "from-violet-500/30 to-indigo-500/20",
		slug: "andalucia"
	},
	{
		id: "r4",
		gradient: "from-pink-400/30 to-cyan-500/20",
		slug: "valencia-barcelona"
	}
];
function Routes() {
	const { t } = useTranslation();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "routes",
		className: "py-24 sm:py-32 border-t border-border/40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
				title: t("routes.title"),
				subtitle: t("routes.subtitle")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-12 grid gap-5 sm:grid-cols-2",
				children: ROUTES.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.article, {
					initial: {
						opacity: 0,
						y: 24
					},
					whileInView: {
						opacity: 1,
						y: 0
					},
					viewport: { once: true },
					transition: {
						duration: .5,
						delay: i * .05
					},
					className: `relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${r.gradient} bg-surface p-6 sm:p-8`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-2xl text-foreground",
								children: t(`routes.${r.id}_name`)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-0.5 text-xs text-foreground/80",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }),
									t(`routes.${r.id}_dur`),
									" ",
									t("routes.days")
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-foreground/80",
							children: t(`routes.${r.id}_high`)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 italic text-muted-foreground",
							children: [
								"\"",
								t(`routes.${r.id}_tag`),
								"\""
							]
						}),
						r.slug ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/rutas/$slug",
							params: { slug: r.slug },
							className: "mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all",
							children: [
								t("routes.view"),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary/50 cursor-default",
							children: [
								t("routes.view"),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })
							]
						})
					]
				}, r.id))
			})]
		})
	});
}
var REVIEWS = [
	{
		name: "Ana M.",
		flag: "🇪🇸",
		rating: 5,
		date: "Mayo 2025",
		text: "Todo perfecto desde el primer momento. La camper estaba impecable, equipada con todo lo que necesitas. La entrega muy detallada. Repetiremos seguro.",
		source: "Yescapa",
		color: "from-amber-500 to-rose-500"
	},
	{
		name: "Dmytro K.",
		flag: "🇺🇦",
		rating: 5,
		date: "Julio 2025",
		text: "Fantastic camper, everything worked perfectly. The solar panel meant we never had to worry about power. The beach chair and parasol were a lovely touch. 10/10!",
		source: "Google",
		color: "from-sky-500 to-indigo-500"
	},
	{
		name: "Marco & Laura",
		flag: "🇩🇪",
		rating: 5,
		date: "Agosto 2025",
		text: "Wunderschöner Camper, top ausgestattet. Wir haben die Costa Blanca entdeckt und hatten das Gefühl, zuhause zu sein. Sehr zu empfehlen!",
		source: "Yescapa",
		color: "from-emerald-500 to-teal-500"
	},
	{
		name: "Sophie V.",
		flag: "🇳🇱",
		rating: 5,
		date: "Junio 2025",
		text: "Geweldige ervaring! De camper was brandschoon en uitstekend uitgerust. De begeleiding bij het ophalen was heel duidelijk. Zeker voor herhaling vatbaar!",
		source: "Instagram",
		color: "from-orange-500 to-pink-500"
	},
	{
		name: "Valentina R.",
		flag: "🇮🇹",
		rating: 5,
		date: "Settembre 2025",
		text: "Esperienza incredibile! Il camper era perfetto per 4 persone, tutto funzionava alla perfezione. I pannelli solari ci hanno permesso di stare in libertà totale.",
		source: "Yescapa",
		color: "from-rose-500 to-fuchsia-500"
	},
	{
		name: "James T.",
		flag: "🇬🇧",
		rating: 5,
		date: "October 2025",
		text: "Best camper rental experience I've ever had. The handover was thorough, the van spotless, and the outdoor furniture was a great bonus. Valencia to Cabo de Gata in 8 days — unforgettable.",
		source: "Google",
		color: "from-violet-500 to-blue-500"
	}
];
function initials(name) {
	return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
function Reviews() {
	const { t } = useTranslation();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "reviews",
		className: "py-24 sm:py-32 border-t border-border/40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t("reviews.title") }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm text-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-4 w-4 fill-primary text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono-num",
						children: t("reviews.summary")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
					children: REVIEWS.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.article, {
						initial: {
							opacity: 0,
							y: 24
						},
						whileInView: {
							opacity: 1,
							y: 0
						},
						viewport: { once: true },
						transition: {
							duration: .5,
							delay: i * .05
						},
						className: `flex flex-col rounded-2xl border border-border/60 bg-surface p-6 ${i % 3 === 1 ? "lg:translate-y-6" : ""}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${r.color} text-white font-bold`,
									children: initials(r.name)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "font-medium text-foreground",
									children: [
										r.name,
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-base",
											children: r.flag
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted-foreground",
									children: [
										r.date,
										" · ",
										r.source
									]
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 flex gap-0.5 text-primary",
								children: Array.from({ length: r.rating }).map((_, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-4 w-4 fill-current" }, j))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-sm text-muted-foreground italic leading-relaxed",
								children: [
									"\"",
									r.text,
									"\""
								]
							})
						]
					}, r.name))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-12 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: buildWhatsAppLink("Hola, ya viajé con Camper Retreat VLC y me gustaría dejar una reseña."),
						target: "_blank",
						rel: "noopener noreferrer",
						className: "inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-sm text-primary hover:bg-primary hover:text-primary-foreground transition-colors",
						children: t("reviews.cta")
					})
				})
			]
		})
	});
}
var ITEMS = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8
];
function FAQ() {
	const { t } = useTranslation();
	const [openIdx, setOpenIdx] = (0, import_react.useState)(0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "faq",
		className: "py-24 sm:py-32 border-t border-border/40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t("faq.title") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 divide-y divide-border/50 rounded-2xl border border-border/60 bg-surface",
				children: ITEMS.map((n, i) => {
					const open = openIdx === i;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setOpenIdx(open ? null : i),
						className: "flex w-full items-center justify-between gap-4 px-5 py-4 text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-base sm:text-lg text-foreground",
							children: t(`faq.q${n}`)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary",
							children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3.5 w-3.5" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
						initial: false,
						children: open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
							initial: {
								height: 0,
								opacity: 0
							},
							animate: {
								height: "auto",
								opacity: 1
							},
							exit: {
								height: 0,
								opacity: 0
							},
							transition: { duration: .25 },
							className: "overflow-hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "px-5 pb-5 text-sm text-muted-foreground leading-relaxed",
								children: t(`faq.a${n}`)
							})
						})
					})] }, n);
				})
			})]
		})
	});
}
function Contact() {
	const { t } = useTranslation();
	const waLink = buildWhatsAppLink("Hola, me interesa alquilar la camper en Valencia.");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "contact",
		className: "py-24 sm:py-32 border-t border-border/40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t("contact.title") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-12 max-w-lg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl border border-border/60 bg-surface p-7 sm:p-9",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "mt-0.5 h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-foreground",
									children: t("contact.location")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: INSTAGRAM_URL,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "flex items-center gap-3 text-foreground hover:text-primary transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Instagram, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: INSTAGRAM_HANDLE })]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: waLink,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-[#0a0e1a] hover:brightness-110 transition",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4" }), t("contact.whatsapp")]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-3 text-sm text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "mt-0.5 h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("contact.hours") })]
							})
						]
					})
				})
			})]
		})
	});
}
function Index() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hero, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fleet, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowItWorks, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingCalendar, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Routes, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reviews, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FAQ, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Contact, {})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { Index as component };
