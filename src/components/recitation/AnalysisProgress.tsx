import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  AudioLines, 
  Brain, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type AnalysisStep = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'generating' | 'done' | 'error';

interface AnalysisProgressProps {
  currentStep: AnalysisStep;
  transcriptionFailed?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  currentStep,
  transcriptionFailed,
  errorMessage,
  onRetry,
}) => {
  const { t } = useLanguage();

  const steps = [
    { id: 'uploading', label: t.uploadingAudio, icon: Upload },
    { id: 'transcribing', label: t.transcribingAudio, icon: AudioLines },
    { id: 'analyzing', label: t.analyzingTajweed, icon: Brain },
    { id: 'generating', label: t.generatingReport, icon: FileText },
  ];

  const getStepIndex = (step: AnalysisStep): number => {
    const index = steps.findIndex(s => s.id === step);
    return index >= 0 ? index : -1;
  };

  const currentIndex = getStepIndex(currentStep);
  const progressPercent = currentStep === 'done' 
    ? 100 
    : currentStep === 'error' 
      ? (currentIndex / steps.length) * 100
      : ((currentIndex + 0.5) / steps.length) * 100;

  if (currentStep === 'idle') return null;

  return (
    <Card className="mt-4 animate-fade-in">
      <CardContent className="py-4 space-y-4">
        {/* Progress bar */}
        <Progress value={progressPercent} className="h-2" />

        {/* Steps */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isComplete = currentIndex > index || currentStep === 'done';
            const isFailed = step.id === 'transcribing' && transcriptionFailed;

            return (
              <div
                key={step.id}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                  ${isActive ? 'bg-primary/10' : ''}
                  ${isComplete ? 'opacity-100' : 'opacity-50'}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${isComplete ? 'bg-primary text-primary-foreground' : 
                    isFailed ? 'bg-destructive/20 text-destructive' :
                    isActive ? 'bg-primary/20 text-primary' : 'bg-muted'}
                `}>
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isFailed ? (
                    <XCircle className="w-4 h-4" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-[10px] text-center leading-tight ${
                  isActive ? 'text-primary font-medium' : 
                  isFailed ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {isFailed ? t.transcriptionFailed : step.label.replace('...', '')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error state */}
        {currentStep === 'error' && errorMessage && (
          <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{errorMessage}</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                {t.retrying.replace('...', '')}
              </button>
            )}
          </div>
        )}

        {/* Transcription warning */}
        {transcriptionFailed && currentStep !== 'error' && (
          <p className="text-xs text-amber-600 text-center">
            ⚠️ Transcription audio échouée. Analyse basée sur le texte attendu.
          </p>
        )}

        {/* Done state */}
        {currentStep === 'done' && (
          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Analyse terminée</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
