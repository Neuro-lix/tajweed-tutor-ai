// Localized Tajwīd content (fr = default locale, en, ar).
// Used by the /tajwid hub and the three topic pages.

export const LOCALES = ['fr', 'en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

/** hreflang value for each locale. */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  fr: 'fr',
  en: 'en',
  ar: 'ar',
};

/** The three core lessons, shown as "pillars" on the hub. */
export const PILLAR_SLUGS = ['makharij', 'sifat', 'madd'] as const;
export type PillarSlug = (typeof PILLAR_SLUGS)[number];

/** Every lesson slug, including the extra lessons (waqf/ibtidā', qalqalah). */
export const TOPIC_SLUGS = ['makharij', 'sifat', 'madd', 'waqf-ibtida', 'qalqalah'] as const;
export type TopicSlug = (typeof TOPIC_SLUGS)[number];

/** Builds the URL path of a page for a given locale. `/tajwid` for fr, `/en/tajwid` otherwise. */
export const localizedPath = (locale: Locale, path: string) =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;

export interface RuleItem {
  arabic: string;
  name: string;
  text: string;
  example: string;
}

export interface TopicContent {
  title: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  summary: string;
  items: RuleItem[];
  faq: { q: string; a: string }[];
}

export interface HubSection {
  id: string;
  title: string;
  intro: string;
  items: RuleItem[];
}

export interface HubContent {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  topicsHeading: string;
  topicsIntro: string;
  moreHeading: string;
  sections: HubSection[];
  faq: { q: string; a: string }[];
  faqHeading: string;
  ctaTitle: string;
  ctaText: string;
  ctaPrimary: string;
  ctaSecondary: string;
  breadcrumbHome: string;
  readMore: string;
  languageLabel: string;
}

type Dict = {
  hub: HubContent;
  topics: Record<PillarSlug, TopicContent>;
};

