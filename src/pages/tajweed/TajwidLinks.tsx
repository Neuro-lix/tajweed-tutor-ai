import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TAJWEED_CONTENT, TOPIC_SLUGS, localizedPath, type Locale, type TopicSlug } from '@/content/tajweed';
import { TAJWEED_EXTRA } from '@/content/tajweedExtra';

interface TajwidLinksProps {
  locale?: Locale;
  /** Lesson to hide (usually the current page). */
  exclude?: TopicSlug;
  /** Show the link to the global FAQ page. */
  withFaq?: boolean;
  className?: string;
}

/** Contextual internal-link block towards every tajwīd lesson, in the current language. */
export const TajwidLinks = ({ locale = 'fr', exclude, withFaq = true, className }: TajwidLinksProps) => {
  const { topics } = TAJWEED_CONTENT[locale];
  const { linkBlock, faqPage } = TAJWEED_EXTRA[locale];
  const slugs = TOPIC_SLUGS.filter((s) => s !== exclude);

  return (
    <nav aria-label={linkBlock.heading} className={className}>
      <h2 className="text-xl font-semibold text-foreground mb-2">{linkBlock.heading}</h2>
      <p className="text-sm text-muted-foreground mb-4">{linkBlock.intro}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {slugs.map((slug) => (
          <Card key={slug} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <Link
                to={localizedPath(locale, `/tajwid/${slug}`)}
                className="group flex items-start justify-between gap-3"
              >
                <span>
                  <span className="block font-medium text-foreground group-hover:text-primary">
                    {topics[slug].title}
                  </span>
                  <span className="block text-sm text-muted-foreground line-clamp-2">
                    {topics[slug].summary}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 mt-1 text-muted-foreground rtl:rotate-180" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      {withFaq && (
        <p className="mt-4 text-sm">
          <Link
            to={localizedPath(locale, '/tajwid/faq')}
            className="text-primary underline-offset-4 hover:underline"
          >
            {faqPage.linkLabel}
          </Link>
        </p>
      )}
    </nav>
  );
};
