import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Headphones, Play } from 'lucide-react';
import type { WordConfidence } from '@/components/coach/ConfidenceVerse';

interface Props {
  audioBlob: Blob;
  wordConfidence?: WordConfidence[];
  errorWords: string[];
}

const norm = (s: string) => (s || '').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '').replace(/[إأآٱ]/g, 'ا').trim();

/** Réécoute de sa propre récitation, avec saut direct sur chaque mot fautif. */
export const SelfListenPanel: React.FC<Props> = ({ audioBlob, wordConfidence = [], errorWords }) => {
  const url = useMemo(() => URL.createObjectURL(audioBlob), [audioBlob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopAt = useRef<number | null>(null);
  const [current, setCurrent] = useState(0);

  const errSet = new Set(errorWords.map(norm));
  const words = wordConfidence as Array<WordConfidence & { start?: number | null; end?: number | null }>;
  const timed = words.some((w) => typeof w.start === 'number');

  const playSegment = (start: number, end: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, start - 0.25);
    stopAt.current = end + 0.25;
    void a.play();
  };

  return (
    <Card className="print:hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Headphones className="w-4 h-4" /> Écoute-toi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <audio
          ref={audioRef}
          src={url}
          controls
          className="w-full"
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            setCurrent(t);
            if (stopAt.current !== null && t >= stopAt.current) {
              e.currentTarget.pause();
              stopAt.current = null;
            }
          }}
        />
        {timed ? (
          <>
            <p className="font-arabic text-2xl leading-loose text-center" dir="rtl">
              {words.map((w, i) => {
                const isErr = errSet.has(norm(w.word)) || w.confidence === 'low';
                const playing = typeof w.start === 'number' && typeof w.end === 'number' && current >= w.start && current <= w.end;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={typeof w.start !== 'number'}
                    onClick={() => playSegment(w.start as number, (w.end ?? (w.start as number) + 1) as number)}
                    className={`mx-0.5 rounded px-1 transition-colors ${playing ? 'bg-primary/20' : ''} ${isErr ? 'text-destructive underline decoration-wavy' : 'text-foreground'}`}
                  >
                    {w.word}
                  </button>
                );
              })}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Touche un mot pour réentendre ce que tu as dit. Les mots en rouge contiennent une faute.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {words.filter((w) => typeof w.start === 'number' && (errSet.has(norm(w.word)) || w.confidence === 'low')).map((w, i) => (
                <Button key={i} size="sm" variant="outline" onClick={() => playSegment(w.start as number, (w.end ?? (w.start as number) + 1) as number)}>
                  <Play className="w-3 h-3 mr-1" /> <span className="font-arabic">{w.word}</span>
                </Button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Réécoute ta récitation en entier. Le saut direct sur chaque mot fautif apparaît quand le moteur renvoie le minutage des mots.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
