import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'quran-cache';
const DB_VERSION = 1;
const VERSE_STORE = 'verses';
const AUDIO_STORE = 'audio';

interface CachedVerse {
  key: string;
  surahNumber: number;
  verseNumber: number;
  text: string;
  translation?: string;
  translationId?: string;
  cachedAt: number;
}

interface CachedAudio {
  key: string;
  surahNumber: number;
  verseNumber: number;
  reciter: string;
  audioBlob: Blob;
  cachedAt: number;
}

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDbReady, setIsDbReady] = useState(false);
  const [cachedVerses, setCachedVerses] = useState<Map<string, CachedVerse>>(new Map());
  const [cacheStats, setCacheStats] = useState({ verses: 0, audio: 0, size: 0 });

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const db = await openDatabase();
        setIsDbReady(true);
        await updateCacheStats();
        db.close();
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };

    initDB();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const openDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create verse store
        if (!db.objectStoreNames.contains(VERSE_STORE)) {
          const verseStore = db.createObjectStore(VERSE_STORE, { keyPath: 'key' });
          verseStore.createIndex('surah', 'surahNumber', { unique: false });
        }

        // Create audio store
        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          const audioStore = db.createObjectStore(AUDIO_STORE, { keyPath: 'key' });
          audioStore.createIndex('surah', 'surahNumber', { unique: false });
        }
      };
    });
  };

  const getVerseKey = (surah: number, verse: number, translationId?: string) =>
    `${surah}:${verse}:${translationId ?? ''}`;
  const getAudioKey = (surah: number, verse: number, reciter: string) => `${surah}:${verse}:${reciter}`;

  // Cache a verse
  const cacheVerse = useCallback(async (
    surahNumber: number,
    verseNumber: number,
    text: string,
    translation?: string,
    translationId?: string
  ) => {
    if (!isDbReady) return;

    try {
      const db = await openDatabase();
      const transaction = db.transaction(VERSE_STORE, 'readwrite');
      const store = transaction.objectStore(VERSE_STORE);

      const verse: CachedVerse = {
        key: getVerseKey(surahNumber, verseNumber, translationId),
        surahNumber,
        verseNumber,
        text,
        translation,
        translationId,
        cachedAt: Date.now(),
      };

      store.put(verse);
      
      transaction.oncomplete = () => {
        db.close();
        setCachedVerses(prev => new Map(prev).set(verse.key, verse));
        updateCacheStats();
      };
    } catch (error) {
      console.error('Failed to cache verse:', error);
    }
  }, [isDbReady]);

  // Cache audio
  const cacheAudio = useCallback(async (
    surahNumber: number,
    verseNumber: number,
    reciter: string,
    audioBlob: Blob
  ) => {
    if (!isDbReady) return;

    try {
      const db = await openDatabase();
      const transaction = db.transaction(AUDIO_STORE, 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);

      const audio: CachedAudio = {
        key: getAudioKey(surahNumber, verseNumber, reciter),
        surahNumber,
        verseNumber,
        reciter,
        audioBlob,
        cachedAt: Date.now(),
      };

      store.put(audio);
      
      transaction.oncomplete = () => {
        db.close();
        updateCacheStats();
      };
    } catch (error) {
      console.error('Failed to cache audio:', error);
    }
  }, [isDbReady]);

  // Get cached verse
  const getCachedVerse = useCallback(async (
    surahNumber: number,
    verseNumber: number,
    translationId?: string
  ): Promise<CachedVerse | null> => {
    if (!isDbReady) return null;

    try {
      const db = await openDatabase();
      const transaction = db.transaction(VERSE_STORE, 'readonly');
      const store = transaction.objectStore(VERSE_STORE);
      const key = getVerseKey(surahNumber, verseNumber, translationId);

      return new Promise((resolve) => {
        const request = store.get(key);
        request.onsuccess = () => {
          db.close();
          resolve(request.result || null);
        };
        request.onerror = () => {
          db.close();
          resolve(null);
        };
      });
    } catch (error) {
      console.error('Failed to get cached verse:', error);
      return null;
    }
  }, [isDbReady]);

  // Get cached audio
  const getCachedAudio = useCallback(async (
    surahNumber: number,
    verseNumber: number,
    reciter: string
  ): Promise<Blob | null> => {
    if (!isDbReady) return null;

    try {
      const db = await openDatabase();
      const transaction = db.transaction(AUDIO_STORE, 'readonly');
      const store = transaction.objectStore(AUDIO_STORE);
      const key = getAudioKey(surahNumber, verseNumber, reciter);

      return new Promise((resolve) => {
        const request = store.get(key);
        request.onsuccess = () => {
          db.close();
          const result = request.result as CachedAudio | undefined;
          resolve(result?.audioBlob || null);
        };
        request.onerror = () => {
          db.close();
          resolve(null);
        };
      });
    } catch (error) {
      console.error('Failed to get cached audio:', error);
      return null;
    }
  }, [isDbReady]);

  // Cache entire surah
  const cacheSurah = useCallback(async (
    surahNumber: number,
    verses: Array<{ verseNumber: number; text: string; translation?: string }>,
    translationId?: string
  ) => {
    for (const verse of verses) {
      await cacheVerse(surahNumber, verse.verseNumber, verse.text, verse.translation, translationId);
    }
  }, [cacheVerse]);

  // Check if surah is cached
  const isSurahCached = useCallback(async (
    surahNumber: number,
    totalVerses: number
  ): Promise<boolean> => {
    if (!isDbReady) return false;

    try {
      const db = await openDatabase();
      const transaction = db.transaction(VERSE_STORE, 'readonly');
      const store = transaction.objectStore(VERSE_STORE);
      const index = store.index('surah');

      return new Promise((resolve) => {
        const request = index.count(IDBKeyRange.only(surahNumber));
        request.onsuccess = () => {
          db.close();
          resolve(request.result >= totalVerses);
        };
        request.onerror = () => {
          db.close();
          resolve(false);
        };
      });
    } catch (error) {
      return false;
    }
  }, [isDbReady]);

  // Update cache statistics
  const updateCacheStats = async () => {
    if (!isDbReady) return;

    try {
      const db = await openDatabase();
      
      const verseCount = await new Promise<number>((resolve) => {
        const transaction = db.transaction(VERSE_STORE, 'readonly');
        const store = transaction.objectStore(VERSE_STORE);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });

      const audioCount = await new Promise<number>((resolve) => {
        const transaction = db.transaction(AUDIO_STORE, 'readonly');
        const store = transaction.objectStore(AUDIO_STORE);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });

      db.close();

      // Estimate size (rough approximation)
      const estimatedSize = verseCount * 500 + audioCount * 100000; // bytes
      
      setCacheStats({
        verses: verseCount,
        audio: audioCount,
        size: estimatedSize,
      });
    } catch (error) {
      console.error('Failed to update cache stats:', error);
    }
  };

  // Clear all cache
  const clearCache = useCallback(async () => {
    try {
      const db = await openDatabase();
      
      const verseTransaction = db.transaction(VERSE_STORE, 'readwrite');
      verseTransaction.objectStore(VERSE_STORE).clear();
      
      const audioTransaction = db.transaction(AUDIO_STORE, 'readwrite');
      audioTransaction.objectStore(AUDIO_STORE).clear();
      
      db.close();
      
      setCachedVerses(new Map());
      setCacheStats({ verses: 0, audio: 0, size: 0 });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  // Format cache size for display
  const formatCacheSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get cached surah info for offline screen
  const getCachedSurahInfo = useCallback(async () => {
    if (!isDbReady) return [];

    try {
      const db = await openDatabase();
      const transaction = db.transaction([VERSE_STORE, AUDIO_STORE], 'readonly');
      const verseStore = transaction.objectStore(VERSE_STORE);
      const audioStore = transaction.objectStore(AUDIO_STORE);

      const surahCounts = new Map<number, { verses: number; hasAudio: boolean }>();

      // Count verses per surah
      await new Promise<void>((resolve) => {
        const request = verseStore.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const verse = cursor.value as CachedVerse;
            const current = surahCounts.get(verse.surahNumber) || { verses: 0, hasAudio: false };
            current.verses++;
            surahCounts.set(verse.surahNumber, current);
            cursor.continue();
          } else {
            resolve();
          }
        };
      });

      // Check audio per surah
      await new Promise<void>((resolve) => {
        const request = audioStore.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const audio = cursor.value as CachedAudio;
            const current = surahCounts.get(audio.surahNumber) || { verses: 0, hasAudio: false };
            current.hasAudio = true;
            surahCounts.set(audio.surahNumber, current);
            cursor.continue();
          } else {
            resolve();
          }
        };
      });

      db.close();

      // Import SURAHS dynamically to avoid circular dependency
      const { SURAHS } = await import('@/data/quranData');

      return Array.from(surahCounts.entries()).map(([surahNumber, data]) => {
        const surah = SURAHS.find(s => s.id === surahNumber);
        return {
          surahNumber,
          name: surah?.name || '',
          transliteration: surah?.transliteration || '',
          verseCount: surah?.verses || 0,
          cachedVerses: data.verses,
          hasAudio: data.hasAudio,
        };
      }).sort((a, b) => a.surahNumber - b.surahNumber);
    } catch (error) {
      console.error('Failed to get cached surah info:', error);
      return [];
    }
  }, [isDbReady]);

  return {
    isOnline,
    isOfflineReady: isDbReady && cacheStats.verses > 0,
    cacheStats,
    formatCacheSize,
    cacheVerse,
    cacheAudio,
    getCachedVerse,
    getCachedAudio,
    cacheSurah,
    isSurahCached,
    clearCache,
    getCachedSurahInfo,
  };
};
