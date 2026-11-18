import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Star, Users, Snowflake, Sun, PawPrint, ArrowRight, CalendarDays } from "lucide-react";
import { EXTRAS, PRICES, longStayDiscountPct, withIva } from "@/utils/pricing";

export const SLOGAN = "Rent. Retreat. Repeat.";

type Stop = { name: string; lat: number; lng: number; side?: "l" | "r" };
type HeroRoute = {
  id: "r1" | "r2" | "r3" | "r4" | "r5";
  slug: string;
  /** Nights used for the "whole trip from" price; null = no fixed trip (festivals). */
  nights: number | null;
  /** Draw a line through the stops (false = separate venues). */
  path: boolean;
  stops: Stop[];
};

const VALENCIA: Stop = { name: "Valencia", lat: 39.47, lng: -0.38 };

// Stops follow the order of the day-by-day guides in src/data/routes-content.ts.
const ROUTES: HeroRoute[] = [
  {
    id: "r1", slug: "costa-blanca", nights: 3, path: true,
    stops: [
      { name: "Cullera", lat: 39.16, lng: -0.25 },
      { name: "Gandía", lat: 38.97, lng: -0.18 },
      { name: "Jávea", lat: 38.79, lng: 0.17 },
      { name: "Calpe", lat: 38.64, lng: 0.05 },
      { name: "Altea", lat: 38.6, lng: -0.05 },
      { name: "Villajoyosa", lat: 38.51, lng: -0.23 },
      { name: "Alicante", lat: 38.35, lng: -0.48 },
    ],
  },
  {
    id: "r4", slug: "valencia-barcelona", nights: 4, path: true,
    stops: [
      { name: "Peñíscola", lat: 40.36, lng: 0.41 },
      { name: "Delta de l'Ebre", lat: 40.72, lng: 0.8 },
      { name: "Tarragona", lat: 41.12, lng: 1.25 },
      { name: "Sitges", lat: 41.24, lng: 1.81 },
      { name: "Barcelona", lat: 41.39, lng: 2.17 },
    ],
  },
  {
    id: "r2", slug: "pais-vasco", nights: 10, path: true,
    stops: [
      { name: "Teruel", lat: 40.34, lng: -1.11 },
      { name: "Zaragoza", lat: 41.65, lng: -0.88 },
      { name: "Pamplona", lat: 42.81, lng: -1.64 },
      { name: "San Sebastián", lat: 43.32, lng: -1.98 },
      { name: "Bilbao", lat: 43.26, lng: -2.93 },
      { name: "La Rioja", lat: 42.47, lng: -2.45 },
    ],
  },
  {
    id: "r3", slug: "andalucia", nights: 10, path: true,
    stops: [
      { name: "Granada", lat: 37.18, lng: -3.6 },
      { name: "Ronda", lat: 36.74, lng: -5.17, side: "l" },
      { name: "Málaga", lat: 36.72, lng: -4.42 },
      { name: "Cabo de Gata", lat: 36.72, lng: -2.19 },
      { name: "Cartagena", lat: 37.6, lng: -0.99 },
    ],
  },
  {
    id: "r5", slug: "festivales-2027", nights: null, path: false,
    stops: [
      { name: "FIB · Rototom", lat: 40.05, lng: 0.07 },
      { name: "Arenal Sound", lat: 39.89, lng: -0.08 },
      { name: "Medusa", lat: 39.16, lng: -0.25 },
      { name: "Low", lat: 38.54, lng: -0.13 },
    ],
  },
];

const CLEANING = EXTRAS.find((e) => e.id === "cleaning_fee")?.price ?? 0;

/** Whole trip at the low-season rate: nights, long-stay discount, cleaning, IVA. */
function tripPrice(nights: number) {
  const subtotal = PRICES.low * nights;
  const discounted = subtotal - Math.round(subtotal * (longStayDiscountPct(nights) / 100));
  return withIva(discounted + CLEANING);
}

// ── Map: an equirectangular projection fitted to the selected route ─────────
const W = 600;
const H = 640;
const PAD = 70;
const COS_LAT = Math.cos((40 * Math.PI) / 180);

function project(points: Stop[]) {
  const xs = points.map((p) => p.lng * COS_LAT);
  const ys = points.map((p) => -p.lat);
  let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  // Never zoom closer than ~1.4° so short routes keep some context.
  const minSpan = 1.4;
  if (x1 - x0 < minSpan) { const c = (x0 + x1) / 2; x0 = c - minSpan / 2; x1 = c + minSpan / 2; }
  if (y1 - y0 < minSpan) { const c = (y0 + y1) / 2; y0 = c - minSpan / 2; y1 = c + minSpan / 2; }
  const k = Math.min((W - PAD * 2) / (x1 - x0), (H - PAD * 2) / (y1 - y0));
  const ox = (W - (x1 - x0) * k) / 2;
  const oy = (H - (y1 - y0) * k) / 2;
  const at = (lat: number, lng: number) => ({ x: ox + (lng * COS_LAT - x0) * k, y: oy + (-lat - y0) * k });
  return { at, k, bounds: { x0, x1, y0, y1 } };
}

