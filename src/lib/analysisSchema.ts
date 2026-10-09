import { z } from 'zod';

/** One tajweed error returned by analyze-recitation. Extra fields are kept (passthrough). */
export const analysisErrorSchema = z
  .object({
    word: z.string().optional().default(''),
    ruleType: z.string().optional().default(''),
    ruleDescription: z.string().optional().default(''),
    correction: z.string().nullable().optional(),
    severity: z.string().nullable().optional(),
    confidence: z.string().optional(),
  })
  .passthrough();

/** Successful response of the analyze-recitation edge function. */
export const recitationAnalysisSchema = z
  .object({
    isCorrect: z.boolean(),
    overallScore: z.number().min(0).max(100),
    feedback: z.string().optional().default(''),
    encouragement: z.string().optional().default(''),
    priorityFixes: z.array(z.string()).optional().default([]),
    errors: z.array(analysisErrorSchema).optional().default([]),
    textComparison: z.string().optional(),
    transcribedText: z.string().nullable().optional(),
    expectedText: z.string().nullable().optional(),
    remainingCredits: z.number().nullable().optional(),
    transcriptionImpossible: z.boolean().optional(),
    whisperError: z.string().nullable().optional(),
    engineStatus: z.unknown().optional(),
  })
  .passthrough();

/** Successful response of the tajweed-asr-analyze edge function (live tracking). */
export const asrResultSchema = z
  .object({
    pipeline: z.literal('asr'),
    engine: z.object({ provider: z.string(), model: z.string() }),
    transcription: z.string(),
    words: z.array(z.object({ word: z.string(), start: z.number().nullable(), end: z.number().nullable() })),
    confidence: z.object({ score: z.number(), level: z.enum(['high', 'medium', 'low']), reason: z.string().nullable() }),
    durationMs: z.number(),
    surahNumber: z.number().nullable(),
    verseNumber: z.number().nullable(),
    audioPersisted: z.boolean(),
  })
  .passthrough();

export type RecitationAnalysis = z.infer<typeof recitationAnalysisSchema>;
export type AsrResult = z.infer<typeof asrResultSchema>;

type Parsed<T> = { ok: true; data: T } | { ok: false; error: string };

const run = <T>(schema: z.ZodType<T>, data: unknown): Parsed<T> => {
  const r = schema.safeParse(data);
  return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error.issues[0]?.message ?? 'invalid' };
};

/** Validates an analyze-recitation result. */
export const parseAnalysisResult = (data: unknown): Parsed<RecitationAnalysis> => run(recitationAnalysisSchema, data);

/** Validates a tajweed-asr-analyze result. */
export const parseAsrResult = (data: unknown): Parsed<AsrResult> => run(asrResultSchema, data);
