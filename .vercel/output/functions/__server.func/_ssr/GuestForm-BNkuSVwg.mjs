import { o as __toESM } from "../_runtime.mjs";
import { n as useForm, r as require_react, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { r as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as useTranslation } from "../_libs/react-i18next.mjs";
import { g as LoaderCircle } from "../_libs/lucide-react.mjs";
import { n as objectType, r as stringType, t as coerce } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/GuestForm-BNkuSVwg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MAX_CAPACITY = 5;
var schema = objectType({
	firstName: stringType().min(1),
	lastName: stringType().min(1),
	email: stringType().email(),
	phone: stringType().min(6),
	adults: coerce.number().int().min(1).max(MAX_CAPACITY),
	children: coerce.number().int().min(0).max(MAX_CAPACITY - 1),
	message: stringType().optional()
}).refine((data) => data.adults + data.children <= MAX_CAPACITY, {
	message: `Adults + children must not exceed ${MAX_CAPACITY}`,
	path: ["children"]
});
function GuestForm({ onSubmit, isLoading }) {
	const { t } = useTranslation();
	const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
		resolver: u(schema),
		defaultValues: {
			adults: 2,
			children: 0
		}
	});
	const adultsValue = watch("adults");
	const childrenValue = watch("children");
	const maxChildrenForAdults = Math.max(0, MAX_CAPACITY - (adultsValue || 1));
	const maxAdultsForChildren = Math.max(1, MAX_CAPACITY - (childrenValue || 0));
	const adultsOptions = Array.from({ length: maxAdultsForChildren }, (_, i) => i + 1);
	const childrenOptions = Array.from({ length: maxChildrenForAdults + 1 }, (_, i) => i);
	(0, import_react.useEffect)(() => {
		if (childrenValue > maxChildrenForAdults) setValue("children", maxChildrenForAdults, { shouldValidate: true });
	}, [adultsValue]);
	(0, import_react.useEffect)(() => {
		if (adultsValue > maxAdultsForChildren) setValue("adults", maxAdultsForChildren, { shouldValidate: true });
	}, [childrenValue]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: handleSubmit(onSubmit),
		className: "mt-5 space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3",
				children: t("booking.form_title")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: t("booking.form_first"),
					error: errors.firstName?.message,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						...register("firstName"),
						placeholder: t("booking.form_first"),
						className: inputCls(!!errors.firstName)
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: t("booking.form_last"),
					error: errors.lastName?.message,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						...register("lastName"),
						placeholder: t("booking.form_last"),
						className: inputCls(!!errors.lastName)
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: t("booking.form_email"),
				error: errors.email?.message,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					...register("email"),
					type: "email",
					placeholder: "you@example.com",
					className: inputCls(!!errors.email)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: t("booking.form_phone"),
				error: errors.phone?.message,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					...register("phone"),
					type: "tel",
					placeholder: "+34 600 000 000",
					className: inputCls(!!errors.phone)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: t("booking.form_adults"),
					error: errors.adults?.message,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						...register("adults", { valueAsNumber: true }),
						className: inputCls(!!errors.adults),
						children: adultsOptions.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: n,
							children: n
						}, n))
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: t("booking.form_children"),
					error: errors.children?.message,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						...register("children", { valueAsNumber: true }),
						className: inputCls(!!errors.children),
						children: childrenOptions.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: n,
							children: n
						}, n))
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] text-muted-foreground -mt-2",
				children: t("booking.form_max_capacity")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: t("booking.form_message"),
				error: void 0,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					...register("message"),
					rows: 2,
					placeholder: t("booking.form_message"),
					className: `${inputCls(false)} resize-none`
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "submit",
				disabled: isLoading,
				className: "mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition",
				children: [isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), t("booking.form_submit")]
			})
		]
	});
}
function inputCls(hasError) {
	return `w-full rounded-lg border px-3 py-2 text-sm bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary ${hasError ? "border-rose-500" : "border-border/60"}`;
}
function Field({ label, error, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			className: "mb-1 block text-xs text-muted-foreground",
			children: label
		}),
		children,
		error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-0.5 text-[10px] text-rose-500",
			children: error
		})
	] });
}
//#endregion
export { GuestForm as n, inputCls as r, Field as t };
