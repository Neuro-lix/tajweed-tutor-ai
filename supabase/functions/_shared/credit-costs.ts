// Coût en crédits par type d'appel IA. Ajuster ici uniquement.
// Repères de coût réel : transcription ~0,003$/min, Gemini 2.5 Flash ~0,30$/M in
// et 2,50$/M out, TTS gpt-4o-mini-tts ~15$/M caractères.
export const CREDIT_COSTS = {
  /** Analyse complète (transcription + LLM) — déduite côté client. */
  analyzeRecitation: 1,
  /** Un message envoyé à l'assistant. */
  chatMessage: 0.1,
  /** Une génération audio TTS. */
  textToSpeech: 0.1,
} as const;
