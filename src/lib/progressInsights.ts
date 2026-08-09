import { SURAHS } from '@/data/quranData';

export interface CorrectionLike {
  surahNumber: number;
  verseNumber: number;
  ruleType: string;
}

export interface PriorityCorrectionLike extends CorrectionLike {
  severity?: string | null;
  ruleDescription?: string;
  isResolved?: boolean;
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

export interface PriorityFix {
  key: string;
  surahNumber: number;
  name: string;
  arabic: string;
  /** Weighted urgency: critical=3, major=2, minor=1. */
  weight: number;
  errorCount: number;
  verseCount: number;
  /** Verse numbers concerned, ascending, for the deep link. */
  verses: number[];
  /** Distinct tajwīd rules concerned, most frequent first. */
  rules: { rule: string; count: number }[];
  /** Human summary of the rules concerned. */
  ruleSummary: string;
}

const severityWeight = (severity?: string | null): number => {
  switch (severity) {
    case 'critical':
      return 3;
    case 'major':
      return 2;
    default:
      return 1;
  }
};

/**
 * Build the prioritised "what to fix next" list for the reading (qirāʾa) in use.
 * Grouped by surah, sorted by weighted severity then raw error volume.
 */
export const buildPriorityFixes = (
  corrections: PriorityCorrectionLike[],
  limit = 5,
): PriorityFix[] => {
  const bySurah = new Map<number, PriorityFix & { ruleMap: Map<string, number>; verseSet: Set<number> }>();

  for (const c of corrections) {
    if (c.isResolved) continue;
    let entry = bySurah.get(c.surahNumber);
    if (!entry) {
      entry = {
        key: String(c.surahNumber),
        surahNumber: c.surahNumber,
        name: getSurahName(c.surahNumber),
        arabic: getSurahArabic(c.surahNumber),
        weight: 0,
        errorCount: 0,
        verseCount: 0,
        verses: [],
        rules: [],
        ruleSummary: '',
        ruleMap: new Map<string, number>(),
        verseSet: new Set<number>(),
      };
      bySurah.set(c.surahNumber, entry);
    }
    entry.errorCount += 1;
    entry.weight += severityWeight(c.severity);
    entry.verseSet.add(c.verseNumber);
    entry.ruleMap.set(c.ruleType, (entry.ruleMap.get(c.ruleType) ?? 0) + 1);
  }

  return Array.from(bySurah.values())
    .map((e) => {
      const rules = Array.from(e.ruleMap.entries())
        .map(([rule, count]) => ({ rule, count }))
        .sort((a, b) => b.count - a.count);
      const verses = Array.from(e.verseSet).sort((a, b) => a - b);
      return {
        key: e.key,
        surahNumber: e.surahNumber,
        name: e.name,
        arabic: e.arabic,
        weight: e.weight,
        errorCount: e.errorCount,
        verseCount: verses.length,
        verses,
        rules,
        ruleSummary: rules
          .slice(0, 3)
          .map((r) => `${r.rule} (${r.count})`)
          .join(' · '),
      };
    })
    .sort((a, b) => b.weight - a.weight || b.errorCount - a.errorCount)
    .slice(0, limit);
};
