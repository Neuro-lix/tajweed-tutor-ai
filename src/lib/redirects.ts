/**
 * Legacy / alternate URLs → canonical routes.
 * A static SPA cannot emit a real 301, so we do a client-side replace
 * navigation (history entry is replaced, like a redirect) and the target
 * page always declares its own self-referencing canonical URL, which is
 * what search engines consolidate on.
 */
export const REDIRECTS: Record<string, string> = {
  '/home': '/',
  '/index': '/',
  '/index.html': '/',
  '/login': '/auth',
  '/signin': '/auth',
  '/signup': '/auth',
  '/register': '/auth',
  '/boutique': '/shop',
  '/store': '/shop',
  '/pricing': '/shop',
  '/credits': '/shop',
  '/tajweed': '/tajwid',
  '/tajwid-rules': '/tajwid',
  '/regles-tajwid': '/tajwid',
  '/qaida': '/noorani-qaida',
  '/noorani': '/noorani-qaida',
  '/ijazah': '/ijaza',
  '/certificat': '/ijaza',
  '/app': '/dashboard',
  '/account': '/dashboard',
  '/usage': '/my-usage',
};

/** Normalize a pathname: lowercase, strip trailing slash, collapse doubles. */
export function normalizePath(pathname: string): string {
  const clean = pathname.replace(/\/{2,}/g, '/').toLowerCase();
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean;
}

/** Returns the canonical destination for a broken/legacy URL, or null. */
export function resolveRedirect(pathname: string): string | null {
  const normalized = normalizePath(pathname);
  if (REDIRECTS[normalized]) return REDIRECTS[normalized];
  if (normalized !== pathname) return normalized;
  return null;
}