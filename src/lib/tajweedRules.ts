/** Tajwīd rule families used to group and label detected errors. */
export type RuleFamily =
  | 'makharij'
  | 'sifat'
  | 'madd'
  | 'noon_meem'
  | 'waqf'
  | 'ghunna'
  | 'qalqala'
  | 'other';

export interface RuleFamilyMeta {
  family: RuleFamily;
  label: string;
  arabic: string;
  color: string; // tailwind classes for badge
  description: string;
  genericExample: string;
}

export const RULE_FAMILY_META: Record<RuleFamily, RuleFamilyMeta> = {
  makharij: {
    family: 'makharij',
    label: 'Makhārij (points d\'articulation)',
    arabic: 'المخارج',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    description: "Origine du son de chaque lettre dans l'appareil phonatoire.",
    genericExample: "Distingue bien le ق (gorge profonde) du ك (palais) : « قَل » vs « كَل ».",
  },
  sifat: {
    family: 'sifat',
    label: 'Ṣifāt (caractéristiques)',
    arabic: 'الصفات',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    description: 'Attributs des lettres : emphase (tafkhīm), douceur (tarqīq), souffle (hams)…',
    genericExample: "Emphatise le ص dans « الصِّرَاط » sans le confondre avec le س.",
  },
  madd: {
    family: 'madd',
    label: 'Madd (allongements)',
    arabic: 'المد',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    description: "Durée d'allongement des voyelles longues (2, 4 ou 6 temps).",
    genericExample: "Allonge « الرَّحِيم » sur 2 temps ; le madd lāzim va jusqu'à 6 temps.",
  },
  noon_meem: {
    family: 'noon_meem',
    label: 'Nūn/Mīm sākinah (Idghām, Iẓhār, Iqlāb, Ikhfāʾ)',
    arabic: 'أحكام النون والميم',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'Règles du nūn sākin/tanwīn et du mīm sākin selon la lettre suivante.',
    genericExample: "« مِن بَعْد » → Iqlāb : le نْ se prononce م avec ghunna.",
  },
  ghunna: {
    family: 'ghunna',
    label: 'Ghunna (nasalisation)',
    arabic: 'الغنة',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    description: 'Résonance nasale maintenue ~2 temps sur ن et م avec shadda.',
    genericExample: "Maintiens la ghunna sur « إِنَّ » et « ثُمَّ ».",
  },
  qalqala: {
    family: 'qalqala',
    label: 'Qalqala (rebond)',
    arabic: 'القلقلة',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Léger rebond sur les lettres ق ط ب ج د en position sākin.',
    genericExample: "« أَحَد » : fais rebondir le د final sans ajouter de voyelle.",
  },
  waqf: {
    family: 'waqf',
    label: 'Waqf (pauses)',
    arabic: 'الوقف',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    description: "Endroits où s'arrêter ou continuer ; respect du sens et du souffle.",
    genericExample: "Arrête-toi sur un waqf permis, sans couper au milieu d'un mot.",
  },
  other: {
    family: 'other',
    label: 'Autre règle',
    arabic: 'أخرى',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Point de tajwīd à revoir.',
    genericExample: "Réécoute la référence et compare attentivement.",
  },
};

/** Map a free-form ruleType string to a normalized family. */
export const classifyRule = (ruleType: string): RuleFamily => {
  const r = (ruleType || '').toLowerCase();
  if (/(makhraj|makharij|articulation|prononc)/.test(r)) return 'makharij';
  if (/(sifa|sifat|tafkhim|tarqiq|emphase|hams|jahr)/.test(r)) return 'sifat';
  if (/(madd|allong|prolong)/.test(r)) return 'madd';
  if (/(idgham|izhar|iqlab|ikhfa|noon|nun|meem|mim|tanwin|tanween)/.test(r)) return 'noon_meem';
  if (/(ghunn|nasal)/.test(r)) return 'ghunna';
  if (/(qalqal|rebond)/.test(r)) return 'qalqala';
  if (/(waqf|pause|arret|stop)/.test(r)) return 'waqf';
  return 'other';
};

export const getRuleFamilyMeta = (ruleType: string): RuleFamilyMeta =>
  RULE_FAMILY_META[classifyRule(ruleType)];
