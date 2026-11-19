import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Star, Users, Snowflake, Sun, PawPrint, ArrowRight, CalendarDays } from "lucide-react";
import LAND from "@/data/iberia-land.json";
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
  /** Photo from the route article (src/data/routes-content.ts), shown in a free corner of the map. */
  photo?: string;
  /** Author · licence for photos that need attribution. */
  photoCredit?: string;
  stops: Stop[];
};

const VALENCIA: Stop = { name: "Valencia", lat: 39.47, lng: -0.38 };

// Stops follow the order of the day-by-day guides in src/data/routes-content.ts.
const ROUTES: HeroRoute[] = [
  {
    id: "r1", slug: "costa-blanca", nights: 3, path: true, photo: "/images/routes/costa-blanca-hero-map.jpg",
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
    id: "r4", slug: "valencia-barcelona", nights: 4, path: true, photo: "/images/routes/hero-valencia-barcelona-map.jpg",
    photoCredit: "Juan Emilio Prades Bel · CC BY 4.0",
    stops: [
      { name: "Benicàssim", lat: 40.05, lng: 0.07 },
      { name: "Peñíscola", lat: 40.36, lng: 0.41 },
      { name: "Delta de l'Ebre", lat: 40.72, lng: 0.8 },
      { name: "Tarragona", lat: 41.12, lng: 1.25 },
      { name: "Sitges", lat: 41.24, lng: 1.81 },
      { name: "Barcelona", lat: 41.39, lng: 2.17 },
    ],
  },
  {
    id: "r2", slug: "pais-vasco", nights: 10, path: true, photo: "/images/routes/hero-pais-vasco-map.jpg",
    photoCredit: "Juanedc · CC BY 2.0",
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
    id: "r3", slug: "andalucia", nights: 10, path: true, photo: "/images/routes/hero-andalucia-map.jpg",
    stops: [
      { name: "Granada", lat: 37.18, lng: -3.6 },
      { name: "Ronda", lat: 36.74, lng: -5.17, side: "l" },
      { name: "Málaga", lat: 36.72, lng: -4.42 },
      { name: "Cabo de Gata", lat: 36.72, lng: -2.19 },
      { name: "Cartagena", lat: 37.6, lng: -0.99 },
    ],
  },
  {
    id: "r5", slug: "festivales-2027", nights: null, path: false, photo: "/images/routes/festivales-2027-hero-map.jpg",
    stops: [
      { name: "FIB · Rototom", lat: 40.05, lng: 0.07 },
      { name: "Arenal Sound", lat: 39.89, lng: -0.08 },
      { name: "Medusa", lat: 39.16, lng: -0.25 },
      { name: "Low", lat: 38.54, lng: -0.13 },
    ],
  },
];

/** "1095" → "1 095" with a no-break space, the same in every language. */
const groupThousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");

const CLEANING = EXTRAS.find((e) => e.id === "cleaning_fee")?.price ?? 0;

/** Whole trip at the low-season rate: nights, long-stay discount, cleaning, IVA. */
function tripPrice(nights: number) {
  const subtotal = PRICES.low * nights;
  const discounted = subtotal - Math.round(subtotal * (longStayDiscountPct(nights) / 100));
  return withIva(discounted + CLEANING);
}

// ── Map: an orthographic ("globe") projection fitted to the selected route ──
const W = 600;
const H = 640;
const PAD = 70;
const RAD = Math.PI / 180;
// Globe centre: middle of Spain, so meridians converge gently towards the north.
const LAT0 = 40 * RAD;
const LNG0 = -2 * RAD;

function ortho(lat: number, lng: number) {
  const f = lat * RAD;
  const l = lng * RAD - LNG0;
  return {
    x: Math.cos(f) * Math.sin(l),
    y: -(Math.cos(LAT0) * Math.sin(f) - Math.sin(LAT0) * Math.cos(f) * Math.cos(l)),
  };
}

