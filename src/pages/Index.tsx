import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GeometricPattern, Ornament, Star8Point } from '@/components/decorative/GeometricPattern';
import { SessionCard } from '@/components/onboarding/SessionCard';
import { QiraatSelector } from '@/components/onboarding/QiraatSelector';
import { ProgressDashboard } from '@/components/dashboard/ProgressDashboard';
import { QuranMap } from '@/components/dashboard/QuranMap';
import { RecitationInterface } from '@/components/recitation/RecitationInterface';
import { CorrectionReport } from '@/components/dashboard/CorrectionReport';
import { PricingSection } from '@/components/payment/PricingSection';
import { Boutique } from '@/pages/Boutique';
import { IjazaPage } from '@/pages/Ijaza';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { MultilingualChat } from '@/components/chat/MultilingualChat';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { SpacedRepetitionPanel } from '@/components/review/SpacedRepetitionPanel';
import { VerseNavigator } from '@/components/navigation/VerseNavigator';
import { GamificationPanel } from '@/components/gamification/GamificationPanel';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';
import { StreakPanel } from '@/components/streaks/StreakPanel';
import { OfflineCacheManager } from '@/components/offline/OfflineCacheManager';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { OfflinePracticeMode } from '@/components/offline/OfflinePracticeMode';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { AnalysisProgress } from '@/components/recitation/AnalysisProgress';
import { AudioComparison } from '@/components/recitation/AudioComparison';
import { RecitationReport } from '@/components/reports/RecitationReport';
import { RewardsPanel } from '@/components/rewards/RewardsPanel';
import { CertificateModal } from '@/components/certificates/CertificateModal';
import { SaveRecordingDialog } from '@/components/recitation/SaveRecordingDialog';
import { RecordingsLibrary } from '@/components/recitation/RecordingsLibrary';
import { AppHeader } from '@/components/header/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { useGamification } from '@/hooks/useGamification';
import { useStreaks } from '@/hooks/useStreaks';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useReviewNotifications } from '@/hooks/useReviewNotifications';
import { useStreakNotifications } from '@/hooks/useStreakNotifications';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useCertificates } from '@/hooks/useCertificates';
import { useRecitationStorage } from '@/hooks/useRecitationStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslationSettings } from '@/contexts/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { SURAHS } from '@/data/quranData';
import { Loader2, LogOut, MessageSquareHeart, Award, Globe, Trophy, Music, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAyah } from '@/lib/quranApi';
import { TranslationToggle } from '@/components/recitation/TranslationToggle';
import logoImage from '@/assets/logo.png';

type AppView = 'landing' | 'session-select' | 'qiraat-select' | 'dashboard' | 'recitation' | 'corrections' | 'pricing' | 'recordings' | 'boutique' | 'ijaza' | 'admin';

