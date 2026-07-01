import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  adults: z.coerce.number().int().min(1).max(5),
  children: z.coerce.number().int().min(0).max(4),
  message: z.string().optional(),
});

export type GuestData = z.infer<typeof schema>;

interface GuestFormProps {
  onSubmit: (data: GuestData) => Promise<void>;
  isLoading: boolean;
}

export function GuestForm({ onSubmit, isLoading }: GuestFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestData>({
    resolver: zodResolver(schema),
    defaultValues: { adults: 2, children: 0 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
        {t("booking.form_title")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("booking.form_first")} error={errors.firstName?.message}>
          <input
            {...register("firstName")}
            placeholder={t("booking.form_first")}
            className={inputCls(!!errors.firstName)}
          />
        </Field>
        <Field label={t("booking.form_last")} error={errors.lastName?.message}>
          <input
            {...register("lastName")}
            placeholder={t("booking.form_last")}
            className={inputCls(!!errors.lastName)}
          />
        </Field>
      </div>

      <Field label={t("booking.form_email")} error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          placeholder="you@example.com"
          className={inputCls(!!errors.email)}
        />
      </Field>

      <Field label={t("booking.form_phone")} error={errors.phone?.message}>
        <input
          {...register("phone")}
          type="tel"
          placeholder="+34 600 000 000"
          className={inputCls(!!errors.phone)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("booking.form_adults")} error={errors.adults?.message}>
          <select {...register("adults")} className={inputCls(!!errors.adults)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Field>
        <Field label={t("booking.form_children")} error={errors.children?.message}>
          <select {...register("children")} className={inputCls(!!errors.children)}>
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t("booking.form_message")} error={undefined}>
        <textarea
          {...register("message")}
          rows={2}
          placeholder={t("booking.form_message")}
          className={`${inputCls(false)} resize-none`}
        />
      </Field>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("booking.form_submit")}
      </button>
    </form>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary ${
    hasError ? "border-rose-500" : "border-border/60"
  }`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      {children}
      {error && <p className="mt-0.5 text-[10px] text-rose-500">{error}</p>}
    </div>
  );
}
