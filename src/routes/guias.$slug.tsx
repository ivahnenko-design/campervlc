import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SeasonCalendar } from "@/components/SeasonCalendar";
import { GUIDE_SLUGS, getGuide, guideDateModified, guidesUi } from "@/data/guides";
import { guidePhoto } from "@/data/guide-photos";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  LANGUAGE_QUERY_PARAM,
  hrefWithLanguage,
  normalizeLanguage,
  resolveLanguage,
  type LanguageCode,
} from "@/i18n/language";

const SITE = "https://campervlc.com";
const LOGO =
  "https://campervlc.com/logo.png";

// Spanish at the bare path, the other languages at ?lang=xx (same scheme as the sitemap).
const urlFor = (slug: string, lang: LanguageCode) =>
  lang === DEFAULT_LANGUAGE ? `${SITE}/guias/${slug}` : `${SITE}/guias/${slug}?${LANGUAGE_QUERY_PARAM}=${lang}`;

export const Route = createFileRoute("/guias/$slug")({
  head: ({ params }) => {
    const lang = resolveLanguage();
    const guide = getGuide(lang, params.slug);
    if (!guide) return { meta: [{ title: "Guía no encontrada" }] };
    const ui = guidesUi(lang);
    const url = urlFor(params.slug, lang);
    const hero = guidePhoto(guide.heroImage);
    const ogImage = hero ? `${SITE}${hero.src}` : `${SITE}/images/og-home.jpg`;
    return {
      meta: [
        { title: guide.metaTitle },
        { name: "description", content: guide.metaDescription },
        { property: "og:title", content: guide.metaTitle },
        { property: "og:description", content: guide.metaDescription },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: ogImage },
        ...(hero
          ? [
              { property: "og:image:width", content: String(hero.width) },
              { property: "og:image:height", content: String(hero.height) },
            ]
          : []),
        { property: "og:site_name", content: "Camper Retreat VLC" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: guide.metaTitle },
        { name: "twitter:description", content: guide.metaDescription },
        { name: "twitter:image", content: ogImage },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "x-default", href: urlFor(params.slug, DEFAULT_LANGUAGE) },
        ...LANGUAGE_CODES.map((l) => ({ rel: "alternate", hrefLang: l, href: urlFor(params.slug, l) })),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                headline: guide.h1,
                description: guide.metaDescription,
                inLanguage: lang,
                dateModified: guideDateModified(params.slug),
                ...(hero ? { image: ogImage } : {}),
                url,
                mainEntityOfPage: url,
                author: { "@type": "Organization", name: "Camper Retreat VLC", url: SITE },
                publisher: {
                  "@type": "Organization",
                  name: "Camper Retreat VLC",
                  logo: { "@type": "ImageObject", url: LOGO },
                },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: ui.breadcrumbHome, item: `${SITE}/` },
                  { "@type": "ListItem", position: 2, name: ui.label, item: `${SITE}/guias` },
                  { "@type": "ListItem", position: 3, name: guide.h1, item: url },
                ],
              },
              {
                "@type": "FAQPage",
                mainEntity: guide.faq.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              },
            ],
          }),
        },
      ],
    };
  },
  loader: ({ params }) => {
    if (!GUIDE_SLUGS.includes(params.slug)) throw notFound();
    return params.slug;
  },
  component: GuidePage,
  notFoundComponent: () => (
    <div className="bg-background text-foreground min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Guía no encontrada.</p>
    </div>
  ),
});

function GuidePage() {
  const { i18n } = useTranslation();
  const slug = Route.useLoaderData() as string;
  const lang = normalizeLanguage(i18n.language) ?? DEFAULT_LANGUAGE;
  const ui = guidesUi(lang);
  const guide = getGuide(lang, slug)!;
  const others = GUIDE_SLUGS.filter((s) => s !== slug);
  const hero = guidePhoto(guide.heroImage);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-28 pb-20 sm:pt-36">
        <Link
          to="/guias"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {ui.allGuides}
        </Link>

        <article>
          <h1 className="font-display text-3xl sm:text-5xl text-foreground leading-tight text-balance">{guide.h1}</h1>
          <p className="mt-3 text-xs text-muted-foreground/70">
            {ui.updated}: {guide.updated}
          </p>
          {hero && (
            <figure className="mt-8">
              <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl border border-border/60">
                <img
                  src={hero.src}
                  alt={guide.h1}
                  width={hero.width}
                  height={hero.height}
                  loading="eager"
                  fetchPriority="high"
                  className="w-full h-full object-cover"
                />
              </div>
              {hero.credit && <PhotoCredit text={hero.credit} href={hero.creditUrl} />}
            </figure>
          )}
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground">{guide.intro}</p>

          {slug === "mejor-epoca-autocaravana-valencia" && <SeasonCalendar year={2027} lang={lang} />}

          {guide.sections.map((s) => {
            const photo = guidePhoto(s.image);
            return (
              <section key={s.h2} className="mt-12">
                <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-4">{s.h2}</h2>
                {s.paragraphs.map((p) => (
                  <p key={p} className="mb-4 leading-relaxed text-foreground/85">
                    {p}
                  </p>
                ))}
                {s.list && s.list.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-foreground/85 marker:text-primary/70">
                    {s.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {photo && (
                  <figure className="mt-6">
                    <div className="w-full aspect-[16/9] overflow-hidden rounded-2xl border border-border/60">
                      <img
                        src={photo.src}
                        alt={s.h2}
                        width={photo.width}
                        height={photo.height}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {photo.credit && <PhotoCredit text={photo.credit} href={photo.creditUrl} />}
                  </figure>
                )}
              </section>
            );
          })}

          <section className="mt-14">
            <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-5">{ui.faqTitle}</h2>
            <div className="space-y-3">
              {guide.faq.map((f) => (
                <details key={f.q} className="group rounded-xl border border-border/60 bg-surface p-4">
                  <summary className="cursor-pointer font-medium text-foreground">{f.q}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="mt-16 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-surface to-coral/5 p-8 text-center">
            <p className="mb-6 text-muted-foreground">{guide.cta.text}</p>
            <a
              href={hrefWithLanguage("/#booking", i18n.language)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow-amber hover:brightness-110 transition"
            >
              {guide.cta.button} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </article>

        <nav className="mt-14 border-t border-border/40 pt-8" aria-label={ui.moreGuides}>
          <h2 className="mb-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">{ui.moreGuides}</h2>
          <ul className="space-y-2">
            {others.map((s) => (
              <li key={s}>
                <Link to="/guias/$slug" params={{ slug: s }} className="text-primary hover:underline">
                  {getGuide(lang, s)?.h1}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/rutas/$slug" params={{ slug: "costa-blanca" }} className="text-primary hover:underline">
                {ui.routes}
              </Link>
            </li>
          </ul>
        </nav>
      </main>
      <Footer />
    </div>
  );
}

function PhotoCredit({ text, href }: { text: string; href?: string }) {
  const cls = "mt-2 text-right text-[11px] text-muted-foreground";
  const label = `Foto: ${text}`;
  return href ? (
    <figcaption className={cls}>
      <a href={href} target="_blank" rel="noopener noreferrer license" className="hover:text-primary">{label}</a>
    </figcaption>
  ) : (
    <figcaption className={cls}>{label}</figcaption>
  );
}
