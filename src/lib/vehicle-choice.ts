// Which camper the guest is looking at on the home page (city switch in the
// fleet and booking sections). Shared by both sections without a provider; the
// choice is mirrored in the URL as ?city=alicante. With one camper there is
// nothing to choose and this always returns it.
import { useSyncExternalStore } from "react";
import { FLEET, type Camper } from "@/data/fleet";

export const CITY_QUERY_PARAM = "city";
export const MULTI_CAMPER = FLEET.length > 1;

const DEFAULT = FLEET[0];
let current: Camper = DEFAULT;
let initialised = false;
const listeners = new Set<() => void>();

function fromUrl(): Camper {
  if (typeof window === "undefined" || !MULTI_CAMPER) return DEFAULT;
  const slug = new URLSearchParams(window.location.search).get(CITY_QUERY_PARAM)?.toLowerCase();
  return FLEET.find((c) => c.vehicle.city.slug === slug) || DEFAULT;
}

function snapshot(): Camper {
  if (!initialised && typeof window !== "undefined") {
    initialised = true;
    current = fromUrl();
  }
  return current;
}

export function useChosenCamper(): Camper {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot,
    () => DEFAULT,
  );
}

export function chooseCamper(id: string) {
  const next = FLEET.find((c) => c.id === id);
  if (!next || next === current) return;
  current = next;
  initialised = true;
  try {
    const url = new URL(window.location.href);
    if (next === DEFAULT) url.searchParams.delete(CITY_QUERY_PARAM);
    else url.searchParams.set(CITY_QUERY_PARAM, next.vehicle.city.slug);
    window.history.replaceState(window.history.state, "", url);
  } catch {
    /* no history API: the choice still works on this page */
  }
  listeners.forEach((l) => l());
}