interface AnalysisResult {
  isCorrect: boolean;
  overallScore: number;
  feedback: string;
  encouragement?: string;
  priorityFixes?: string[];
  errors?: Array<{
    word: string;
    ruleType: string;
    ruleDescription: string;
    severity: 'minor' | 'major' | 'critical';
    correction: string;
  }>;
  textComparison?: string;
  transcribedText?: string | null;
  expectedText?: string;
  whisperError?: string | null;
  transcriptionImpossible?: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, progress, corrections, surahProgress, updateProfile, addCorrection, loading: dataLoading } = useUserProgress();
  const { t } = useLanguage();
  const { showTranslation, currentTranslationId } = useTranslationSettings();
  
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [selectedSession, setSelectedSession] = useState<'homme' | 'femme' | null>(null);
  const [selectedQiraat, setSelectedQiraat] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [aiFeedback, setAiFeedback] = useState<{
    status: 'correct' | 'review';
    message: string;
    details: string;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'upload' | 'transcription' | 'analysis' | 'complete'>('upload');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [devMode, setDevMode] = useState(() => localStorage.getItem('devMode') === 'true');
  const [logoClickCount, setLogoClickCount] = useState(0);

  const handleLogoClick = () => {
    setLogoClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        const newMode = !devMode;
        setDevMode(newMode);
        localStorage.setItem('devMode', String(newMode));
        alert(newMode ? '🛠️ Mode développeur activé — Tout est gratuit' : '🔒 Mode développeur désactivé');
        return 0;
      }
      return next;
    });
  };
  const [transcriptionFailed, setTranscriptionFailed] = useState(false);
  const [userAudioBlob, setUserAudioBlob] = useState<Blob | null>(null);
  const [isCurrentVerseCached, setIsCurrentVerseCached] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingSaveBlob, setPendingSaveBlob] = useState<Blob | null>(null);
  const [pendingSaveScore, setPendingSaveScore] = useState<number | null>(null);
  
  const {
    isRecording,
    audioBlob,
    audioBase64,
    audioMimeType,
    mediaStream,
    recordingStats,
    startRecording,
    stopRecording,
    error: recordingError,
  } = useAudioRecorder();

  const { saveRecording } = useRecitationStorage();

  const [currentVerseText, setCurrentVerseText] = useState<string>('');
  const [currentVerseTranslation, setCurrentVerseTranslation] = useState<string | null>(null);
  const [isVerseTextLoading, setIsVerseTextLoading] = useState(false);

  const { 
    dueReviews, 
    reviewQueue, 
    addToReviewQueue, 
    processReview 
  } = useSpacedRepetition();

  const { recordSession, userLevel } = useGamification();
  const { recordPractice, streakData } = useStreaks();
  const { updateLeaderboardEntry } = useLeaderboard();
  
  // Certificates
  const { certificates, loading: certificatesLoading, newCertificate, dismissNewCertificate } = useCertificates();
  
  // Offline mode
  const {
    isOnline,
    isOfflineReady,
    cacheStats,
    formatCacheSize,
    cacheSurah,
    isSurahCached,
    clearCache,
    getCachedVerse,
    cacheVerse,
  } = useOfflineMode();

  // Handle payment redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Paiement réussi ! Merci pour votre confiance.');
    } else if (paymentStatus === 'canceled') {
      toast.info('Paiement annulé.');
    }
  }, [searchParams]);

  // Redirect to appropriate view based on auth and profile
  useEffect(() => {
    if (!authLoading && user && !dataLoading) {
      if (profile?.sessionType && profile?.selectedQiraat) {
        setCurrentView('dashboard');
        setSelectedSession(profile.sessionType === 'male' ? 'homme' : 'femme');
        setSelectedQiraat(profile.selectedQiraat);
      } else if (profile?.sessionType) {
        setCurrentView('qiraat-select');
        setSelectedSession(profile.sessionType === 'male' ? 'homme' : 'femme');
      }
    }
  }, [user, authLoading, profile, dataLoading]);

  const loadVerse = useCallback(async (surah: number, verse: number, translationId: string) => {
    setIsVerseTextLoading(true);

    try {
      // 1) If offline, prefer cached immediately
      const cached = await getCachedVerse(surah, verse, translationId);
      if (cached) {
        setCurrentVerseText(cached.text);
        setCurrentVerseTranslation(cached.translation ?? null);
        setIsCurrentVerseCached(true);
      } else {
        setIsCurrentVerseCached(false);
        if (!isOnline) {
          setCurrentVerseText(`Sourate ${surah}, verset ${verse} (non disponible hors-ligne)`);
          setCurrentVerseTranslation(null);
          return;
        }
      }

      // 2) If online, fetch fresh (and cache)
      if (isOnline) {
        const { text, translation } = await fetchAyah(surah, verse, { translationId });
        if (text) {
          setCurrentVerseText(text);
          setCurrentVerseTranslation(translation ?? null);
          await cacheVerse(surah, verse, text, translation, translationId);
          setIsCurrentVerseCached(true);
        }
      }
    } catch (e) {
      console.error('[Verse] Failed to load verse', { surah, verse, e });
      // keep whatever we have
    } finally {
      setIsVerseTextLoading(false);
    }
  }, [getCachedVerse, cacheVerse, isOnline]);

  // Load verse text when verse/translation changes
  useEffect(() => {
    loadVerse(currentSurah, currentVerse, currentTranslationId);
  }, [currentSurah, currentVerse, currentTranslationId, loadVerse]);

  const progressData = {
    totalSurahs: 114,
    completedSurahs: surahProgress.filter(s => s.status === 'mastered').length || 0,
    totalVerses: 6236,
    masteredVerses: surahProgress.reduce((acc, s) => acc + s.masteredVerses, 0) || 0,
    reviewNeeded: corrections.length || 0,
    totalHours: progress?.totalHours || 0,
    currentStreak: progress?.currentStreak || 0,
  };

  // Normalize AI ruleType strings (e.g. "Makhārij", "Idghām") to TAJWEED_RULES keys (e.g. "makharij", "idgham")
  const normalizeRuleType = (ruleType: string): 'madd' | 'ghunna' | 'qalqala' | 'idgham' | 'ikhfa' | 'makharij' | 'sifat' | 'iqlab' | 'izhar' | 'waqf' => {
    const lower = ruleType
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip diacritics
      .replace(/[^a-z]/g, '');        // keep only a-z
    if (lower.includes('makh')) return 'makharij';
    if (lower.includes('sif')) return 'sifat';
    if (lower.includes('madd') || lower.includes('mad')) return 'madd';
    if (lower.includes('idgh') || lower.includes('idgm')) return 'idgham';
    if (lower.includes('ikh')) return 'ikhfa';
    if (lower.includes('iql') || lower.includes('iqlab')) return 'iqlab';
    if (lower.includes('izh') || lower.includes('izhar')) return 'izhar';
    if (lower.includes('waq')) return 'waqf';
    if (lower.includes('ghun') || lower.includes('ghn')) return 'ghunna';
    if (lower.includes('qal')) return 'qalqala';
    return 'madd'; // fallback
  };

  const mockCorrections = corrections.map(c => ({
    id: c.id,
    surah: `Sourate ${c.surahNumber}`,
    verse: c.verseNumber,
    word: c.word,
    wordArabic: c.word,
    rule: normalizeRuleType(c.ruleType),
    description: c.ruleDescription,
    timestamp: new Date(c.createdAt),
  }));

  const surahStatuses = surahProgress.map(s => ({
    id: s.surahNumber,
    status: s.status === 'mastered' ? 'completed' as const : 
            s.status === 'in_progress' ? 'in_progress' as const : 
            'not_started' as const,
    progress: s.totalVerses > 0 ? (s.masteredVerses / s.totalVerses) * 100 : 0,
  }));

  // Keep userAudioBlob in sync reliably (state updates in hook are async)
  useEffect(() => {
    if (audioBlob && !isRecording) {
      setUserAudioBlob(audioBlob);
    }
  }, [audioBlob, isRecording]);

  const handleStartRecording = async () => {
    setShowFeedback(false);
    setAiFeedback(null);
    setAnalysisResult(null);
    setShowReport(false);
    setTranscriptionFailed(false);
    await startRecording();
  };

  const handleStopRecording = async () => {
    setAnalyzing(true);
    setAnalysisStep('upload');

    const recording = await stopRecording();

    if (!recording) {
      console.error('No audio recorded');
      setAiFeedback({
        status: 'review',
        message: "Erreur d'enregistrement",
        details: "Aucun audio n'a été capturé. Vérifie les permissions du microphone.",
      });
      setShowFeedback(true);
      setAnalyzing(false);
      return;
    }

    const recordedAudioBase64 = recording.base64;
    const recordedAudioMimeType = recording.mimeType;

    console.log('[Recitation] Audio base64 length:', recordedAudioBase64.length, 'mime:', recordedAudioMimeType);
    setAnalysisStep('transcription');

    // Ensure we have a real expectedText (not placeholder)
    let expectedText = currentVerseText;
    if (!expectedText || expectedText.startsWith('Sourate') || expectedText.startsWith('Verset')) {
      if (!isOnline) {
        setAiFeedback({
          status: 'review',
          message: "Texte du verset indisponible",
          details: "Ce verset n'est pas en cache hors-ligne. Reconnecte-toi pour lancer l'analyse.",
        });
        setShowFeedback(true);
        setAnalyzing(false);
        return;
      }

      try {
        const fetched = await fetchAyah(currentSurah, currentVerse, { translationId: currentTranslationId });
        expectedText = fetched.text;
        if (expectedText) {
          setCurrentVerseText(expectedText);
          setCurrentVerseTranslation(fetched.translation ?? null);
          await cacheVerse(currentSurah, currentVerse, expectedText, fetched.translation, currentTranslationId);
        }
      } catch (e) {
        console.error('[Recitation] Failed to fetch expectedText before analysis', e);
      }
    }

    try {
      setAnalysisStep('analysis');

      const { data, error } = await supabase.functions.invoke('analyze-recitation', {
        body: {
          audioBase64: recordedAudioBase64,
          audioMimeType: recordedAudioMimeType,
          surahNumber: currentSurah,
          verseNumber: currentVerse,
          expectedText,
          qiraat: selectedQiraat || 'hafs_asim',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));

      setAnalysisStep('complete');

      const transcriptionImpossible = data?.transcriptionImpossible === true;
      setTranscriptionFailed(transcriptionImpossible);
      const isCorrect = !transcriptionImpossible && data?.isCorrect === true;

      // Store full analysis result
      setAnalysisResult(data);

      // Don't open the report automatically — user clicks "Voir le rapport"
      // setShowReport(true);  ← removed to not block UX

      setAiFeedback({
        status: isCorrect ? 'correct' : 'review',
        message: transcriptionImpossible ? 'Transcription échouée' : isCorrect ? t.excellent : t.needsReview,
        details: transcriptionImpossible
          ? `${data.feedback || "La transcription est vide. Veuillez réenregistrer."}${data.whisperError ? ` (${data.whisperError})` : ''}`
          : (data.feedback || data.encouragement || ''),
      });

      // Record session for gamification and streaks
      await recordSession(isCorrect);
      await recordPractice();

      // Update leaderboard
      await updateLeaderboardEntry({
        totalXp: userLevel.experiencePoints,
        currentLevel: userLevel.currentLevel,
        totalVersesMastered: userLevel.totalVersesMastered,
        perfectRecitations: userLevel.perfectRecitations,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
      });

      // Add to spaced repetition if errors found
      if (data.errors && data.errors.length > 0) {
        await addToReviewQueue(currentSurah, currentVerse);

        for (const err of data.errors) {
          await addCorrection({
            surahNumber: currentSurah,
            verseNumber: currentVerse,
            word: err.word,
            ruleType: normalizeRuleType(err.ruleType),
            ruleDescription: err.ruleDescription,
          });
        }
      }

      setShowFeedback(true);

      // Prompt user to save recording (if logged in)
      if (user && audioBlob) {
        setPendingSaveBlob(audioBlob);
        setPendingSaveScore(data.overallScore ?? null);
        setShowSaveDialog(true);
      }
    } catch (error) {
      console.error('Error analyzing recitation:', error);
      setAiFeedback({
        status: 'review',
        message: "Erreur d'analyse",
        details: "Une erreur s'est produite. Réessaye.",
      });
      setShowFeedback(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNavigate = async (surah: number, verse: number) => {
    setCurrentSurah(surah);
    setCurrentVerse(verse);
    setShowFeedback(false);
    setAiFeedback(null);
    setAnalysisResult(null);
    setShowReport(false);
    setTranscriptionFailed(false);
    setUserAudioBlob(null);

    await loadVerse(surah, verse, currentTranslationId);
  };


  const handleStartReview = (surahNumber: number, verseNumber: number) => {
    setCurrentSurah(surahNumber);
    setCurrentVerse(verseNumber);
    setCurrentView('recitation');
  };

  const { requestPermission } = useReviewNotifications(
    dueReviews,
    handleStartReview
  );

  // Streak notifications for daily practice reminders
  const handleStartPractice = () => {
    setCurrentView('recitation');
  };

  const { 
    requestPermission: requestStreakPermission,
    hasPracticedToday 
  } = useStreakNotifications(
    {
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      lastPracticeDate: streakData.lastPracticeDate ? new Date(streakData.lastPracticeDate) : null,
    },
    handleStartPractice
  );

  const handleSessionSelect = async (session: 'homme' | 'femme') => {
    setSelectedSession(session);
    if (user) {
      await updateProfile({ 
        sessionType: session === 'homme' ? 'male' : 'female' 
      });
    }
  };

  const handleQiraatSelect = async (qiraat: string) => {
    setSelectedQiraat(qiraat);
    if (user) {
      await updateProfile({ selectedQiraat: qiraat });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentView('landing');
    setSelectedSession(null);
    setSelectedQiraat(null);
  };

  const handleSaveRecording = async () => {
    if (!pendingSaveBlob) return;
    await saveRecording({
      audioBlob: pendingSaveBlob,
      surahNumber: currentSurah,
      verseNumber: currentVerse,
      durationSeconds: recordingStats.durationMs ? recordingStats.durationMs / 1000 : undefined,
      analysisScore: pendingSaveScore ?? undefined,
      qiraat: selectedQiraat ?? 'hafs_asim',
    });
    setPendingSaveBlob(null);
    setPendingSaveScore(null);
    setShowSaveDialog(false);
  };

  const handleDiscardRecording = () => {
    setPendingSaveBlob(null);
    setPendingSaveScore(null);
    setShowSaveDialog(false);
    // If user chooses not to keep, clear local audio to avoid retaining data
    setUserAudioBlob(null);
  };

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Landing Page
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <GeometricPattern className="text-primary" opacity={0.04} />
        
        <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
          {/* Auth buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setCurrentView('dashboard')}>
                  Mon tableau de bord
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Connexion
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
                className="h-20 w-20 object-contain cursor-pointer rounded-2xl bg-white p-1 shadow-sm"
                onClick={handleLogoClick}
              />
            </div>
            {devMode && (
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs text-amber-600 font-medium">
                  🛠️ Mode développeur actif
                </div>
                <button onClick={() => setCurrentView('admin')} className="text-xs text-muted-foreground underline hover:text-primary transition-colors">
                  ⚙️ Ouvrir le dashboard admin
                </button>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Apprends le Coran avec{' '}
              <span className="text-gradient-gold">rigueur</span>{' '}
              et{' '}
              <span className="text-primary">bienveillance</span>
            </h1>
            
            <Ornament className="mx-auto text-primary/40 my-8" />
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Une assistance IA disponible 24/7 pour ta récitation. 
              Correction précise du tajwīd, suivi de progression, 
              encouragement sans compromis sur la qualité.
            </p>

            <Button 
              variant="hero" 
              size="xl"
              onClick={() => {
                if (user) {
                  if (profile?.sessionType && profile?.selectedQiraat) {
                    setCurrentView('dashboard');
                  } else {
                    setCurrentView('session-select');
                  }
                } else {
                  navigate('/auth');
                }
              }}
              className="animate-scale-in"
              style={{ animationDelay: '0.3s' }}
            >
              {user ? 'Continuer mon apprentissage' : 'Commencer mon apprentissage'}
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
                title: 'Récitation corrigée',
                description: 'Analyse précise des makharij, sifat et règles de tajwīd selon ta lecture choisie',
              },
              {
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <path d="M12 6v6M9 9h6" />
                  </svg>
                ),
                title: '10 lectures canoniques',
                description: 'Ḥafṣ, Warsh, Qālūn et les 7 autres qirā\'āt authentiques',
              },
              {
                icon: (
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                ),
                title: 'Suivi complet',
                description: 'Progression détaillée, rapport de corrections imprimable, alertes intelligentes',
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
              onClick={() => user ? setCurrentView('pricing') : navigate('/auth')}
            >
              <p className="text-foreground">
                <span className="text-2xl font-bold text-primary">3€</span>
                <span className="text-muted-foreground"> / heure d'analyse IA</span>
              </p>
            </Card>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
            Outil d'apprentissage et d'assistance à la récitation. 
            Ijaza disponible avec un professeur diplômé d'Al-Azhar.
          </p>
        </div>
      </div>
    );
  }

  // Session Selection
  if (currentView === 'session-select') {
    return (
      <div className="min-h-screen bg-background relative">
        <GeometricPattern className="text-primary" opacity={0.03} />
        
        <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-12">
            <Star8Point size={32} className="mx-auto text-primary mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choisis ta session
            </h2>
            <p className="text-muted-foreground">
              Les sessions sont adaptées pour une expérience respectueuse
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
            <SessionCard
              type="homme"
              isSelected={selectedSession === 'homme'}
              onClick={() => handleSessionSelect('homme')}
            />
            <SessionCard
              type="femme"
              isSelected={selectedSession === 'femme'}
              onClick={() => handleSessionSelect('femme')}
            />
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="ghost" onClick={() => setCurrentView('landing')}>
              Retour
            </Button>
            <Button 
              variant="hero" 
              disabled={!selectedSession}
              onClick={() => setCurrentView('qiraat-select')}
            >
              Continuer
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
  if (currentView === 'qiraat-select') {
    return (
      <div className="min-h-screen bg-background relative">
        <GeometricPattern className="text-primary" opacity={0.03} />
        
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <Star8Point size={32} className="mx-auto text-primary mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choisis ta lecture
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Sélectionne une qirā'ah. Les règles de tajwīd seront strictement 
              appliquées selon la lecture choisie.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <QiraatSelector
              selectedQiraat={selectedQiraat}
              onSelect={handleQiraatSelect}
            />
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="ghost" onClick={() => setCurrentView('session-select')}>
              Retour
            </Button>
            <Button 
              variant="hero" 
              disabled={!selectedQiraat}
              onClick={() => setCurrentView('dashboard')}
            >
              Commencer
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
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <AppHeader
          fullName={profile?.fullName}
          isOnline={isOnline}
          isOfflineReady={isOfflineReady}
          cacheStats={cacheStats}
          formatCacheSize={formatCacheSize}
          correctionsCount={corrections.length}
          onFeedbackClick={() => setShowFeedbackForm(true)}
          onRecordingsClick={() => setCurrentView('recordings')}
          onCorrectionsClick={() => setCurrentView('corrections')}
          onRecitationClick={() => setCurrentView('recitation')}
          onBoutiqueClick={() => setCurrentView('boutique')}
          onIjazaClick={() => setCurrentView('ijaza')}
          onSignOut={handleSignOut}
        />

        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Progress sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <ProgressDashboard data={progressData} />
              <StreakPanel />
              <RewardsPanel 
                certificates={certificates.map(c => ({
                  id: c.id,
                  surahNumber: c.surahNumber,
                  certificateType: c.certificateType,
                  userName: c.userName,
                  qiraat: c.qiraat,
                  averageScore: c.averageScore,
                  completedAt: c.completedAt,
                }))}
                loading={certificatesLoading}
              />
              <GamificationPanel />
              <SpacedRepetitionPanel
                dueReviews={dueReviews}
                totalInQueue={reviewQueue.length}
                onStartReview={handleStartReview}
              />
              <LeaderboardPanel />
              <OfflineCacheManager
                isOnline={isOnline}
                isOfflineReady={isOfflineReady}
                cacheStats={cacheStats}
                formatCacheSize={formatCacheSize}
                cacheSurah={cacheSurah}
                isSurahCached={isSurahCached}
                clearCache={clearCache}
              />
              <NotificationSettings onRequestPermission={requestPermission} />
            </div>

            {/* Quran map */}
            <div className="lg:col-span-2">
              <QuranMap 
                surahStatuses={surahStatuses.length > 0 ? surahStatuses : [
                  { id: 1, status: 'not_started', progress: 0 },
                  { id: 2, status: 'not_started', progress: 0 },
                  { id: 3, status: 'not_started', progress: 0 },
                  { id: 4, status: 'not_started', progress: 0 },
                ]}
                onSurahSelect={(surahId) => {
                  setCurrentSurah(surahId);
                  setCurrentVerse(1);
                  setCurrentView('recitation');
                }}
              />
            </div>
          </div>
        </main>
        
        {/* Chat and Feedback */}
        <MultilingualChat />
        <FeedbackForm isOpen={showFeedbackForm} onClose={() => setShowFeedbackForm(false)} />
        
        {/* Certificate Modal */}
        <CertificateModal
          certificate={newCertificate ? {
            id: newCertificate.id,
            surahNumber: newCertificate.surahNumber,
            certificateType: newCertificate.certificateType,
            userName: newCertificate.userName,
            qiraat: newCertificate.qiraat,
            averageScore: newCertificate.averageScore,
            completedAt: newCertificate.completedAt,
          } : null}
          isOpen={!!newCertificate}
          onClose={dismissNewCertificate}
        />
      </div>
    );
  }

  // Recitation
  if (currentView === 'recitation') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Retour
              </Button>
              <div className="flex items-center gap-3">
                <Star8Point size={24} className="text-primary" />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
          {/* Verse Navigator */}
          <VerseNavigator
            currentSurah={currentSurah}
            currentVerse={currentVerse}
            onNavigate={handleNavigate}
          />

          {/* Translation toggle */}
          <TranslationToggle />

          <RecitationInterface
            surahName={SURAHS.find(s => s.id === currentSurah)?.transliteration || 'Al-Fatiha'}
            surahArabic={SURAHS.find(s => s.id === currentSurah)?.name || 'الفاتحة'}
            surahNumber={currentSurah}
            currentVerse={currentVerse}
            totalVerses={SURAHS.find(s => s.id === currentSurah)?.verses || 7}
            verseText={currentVerseText || `Sourate ${currentSurah}, verset ${currentVerse}`}
            verseTranslation={currentVerseTranslation}
            showTranslation={showTranslation}
            isRecording={isRecording}
            isAnalyzing={analyzing}
            analysisStep={analysisStep === 'upload' ? 'uploading' : 
                         analysisStep === 'transcription' ? 'transcribing' : 
                         analysisStep === 'analysis' ? 'analyzing' : 
                         analysisStep === 'complete' ? 'done' : 'idle'}
            transcriptionFailed={transcriptionFailed}
            userAudioBlob={userAudioBlob}
            mediaStream={mediaStream}
            audioDebugStats={{
              mimeType: audioMimeType,
              chunks: recordingStats.chunks,
              totalBytes: recordingStats.totalBytes,
              blobSize: recordingStats.blobSize,
              durationMs: recordingStats.durationMs,
              base64Length: recordingStats.base64Length,
              trackLabel: recordingStats.trackLabel,
              trackSettings: recordingStats.trackSettings,
              error: recordingError,
            }}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onPreviousVerse={() => currentVerse > 1 && handleNavigate(currentSurah, currentVerse - 1)}
            onNextVerse={() => {
              const surah = SURAHS.find(s => s.id === currentSurah);
              if (surah && currentVerse < surah.verses) {
                handleNavigate(currentSurah, currentVerse + 1);
              }
            }}
            recordingError={recordingError}
            feedback={showFeedback && aiFeedback ? aiFeedback : undefined}
          />

          {/* Offline Practice Mode */}
          <OfflinePracticeMode
            isOnline={isOnline}
            cachedVerseCount={cacheStats.verses}
            currentSurah={currentSurah}
            currentVerse={currentVerse}
            isVerseCached={isCurrentVerseCached}
            onStartPractice={() => {
              // Practice without analysis in offline mode
              toast.info('Mode pratique sans analyse IA');
            }}
            onListenReference={() => {
              // Scroll to reference recitations
              const element = document.querySelector('[data-reference-recitations]');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Recitation Report */}
          {showFeedback && analysisResult && (
            <Card>
              <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Score :</span>
                    <span className="font-semibold text-foreground">
                      {typeof analysisResult.overallScore === 'number' ? analysisResult.overallScore : Number(analysisResult.overallScore ?? 0)}
                      /100
                    </span>
                    {Array.isArray(analysisResult.errors) && analysisResult.errors.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        • {analysisResult.errors.length} erreur(s)
                      </span>
                    )}
                  </div>
                  {analysisResult.transcriptionImpossible && (
                    <p className="text-sm text-destructive">
                      Transcription impossible{analysisResult.whisperError ? ` : ${analysisResult.whisperError}` : ''}.
                    </p>
                  )}
                  {!analysisResult.transcriptionImpossible && (!analysisResult.errors || analysisResult.errors.length === 0) && !analysisResult.isCorrect && (
                    <p className="text-sm text-muted-foreground">
                      Aucun détail d’erreur n’a été renvoyé — clique sur « Voir le rapport » puis réessaie.
                    </p>
                  )}
                </div>
                <Button variant="outline" onClick={() => setShowReport(true)} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Voir le rapport
                </Button>
              </CardContent>
            </Card>
          )}

          <Dialog open={showReport} onOpenChange={setShowReport}>
            <DialogContent className="w-[95vw] max-w-4xl">
              <ScrollArea className="max-h-[75vh] pr-4">
                {analysisResult && (
                  <RecitationReport
                    surahNumber={currentSurah}
                    verseNumber={currentVerse}
                    score={analysisResult.overallScore || 0}
                    isCorrect={analysisResult.isCorrect || false}
                    feedback={analysisResult.feedback || ''}
                    priorityFixes={analysisResult.priorityFixes || []}
                    errors={analysisResult.errors || []}
                    transcribedText={analysisResult.transcribedText}
                    expectedText={analysisResult.expectedText || currentVerseText || `Sourate ${currentSurah}, verset ${currentVerse}`}
                    textComparison={analysisResult.textComparison}
                  />
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Save Recording Dialog */}
          <SaveRecordingDialog
            open={showSaveDialog}
            onOpenChange={setShowSaveDialog}
            onSave={handleSaveRecording}
            onDiscard={handleDiscardRecording}
            surahName={SURAHS.find((s) => s.id === currentSurah)?.name}
            verseNumber={currentVerse}
          />
        </main>
      </div>
    );
  }

  // Corrections
  if (currentView === 'corrections') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Retour au tableau de bord
              </Button>
              <Star8Point size={24} className="text-primary" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <CorrectionReport
            corrections={mockCorrections.length > 0 ? mockCorrections : []}
            onPrint={() => window.print()}
          />
        </main>
      </div>
    );
  }

  // Pricing
  if (currentView === 'pricing') {
    return <PricingSection onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'boutique') {
    return <Boutique onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'ijaza') {
    return <IjazaPage 
      onBack={() => setCurrentView('dashboard')}
      masteredSurahs={0}
      totalSurahs={114}
      averageScore={0}
    />;
  }

  if (currentView === 'admin') {
    return <AdminDashboard onBack={() => setCurrentView('dashboard')} />;
  }

  // Recordings Library
  if (currentView === 'recordings') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Retour au tableau de bord
              </Button>
              <Star8Point size={24} className="text-primary" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <RecordingsLibrary />
        </main>

        {/* Save Recording Dialog */}
        <SaveRecordingDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          onSave={handleSaveRecording}
          onDiscard={handleDiscardRecording}
          surahName={SURAHS.find((s) => s.id === currentSurah)?.name}
          verseNumber={currentVerse}
        />
      </div>
    );
  }

  return null;
};

export default Index;
