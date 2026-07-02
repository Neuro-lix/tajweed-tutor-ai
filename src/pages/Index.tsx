import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GeometricPattern, Ornament, Star8Point } from '@/components/decorative/GeometricPattern';
import { SessionCard } from '@/components/onboarding/SessionCard';
import { QiraatSelector } from '@/components/onboarding/QiraatSelector';
// Heavy components — lazy-loaded for better initial bundle
const ProgressDashboard = lazy(() => import('@/components/dashboard/ProgressDashboard').then(m => ({ default: m.ProgressDashboard })));
const QuranMap = lazy(() => import('@/components/dashboard/QuranMap').then(m => ({ default: m.QuranMap })));
const RecitationInterface = lazy(() => import('@/components/recitation/RecitationInterface').then(m => ({ default: m.RecitationInterface })));
const CorrectionReport = lazy(() => import('@/components/dashboard/CorrectionReport').then(m => ({ default: m.CorrectionReport })));
const PricingSection = lazy(() => import('@/components/payment/PricingSection').then(m => ({ default: m.PricingSection })));
const Boutique = lazy(() => import('@/pages/Boutique').then(m => ({ default: m.Boutique })));
const IjazaPage = lazy(() => import('@/pages/Ijaza').then(m => ({ default: m.IjazaPage })));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const RecitationReport = lazy(() => import('@/components/reports/RecitationReport').then(m => ({ default: m.RecitationReport })));
const RecordingsLibrary = lazy(() => import('@/components/recitation/RecordingsLibrary').then(m => ({ default: m.RecordingsLibrary })));
import { MultilingualChat } from '@/components/chat/MultilingualChat';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { SpacedRepetitionPanel } from '@/components/review/SpacedRepetitionPanel';
import { VerseNavigator } from '@/components/navigation/VerseNavigator';
import { GamificationPanel } from '@/components/gamification/GamificationPanel';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';
import { StreakPanel } from '@/components/streaks/StreakPanel';
import { OfflineCacheManager } from '@/components/offline/OfflineCacheManager';
import { OfflinePracticeMode } from '@/components/offline/OfflinePracticeMode';
import { RewardsPanel } from '@/components/rewards/RewardsPanel';
import { CertificateModal } from '@/components/certificates/CertificateModal';
import { SaveRecordingDialog } from '@/components/recitation/SaveRecordingDialog';
import { AppHeader } from '@/components/header/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DashboardSkeleton,
  QuranMapSkeleton,
  RecitationSkeleton,
  ReportSkeleton,
  PageSkeleton,
} from '@/components/ui/skeleton-card';
import { ListenAndReciteMode } from '@/components/recitation/ListenAndReciteMode';
import { TranslationToggle } from '@/components/recitation/TranslationToggle';
import { SURAHS } from '@/data/quranData';
import { Loader2, LogOut, FileText, Zap } from 'lucide-react';
import { toast } from 'sonner';
import logoImage from '@/logo.png';
import { useIndexState } from './index/useIndexState';
import { renderHeroTitle } from './index/indexHelpers';
import { LandingView } from './index/views/LandingView';
import { DashboardView } from './index/views/DashboardView';
import { RecitationView } from './index/views/RecitationView';
import { GuidedReviewView } from './index/views/GuidedReviewView';
import { TajweedErrorsView } from './index/views/TajweedErrorsView';

const Index = () => {
  const s = useIndexState();
  const { t } = s;

  if (s.authLoading || (s.user && s.dataLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (s.currentView === 'landing') {
    return <LandingView state={s} />;
  }

  // Session Selection
  if (s.currentView === 'session-select') {
    return (
      <div className="min-h-screen bg-background relative">
        <GeometricPattern className="text-primary" opacity={0.03} />

        <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-12">
            <Star8Point size={32} className="mx-auto text-primary mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t.chooseSession}
            </h2>
            <p className="text-muted-foreground">
              {t.sessionAdapted}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
            <SessionCard
              type="homme"
              isSelected={s.selectedSession === 'homme'}
              onClick={() => s.handleSessionSelect('homme')}
            />
            <SessionCard
              type="femme"
              isSelected={s.selectedSession === 'femme'}
              onClick={() => s.handleSessionSelect('femme')}
            />
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="ghost" onClick={() => s.setCurrentView('landing')}>
              {t.backLabel}
            </Button>
            <Button
              variant="hero"
              disabled={!s.selectedSession}
              onClick={() => s.setCurrentView('qiraat-select')}
            >
              {t.continueLabel}
              <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Qiraat Selection
  if (s.currentView === 'qiraat-select') {
    return (
      <div className="min-h-screen bg-background relative">
        <GeometricPattern className="text-primary" opacity={0.03} />

        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <Star8Point size={32} className="mx-auto text-primary mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t.chooseReading}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t.selectQiraatDesc}
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <QiraatSelector
              selectedQiraat={s.selectedQiraat}
              onSelect={s.handleQiraatSelect}
            />
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="ghost" onClick={() => s.setCurrentView('session-select')}>
              {t.backLabel}
            </Button>
            <Button
              variant="hero"
              disabled={!s.selectedQiraat}
              onClick={() => s.setCurrentView('dashboard')}
            >
              {t.startLabel}
              <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (s.currentView === 'dashboard') {
    return <DashboardView state={s} />;
  }

  if (s.currentView === 'recitation') {
    return <RecitationView state={s} />;
  }

  // Corrections
  if (s.currentView === 'corrections') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => s.setCurrentView('dashboard')}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                {t.backToDashboard}
              </Button>
              <Star8Point size={24} className="text-primary" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Suspense fallback={<ReportSkeleton />}>
            <CorrectionReport
              corrections={s.mockCorrections.length > 0 ? s.mockCorrections : []}
              onPrint={() => window.print()}
            />
          </Suspense>
        </main>
      </div>
    );
  }

  // Pricing
  if (s.currentView === 'pricing') {
    return (
      <Suspense fallback={<PageSkeleton label="Chargement des offres" />}>
        <PricingSection onBack={() => s.setCurrentView('dashboard')} />
      </Suspense>
    );
  }

  if (s.currentView === 'boutique') {
    return (
      <Suspense fallback={<PageSkeleton label="Chargement de la boutique" />}>
        <Boutique onBack={() => s.setCurrentView('dashboard')} />
      </Suspense>
    );
  }

  if (s.currentView === 'ijaza') {
    return (
      <Suspense fallback={<PageSkeleton label="Chargement Ijaza" />}>
        <IjazaPage
          onBack={() => s.setCurrentView('dashboard')}
          masteredSurahs={0}
          totalSurahs={114}
          averageScore={0}
        />
      </Suspense>
    );
  }

  if (s.currentView === 'admin') {
    return (
      <Suspense fallback={<PageSkeleton label="Chargement admin" />}>
        <AdminDashboard onBack={() => s.setCurrentView('dashboard')} />
      </Suspense>
    );
  }

  // Recordings Library
  if (s.currentView === 'recordings') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => s.setCurrentView('dashboard')}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                {t.backToDashboard}
              </Button>
              <Star8Point size={24} className="text-primary" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Suspense fallback={<ReportSkeleton />}>
            <RecordingsLibrary />
          </Suspense>
        </main>

        <SaveRecordingDialog
          open={s.showSaveDialog}
          onOpenChange={s.setShowSaveDialog}
          onSave={s.handleSaveRecording}
          onDiscard={s.handleDiscardRecording}
          surahName={SURAHS.find(sur => sur.id === s.currentSurah)?.name}
          verseNumber={s.currentVerse}
        />
      </div>
    );
  }

  return null;
};

export default Index;
