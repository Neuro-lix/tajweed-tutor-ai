import { z } from "zod";

// Adaptez les noms de champs à ceux que renvoie réellement votre prompt.
export const TajweedErrorSchema = z.object({
  rule: z.string(),
  word: z.string().optional(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high"]).optional(),
});

export const AnalysisResultSchema = z
  .object({
    score: z.number().min(0).max(100),
    feedback: z.string(),
    errors: z.array(TajweedErrorSchema).default([]),
    credits_remaining: z.number().int().nonnegative().optional(),
  })
  .passthrough();

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export function parseAnalysisResult(data: unknown): AnalysisResult {
  const parsed = AnalysisResultSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid analysis payload", parsed.error.flatten());
    throw new Error("Le résultat de l'analyse est invalide. Veuillez réessayer.");
  }
  return parsed.data;
}
