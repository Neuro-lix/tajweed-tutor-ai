import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GeometricPattern } from '@/components/decorative/GeometricPattern';
import { PageSeo } from '@/components/seo/PageSeo';
import { LocaleSwitcher } from './LocaleSwitcher';
import { TajwidLinks } from './TajwidLinks';
import { buildAlternates } from './seoLinks';
import {
  TAJWEED_CONTENT,
  TOPIC_SLUGS,
  DEFAULT_LOCALE,
  isLocale,
  localizedPath,
} from '@/content/tajweed';
import { TAJWEED_EXTRA } from '@/content/tajweedExtra';

const BASE_URL = 'https://recite-perfectly-bot.lovable.app';

const TajwidFaq = () => {
  const { lang } = useParams();
  if (lang && !isLocale(lang)) return <Navigate to="/tajwid/faq" replace />;

  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const { hub, topics } = TAJWEED_CONTENT[locale];
  const { faqPage } = TAJWEED_EXTRA[locale];
  const basePath = '/tajwid/faq';
  const url = `${BASE_URL}${localizedPath(locale, basePath)}`;

  const groups = [
    { id: 'general', title: faqPage.sectionAll, faq: hub.faq, href: localizedPath(locale, '/tajwid') },
    ...TOPIC_SLUGS.map((slug) => ({
      id: slug,
      title: topics[slug].title,
      faq: topics[slug].faq,
      href: localizedPath(locale, `/tajwid/${slug}`),
    })),
  ];

  const allFaq = groups.flatMap((g) => g.faq);

  return (
    <div className="min-h-screen bg-background relative" dir={dir}>
      <PageSeo
        title={faqPage.metaTitle}
        description={faqPage.metaDescription}
        path={localizedPath(locale, basePath)}
        lang={locale}
        dir={dir}
        alternates={buildAlternates(basePath)}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            inLanguage: locale,
            mainEntityOfPage: url,
            mainEntity: allFaq.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: hub.breadcrumbHome, item: `${BASE_URL}${localizedPath(locale, '/')}` },
              { '@type': 'ListItem', position: 2, name: hub.h1, item: `${BASE_URL}${localizedPath(locale, '/tajwid')}` },
              { '@type': 'ListItem', position: 3, name: faqPage.h1, item: url },
            ],
          })}
        </script>
      </Helmet>

      <GeometricPattern className="text-primary" opacity={0.03} />

      <main className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="breadcrumb" className="text-sm text-muted-foreground">
            <Link to={localizedPath(locale, '/')} className="hover:text-primary underline-offset-4 hover:underline">
              {hub.breadcrumbHome}
            </Link>
            <span className="mx-2">/</span>
            <Link to={localizedPath(locale, '/tajwid')} className="hover:text-primary underline-offset-4 hover:underline">
              {hub.h1}
            </Link>
            <span className="mx-2">/</span>
            <span>{faqPage.h1}</span>
          </nav>
          <LocaleSwitcher current={locale} basePath={basePath} label={hub.languageLabel} />
        </div>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{faqPage.h1}</h1>
          <p className="text-lg text-muted-foreground">{faqPage.intro}</p>
        </header>

        {groups.map((group) => (
          <section key={group.id} id={group.id} className="mb-10 scroll-mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <h2 className="text-2xl font-semibold text-foreground">{group.title}</h2>
              <Link to={group.href} className="text-sm text-primary underline-offset-4 hover:underline">
                {hub.readMore}
              </Link>
            </div>
            <div className="space-y-4">
              {group.faq.map((f) => (
                <Card key={f.q}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{f.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{f.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}

        <TajwidLinks locale={locale} withFaq={false} className="mb-12" />

        <div className="text-center">
          <Button asChild variant="outline">
            <Link to={localizedPath(locale, '/tajwid')}>{faqPage.backToHub}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TajwidFaq;
