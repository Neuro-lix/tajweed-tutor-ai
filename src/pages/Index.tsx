import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GeometricPattern, Ornament, Star8Point } from '@/components/decorative/GeometricPattern';
import { SessionCard } from '@/components/onboarding/SessionCard';
import { QiraatSelector } from '@/components/onboarding/QiraatSelector';
import { ProgressDashboard } from '@/components/dashboard/ProgressDashboard';
import { QuranMap } from '@/components/dashboard/QuranMap';
import { RecitationInterface } from '@/components/recitation/RecitationInterface';
import { CorrectionReport } from '@/components/dashboard/CorrectionReport';
import { Card, CardContent } from '@/components/ui/card';

type AppView = 'landing' | 'session-select' | 'qiraat-select' | 'dashboard' | 'recitation' | 'corrections';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [selectedSession, setSelectedSession] = useState<'homme' | 'femme' | null>(null);
  const [selectedQiraat, setSelectedQiraat] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Mock data
  const progressData = {
    totalSurahs: 114,
    completedSurahs: 12,
    totalVerses: 6236,
    masteredVerses: 487,
    reviewNeeded: 23,
    totalHours: 42,
    currentStreak: 7,
  };

  const mockCorrections = [
    {
      id: '1',
      surah: 'Al-Fatiha',
      verse: 6,
      word: 'sirāṭ',
      wordArabic: 'صِرَاطَ',
      rule: 'madd' as const,
      description: 'La durée du madd sur le alif n\'atteint pas 2 temps selon Ḥafṣ',
      timestamp: new Date(),
    },
    {
      id: '2',
      surah: 'Al-Fatiha',
      verse: 7,
      word: 'ḍāllīn',
      wordArabic: 'الضَّالِّينَ',
      rule: 'madd' as const,
      description: 'Le madd lāzim doit être prolongé de 6 temps minimum',
      timestamp: new Date(),
    },
    {
      id: '3',
      surah: 'Al-Baqarah',
      verse: 3,
      word: 'yunfiqūn',
      wordArabic: 'يُنفِقُونَ',
      rule: 'ikhfa' as const,
      description: 'L\'ikhfā\' du nūn sākin avant le fā\' n\'est pas correctement appliqué',
      timestamp: new Date(),
    },
  ];

  const surahStatuses = [
    { id: 1, status: 'completed' as const, progress: 100 },
    { id: 2, status: 'in_progress' as const, progress: 45 },
    { id: 3, status: 'needs_review' as const, progress: 80 },
    { id: 4, status: 'not_started' as const, progress: 0 },
  ];

  const handleStartRecording = () => {
    setIsRecording(true);
    setShowFeedback(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Simulate AI feedback after recording
    setTimeout(() => setShowFeedback(true), 500);
  };

  // Landing Page
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <GeometricPattern className="text-primary" opacity={0.04} />
        
        <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
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
              onClick={() => setCurrentView('session-select')}
              className="animate-scale-in"
              style={{ animationDelay: '0.3s' }}
            >
              Commencer mon apprentissage
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
            <Card variant="outline" className="inline-block px-8 py-4">
              <p className="text-foreground">
                <span className="text-2xl font-bold text-primary">3€</span>
                <span className="text-muted-foreground"> / heure</span>
                <span className="mx-4 text-border">|</span>
                <span className="text-muted-foreground">Abonnement illimité disponible</span>
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
              onClick={() => setSelectedSession('homme')}
            />
            <SessionCard
              type="femme"
              isSelected={selectedSession === 'femme'}
              onClick={() => setSelectedSession('femme')}
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
              onSelect={setSelectedQiraat}
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
              </div>
              <nav className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentView('corrections')}
                >
                  Corrections
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setCurrentView('recitation')}
                >
                  Réciter
                </Button>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Progress sidebar */}
            <div className="lg:col-span-1">
              <ProgressDashboard data={progressData} />
            </div>

            {/* Quran map */}
            <div className="lg:col-span-2">
              <QuranMap 
                surahStatuses={surahStatuses}
                onSurahSelect={() => setCurrentView('recitation')}
              />
            </div>
          </div>
        </main>
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

        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <RecitationInterface
            surahName="Al-Fatiha"
            surahArabic="الفاتحة"
            currentVerse={6}
            totalVerses={7}
            verseText="اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ"
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            feedback={showFeedback ? {
              status: 'review',
              message: 'Le verset nécessite une révision.',
              details: 'Le madd sur "الصِّرَاطَ" n\'a pas atteint la durée requise selon la lecture de Ḥafṣ. Reprends calmement, tu progresses.',
            } : undefined}
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
            corrections={mockCorrections}
            onPrint={() => window.print()}
          />
        </main>
      </div>
    );
  }

  return null;
};

export default Index;
