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
  PILLAR_SLUGS,
  DEFAULT_LOCALE,
  isLocale,
  localizedPath,
} from '@/content/tajweed';
import { TAJWEED_EXTRA } from '@/content/tajweedExtra';

const BASE_URL = 'https://recite-perfectly-bot.lovable.app';

const TajwidHub = () => {
  const { lang } = useParams();
  if (lang && !isLocale(lang)) return <Navigate to="/tajwid" replace />;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const { hub, topics } = TAJWEED_CONTENT[locale];
  const { faqPage } = TAJWEED_EXTRA[locale];
  const url = `${BASE_URL}${localizedPath(locale, '/tajwid')}`;

  return (
    <div className="min-h-screen bg-background relative" dir={dir}>
      <PageSeo
        title={hub.metaTitle}
        description={hub.metaDescription}
        path={localizedPath(locale, '/tajwid')}
        lang={locale}
        dir={dir}
        alternates={buildAlternates('/tajwid')}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            inLanguage: locale,
            mainEntity: hub.faq.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: hub.metaTitle,
            inLanguage: locale,
            about: 'Tajwīd, Quran recitation',
            mainEntityOfPage: url,
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
            <span>{hub.h1}</span>
          </nav>
          <LocaleSwitcher current={locale} basePath="/tajwid" label={hub.languageLabel} />
        </div>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{hub.h1}</h1>
          <p className="text-lg text-muted-foreground">{hub.intro}</p>
        </header>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-2">{hub.topicsHeading}</h2>
          <p className="text-muted-foreground mb-6">{hub.topicsIntro}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {PILLAR_SLUGS.map((slug) => (
              <Card key={slug} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{topics[slug].title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 flex-1">
                  <p className="text-sm text-muted-foreground flex-1">{topics[slug].summary}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link to={localizedPath(locale, `/tajwid/${slug}`)}>{hub.readMore}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <TajwidLinks locale={locale} withFaq={false} className="mb-12" />

        <h2 className="text-2xl font-semibold text-foreground mb-6">{hub.moreHeading}</h2>
        {hub.sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-12 scroll-mt-8">
            <h3 className="text-xl font-semibold text-foreground mb-3">{section.title}</h3>
            <p className="text-muted-foreground mb-6">{section.intro}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.items.map((item) => (
                <Card key={item.name}>
                  <CardHeader className="pb-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <span dir="rtl" lang="ar" className="text-xl text-primary font-semibold">
                        {item.arabic}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                    <p dir="auto" className="text-sm text-foreground/80 border-s-2 border-primary/40 ps-3">
                      {item.example}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}

        <section id="faq" className="mb-12 scroll-mt-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">{hub.faqHeading}</h2>
          <div className="space-y-4">
            {hub.faq.map((f) => (
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
          <p className="mt-4 text-sm">
            <Link to={localizedPath(locale, '/tajwid/faq')} className="text-primary underline-offset-4 hover:underline">
              {faqPage.linkLabel}
            </Link>
          </p>
        </section>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8 text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{hub.ctaTitle}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{hub.ctaText}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/auth">{hub.ctaPrimary}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/noorani-qaida">{hub.ctaSecondary}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TajwidHub;