const fr: Dict = {
  hub: {
    metaTitle: 'Règles du tajwīd : makhārij, ṣifāt et madd expliqués',
    metaDescription:
      'Guide complet des règles de tajwīd : points d’articulation (makhārij), qualités des lettres (ṣifāt), allongements (madd), nūn sākina et waqf, avec exemples coraniques.',
    h1: 'Règles du tajwīd : makhārij, ṣifāt et madd',
    intro:
      'Apprendre le tajwīd, c’est apprendre à rendre à chaque lettre du Coran son droit. Ce guide rassemble les règles essentielles — points d’articulation, qualités des lettres, allongements, nūn sākina et pauses — avec des exemples tirés du muṣḥaf, pour progresser vers une récitation juste dans les dix Qirā’āt.',
    topicsHeading: 'Les trois piliers du tajwīd',
    topicsIntro:
      'Chaque pilier dispose d’une leçon détaillée, avec règles, exemples coraniques et erreurs fréquentes.',
    moreHeading: 'Règles de liaison et de pause',
    faqHeading: 'Questions fréquentes',
    ctaTitle: 'Mets ces règles en pratique dès aujourd’hui',
    ctaText:
      'Récite un verset, l’IA transcrit ta lecture, détecte tes erreurs de makhārij, de madd et de ghunna, et te fait répéter exactement les passages à corriger.',
    ctaPrimary: 'Analyser ma récitation',
    ctaSecondary: 'Débuter avec la Noorani Qaida',
    breadcrumbHome: 'Accueil',
    readMore: 'Lire la leçon',
    languageLabel: 'Langue',
    sections: [
      {
        id: 'noun-sakina',
        title: 'Nūn sākina et tanwīn — idghām, iẓhār, iqlāb, ikhfā’',
        intro:
          'Quatre règles gouvernent la nūn sans voyelle et le tanwīn selon la lettre qui suit. Elles structurent la fluidité de la lecture et sont systématiquement vérifiées lors d’une ijāza.',
        items: [
          { arabic: 'إظهار', name: 'Iẓhār — prononciation claire', text: 'Devant les lettres de la gorge (ء هـ ع ح غ خ), la nūn se prononce distinctement, sans nasalisation prolongée.', example: 'مَنْ آمَنَ' },
          { arabic: 'إدغام', name: 'Idghām — assimilation', text: 'Devant ي ن م و (avec ghunna) et ل ر (sans ghunna), la nūn fusionne avec la lettre suivante.', example: 'مَن يَقُولُ' },
          { arabic: 'إقلاب', name: 'Iqlāb — transformation', text: 'Devant le bā’, la nūn devient un mīm nasalisé pendant 2 ḥarakāt.', example: 'مِنۢ بَعْدِ' },
          { arabic: 'إخفاء', name: 'Ikhfā’ — dissimulation', text: 'Devant les 15 lettres restantes, la nūn est atténuée avec une ghunna de 2 ḥarakāt.', example: 'مِن قَبْلُ' },
        ],
      },
      {
        id: 'waqf',
        title: 'Waqf — l’art de la pause',
        intro:
          'Le waqf (الوقف) détermine où s’arrêter sans altérer le sens. Les signes de pause du muṣḥaf guident la respiration du récitant.',
        items: [
          { arabic: 'مـ', name: 'Waqf lāzim', text: 'Arrêt obligatoire : continuer changerait le sens du verset.', example: 'إِنَّمَا يَسْتَجِيبُ الَّذِينَ يَسْمَعُونَ ۘ' },
          { arabic: 'ﻻ', name: 'Waqf mamnū‘', text: 'Ne pas s’arrêter ici ; si le souffle manque, reprendre quelques mots en arrière.', example: 'signe ﻻ au-dessus du texte' },
          { arabic: 'ج', name: 'Waqf jā’iz', text: 'Pause permise : s’arrêter ou continuer sont équivalents.', example: 'signe ج au-dessus du texte' },
        ],
      },
    ],
    faq: [
      { q: 'Qu’est-ce que le tajwīd ?', a: 'Le tajwīd est la science qui codifie la prononciation correcte du Coran : points d’articulation des lettres (makhārij), qualités des lettres (ṣifāt), allongements (madd) et règles de liaison et de pause.' },
      { q: 'Quelles sont les règles de tajwīd les plus importantes pour un débutant ?', a: 'Commencer par les makhārij des lettres proches (ص/س, ط/ت, ع/ء), le madd naturel de 2 ḥarakāt, la qalqala et les quatre règles de la nūn sākina : iẓhār, idghām, iqlāb et ikhfā’.' },
      { q: 'Combien de temps faut-il pour maîtriser le tajwīd ?', a: 'Avec 15 à 20 minutes de récitation corrigée par jour, les règles de base s’acquièrent en 3 à 6 mois. La maîtrise complète, validée par une ijāza, demande généralement plusieurs années de pratique auprès d’un enseignant.' },
      { q: 'Peut-on apprendre le tajwīd en ligne avec une IA ?', a: 'Oui : une IA peut transcrire votre récitation, détecter les erreurs de makhārij, de madd et de ghunna verset par verset et vous faire répéter les passages fautifs. Elle ne remplace pas la certification par un cheikh, mais accélère fortement la phase d’entraînement quotidien.' },
    ],
  },
  topics: {
    makharij: {
      title: 'Makhārij — points d’articulation',
      h1: 'Makhārij al-ḥurūf : les 17 points d’articulation des lettres arabes',
      metaTitle: 'Makhārij al-ḥurūf : les 17 points d’articulation expliqués',
      metaDescription:
        'Apprenez les makhārij du Coran : les 5 zones et 17 points d’articulation des lettres arabes, avec exemples coraniques et erreurs de prononciation fréquentes.',
      intro:
        'Les makhārij (مخارج الحروف) sont les points d’où sortent les lettres arabes : 17 points répartis en 5 zones — la cavité buccale (al-jawf), la gorge (al-ḥalq), la langue (al-lisān), les lèvres (ash-shafatān) et la cavité nasale (al-khayshūm). Prononcer une lettre au mauvais point change le mot, donc le sens du verset : c’est la première science à travailler avant tout autre chapitre du tajwīd.',
      summary:
        'Les 5 zones d’articulation, les lettres qui en sortent, et la méthode pour tester un makhraj : mettre la lettre en sukūn précédée d’une hamza (أَقْ, أَعْ) et écouter où le son s’arrête.',
      items: [
        { arabic: 'الجوف', name: 'Al-jawf — la cavité buccale', text: 'Les trois lettres de prolongation (ا و ي) sortent du vide de la bouche : aucun organe ne les bloque, le son se prolonge librement.', example: 'نُوحِيهَا — le wāw et le yā’ glissent sans coupure.' },
        { arabic: 'ء هـ ع ح غ خ', name: 'Al-ḥalq — la gorge', text: 'Trois étages : fond de gorge (ء هـ), milieu (ع ح), haut (غ خ). Ne jamais forcer depuis la poitrine.', example: 'الْعَالَمِينَ — le ‘ayn ne doit pas devenir une hamza.' },
        { arabic: 'ق ك ج ش ض ل ن ر ط د ت ص ز س ظ ذ ث', name: 'Al-lisān — la langue', text: 'Dix makhārij portés par la langue, du fond (qāf, kāf) jusqu’aux incisives (thā’, dhāl, ẓā’). C’est la zone la plus riche et la plus source d’erreurs.', example: 'الصِّرَاطَ — ṣād emphatique, à ne pas confondre avec sīn.' },
        { arabic: 'ف ب م و', name: 'Ash-shafatān — les lèvres', text: 'Le fā’ vient de la lèvre inférieure contre les incisives supérieures ; bā’ et mīm d’une fermeture complète ; wāw d’un arrondissement sans fermeture.', example: 'مَالِكِ — mīm bien fermé avant l’ouverture.' },
        { arabic: 'الخيشوم', name: 'Al-khayshūm — la cavité nasale', text: 'Siège de la ghunna : la nasalisation de deux temps qui accompagne le nūn et le mīm assimilés ou dissimulés.', example: 'إِنَّ — ghunna de 2 ḥarakāt sur le nūn redoublé.' },
      ],
      faq: [
        { q: 'Combien y a-t-il de makhārij en tajwīd ?', a: 'Selon l’école la plus répandue (celle d’Ibn al-Jazarī), il existe 17 points d’articulation répartis en 5 zones : jawf, ḥalq, lisān, shafatān et khayshūm.' },
        { q: 'Comment vérifier que je prononce une lettre au bon makhraj ?', a: 'Placez la lettre en sukūn précédée d’une hamza vocalisée (أَقْ, أَصْ, أَعْ) et écoutez l’endroit exact où le son s’interrompt : c’est le makhraj de la lettre.' },
        { q: 'Quelles sont les erreurs de makhārij les plus fréquentes ?', a: 'Confondre ص et س, ط et ت, ض et د, ذ et ز, prononcer le ع comme une hamza et avaler le ه final. Ces confusions changent le sens du mot et sont considérées comme des fautes majeures (laḥn jalī).' },
      ],
    },
    sifat: {
      title: 'Ṣifāt — qualités des lettres',
      h1: 'Ṣifāt al-ḥurūf : les qualités des lettres en tajwīd',
      metaTitle: 'Ṣifāt al-ḥurūf : qalqala, hams, tafkhīm et shidda expliqués',
      metaDescription:
        'Comprendre les ṣifāt du tajwīd : hams et jahr, shidda et rakhāwa, qalqala, tafkhīm et tarqīq, avec exemples coraniques et exercices de correction.',
      intro:
        'Les ṣifāt (صفات الحروف) décrivent comment une lettre sort de son point d’articulation : voisée ou soufflée, ferme ou fluide, lourde ou légère, avec ou sans rebond. Deux lettres peuvent partager le même makhraj et ne se distinguer que par leurs ṣifāt — c’est ce qui sépare ت de ط, ou س de ص.',
      summary:
        'Les ṣifāt se divisent en qualités opposées (hams/jahr, shidda/rakhāwa, istiʿlā’/istifāl, iṭbāq/infitāḥ) et en qualités sans opposé (qalqala, ṣafīr, tafashshī, ghunna).',
      items: [
        { arabic: 'همس / جهر', name: 'Hams et jahr — souffle et voisement', text: 'Les dix lettres de hams (فحثه شخص سكت) laissent passer le souffle ; toutes les autres sont jahr, le souffle y est retenu.', example: 'سَلَامٌ — le sīn reste soufflé jusqu’au bout.' },
        { arabic: 'شدة / رخاوة', name: 'Shidda et rakhāwa — fermeté et fluidité', text: 'Shidda : le son est stoppé net (أجد قط بكت). Rakhāwa : le son peut se prolonger. Confondre les deux allonge ou coupe le mot à tort.', example: 'الْحَقُّ — le qāf est ferme, jamais étiré.' },
        { arabic: 'قلقلة', name: 'Qalqala — le rebond', text: 'Les cinq lettres qutb jad (ق ط ب ج د) rebondissent légèrement en sukūn, sans qu’une voyelle soit ajoutée.', example: 'قُلْ هُوَ اللَّهُ أَحَدْ — rebond sec sur le dāl final.' },
        { arabic: 'تفخيم / ترقيق', name: 'Tafkhīm et tarqīq — emphase et allègement', text: 'Les sept lettres d’istiʿlā’ (خص ضغط قظ) sont toujours lourdes ; le rā’, le lām du nom d’Allāh et l’alif varient selon la voyelle qui précède.', example: 'بِسْمِ اللَّهِ — lām allégé après une kasra.' },
        { arabic: 'صفير / تفشي', name: 'Ṣafīr et tafashshī — sifflement et diffusion', text: 'Ṣād, sīn et zāy produisent un sifflement aigu ; le shīn diffuse l’air dans toute la bouche.', example: 'يَشْرَبُ — le shīn se répand, il ne siffle pas.' },
      ],
      faq: [
        { q: 'Quelles sont les lettres de la qalqala ?', a: 'Ce sont les cinq lettres réunies dans la formule قطب جد : qāf, ṭā’, bā’, jīm et dāl. Elles rebondissent lorsqu’elles portent un sukūn, surtout en fin de verset.' },
        { q: 'Quand le rā’ est-il lourd ou léger ?', a: 'Le rā’ est lourd (tafkhīm) après une fatḥa ou une ḍamma, et léger (tarqīq) après une kasra ou un yā’ sākin. En cas de pause, on regarde la voyelle qui précède.' },
        { q: 'À quoi servent les ṣifāt si je connais déjà les makhārij ?', a: 'Le makhraj indique d’où vient la lettre, la ṣifa indique comment elle sonne. Sans les ṣifāt, ت et ط sortent presque du même endroit et deviennent indiscernables.' },
      ],
    },
    madd: {
      title: 'Madd — allongements',
      h1: 'Le madd en tajwīd : durées, types et erreurs fréquentes',
      metaTitle: 'Madd en tajwīd : durées (2, 4, 6 ḥarakāt) et types expliqués',
      metaDescription:
        'Toutes les règles du madd : madd ṭabī‘ī, muttaṣil, munfaṣil, lāzim et ‘āriḍ, leurs durées en ḥarakāt et les erreurs d’allongement les plus courantes.',
      intro:
        'Le madd (المد) est la prolongation d’une lettre de prolongation (ا و ي) lorsqu’elle est suivie d’une hamza ou d’un sukūn. Sa durée se compte en ḥarakāt, l’unité de temps d’une voyelle brève. Allonger trop peu ou trop longtemps est l’erreur la plus fréquente chez les récitants débutants, et la première que corrige un enseignant.',
      summary:
        'Un madd naturel dure 2 ḥarakāt ; un madd dérivé dure 4, 5 ou 6 ḥarakāt selon la cause (hamza ou sukūn) et la lecture choisie. La règle d’or : garder la même durée du début à la fin de la récitation.',
      items: [
        { arabic: '٢', name: 'Madd ṭabī‘ī — naturel', text: '2 ḥarakāt, sans hamza ni sukūn après la lettre de prolongation. C’est la base de toute récitation.', example: 'قَالَ — deux temps sur le alif.' },
        { arabic: '٤ / ٥', name: 'Madd muttaṣil — connecté', text: 'Une hamza suit la lettre de madd dans le même mot : 4 à 5 ḥarakāt, obligatoire pour toutes les lectures.', example: 'السَّمَاءِ — allongement obligatoire avant la hamza.' },
        { arabic: '٢ / ٤ / ٥', name: 'Madd munfaṣil — séparé', text: 'La hamza ouvre le mot suivant. La durée dépend de la lecture ; en Ḥafṣ ‘an ‘Āṣim, 4 ou 5 ḥarakāt.', example: 'بِمَا أُنْزِلَ — garder la même durée sur toute la sourate.' },
        { arabic: '٦', name: 'Madd lāzim — obligatoire', text: '6 ḥarakāt lorsqu’un sukūn permanent suit la lettre de madd, notamment dans les lettres isolées en tête de sourate.', example: 'الٓمٓ — six temps sur le mīm.' },
        { arabic: '٢ / ٤ / ٦', name: 'Madd ‘āriḍ li-s-sukūn — accidentel', text: 'Un sukūn apparaît seulement parce qu’on s’arrête en fin de verset : 2, 4 ou 6 ḥarakāt, au choix, mais de façon constante.', example: 'الْعَالَمِينَ — à la pause, le yā’ s’allonge.' },
      ],
      faq: [
        { q: 'Combien de temps dure un ḥaraka ?', a: 'Une ḥaraka correspond au temps de prononciation d’une voyelle brève, environ le temps de plier un doigt. L’important n’est pas la durée absolue mais la régularité entre les madd de même type.' },
        { q: 'Quelle est la différence entre madd muttaṣil et munfaṣil ?', a: 'Dans le muttaṣil, la lettre de madd et la hamza sont dans le même mot, et l’allongement est obligatoire. Dans le munfaṣil, la hamza est au début du mot suivant, et la durée varie selon la lecture.' },
        { q: 'Comment corriger un madd trop court ?', a: 'Comptez les ḥarakāt à voix haute sur un verset court, enregistrez-vous, puis comparez votre durée à celle d’un récitant de référence. Une analyse automatique de votre récitation signale verset par verset les madd trop courts ou trop longs.' },
      ],
    },
  },
};

