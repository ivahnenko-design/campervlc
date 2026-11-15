// Guest login state shared by the navbar strip, the login dialog and the booking
// calculator. A tiny external store (no provider needed, SSR-safe): the server
// always renders the "logged out" state and the client fills it in after /me.
import { useSyncExternalStore } from "react";

export interface AuthUser {
  email: string;
  name: string;
  google: boolean;
  discountAvailable: boolean;
  passkeys: { id: string; createdAt: number; device: string }[];
}

interface AuthState {
  loaded: boolean;
  user: AuthUser | null;
  discountPct: number;
  googleClientId: string | null;
  dialogOpen: boolean;
}

let state: AuthState = {
  loaded: false,
  user: null,
  discountPct: 5,
  googleClientId: null,
  dialogOpen: false,
};
const listeners = new Set<() => void>();
const SERVER_STATE = state;

function patch(p: Partial<AuthState>) {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => SERVER_STATE,
  );
}

export class AuthRequestError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

async function call<T>(action: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/contract?scope=auth&action=${action}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { code?: string } & Record<string, unknown>;
  if (!res.ok) throw new AuthRequestError(json.code || "default");
  return json as T;
}

let started = false;

/** Reads the session once per page load. */
export async function loadAuth(force = false) {
  if (started && !force) return;
  started = true;
  try {
    const r = await call<{
      user: AuthUser | null;
      discountPct: number;
      googleClientId: string | null;
    }>("me");
    // A host without the API (local dev) answers with HTML or {}: keep the defaults then.
    patch({
      loaded: true,
      user: r.user && typeof r.user.email === "string" ? r.user : null,
      ...(typeof r.discountPct === "number" ? { discountPct: r.discountPct } : {}),
      googleClientId: typeof r.googleClientId === "string" ? r.googleClientId : null,
    });
  } catch {
    patch({ loaded: true });
  }
}

export const openLogin = () => patch({ dialogOpen: true });
export const closeLogin = () => patch({ dialogOpen: false });

export async function requestEmailCode(email: string, lang: string) {
  await call("email-code", { email, lang });
}

export async function verifyEmailCode(email: string, code: string) {
  const r = await call<{ user: AuthUser }>("email-verify", { email, code });
  patch({ user: r.user });
  return r.user;
}

export async function loginWithGoogle(credential: string) {
  const r = await call<{ user: AuthUser }>("google", { credential });
  patch({ user: r.user });
  return r.user;
}

export async function logout() {
  await call("logout", {});
  patch({ user: null });
}

export const passkeysSupported = () =>
  typeof window !== "undefined" && !!window.PublicKeyCredential;

export async function loginWithPasskey() {
  const { startAuthentication } = await import("@simplewebauthn/browser");
  const { options } = await call<{
    options: Parameters<typeof startAuthentication>[0]["optionsJSON"];
  }>("passkey-login-options", {});
  const response = await startAuthentication({ optionsJSON: options });
  const r = await call<{ user: AuthUser }>("passkey-login", { response });
  patch({ user: r.user });
  return r.user;
}

export async function registerPasskey() {
  const { startRegistration } = await import("@simplewebauthn/browser");
  const { options } = await call<{
    options: Parameters<typeof startRegistration>[0]["optionsJSON"];
  }>("passkey-register-options", {});
  const response = await startRegistration({ optionsJSON: options });
  const r = await call<{ user: AuthUser }>("passkey-register", { response });
  patch({ user: r.user });
  return r.user;
}
