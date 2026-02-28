import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Download } from 'lucide-react';

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
  // Only show when offline - don't clutter header when online
  if (isOnline) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {!isOnline ? (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          <span className="text-xs">Hors ligne</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="flex items-center gap-1 text-primary">
          <Wifi className="h-3 w-3" />
          <span className="text-xs">En ligne</span>
        </Badge>
      )}
      
      {isOfflineReady && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Download className="h-3 w-3" />
          <span className="text-xs">
            {cacheStats.verses} versets ({formatCacheSize(cacheStats.size)})
          </span>
        </Badge>
      )}
    </div>
  );
};
