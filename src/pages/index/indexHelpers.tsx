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
  | 'guided-review'
  | 'tajweed-errors'
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
  /** Per-word confidence from the transcription/alignment step. */
  wordConfidence?: Array<{ word: string; confidence: 'high' | 'medium' | 'low' }>;
  transcriptionEngine?: string;
}

const CUMULATIVE_VERSES = [
  0, 7, 293, 493, 669, 789, 954, 1160, 1235, 1364, 1473, 1596, 1707, 1750, 1802,
  1901, 2029, 2140, 2250, 2348, 2483, 2593, 2673, 2791, 2855, 2932, 3159, 3252,
  3340, 3409, 3469, 3503, 3533, 3606, 3660, 3705, 3788, 3970, 4058, 4133, 4218,
  4272, 4325, 4414, 4473, 4510, 4545, 4583, 4612, 4630, 4675, 4735, 4784, 4846,
  4901, 4979, 5075, 5104, 5126, 5150, 5163, 5177, 5188, 5199, 5217, 5229, 5241,
  5271, 5323, 5375, 5419, 5447, 5496, 5551, 5591, 5622, 5672, 5712, 5758, 5800,
  5829, 5848, 5884, 5909, 5931, 5948, 5967, 5993, 6023, 6043, 6058, 6079, 6090,
  6098, 6106, 6125, 6130, 6138, 6146, 6157, 6168, 6176, 6179, 6188, 6193, 6197,
  6204, 6207, 6213, 6216, 6221, 6225, 6230, 6236,
];

export const getGlobalAyahNumber = (surah: number, verse: number): number => {
  if (surah < 1 || surah > 114) return verse;
  if (surah === 1) return verse;
  return (CUMULATIVE_VERSES[surah - 1] ?? 0) + verse;
};

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
