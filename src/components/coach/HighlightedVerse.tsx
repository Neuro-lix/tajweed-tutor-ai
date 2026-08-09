interface HighlightedVerseProps {
  text: string;
  /** Arabic words flagged by the AI — highlighted inside the verse. */
  errorWords: string[];
  className?: string;
}

/** Strip Arabic diacritics/tatweel so "الرَّحِيم" matches "الرحيم". */
const normalize = (s: string) =>
  (s || '')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();

/**
 * Renders an Arabic verse with the mis-recited words visually marked,
 * so the learner sees exactly WHERE the mistake happened.
 */
export const HighlightedVerse = ({ text, errorWords, className = '' }: HighlightedVerseProps) => {
  const targets = new Set(errorWords.map(normalize).filter(Boolean));

  return (
    <p className={`font-arabic text-lg leading-loose ${className}`} dir="rtl">
      {text.split(/\s+/).filter(Boolean).map((w, i) => {
        const isError = targets.size > 0 && targets.has(normalize(w));
        return (
          <span
            key={`${w}-${i}`}
            className={
              isError
                ? 'rounded px-1 bg-destructive/15 text-destructive underline decoration-destructive decoration-wavy underline-offset-4'
                : undefined
            }
          >
            {w}{' '}
          </span>
        );
      })}
    </p>
  );
};
