import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  WifiOff,
  Download,
  HardDrive,
  BookOpen,
  Music,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { SURAHS } from '@/data/quranData';

interface CachedSurahInfo {
  surahNumber: number;
  name: string;
  transliteration: string;
  verseCount: number;
  cachedVerses: number;
  hasAudio: boolean;
}

interface OfflineScreenProps {
  isOnline: boolean;
  cacheStats: {
    verses: number;
    audio: number;
    size: number;
  };
  formatCacheSize: (bytes: number) => string;
  onStartPractice: (surah: number, verse: number) => void;
  onGoOnline: () => void;
  getCachedSurahInfo: () => Promise<CachedSurahInfo[]>;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({
  isOnline,
  cacheStats,
  formatCacheSize,
  onStartPractice,
  onGoOnline,
  getCachedSurahInfo,
}) => {
  const [cachedSurahs, setCachedSurahs] = useState<CachedSurahInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCachedInfo = async () => {
      setIsLoading(true);
      try {
        const info = await getCachedSurahInfo();
        setCachedSurahs(info);
      } catch (error) {
        console.error('Failed to load cached info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedInfo();
  }, [getCachedSurahInfo]);

  const availableSurahs = cachedSurahs.filter(s => s.cachedVerses > 0);
  const totalCachedVerses = cachedSurahs.reduce((acc, s) => acc + s.cachedVerses, 0);
  const coveragePercent = ((totalCachedVerses / 6236) * 100).toFixed(1);

  if (isOnline && cacheStats.verses > 0) {
    // Online with cache - show mini status
    return null;
  }

  if (!isOnline && cacheStats.verses === 0) {
    // Offline with no cache - critical warning
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <WifiOff className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Mode Hors-ligne</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Aucun contenu en cache</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas de versets téléchargés pour une utilisation hors-ligne.
              Connectez-vous à Internet pour télécharger du contenu.
            </p>
            <Button onClick={onGoOnline} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Offline with cache - show available content
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-full">
            <WifiOff className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Mode Hors-ligne</span>
          </div>
          <h1 className="text-2xl font-bold">Pratiquez sans connexion</h1>
          <p className="text-muted-foreground text-sm">
            L'analyse IA sera disponible quand vous serez reconnecté
          </p>
        </div>

        {/* Cache Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">{cacheStats.verses}</span>
                </div>
                <p className="text-xs text-muted-foreground">Versets</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Music className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">{cacheStats.audio}</span>
                </div>
                <p className="text-xs text-muted-foreground">Audios</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">{formatCacheSize(cacheStats.size)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Stockage</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Couverture du Coran</span>
                <span className="font-medium">{coveragePercent}%</span>
              </div>
              <Progress value={parseFloat(coveragePercent)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Available Surahs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Sourates disponibles ({availableSurahs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
              </div>
            ) : availableSurahs.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucune sourate téléchargée
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {availableSurahs.map((surah) => {
                    const surahData = SURAHS.find(s => s.id === surah.surahNumber);
                    const isComplete = surah.cachedVerses >= surah.verseCount;

                    return (
                      <div
                        key={surah.surahNumber}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {surah.surahNumber}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{surahData?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {surahData?.transliteration} • {surah.cachedVerses}/{surah.verseCount} versets
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isComplete && (
                            <Badge variant="outline" className="text-primary border-primary/50">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Complet
                            </Badge>
                          )}
                          {surah.hasAudio && (
                            <Badge variant="secondary">
                              <Music className="h-3 w-3" />
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onStartPractice(surah.surahNumber, 1)}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Reconnect Button */}
        <Button onClick={onGoOnline} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Vérifier la connexion
        </Button>
      </div>
    </div>
  );
};
