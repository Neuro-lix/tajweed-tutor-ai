import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStreaks } from '@/hooks/useStreaks';
import { Flame, Calendar, Trophy, AlertTriangle, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

interface StreakPanelProps {
  onStreakUpdate?: (streak: number) => void;
}

export const StreakPanel: React.FC<StreakPanelProps> = ({ onStreakUpdate }) => {
  const { t } = useLanguage();
  const { streakData, loading, checkStreakAtRisk } = useStreaks();
  const isAtRisk = checkStreakAtRisk();

  const milestones = [
    { days: 7, badge: '🔥', unlocked: streakData.currentStreak >= 7 },
    { days: 30, badge: '💎', unlocked: streakData.currentStreak >= 30 },
    { days: 100, badge: '👑', unlocked: streakData.currentStreak >= 100 },
    { days: 365, badge: '🌟', unlocked: streakData.currentStreak >= 365 },
  ];

  const nextMilestone = milestones.find(m => !m.unlocked);
  const progressToNext = nextMilestone ? (streakData.currentStreak / nextMilestone.days) * 100 : 100;

  useEffect(() => {
    if (onStreakUpdate) onStreakUpdate(streakData.currentStreak);
  }, [streakData.currentStreak, onStreakUpdate]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            {t.streakCurrentSeries}
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className={isAtRisk ? 'border-orange-500/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Flame className={`h-5 w-5 ${streakData.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            {t.streakCurrentSeries}
          </span>
          {isAtRisk && (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {t.streakMaintain}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2">
            {streakData.currentStreak > 0 && <Flame className="h-8 w-8 text-orange-500 animate-pulse" />}
            <span className="text-5xl font-bold text-foreground">{streakData.currentStreak}</span>
            <span className="text-xl text-muted-foreground">{t.streakDays}</span>
          </div>
          {streakData.longestStreak > streakData.currentStreak && (
            <p className="text-sm text-muted-foreground mt-2">
              <Trophy className="h-4 w-4 inline mr-1" />
              {t.streakRecord} : {streakData.longestStreak} {t.streakDays}
            </p>
          )}
          {streakData.currentStreak === streakData.longestStreak && streakData.currentStreak > 0 && (
            <Badge className="mt-2 bg-gradient-to-r from-yellow-400 to-amber-500">
              <Zap className="h-3 w-3 mr-1" />
              {t.streakNewRecord}
            </Badge>
          )}
        </div>

        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.streakNextBadge}</span>
              <span className="flex items-center gap-1">
                <span>{nextMilestone.badge}</span>
                <span className="text-muted-foreground">({nextMilestone.days}j)</span>
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {t.streakStillXDays} {nextMilestone.days - streakData.currentStreak} {t.streakDays}
            </p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 pt-2">
          {milestones.map(milestone => (
            <div key={milestone.days} className={`text-center p-2 rounded-lg ${milestone.unlocked ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30 opacity-50'}`}>
              <div className="text-2xl">{milestone.badge}</div>
              <p className="text-xs font-medium mt-1">{milestone.days}j</p>
            </div>
          ))}
        </div>

        {streakData.lastPracticeDate && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Calendar className="h-3 w-3" />
            <span>{t.streakLastPractice} : {new Date(streakData.lastPracticeDate).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
