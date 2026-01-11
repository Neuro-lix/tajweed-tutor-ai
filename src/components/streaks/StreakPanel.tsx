import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStreaks } from '@/hooks/useStreaks';
import { Flame, Calendar, Trophy, AlertTriangle, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StreakPanelProps {
  onStreakUpdate?: (streak: number) => void;
}

export const StreakPanel: React.FC<StreakPanelProps> = ({ onStreakUpdate }) => {
  const { streakData, loading, checkStreakAtRisk } = useStreaks();

  const isAtRisk = checkStreakAtRisk();

  // Milestones
  const milestones = [
    { days: 7, badge: 'Régularité', icon: '🔥', unlocked: streakData.currentStreak >= 7 },
    { days: 30, badge: 'Dévotion', icon: '💎', unlocked: streakData.currentStreak >= 30 },
    { days: 100, badge: 'Centurion', icon: '👑', unlocked: streakData.currentStreak >= 100 },
    { days: 365, badge: 'Hafiz Path', icon: '🌟', unlocked: streakData.currentStreak >= 365 },
  ];

  const nextMilestone = milestones.find(m => !m.unlocked);
  const progressToNext = nextMilestone 
    ? (streakData.currentStreak / nextMilestone.days) * 100 
    : 100;

  useEffect(() => {
    if (onStreakUpdate) {
      onStreakUpdate(streakData.currentStreak);
    }
  }, [streakData.currentStreak, onStreakUpdate]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Série en cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isAtRisk ? 'border-orange-500/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Flame className={`h-5 w-5 ${streakData.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            Série en cours
          </span>
          {isAtRisk && (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              À maintenir !
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current streak display */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2">
            {streakData.currentStreak > 0 && (
              <Flame className="h-8 w-8 text-orange-500 animate-pulse" />
            )}
            <span className="text-5xl font-bold text-foreground">
              {streakData.currentStreak}
            </span>
            <span className="text-xl text-muted-foreground">jours</span>
          </div>
          {streakData.longestStreak > streakData.currentStreak && (
            <p className="text-sm text-muted-foreground mt-2">
              <Trophy className="h-4 w-4 inline mr-1" />
              Record : {streakData.longestStreak} jours
            </p>
          )}
          {streakData.currentStreak === streakData.longestStreak && streakData.currentStreak > 0 && (
            <Badge className="mt-2 bg-gradient-to-r from-yellow-400 to-amber-500">
              <Zap className="h-3 w-3 mr-1" />
              Nouveau record !
            </Badge>
          )}
        </div>

        {/* Progress to next milestone */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prochain badge</span>
              <span className="flex items-center gap-1">
                <span>{nextMilestone.icon}</span>
                <span className="font-medium">{nextMilestone.badge}</span>
                <span className="text-muted-foreground">({nextMilestone.days}j)</span>
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Encore {nextMilestone.days - streakData.currentStreak} jour(s)
            </p>
          </div>
        )}

        {/* Milestones grid */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {milestones.map(milestone => (
            <div
              key={milestone.days}
              className={`text-center p-2 rounded-lg ${
                milestone.unlocked 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-muted/30 opacity-50'
              }`}
            >
              <div className="text-2xl">{milestone.icon}</div>
              <p className="text-xs font-medium mt-1">{milestone.days}j</p>
            </div>
          ))}
        </div>

        {/* Streak info */}
        {streakData.lastPracticeDate && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Calendar className="h-3 w-3" />
            <span>Dernière pratique : {new Date(streakData.lastPracticeDate).toLocaleDateString('fr-FR')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
