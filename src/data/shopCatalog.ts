// Miroir client du catalogue serveur (`supabase/functions/_shared/crypto-catalog.ts`).
// Les prix affichés ici sont indicatifs : le serveur reste la source de vérité.

export type CatalogItem = {
  id: string;
  name: string;
  price: number;
  credits: number;
  category: 'credits' | 'livret' | 'fiche';
  icon: string;
};

export const SHOP_CATALOG: CatalogItem[] = [
  { id: 'pack_starter', name: 'Pack Starter — 50 crédits', price: 1.99, credits: 50, category: 'credits', icon: '⚡' },
  { id: 'pack_standard', name: 'Pack Standard — 150 crédits', price: 4.99, credits: 150, category: 'credits', icon: '⚡' },
  { id: 'pack_premium', name: 'Pack Premium — 400 crédits', price: 9.99, credits: 400, category: 'credits', icon: '⚡' },

  { id: 'livret1', name: 'Livret 1 — Mon Voyage avec le Coran', price: 5, credits: 0, category: 'livret', icon: '📗' },
  { id: 'livret2', name: 'Livret 2 — Master Collection Tajweed', price: 5, credits: 0, category: 'livret', icon: '📘' },
  { id: 'bundle', name: 'Bundle Complet — 2 Livrets', price: 9, credits: 0, category: 'livret', icon: '📚' },

  { id: 'hifz', name: 'Hifz Tracker', price: 0.99, credits: 0, category: 'fiche', icon: '📊' },
  { id: 'makharij', name: 'Makharij Al-Huruf', price: 0.99, credits: 0, category: 'fiche', icon: '🗣️' },
  { id: 'journal', name: 'Journal de Correction', price: 0.99, credits: 0, category: 'fiche', icon: '📝' },
  { id: 'planning', name: 'Planning de Révision', price: 0.99, credits: 0, category: 'fiche', icon: '📅' },
  { id: 'tadabbur', name: 'Méditation (Tadabbur)', price: 0.99, credits: 0, category: 'fiche', icon: '🤲' },
  { id: 'waqf', name: 'Guide Waqf', price: 0.99, credits: 0, category: 'fiche', icon: '⏸️' },
  { id: 'objectifs', name: 'Objectifs Annuels', price: 0.99, credits: 0, category: 'fiche', icon: '🎯' },
  { id: 'duas', name: "Dou'as du Coran", price: 0.99, credits: 0, category: 'fiche', icon: '🕌' },
  { id: 'idgham', name: 'Idgham — Règles de Fusion', price: 0.99, credits: 0, category: 'fiche', icon: '🔀' },
  { id: 'ikhfa', name: 'Ikhfa — Dissimulation', price: 0.99, credits: 0, category: 'fiche', icon: '🫧' },
  { id: 'qalqala', name: 'Qalqala — Vibration', price: 0.99, credits: 0, category: 'fiche', icon: '🔔' },
  { id: 'fatiha', name: 'Al-Fatiha — Fiche Complète', price: 0.99, credits: 0, category: 'fiche', icon: '🌟' },
  { id: 'ikhlas', name: 'Al-Ikhlas — Fiche Complète', price: 0.99, credits: 0, category: 'fiche', icon: '💎' },
  { id: 'falaq-nas', name: 'Al-Falaq & An-Nas', price: 0.99, credits: 0, category: 'fiche', icon: '🛡️' },
];

export const catalogById = (id: string) => SHOP_CATALOG.find((i) => i.id === id) ?? null;
