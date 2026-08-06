import { useEffect, useState } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Locale, TopicSlug } from '@/content/tajweed';
import { TAJWEED_EXTRA } from '@/content/tajweedExtra';

interface TopicQuizProps {
  locale: Locale;
  topic: TopicSlug;
}

const storageKey = (topic: TopicSlug) => `tajwid-quiz:${topic}`;

interface StoredResult {
  best: number;
  total: number;
  last: string;
}

const readResult = (topic: TopicSlug): StoredResult | null => {
  try {
    const raw = localStorage.getItem(storageKey(topic));
    return raw ? (JSON.parse(raw) as StoredResult) : null;
  } catch {
    return null;
  }
};

/** Multiple-choice quiz with instant feedback and a locally persisted best score. */
export const TopicQuiz = ({ locale, topic }: TopicQuizProps) => {
  const { quizzes, quizStrings: s } = TAJWEED_EXTRA[locale];
  const questions = quizzes[topic] ?? [];

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState<StoredResult | null>(null);

  useEffect(() => {
    setBest(readResult(topic));
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setDone(false);
  }, [topic, locale]);

  if (questions.length === 0) return null;

  const question = questions[index];
  const isCorrect = selected === question.answer;

  const check = () => {
    if (selected === null) return;
    setChecked(true);
    if (selected === question.answer) setScore((v) => v + 1);
  };

  const next = () => {
    const finalScore = score;
    if (index + 1 >= questions.length) {
      const result: StoredResult = {
        best: Math.max(finalScore, best?.best ?? 0),
        total: questions.length,
        last: new Date().toISOString(),
      };
      try {
        localStorage.setItem(storageKey(topic), JSON.stringify(result));
      } catch {
        /* storage unavailable */
      }
      setBest(result);
      setDone(true);
      return;
    }
    setIndex((v) => v + 1);
    setSelected(null);
    setChecked(false);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setDone(false);
  };

  return (
    <section id="quiz" className="mb-12 scroll-mt-8">
      <h2 className="text-2xl font-semibold text-foreground mb-2">{s.heading}</h2>
      <p className="text-muted-foreground mb-4">{s.intro}</p>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              {s.progress} {Math.min(index + 1, questions.length)}/{questions.length}
            </span>
            {best && (
              <span>
                {s.best}: {best.best}/{best.total}
              </span>
            )}
          </div>
          {!done && <CardTitle className="text-base pt-2">{question.q}</CardTitle>}
        </CardHeader>

        <CardContent className="space-y-3">
          {done ? (
            <div className="space-y-4 text-center py-4">
              <p className="text-lg font-semibold text-foreground">
                {s.result}: {score}/{questions.length}
              </p>
              <Button variant="outline" onClick={restart}>
                <RotateCcw className="h-4 w-4 me-2" />
                {s.restart}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                {question.options.map((option, i) => {
                  const state = checked
                    ? i === question.answer
                      ? 'correct'
                      : i === selected
                        ? 'wrong'
                        : 'idle'
                    : i === selected
                      ? 'selected'
                      : 'idle';
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={checked}
                      onClick={() => setSelected(i)}
                      aria-pressed={selected === i}
                      className={cn(
                        'w-full text-start rounded-lg border px-4 py-3 text-sm transition-colors',
                        state === 'idle' && 'border-border hover:border-primary/50',
                        state === 'selected' && 'border-primary bg-primary/5',
                        state === 'correct' && 'border-primary bg-primary/10 text-foreground',
                        state === 'wrong' && 'border-destructive bg-destructive/10 text-foreground',
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {checked && (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-lg p-3 text-sm',
                    isCorrect ? 'bg-primary/10 text-foreground' : 'bg-destructive/10 text-foreground',
                  )}
                  role="status"
                >
                  {isCorrect ? (
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  ) : (
                    <X className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                  )}
                  <span>
                    <strong>{isCorrect ? s.correct : s.wrong}.</strong> {question.explanation}
                  </span>
                </div>
              )}

              <div className="flex justify-end">
                {checked ? (
                  <Button onClick={next}>{index + 1 >= questions.length ? s.result : s.next}</Button>
                ) : (
                  <Button onClick={check} disabled={selected === null}>
                    {s.check}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
