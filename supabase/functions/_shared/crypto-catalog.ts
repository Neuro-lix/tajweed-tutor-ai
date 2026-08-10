// Catalogue produit faisant autorité côté serveur.
// Le client n'envoie qu'un `productId` : le prix et les crédits sont
// toujours résolus ici, jamais depuis la requête.

export type CatalogItem = {
  id: string;
  name: string;
  /** Prix en EUR. */
  price: number;
  /** Crédits accordés (0 pour les produits PDF). */
  credits: number;
};

const items: CatalogItem[] = [
  // Packs de crédits
  { id: "pack_starter", name: "Pack Starter - 50 crédits", price: 1.99, credits: 50 },
  { id: "pack_standard", name: "Pack Standard - 150 crédits", price: 4.99, credits: 150 },
  { id: "pack_premium", name: "Pack Premium - 400 crédits", price: 9.99, credits: 400 },

  // Livrets & bundle
  { id: "livret1", name: "Livret 1 - Mon Voyage avec le Coran", price: 5, credits: 0 },
  { id: "livret2", name: "Livret 2 - Master Collection Tajweed", price: 5, credits: 0 },
  { id: "bundle", name: "Bundle Complet - 2 Livrets", price: 9, credits: 0 },

  // Fiches PDF individuelles (0,99 €)
  { id: "hifz", name: "Hifz Tracker", price: 0.99, credits: 0 },
  { id: "makharij", name: "Makharij Al-Huruf", price: 0.99, credits: 0 },
  { id: "journal", name: "Journal de Correction", price: 0.99, credits: 0 },
  { id: "planning", name: "Planning de Révision", price: 0.99, credits: 0 },
  { id: "tadabbur", name: "Méditation (Tadabbur)", price: 0.99, credits: 0 },
  { id: "waqf", name: "Guide Waqf", price: 0.99, credits: 0 },
  { id: "objectifs", name: "Objectifs Annuels", price: 0.99, credits: 0 },
  { id: "duas", name: "Dou'as du Coran", price: 0.99, credits: 0 },
  { id: "idgham", name: "Idgham — Règles de Fusion", price: 0.99, credits: 0 },
  { id: "ikhfa", name: "Ikhfa — Dissimulation", price: 0.99, credits: 0 },
  { id: "qalqala", name: "Qalqala — Vibration", price: 0.99, credits: 0 },
  { id: "fatiha", name: "Al-Fatiha — Fiche Complète", price: 0.99, credits: 0 },
  { id: "ikhlas", name: "Al-Ikhlas — Fiche Complète", price: 0.99, credits: 0 },
  { id: "falaq-nas", name: "Al-Falaq & An-Nas", price: 0.99, credits: 0 },
];

export const CRYPTO_CATALOG: Record<string, CatalogItem> = Object.fromEntries(
  items.map((i) => [i.id, i]),
);

export function getCatalogItem(productId: unknown): CatalogItem | null {
  if (typeof productId !== "string") return null;
  return CRYPTO_CATALOG[productId] ?? null;
}