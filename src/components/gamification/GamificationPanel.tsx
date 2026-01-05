import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamification, BADGES, Achievement, UserLevel } from '@/hooks/useGamification';
import { Trophy, Star, Flame, Target, Award, Zap } from 'lucide-react';

interface GamificationPanelProps {
  className?: string;
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({ className }) => {
  const { 
    achievements, 
    userLevel, 
    loading, 
    getXpForNextLevel 
  } = useGamification();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  const xpForNext = getXpForNextLevel(userLevel.currentLevel);
  const xpProgress = userLevel.currentLevel > 1 
    ? ((userLevel.experiencePoints - getXpForNextLevel(userLevel.currentLevel - 1)) / 
       (xpForNext - getXpForNextLevel(userLevel.currentLevel - 1))) * 100
    : (userLevel.experiencePoints / xpForNext) * 100;

  const earnedBadgeTypes = achievements.map(a => a.type);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Progression & Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="level" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="level">Niveau</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="level" className="space-y-4 mt-4">
            {/* Level Display */}
            <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-8 w-8 text-primary fill-primary" />
                <span className="text-4xl font-bold text-primary">
                  {userLevel.currentLevel}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Niveau actuel</p>
            </div>

            {/* XP Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expérience</span>
                <span className="font-medium">
                  {userLevel.experiencePoints} / {xpForNext} XP
                </span>
              </div>
              <Progress value={Math.min(xpProgress, 100)} className="h-3" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xl font-bold">{userLevel.totalSessions}</span>
                </div>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xl font-bold">{userLevel.perfectRecitations}</span>
                </div>
                <p className="text-xs text-muted-foreground">Parfaites</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center col-span-2">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-xl font-bold">{userLevel.totalVersesMastered}</span>
                </div>
                <p className="text-xs text-muted-foreground">Versets maîtrisés</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="badges" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(BADGES).map(([key, badge]) => {
                const isEarned = earnedBadgeTypes.includes(key);
                const achievement = achievements.find(a => a.type === key);

                return (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isEarned 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/30 border-muted opacity-50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">
                      {isEarned ? badge.icon : '🔒'}
                    </span>
                    <p className={`text-xs font-medium ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {badge.name}
                    </p>
                    {isEarned && achievement && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(achievement.earnedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <Award className="h-4 w-4 inline mr-1" />
              {achievements.length} / {Object.keys(BADGES).length} badges débloqués
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
