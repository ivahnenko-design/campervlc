import { o as __toESM } from "../_runtime.mjs";
import { n as useForm, r as require_react, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useTranslation } from "../_libs/react-i18next.mjs";
import { g as LoaderCircle, w as CircleCheckBig } from "../_libs/lucide-react.mjs";
import { i as Navbar, t as Footer } from "./Footer-2t9_ZE3B.mjs";
import { n as objectType, r as stringType } from "../_libs/zod.mjs";
import { r as inputCls, t as Field } from "./GuestForm-BNkuSVwg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cancel-booking-CbZsPMh2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var lookupSchema = objectType({
	bookingRef: stringType().trim().optional(),
	email: stringType().trim().optional(),
	lastName: stringType().trim().min(1)
}).refine((d) => !!d.bookingRef || !!d.email, {
	message: "form_required",
	path: ["bookingRef"]
});
function CancelBookingPage() {
	const { t } = useTranslation();
	const [stage, setStage] = (0, import_react.useState)("lookup");
	const [quote, setQuote] = (0, import_react.useState)(null);
	const [identity, setIdentity] = (0, import_react.useState)(null);
	const [lookupError, setLookupError] = (0, import_react.useState)(null);
	const [confirmError, setConfirmError] = (0, import_react.useState)(null);
	const [confirmLoading, setConfirmLoading] = (0, import_react.useState)(false);
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: u(lookupSchema) });
	const onLookup = async (data) => {
		setLookupError(null);
		try {
			const res = await fetch("/api/cancel-booking", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "lookup",
					bookingRef: data.bookingRef || void 0,
					email: data.email || void 0,
					lastName: data.lastName
				})
			});
			const body = await res.json();
			if (!res.ok) {
				setLookupError(body.error || "not_found");
				return;
			}
			setQuote(body);
			setIdentity({
				bookingRef: data.bookingRef || void 0,
				email: data.email || void 0,
				lastName: data.lastName
			});
			setStage("quote");
		} catch {
			setLookupError("generic");
		}
	};
	const onConfirm = async () => {
		if (!identity) return;
		setConfirmLoading(true);
		setConfirmError(null);
		try {
			const res = await fetch("/api/cancel-booking", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "confirm",
					...identity
				})
			});
			const body = await res.json();
			if (!res.ok) {
				setConfirmError(body.error || "generic");
				setConfirmLoading(false);
				return;
			}
			setQuote((q) => q ? {
				...q,
				refundPct: body.refundPct,
				refundAmount: body.refundAmount
			} : q);
			setStage("done");
		} catch {
			setConfirmError("generic");
			setConfirmLoading(false);
		}
	};
	const lookupErrorKey = lookupError ? {
		not_found: "cancelBooking.error_not_found",
		ambiguous: "cancelBooking.error_ambiguous",
		already_cancelled: "cancelBooking.error_already_cancelled"
	}[lookupError] || "cancelBooking.error_generic" : null;
	const confirmErrorKey = confirmError ? {
		already_cancelled: "cancelBooking.error_already_cancelled",
		refund_failed: "cancelBooking.error_refund_failed",
		no_payment_intent: "cancelBooking.error_refund_failed"
	}[confirmError] || "cancelBooking.error_generic" : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-background text-foreground min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-md px-4 sm:px-6 py-24 sm:py-32",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl sm:text-4xl mb-3",
						children: t("cancelBooking.title")
					}),
					stage === "lookup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground mb-8 text-sm",
						children: t("cancelBooking.intro")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSubmit(onLookup),
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("cancelBooking.form_ref"),
								error: errors.bookingRef?.message ? t(`cancelBooking.${errors.bookingRef.message}`) : void 0,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									...register("bookingRef"),
									placeholder: t("cancelBooking.form_ref_placeholder"),
									className: inputCls(!!errors.bookingRef)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center text-xs uppercase tracking-widest text-muted-foreground",
								children: t("cancelBooking.form_or")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("cancelBooking.form_email"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									...register("email"),
									type: "email",
									placeholder: "you@example.com",
									className: inputCls(false)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("cancelBooking.form_lastname"),
								error: errors.lastName?.message ? t("booking.form_required") : void 0,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									...register("lastName"),
									className: inputCls(!!errors.lastName)
								})
							}),
							lookupErrorKey && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-rose-500",
								children: t(lookupErrorKey)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								disabled: isSubmitting,
								className: "mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition",
								children: [isSubmitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), t("cancelBooking.form_submit")]
							})
						]
					})] }),
					stage === "quote" && quote && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border/60 bg-surface p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg mb-4",
								children: t("cancelBooking.quote_title")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm text-muted-foreground space-y-1 mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: quote.bookingRef }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									quote.startDate,
									" → ",
									quote.endDate,
									" · ",
									quote.nights,
									" ",
									t("booking.nights").toLowerCase()
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-foreground mb-6",
								children: quote.refundPct > 0 ? t("cancelBooking.quote_refund_full", {
									pct: quote.refundPct,
									amount: quote.refundAmount
								}) : t("cancelBooking.quote_refund_zero")
							}),
							confirmErrorKey && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-rose-500 mb-3",
								children: t(confirmErrorKey)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: onConfirm,
								disabled: confirmLoading,
								className: "flex w-full items-center justify-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition",
								children: [confirmLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), confirmLoading ? t("cancelBooking.quote_processing") : t("cancelBooking.quote_confirm")]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setStage("lookup"),
								disabled: confirmLoading,
								className: "mt-3 flex w-full items-center justify-center rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition",
								children: t("cancelBooking.quote_back")
							})
						]
					}),
					stage === "done" && quote && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center space-y-6 py-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "mx-auto h-14 w-14 text-emerald-500" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl",
								children: t("cancelBooking.done_title")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground text-sm",
								children: t("cancelBooking.done_body")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/",
								className: "inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition",
								children: ["← ", t("cancelBooking.back_home")]
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
export { CancelBookingPage as component };
