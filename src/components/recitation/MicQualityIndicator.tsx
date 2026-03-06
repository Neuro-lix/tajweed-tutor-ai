import React, { useMemo } from 'react';
import { AlertCircle, Mic } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MicQualityIndicatorProps {
  level: number;
  peak: number;
  isRecording: boolean;
}

export const MicQualityIndicator: React.FC<MicQualityIndicatorProps> = ({
  level, peak, isRecording,
}) => {
  const { t } = useLanguage();

  const status = useMemo<{ label: string; color: string; hint: string | null }>(() => {
    if (!isRecording) {
      return { label: t.micReady, color: 'text-muted-foreground', hint: null };
    }
    if (peak >= 0.98) {
      return { label: t.micClipping, color: 'text-destructive', hint: t.micClippingHint };
    }
    if (level < 0.05) {
      return { label: t.micSilence, color: 'text-amber-500', hint: t.micSilenceHint };
    }
    if (level < 0.15) {
      return { label: t.micWeak, color: 'text-amber-500', hint: t.micWeakHint };
    }
    return { label: t.micGood, color: 'text-primary', hint: null };
  }, [level, peak, isRecording, t]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Mic className={`h-4 w-4 ${status.color}`} />
      <span className={status.color}>{status.label}</span>
      {status.hint && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          {status.hint}
        </span>
      )}
    </div>
  );
};