function project(points: Stop[], insetRight = 0, insetBottom = 0) {
  const ps = points.map((p) => ortho(p.lat, p.lng));
  let [x0, x1, y0, y1] = [
    Math.min(...ps.map((p) => p.x)), Math.max(...ps.map((p) => p.x)),
    Math.min(...ps.map((p) => p.y)), Math.max(...ps.map((p) => p.y)),
  ];
  // Never zoom closer than ~1.4° so short routes keep some context.
  const minSpan = 1.4 * RAD;
  if (x1 - x0 < minSpan) { const c = (x0 + x1) / 2; x0 = c - minSpan / 2; x1 = c + minSpan / 2; }
  if (y1 - y0 < minSpan) { const c = (y0 + y1) / 2; y0 = c - minSpan / 2; y1 = c + minSpan / 2; }
  const k = Math.min((W - insetRight - PAD * 2) / (x1 - x0), (H - insetBottom - PAD * 2) / (y1 - y0));
  const ox = (W - insetRight - (x1 - x0) * k) / 2;
  const oy = (H - insetBottom - (y1 - y0) * k) / 2;
  const at = (lat: number, lng: number) => {
    const p = ortho(lat, lng);
    return { x: ox + (p.x - x0) * k, y: oy + (p.y - y0) * k };
  };
  const latMin = Math.min(...points.map((p) => p.lat));
  const latMax = Math.max(...points.map((p) => p.lat));
  const lngMin = Math.min(...points.map((p) => p.lng));
  const lngMax = Math.max(...points.map((p) => p.lng));
  return { at, k, span: Math.max(latMax - latMin, lngMax - lngMin, 1.4), box: { latMin, latMax, lngMin, lngMax } };
}

/** Fine graticule: thin lines every `step` degrees, slightly stronger whole degrees. */
function graticule(at: (lat: number, lng: number) => { x: number; y: number }, box: { latMin: number; latMax: number; lngMin: number; lngMax: number }, span: number) {
  const step = span > 5 ? 0.5 : span > 2.5 ? 0.25 : 0.2;
  const m = Math.max(3, span);
  const la0 = Math.floor((box.latMin - m) / step) * step;
  const la1 = box.latMax + m;
  const lo0 = Math.floor((box.lngMin - m) / step) * step;
  const lo1 = box.lngMax + m;
  const line = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("");
  const minor: string[] = [];
  const major: string[] = [];
  const isMajor = (v: number) => Math.abs(v - Math.round(v)) < 1e-6;
  for (let la = la0; la <= la1 + 1e-9; la += step) {
    const pts = [];
    for (let lo = lo0; lo <= lo1 + 1e-9; lo += (lo1 - lo0) / 48) pts.push(at(la, lo));
    (isMajor(la) ? major : minor).push(line(pts));
  }
  for (let lo = lo0; lo <= lo1 + 1e-9; lo += step) {
    const pts = [];
    for (let la = la0; la <= la1 + 1e-9; la += (la1 - la0) / 48) pts.push(at(la, lo));
    (isMajor(lo) ? major : minor).push(line(pts));
  }
  const labels: { t: string; x: number; y: number }[] = [];
  for (let la = Math.ceil(la0); la <= la1; la++) {
    // Label each whole parallel where it crosses the left edge of the frame.
    let best: { x: number; y: number } | null = null;
    for (let lo = lo0; lo <= lo1; lo += 0.05) { const p = at(la, lo); if (p.x >= 8) { best = p; break; } }
    if (best && best.y > 18 && best.y < H - 10) labels.push({ t: `${la}°N`, x: 10, y: best.y - 6 });
  }
  for (let lo = Math.ceil(lo0); lo <= lo1; lo++) {
    let best: { x: number; y: number } | null = null;
    for (let la = la0; la <= la1; la += 0.05) { const p = at(la, lo); if (p.y <= H - 8) { best = p; break; } }
    if (best && best.x > 40 && best.x < W - 40) labels.push({ t: lo === 0 ? "0°" : `${Math.abs(lo)}°${lo < 0 ? "W" : "E"}`, x: best.x + 6, y: H - 12 });
  }
  return { minor, major, labels };
}

/** Catmull-Rom spline through every stop, as cubic Béziers: a soft road-like line. */
function smoothPath(pts: { x: number; y: number }[], tension = 0.5) {
  if (pts.length < 2) return "";
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * tension * 2, y: p1.y + ((p2.y - p0.y) / 6) * tension * 2 };
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * tension * 2, y: p2.y - ((p3.y - p1.y) / 6) * tension * 2 };
    d += ` C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(p2.x)},${f(p2.y)}`;
  }
  return d;
}

const PW = 210;
const PH = 150;
const PM = 18;

/** The route photo, always in the bottom-right corner of the map. */
function MapPhoto({ href }: { href: string }) {
  const c = { x: W - PW - PM, y: H - PH - PM };
  return (
    <g>
      <clipPath id="map-photo-clip"><rect x={c.x} y={c.y} width={PW} height={PH} rx="14" /></clipPath>
      <image href={href} x={c.x} y={c.y} width={PW} height={PH} preserveAspectRatio="xMidYMid slice" clipPath="url(#map-photo-clip)" />
      <rect x={c.x} y={c.y} width={PW} height={PH} rx="14" fill="none" stroke="var(--color-background)" strokeWidth="5" />
    </g>
  );
}

