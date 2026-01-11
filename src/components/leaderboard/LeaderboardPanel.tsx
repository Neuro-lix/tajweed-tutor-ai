import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Trophy, Medal, Award, Crown, Flame, Star, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
  }
};

const getRankBadgeColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0';
    case 2:
      return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 border-0';
    case 3:
      return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0';
    default:
      return '';
  }
};

export const LeaderboardPanel: React.FC = () => {
  const { leaderboard, userRank, loading } = useLeaderboard();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Classement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Classement Communautaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current user rank highlight */}
        {userRank && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  {userRank.rankPosition}
                </div>
                <div>
                  <p className="font-medium text-foreground">Ton classement</p>
                  <p className="text-sm text-muted-foreground">
                    {userRank.totalXp.toLocaleString()} XP • Niveau {userRank.currentLevel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {userRank.currentStreak > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    {userRank.currentStreak}j
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard list */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun récitateur classé</p>
                <p className="text-sm">Sois le premier à rejoindre le classement !</p>
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    entry.isCurrentUser
                      ? 'bg-primary/5 border border-primary/20'
                      : 'bg-muted/30 hover:bg-muted/50'
                  } ${index < 3 ? 'border' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 ${index < 3 ? getRankBadgeColor(index + 1) + ' rounded-full p-1' : ''}`}>
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <p className={`font-medium ${entry.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                        {entry.displayName}
                        {entry.isCurrentUser && <span className="ml-2 text-xs">(Toi)</span>}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Niv. {entry.currentLevel}
                        </span>
                        <span>•</span>
                        <span>{entry.totalVersesMastered} versets</span>
                        {entry.longestStreak > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Flame className="h-3 w-3 text-orange-500" />
                              Record: {entry.longestStreak}j
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{entry.totalXp.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
