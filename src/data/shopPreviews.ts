export interface SheetPreview {
  id: string;
  bullets: string[];
  contents: string;
}

export const sheetPreviews: Record<string, SheetPreview> = {
  hifz: {
    id: 'hifz',
    bullets: [
      'Grille de 50 cases à cocher pour suivre chaque verset mémorisé',
      'Étapes de validation progressive (lecture, écoute, récitation)',
      'Citation motivante pour rester constant',
      'Suivi visuel de votre progression globale',
    ],
    contents: 'Suivez votre mémorisation verset par verset avec une grille structurée et des étapes de validation claires.',
  },
  makharij: {
    id: 'makharij',
    bullets: [
      'Carte complète des points d\'articulation',
      'Zones Al-Jawf, Al-Halq, Al-Lisan détaillées',
      'Lettres correspondantes pour chaque point',
      'Schéma visuel de l\'appareil phonatoire',
    ],
    contents: 'Maîtrisez la prononciation de chaque lettre arabe grâce à une cartographie précise des Makharij.',
  },
  journal: {
    id: 'journal',
    bullets: [
      '4 entrées structurées par session de récitation',
      'Colonne erreur + correction côte à côte',
      'Auto-évaluation fluidité, tajwid et concentration',
      'Espace pour notes et observations personnelles',
    ],
    contents: 'Documentez vos erreurs et progrès à chaque session pour une amélioration continue et mesurable.',
  },
  planning: {
    id: 'planning',
    bullets: [
      'Tableau hebdomadaire Mouradjaa (lundi → dimanche)',
      'Objectifs quotidiens avec cases à cocher',
      'Suivi des sourates révisées chaque jour',
      'Section bilan de la semaine',
    ],
    contents: 'Organisez votre révision du Coran avec un planning structuré et des objectifs réalistes.',
  },
  tadabbur: {
    id: 'tadabbur',
    bullets: [
      'Analyse profonde d\'un verset choisi',
      'Extraction des mots-clés et racines arabes',
      'Leçon retenue et réflexion personnelle',
      'Action concrète du jour inspirée du verset',
    ],
    contents: 'Allez au-delà de la récitation avec une méditation structurée sur le sens profond des versets.',
  },
  waqf: {
    id: 'waqf',
    bullets: [
      'Les 6 signes de ponctuation coraniques expliqués',
      'Lazim (م), Mamnu (لا), Jaiz (ج) avec exemples',
      'Wasl Awla (صلى), Waqf Awla (قلى), Muanaka (∴)',
      'Exercices pratiques de repérage',
    ],
    contents: 'Comprenez quand vous arrêter et quand continuer votre récitation grâce au guide complet des signes Waqf.',
  },
  objectifs: {
    id: 'objectifs',
    bullets: [
      'Planification annuelle par trimestre (T1 → T4)',
      'Objectifs Hifz, Khatma et sourates ciblées',
      'Suivi trimestriel de progression',
      'Bilan annuel avec réflexion',
    ],
    contents: 'Planifiez votre année coranique avec des objectifs clairs et un suivi structuré par trimestre.',
  },
  duas: {
    id: 'duas',
    bullets: [
      'Journal de 3 invocations coraniques par session',
      'Référence sourate et numéro de verset',
      'Texte arabe original',
      'Espace traduction personnelle et réflexion',
    ],
    contents: 'Collectionnez et méditez sur les invocations les plus puissantes extraites directement du Coran.',
  },
};

export const livret1Pages = [
  { name: 'Couverture' }, { name: 'Makharij' }, { name: 'Waqf' }, { name: 'Hifz' }, { name: 'Journal' },
  { name: 'Tadabbur' }, { name: "Dou'as" }, { name: 'Coloriage' }, { name: 'Planning' }, { name: 'Vision' },
];

export const livret2Pages = [
  { name: 'Hifz Tracker' }, { name: 'Makharij Map' }, { name: 'Journal Erreurs' }, { name: 'Planning' },
  { name: 'Tadabbur' }, { name: 'Guide Waqf' }, { name: 'Objectifs' }, { name: "Dou'as" },
];
