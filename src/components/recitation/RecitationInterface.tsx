import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReferenceRecitations } from './ReferenceRecitations';
import { Loader2 } from 'lucide-react';

interface RecitationInterfaceProps {
  surahName: string;
  surahArabic: string;
  surahNumber: number;
  currentVerse: number;
  totalVerses: number;
  verseText: string;
  isRecording: boolean;
  isAnalyzing?: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordingError?: string | null;
  feedback?: {
    status: 'correct' | 'success' | 'review';
    message: string;
    details?: string;
  };
}

export const RecitationInterface: React.FC<RecitationInterfaceProps> = ({
  surahName,
  surahArabic,
  surahNumber,
  currentVerse,
  totalVerses,
  verseText,
  isRecording,
  isAnalyzing,
  onStartRecording,
  onStopRecording,
  recordingError,
  feedback,
}) => {
  return (
    <div className="space-y-6">
      {/* Surah header */}
      <div className="text-center">
        <h2 className="font-arabic text-3xl md:text-4xl text-foreground mb-2" dir="rtl">
          {surahArabic}
        </h2>
        <p className="text-lg text-muted-foreground">{surahName}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Verset {currentVerse} sur {totalVerses}
        </p>
      </div>

      {/* Verse display */}
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <CardContent className="py-12 px-6 md:px-12">
          <p 
            className="font-arabic text-2xl md:text-3xl lg:text-4xl text-center leading-loose text-foreground"
            dir="rtl"
          >
            {verseText}
          </p>
          <div className="flex justify-center mt-6">
            <Badge variant="outline" className="text-base px-4 py-1">
              ﴿{currentVerse}﴾
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Reference recitations */}
      <ReferenceRecitations surahNumber={surahNumber} verseNumber={currentVerse} />

      {/* Recording error */}
      {recordingError && (
        <div className="text-center text-destructive text-sm">
          {recordingError}
        </div>
      )}

      {/* Recording controls */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isAnalyzing}
          className={`
            w-24 h-24 rounded-full flex items-center justify-center
            transition-all duration-300 shadow-card
            ${isAnalyzing 
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : isRecording 
                ? 'bg-destructive text-destructive-foreground animate-pulse scale-110' 
                : 'bg-primary text-primary-foreground hover:scale-105 hover:shadow-glow'
            }
          `}
        >
          {isAnalyzing ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : isRecording ? (
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="currentColor" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </button>
        <p className="text-muted-foreground">
          {isAnalyzing 
            ? 'Analyse en cours...' 
            : isRecording 
              ? 'Appuie pour arrêter' 
              : 'Appuie pour réciter'
          }
        </p>
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
            </span>
            <span className="text-sm text-destructive">Enregistrement...</span>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <Card 
          variant="progress" 
          className={`
            border-l-4 animate-slide-up
            ${feedback.status === 'success' || feedback.status === 'correct' ? 'border-l-primary' : 'border-l-gold-warm'}
          `}
        >
          <CardContent className="py-5">
            <div className="flex items-start gap-4">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                ${feedback.status === 'success' || feedback.status === 'correct' ? 'bg-primary/10' : 'bg-gold-warm/10'}
              `}>
                {feedback.status === 'success' || feedback.status === 'correct' ? (
                  <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gold-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h4 className={`font-semibold text-lg ${feedback.status === 'success' || feedback.status === 'correct' ? 'text-primary' : 'text-gold-warm'}`}>
                  {feedback.status === 'success' || feedback.status === 'correct' ? 'Excellent !' : 'À revoir'}
                </h4>
                <p className="text-foreground mt-1">{feedback.message}</p>
                {feedback.details && (
                  <p className="text-sm text-muted-foreground mt-2">{feedback.details}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" disabled={currentVerse === 1}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Précédent
        </Button>
        <Button variant="default" disabled={currentVerse === totalVerses}>
          Suivant
          <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Button>
      </div>
    </div>
  );
};
