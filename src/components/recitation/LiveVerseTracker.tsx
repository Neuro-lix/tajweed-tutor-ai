import React from 'react';
import type { LiveWordState } from '@/hooks/useLiveRecitation';

const CLS: Record<LiveWordState, string> = {
  pending: 'text-muted-foreground/60',
  active: 'text-foreground bg-accent/40 rounded',
  correct: 'text-primary',
  doubt: 'text-gold-warm',
  wrong: 'text-destructive underline decoration-wavy',
};

export const LiveVerseTracker: React.FC<{ words: string[]; states: LiveWordState[]; unavailable?: boolean; latencyMs?: number | null }> = ({ words, states, unavailable, latencyMs }) => (
  <div className="rounded-lg border border-border bg-card p-4 space-y-2">
    <p className="font-arabic text-2xl md:text-3xl text-center leading-loose" dir="rtl">
      {words.map((w, i) => (
        <span key={i} className={`transition-colors duration-300 ${CLS[states[i] ?? 'pending']}`}>{w} </span>
      ))}
    </p>
    <div className="flex justify-center gap-4 text-xs text-muted-foreground">
      <span className="text-primary">● correct</span>
      <span className="text-gold-warm">● ?</span>
      <span className="text-destructive">● ✗</span>
    </div>
    {latencyMs != null && <p className="text-[10px] text-center text-muted-foreground">⏱ {latencyMs} ms</p>}
    {unavailable && <p className="text-xs text-center text-muted-foreground">Suivi en direct indisponible — l'analyse complète reste faite à la fin.</p>}
  </div>
);
