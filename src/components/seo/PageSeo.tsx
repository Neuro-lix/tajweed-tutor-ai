import { Helmet } from 'react-helmet-async';

interface AlternateLink {
  /** hreflang value, e.g. "fr", "en", "ar" or "x-default". */
  hreflang: string;
  /** Absolute-from-root path, e.g. "/en/tajwid". */
  path: string;
}

interface PageSeoProps {
  title: string;
  description: string;
  path: string;
  /** Content language of the page. Sets <html lang> and og:locale. */
  lang?: string;
  /** Text direction of the page. */
  dir?: 'ltr' | 'rtl';
  /** Translated versions of this page, for international SEO. */
  alternates?: AlternateLink[];
}

const BASE_URL = 'https://tajweedtutorai.com';

export const PageSeo = ({
  title,
  description,
  path,
  lang = 'fr',
  dir = 'ltr',
  alternates,
}: PageSeoProps) => {
  const url = `${BASE_URL}${path}`;
  return (
    <Helmet htmlAttributes={{ lang, dir }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {alternates?.map((alt) => (
        <link key={alt.hreflang} rel="alternate" hrefLang={alt.hreflang} href={`${BASE_URL}${alt.path}`} />
      ))}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={lang} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};