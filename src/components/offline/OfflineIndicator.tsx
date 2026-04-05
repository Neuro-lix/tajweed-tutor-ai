import React from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isOfflineReady: boolean;
  cacheStats: {
    verses: number;
    audio: number;
    size: number;
  };
  formatCacheSize: (bytes: number) => string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  isOfflineReady,
  cacheStats,
  formatCacheSize,
}) => {
  const { t } = useLanguage();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="destructive" className="flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        <span className="text-xs">{t.offline}</span>
      </Badge>
      
      {isOfflineReady && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          <span className="text-xs">
            {cacheStats.verses} {t.versesCount} ({formatCacheSize(cacheStats.size)})
          </span>
        </Badge>
      )}
    </div>
  );
};
