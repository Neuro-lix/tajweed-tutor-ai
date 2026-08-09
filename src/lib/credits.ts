/** Coût en crédits par type d'appel IA (miroir de supabase/functions/_shared/credit-costs.ts). */
export const CREDIT_COSTS = {
  analyzeRecitation: 1,
  chatMessage: 0.1,
  textToSpeech: 0.1,
} as const;

/** Affiche un solde de crédits avec au maximum 1 décimale (ex: "12,3"). */
export const formatCredits = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value);
};
