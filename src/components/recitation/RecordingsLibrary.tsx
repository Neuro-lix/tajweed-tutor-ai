import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Music, Loader2 } from 'lucide-react';
import { useRecitationStorage, StoredRecitation } from '@/hooks/useRecitationStorage';
import { SURAHS } from '@/data/quranData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RecordingsLibraryProps {
  onClose?: () => void;
}

export const RecordingsLibrary: React.FC<RecordingsLibraryProps> = ({ onClose }) => {
  const { recordings, loading, fetchRecordings, downloadRecording, deleteRecording } = useRecitationStorage();

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const getSurahName = (num: number) => {
    const surah = SURAHS.find((s) => s.id === num);
    return surah ? surah.name : `Sourate ${num}`;
  };

  const handleDownload = async (rec: StoredRecitation) => {
    const filename = `${getSurahName(rec.surahNumber)}-v${rec.verseNumber}.wav`;
    await downloadRecording(rec.storagePath, filename);
  };

  const handleDelete = async (rec: StoredRecitation) => {
    if (confirm('Supprimer cette récitation ?')) {
      await deleteRecording(rec.id, rec.storagePath);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          Mes récitations
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recordings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune récitation sauvegardée.
            <br />
            Après chaque récitation, tu pourras choisir de la garder.
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {recordings.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {getSurahName(rec.surahNumber)} – v{rec.verseNumber}
                      </span>
                      {rec.analysisScore !== null && (
                        <Badge variant={rec.analysisScore >= 80 ? 'default' : 'secondary'}>
                          {rec.analysisScore}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(rec.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      {rec.durationSeconds && ` • ${Math.round(rec.durationSeconds)}s`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(rec)} title="Télécharger">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rec)}
                      title="Supprimer"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
