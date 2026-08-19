import { createIsomorphicFn } from "@tanstack/react-start";
import {
  getCookie,
  getRequestHeader,
  getRequestUrl,
} from "@tanstack/react-start/server";

export const LANGUAGES = [
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "uk", flag: "🇺🇦", label: "UK" },
  { code: "ru", flag: "🇷🇺", label: "RU" },
  { code: "de", flag: "🇩🇪", label: "DE" },
  { code: "it", flag: "🇮🇹", label: "IT" },
  { code: "nl", flag: "🇳🇱", label: "NL" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const LANGUAGE_CODES: LanguageCode[] = LANGUAGES.map((l) => l.code);
export const DEFAULT_LANGUAGE: LanguageCode = "es";

/** Query param used by the sitemap hreflang URLs (…/?lang=de). */
export const LANGUAGE_QUERY_PARAM = "lang";
/** Cookie mirrors the choice so SSR can render the right language on the first paint. */
export const LANGUAGE_COOKIE = "lang";
/** Key i18next-browser-languagedetector used, kept so existing visitors keep their choice. */
export const LANGUAGE_STORAGE_KEY = "i18nextLng";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Accepts "de", "de-DE", "DE_de" → "de"; anything unsupported → null. */
export function normalizeLanguage(value: string | null | undefined): LanguageCode | null {
  if (!value) return null;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return (LANGUAGE_CODES as string[]).includes(base) ? (base as LanguageCode) : null;
}

/** Picks the highest-q supported language out of an Accept-Language header. */
export function pickFromAcceptLanguage(header: string | null | undefined): LanguageCode | null {
  if (!header) return null;
  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.split("=")[1]) : 1;
      return { tag, q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const lang = normalizeLanguage(tag);
    if (lang) return lang;
  }
  return null;
}

function readDocumentCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Resolves the language for the current render.
 *
 * Server: ?lang= → cookie → Accept-Language → default.
 * Client: the <html lang> the server just rendered, so hydration always
 * matches. Only when that is missing does it fall back to its own chain.
 */
export const resolveLanguage = createIsomorphicFn()
  .server((): LanguageCode => {
    try {
      const fromQuery = normalizeLanguage(
        getRequestUrl().searchParams.get(LANGUAGE_QUERY_PARAM),
      );
      if (fromQuery) return fromQuery;

      const fromCookie = normalizeLanguage(getCookie(LANGUAGE_COOKIE));
      if (fromCookie) return fromCookie;

      const fromHeader = pickFromAcceptLanguage(getRequestHeader("accept-language"));
      if (fromHeader) return fromHeader;
    } catch {
      // Rendered outside a request context (e.g. prerender) — fall through.
    }
    return DEFAULT_LANGUAGE;
  })
  .client((): LanguageCode => {
    const fromDocument = normalizeLanguage(document.documentElement.lang);
    if (fromDocument) return fromDocument;

    const fromQuery = normalizeLanguage(
      new URLSearchParams(window.location.search).get(LANGUAGE_QUERY_PARAM),
    );
    if (fromQuery) return fromQuery;

    const fromCookie = normalizeLanguage(readDocumentCookie(LANGUAGE_COOKIE));
    if (fromCookie) return fromCookie;

    try {
      const stored = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
      if (stored) return stored;
    } catch {
      // localStorage can throw in private mode — ignore.
    }

    return normalizeLanguage(window.navigator.language) ?? DEFAULT_LANGUAGE;
  });

/** Language the visitor previously chose, if any. Client only. */
export function readStoredLanguage(): LanguageCode | null {
  const fromCookie = normalizeLanguage(readDocumentCookie(LANGUAGE_COOKIE));
  if (fromCookie) return fromCookie;
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Mirrors the choice into the cookie (for SSR), localStorage and <html lang>. */
export function persistLanguage(lang: LanguageCode): void {
  if (typeof document === "undefined") return;

  document.documentElement.lang = lang;
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}
