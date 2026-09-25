// Pure recitation metrics — no Deno/Node APIs, unit-tested with vitest.

export const stripDiacritics = (s: string): string =>
  (s || "")
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[ﺁﺂﺄﺆﺈﺊﺌﺎ]/g, "ا")
    .replace(/[إأآاٱ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

/** Jaccard on word sets after diacritic stripping (0..1). */
export const computeSimilarity = (expected: string, actual: string): number => {
  const a = stripDiacritics(expected).split(" ").filter(Boolean);
  const b = stripDiacritics(actual).split(" ").filter(Boolean);
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const inter = [...new Set(a)].filter((w) => setB.has(w)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
};

/** Dice coefficient on character bigrams (0..1). */
export const charSimilarity = (a: string, b: string): number => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = (s: string) => {
    const out: string[] = [];
    for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
    return out;
  };
  const A = bigrams(a);
  const pool = bigrams(b);
  const total = A.length + pool.length;
  let hits = 0;
  for (const g of A) {
    const idx = pool.indexOf(g);
    if (idx >= 0) { hits++; pool.splice(idx, 1); }
  }
  return (2 * hits) / total;
};

export type ConfidenceLevel = "high" | "medium" | "low";
export type AsrWord = { word: string; start?: number | null; end?: number | null; probability?: number; confidence?: number };
export type WordConfidence = {
  word: string; expectedWord: string; heardWord: string; confidence: ConfidenceLevel;
  score: number; source: "asr_probability" | "text_similarity";
  start: number | null; end: number | null;
};

/**
 * Align each expected word with the closest heard word (±3 positions).
 * ASR per-word probability is the PRIMARY signal when available.
 */
export const buildWordConfidence = (
  expectedText: string, transcribedText: string, asrWords: AsrWord[] | null,
): WordConfidence[] => {
  const expected = (expectedText || "").split(/\s+/).filter(Boolean);
  const actual = (transcribedText || "").split(/\s+/).filter(Boolean);
  if (expected.length === 0) return [];
  const actualNormed = actual.map(stripDiacritics);
  const words = asrWords ?? [];

  const WINDOW = 3;
  return expected.map((rawWord, i) => {
    const target = stripDiacritics(rawWord);
    const anchor = actual.length > 0
      ? Math.round((i / Math.max(1, expected.length - 1)) * Math.max(0, actual.length - 1))
      : 0;
    let best = 0, bestIdx = -1;
    for (let j = Math.max(0, anchor - WINDOW); j < Math.min(actualNormed.length, anchor + WINDOW + 1); j++) {
      const sim = charSimilarity(target, actualNormed[j]);
      if (sim > best) { best = sim; bestIdx = j; }
    }
    const heard = bestIdx >= 0 ? actual[bestIdx] : "";
    // Match ASR word by normalized text, preferring same index.
    let asr: AsrWord | undefined;
    if (heard) {
      const n = stripDiacritics(heard);
      asr = (words[bestIdx] && stripDiacritics(words[bestIdx].word || "") === n)
        ? words[bestIdx]
        : words.find((w) => stripDiacritics(w.word || "") === n);
    }
    const p = asr ? (typeof asr.probability === "number" ? asr.probability
      : typeof asr.confidence === "number" ? asr.confidence : undefined) : undefined;
    // Text mismatch caps the probability: a confidently heard WRONG word is still wrong.
    const score = typeof p === "number" ? Math.min(p, best) * 0.7 + p * 0.3 * (best > 0.5 ? 1 : 0) : best;
    const confidence: ConfidenceLevel = score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";
    return {
      word: rawWord, expectedWord: rawWord, heardWord: heard, confidence,
      score: Math.round(score * 100) / 100,
      source: typeof p === "number" ? "asr_probability" : "text_similarity",
      start: asr?.start ?? null, end: asr?.end ?? null,
    };
  });
};

// ─── Acoustic measurements from word timestamps ─────────────────────────
export type MeasuredError = {
  word: string; ruleType: "madd" | "qalqala"; severity: "minor" | "major";
  ruleDescription: string; correction: string; confidence: "measured";
  measurement: Record<string, number>;
};

const MADD_LAZIM = /[اوي]ّ|آ|ٓ/; // shadda after long vowel or maddah sign
const LONG_VOWEL = /(َا|ُو|ِي|ٰ|ٓ)/;
const QALQALA_FINAL = /[قطبجد][ْ]?[\u064B-\u065F]*$/;

/** Letters (no diacritics) per word — basis for per-harf timing. */
const letterCount = (w: string) => stripDiacritics(w).replace(/\s/g, "").length || 1;

/**
 * Measure madd duration and post-qalqala pauses from word timestamps.
 * Only emitted when timestamps exist — otherwise returns [] (never guesses).
 * Reference: one haraka ≈ average letter duration of the reciter in this verse.
 */
export const measureTajweed = (details: WordConfidence[]): MeasuredError[] => {
  const timed = details.filter((d) => d.start !== null && d.end !== null && d.end! > d.start!);
  if (timed.length < 2) return [];
  const totalDur = timed.reduce((s, d) => s + (d.end! - d.start!), 0);
  const totalLetters = timed.reduce((s, d) => s + letterCount(d.word), 0);
  const haraka = totalDur / totalLetters; // seconds per haraka
  const out: MeasuredError[] = [];

  timed.forEach((d, idx) => {
    const dur = d.end! - d.start!;
    const expectedBase = letterCount(d.word) * haraka;
    const extra = (dur - expectedBase) / haraka; // extra harakat observed
    if (MADD_LAZIM.test(d.word)) {
      // madd lāzim: +5 harakat expected (6 total)
      if (extra < 3) out.push({
        word: d.word, ruleType: "madd", severity: "major", confidence: "measured",
        ruleDescription: "Madd lāzim trop court (6 ḥarakāt attendues)",
        correction: "Allonge la voyelle sur 6 temps.",
        measurement: { durationSec: +dur.toFixed(2), harakatObserved: +(extra + 1).toFixed(1), harakatExpected: 6 },
      });
    } else if (LONG_VOWEL.test(d.word) && extra < -0.5) {
      out.push({
        word: d.word, ruleType: "madd", severity: "minor", confidence: "measured",
        ruleDescription: "Madd ṭabīʿī écourté (2 ḥarakāt attendues)",
        correction: "Tiens la voyelle longue 2 temps.",
        measurement: { durationSec: +dur.toFixed(2), harakatObserved: +(extra + 2).toFixed(1), harakatExpected: 2 },
      });
    }
    const next = timed[idx + 1];
    if (QALQALA_FINAL.test(d.word) && next) {
      const gap = next.start! - d.end!;
      if (gap < haraka * 0.3) out.push({
        word: d.word, ruleType: "qalqala", severity: "minor", confidence: "measured",
        ruleDescription: "Pas de rebond/pause audible après la lettre de qalqala",
        correction: "Marque un léger rebond avant d'enchaîner.",
        measurement: { gapSec: +gap.toFixed(3), minGapSec: +(haraka * 0.3).toFixed(3) },
      });
    }
  });
  return out;
};
