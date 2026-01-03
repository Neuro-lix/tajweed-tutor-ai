// List of 114 Surahs with Arabic names and transliteration
export const SURAHS = [
  { id: 1, name: "الفاتحة", transliteration: "Al-Fatiha", verses: 7, juz: 1 },
  { id: 2, name: "البقرة", transliteration: "Al-Baqarah", verses: 286, juz: 1 },
  { id: 3, name: "آل عمران", transliteration: "Aal-Imran", verses: 200, juz: 3 },
  { id: 4, name: "النساء", transliteration: "An-Nisa", verses: 176, juz: 4 },
  { id: 5, name: "المائدة", transliteration: "Al-Ma'idah", verses: 120, juz: 6 },
  { id: 6, name: "الأنعام", transliteration: "Al-An'am", verses: 165, juz: 7 },
  { id: 7, name: "الأعراف", transliteration: "Al-A'raf", verses: 206, juz: 8 },
  { id: 8, name: "الأنفال", transliteration: "Al-Anfal", verses: 75, juz: 9 },
  { id: 9, name: "التوبة", transliteration: "At-Tawbah", verses: 129, juz: 10 },
  { id: 10, name: "يونس", transliteration: "Yunus", verses: 109, juz: 11 },
  { id: 11, name: "هود", transliteration: "Hud", verses: 123, juz: 11 },
  { id: 12, name: "يوسف", transliteration: "Yusuf", verses: 111, juz: 12 },
  { id: 13, name: "الرعد", transliteration: "Ar-Ra'd", verses: 43, juz: 13 },
  { id: 14, name: "إبراهيم", transliteration: "Ibrahim", verses: 52, juz: 13 },
  { id: 15, name: "الحجر", transliteration: "Al-Hijr", verses: 99, juz: 14 },
  { id: 16, name: "النحل", transliteration: "An-Nahl", verses: 128, juz: 14 },
  { id: 17, name: "الإسراء", transliteration: "Al-Isra", verses: 111, juz: 15 },
  { id: 18, name: "الكهف", transliteration: "Al-Kahf", verses: 110, juz: 15 },
  { id: 19, name: "مريم", transliteration: "Maryam", verses: 98, juz: 16 },
  { id: 20, name: "طه", transliteration: "Ta-Ha", verses: 135, juz: 16 },
  // Simplified for demo - would include all 114
  { id: 114, name: "الناس", transliteration: "An-Nas", verses: 6, juz: 30 },
];

// 10 Canonical Readings (Qira'at)
export const QIRAAT = [
  { id: "hafs", name: "حفص عن عاصم", transliteration: "Ḥafṣ 'an 'Āṣim", description: "La lecture la plus répandue dans le monde musulman" },
  { id: "warsh", name: "ورش عن نافع", transliteration: "Warsh 'an Nāfi'", description: "Répandue en Afrique du Nord et de l'Ouest" },
  { id: "qalun", name: "قالون", transliteration: "Qālūn", description: "Lecture de Nafi' par la voie de Qalun" },
  { id: "duri", name: "الدوري", transliteration: "Al-Dūrī", description: "Lecture de Abu 'Amr par la voie de Duri" },
  { id: "susi", name: "السوسي", transliteration: "Al-Sūsī", description: "Lecture de Abu 'Amr par la voie de Susi" },
  { id: "ibn-kathir", name: "ابن كثير", transliteration: "Ibn Kathīr", description: "Lecture de La Mecque" },
  { id: "abu-amr", name: "أبو عمرو", transliteration: "Abū 'Amr", description: "Lecture de Bassora" },
  { id: "ibn-amir", name: "ابن عامر", transliteration: "Ibn 'Āmir", description: "Lecture de Damas" },
  { id: "hamzah", name: "حمزة", transliteration: "Ḥamzah", description: "Lecture de Koufa" },
  { id: "kisai", name: "الكسائي", transliteration: "Al-Kisā'ī", description: "Lecture de Koufa" },
];

// Tajweed Rules Categories
export const TAJWEED_RULES = {
  makharij: { name: "مخارج الحروف", transliteration: "Makhārij", description: "Points d'articulation" },
  sifat: { name: "صفات الحروف", transliteration: "Ṣifāt", description: "Qualités des lettres" },
  madd: { name: "المد", transliteration: "Madd", description: "Prolongations" },
  idgham: { name: "الإدغام", transliteration: "Idghām", description: "Assimilation" },
  ikhfa: { name: "الإخفاء", transliteration: "Ikhfā'", description: "Dissimulation" },
  iqlab: { name: "الإقلاب", transliteration: "Iqlāb", description: "Conversion" },
  izhar: { name: "الإظهار", transliteration: "Iẓhār", description: "Manifestation" },
  waqf: { name: "الوقف", transliteration: "Waqf", description: "Arrêts" },
};
