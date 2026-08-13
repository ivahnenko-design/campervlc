import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useTranslation } from "../_libs/react-i18next.mjs";
import { w as CircleCheckBig } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/booking-success-CtS719UQ.js
var import_jsx_runtime = require_jsx_runtime();
function BookingSuccessPage() {
	const { t } = useTranslation();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-background flex items-center justify-center px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md w-full text-center space-y-6 py-24",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "mx-auto h-16 w-16 text-emerald-500" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl sm:text-4xl text-foreground",
					children: t("success.title", "Booking confirmed!")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: t("success.desc", "Your deposit has been received. We'll email you the details shortly.")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-foreground text-left space-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["✅ ", t("success.deposit_paid", "Deposit (50%) paid")] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["📅 ", t("success.pickup_note", "Remaining 50% is due on pickup of the campervan in Valencia.")] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["📧 ", t("success.email_note", "Check your inbox for a confirmation email.")] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition",
					children: ["← ", t("success.back", "Back to homepage")]
				})
			]
		})
	});
}
//#endregion
export { BookingSuccessPage as component };
