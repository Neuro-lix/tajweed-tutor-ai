import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star8Point } from '@/components/decorative/GeometricPattern';

interface ProgressData {
  totalSurahs: number;
  completedSurahs: number;
  totalVerses: number;
  masteredVerses: number;
  reviewNeeded: number;
  totalHours: number;
  currentStreak: number;
}

interface ProgressDashboardProps {
  data: ProgressData;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ data }) => {
  const surahProgress = (data.completedSurahs / data.totalSurahs) * 100;
  const verseProgress = (data.masteredVerses / data.totalVerses) * 100;

  return (
    <div className="space-y-6">
      {/* Main progress card */}
      <Card variant="elevated" className="overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-gold-warm to-primary" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Ta Progression</CardTitle>
            <div className="flex items-center gap-2 text-gold-warm">
              <Star8Point size={20} />
              <span className="font-semibold">{data.currentStreak} jours</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Surah progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Sourates</span>
              <span className="text-sm text-muted-foreground">
                {data.completedSurahs} / {data.totalSurahs}
              </span>
            </div>
            <Progress value={surahProgress} variant="gold" className="h-3" />
          </div>

          {/* Verse progress */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Versets maîtrisés</span>
              <span className="text-sm text-muted-foreground">
                {data.masteredVerses} / {data.totalVerses}
              </span>
            </div>
            <Progress value={verseProgress} variant="success" className="h-3" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{data.totalHours}h</p>
              <p className="text-xs text-muted-foreground">Temps total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gold-warm">{data.completedSurahs}</p>
              <p className="text-xs text-muted-foreground">Sourates</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{data.reviewNeeded}</p>
              <p className="text-xs text-muted-foreground">À revoir</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {data.reviewNeeded > 0 && (
        <Card variant="progress" className="border-l-4 border-l-gold-warm">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-warm/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-gold-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4M12 17h.01" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Révision recommandée</p>
                <p className="text-sm text-muted-foreground">
                  {data.reviewNeeded} versets nécessitent une consolidation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
