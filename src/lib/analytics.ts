// Thin wrapper over GA4's gtag (loaded in __root.tsx). Safe to call anywhere:
// it does nothing on the server, before gtag loads or when it is blocked.
type Params = Record<string, string | number | boolean | undefined>;

export function track(event: string, params: Params = {}) {
  try {
    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (typeof gtag === "function") gtag("event", event, params);
  } catch {
    // analytics must never break the page
  }
}
