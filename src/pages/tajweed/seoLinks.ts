import { LOCALES, LOCALE_HREFLANG, DEFAULT_LOCALE, localizedPath } from '@/content/tajweed';

/** hreflang alternates (including x-default) for a locale-agnostic path such as "/tajwid". */
export const buildAlternates = (basePath: string) => [
  ...LOCALES.map((l) => ({ hreflang: LOCALE_HREFLANG[l], path: localizedPath(l, basePath) })),
  { hreflang: 'x-default', path: localizedPath(DEFAULT_LOCALE, basePath) },
];
