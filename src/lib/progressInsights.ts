import { SURAHS } from '@/data/quranData';

export interface CorrectionLike {
  surahNumber: number;
  verseNumber: number;
  ruleType: string;
}

export interface SurahProgressLike {
  surahNumber: number;
  status: 'not_started' | 'in_progress' | 'mastered';
  masteredVerses: number;
  totalVerses: number;
}

export const getSurahName = (num: number): string => {
  const s = SURAHS.find((x) => x.id === num);
  return s ? s.transliteration : `Sourate ${num}`;
};

export const getSurahArabic = (num: number): string => {
  const s = SURAHS.find((x) => x.id === num);
  return s ? s.name : '';
};

/** Level label derived from mastery percentage. */
export type SurahLevel = 'débutant' | 'intermédiaire' | 'avancé' | 'maîtrisé';

export const levelFromProgress = (pct: number, status: string): SurahLevel => {
  if (status === 'mastered' || pct >= 100) return 'maîtrisé';
  if (pct >= 66) return 'avancé';
  if (pct >= 33) return 'intermédiaire';
  return 'débutant';
};

export interface SurahLevelInfo {
  surahNumber: number;
  name: string;
  arabic: string;
  status: string;
  progressPct: number;
  level: SurahLevel;
  errorCount: number;
}

/** Build per-surah level info, sorted by most active/needy first. */
export const buildSurahLevels = (
  progress: SurahProgressLike[],
  corrections: CorrectionLike[],
): SurahLevelInfo[] => {
  const errorBySurah = new Map<number, number>();
  for (const c of corrections) {
    errorBySurah.set(c.surahNumber, (errorBySurah.get(c.surahNumber) ?? 0) + 1);
  }
  return progress
    .filter((p) => p.status !== 'not_started' || errorBySurah.has(p.surahNumber))
    .map((p) => {
      const pct = p.totalVerses > 0 ? Math.round((p.masteredVerses / p.totalVerses) * 100) : 0;
      return {
        surahNumber: p.surahNumber,
        name: getSurahName(p.surahNumber),
        arabic: getSurahArabic(p.surahNumber),
        status: p.status,
        progressPct: pct,
        level: levelFromProgress(pct, p.status),
        errorCount: errorBySurah.get(p.surahNumber) ?? 0,
      };
    })
    .sort((a, b) => b.errorCount - a.errorCount || a.progressPct - b.progressPct);
};

export interface RecommendedReview {
  surahNumber: number;
  name: string;
  arabic: string;
  reason: string;
  errorCount: number;
}

/** Pick the surah most in need of a return, based on error volume then low progress. */
export const getRecommendedReview = (
  levels: SurahLevelInfo[],
): RecommendedReview | null => {
  if (levels.length === 0) return null;
  const withErrors = levels.filter((l) => l.errorCount > 0);
  const pool = withErrors.length > 0 ? withErrors : levels.filter((l) => l.level !== 'maîtrisé');
  if (pool.length === 0) return null;
  const target = pool[0];
  return {
    surahNumber: target.surahNumber,
    name: target.name,
    arabic: target.arabic,
    errorCount: target.errorCount,
    reason:
      target.errorCount > 0
        ? `${target.errorCount} point${target.errorCount > 1 ? 's' : ''} de tajwīd à consolider`
        : `Progression à ${target.progressPct}% — à renforcer`,
  };
};

export interface GuidedVerse {
  key: string;
  surahNumber: number;
  verseNumber: number;
  name: string;
  errorCount: number;
  rules: string[];
}

/**
 * Build the guided-repetition list: verses whose error count meets/exceeds the
 * threshold, ordered by most errors first.
 */
export const buildGuidedVerses = (
  corrections: CorrectionLike[],
  threshold = 1,
): GuidedVerse[] => {
  const map = new Map<string, GuidedVerse>();
  for (const c of corrections) {
    const key = `${c.surahNumber}:${c.verseNumber}`;
    const existing = map.get(key);
    if (existing) {
      existing.errorCount += 1;
      if (!existing.rules.includes(c.ruleType)) existing.rules.push(c.ruleType);
    } else {
      map.set(key, {
        key,
        surahNumber: c.surahNumber,
        verseNumber: c.verseNumber,
        name: getSurahName(c.surahNumber),
        errorCount: 1,
        rules: [c.ruleType],
      });
    }
  }
  return Array.from(map.values())
    .filter((v) => v.errorCount >= threshold)
    .sort((a, b) => b.errorCount - a.errorCount);
};