const en: Dict = {
  hub: {
    metaTitle: 'Tajweed rules explained: makharij, sifat and madd',
    metaDescription:
      'A complete guide to tajweed rules: articulation points (makharij), letter qualities (sifat), elongations (madd), noon sakinah and waqf, with Quranic examples.',
    h1: 'Tajweed rules: makharij, sifat and madd',
    intro:
      'Learning tajweed means giving every letter of the Quran its right. This guide gathers the essential rules — articulation points, letter qualities, elongations, noon sakinah and pauses — with examples from the mushaf, so you can move towards an accurate recitation in the ten Qira’at.',
    topicsHeading: 'The three pillars of tajweed',
    topicsIntro: 'Each pillar has a detailed lesson with rules, Quranic examples and common mistakes.',
    moreHeading: 'Connection and pause rules',
    faqHeading: 'Frequently asked questions',
    ctaTitle: 'Put these rules into practice today',
    ctaText:
      'Recite a verse, the AI transcribes your reading, detects your makharij, madd and ghunnah mistakes, and makes you repeat exactly the passages that need work.',
    ctaPrimary: 'Analyse my recitation',
    ctaSecondary: 'Start with Noorani Qaida',
    breadcrumbHome: 'Home',
    readMore: 'Read the lesson',
    languageLabel: 'Language',
    sections: [
      {
        id: 'noun-sakina',
        title: 'Noon sakinah and tanween — idgham, izhar, iqlab, ikhfa',
        intro:
          'Four rules govern the unvowelled noon and tanween depending on the following letter. They shape the flow of the recitation and are always checked during an ijazah.',
        items: [
          { arabic: 'إظهار', name: 'Izhar — clear pronunciation', text: 'Before the throat letters (ء هـ ع ح غ خ), the noon is pronounced clearly, with no extended nasalisation.', example: 'مَنْ آمَنَ' },
          { arabic: 'إدغام', name: 'Idgham — assimilation', text: 'Before ي ن م و (with ghunnah) and ل ر (without ghunnah), the noon merges into the next letter.', example: 'مَن يَقُولُ' },
          { arabic: 'إقلاب', name: 'Iqlab — conversion', text: 'Before ba, the noon turns into a nasalised meem held for 2 harakat.', example: 'مِنۢ بَعْدِ' },
          { arabic: 'إخفاء', name: 'Ikhfa — concealment', text: 'Before the remaining 15 letters, the noon is softened with a 2-harakat ghunnah.', example: 'مِن قَبْلُ' },
        ],
      },
      {
        id: 'waqf',
        title: 'Waqf — the art of pausing',
        intro:
          'Waqf (الوقف) decides where you may stop without altering the meaning. The pause marks in the mushaf guide the reciter’s breathing.',
        items: [
          { arabic: 'مـ', name: 'Waqf lazim', text: 'Compulsory stop: carrying on would change the meaning of the verse.', example: 'إِنَّمَا يَسْتَجِيبُ الَّذِينَ يَسْمَعُونَ ۘ' },
          { arabic: 'ﻻ', name: 'Waqf mamnu', text: 'Do not stop here; if you run out of breath, resume a few words earlier.', example: 'the ﻻ sign above the text' },
          { arabic: 'ج', name: 'Waqf ja’iz', text: 'Optional pause: stopping or continuing are equally valid.', example: 'the ج sign above the text' },
        ],
      },
    ],
    faq: [
      { q: 'What is tajweed?', a: 'Tajweed is the science that codifies the correct pronunciation of the Quran: articulation points (makharij), letter qualities (sifat), elongations (madd) and the rules of connection and pausing.' },
      { q: 'Which tajweed rules matter most for a beginner?', a: 'Start with the makharij of close letters (ص/س, ط/ت, ع/ء), the natural 2-harakat madd, qalqalah, and the four noon sakinah rules: izhar, idgham, iqlab and ikhfa.' },
      { q: 'How long does it take to master tajweed?', a: 'With 15 to 20 minutes of corrected recitation a day, the core rules are usually acquired in 3 to 6 months. Full mastery, certified by an ijazah, normally takes several years with a teacher.' },
      { q: 'Can you learn tajweed online with AI?', a: 'Yes. AI can transcribe your recitation, detect makharij, madd and ghunnah mistakes verse by verse, and make you repeat the faulty passages. It does not replace certification by a sheikh, but it greatly speeds up daily practice.' },
    ],
  },
  topics: {
    makharij: {
      title: 'Makharij — articulation points',
      h1: 'Makharij al-huruf: the 17 articulation points of Arabic letters',
      metaTitle: 'Makharij al-huruf: the 17 articulation points explained',
      metaDescription:
        'Learn the makharij of the Quran: the 5 zones and 17 articulation points of the Arabic letters, with Quranic examples and the most common pronunciation mistakes.',
      intro:
        'The makharij (مخارج الحروف) are the places from which Arabic letters emerge: 17 points spread over 5 zones — the mouth cavity (al-jawf), the throat (al-halq), the tongue (al-lisan), the lips (ash-shafatan) and the nasal cavity (al-khayshum). Pronouncing a letter at the wrong point changes the word, and therefore the meaning of the verse. This is the first science to work on before any other chapter of tajweed.',
      summary:
        'The 5 articulation zones, the letters that come out of each, and how to test a makhraj: put the letter in sukoon after a vowelled hamza (أَقْ, أَعْ) and listen to where the sound stops.',
      items: [
        { arabic: 'الجوف', name: 'Al-jawf — the mouth cavity', text: 'The three letters of prolongation (ا و ي) come from the empty space of the mouth: no organ blocks them, the sound flows freely.', example: 'نُوحِيهَا — the waw and ya glide without interruption.' },
        { arabic: 'ء هـ ع ح غ خ', name: 'Al-halq — the throat', text: 'Three levels: deep throat (ء هـ), middle (ع ح), upper (غ خ). Never push the sound from the chest.', example: 'الْعَالَمِينَ — the ‘ayn must not become a hamza.' },
        { arabic: 'ق ك ج ش ض ل ن ر ط د ت ص ز س ظ ذ ث', name: 'Al-lisan — the tongue', text: 'Ten makharij carried by the tongue, from the back (qaf, kaf) to the front teeth (tha, dhal, dha). It is the richest zone and the biggest source of mistakes.', example: 'الصِّرَاطَ — emphatic sad, never confused with seen.' },
        { arabic: 'ف ب م و', name: 'Ash-shafatan — the lips', text: 'Fa comes from the lower lip against the upper teeth; ba and meem from a full closure; waw from rounding without closing.', example: 'مَالِكِ — meem fully closed before opening.' },
        { arabic: 'الخيشوم', name: 'Al-khayshum — the nasal cavity', text: 'Home of the ghunnah: the two-count nasalisation that accompanies an assimilated or concealed noon and meem.', example: 'إِنَّ — a 2-harakat ghunnah on the doubled noon.' },
      ],
      faq: [
        { q: 'How many makharij are there in tajweed?', a: 'According to the most widespread school (that of Ibn al-Jazari), there are 17 articulation points spread over 5 zones: jawf, halq, lisan, shafatan and khayshum.' },
        { q: 'How can I check that I pronounce a letter at the right makhraj?', a: 'Put the letter in sukoon after a vowelled hamza (أَقْ, أَصْ, أَعْ) and listen to the exact place where the sound stops: that is the letter’s makhraj.' },
        { q: 'What are the most common makharij mistakes?', a: 'Mixing up ص and س, ط and ت, ض and د, ذ and ز, pronouncing ع like a hamza, and swallowing a final ه. These change the meaning of the word and count as major errors (lahn jali).' },
      ],
    },
    sifat: {
      title: 'Sifat — letter qualities',
      h1: 'Sifat al-huruf: the qualities of letters in tajweed',
      metaTitle: 'Sifat al-huruf: qalqalah, hams, tafkheem and shiddah',
      metaDescription:
        'Understand the sifat of tajweed: hams and jahr, shiddah and rakhawah, qalqalah, tafkheem and tarqeeq, with Quranic examples and correction drills.',
      intro:
        'The sifat (صفات الحروف) describe how a letter leaves its articulation point: voiced or whispered, firm or flowing, heavy or light, with or without a bounce. Two letters can share the same makhraj and differ only in their sifat — that is what separates ت from ط, or س from ص.',
      summary:
        'Sifat are split into opposing qualities (hams/jahr, shiddah/rakhawah, isti‘la/istifal, itbaq/infitah) and standalone qualities (qalqalah, safeer, tafashshi, ghunnah).',
      items: [
        { arabic: 'همس / جهر', name: 'Hams and jahr — breath and voice', text: 'The ten hams letters (فحثه شخص سكت) let the breath flow; all others are jahr, where the breath is held back.', example: 'سَلَامٌ — the seen stays breathy to the end.' },
        { arabic: 'شدة / رخاوة', name: 'Shiddah and rakhawah — firmness and flow', text: 'Shiddah: the sound stops abruptly (أجد قط بكت). Rakhawah: the sound can be sustained. Mixing them stretches or cuts a word wrongly.', example: 'الْحَقُّ — the qaf is firm, never stretched.' },
        { arabic: 'قلقلة', name: 'Qalqalah — the bounce', text: 'The five qutb jad letters (ق ط ب ج د) bounce slightly in sukoon, without adding a vowel.', example: 'قُلْ هُوَ اللَّهُ أَحَدْ — a crisp bounce on the final dal.' },
        { arabic: 'تفخيم / ترقيق', name: 'Tafkheem and tarqeeq — heavy and light', text: 'The seven isti‘la letters (خص ضغط قظ) are always heavy; ra, the lam of Allah’s name and alif vary with the preceding vowel.', example: 'بِسْمِ اللَّهِ — light lam after a kasrah.' },
        { arabic: 'صفير / تفشي', name: 'Safeer and tafashshi — whistle and spread', text: 'Sad, seen and zay produce a sharp whistle; sheen spreads the air across the whole mouth.', example: 'يَشْرَبُ — the sheen spreads, it does not whistle.' },
      ],
      faq: [
        { q: 'Which letters have qalqalah?', a: 'The five letters gathered in the phrase قطب جد: qaf, ta, ba, jeem and dal. They bounce when carrying a sukoon, especially at the end of a verse.' },
        { q: 'When is ra heavy or light?', a: 'Ra is heavy (tafkheem) after a fathah or dammah, and light (tarqeeq) after a kasrah or a sukoon ya. When pausing, look at the preceding vowel.' },
        { q: 'Why learn sifat if I already know the makharij?', a: 'The makhraj tells you where a letter comes from, the sifah tells you how it sounds. Without sifat, ت and ط come from almost the same place and become indistinguishable.' },
      ],
    },
    madd: {
      title: 'Madd — elongations',
      h1: 'Madd in tajweed: durations, types and common mistakes',
      metaTitle: 'Madd in tajweed: durations (2, 4, 6 harakat) and types',
      metaDescription:
        'Every madd rule: madd tabi‘i, muttasil, munfasil, lazim and ‘arid, their durations in harakat, and the most common elongation mistakes.',
      intro:
        'Madd (المد) is the prolongation of a letter of extension (ا و ي) when followed by a hamza or a sukoon. Its duration is counted in harakat, the length of a short vowel. Stretching too little or too long is the most frequent mistake among beginners, and the first one a teacher corrects.',
      summary:
        'A natural madd lasts 2 harakat; a derived madd lasts 4, 5 or 6 harakat depending on the cause (hamza or sukoon) and the chosen reading. The golden rule: keep the same duration from start to finish.',
      items: [
        { arabic: '٢', name: 'Madd tabi‘i — natural', text: '2 harakat, with no hamza or sukoon after the letter of extension. It is the basis of every recitation.', example: 'قَالَ — two counts on the alif.' },
        { arabic: '٤ / ٥', name: 'Madd muttasil — connected', text: 'A hamza follows the madd letter inside the same word: 4 to 5 harakat, compulsory in all readings.', example: 'السَّمَاءِ — compulsory stretch before the hamza.' },
        { arabic: '٢ / ٤ / ٥', name: 'Madd munfasil — separated', text: 'The hamza opens the next word. The duration depends on the reading; in Hafs ‘an ‘Asim, 4 or 5 harakat.', example: 'بِمَا أُنْزِلَ — keep the same length across the whole surah.' },
        { arabic: '٦', name: 'Madd lazim — compulsory', text: '6 harakat when a permanent sukoon follows the madd letter, notably in the disjointed letters opening a surah.', example: 'الٓمٓ — six counts on the meem.' },
        { arabic: '٢ / ٤ / ٦', name: 'Madd ‘arid li-s-sukoon — temporary', text: 'A sukoon appears only because you stop at the end of a verse: 2, 4 or 6 harakat, your choice, but applied consistently.', example: 'الْعَالَمِينَ — on pausing, the ya stretches.' },
      ],
      faq: [
        { q: 'How long is one harakah?', a: 'A harakah is the time it takes to pronounce a short vowel, roughly the time to fold one finger. What matters is not the absolute length but consistency between madds of the same type.' },
        { q: 'What is the difference between madd muttasil and munfasil?', a: 'In muttasil the madd letter and the hamza sit in the same word and the stretch is compulsory. In munfasil the hamza starts the next word and the duration varies with the reading.' },
        { q: 'How do I fix a madd that is too short?', a: 'Count the harakat out loud on a short verse, record yourself, then compare your length with a reference reciter. An automatic recitation analysis flags madds that are too short or too long, verse by verse.' },
      ],
    },
  },
};

