import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Trash2,
  HardDrive,
  Wifi,
  WifiOff,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { SURAHS } from '@/data/quranData';
import { fetchSurah } from '@/lib/quranApi';

interface OfflineCacheManagerProps {
  isOnline: boolean;
  isOfflineReady: boolean;
  cacheStats: {
    verses: number;
    audio: number;
    size: number;
  };
  formatCacheSize: (bytes: number) => string;
  cacheSurah: (
    surahNumber: number,
    verses: Array<{ verseNumber: number; text: string; translation?: string }>,
  ) => Promise<void>;
  isSurahCached: (surahNumber: number, totalVerses: number) => Promise<boolean>;
  clearCache: () => Promise<void>;
}

export const OfflineCacheManager: React.FC<OfflineCacheManagerProps> = ({
  isOnline,
  isOfflineReady,
  cacheStats,
  formatCacheSize,
  cacheSurah,
  isSurahCached,
  clearCache,
}) => {
  const [downloading, setDownloading] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [cachedSurahs, setCachedSurahs] = useState<Set<number>>(new Set());
  const [isClearing, setIsClearing] = useState(false);

  // Quick download popular surahs
  const popularSurahs = [1, 112, 113, 114];

  const handleDownloadSurah = async (surahNumber: number) => {
    if (!isOnline) return;

    setDownloading(surahNumber);
    setProgress(0);

    try {
      const verses = await fetchSurah(surahNumber, { translationId: 'fr.hamidullah' });

      // Simulate progressive download (only used for small "popular" surahs)
      for (let i = 0; i < verses.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        setProgress(((i + 1) / verses.length) * 100);
      }

      await cacheSurah(surahNumber, verses);
      setCachedSurahs((prev) => new Set([...prev, surahNumber]));
    } catch (error) {
      console.error('Failed to download surah:', error);
    } finally {
      setDownloading(null);
      setProgress(0);
    }
  };

  const handleDownloadAll = async () => {
    for (const surahNumber of popularSurahs) {
      if (!cachedSurahs.has(surahNumber)) {
        await handleDownloadSurah(surahNumber);
      }
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearCache();
      setCachedSurahs(new Set());
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Mode Hors-ligne</CardTitle>
          </div>
          <Badge 
            variant={isOnline ? "outline" : "destructive"} 
            className="flex items-center gap-1"
          >
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" />
                En ligne
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Hors ligne
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{cacheStats.verses}</p>
            <p className="text-xs text-muted-foreground">Versets</p>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{cacheStats.audio}</p>
            <p className="text-xs text-muted-foreground">Audios</p>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {formatCacheSize(cacheStats.size)}
            </p>
            <p className="text-xs text-muted-foreground">Taille</p>
          </div>
        </div>

        {/* Quick download section */}
        <div>
          <p className="text-sm font-medium mb-2">Téléchargement rapide</p>
          <div className="grid grid-cols-2 gap-2">
            {popularSurahs.map((surahNumber) => {
              const surah = SURAHS.find(s => s.id === surahNumber);
              const isCached = cachedSurahs.has(surahNumber);
              const isDownloading = downloading === surahNumber;

              return (
                <Button
                  key={surahNumber}
                  variant={isCached ? "secondary" : "outline"}
                  size="sm"
                  disabled={!isOnline || isDownloading}
                  onClick={() => handleDownloadSurah(surahNumber)}
                  className="justify-start h-auto py-2"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isCached ? (
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  <div className="text-left">
                    <p className="text-xs font-medium">{surah?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {surah?.transliteration}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Progress bar */}
          {downloading && (
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Téléchargement... {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            disabled={!isOnline || downloading !== null}
            onClick={handleDownloadAll}
          >
            <Download className="h-4 w-4 mr-2" />
            Tout télécharger
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={cacheStats.verses === 0 || isClearing}
            onClick={handleClearCache}
          >
            {isClearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Offline mode info */}
        {!isOnline && isOfflineReady && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-primary font-medium">
              ✓ Mode hors-ligne actif
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vous pouvez pratiquer avec les {cacheStats.verses} versets téléchargés.
              L'analyse IA sera disponible quand vous serez à nouveau connecté.
            </p>
          </div>
        )}

        {!isOnline && !isOfflineReady && (
          <div className="p-3 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Aucun contenu hors-ligne
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Connectez-vous pour télécharger des versets et pouvoir pratiquer hors-ligne.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
