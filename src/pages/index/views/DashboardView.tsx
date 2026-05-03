import { lazy, Suspense } from 'react';
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
import { DashboardSkeleton, QuranMapSkeleton } from '@/components/ui/skeleton-card';
import type { IndexState } from '../useIndexState';

const ProgressDashboard = lazy(() => import('@/components/dashboard/ProgressDashboard').then(m => ({ default: m.ProgressDashboard })));
const QuranMap = lazy(() => import('@/components/dashboard/QuranMap').then(m => ({ default: m.QuranMap })));

interface DashboardViewProps {
  state: IndexState;
}

export const DashboardView = ({ state: s }: DashboardViewProps) => (
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
    />

    <main className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <ProgressDashboard data={s.progressData} />
          </Suspense>
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