const ar: Dict = {
  hub: {
    metaTitle: 'أحكام التجويد: المخارج والصفات والمدود',
    metaDescription:
      'دليل شامل لأحكام التجويد: مخارج الحروف وصفاتها والمدود وأحكام النون الساكنة والوقف، مع أمثلة قرآنية.',
    h1: 'أحكام التجويد: المخارج والصفات والمدود',
    intro:
      'تعلّم التجويد هو إعطاء كل حرف من كتاب الله حقه ومستحقه. يجمع هذا الدليل الأحكام الأساسية: مخارج الحروف، وصفاتها، والمدود، وأحكام النون الساكنة والتنوين، والوقف، مع أمثلة من المصحف، للوصول إلى تلاوة سليمة في القراءات العشر.',
    topicsHeading: 'أركان التجويد الثلاثة',
    topicsIntro: 'لكل ركن درس مفصّل يتضمن القواعد والأمثلة القرآنية والأخطاء الشائعة.',
    moreHeading: 'أحكام الوصل والوقف',
    faqHeading: 'أسئلة شائعة',
    ctaTitle: 'طبّق هذه الأحكام اليوم',
    ctaText:
      'اتلُ آية، فيقوم الذكاء الاصطناعي بتفريغ تلاوتك، ورصد أخطاء المخارج والمدّ والغنّة، ثم يعيدك إلى المواضع التي تحتاج إلى تصحيح.',
    ctaPrimary: 'تحليل تلاوتي',
    ctaSecondary: 'ابدأ بالقاعدة النورانية',
    breadcrumbHome: 'الرئيسية',
    readMore: 'اقرأ الدرس',
    languageLabel: 'اللغة',
    sections: [
      {
        id: 'noun-sakina',
        title: 'النون الساكنة والتنوين: الإظهار والإدغام والإقلاب والإخفاء',
        intro:
          'أربعة أحكام تحكم النون الساكنة والتنوين بحسب الحرف الذي يليها، وهي أساس انسيابية التلاوة ويُسأل عنها في الإجازة.',
        items: [
          { arabic: 'إظهار', name: 'الإظهار', text: 'عند حروف الحلق (ء هـ ع ح غ خ) تُنطق النون واضحة من غير غنّة زائدة.', example: 'مَنْ آمَنَ' },
          { arabic: 'إدغام', name: 'الإدغام', text: 'عند (ي ن م و) بغنّة، و(ل ر) بغير غنّة، تُدغم النون في الحرف التالي.', example: 'مَن يَقُولُ' },
          { arabic: 'إقلاب', name: 'الإقلاب', text: 'عند الباء تُقلب النون ميمًا مخفاة بغنّة مقدارها حركتان.', example: 'مِنۢ بَعْدِ' },
          { arabic: 'إخفاء', name: 'الإخفاء', text: 'عند الحروف الخمسة عشر الباقية تُخفى النون بغنّة مقدارها حركتان.', example: 'مِن قَبْلُ' },
        ],
      },
      {
        id: 'waqf',
        title: 'الوقف وآدابه',
        intro: 'الوقف يحدد مواضع التوقف من غير إخلال بالمعنى، وعلامات المصحف ترشد القارئ إلى مواضع التنفس.',
        items: [
          { arabic: 'مـ', name: 'الوقف اللازم', text: 'وقف واجب؛ فالوصل يغيّر المعنى.', example: 'إِنَّمَا يَسْتَجِيبُ الَّذِينَ يَسْمَعُونَ ۘ' },
          { arabic: 'ﻻ', name: 'الوقف الممنوع', text: 'لا يُوقف هنا، وإن انقطع النفس يُعاد من كلمات قبله.', example: 'علامة ﻻ فوق النص' },
          { arabic: 'ج', name: 'الوقف الجائز', text: 'يجوز الوقف والوصل على السواء.', example: 'علامة ج فوق النص' },
        ],
      },
    ],
    faq: [
      { q: 'ما هو التجويد؟', a: 'التجويد علم يضبط النطق الصحيح للقرآن: مخارج الحروف وصفاتها والمدود وأحكام الوصل والوقف.' },
      { q: 'ما أهم أحكام التجويد للمبتدئ؟', a: 'يبدأ المبتدئ بمخارج الحروف المتقاربة (ص/س، ط/ت، ع/ء)، والمد الطبيعي بمقدار حركتين، والقلقلة، وأحكام النون الساكنة الأربعة.' },
      { q: 'كم يستغرق إتقان التجويد؟', a: 'بتلاوة مصحَّحة من ١٥ إلى ٢٠ دقيقة يوميًا تُتقن الأحكام الأساسية في ثلاثة إلى ستة أشهر، أما الإتقان التام المتوَّج بالإجازة فيحتاج سنوات مع شيخ متقن.' },
      { q: 'هل يمكن تعلم التجويد بالذكاء الاصطناعي؟', a: 'نعم؛ يستطيع الذكاء الاصطناعي تفريغ التلاوة ورصد أخطاء المخارج والمد والغنّة آية آية وإعادة تدريبك عليها، لكنه لا يغني عن الإجازة من شيخ متصل السند.' },
    ],
  },
  topics: {
    makharij: {
      title: 'المخارج',
      h1: 'مخارج الحروف: سبعة عشر مخرجًا في خمس مناطق',
      metaTitle: 'مخارج الحروف في التجويد: ١٧ مخرجًا بالأمثلة',
      metaDescription:
        'شرح مخارج الحروف في التجويد: الجوف والحلق واللسان والشفتان والخيشوم، مع أمثلة قرآنية وأشهر أخطاء النطق.',
      intro:
        'مخارج الحروف هي المواضع التي تخرج منها الحروف العربية، وهي سبعة عشر مخرجًا موزعة على خمس مناطق: الجوف والحلق واللسان والشفتين والخيشوم. والنطق بالحرف من غير مخرجه يغيّر الكلمة ويغيّر المعنى، ولذلك يُبدأ بها قبل سائر أبواب التجويد.',
      summary:
        'المناطق الخمس وحروف كل منطقة، وطريقة اختبار المخرج: تُسكَّن الحرف ويُدخل عليه همزة موصولة مفتوحة (أَقْ، أَعْ) ثم يُنصت إلى موضع انقطاع الصوت.',
      items: [
        { arabic: 'الجوف', name: 'الجوف', text: 'تخرج منه حروف المد الثلاثة (ا و ي) من خلاء الفم من غير اعتماد على عضو.', example: 'نُوحِيهَا' },
        { arabic: 'ء هـ ع ح غ خ', name: 'الحلق', text: 'ثلاثة مواضع: أقصى الحلق (ء هـ)، ووسطه (ع ح)، وأدناه (غ خ)، من غير ضغط من الصدر.', example: 'الْعَالَمِينَ' },
        { arabic: 'ق ك ج ش ض ل ن ر ط د ت ص ز س ظ ذ ث', name: 'اللسان', text: 'عشرة مخارج من أقصى اللسان (ق ك) إلى طرفه مع الثنايا (ث ذ ظ)، وهي أكثر المناطق حروفًا وأخطاءً.', example: 'الصِّرَاطَ' },
        { arabic: 'ف ب م و', name: 'الشفتان', text: 'الفاء من بطن الشفة السفلى مع أطراف الثنايا العليا، والباء والميم بانطباق تام، والواو باستدارة من غير انطباق.', example: 'مَالِكِ' },
        { arabic: 'الخيشوم', name: 'الخيشوم', text: 'مخرج الغنّة المصاحبة للنون والميم المشددتين والمدغمتين والمخفاتين بمقدار حركتين.', example: 'إِنَّ' },
      ],
      faq: [
        { q: 'كم عدد مخارج الحروف؟', a: 'على مذهب الجمهور وابن الجزري: سبعة عشر مخرجًا موزعة على خمس مناطق هي الجوف والحلق واللسان والشفتان والخيشوم.' },
        { q: 'كيف أتأكد من صحة المخرج؟', a: 'تُسكَّن الحرف وتُدخل عليه همزة مفتوحة (أَقْ، أَصْ، أَعْ) ثم يُنصت إلى الموضع الذي ينقطع عنده الصوت، فهو المخرج.' },
        { q: 'ما أشهر أخطاء المخارج؟', a: 'الخلط بين الصاد والسين، والطاء والتاء، والضاد والدال، والذال والزاي، ونطق العين همزة، وابتلاع الهاء في آخر الكلمة، وهي من اللحن الجلي.' },
      ],
    },
    sifat: {
      title: 'الصفات',
      h1: 'صفات الحروف في التجويد',
      metaTitle: 'صفات الحروف: القلقلة والهمس والتفخيم والشدة',
      metaDescription:
        'شرح صفات الحروف في التجويد: الهمس والجهر، والشدة والرخاوة، والقلقلة، والتفخيم والترقيق، مع أمثلة قرآنية وتدريبات.',
      intro:
        'صفات الحروف تبيّن كيفية خروج الحرف من مخرجه: مهموسًا أو مجهورًا، شديدًا أو رخوًا، مفخمًا أو مرققًا، مقلقلًا أو غير مقلقل. وقد يتحد حرفان في المخرج ولا يفترقان إلا بالصفة، كالتاء والطاء والسين والصاد.',
      summary: 'تنقسم الصفات إلى صفات لها ضد (الهمس والجهر، الشدة والرخاوة، الاستعلاء والاستفال، الإطباق والانفتاح) وصفات لا ضد لها (القلقلة والصفير والتفشي والغنّة).',
      items: [
        { arabic: 'همس / جهر', name: 'الهمس والجهر', text: 'حروف الهمس عشرة يجمعها (فحثه شخص سكت) يجري معها النفس، وما عداها مجهور ينحبس معه النفس.', example: 'سَلَامٌ' },
        { arabic: 'شدة / رخاوة', name: 'الشدة والرخاوة', text: 'الشدة انحباس الصوت (أجد قط بكت)، والرخاوة جريانه، والخلط بينهما يمدّ الكلمة أو يقطعها.', example: 'الْحَقُّ' },
        { arabic: 'قلقلة', name: 'القلقلة', text: 'حروفها خمسة يجمعها (قطب جد) تضطرب عند سكونها من غير إحداث حركة.', example: 'قُلْ هُوَ اللَّهُ أَحَدْ' },
        { arabic: 'تفخيم / ترقيق', name: 'التفخيم والترقيق', text: 'حروف الاستعلاء السبعة (خص ضغط قظ) مفخمة دائمًا، والراء ولام لفظ الجلالة والألف تتبع ما قبلها.', example: 'بِسْمِ اللَّهِ' },
        { arabic: 'صفير / تفشي', name: 'الصفير والتفشي', text: 'الصاد والسين والزاي يصاحبها صفير حاد، والشين ينتشر معها الهواء في الفم.', example: 'يَشْرَبُ' },
      ],
      faq: [
        { q: 'ما حروف القلقلة؟', a: 'خمسة حروف يجمعها قولك (قطب جد): القاف والطاء والباء والجيم والدال، وتظهر قلقلتها عند السكون وخاصة في آخر الآية.' },
        { q: 'متى تُفخَّم الراء وتُرقَّق؟', a: 'تُفخَّم بعد الفتح والضم، وتُرقَّق بعد الكسر أو الياء الساكنة، وعند الوقف يُنظر إلى ما قبلها.' },
        { q: 'ما فائدة الصفات مع معرفة المخارج؟', a: 'المخرج يبيّن موضع الحرف، والصفة تبيّن كيفيته؛ ولولا الصفات لالتبست التاء بالطاء لتقارب مخرجيهما.' },
      ],
    },
    madd: {
      title: 'المدود',
      h1: 'أحكام المد: المقادير والأنواع والأخطاء الشائعة',
      metaTitle: 'أحكام المد في التجويد: حركتان وأربع وست',
      metaDescription:
        'أحكام المد كاملة: المد الطبيعي والمتصل والمنفصل واللازم والعارض للسكون، ومقاديرها بالحركات وأشهر أخطاء المد.',
      intro:
        'المد هو إطالة الصوت بحرف من حروف المد (ا و ي) عند وجود سبب من همز أو سكون، ويُقدَّر بالحركات. والزيادة أو النقص في المقدار من أكثر أخطاء المبتدئين شيوعًا، وأول ما يصححه الشيخ.',
      summary: 'المد الطبيعي حركتان، والمدود الفرعية أربع أو خمس أو ست حركات بحسب السبب والرواية، والقاعدة: الالتزام بالمقدار نفسه في التلاوة كلها.',
      items: [
        { arabic: '٢', name: 'المد الطبيعي', text: 'حركتان من غير همز ولا سكون بعد حرف المد، وهو أصل كل تلاوة.', example: 'قَالَ' },
        { arabic: '٤ / ٥', name: 'المد المتصل', text: 'همز بعد حرف المد في الكلمة نفسها، ومقداره أربع أو خمس حركات وجوبًا.', example: 'السَّمَاءِ' },
        { arabic: '٢ / ٤ / ٥', name: 'المد المنفصل', text: 'الهمز في أول الكلمة التالية، ومقداره بحسب الرواية، وفي حفص عن عاصم أربع أو خمس حركات.', example: 'بِمَا أُنْزِلَ' },
        { arabic: '٦', name: 'المد اللازم', text: 'ست حركات عند سكون أصلي بعد حرف المد، وأشهره في فواتح السور.', example: 'الٓمٓ' },
        { arabic: '٢ / ٤ / ٦', name: 'المد العارض للسكون', text: 'سكون عارض بسبب الوقف، ويجوز فيه القصر والتوسط والإشباع مع الالتزام.', example: 'الْعَالَمِينَ' },
      ],
      faq: [
        { q: 'ما مقدار الحركة؟', a: 'الحركة زمن النطق بحركة قصيرة، ويُقدَّر عادة بقبض إصبع، والمهم الانضباط بين المدود المتماثلة لا المقدار المطلق.' },
        { q: 'ما الفرق بين المتصل والمنفصل؟', a: 'في المتصل يكون حرف المد والهمز في كلمة واحدة والمد واجب، وفي المنفصل يكون الهمز في أول الكلمة التالية والمقدار يختلف بحسب الرواية.' },
        { q: 'كيف أصحح المد القصير؟', a: 'عُدَّ الحركات بصوت مسموع في آية قصيرة، وسجّل تلاوتك، ثم قارنها بقارئ متقن؛ ويمكن للتحليل الآلي أن يرصد المدود الناقصة أو الزائدة آية آية.' },
      ],
    },
  },
};

export const TAJWEED_CONTENT: Record<Locale, Dict> = { fr, en, ar };

export const isLocale = (value: string | undefined): value is Locale =>
  !!value && (LOCALES as readonly string[]).includes(value);
