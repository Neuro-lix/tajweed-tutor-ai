import { describe, it, expect } from "vitest";
import {
  charSimilarity, computeSimilarity, buildWordConfidence, measureTajweed, stripDiacritics,
} from "../../supabase/functions/_shared/recitation-metrics";

const FATIHA_2 = "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ";

describe("charSimilarity", () => {
  it("identical = 1, empty = 0", () => {
    expect(charSimilarity("الحمد", "الحمد")).toBe(1);
    expect(charSimilarity("", "الحمد")).toBe(0);
  });
  it("close spelling scores high, unrelated scores low", () => {
    expect(charSimilarity("العالمين", "العلمين")).toBeGreaterThan(0.6);
    expect(charSimilarity("الحمد", "قلب")).toBeLessThan(0.2);
  });
});

describe("computeSimilarity", () => {
  it("ignores diacritics", () => {
    expect(computeSimilarity(FATIHA_2, stripDiacritics(FATIHA_2))).toBe(1);
  });
  it("drops when words are missing", () => {
    expect(computeSimilarity(FATIHA_2, "الحمد لله")).toBeCloseTo(0.5, 1);
  });
  it("0 for empty", () => expect(computeSimilarity(FATIHA_2, "")).toBe(0));
});

describe("buildWordConfidence", () => {
  it("text-only path marks source text_similarity", () => {
    const r = buildWordConfidence(FATIHA_2, "الحمد لله رب العالمين", null);
    expect(r).toHaveLength(4);
    expect(r.every((w) => w.source === "text_similarity" && w.confidence === "high")).toBe(true);
  });
  it("ASR probability is primary signal", () => {
    const words = [
      { word: "الحمد", probability: 0.95 }, { word: "لله", probability: 0.3 },
      { word: "رب", probability: 0.9 }, { word: "العالمين", probability: 0.92 },
    ];
    const r = buildWordConfidence(FATIHA_2, "الحمد لله رب العالمين", words);
    expect(r[1].source).toBe("asr_probability");
    expect(r[1].confidence).toBe("low");
    expect(r[0].confidence).toBe("high");
  });
});

// Dataset: verse + deliberately faulty transcription + indices of wrong words.
const DATASET = [
  { verse: FATIHA_2, heard: "الحمد لله رب العالمين", wrong: [] as number[] },
  { verse: FATIHA_2, heard: "الحمد لكم رب العالمين", wrong: [1] },
  { verse: "مَٰلِكِ يَوْمِ ٱلدِّينِ", heard: "مالك قوم الدين", wrong: [1] },
  { verse: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", heard: "اياك نشكر واياك نستعين", wrong: [1] },
  { verse: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ", heard: "اهدنا السبيل المستقيم", wrong: [1] },
  { verse: "قُلْ هُوَ ٱللَّهُ أَحَدٌ", heard: "قل هو الله واحد", wrong: [] },
  { verse: "ٱللَّهُ ٱلصَّمَدُ", heard: "الله الصمد", wrong: [] },
  { verse: "لَمْ يَلِدْ وَلَمْ يُولَدْ", heard: "لم يلد ولم ينام", wrong: [3] },
];

describe("detection rate on faulty dataset", () => {
  it("detects ≥ 80% of injected errors with ≤ 10% false alarms", () => {
    let expected = 0, detected = 0, falseAlarms = 0, correctWords = 0;
    for (const s of DATASET) {
      const r = buildWordConfidence(s.verse, s.heard, null);
      r.forEach((w, i) => {
        const flagged = w.confidence !== "high";
        if (s.wrong.includes(i)) { expected++; if (flagged) detected++; }
        else { correctWords++; if (w.confidence === "low") falseAlarms++; }
      });
    }
    expect(detected / expected).toBeGreaterThanOrEqual(0.8);
    expect(falseAlarms / correctWords).toBeLessThanOrEqual(0.1);
  });
});

describe("measureTajweed", () => {
  it("returns nothing without timestamps (never guesses)", () => {
    expect(measureTajweed(buildWordConfidence(FATIHA_2, "الحمد لله رب العالمين", null))).toEqual([]);
  });
  it("flags a too-short madd lazim and missing qalqala gap", () => {
    const details = [
      { word: "ٱلضَّآلِّينَ", start: 0, end: 0.5 },
      { word: "أَحَدْ", start: 0.5, end: 0.9 },
      { word: "قُلْ", start: 0.9, end: 1.2 },
      { word: "هُوَ", start: 1.4, end: 1.6 },
    ].map((d) => ({ ...d, expectedWord: d.word, heardWord: d.word, confidence: "high" as const, score: 1, source: "asr_probability" as const }));
    const errs = measureTajweed(details);
    expect(errs.some((e) => e.ruleType === "madd" && e.confidence === "measured")).toBe(true);
    expect(errs.some((e) => e.ruleType === "qalqala")).toBe(true);
  });
});
