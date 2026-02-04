import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Pause, Play, X, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { useQuranDownload, DownloadProgress } from '@/hooks/useQuranDownload';

interface DownloadAllQuranProps {
  cacheSurah: (
    surahNumber: number,
    verses: Array<{ verseNumber: number; text: string; translation?: string }>,
    translationId?: string,
  ) => Promise<void>;
  isOnline: boolean;
  translationId?: string;
}

export const DownloadAllQuran: React.FC<DownloadAllQuranProps> = ({
  cacheSurah,
  isOnline,
  translationId = 'fr.hamidullah',
}) => {
  const { progress, downloadAll, pause, resume, cancel } = useQuranDownload(cacheSurah, translationId);

  const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  if (progress.status === 'idle') {
    return (
      <Button variant="outline" className="w-full gap-2" onClick={downloadAll} disabled={!isOnline}>
        <Download className="h-4 w-4" />
        Télécharger tout le Coran (114 sourates)
      </Button>
    );
  }

  if (progress.status === 'complete') {
    return (
      <div className="flex items-center justify-center gap-2 text-primary text-sm py-2">
        <CheckCircle2 className="h-4 w-4" />
        Téléchargement terminé (114 sourates)
      </div>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            {progress.status === 'downloading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {progress.status === 'paused' && <Pause className="h-4 w-4 text-muted-foreground" />}
            {progress.status === 'error' && <AlertTriangle className="h-4 w-4 text-destructive" />}
            <span>
              {progress.status === 'downloading' && `Téléchargement de ${progress.currentSurahName ?? '...'}...`}
              {progress.status === 'paused' && 'Téléchargement en pause'}
              {progress.status === 'error' && 'Erreurs de téléchargement'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {progress.completed}/{progress.total}
          </span>
        </div>

        <Progress value={percent} className="h-2" />

        <div className="flex items-center gap-2 justify-end">
          {progress.status === 'downloading' && (
            <Button variant="outline" size="sm" onClick={pause} className="gap-1">
              <Pause className="h-3 w-3" />
              Pause
            </Button>
          )}
          {progress.status === 'paused' && (
            <Button variant="outline" size="sm" onClick={resume} className="gap-1">
              <Play className="h-3 w-3" />
              Reprendre
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={cancel} className="gap-1 text-destructive">
            <X className="h-3 w-3" />
            Annuler
          </Button>
        </div>

        {progress.errors.length > 0 && (
          <div className="text-xs text-destructive max-h-20 overflow-auto">
            {progress.errors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
