import React from 'react';

export type AppView =
  | 'landing'
  | 'session-select'
  | 'qiraat-select'
  | 'dashboard'
  | 'recitation'
  | 'corrections'
  | 'pricing'
  | 'recordings'
  | 'boutique'
  | 'ijaza'
  | 'admin';

export interface AnalysisResult {
  isCorrect: boolean;
  overallScore: number;
  feedback: string;
  encouragement?: string;
  priorityFixes?: string[];
  errors?: Array<{
    word: string;
    ruleType: string;
    ruleDescription: string;
    severity: 'minor' | 'major' | 'critical';
    correction: string;
  }>;
  textComparison?: string;
  transcribedText?: string | null;
  expectedText?: string;
  whisperError?: string | null;
  transcriptionImpossible?: boolean;
}

/**
 * Render a hero title where two specific words are highlighted with different
 * gradient/primary classes, in their natural order in the translated string.
 */
export function renderHeroTitle(title: string, rigor: string, kindness: string) {
  const rigorIdx = title.indexOf(rigor);
  const kindnessIdx = title.indexOf(kindness);

  if (rigorIdx === -1 || kindnessIdx === -1) {
    return <>{title}</>;
  }

  const first = Math.min(rigorIdx, kindnessIdx);
  const second = Math.max(rigorIdx, kindnessIdx);
  const firstWord = first === rigorIdx ? rigor : kindness;
  const secondWord = second === kindnessIdx ? kindness : rigor;

  const before = title.slice(0, first);
  const between = title.slice(first + firstWord.length, second);
  const after = title.slice(second + secondWord.length);

  return (
    <>
      {before}
      <span className={first === rigorIdx ? 'text-gradient-gold' : 'text-primary'}>{firstWord}</span>
      {between}
      <span className={second === kindnessIdx ? 'text-primary' : 'text-gradient-gold'}>{secondWord}</span>
      {after}
    </>
  );
}

/** Normalize AI ruleType strings (e.g. "Makhārij", "Idghām") to TAJWEED_RULES keys. */
export type TajweedRuleKey =
  | 'madd' | 'ghunna' | 'qalqala' | 'idgham' | 'ikhfa'
  | 'makharij' | 'sifat' | 'iqlab' | 'izhar' | 'waqf';

export const normalizeRuleType = (ruleType: string): TajweedRuleKey => {
  const lower = ruleType
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
  if (lower.includes('makh')) return 'makharij';
  if (lower.includes('sif')) return 'sifat';
  if (lower.includes('madd') || lower.includes('mad')) return 'madd';
  if (lower.includes('idgh') || lower.includes('idgm')) return 'idgham';
  if (lower.includes('ikh')) return 'ikhfa';
  if (lower.includes('iql') || lower.includes('iqlab')) return 'iqlab';
  if (lower.includes('izh') || lower.includes('izhar')) return 'izhar';
  if (lower.includes('waq')) return 'waqf';
  if (lower.includes('ghun') || lower.includes('ghn')) return 'ghunna';
  if (lower.includes('qal')) return 'qalqala';
  return 'madd';
};
