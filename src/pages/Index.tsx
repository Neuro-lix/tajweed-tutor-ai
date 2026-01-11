import React, { useState, useEffect } from 'react';
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
import { MultilingualChat } from '@/components/chat/MultilingualChat';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { SpacedRepetitionPanel } from '@/components/review/SpacedRepetitionPanel';
import { VerseNavigator } from '@/components/navigation/VerseNavigator';
import { GamificationPanel } from '@/components/gamification/GamificationPanel';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';
import { StreakPanel } from '@/components/streaks/StreakPanel';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { useGamification } from '@/hooks/useGamification';
import { useStreaks } from '@/hooks/useStreaks';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useReviewNotifications } from '@/hooks/useReviewNotifications';
import { useStreakNotifications } from '@/hooks/useStreakNotifications';
import { supabase } from '@/integrations/supabase/client';
import { SURAHS } from '@/data/quranData';
import { Loader2, LogOut, MessageSquareHeart } from 'lucide-react';
import { toast } from 'sonner';

type AppView = 'landing' | 'session-select' | 'qiraat-select' | 'dashboard' | 'recitation' | 'corrections' | 'pricing';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, progress, corrections, surahProgress, updateProfile, addCorrection, loading: dataLoading } = useUserProgress();
  
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
  
  const { 
    isRecording, 
    audioBase64, 
    startRecording, 
    stopRecording, 
    error: recordingError 
  } = useAudioRecorder();

  const { 
    dueReviews, 
    reviewQueue, 
    addToReviewQueue, 
    processReview 
  } = useSpacedRepetition();

  const { recordSession, userLevel } = useGamification();
  const { recordPractice, streakData } = useStreaks();
  const { updateLeaderboardEntry } = useLeaderboard();

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
    rule: c.ruleType as 'madd' | 'ghunna' | 'qalqala' | 'idgham' | 'ikhfa',
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

  const handleStartRecording = async () => {
    setShowFeedback(false);
    setAiFeedback(null);
    await startRecording();
  };

  const handleStopRecording = async () => {
    await stopRecording();
    setAnalyzing(true);

    // Wait a bit for audioBase64 to be set
    await new Promise(resolve => setTimeout(resolve, 200));

    const surahData = SURAHS.find(s => s.id === currentSurah);
    const expectedText = getExpectedVerseText(currentSurah, currentVerse);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-recitation', {
        body: {
          audioBase64,
          surahNumber: currentSurah,
          verseNumber: currentVerse,
          expectedText,
          qiraat: selectedQiraat || 'hafs_asim',
        },
      });

      if (error) throw error;

      const isCorrect = data.isCorrect && data.overallScore >= 80;
      
      setAiFeedback({
        status: isCorrect ? 'correct' : 'review',
        message: isCorrect ? 'Récitation correcte !' : 'À revoir',
        details: data.feedback || data.encouragement,
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
            ruleType: err.ruleType,
            ruleDescription: err.ruleDescription,
          });
        }
      }

      setShowFeedback(true);
    } catch (error) {
      console.error('Error analyzing recitation:', error);
      setAiFeedback({
        status: 'review',
        message: 'Erreur d\'analyse',
        details: 'Une erreur s\'est produite. Réessaye.',
      });
      setShowFeedback(true);
    } finally {
      setAnalyzing(false);
    }
  };

  // Mock verse text - in real app, fetch from Quran API
  const getExpectedVerseText = (surah: number, verse: number) => {
    const verses: Record<string, string> = {
      '1:1': 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      '1:2': 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      '1:3': 'الرَّحْمَٰنِ الرَّحِيمِ',
      '1:4': 'مَالِكِ يَوْمِ الدِّينِ',
      '1:5': 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
      '1:6': 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
      '1:7': 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    };
    return verses[`${surah}:${verse}`] || `Verset ${verse} de la sourate ${surah}`;
  };

  const handleNavigate = (surah: number, verse: number) => {
    setCurrentSurah(surah);
    setCurrentVerse(verse);
    setShowFeedback(false);
    setAiFeedback(null);
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
              <Star8Point size={48} className="text-primary" />
            </div>
            
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
                <span className="text-muted-foreground"> / heure</span>
                <span className="mx-4 text-border">|</span>
                <span className="text-muted-foreground">Abonnement illimité à 29€/mois</span>
              </p>
            </Card>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
            Outil d'apprentissage et d'assistance à la récitation. 
            Complément au professeur humain — ne délivre pas d'ijazah.
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
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star8Point size={24} className="text-primary" />
                <span className="font-semibold text-lg text-foreground">Quran Learn</span>
                {profile?.fullName && (
                  <span className="text-sm text-muted-foreground">
                    — {profile.fullName}
                  </span>
                )}
              </div>
              <nav className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowFeedbackForm(true)}
                >
                  <MessageSquareHeart className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentView('corrections')}
                >
                  Corrections ({corrections.length})
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setCurrentView('recitation')}
                >
                  Réciter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Progress sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <ProgressDashboard data={progressData} />
              <StreakPanel />
              <GamificationPanel />
              <SpacedRepetitionPanel
                dueReviews={dueReviews}
                totalInQueue={reviewQueue.length}
                onStartReview={handleStartReview}
              />
              <LeaderboardPanel />
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

          <RecitationInterface
            surahName={SURAHS.find(s => s.id === currentSurah)?.transliteration || 'Al-Fatiha'}
            surahArabic={SURAHS.find(s => s.id === currentSurah)?.name || 'الفاتحة'}
            surahNumber={currentSurah}
            currentVerse={currentVerse}
            totalVerses={SURAHS.find(s => s.id === currentSurah)?.verses || 7}
            verseText={getExpectedVerseText(currentSurah, currentVerse)}
            isRecording={isRecording}
            isAnalyzing={analyzing}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            recordingError={recordingError}
            feedback={showFeedback && aiFeedback ? aiFeedback : undefined}
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

  return null;
};

export default Index;
