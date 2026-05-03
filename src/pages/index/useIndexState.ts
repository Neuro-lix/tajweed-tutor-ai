import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
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
import { useCredits } from '@/hooks/useCredits';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslationSettings } from '@/contexts/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchAyah } from '@/lib/quranApi';
import { AnalysisResult, AppView, getGlobalAyahNumber, normalizeRuleType } from './indexHelpers';
import { calculateEnvelopeSimilarityScore } from '@/components/recitation/WaveformOverlay';

/**
 * Centralized state hook for the Index page.
 * Groups all hooks, state, and handlers used by Landing/Dashboard/Recitation views.
 */
export function useIndexState() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    profile,
    progress,
    corrections,
    surahProgress,
    updateProfile,
    addCorrection,
    loading: dataLoading,
  } = useUserProgress();
  const { t } = useLanguage();
  const { showTranslation, currentTranslationId } = useTranslationSettings();

  // ── View / session state ──────────────────────────────────────────
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
  const [analysisStep, setAnalysisStep] = useState<
    'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'generating' | 'done' | 'error'
  >('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [devMode, setDevMode] = useState(() => localStorage.getItem('devMode') === 'true');
  const [logoClickCount, setLogoClickCount] = useState(0);

  const handleLogoClick = () => {
    setLogoClickCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        const pwd = prompt('🔐 Mot de passe développeur :');
        if (pwd === 'tajweed-dev-2026') {
          const newMode = !devMode;
          setDevMode(newMode);
          localStorage.setItem('devMode', String(newMode));
          alert(newMode ? '🛠️ Mode dev ON — Crédits gratuits' : '🔒 Mode dev OFF');
        } else {
          alert('❌ Mot de passe incorrect');
        }
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
  const [pendingEnvelopeScore, setPendingEnvelopeScore] = useState<number | null>(null);
  const [showNoCredits, setShowNoCredits] = useState(false);

  // ── Audio + storage + credits ──────────────────────────────────────
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
  const { credits, hasCredits, isLowCredits, deductCredit, refetch: refetchCredits } = useCredits();
  const sessionTimer = useSessionTimer();

  // ── Verse text state ──────────────────────────────────────────────
  const [currentVerseText, setCurrentVerseText] = useState<string>('');
  const [currentVerseTranslation, setCurrentVerseTranslation] = useState<string | null>(null);
  const [isVerseTextLoading, setIsVerseTextLoading] = useState(false);

  // ── Spaced repetition + gamification ──────────────────────────────
  const { dueReviews, reviewQueue, addToReviewQueue, processReview } = useSpacedRepetition();
  const { recordSession, userLevel } = useGamification();
  const { recordPractice, streakData } = useStreaks();
  const { updateLeaderboardEntry } = useLeaderboard();

  // ── Certificates ──────────────────────────────────────────────────
  const {
    certificates,
    loading: certificatesLoading,
    newCertificate,
    dismissNewCertificate,
  } = useCertificates();

  // ── Offline ───────────────────────────────────────────────────────
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

  // ── Payment redirect notifications ────────────────────────────────
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Paiement réussi ! Merci pour votre confiance.');
    } else if (paymentStatus === 'canceled') {
      toast.info('Paiement annulé.');
    }
  }, [searchParams]);

  // ── Auto-redirect based on auth/profile ───────────────────────────
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

  // ── Verse loading (offline-aware) ─────────────────────────────────
  const loadVerse = useCallback(
    async (surah: number, verse: number, translationId: string) => {
      setIsVerseTextLoading(true);
      try {
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
      } finally {
        setIsVerseTextLoading(false);
      }
    },
    [getCachedVerse, cacheVerse, isOnline],
  );

  useEffect(() => {
    loadVerse(currentSurah, currentVerse, currentTranslationId);
  }, [currentSurah, currentVerse, currentTranslationId, loadVerse]);

  // ── Derived data ──────────────────────────────────────────────────
  const progressData = {
    totalSurahs: 114,
    completedSurahs: surahProgress.filter(s => s.status === 'mastered').length || 0,
    totalVerses: 6236,
    masteredVerses: surahProgress.reduce((acc, s) => acc + s.masteredVerses, 0) || 0,
    reviewNeeded: corrections.length || 0,
    totalHours: progress?.totalHours || 0,
    currentStreak: progress?.currentStreak || 0,
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
    status:
      s.status === 'mastered'
        ? ('completed' as const)
        : s.status === 'in_progress'
          ? ('in_progress' as const)
          : ('not_started' as const),
    progress: s.totalVerses > 0 ? (s.masteredVerses / s.totalVerses) * 100 : 0,
  }));

  // Keep userAudioBlob in sync with the recorder hook
  useEffect(() => {
    if (audioBlob && !isRecording) {
      setUserAudioBlob(audioBlob);
    }
  }, [audioBlob, isRecording]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleStartRecording = async () => {
    if (!devMode && !hasCredits) {
      setShowNoCredits(true);
      return;
    }
    setShowFeedback(false);
    setAiFeedback(null);
    setAnalysisResult(null);
    setShowReport(false);
    setTranscriptionFailed(false);
    sessionTimer.start();
    await startRecording();
  };

  const handleStopRecording = async () => {
    setAnalyzing(true);
    setAnalysisStep('uploading');
    sessionTimer.pause();

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
    setAnalysisStep('transcribing');

    let expectedText = currentVerseText;
    if (!expectedText || expectedText.startsWith('Sourate') || expectedText.startsWith('Verset')) {
      if (!isOnline) {
        setAiFeedback({
          status: 'review',
          message: 'Texte du verset indisponible',
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
      setAnalysisStep('analyzing');
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

      setAnalysisStep('done');

      if (!devMode) {
        await deductCredit();
        refetchCredits();
      }

      const transcriptionImpossible = data?.transcriptionImpossible === true;
      setTranscriptionFailed(transcriptionImpossible);
      const isCorrect = !transcriptionImpossible && data?.isCorrect === true;

      setAnalysisResult(data);

      setAiFeedback({
        status: isCorrect ? 'correct' : 'review',
        message: transcriptionImpossible
          ? 'Transcription échouée'
          : isCorrect
            ? t.excellent
            : t.needsReview,
        details: transcriptionImpossible
          ? `${data.feedback || 'La transcription est vide. Veuillez réenregistrer.'}${data.whisperError ? ` (${data.whisperError})` : ''}`
          : data.feedback || data.encouragement || '',
      });

      await recordSession(isCorrect);
      await recordPractice();

      await updateLeaderboardEntry({
        totalXp: userLevel.experiencePoints,
        currentLevel: userLevel.currentLevel,
        totalVersesMastered: userLevel.totalVersesMastered,
        perfectRecitations: userLevel.perfectRecitations,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
      });

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

      if (user && recording.blob) {
        const referenceAudioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${getGlobalAyahNumber(currentSurah, currentVerse)}.mp3`;
        let envelopeScore: number | null = null;
        try {
          envelopeScore = await calculateEnvelopeSimilarityScore(recording.blob, referenceAudioUrl);
        } catch (e) {
          console.warn('[Recitation] Envelope similarity score unavailable', e);
        }
        setPendingSaveBlob(recording.blob);
        setPendingSaveScore(data.overallScore ?? null);
        setPendingEnvelopeScore(envelopeScore);
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

  const { requestPermission } = useReviewNotifications(dueReviews, handleStartReview);

  const handleStartPractice = () => {
    setCurrentView('recitation');
  };

  const { requestPermission: requestStreakPermission, hasPracticedToday } = useStreakNotifications(
    {
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      lastPracticeDate: streakData.lastPracticeDate ? new Date(streakData.lastPracticeDate) : null,
    },
    handleStartPractice,
  );

  const handleSessionSelect = async (session: 'homme' | 'femme') => {
    setSelectedSession(session);
    if (user) {
      await updateProfile({ sessionType: session === 'homme' ? 'male' : 'female' });
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
      envelopeSimilarityScore: pendingEnvelopeScore ?? undefined,
      qiraat: selectedQiraat ?? 'hafs_asim',
    });
    setPendingSaveBlob(null);
    setPendingSaveScore(null);
    setPendingEnvelopeScore(null);
    setShowSaveDialog(false);
  };

  const handleDiscardRecording = () => {
    setPendingSaveBlob(null);
    setPendingSaveScore(null);
    setPendingEnvelopeScore(null);
    setShowSaveDialog(false);
    setUserAudioBlob(null);
  };

  return {
    // routing / external
    navigate,
    t,
    showTranslation,
    currentTranslationId,
    user,
    authLoading,
    profile,
    progress,
    corrections,
    dataLoading,

    // view state
    currentView,
    setCurrentView,
    selectedSession,
    selectedQiraat,
    showFeedback,
    setShowFeedback,
    showFeedbackForm,
    setShowFeedbackForm,
    currentSurah,
    setCurrentSurah,
    currentVerse,
    setCurrentVerse,
    aiFeedback,
    analyzing,
    analysisStep,
    analysisResult,
    showReport,
    setShowReport,
    devMode,
    handleLogoClick,
    transcriptionFailed,
    userAudioBlob,
    isCurrentVerseCached,
    showSaveDialog,
    setShowSaveDialog,
    pendingEnvelopeScore,
    setPendingEnvelopeScore,
    showNoCredits,
    setShowNoCredits,

    // audio / credits / recordings
    isRecording,
    audioBase64,
    audioMimeType,
    mediaStream,
    recordingStats,
    recordingError,
    credits,
    isLowCredits,
    sessionTimer,

    // verse content
    currentVerseText,
    currentVerseTranslation,
    isVerseTextLoading,

    // gamification / spaced repetition / leaderboard
    dueReviews,
    reviewQueue,
    streakData,
    userLevel,

    // certificates
    certificates,
    certificatesLoading,
    newCertificate,
    dismissNewCertificate,

    // offline
    isOnline,
    isOfflineReady,
    cacheStats,
    formatCacheSize,
    cacheSurah,
    isSurahCached,
    clearCache,

    // derived
    progressData,
    mockCorrections,
    surahStatuses,

    // handlers
    handleStartRecording,
    handleStopRecording,
    handleNavigate,
    handleStartReview,
    handleSessionSelect,
    handleQiraatSelect,
    handleSignOut,
    handleSaveRecording,
    handleDiscardRecording,
    requestPermission,
    requestStreakPermission,
    hasPracticedToday,
  };
}

export type IndexState = ReturnType<typeof useIndexState>;