function RouteMap({ route, label, sea }: { route: HeroRoute; label: string; sea: string }) {
  const reduce = useReducedMotion();
  const all = [VALENCIA, ...route.stops];
  const { at, bounds } = useMemo(() => project(all), [route.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const pts = all.map((s) => ({ ...s, ...at(s.lat, s.lng) }));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Whole-degree graticule inside the fitted bounds.
  const lats: number[] = [];
  for (let la = Math.ceil(-bounds.y1) - 1; la <= Math.floor(-bounds.y0) + 1; la++) lats.push(la);
  const lngs: number[] = [];
  for (let lo = Math.floor(bounds.x0 / COS_LAT) - 1; lo <= Math.ceil(bounds.x1 / COS_LAT) + 1; lo++) lngs.push(lo);
  const seaPos = at(39.75, 0.55);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={label}>
      <g stroke="currentColor" className="text-border" strokeWidth="1" opacity="0.5">
        {lats.map((la) => { const y = at(la, 0).y; return <line key={`la${la}`} x1="0" x2={W} y1={y} y2={y} />; })}
        {lngs.map((lo) => { const x = at(40, lo).x; return <line key={`lo${lo}`} y1="0" y2={H} x1={x} x2={x} />; })}
      </g>
      <g className="fill-muted-foreground" fontSize="12" fontFamily="var(--font-mono)">
        {lats.map((la) => { const y = at(la, 0).y; return y > 14 && y < H - 6 ? <text key={`t${la}`} x="10" y={y - 6}>{la}°N</text> : null; })}
      </g>
      {route.id !== "r2" && route.id !== "r3" && (
        <text x={Math.min(seaPos.x, W - 16)} y={seaPos.y} textAnchor={seaPos.x > W - 160 ? "end" : "start"} className="fill-muted-foreground" fontSize="15" fontStyle="italic" opacity="0.7">{sea}</text>
      )}
      <AnimatePresence mode="wait">
        <motion.g key={route.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25 }}>
          {route.path && (
            <motion.path
              d={d}
              fill="none"
              className="stroke-primary"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 0.9, ease: "easeInOut" }}
            />
          )}
          {pts.map((p, i) => {
            const right = p.side ? p.side === "r" : p.x < W * 0.62;
            return (
              <g key={p.name}>
                <circle cx={p.x} cy={p.y} r={i === 0 ? 9 : 6} className={i === 0 ? "fill-primary" : "fill-foreground"} />
                {i === 0 && <circle cx={p.x} cy={p.y} r="16" fill="none" className="stroke-primary" strokeWidth="2" opacity="0.5" />}
                <text
                  x={p.x + (right ? 14 : -14)}
                  y={p.y + 5}
                  textAnchor={right ? "start" : "end"}
                  className={i === 0 ? "fill-primary" : "fill-foreground"}
                  fontSize={i === 0 ? 18 : 15}
                  fontWeight={i === 0 ? 700 : 500}
                  paintOrder="stroke"
                  stroke="var(--color-surface)"
                  strokeWidth="4"
                >
                  {p.name}
                </text>
              </g>
            );
          })}
        </motion.g>
      </AnimatePresence>
    </svg>
  );
}

export function Hero() {
  const { t } = useTranslation();
  const [active, setActive] = useState<HeroRoute["id"]>("r1");
  const route = ROUTES.find((r) => r.id === active) ?? ROUTES[0];
  const days = (r: HeroRoute) =>
    `${t(`routes.${r.id}_dur`)} ${t(`routes.${r.id}_unit`, { defaultValue: t("routes.days") })}`;

  return (
    <section id="top" className="relative w-full overflow-hidden pt-28 pb-16 sm:pt-32 lg:pb-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-8">
        <div className="min-w-0">
          <p className="font-poster text-xl uppercase tracking-[0.06em] text-primary sm:text-2xl">{SLOGAN}</p>
          <h1 className="font-poster mt-3 text-5xl uppercase leading-[0.92] text-foreground text-balance sm:text-6xl lg:text-7xl">
            {t("hero.question")}
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">{t("hero.routesSub")}</p>

          <div className="mt-7 grid gap-2.5" role="radiogroup" aria-label={t("routes.title")}>
            {ROUTES.map((r) => {
              const on = r.id === active;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setActive(r.id)}
                  onMouseEnter={() => setActive(r.id)}
                  className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    on ? "border-primary bg-surface" : "border-border/60 bg-surface/40 hover:border-border"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{t(`routes.${r.id}_name`)}</span>
                    <span className="block text-xs text-muted-foreground">{days(r)}</span>
                  </span>
                  <span className="font-poster shrink-0 text-lg text-primary">
                    {r.nights ? t("hero.tripFrom", { price: tripPrice(r.nights) }) : "+150 €"}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {route.nights ? t("hero.tripNote", { n: route.nights }) : t("hero.festNote")}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#booking"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-amber"
            >
              <CalendarDays className="h-4 w-4" /> {t("hero.chooseDates")}
            </a>
            <Link
              to="/rutas/$slug"
              params={{ slug: route.slug }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {t("hero.viewRoute")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="relative aspect-[15/16] w-full overflow-hidden rounded-2xl border border-border/60 bg-surface">
            <RouteMap route={route} label={t("hero.mapLabel")} sea={t("hero.sea")} />
            <div className="absolute left-4 top-4 rounded-lg bg-background/85 px-3 py-1.5 text-xs text-foreground backdrop-blur">
              {t(`routes.${route.id}_name`)} · {days(route)}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Badge icon={<Star className="h-3.5 w-3.5 fill-primary text-primary" />}>{t("hero.badges.rating")}</Badge>
            <Badge icon={<Users className="h-3.5 w-3.5" />}>{t("hero.badges.capacity")}</Badge>
            <Badge icon={<Snowflake className="h-3.5 w-3.5" />}>{t("hero.badges.ac")}</Badge>
            <Badge icon={<Sun className="h-3.5 w-3.5" />}>{t("hero.badges.solar")}</Badge>
            <Badge icon={<PawPrint className="h-3.5 w-3.5" />}>{t("hero.badges.pet")}</Badge>
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-surface/50 px-3 py-1">
      {icon}
      <span className="text-foreground/90">{children}</span>
    </span>
  );
}
