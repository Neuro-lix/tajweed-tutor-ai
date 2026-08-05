import { Link } from 'react-router-dom';
import { LOCALES, LOCALE_LABELS, localizedPath, type Locale } from '@/content/tajweed';

interface Props {
  current: Locale;
  basePath: string;
  label: string;
}

export const LocaleSwitcher = ({ current, basePath, label }: Props) => (
  <nav aria-label={label} className="flex flex-wrap items-center gap-2 text-sm">
    <span className="text-muted-foreground">{label} :</span>
    {LOCALES.map((locale) => {
      const isCurrent = locale === current;
      return (
        <Link
          key={locale}
          to={localizedPath(locale, basePath)}
          hrefLang={locale}
          lang={locale}
          aria-current={isCurrent ? 'page' : undefined}
          className={
            isCurrent
              ? 'rounded-md bg-primary/10 px-2 py-1 text-primary font-medium'
              : 'rounded-md px-2 py-1 text-muted-foreground hover:text-primary hover:bg-muted'
          }
        >
          {LOCALE_LABELS[locale]}
        </Link>
      );
    })}
  </nav>
);
