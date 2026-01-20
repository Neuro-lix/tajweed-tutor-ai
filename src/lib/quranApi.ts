export type QuranVerse = {
  verseNumber: number;
  text: string;
  translation?: string;
};

const API_BASE = 'https://api.alquran.cloud/v1';

const ayahCache = new Map<string, QuranVerse>();
const surahCache = new Map<string, QuranVerse[]>();

const keyAyah = (surah: number, verse: number, translationId?: string) =>
  `${surah}:${verse}:${translationId ?? ''}`;

const keySurah = (surah: number, translationId?: string) => `${surah}:${translationId ?? ''}`;

const safeFetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Quran API error: ${res.status}`);
  return res.json();
};

export const fetchAyah = async (
  surahNumber: number,
  verseNumber: number,
  opts?: { translationId?: string },
): Promise<QuranVerse> => {
  const translationId = opts?.translationId ?? 'fr.hamidullah';
  const cacheKey = keyAyah(surahNumber, verseNumber, translationId);
  const cached = ayahCache.get(cacheKey);
  if (cached) return cached;

  // Arabic (Uthmani)
  const arabicUrl = `${API_BASE}/ayah/${surahNumber}:${verseNumber}/quran-uthmani`;
  // Translation
  const trUrl = `${API_BASE}/ayah/${surahNumber}:${verseNumber}/${translationId}`;

  const [arabic, translation] = await Promise.all([
    safeFetchJson(arabicUrl),
    safeFetchJson(trUrl).catch(() => null),
  ]);

  const verse: QuranVerse = {
    verseNumber,
    text: arabic?.data?.text ?? '',
    translation: translation?.data?.text ?? undefined,
  };

  ayahCache.set(cacheKey, verse);
  return verse;
};

export const fetchSurah = async (
  surahNumber: number,
  opts?: { translationId?: string },
): Promise<QuranVerse[]> => {
  const translationId = opts?.translationId ?? 'fr.hamidullah';
  const cacheKey = keySurah(surahNumber, translationId);
  const cached = surahCache.get(cacheKey);
  if (cached) return cached;

  const arabicUrl = `${API_BASE}/surah/${surahNumber}/quran-uthmani`;
  const trUrl = `${API_BASE}/surah/${surahNumber}/${translationId}`;

  const [arabic, translation] = await Promise.all([
    safeFetchJson(arabicUrl),
    safeFetchJson(trUrl).catch(() => null),
  ]);

  const arabicAyahs: any[] = arabic?.data?.ayahs ?? [];
  const trAyahs: any[] = translation?.data?.ayahs ?? [];
  const trByNumber = new Map<number, string>(trAyahs.map((a) => [a.numberInSurah, a.text]));

  const verses: QuranVerse[] = arabicAyahs.map((a) => ({
    verseNumber: a.numberInSurah,
    text: a.text,
    translation: trByNumber.get(a.numberInSurah),
  }));

  surahCache.set(cacheKey, verses);
  return verses;
};
