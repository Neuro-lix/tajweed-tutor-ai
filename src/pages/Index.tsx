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

  // Landing Page
  if (s.currentView === 'landing') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <GeometricPattern className="text-primary" opacity={0.04} />

        <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
          {/* Auth buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            {s.user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => s.setCurrentView('dashboard')}>
                  {t.myDashboard}
                </Button>
                <Button variant="outline" size="sm" onClick={s.handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.logout}
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  {t.login}
                </Button>
              </Link>
            )}
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in">
            <div className="flex justify-center mb-8">
              <img
                src={logoImage}
                alt="Tajweed Tutor AI"
                className="h-24 w-24 object-contain cursor-pointer rounded-2xl shadow-lg"
                onClick={s.handleLogoClick}
              />
            </div>
            {s.devMode && (
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs text-amber-600 font-medium">
                  🛠️ {t.devModeActive}
                </div>
                <button onClick={() => s.setCurrentView('admin')} className="text-xs text-muted-foreground underline hover:text-primary transition-colors">
                  ⚙️ {t.openAdminDashboard}
                </button>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {renderHeroTitle(t.heroTitle, t.heroRigor, t.heroKindness)}
            </h1>

            <Ornament className="mx-auto text-primary/40 my-8" />

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t.heroDescription}
            </p>

            <Button
              variant="hero"
              size="xl"
              onClick={() => {
                if (s.user) {
                  if (s.profile?.sessionType && s.profile?.selectedQiraat) {
                    s.setCurrentView('dashboard');
                  } else {
                    s.setCurrentView('session-select');
                  }
                } else {
                  s.navigate('/auth');
                }
              }}
              className="animate-scale-in"
              style={{ animationDelay: '0.3s' }}
            >
              {s.user ? t.continueLearning : t.startLearning}
              <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
                  </svg>
                ),
                title: t.correctedRecitation,
                description: t.correctedRecitationDesc,
              },
              {
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <path d="M12 6v6M9 9h6" />
                  </svg>
                ),
                title: t.tenCanonicalReadings,
                description: t.tenReadingsDesc,
              },
              {
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                ),
                title: t.fullTrackingTitle,
                description: t.fullTrackingDesc,
              },
            ].map((feature, i) => (
              <Card
                key={i}
                variant="elevated"
                className="animate-slide-up"
                style={{ animationDelay: `${0.4 + i * 0.1}s` }}
              >
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricing note */}
          <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <Card
              variant="outline"
              className="inline-block px-8 py-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => s.user ? s.setCurrentView('pricing') : s.navigate('/auth')}
            >
              <p className="text-foreground">
                <span className="text-2xl font-bold text-primary">3€</span>
                <span className="text-muted-foreground"> {t.perHourAnalysis}</span>
              </p>
            </Card>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
            {t.landingDisclaimer}
          </p>
        </div>
      </div>
    );
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

  // Dashboard
  if (s.currentView === 'dashboard') {
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
  }

  // Recitation
  if (s.currentView === 'recitation') {
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
                    s.credits === 0 ? 'bg-destructive/15 text-destructive' : s.isLowCredits ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/15 text-primary'
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
              surahName={SURAHS.find(sur => sur.id === s.currentSurah)?.transliteration || 'Al-Fatiha'}
              surahArabic={SURAHS.find(sur => sur.id === s.currentSurah)?.name || 'الفاتحة'}
              surahNumber={s.currentSurah}
              currentVerse={s.currentVerse}
              totalVerses={SURAHS.find(sur => sur.id === s.currentSurah)?.verses || 7}
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
              onPreviousVerse={() => s.currentVerse > 1 && s.handleNavigate(s.currentSurah, s.currentVerse - 1)}
              onNextVerse={() => {
                const surah = SURAHS.find(sur => sur.id === s.currentSurah);
                if (surah && s.currentVerse < surah.verses) {
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
            referenceAudioUrl={`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${s.currentSurah === 1 ? s.currentVerse : s.currentVerse}.mp3`}
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
            surahName={SURAHS.find(sur => sur.id === s.currentSurah)?.name}
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
