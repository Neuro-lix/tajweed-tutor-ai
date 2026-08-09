export type WordConfidenceLevel = 'high' | 'medium' | 'low';

export interface WordConfidence {
  word: string;
  confidence: WordConfidenceLevel;
}

interface ConfidenceVerseProps {
  /** Expected Quranic text (fallback rendering when no per-word data). */
  text: string;
  /** Per-word confidence returned by analyze-recitation. */
  wordConfidence?: WordConfidence[];
  className?: string;
}

const styles: Record<WordConfidenceLevel, string> = {
  high: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  low: 'bg-destructive/15 text-destructive underline decoration-destructive decoration-wavy underline-offset-4',
};

const labels: Record<WordConfidenceLevel, string> = {
  high: 'Confiance haute',
  medium: 'Confiance moyenne — à revoir',
  low: 'Confiance basse — probable erreur',
};

/**
 * Renders the verse word by word, coloured by how confident the AI is about
 * each word (green / orange / red) instead of a single global score.
 */
export const ConfidenceVerse = ({ text, wordConfidence, className = '' }: ConfidenceVerseProps) => {
  const words =
    wordConfidence && wordConfidence.length > 0
      ? wordConfidence
      : text.split(/\s+/).filter(Boolean).map((w) => ({ word: w, confidence: 'high' as const }));

  return (
    <div className={className}>
      <p className="font-arabic text-xl leading-loose" dir="rtl">
        {words.map((w, i) => (
          <span
            key={`${w.word}-${i}`}
            title={labels[w.confidence]}
            className={`rounded px-1 mx-0.5 inline-block ${styles[w.confidence]}`}
          >
            {w.word}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/40 inline-block" /> Haute
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500/50 inline-block" /> Moyenne
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-destructive/40 inline-block" /> Basse
        </span>
      </div>
    </div>
  );
};
