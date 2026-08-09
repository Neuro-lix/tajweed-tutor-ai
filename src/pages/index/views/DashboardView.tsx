import { lazy, Suspense, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/header/AppHeader';
import { MultilingualChat } from '@/components/chat/MultilingualChat';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { SpacedRepetitionPanel } from '@/components/review/SpacedRepetitionPanel';
import { GamificationPanel } from '@/components/gamification/GamificationPanel';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';
import { StreakPanel } from '@/components/streaks/StreakPanel';
import { OfflineCacheManager } from '@/components/offline/OfflineCacheManager';
import { RewardsPanel } from '@/components/rewards/RewardsPanel';
import { CertificateModal } from '@/components/certificates/CertificateModal';
import { ProgressInsightsCard } from '@/components/dashboard/ProgressInsightsCard';
import { PriorityFixesCard } from '@/components/dashboard/PriorityFixesCard';
import { CsvExportDialog, defaultCsvFilters, type CsvFilters } from '@/components/dashboard/CsvExportDialog';
import { generateCorrectionsSummaryPDF } from '@/utils/pdfGenerator';
import { downloadCorrectionsCsv } from '@/lib/correctionsCsv';
import { buildPriorityFixes } from '@/lib/progressInsights';
import { QIRAAT_NAMES } from '@/data/quranData';
import { DashboardSkeleton, QuranMapSkeleton } from '@/components/ui/skeleton-card';
import type { IndexState } from '../useIndexState';

const ProgressDashboard = lazy(() => import('@/components/dashboard/ProgressDashboard').then(m => ({ default: m.ProgressDashboard })));
const QuranMap = lazy(() => import('@/components/dashboard/QuranMap').then(m => ({ default: m.QuranMap })));

interface DashboardViewProps {
  state: IndexState;
}

export const DashboardView = ({ state: s }: DashboardViewProps) => (
  <DashboardViewInner state={s} />
);

const DashboardViewInner = ({ state: s }: DashboardViewProps) => {
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvFilters, setCsvFilters] = useState<CsvFilters>(defaultCsvFilters);

  /** Corrections matching the current CSV filters (period, surah, severity, status). */
  const filteredCorrections = useMemo(() => {
    const since =
      csvFilters.periodDays > 0 ? Date.now() - csvFilters.periodDays * 86_400_000 : null;
    return s.corrections.filter((c) => {
      if (since && new Date(c.createdAt).getTime() < since) return false;
      if (csvFilters.surahNumber && c.surahNumber !== csvFilters.surahNumber) return false;
      if (csvFilters.severity !== 'all' && c.severity !== csvFilters.severity) return false;
      if (csvFilters.status === 'pending' && c.isResolved) return false;
      if (csvFilters.status === 'resolved' && !c.isResolved) return false;
      return true;
    });
  }, [s.corrections, csvFilters]);

  const availableSurahs = useMemo(
    () => Array.from(new Set(s.corrections.map((c) => c.surahNumber))),
    [s.corrections],
  );
  const availableSeverities = useMemo(
    () => Array.from(new Set(s.corrections.map((c) => c.severity).filter(Boolean))) as string[],
    [s.corrections],
  );

  /** Full recap PDF: corrections + tajwīd rules + recent scores/progression. */
  const handleDownloadRecapPdf = () => {
    if (s.corrections.length === 0) {
      toast.info('Récitez un passage pour générer votre récapitulatif.');
      return;
    }
    generateCorrectionsSummaryPDF({
      userName: s.profile?.fullName ?? undefined,
      qiraat: s.selectedQiraat ?? undefined,
      corrections: s.corrections.map((c) => ({
        surahNumber: c.surahNumber,
        verseNumber: c.verseNumber,
        word: c.word,
        ruleType: c.ruleType,
        ruleDescription: c.ruleDescription,
        correctionExample: c.correctionExample,
        severity: c.severity,
      })),
      // Per-session scores live in the "Mes récitations" library (RecordingsLibrary),
      // not in the dashboard state — the recap covers corrections + tajwīd rules.
      sessions: [],
    });
    toast.success('Récapitulatif PDF téléchargé.');
  };

  /** CSV export: corrections filtrées + bloc statistiques et priorités. */
  const handleDownloadCsv = () => {
    if (filteredCorrections.length === 0) {
      toast.info('Aucune correction ne correspond à ces filtres.');
      return;
    }
    const rows = filteredCorrections.map((c) => ({
        surahNumber: c.surahNumber,
        verseNumber: c.verseNumber,
        word: c.word,
        ruleType: c.ruleType,
        ruleDescription: c.ruleDescription,
        correctionExample: c.correctionExample,
        severity: c.severity,
        isResolved: c.isResolved,
        createdAt: c.createdAt,
    }));
    downloadCorrectionsCsv(
      rows,
      buildPriorityFixes(rows),
      {
        userName: s.profile?.fullName ?? undefined,
        qiraat: s.selectedQiraat ? QIRAAT_NAMES[s.selectedQiraat] : undefined,
      },
    );
    setCsvOpen(false);
    toast.success('Export CSV téléchargé.');
  };

  return (
  <div className="min-h-screen bg-background">
    <AppHeader
      fullName={s.profile?.fullName}
      isOnline={s.isOnline}
      isOfflineReady={s.isOfflineReady}
      cacheStats={s.cacheStats}
      formatCacheSize={s.formatCacheSize}
      correctionsCount={s.corrections.length}
      credits={s.credits}
      isLowCredits={s.isLowCredits}
      onFeedbackClick={() => s.setShowFeedbackForm(true)}
      onRecordingsClick={() => s.setCurrentView('recordings')}
      onCorrectionsClick={() => s.setCurrentView('corrections')}
      onRecitationClick={() => s.setCurrentView('recitation')}
      onBoutiqueClick={() => s.setCurrentView('boutique')}
      onIjazaClick={() => s.setCurrentView('ijaza')}
      onSignOut={s.handleSignOut}
      onLogoClick={s.handleLogoClick}
    />

    <main className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <ProgressDashboard data={s.progressData} />
          </Suspense>
          <ProgressInsightsCard
            levels={s.surahLevels}
            recommended={s.recommendedReview}
            onOpenGuidedReview={() => s.setCurrentView('guided-review')}
            onOpenTajweedErrors={() => s.setCurrentView('tajweed-errors')}
            onStartSurah={(surahId) => {
              s.setCurrentSurah(surahId);
              s.setCurrentVerse(1);
              s.setCurrentView('recitation');
            }}
          />
          <PriorityFixesCard
            fixes={s.priorityFixes}
            qiraatLabel={s.selectedQiraat ? QIRAAT_NAMES[s.selectedQiraat] : undefined}
            onOpenSurah={(surahId, verse) => {
              s.setCurrentSurah(surahId);
              s.setCurrentVerse(verse);
              s.setCurrentView('recitation');
            }}
            onOpenAllErrors={() => s.setCurrentView('tajweed-errors')}
            onDownloadPdf={handleDownloadRecapPdf}
            onDownloadCsv={() => setCsvOpen(true)}
          />
          <StreakPanel />
          <RewardsPanel
            certificates={s.certificates.map(c => ({
              id: c.id,
              surahNumber: c.surahNumber,
              certificateType: c.certificateType,
              userName: c.userName,
              qiraat: c.qiraat,
              averageScore: c.averageScore,
              completedAt: c.completedAt,
            }))}
            loading={s.certificatesLoading}
          />
          <GamificationPanel />
          <SpacedRepetitionPanel
            dueReviews={s.dueReviews}
            totalInQueue={s.reviewQueue.length}
            onStartReview={s.handleStartReview}
          />
          <LeaderboardPanel />
          <OfflineCacheManager
            isOnline={s.isOnline}
            isOfflineReady={s.isOfflineReady}
            cacheStats={s.cacheStats}
            formatCacheSize={s.formatCacheSize}
            cacheSurah={s.cacheSurah}
            isSurahCached={s.isSurahCached}
            clearCache={s.clearCache}
          />
          <NotificationSettings onRequestPermission={s.requestPermission} />
        </div>

        <div className="lg:col-span-2">
          <Suspense fallback={<QuranMapSkeleton />}>
            <QuranMap
              surahStatuses={s.surahStatuses.length > 0 ? s.surahStatuses : [
                { id: 1, status: 'not_started', progress: 0 },
                { id: 2, status: 'not_started', progress: 0 },
                { id: 3, status: 'not_started', progress: 0 },
                { id: 4, status: 'not_started', progress: 0 },
              ]}
              onSurahSelect={(surahId) => {
                s.setCurrentSurah(surahId);
                s.setCurrentVerse(1);
                s.setCurrentView('recitation');
              }}
            />
          </Suspense>
        </div>
      </div>
    </main>

    <MultilingualChat />
    <FeedbackForm isOpen={s.showFeedbackForm} onClose={() => s.setShowFeedbackForm(false)} />

    <CsvExportDialog
      open={csvOpen}
      onOpenChange={setCsvOpen}
      availableSurahs={availableSurahs}
      availableSeverities={availableSeverities}
      matchCount={filteredCorrections.length}
      filters={csvFilters}
      onFiltersChange={setCsvFilters}
      onExport={handleDownloadCsv}
    />

    <CertificateModal
      certificate={s.newCertificate ? {
        id: s.newCertificate.id,
        surahNumber: s.newCertificate.surahNumber,
        certificateType: s.newCertificate.certificateType,
        userName: s.newCertificate.userName,
        qiraat: s.newCertificate.qiraat,
        averageScore: s.newCertificate.averageScore,
        completedAt: s.newCertificate.completedAt,
      } : null}
      isOpen={!!s.newCertificate}
      onClose={s.dismissNewCertificate}
    />
  </div>
  );
};
