import React, { useMemo } from 'react';
import { AlertCircle, Mic } from 'lucide-react';

interface MicQualityIndicatorProps {
  level: number; // 0..1
  peak: number; // 0..1
  isRecording: boolean;
}

export const MicQualityIndicator: React.FC<MicQualityIndicatorProps> = ({
  level,
  peak,
  isRecording,
}) => {
  const status = useMemo<{ label: string; color: string; hint: string | null }>(() => {
    if (!isRecording) {
      return { label: 'Prêt', color: 'text-muted-foreground', hint: null };
    }

    if (peak >= 0.98) {
      return { label: 'Clipping !', color: 'text-destructive', hint: 'Éloigne le micro, volume trop fort.' };
    }

    if (level < 0.05) {
      return { label: 'Silence', color: 'text-amber-500', hint: 'Parle plus fort ou rapproche le micro.' };
    }

    if (level < 0.15) {
      return { label: 'Faible', color: 'text-amber-500', hint: 'Augmente légèrement le volume.' };
    }

    return { label: 'Bon', color: 'text-primary', hint: null };
  }, [level, peak, isRecording]);

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
