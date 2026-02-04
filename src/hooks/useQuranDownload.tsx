import { useState, useCallback, useRef } from 'react';
import { SURAHS } from '@/data/quranData';
import { fetchSurah } from '@/lib/quranApi';

export interface DownloadProgress {
  total: number;
  completed: number;
  currentSurah: number | null;
  currentSurahName: string | null;
  status: 'idle' | 'downloading' | 'paused' | 'complete' | 'error';
  errors: string[];
}

const CONCURRENCY_LIMIT = 3;

export const useQuranDownload = (
  cacheSurah: (
    surahNumber: number,
    verses: Array<{ verseNumber: number; text: string; translation?: string }>,
    translationId?: string,
  ) => Promise<void>,
  translationId: string = 'fr.hamidullah',
) => {
  const [progress, setProgress] = useState<DownloadProgress>({
    total: SURAHS.length,
    completed: 0,
    currentSurah: null,
    currentSurahName: null,
    status: 'idle',
    errors: [],
  });

  const pausedRef = useRef(false);
  const abortRef = useRef(false);

  const downloadAll = useCallback(async () => {
    pausedRef.current = false;
    abortRef.current = false;

    setProgress((prev) => ({
      ...prev,
      status: 'downloading',
      completed: 0,
      errors: [],
      currentSurah: null,
      currentSurahName: null,
    }));

    const queue = [...SURAHS.map((s) => s.id)];
    const errors: string[] = [];
    let completed = 0;

    const worker = async () => {
      while (queue.length > 0) {
        if (abortRef.current) break;
        if (pausedRef.current) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }

        const surahId = queue.shift();
        if (surahId === undefined) break;

        const surah = SURAHS.find((s) => s.id === surahId);
        setProgress((prev) => ({
          ...prev,
          currentSurah: surahId,
          currentSurahName: surah?.transliteration ?? null,
        }));

        try {
          const verses = await fetchSurah(surahId, { translationId });
          await cacheSurah(surahId, verses, translationId);
        } catch (e) {
          errors.push(`Sourate ${surahId}: ${e instanceof Error ? e.message : 'Erreur'}`);
        }

        completed += 1;
        setProgress((prev) => ({ ...prev, completed, errors: [...errors] }));
      }
    };

    // Run workers concurrently
    const workers = Array.from({ length: CONCURRENCY_LIMIT }, () => worker());
    await Promise.all(workers);

    setProgress((prev) => ({
      ...prev,
      status: abortRef.current ? 'idle' : errors.length > 0 && completed < SURAHS.length ? 'error' : 'complete',
      currentSurah: null,
      currentSurahName: null,
    }));
  }, [cacheSurah, translationId]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setProgress((prev) => ({ ...prev, status: 'paused' }));
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setProgress((prev) => ({ ...prev, status: 'downloading' }));
  }, []);

  const cancel = useCallback(() => {
    abortRef.current = true;
    pausedRef.current = false;
    setProgress((prev) => ({
      ...prev,
      status: 'idle',
      currentSurah: null,
      currentSurahName: null,
    }));
  }, []);

  return { progress, downloadAll, pause, resume, cancel };
};
