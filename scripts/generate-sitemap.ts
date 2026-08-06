// Runs before `vite dev` and `vite build` (predev/prebuild); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://recite-perfectly-bot.lovable.app";

const LOCALES = ["fr", "en", "ar"] as const;
const DEFAULT_LOCALE = "fr";
const localizedPath = (locale: string, path: string) =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  /** When true, emit one URL per locale with hreflang alternates. */
  localized?: boolean;
}

// Public, indexable routes only (no /admin, /dashboard, /my-usage, /diagnostics,
// /health, /shop/success, /verify/:id — those are private or per-user).
const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/tajwid", changefreq: "monthly", priority: "0.9", localized: true },
  { path: "/tajwid/makharij", changefreq: "monthly", priority: "0.8", localized: true },
  { path: "/tajwid/sifat", changefreq: "monthly", priority: "0.8", localized: true },
  { path: "/tajwid/madd", changefreq: "monthly", priority: "0.8", localized: true },
  { path: "/tajwid/waqf-ibtida", changefreq: "monthly", priority: "0.8", localized: true },
  { path: "/tajwid/qalqalah", changefreq: "monthly", priority: "0.8", localized: true },
  { path: "/tajwid/faq", changefreq: "monthly", priority: "0.7", localized: true },
  { path: "/noorani-qaida", changefreq: "monthly", priority: "0.8" },
  { path: "/ijaza", changefreq: "monthly", priority: "0.7" },
  { path: "/shop", changefreq: "weekly", priority: "0.6" },
  { path: "/auth", changefreq: "yearly", priority: "0.3" },
];

function urlBlock(loc: string, e: SitemapEntry, alternates: string[]) {
  return [
    `  <url>`,
    `    <loc>${loc}</loc>`,
    ...alternates,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function generateSitemap(list: SitemapEntry[]) {
  const urls: string[] = [];

  for (const e of list) {
    if (!e.localized) {
      urls.push(urlBlock(`${BASE_URL}${e.path}`, e, []));
      continue;
    }
    const alternates = [
      ...LOCALES.map(
        (l) =>
          `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}${localizedPath(l, e.path)}" />`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${localizedPath(DEFAULT_LOCALE, e.path)}" />`,
    ];
    for (const locale of LOCALES) {
      urls.push(urlBlock(`${BASE_URL}${localizedPath(locale, e.path)}`, e, alternates));
    }
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const xml = generateSitemap(entries);
writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${(xml.match(/<loc>/g) || []).length} URLs)`);
