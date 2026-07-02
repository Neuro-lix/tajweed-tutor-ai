import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Download, Trash2, Music, Loader2, Play, Pause, FileText, FileSpreadsheet, ChevronDown,
} from 'lucide-react';
import { useRecitationStorage, StoredRecitation } from '@/hooks/useRecitationStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { SURAHS } from '@/data/quranData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { downloadRecordingsCsv } from '@/lib/recordingsCsv';
import { generateHistoryPDF } from '@/utils/pdfGenerator';

interface RecordingsLibraryProps {
  onClose?: () => void;
  userName?: string | null;
  qiraat?: string;
}

export const RecordingsLibrary: React.FC<RecordingsLibraryProps> = ({ onClose, userName, qiraat }) => {
  const { recordings, loading, fetchRecordings, downloadRecording, deleteRecording, getPlaybackUrl } =
    useRecitationStorage();
  const { t } = useLanguage();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const getSurahName = (num: number) => {
    const surah = SURAHS.find((s) => s.id === num);
    return surah ? surah.name : `${t.surah} ${num}`;
  };

  const handlePlay = async (rec: StoredRecitation) => {
    if (playingId === rec.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    setLoadingAudioId(rec.id);
    const url = await getPlaybackUrl(rec.storagePath);
    setLoadingAudioId(null);
    if (!url) {
      toast.error('Lecture impossible pour cet enregistrement.');
      return;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      toast.error('Erreur de lecture audio.');
      setPlayingId(null);
    };
    try {
      await audio.play();
      setPlayingId(rec.id);
    } catch {
      toast.error('Erreur de lecture audio.');
      setPlayingId(null);
    }
  };

  const handleDownload = async (rec: StoredRecitation) => {
    const surah = SURAHS.find((s) => s.id === rec.surahNumber);
    const filename = `${surah?.transliteration || rec.surahNumber}-v${rec.verseNumber}.wav`;
    await downloadRecording(rec.storagePath, filename);
  };

  const handleDelete = async (rec: StoredRecitation) => {
    if (confirm(t.recordingsDelete)) {
      if (playingId === rec.id) {
        audioRef.current?.pause();
        setPlayingId(null);
      }
      await deleteRecording(rec.id, rec.storagePath);
    }
  };

  const handleExportCsv = () => {
    if (recordings.length === 0) return;
    downloadRecordingsCsv(recordings);
    toast.success('Export CSV téléchargé.');
  };

  const handleExportPdf = () => {
    if (recordings.length === 0) return;
    generateHistoryPDF({
      userName: userName ?? undefined,
      qiraat,
      recordings: recordings.map((r) => ({
        surahNumber: r.surahNumber,
        verseNumber: r.verseNumber,
        createdAt: r.createdAt,
        analysisScore: r.analysisScore,
        envelopeSimilarityScore: r.envelopeSimilarityScore,
        errorCount: r.errorCount,
        durationSeconds: r.durationSeconds,
        transcription: r.transcription,
      })),
    });
    toast.success('Export PDF téléchargé.');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          {t.recordingsTitle}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={recordings.length === 0}
            className="gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={recordings.length === 0}
            className="gap-1.5"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t.close}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recordings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {t.recordingsEmpty}
            <br />
            {t.recordingsEmptyHint}
          </p>
        ) : (
          <ScrollArea className="h-[460px] pr-4">
            <div className="space-y-3">
              {recordings.map((rec) => {
                const isExpanded = expandedId === rec.id;
                return (
                  <div
                    key={rec.id}
                    className="rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="shrink-0"
                          onClick={() => handlePlay(rec)}
                          title="Écouter"
                        >
                          {loadingAudioId === rec.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : playingId === rec.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">
                              {getSurahName(rec.surahNumber)} – v{rec.verseNumber}
                            </span>
                            {rec.analysisScore !== null && (
                              <Badge variant={rec.analysisScore >= 80 ? 'default' : 'secondary'}>
                                Tajwīd {rec.analysisScore}%
                              </Badge>
                            )}
                            {rec.envelopeSimilarityScore !== null && (
                              <Badge variant="outline">Prosodie {rec.envelopeSimilarityScore}%</Badge>
                            )}
                            {rec.errorCount !== null && rec.errorCount > 0 && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                {rec.errorCount} erreur{rec.errorCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(rec.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            {rec.durationSeconds && ` • ${Math.round(rec.durationSeconds)}s`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        {rec.transcription && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                            title="Voir la transcription"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(rec)}
                          title={t.recordingsDownload}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rec)}
                          title={t.delete}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && rec.transcription && (
                      <div className="px-4 pb-3 pt-0">
                        <p className="text-xs text-muted-foreground mb-1">Transcription :</p>
                        <p className="font-arabic text-lg leading-relaxed" dir="rtl">
                          {rec.transcription}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
