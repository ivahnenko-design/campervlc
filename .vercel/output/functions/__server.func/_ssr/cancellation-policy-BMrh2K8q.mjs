import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useTranslation } from "../_libs/react-i18next.mjs";
import { b as Info } from "../_libs/lucide-react.mjs";
import { i as Navbar, t as Footer } from "./Footer-2t9_ZE3B.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cancellation-policy-BMrh2K8q.js
var import_jsx_runtime = require_jsx_runtime();
var TIERS = [
	1,
	2,
	3,
	4
];
function CancellationPolicyPage() {
	const { t } = useTranslation();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-background text-foreground min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl sm:text-4xl mb-4",
						children: t("cancellationPolicy.title")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground mb-10",
						children: t("cancellationPolicy.intro")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-4",
						children: TIERS.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-border/60 bg-surface p-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg text-foreground mb-2",
								children: t(`cancellationPolicy.tier${n}_title`)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: t(`cancellationPolicy.tier${n}_body`)
							})]
						}, n))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6 flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-5 w-5 text-primary shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-foreground",
							children: t("cancellationPolicy.cta_cancel")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/cancel-booking",
							className: "mt-2 inline-block text-sm font-medium text-primary underline hover:brightness-110 transition",
							children: [t("cancellationPolicy.cta_cancel_link"), " →"]
						})] })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { CancellationPolicyPage as component };
