// Extra Tajwīd content: two new lessons (waqf/ibtidā', qalqalah), the global FAQ page
// strings, the quizzes and the shared UI labels for the internal-link blocks.
import type { Locale, TopicContent } from './tajweed';

export const EXTRA_TOPIC_SLUGS = ['waqf-ibtida', 'qalqalah'] as const;
export type ExtraTopicSlug = (typeof EXTRA_TOPIC_SLUGS)[number];

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface QuizStrings {
  heading: string;
  intro: string;
  check: string;
  next: string;
  restart: string;
  correct: string;
  wrong: string;
  result: string;
  best: string;
  progress: string;
}

export interface FaqPageStrings {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  linkLabel: string;
  sectionAll: string;
  backToHub: string;
}

export interface LinkBlockStrings {
  heading: string;
  intro: string;
}

type ExtraDict = {
  topics: Record<ExtraTopicSlug, TopicContent>;
  faqPage: FaqPageStrings;
  quizStrings: QuizStrings;
  linkBlock: LinkBlockStrings;
  quizzes: Record<string, QuizQuestion[]>;
};

const fr: ExtraDict = {
  topics: {
    'waqf-ibtida': {
      title: 'Waqf et ibtidā’ — pauses et reprises',
      h1: 'Waqf et ibtidā’ : où s’arrêter et où reprendre dans le Coran',
      metaTitle: 'Waqf et ibtidā’ en tajwīd : signes de pause et reprises',
      metaDescription:
        'Guide du waqf et de l’ibtidā’ : signes de pause du muṣḥaf (مـ, ﻻ, ج, صلى, قلى), waqf tāmm, kāfī, ḥasan et qabīḥ, et règles de reprise après une pause.',
      intro:
        'Le waqf (الوقف) est l’art de s’arrêter, l’ibtidā’ (الابتداء) celui de reprendre. Une pause au mauvais endroit peut inverser le sens d’un verset ; une reprise mal placée le rend incompréhensible. Ces deux sciences complètent les makhārij, les ṣifāt et le madd : elles portent sur le sens autant que sur le son.',
      summary:
        'Les quatre types de waqf (tāmm, kāfī, ḥasan, qabīḥ), les signes du muṣḥaf, et la règle d’ibtidā’ : reprendre sur un mot qui ouvre un sens complet.',
      items: [
        { arabic: 'الوقف التام', name: 'Waqf tāmm — pause complète', text: 'Le sens et la grammaire sont achevés : on s’arrête et on reprend au mot suivant sans reprise en arrière.', example: 'وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ' },
        { arabic: 'الوقف الكافي', name: 'Waqf kāfī — pause suffisante', text: 'Le sens est complet mais reste lié grammaticalement à la suite ; la pause est permise et la reprise se fait au mot suivant.', example: 'خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ' },
        { arabic: 'الوقف الحسن', name: 'Waqf ḥasan — pause acceptable', text: 'Le sens est compréhensible mais dépend de la suite : on peut s’arrêter, mais il vaut mieux reprendre quelques mots en arrière.', example: 'الْحَمْدُ لِلَّهِ' },
        { arabic: 'الوقف القبيح', name: 'Waqf qabīḥ — pause blâmable', text: 'S’arrêter là déforme le sens : c’est interdit sauf accident de souffle, et il faut alors reprendre en arrière.', example: 'فَوَيْلٌ لِّلْمُصَلِّينَ (sans la suite)' },
        { arabic: 'الابتداء', name: 'Ibtidā’ — la reprise', text: 'On ne reprend jamais sur un mot dont le sens dépend de ce qui précède : on remonte au début du groupe de sens.', example: 'reprendre à الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ' },
        { arabic: 'صلى / قلى', name: 'Signes du muṣḥaf', text: 'صلى : continuer est préférable. قلى : s’arrêter est préférable. ∴ … ∴ : pause sur l’un des deux points seulement.', example: 'علامات الوقف dans le muṣḥaf de Médine' },
      ],
      faq: [
        { q: 'Quelle est la différence entre waqf et sakt ?', a: 'Le waqf est un arrêt avec coupure du souffle, permettant de respirer. Le sakt est une courte suspension de la voix sans reprendre son souffle, marquée par un س dans le muṣḥaf, comme dans عِوَجَا ۜ قَيِّمًا.' },
        { q: 'Peut-on s’arrêter n’importe où si je manque de souffle ?', a: 'Oui, l’arrêt d’urgence (waqf iḍṭirārī) est permis partout. Mais la reprise doit se faire quelques mots en arrière, sur un début de sens complet, afin de ne pas altérer le message du verset.' },
        { q: 'Que signifie le signe ﻻ dans le muṣḥaf ?', a: 'Il indique qu’il ne faut pas s’arrêter à cet endroit, car la pause romprait le sens. Si le souffle manque malgré tout, on reprend la lecture quelques mots plus tôt.' },
        { q: 'Le waqf est-il vérifié lors d’une ijāza ?', a: 'Oui. Un cheikh évalue non seulement la prononciation mais aussi la pertinence des pauses et des reprises, car elles montrent la compréhension du texte par le récitant.' },
      ],
    },
    qalqalah: {
      title: 'Qalqalah — le rebond',
      h1: 'La qalqalah en tajwīd : lettres, degrés et exemples coraniques',
      metaTitle: 'Qalqalah : les 5 lettres قطب جد, degrés et exemples',
      metaDescription:
        'Tout sur la qalqalah : les cinq lettres qutb jad (ق ط ب ج د), la qalqala ṣughrā et kubrā, les erreurs fréquentes et des exemples tirés du Coran.',
      intro:
        'La qalqalah (القلقلة) est le léger rebond du son qui accompagne cinq lettres lorsqu’elles portent un sukūn. Elle donne à la récitation sa netteté rythmique : sans elle, la lettre s’étouffe ; exagérée, elle ajoute une voyelle qui n’existe pas dans le texte.',
      summary:
        'Les cinq lettres قطب جد, la différence entre qalqala ṣughrā (au milieu du mot) et kubrā (à la pause), et la règle d’or : rebond sec, sans voyelle ajoutée.',
      items: [
        { arabic: 'قطب جد', name: 'Les cinq lettres', text: 'Qāf, ṭā’, bā’, jīm et dāl : réunies dans la formule mnémotechnique قطب جد, ce sont les seules lettres concernées par le rebond.', example: 'أَبْصَارِهِمْ — rebond sur le bā’ sākin.' },
        { arabic: 'الصغرى', name: 'Qalqala ṣughrā — petite', text: 'La lettre porte un sukūn au milieu du mot : le rebond est léger et rapide, sans allonger la syllabe.', example: 'يَجْعَلُونَ — rebond discret sur le jīm.' },
        { arabic: 'الكبرى', name: 'Qalqala kubrā — grande', text: 'La lettre est en fin de mot et on s’arrête dessus : le rebond est plus marqué, sans jamais ajouter de voyelle.', example: 'قُلْ هُوَ اللَّهُ أَحَدْ' },
        { arabic: 'المشددة', name: 'Qalqala sur lettre redoublée', text: 'À la pause sur une lettre de qalqala doublée, on maintient d’abord la shadda puis on rebondit une seule fois.', example: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ' },
        { arabic: 'الأخطاء', name: 'Erreurs fréquentes', text: 'Ajouter une fatḥa ou une ḍamma au rebond, oublier la qalqala au milieu du mot, ou la produire sur des lettres qui n’en ont pas (ت, ك).', example: 'يَقْطَعُونَ — ne pas dire « yaqa-ṭa‘ūn ».' },
      ],
      faq: [
        { q: 'Quelles sont les lettres de la qalqalah ?', a: 'Cinq lettres réunies dans la formule قطب جد : le qāf, le ṭā’, le bā’, le jīm et le dāl. Elles rebondissent chaque fois qu’elles portent un sukūn, à l’intérieur du mot comme à la pause.' },
        { q: 'Quelle est la différence entre qalqala ṣughrā et kubrā ?', a: 'La ṣughrā se produit au milieu du mot, avec un sukūn permanent : le rebond est léger. La kubrā se produit en fin de mot lorsqu’on s’arrête : le rebond est plus perceptible.' },
        { q: 'La qalqala ajoute-t-elle une voyelle ?', a: 'Non. Le rebond ne doit jamais devenir une fatḥa, une kasra ou une ḍamma. C’est un simple écho de la lettre, sans timbre vocalique identifiable.' },
        { q: 'Comment s’entraîner à la qalqalah ?', a: 'Récitez la sourate al-Ikhlāṣ et al-Masad en marquant chaque sukūn de قطب جد, enregistrez-vous, puis comparez avec un récitant de référence. Une analyse automatique verset par verset signale les rebonds manquants ou exagérés.' },
      ],
    },
  },
  faqPage: {
    metaTitle: 'FAQ tajwīd : toutes les questions fréquentes en fr, en et ar',
    metaDescription:
      'Foire aux questions du tajwīd : makhārij, ṣifāt, madd, qalqalah, waqf et ibtidā’. Réponses courtes et sourcées pour progresser dans la récitation du Coran.',
    h1: 'FAQ tajwīd : toutes les questions fréquentes',
    intro:
      'Cette page rassemble les questions les plus posées sur le tajwīd, regroupées par leçon : points d’articulation, qualités des lettres, allongements, qalqalah, pauses et reprises. Chaque bloc renvoie vers la leçon détaillée correspondante.',
    linkLabel: 'Toutes les questions fréquentes',
    sectionAll: 'Questions générales',
    backToHub: 'Retour au guide du tajwīd',
  },
  quizStrings: {
    heading: 'Quiz : teste tes connaissances',
    intro: 'Cinq questions à choix multiples, avec correction immédiate.',
    check: 'Valider',
    next: 'Question suivante',
    restart: 'Recommencer',
    correct: 'Bonne réponse',
    wrong: 'Réponse incorrecte',
    result: 'Ton score',
    best: 'Meilleur score',
    progress: 'Question',
  },
  linkBlock: {
    heading: 'Continuer avec les leçons de tajwīd',
    intro: 'Chaque leçon détaille une règle avec exemples coraniques, erreurs fréquentes et quiz.',
  },
  quizzes: {
    makharij: [
      { q: 'Combien y a-t-il de points d’articulation (makhārij) ?', options: ['5', '17', '28'], answer: 1, explanation: '17 makhārij répartis en 5 zones, selon Ibn al-Jazarī.' },
      { q: 'De quelle zone sortent les lettres de prolongation ا و ي ?', options: ['Al-jawf', 'Al-ḥalq', 'Ash-shafatān'], answer: 0, explanation: 'Elles sortent du vide de la bouche (al-jawf), sans obstacle.' },
      { q: 'Quelle lettre sort des lèvres avec les incisives supérieures ?', options: ['Le bā’', 'Le fā’', 'Le mīm'], answer: 1, explanation: 'Le fā’ : lèvre inférieure contre les incisives supérieures.' },
      { q: 'Où se produit la ghunna ?', options: ['Al-khayshūm', 'Al-lisān', 'Al-ḥalq'], answer: 0, explanation: 'La ghunna sort de la cavité nasale, al-khayshūm.' },
      { q: 'Quelle erreur de makhraj est un laḥn jalī ?', options: ['Prononcer ع comme une hamza', 'Allonger un madd de 5 au lieu de 4', 'Ne pas marquer la qalqala'], answer: 0, explanation: 'Changer le makhraj change le mot : c’est une faute majeure.' },
    ],
    sifat: [
      { q: 'Quelles lettres portent la qalqala ?', options: ['فحثه شخص سكت', 'قطب جد', 'خص ضغط قظ'], answer: 1, explanation: 'قطب جد réunit les cinq lettres de la qalqala.' },
      { q: 'Que signifie hams ?', options: ['Le souffle passe', 'Le son est stoppé', 'La lettre est lourde'], answer: 0, explanation: 'Hams : le souffle continue de passer avec la lettre.' },
      { q: 'Le rā’ après une kasra est…', options: ['Toujours lourd', 'Léger (tarqīq)', 'Nasalisé'], answer: 1, explanation: 'Après une kasra, le rā’ est allégé.' },
      { q: 'Quelle ṣifa n’a pas d’opposé ?', options: ['Shidda', 'Jahr', 'Ṣafīr'], answer: 2, explanation: 'Ṣafīr fait partie des ṣifāt sans opposé.' },
      { q: 'Pourquoi ت et ط se distinguent-ils ?', options: ['Par leurs ṣifāt', 'Par leur makhraj', 'Par leur madd'], answer: 0, explanation: 'Makhraj très proche : ce sont les ṣifāt (iṭbāq, istiʿlā’) qui les séparent.' },
    ],
    madd: [
      { q: 'Combien de ḥarakāt dure le madd ṭabī‘ī ?', options: ['2', '4', '6'], answer: 0, explanation: 'Le madd naturel dure 2 ḥarakāt.' },
      { q: 'Le madd lāzim dure…', options: ['2 ḥarakāt', '4 ḥarakāt', '6 ḥarakāt'], answer: 2, explanation: '6 ḥarakāt, sukūn permanent après la lettre de madd.' },
      { q: 'Dans le madd muttaṣil, la hamza est…', options: ['Dans le même mot', 'Au début du mot suivant', 'Absente'], answer: 0, explanation: 'Muttaṣil = connecté : hamza dans le même mot, allongement obligatoire.' },
      { q: 'الٓمٓ illustre quel madd ?', options: ['Munfaṣil', 'Lāzim', 'ʿĀriḍ'], answer: 1, explanation: 'Les lettres isolées en tête de sourate relèvent du madd lāzim.' },
      { q: 'Le madd ‘āriḍ li-s-sukūn apparaît…', options: ['À la pause en fin de verset', 'Avant chaque hamza', 'Uniquement en Warsh'], answer: 0, explanation: 'Le sukūn est accidentel, causé par l’arrêt.' },
    ],
    'waqf-ibtida': [
      { q: 'Le waqf tāmm signifie que…', options: ['Le sens est achevé', 'Il est interdit de s’arrêter', 'Il faut reprendre en arrière'], answer: 0, explanation: 'Sens et grammaire complets : pause idéale.' },
      { q: 'Le signe ﻻ indique…', options: ['Pause obligatoire', 'Ne pas s’arrêter', 'Pause préférable'], answer: 1, explanation: 'ﻻ marque un waqf mamnū‘.' },
      { q: 'Après un arrêt d’urgence, on reprend…', options: ['Au mot suivant', 'Quelques mots en arrière', 'Au début de la sourate'], answer: 1, explanation: 'On reprend sur un début de sens complet.' },
      { q: 'Le sakt est…', options: ['Une pause avec respiration', 'Une suspension sans reprendre son souffle', 'Un allongement de 6 ḥarakāt'], answer: 1, explanation: 'Le sakt coupe la voix sans couper le souffle.' },
      { q: 'Le waqf qabīḥ est…', options: ['Recommandé', 'Blâmable car il déforme le sens', 'Neutre'], answer: 1, explanation: 'S’arrêter là altère le sens du verset.' },
    ],
    qalqalah: [
      { q: 'Combien de lettres portent la qalqala ?', options: ['3', '5', '7'], answer: 1, explanation: 'Cinq : ق ط ب ج د.' },
      { q: 'La qalqala kubrā se produit…', options: ['Au milieu du mot', 'À la pause en fin de mot', 'Avant une hamza'], answer: 1, explanation: 'Grande qalqala : à l’arrêt sur la lettre finale.' },
      { q: 'La qalqala ajoute-t-elle une voyelle ?', options: ['Oui, une fatḥa', 'Non, jamais', 'Oui, une ḍamma'], answer: 1, explanation: 'C’est un rebond sec, sans timbre vocalique.' },
      { q: 'Quelle lettre n’a pas de qalqala ?', options: ['Le kāf', 'Le jīm', 'Le dāl'], answer: 0, explanation: 'Le kāf n’appartient pas à قطب جد.' },
      { q: 'Dans تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ, à la pause finale on…', options: ['Rebondit une seule fois après la shadda', 'Rebondit deux fois', 'Ne rebondit pas'], answer: 0, explanation: 'On maintient la shadda puis un seul rebond.' },
    ],
  },
};

const en: ExtraDict = {
  topics: {
    'waqf-ibtida': {
      title: 'Waqf and ibtida — pausing and resuming',
      h1: 'Waqf and ibtida: where to stop and where to resume in the Quran',
      metaTitle: 'Waqf and ibtida in tajweed: pause signs and resuming rules',
      metaDescription:
        'A guide to waqf and ibtida: mushaf pause marks (مـ, ﻻ, ج, صلى, قلى), waqf tamm, kafi, hasan and qabih, and the rules for resuming after a pause.',
      intro:
        'Waqf (الوقف) is the art of stopping, ibtida (الابتداء) the art of resuming. A stop in the wrong place can reverse the meaning of a verse; a badly placed restart makes it unintelligible. Both sciences complete the makharij, sifat and madd: they deal with meaning as much as with sound.',
      summary:
        'The four kinds of waqf (tamm, kafi, hasan, qabih), the mushaf pause marks, and the rule of ibtida: resume on a word that opens a complete meaning.',
      items: [
        { arabic: 'الوقف التام', name: 'Waqf tamm — complete stop', text: 'Meaning and grammar are complete: you stop and resume from the next word with no need to go back.', example: 'وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ' },
        { arabic: 'الوقف الكافي', name: 'Waqf kafi — sufficient stop', text: 'The meaning is complete but still grammatically tied to what follows; stopping is allowed and you resume from the next word.', example: 'خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ' },
        { arabic: 'الوقف الحسن', name: 'Waqf hasan — good stop', text: 'The meaning is understandable but depends on what follows: you may stop, but it is better to resume a few words earlier.', example: 'الْحَمْدُ لِلَّهِ' },
        { arabic: 'الوقف القبيح', name: 'Waqf qabih — blameworthy stop', text: 'Stopping there distorts the meaning: it is forbidden except when you run out of breath, and you must then resume earlier.', example: 'فَوَيْلٌ لِّلْمُصَلِّينَ (without what follows)' },
        { arabic: 'الابتداء', name: 'Ibtida — resuming', text: 'Never resume on a word whose meaning depends on what precedes it: go back to the beginning of the meaning unit.', example: 'resume at الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ' },
        { arabic: 'صلى / قلى', name: 'Mushaf pause marks', text: 'صلى: continuing is preferable. قلى: stopping is preferable. ∴ … ∴: stop on only one of the two dots.', example: 'pause marks in the Madinah mushaf' },
      ],
      faq: [
        { q: 'What is the difference between waqf and sakt?', a: 'Waqf is a stop where you cut the sound and take a breath. Sakt is a brief suspension of the voice without breathing, marked by a س in the mushaf, as in عِوَجَا ۜ قَيِّمًا.' },
        { q: 'Can I stop anywhere if I run out of breath?', a: 'Yes, an emergency stop (waqf idtirari) is allowed anywhere. But you must resume a few words earlier, at the start of a complete meaning, so the message of the verse is not altered.' },
        { q: 'What does the ﻻ sign mean in the mushaf?', a: 'It means you should not stop there, because pausing would break the meaning. If you still run out of breath, resume the reading a few words earlier.' },
        { q: 'Is waqf tested during an ijazah?', a: 'Yes. A sheikh assesses not only pronunciation but also the soundness of your stops and restarts, since they show how well the reciter understands the text.' },
      ],
    },
    qalqalah: {
      title: 'Qalqalah — the bounce',
      h1: 'Qalqalah in tajweed: letters, degrees and Quranic examples',
      metaTitle: 'Qalqalah: the 5 qutb jad letters, degrees and examples',
      metaDescription:
        'Everything about qalqalah: the five qutb jad letters (ق ط ب ج د), qalqalah sughra and kubra, common mistakes and examples from the Quran.',
      intro:
        'Qalqalah (القلقلة) is the slight echo or bounce that accompanies five letters when they carry a sukoon. It gives recitation its rhythmic clarity: without it the letter is muffled; exaggerated, it adds a vowel that does not exist in the text.',
      summary:
        'The five qutb jad letters, the difference between qalqalah sughra (inside the word) and kubra (at a stop), and the golden rule: a crisp bounce with no added vowel.',
      items: [
        { arabic: 'قطب جد', name: 'The five letters', text: 'Qaf, ta, ba, jeem and dal: gathered in the mnemonic قطب جد, they are the only letters that bounce.', example: 'أَبْصَارِهِمْ — bounce on the sukoon ba.' },
        { arabic: 'الصغرى', name: 'Qalqalah sughra — minor', text: 'The letter carries a sukoon inside the word: the bounce is light and quick, without lengthening the syllable.', example: 'يَجْعَلُونَ — a discreet bounce on the jeem.' },
        { arabic: 'الكبرى', name: 'Qalqalah kubra — major', text: 'The letter ends the word and you stop on it: the bounce is stronger, but still without adding a vowel.', example: 'قُلْ هُوَ اللَّهُ أَحَدْ' },
        { arabic: 'المشددة', name: 'Qalqalah on a doubled letter', text: 'When stopping on a doubled qalqalah letter, hold the shaddah first, then bounce once only.', example: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ' },
        { arabic: 'الأخطاء', name: 'Common mistakes', text: 'Adding a fathah or dammah to the bounce, dropping the qalqalah inside a word, or bouncing letters that have none (ت, ك).', example: 'يَقْطَعُونَ — do not say “yaqa-ta‘oon”.' },
      ],
      faq: [
        { q: 'Which letters have qalqalah?', a: 'Five letters gathered in the phrase قطب جد: qaf, ta, ba, jeem and dal. They bounce whenever they carry a sukoon, inside a word or at a stop.' },
        { q: 'What is the difference between qalqalah sughra and kubra?', a: 'Sughra happens inside the word with a permanent sukoon: the bounce is light. Kubra happens at the end of a word when you stop on it: the bounce is more audible.' },
        { q: 'Does qalqalah add a vowel?', a: 'No. The bounce must never turn into a fathah, kasrah or dammah. It is a plain echo of the letter with no identifiable vowel colour.' },
        { q: 'How do I practise qalqalah?', a: 'Recite surah al-Ikhlas and al-Masad marking every qutb jad sukoon, record yourself, then compare with a reference reciter. An automatic verse-by-verse analysis flags missing or exaggerated bounces.' },
      ],
    },
  },
  faqPage: {
    metaTitle: 'Tajweed FAQ: all frequently asked questions in fr, en and ar',
    metaDescription:
      'Tajweed FAQ: makharij, sifat, madd, qalqalah, waqf and ibtida. Short, sourced answers to help you improve your Quran recitation.',
    h1: 'Tajweed FAQ: every frequently asked question',
    intro:
      'This page gathers the most common tajweed questions, grouped by lesson: articulation points, letter qualities, elongations, qalqalah, pauses and restarts. Each block links to the matching detailed lesson.',
    linkLabel: 'All frequently asked questions',
    sectionAll: 'General questions',
    backToHub: 'Back to the tajweed guide',
  },
  quizStrings: {
    heading: 'Quiz: test your knowledge',
    intro: 'Five multiple-choice questions with instant feedback.',
    check: 'Check',
    next: 'Next question',
    restart: 'Restart',
    correct: 'Correct',
    wrong: 'Incorrect',
    result: 'Your score',
    best: 'Best score',
    progress: 'Question',
  },
  linkBlock: {
    heading: 'Continue with the tajweed lessons',
    intro: 'Each lesson covers one rule with Quranic examples, common mistakes and a quiz.',
  },
  quizzes: {
    makharij: [
      { q: 'How many articulation points (makharij) are there?', options: ['5', '17', '28'], answer: 1, explanation: '17 makharij over 5 zones, according to Ibn al-Jazari.' },
      { q: 'Which zone produces the letters of prolongation ا و ي?', options: ['Al-jawf', 'Al-halq', 'Ash-shafatan'], answer: 0, explanation: 'They come from the empty mouth cavity, al-jawf.' },
      { q: 'Which letter uses the lower lip and the upper teeth?', options: ['Ba', 'Fa', 'Meem'], answer: 1, explanation: 'Fa: lower lip against the upper front teeth.' },
      { q: 'Where does the ghunnah come from?', options: ['Al-khayshum', 'Al-lisan', 'Al-halq'], answer: 0, explanation: 'The ghunnah comes from the nasal cavity.' },
      { q: 'Which makhraj mistake counts as lahn jali?', options: ['Pronouncing ع like a hamza', 'A 5-count madd instead of 4', 'Missing a qalqalah'], answer: 0, explanation: 'Changing the makhraj changes the word: a major error.' },
    ],
    sifat: [
      { q: 'Which letters carry qalqalah?', options: ['فحثه شخص سكت', 'قطب جد', 'خص ضغط قظ'], answer: 1, explanation: 'قطب جد gathers the five qalqalah letters.' },
      { q: 'What does hams mean?', options: ['The breath flows', 'The sound stops', 'The letter is heavy'], answer: 0, explanation: 'Hams: the breath keeps running with the letter.' },
      { q: 'Ra after a kasrah is…', options: ['Always heavy', 'Light (tarqeeq)', 'Nasalised'], answer: 1, explanation: 'After a kasrah, ra is light.' },
      { q: 'Which sifah has no opposite?', options: ['Shiddah', 'Jahr', 'Safeer'], answer: 2, explanation: 'Safeer is one of the standalone sifat.' },
      { q: 'Why are ت and ط different?', options: ['Because of their sifat', 'Because of their makhraj', 'Because of their madd'], answer: 0, explanation: 'Their makhraj is nearly identical; the sifat separate them.' },
    ],
    madd: [
      { q: 'How many harakat is madd tabi‘i?', options: ['2', '4', '6'], answer: 0, explanation: 'The natural madd lasts 2 harakat.' },
      { q: 'Madd lazim lasts…', options: ['2 harakat', '4 harakat', '6 harakat'], answer: 2, explanation: '6 harakat, permanent sukoon after the madd letter.' },
      { q: 'In madd muttasil the hamza is…', options: ['In the same word', 'At the start of the next word', 'Absent'], answer: 0, explanation: 'Muttasil = connected: hamza in the same word, compulsory stretch.' },
      { q: 'الٓمٓ is an example of which madd?', options: ['Munfasil', 'Lazim', 'Arid'], answer: 1, explanation: 'Disjointed opening letters fall under madd lazim.' },
      { q: 'Madd arid li-s-sukoon appears…', options: ['When stopping at the end of a verse', 'Before every hamza', 'Only in Warsh'], answer: 0, explanation: 'The sukoon is temporary, caused by the stop.' },
    ],
    'waqf-ibtida': [
      { q: 'Waqf tamm means that…', options: ['The meaning is complete', 'Stopping is forbidden', 'You must go back'], answer: 0, explanation: 'Meaning and grammar complete: the ideal stop.' },
      { q: 'The ﻻ sign means…', options: ['Compulsory stop', 'Do not stop', 'Preferable stop'], answer: 1, explanation: 'ﻻ marks a waqf mamnu.' },
      { q: 'After an emergency stop you resume…', options: ['At the next word', 'A few words earlier', 'At the start of the surah'], answer: 1, explanation: 'Resume at the start of a complete meaning.' },
      { q: 'Sakt is…', options: ['A stop with a breath', 'A suspension without breathing', 'A 6-harakat stretch'], answer: 1, explanation: 'Sakt cuts the voice, not the breath.' },
      { q: 'Waqf qabih is…', options: ['Recommended', 'Blameworthy, it distorts the meaning', 'Neutral'], answer: 1, explanation: 'Stopping there alters the meaning of the verse.' },
    ],
    qalqalah: [
      { q: 'How many letters have qalqalah?', options: ['3', '5', '7'], answer: 1, explanation: 'Five: ق ط ب ج د.' },
      { q: 'Qalqalah kubra happens…', options: ['Inside the word', 'When stopping at the end of a word', 'Before a hamza'], answer: 1, explanation: 'Major qalqalah: when you stop on the final letter.' },
      { q: 'Does qalqalah add a vowel?', options: ['Yes, a fathah', 'No, never', 'Yes, a dammah'], answer: 1, explanation: 'It is a crisp bounce with no vowel colour.' },
      { q: 'Which letter has no qalqalah?', options: ['Kaf', 'Jeem', 'Dal'], answer: 0, explanation: 'Kaf is not part of قطب جد.' },
      { q: 'Stopping on تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ you…', options: ['Bounce once after the shaddah', 'Bounce twice', 'Do not bounce'], answer: 0, explanation: 'Hold the shaddah, then bounce once.' },
    ],
  },
};

const ar: ExtraDict = {
  topics: {
    'waqf-ibtida': {
      title: 'الوقف والابتداء',
      h1: 'الوقف والابتداء: أين تقف وأين تبتدئ في تلاوة القرآن',
      metaTitle: 'الوقف والابتداء في التجويد: علامات الوقف وأحكام الابتداء',
      metaDescription:
        'شرح الوقف والابتداء: علامات الوقف في المصحف (مـ، ﻻ، ج، صلى، قلى)، وأقسام الوقف: التام والكافي والحسن والقبيح، وأحكام الابتداء بعد الوقف.',
      intro:
        'الوقف علم يبيّن مواضع القطع، والابتداء علم يبيّن مواضع الاستئناف. والوقف في غير موضعه قد يقلب المعنى، والابتداء الخاطئ يذهب بالمراد. وهما تمام علوم المخارج والصفات والمدود؛ لأنهما يتعلقان بالمعنى كما يتعلقان بالصوت.',
      summary: 'أقسام الوقف الأربعة (التام والكافي والحسن والقبيح)، وعلامات المصحف، وقاعدة الابتداء: الابتداء بكلام مستقل المعنى.',
      items: [
        { arabic: 'الوقف التام', name: 'الوقف التام', text: 'ما تمّ معناه ولم يتعلق بما بعده لفظًا ولا معنى، فيُوقف عليه ويُبتدأ بما بعده.', example: 'وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ' },
        { arabic: 'الوقف الكافي', name: 'الوقف الكافي', text: 'ما تمّ معناه وتعلّق بما بعده معنًى لا لفظًا، فيحسن الوقف عليه والابتداء بما بعده.', example: 'خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ' },
        { arabic: 'الوقف الحسن', name: 'الوقف الحسن', text: 'ما أفاد معنى لكنه متعلق بما بعده لفظًا، فيجوز الوقف والأولى الرجوع بكلمات عند الاستئناف.', example: 'الْحَمْدُ لِلَّهِ' },
        { arabic: 'الوقف القبيح', name: 'الوقف القبيح', text: 'ما لم يُفهم منه معنى أو أفسد المعنى، ولا يجوز إلا لضرورة انقطاع النفس مع الرجوع.', example: 'فَوَيْلٌ لِّلْمُصَلِّينَ (من غير ما بعدها)' },
        { arabic: 'الابتداء', name: 'الابتداء', text: 'لا يُبتدأ بكلمة يتعلق معناها بما قبلها، بل يُرجع إلى أول الجملة المفيدة.', example: 'يُبتدأ بـ الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ' },
        { arabic: 'صلى / قلى', name: 'علامات المصحف', text: 'صلى: الوصل أولى. قلى: الوقف أولى. والنقاط الثلاث المتقابلة: يوقف على أحد الموضعين فقط.', example: 'علامات الوقف في مصحف المدينة' },
      ],
      faq: [
        { q: 'ما الفرق بين الوقف والسكت؟', a: 'الوقف قطع الصوت مع التنفس، أما السكت فقطع الصوت من غير تنفس زمنًا يسيرًا، ويُرمز له بالسين في المصحف كما في عِوَجَا ۜ قَيِّمًا.' },
        { q: 'هل يجوز الوقف في أي موضع عند انقطاع النفس؟', a: 'نعم، الوقف الاضطراري جائز في أي موضع، لكن يجب الابتداء بما قبله بكلمات على معنى مستقل حتى لا يختل المعنى.' },
        { q: 'ماذا تعني علامة ﻻ في المصحف؟', a: 'تدل على أنه لا يُوقف في هذا الموضع لأن الوقف يخل بالمعنى، فإن انقطع النفس رجع القارئ بكلمات قبله.' },
        { q: 'هل يُسأل عن الوقف في الإجازة؟', a: 'نعم؛ يقيّم الشيخ صحة النطق وسلامة الوقف والابتداء معًا، لأنهما دليل على فهم القارئ للنص.' },
      ],
    },
    qalqalah: {
      title: 'القلقلة',
      h1: 'القلقلة في التجويد: حروفها ومراتبها وأمثلتها',
      metaTitle: 'القلقلة: حروف قطب جد ومراتبها بالأمثلة',
      metaDescription:
        'شرح القلقلة في التجويد: حروفها الخمسة (قطب جد)، والقلقلة الصغرى والكبرى، والأخطاء الشائعة مع أمثلة قرآنية.',
      intro:
        'القلقلة اضطراب يسير في الصوت يصاحب خمسة حروف عند سكونها، وبها تتضح التلاوة وتنضبط؛ فتركها يُخفي الحرف، والمبالغة فيها تُحدث حركة لا وجود لها في النص.',
      summary: 'حروف قطب جد الخمسة، والفرق بين القلقلة الصغرى في وسط الكلمة والكبرى عند الوقف، والقاعدة: اضطراب يسير من غير حركة.',
      items: [
        { arabic: 'قطب جد', name: 'حروف القلقلة', text: 'القاف والطاء والباء والجيم والدال، يجمعها قولك (قطب جد)، ولا قلقلة في غيرها.', example: 'أَبْصَارِهِمْ' },
        { arabic: 'الصغرى', name: 'القلقلة الصغرى', text: 'سكون أصلي في وسط الكلمة، فتكون القلقلة خفيفة سريعة من غير إطالة.', example: 'يَجْعَلُونَ' },
        { arabic: 'الكبرى', name: 'القلقلة الكبرى', text: 'سكون عارض بالوقف في آخر الكلمة، فتكون القلقلة أظهر من غير إحداث حركة.', example: 'قُلْ هُوَ اللَّهُ أَحَدْ' },
        { arabic: 'المشددة', name: 'القلقلة في المشدد', text: 'عند الوقف على حرف قلقلة مشدد يُضغط على الشدة ثم يُقلقل قلقلة واحدة.', example: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ' },
        { arabic: 'الأخطاء', name: 'الأخطاء الشائعة', text: 'إحداث فتحة أو ضمة مع القلقلة، أو تركها في وسط الكلمة، أو قلقلة حروف ليست منها كالتاء والكاف.', example: 'يَقْطَعُونَ' },
      ],
      faq: [
        { q: 'ما حروف القلقلة؟', a: 'خمسة حروف يجمعها (قطب جد): القاف والطاء والباء والجيم والدال، وتُقلقل كلما سكنت في وسط الكلمة أو عند الوقف.' },
        { q: 'ما الفرق بين القلقلة الصغرى والكبرى؟', a: 'الصغرى عند السكون الأصلي في وسط الكلمة وتكون خفيفة، والكبرى عند الوقف على آخر الكلمة وتكون أظهر.' },
        { q: 'هل تُحدث القلقلة حركة؟', a: 'لا؛ القلقلة اضطراب في الصوت من غير فتح ولا ضم ولا كسر، ومن أحدث حركة فقد أخطأ.' },
        { q: 'كيف أتدرب على القلقلة؟', a: 'اقرأ سورتي الإخلاص والمسد مع ضبط كل سكون من (قطب جد)، وسجّل تلاوتك وقارنها بقارئ متقن؛ ويمكن للتحليل الآلي رصد القلقلة الناقصة أو المبالغ فيها آية آية.' },
      ],
    },
  },
  faqPage: {
    metaTitle: 'أسئلة شائعة في التجويد: مرجع كامل بالعربية والفرنسية والإنجليزية',
    metaDescription:
      'أسئلة شائعة في التجويد: المخارج والصفات والمدود والقلقلة والوقف والابتداء، بإجابات مختصرة محرَّرة لتحسين التلاوة.',
    h1: 'أسئلة شائعة في التجويد',
    intro:
      'تجمع هذه الصفحة أكثر الأسئلة تكرارًا في التجويد، مرتبة بحسب الدروس: مخارج الحروف وصفاتها والمدود والقلقلة والوقف والابتداء، مع رابط إلى الدرس المفصّل لكل باب.',
    linkLabel: 'كل الأسئلة الشائعة',
    sectionAll: 'أسئلة عامة',
    backToHub: 'العودة إلى دليل التجويد',
  },
  quizStrings: {
    heading: 'اختبر معلوماتك',
    intro: 'خمسة أسئلة اختيار من متعدد مع تصحيح فوري.',
    check: 'تحقق',
    next: 'السؤال التالي',
    restart: 'إعادة',
    correct: 'إجابة صحيحة',
    wrong: 'إجابة خاطئة',
    result: 'نتيجتك',
    best: 'أفضل نتيجة',
    progress: 'سؤال',
  },
  linkBlock: {
    heading: 'تابع دروس التجويد',
    intro: 'كل درس يشرح بابًا مع أمثلة قرآنية وأخطاء شائعة واختبار قصير.',
  },
  quizzes: {
    makharij: [
      { q: 'كم عدد مخارج الحروف؟', options: ['٥', '١٧', '٢٨'], answer: 1, explanation: 'سبعة عشر مخرجًا في خمس مناطق على مذهب ابن الجزري.' },
      { q: 'من أي منطقة تخرج حروف المد ا و ي؟', options: ['الجوف', 'الحلق', 'الشفتان'], answer: 0, explanation: 'تخرج من خلاء الفم (الجوف).' },
      { q: 'أي حرف يخرج من بطن الشفة السفلى مع الثنايا العليا؟', options: ['الباء', 'الفاء', 'الميم'], answer: 1, explanation: 'الفاء.' },
      { q: 'من أين تخرج الغنّة؟', options: ['الخيشوم', 'اللسان', 'الحلق'], answer: 0, explanation: 'الغنّة مخرجها الخيشوم.' },
      { q: 'أي خطأ في المخرج يُعدّ لحنًا جليًا؟', options: ['نطق العين همزة', 'مد خمس حركات بدل أربع', 'ترك القلقلة'], answer: 0, explanation: 'تغيير المخرج يغيّر الكلمة فهو لحن جلي.' },
    ],
    sifat: [
      { q: 'ما حروف القلقلة؟', options: ['فحثه شخص سكت', 'قطب جد', 'خص ضغط قظ'], answer: 1, explanation: 'قطب جد.' },
      { q: 'ما معنى الهمس؟', options: ['جريان النفس', 'انحباس الصوت', 'تفخيم الحرف'], answer: 0, explanation: 'الهمس جريان النفس مع الحرف.' },
      { q: 'الراء بعد الكسر…', options: ['مفخمة دائمًا', 'مرققة', 'مغنونة'], answer: 1, explanation: 'تُرقَّق بعد الكسر.' },
      { q: 'أي صفة لا ضد لها؟', options: ['الشدة', 'الجهر', 'الصفير'], answer: 2, explanation: 'الصفير من الصفات التي لا ضد لها.' },
      { q: 'بماذا تفترق التاء عن الطاء؟', options: ['بالصفات', 'بالمخرج', 'بالمد'], answer: 0, explanation: 'مخرجهما متقارب والفرق في الصفات.' },
    ],
    madd: [
      { q: 'كم مقدار المد الطبيعي؟', options: ['حركتان', 'أربع', 'ست'], answer: 0, explanation: 'حركتان.' },
      { q: 'مقدار المد اللازم…', options: ['حركتان', 'أربع حركات', 'ست حركات'], answer: 2, explanation: 'ست حركات لسكون أصلي.' },
      { q: 'في المد المتصل يكون الهمز…', options: ['في الكلمة نفسها', 'في أول الكلمة التالية', 'غير موجود'], answer: 0, explanation: 'المتصل: الهمز مع حرف المد في كلمة واحدة.' },
      { q: 'الٓمٓ مثال على أي مد؟', options: ['المنفصل', 'اللازم', 'العارض'], answer: 1, explanation: 'فواتح السور من المد اللازم.' },
      { q: 'المد العارض للسكون يكون…', options: ['عند الوقف آخر الآية', 'قبل كل همز', 'في رواية ورش فقط'], answer: 0, explanation: 'سكونه عارض بسبب الوقف.' },
    ],
    'waqf-ibtida': [
      { q: 'الوقف التام يعني…', options: ['تمام المعنى', 'منع الوقف', 'وجوب الرجوع'], answer: 0, explanation: 'تمّ المعنى ولم يتعلق بما بعده.' },
      { q: 'علامة ﻻ تدل على…', options: ['وقف لازم', 'عدم الوقف', 'أفضلية الوقف'], answer: 1, explanation: 'وقف ممنوع.' },
      { q: 'بعد الوقف الاضطراري يُبتدأ…', options: ['بما بعده مباشرة', 'بكلمات قبله', 'بأول السورة'], answer: 1, explanation: 'يُرجع إلى معنى مستقل.' },
      { q: 'السكت هو…', options: ['وقف مع تنفس', 'قطع الصوت من غير تنفس', 'مد ست حركات'], answer: 1, explanation: 'قطع الصوت زمنًا يسيرًا من غير تنفس.' },
      { q: 'الوقف القبيح…', options: ['مستحب', 'مذموم لإفساده المعنى', 'مباح'], answer: 1, explanation: 'يفسد المعنى فلا يجوز إلا لضرورة.' },
    ],
    qalqalah: [
      { q: 'كم عدد حروف القلقلة؟', options: ['ثلاثة', 'خمسة', 'سبعة'], answer: 1, explanation: 'خمسة: ق ط ب ج د.' },
      { q: 'القلقلة الكبرى تكون…', options: ['في وسط الكلمة', 'عند الوقف آخر الكلمة', 'قبل الهمز'], answer: 1, explanation: 'عند الوقف على الحرف الأخير.' },
      { q: 'هل تُحدث القلقلة حركة؟', options: ['نعم فتحة', 'لا أبدًا', 'نعم ضمة'], answer: 1, explanation: 'اضطراب من غير حركة.' },
      { q: 'أي حرف ليس من حروف القلقلة؟', options: ['الكاف', 'الجيم', 'الدال'], answer: 0, explanation: 'الكاف ليست من (قطب جد).' },
      { q: 'عند الوقف على وَتَبَّ…', options: ['قلقلة واحدة بعد الشدة', 'قلقلتان', 'لا قلقلة'], answer: 0, explanation: 'يُضغط على الشدة ثم قلقلة واحدة.' },
    ],
  },
};

export const TAJWEED_EXTRA: Record<Locale, ExtraDict> = { fr, en, ar };
