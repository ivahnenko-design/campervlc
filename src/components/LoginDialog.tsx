import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Fingerprint, Loader2, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  AuthRequestError,
  closeLogin,
  loginWithGoogle,
  loginWithPasskey,
  passkeysSupported,
  registerPasskey,
  requestEmailCode,
  useAuth,
  verifyEmailCode,
} from "@/lib/auth";
import { track } from "@/lib/analytics";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (r: { credential: string }) => void;
          }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary sm:text-sm";

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    const s =
      existing || Object.assign(document.createElement("script"), { src: GSI_SRC, async: true });
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject(new Error("gsi")));
    if (!existing) document.head.appendChild(s);
  });
}

export function LoginDialog() {
  const { t, i18n } = useTranslation();
  const { dialogOpen, discountPct, googleClientId, user } = useAuth();
  const [step, setStep] = useState<"choose" | "code" | "passkey" | "done">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const canPasskey = passkeysSupported();

  const fail = (e: unknown, fallback = "default") => {
    const c = e instanceof AuthRequestError ? e.code : fallback;
    const key = `auth.err_${c}`;
    setError(i18n.exists(key) ? t(key) : t("auth.err_default"));
  };

  // After a login: offer to turn on a passkey, once, only where the device supports it.
  const afterLogin = (hasPasskey: boolean, method: string) => {
    track("login", { method });
    if (canPasskey && !hasPasskey && method !== "passkey") setStep("passkey");
    else setStep("done");
  };

  useEffect(() => {
    if (!dialogOpen) return;
    setStep("choose");
    setError(null);
    setCode("");
  }, [dialogOpen]);

  // Google's own button (their script, their consent screen).
  useEffect(() => {
    if (!dialogOpen || step !== "choose" || !googleClientId || user) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !googleRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (r) => {
            setBusy(true);
            loginWithGoogle(r.credential)
              .then((u) => afterLogin(u.passkeys.length > 0, "google"))
              .catch((e) => fail(e, "google"))
              .finally(() => setBusy(false));
          },
        });
        googleRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleRef.current, {
          theme: "outline",
          size: "large",
          width: 280,
          shape: "pill",
          locale: i18n.language,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, step, googleClientId, user]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestEmailCode(email.trim(), i18n.language);
      setStep("code");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = await verifyEmailCode(email.trim(), code);
      afterLogin(u.passkeys.length > 0, "email");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function passkeyLogin() {
    setError(null);
    setBusy(true);
    try {
      const u = await loginWithPasskey();
      afterLogin(u.passkeys.length > 0, "passkey");
    } catch (err) {
      // The user closing the system sheet is not an error worth showing.
      if (!(err instanceof Error && err.name === "NotAllowedError")) fail(err, "passkey");
    } finally {
      setBusy(false);
    }
  }

  async function addPasskey() {
    setError(null);
    setBusy(true);
    try {
      await registerPasskey();
      setStep("done");
    } catch (err) {
      if (!(err instanceof Error && err.name === "NotAllowedError")) fail(err, "passkey");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60";

  return (
    <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeLogin()}>
      <DialogContent className="max-w-sm">
        <DialogTitle className="font-display text-xl">
          {step === "passkey"
            ? t("auth.passkey_offer_title")
            : step === "done"
              ? t("auth.done", { pct: discountPct })
              : t("auth.title")}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {step === "choose" && t("auth.subtitle", { pct: discountPct })}
          {step === "code" && t("auth.code_sent", { email })}
          {step === "passkey" && t("auth.passkey_offer_text")}
          {step === "done" && " "}
        </DialogDescription>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {step === "choose" && (
          <div className="space-y-3">
            {canPasskey && (
              <button
                type="button"
                onClick={passkeyLogin}
                disabled={busy}
                className={`${btn} bg-primary text-primary-foreground`}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="h-4 w-4" />
                )}{" "}
                {t("auth.passkey")}
              </button>
            )}
            {googleClientId && <div ref={googleRef} className="flex min-h-[44px] justify-center" />}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t("auth.or_email")}
              <span className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={sendCode} className="space-y-3">
              <label className="block text-sm">
                <span className="sr-only">{t("auth.email_label")}</span>
                <input
                  className={inputCls}
                  type="email"
                  inputMode="email"
                  autoComplete="email webauthn"
                  placeholder={t("auth.email_label")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <button disabled={busy || !email} className={`${btn} border border-border`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}{" "}
                {t("auth.send_code")}
              </button>
            </form>
          </div>
        )}

        {step === "code" && (
          <form onSubmit={verify} className="space-y-3">
            <input
              className={inputCls}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t("auth.code_label")}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
            <button
              disabled={busy || code.length !== 6}
              className={`${btn} bg-primary text-primary-foreground`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.verify")}
            </button>
          </form>
        )}

        {step === "passkey" && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={addPasskey}
              disabled={busy}
              className={`${btn} bg-primary text-primary-foreground`}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Fingerprint className="h-4 w-4" />
              )}{" "}
              {t("auth.passkey_add")}
            </button>
            <button
              type="button"
              onClick={() => setStep("done")}
              className={`${btn} text-muted-foreground`}
            >
              {t("auth.skip")}
            </button>
          </div>
        )}

        {step === "done" && (
          <button
            type="button"
            onClick={closeLogin}
            className={`${btn} bg-primary text-primary-foreground`}
          >
            {t("auth.close")}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
