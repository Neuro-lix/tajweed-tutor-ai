import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GeometricPattern } from '@/components/decorative/GeometricPattern';
import { PageSeo } from '@/components/seo/PageSeo';
import { LocaleSwitcher } from './LocaleSwitcher';
import { TajwidLinks } from './TajwidLinks';
import { TopicQuiz } from './TopicQuiz';
import { buildAlternates } from './seoLinks';
import {
  TAJWEED_CONTENT,
  TOPIC_SLUGS,
  DEFAULT_LOCALE,
  isLocale,
  localizedPath,
  type TopicSlug,
} from '@/content/tajweed';

const BASE_URL = 'https://recite-perfectly-bot.lovable.app';

const isTopic = (value: string | undefined): value is TopicSlug =>
  !!value && (TOPIC_SLUGS as readonly string[]).includes(value);

const TajwidTopic = () => {
  const { lang, topic } = useParams();
  if ((lang && !isLocale(lang)) || !isTopic(topic)) return <Navigate to="/tajwid" replace />;

  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const { hub, topics } = TAJWEED_CONTENT[locale];
  const content = topics[topic];
  const basePath = `/tajwid/${topic}`;
  const url = `${BASE_URL}${localizedPath(locale, basePath)}`;
  const faqPath = localizedPath(locale, '/tajwid/faq');

  return (
    <div className="min-h-screen bg-background relative" dir={dir}>
      <PageSeo
        title={content.metaTitle}
        description={content.metaDescription}
        path={localizedPath(locale, basePath)}
        lang={locale}
        dir={dir}
        alternates={buildAlternates(basePath)}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: content.h1,
            description: content.metaDescription,
            inLanguage: locale,
            mainEntityOfPage: url,
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            inLanguage: locale,
            mainEntity: content.faq.map((f) => ({
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
              { '@type': 'ListItem', position: 3, name: content.title, item: url },
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
            <span>{content.title}</span>
          </nav>
          <LocaleSwitcher current={locale} basePath={basePath} label={hub.languageLabel} />
        </div>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{content.h1}</h1>
          <p className="text-lg text-muted-foreground">{content.intro}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 mb-12">
          {content.items.map((item) => (
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

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">{hub.faqHeading}</h2>
          <div className="space-y-4">
            {content.faq.map((f) => (
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
            <Link to={faqPath} className="text-primary underline-offset-4 hover:underline">
              {hub.faqHeading} — {hub.h1}
            </Link>
          </p>
        </section>

        <TopicQuiz locale={locale} topic={topic} />

        <TajwidLinks locale={locale} exclude={topic} className="mb-12" />

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8 text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{hub.ctaTitle}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{hub.ctaText}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/auth">{hub.ctaPrimary}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={localizedPath(locale, '/tajwid')}>{hub.h1}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TajwidTopic;
