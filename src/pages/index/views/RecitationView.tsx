import { lazy, Suspense } from 'react';
import { FileText, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star8Point } from '@/components/decorative/GeometricPattern';
import { VerseNavigator } from '@/components/navigation/VerseNavigator';
import { OfflinePracticeMode } from '@/components/offline/OfflinePracticeMode';
import { SaveRecordingDialog } from '@/components/recitation/SaveRecordingDialog';
import { ListenAndReciteMode } from '@/components/recitation/ListenAndReciteMode';
import { TranslationToggle } from '@/components/recitation/TranslationToggle';
import { RecitationSkeleton, ReportSkeleton } from '@/components/ui/skeleton-card';
import { SURAHS } from '@/data/quranData';
import type { IndexState } from '../useIndexState';
import { getGlobalAyahNumber } from '../indexHelpers';

const RecitationInterface = lazy(() => import('@/components/recitation/RecitationInterface').then(m => ({ default: m.RecitationInterface })));
const RecitationReport = lazy(() => import('@/components/reports/RecitationReport').then(m => ({ default: m.RecitationReport })));

interface RecitationViewProps {
  state: IndexState;
}

export const RecitationView = ({ state: s }: RecitationViewProps) => {
  const { t } = s;
  const currentSurahMeta = SURAHS.find(sur => sur.id === s.currentSurah);
  const referenceAudioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${getGlobalAyahNumber(s.currentSurah, s.currentVerse)}.mp3`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => { s.sessionTimer.reset(); s.setCurrentView('dashboard'); }}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {t.backLabel}
            </Button>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-mono ${s.sessionTimer.isRunning ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                ⏱ {s.sessionTimer.formatted}
              </div>
              {s.credits !== null && (
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  s.credits === 0 ? 'bg-destructive/15 text-destructive' : s.isLowCredits ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'
                }`}>
                  <Zap className="h-3.5 w-3.5" />
                  <span>{s.credits}</span>
                </div>
              )}
              <Star8Point size={24} className="text-primary" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <VerseNavigator
          currentSurah={s.currentSurah}
          currentVerse={s.currentVerse}
          onNavigate={s.handleNavigate}
        />

        <TranslationToggle />

        <Suspense fallback={<RecitationSkeleton />}>
          <RecitationInterface
            surahName={currentSurahMeta?.transliteration || 'Al-Fatiha'}
            surahArabic={currentSurahMeta?.name || 'الفاتحة'}
            surahNumber={s.currentSurah}
            currentVerse={s.currentVerse}
            totalVerses={currentSurahMeta?.verses || 7}
            verseText={s.currentVerseText || `Sourate ${s.currentSurah}, verset ${s.currentVerse}`}
            verseTranslation={s.currentVerseTranslation}
            showTranslation={s.showTranslation}
            isRecording={s.isRecording}
            isAnalyzing={s.analyzing}
            analysisStep={s.analysisStep}
            transcriptionFailed={s.transcriptionFailed}
            userAudioBlob={s.userAudioBlob}
            mediaStream={s.mediaStream}
            audioDebugStats={{
              mimeType: s.audioMimeType,
              chunks: s.recordingStats.chunks,
              totalBytes: s.recordingStats.totalBytes,
              blobSize: s.recordingStats.blobSize,
              durationMs: s.recordingStats.durationMs,
              base64Length: s.recordingStats.base64Length,
              trackLabel: s.recordingStats.trackLabel,
              trackSettings: s.recordingStats.trackSettings,
              error: s.recordingError,
            }}
            onStartRecording={s.handleStartRecording}
            onStopRecording={s.handleStopRecording}
            onEnvelopeSimilarityScore={s.setPendingEnvelopeScore}
            onPreviousVerse={() => s.currentVerse > 1 && s.handleNavigate(s.currentSurah, s.currentVerse - 1)}
            onNextVerse={() => {
              if (currentSurahMeta && s.currentVerse < currentSurahMeta.verses) {
                s.handleNavigate(s.currentSurah, s.currentVerse + 1);
              }
            }}
            recordingError={s.recordingError}
            feedback={s.showFeedback && s.aiFeedback ? s.aiFeedback : undefined}
          />
        </Suspense>

        <ListenAndReciteMode
          surahNumber={s.currentSurah}
          verseNumber={s.currentVerse}
          verseText={s.currentVerseText || ''}
          referenceAudioUrl={referenceAudioUrl}
          onRecordFragment={() => {
            if (!s.isRecording && !s.analyzing) {
              s.handleStartRecording();
            }
          }}
          isAnalyzing={s.analyzing}
        />

        <OfflinePracticeMode
          isOnline={s.isOnline}
          cachedVerseCount={s.cacheStats.verses}
          currentSurah={s.currentSurah}
          currentVerse={s.currentVerse}
          isVerseCached={s.isCurrentVerseCached}
          onStartPractice={() => {
            toast.info('Mode pratique sans analyse IA');
          }}
          onListenReference={() => {
            const element = document.querySelector('[data-reference-recitations]');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {s.showFeedback && s.analysisResult && (
          <Card>
            <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.score} :</span>
                  <span className="font-semibold text-foreground">
                    {typeof s.analysisResult.overallScore === 'number' ? s.analysisResult.overallScore : Number(s.analysisResult.overallScore ?? 0)}
                    /100
                  </span>
                  {Array.isArray(s.analysisResult.errors) && s.analysisResult.errors.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      • {s.analysisResult.errors.length} {t.errorsCount}
                    </span>
                  )}
                </div>
                {s.analysisResult.transcriptionImpossible && (
                  <p className="text-sm text-destructive">
                    {t.transcriptionImpossibleMsg}{s.analysisResult.whisperError ? ` : ${s.analysisResult.whisperError}` : ''}.
                  </p>
                )}
                {!s.analysisResult.transcriptionImpossible && (!s.analysisResult.errors || s.analysisResult.errors.length === 0) && !s.analysisResult.isCorrect && (
                  <p className="text-sm text-muted-foreground">
                    Aucun détail d'erreur n'a été renvoyé — clique sur « Voir le rapport » puis réessaie.
                  </p>
                )}
              </div>
              <Button variant="outline" onClick={() => s.setShowReport(true)} className="gap-2">
                <FileText className="h-4 w-4" />
                {t.viewReport}
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={s.showReport} onOpenChange={s.setShowReport}>
          <DialogContent className="w-[95vw] max-w-4xl">
            <ScrollArea className="max-h-[75vh] pr-4">
              {s.analysisResult && (
                <Suspense fallback={<ReportSkeleton />}>
                  <RecitationReport
                    surahNumber={s.currentSurah}
                    verseNumber={s.currentVerse}
                    score={s.analysisResult.overallScore || 0}
                    isCorrect={s.analysisResult.isCorrect || false}
                    feedback={s.analysisResult.feedback || ''}
                    priorityFixes={s.analysisResult.priorityFixes || []}
                    errors={s.analysisResult.errors || []}
                    transcribedText={s.analysisResult.transcribedText}
                    expectedText={s.analysisResult.expectedText || s.currentVerseText || `Sourate ${s.currentSurah}, verset ${s.currentVerse}`}
                    textComparison={s.analysisResult.textComparison}
                  />
                </Suspense>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <SaveRecordingDialog
          open={s.showSaveDialog}
          onOpenChange={s.setShowSaveDialog}
          onSave={s.handleSaveRecording}
          onDiscard={s.handleDiscardRecording}
          surahName={currentSurahMeta?.name}
          verseNumber={s.currentVerse}
        />

        <Dialog open={s.showNoCredits} onOpenChange={s.setShowNoCredits}>
          <DialogContent className="text-center max-w-sm">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center">
                <Zap className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t.noMoreCredits}</h3>
              <p className="text-muted-foreground text-sm">
                {t.noCreditsDesc}
              </p>
              <Button variant="default" onClick={() => { s.setShowNoCredits(false); s.navigate('/shop'); }}>
                {t.rechargeCredits}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