function RouteMap({ route, label, sea }: { route: HeroRoute; label: string; sea: string }) {
  const reduce = useReducedMotion();
  const all = [VALENCIA, ...route.stops];
  const { at, grid, land } = useMemo(() => {
    // Keep stops and their labels clear of the photo in the bottom-right corner:
    // if anything overlaps it, refit into the larger of the two free areas.
    const hits = (p: ReturnType<typeof project>) =>
      all.some((s) => {
        const q = p.at(s.lat, s.lng);
        const w = 20 + s.name.length * 9;
        const right = s.side ? s.side === "r" : q.x < W * 0.62;
        const [l, r] = right ? [q.x - 8, q.x + w] : [q.x - w, q.x + 8];
        return r > W - PW - PM - 8 && l < W && q.y + 10 > H - PH - PM - 8;
      });
    let pr = project(all);
    if (route.photo && hits(pr)) {
      const a = project(all, PW + PM);
      const b = project(all, 0, PH + PM);
      pr = a.k >= b.k ? a : b;
    }
    const land = (LAND as number[][][])
      .map((ring) => ring.map(([lng, lat], i) => { const q = pr.at(lat, lng); return `${i ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join("") + "Z")
      .join("");
    return { at: pr.at, grid: graticule(pr.at, pr.box, pr.span), land };
  }, [route.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const pts = all.map((s) => ({ ...s, ...at(s.lat, s.lng) }));
  const d = smoothPath(pts);
  const seaPos = at(39.75, 0.55);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label={label}>
      <defs>
        <radialGradient id="globe-glow" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.07" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Sea, then real land from Natural Earth 1:10m (src/data/iberia-land.json) */}
      <rect width={W} height={H} fill="#122036" />
      <path d={land} fill="#1f3f66" stroke="#5b7ea6" strokeWidth="1.2" strokeLinejoin="round" />
      <rect width={W} height={H} fill="url(#globe-glow)" />
      <g fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="0.6" opacity="0.18">
        {grid.minor.map((p, i) => <path key={`n${i}`} d={p} />)}
      </g>
      <g fill="none" stroke="currentColor" className="text-muted-foreground" strokeWidth="1" opacity="0.4">
        {grid.major.map((p, i) => <path key={`j${i}`} d={p} />)}
      </g>
      <g className="fill-muted-foreground" fontSize="11" fontFamily="var(--font-mono)" opacity="0.8">
        {grid.labels.map((l) => <text key={l.t} x={l.x} y={l.y}>{l.t}</text>)}
      </g>
      {route.id !== "r2" && route.id !== "r3" && (
        <text x={Math.min(seaPos.x, W - 16)} y={seaPos.y} textAnchor={seaPos.x > W - 160 ? "end" : "start"} className="fill-muted-foreground" fontSize="15" fontStyle="italic" opacity="0.7">{sea}</text>
      )}
      <AnimatePresence mode="wait" initial={false}>
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
          {route.photo && <MapPhoto href={route.photo} />}
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
    <section id="top" className="relative w-full overflow-hidden pt-28 pb-4 sm:pt-32 lg:pb-8">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-8">
        <div className="min-w-0">
          <p className="font-poster text-xl uppercase tracking-[0.06em] text-primary sm:text-2xl">{SLOGAN}</p>
          <h1 className="font-poster mt-3 text-5xl uppercase leading-[1.02] text-foreground text-balance sm:text-6xl lg:text-7xl">
            {t("hero.question")}
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">{t("hero.routesSub")}</p>

          <ul className="mt-7 grid gap-2.5" aria-label={t("routes.title")}>
            {ROUTES.map((r) => {
              const on = r.id === active;
              return (
                <li key={r.id}>
                <Link
                  to="/rutas/$slug"
                  params={{ slug: r.slug }}
                  aria-current={on ? "true" : undefined}
                  onMouseEnter={() => setActive(r.id)}
                  onFocus={() => setActive(r.id)}
                  className={`group flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    on ? "border-primary bg-surface" : "border-border/60 bg-surface/40 hover:border-border"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{t(`routes.${r.id}_name`)}</span>
                    <span className="block text-xs text-muted-foreground">{days(r)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-poster text-lg text-primary [word-spacing:0.18em]">
                      {r.nights ? t("hero.tripFrom", { price: groupThousands(tripPrice(r.nights)) }) : "+150 €"}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                </Link>
                </li>
              );
            })}
          </ul>
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
          {route.photoCredit && <p className="mt-1.5 text-right text-[11px] text-muted-foreground">Foto: {route.photoCredit}</p>}
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
