import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  WifiOff, 
  Mic, 
  BookOpen, 
  AlertTriangle,
  CheckCircle,
  Play
} from 'lucide-react';

interface OfflinePracticeModeProps {
  isOnline: boolean;
  cachedVerseCount: number;
  currentSurah: number;
  currentVerse: number;
  isVerseCached: boolean;
  onStartPractice: () => void;
  onListenReference: () => void;
}

export const OfflinePracticeMode: React.FC<OfflinePracticeModeProps> = ({
  isOnline,
  cachedVerseCount,
  currentSurah,
  currentVerse,
  isVerseCached,
  onStartPractice,
  onListenReference,
}) => {
  if (isOnline) return null;

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <WifiOff className="h-5 w-5" />
            Mode Hors-ligne
          </CardTitle>
          <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 dark:text-amber-400">
            {cachedVerseCount} versets disponibles
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current verse status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          {isVerseCached ? (
            <>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-foreground">
                Sourate {currentSurah}, Verset {currentVerse} disponible hors-ligne
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">
                Ce verset n'est pas dans le cache
              </span>
            </>
          )}
        </div>

        {/* Practice options */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            🔇 L'analyse IA n'est pas disponible hors-ligne.
            Vous pouvez pratiquer en écoutant les récitations de référence.
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onListenReference}
              className="text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              Écouter référence
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onStartPractice}
              className="text-xs"
            >
              <Mic className="h-3 w-3 mr-1" />
              S'entraîner seul
            </Button>
          </div>
        </div>

        {/* Features available offline */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Disponible hors-ligne :</p>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            <li>Écouter les récitations de référence (si téléchargées)</li>
            <li>Lire les versets en arabe</li>
            <li>Pratiquer sans correction IA</li>
          </ul>
        </div>

        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
          💡 Connectez-vous pour accéder à l'analyse IA et télécharger plus de versets
        </p>
      </CardContent>
    </Card>
  );
};
