import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  totalXp: number;
  currentLevel: number;
  totalVersesMastered: number;
  perfectRecitations: number;
  currentStreak: number;
  longestStreak: number;
  rankPosition: number | null;
  isCurrentUser: boolean;
}

interface LeaderboardRow {
  id: string;
  user_id: string;
  display_name: string;
  total_xp: number;
  current_level: number;
  total_verses_mastered: number;
  perfect_recitations: number;
  current_streak: number;
  longest_streak: number;
  rank_position: number | null;
  updated_at: string;
}

const ANONYMOUS_NAMES = [
  'Récitateur Émérite',
  'Élève Assidu',
  'Hafiz en Devenir',
  'Chercheur de Savoir',
  'Étudiant Dévoué',
  'Murid Sincère',
  'Talib Al-Ilm',
  'Lecteur Persévérant',
  'Voyageur Spirituel',
  'Quran Lover',
];

export const useLeaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const getAnonymousName = (userId: string): string => {
    // Generate consistent anonymous name from user ID
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const index = Math.abs(hash) % ANONYMOUS_NAMES.length;
    const suffix = Math.abs(hash % 1000);
    return `${ANONYMOUS_NAMES[index]} #${suffix}`;
  };

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard' as any)
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(100);

      if (error) throw error;

      const rows = (data || []) as unknown as LeaderboardRow[];
      
      const entries: LeaderboardEntry[] = rows.map((entry, index) => ({
        id: entry.id,
        displayName: entry.display_name || getAnonymousName(entry.user_id),
        totalXp: entry.total_xp,
        currentLevel: entry.current_level,
        totalVersesMastered: entry.total_verses_mastered,
        perfectRecitations: entry.perfect_recitations,
        currentStreak: entry.current_streak,
        longestStreak: entry.longest_streak,
        rankPosition: index + 1,
        isCurrentUser: user?.id === entry.user_id,
      }));

      setLeaderboard(entries);

      // Find current user's rank
      const currentUserEntry = entries.find(e => e.isCurrentUser);
      setUserRank(currentUserEntry || null);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const updateLeaderboardEntry = async (data: {
    totalXp: number;
    currentLevel: number;
    totalVersesMastered: number;
    perfectRecitations: number;
    currentStreak: number;
    longestStreak: number;
  }) => {
    if (!user) return;

    try {
      const displayName = getAnonymousName(user.id);

      const { error } = await supabase
        .from('leaderboard' as any)
        .upsert({
          user_id: user.id,
          display_name: displayName,
          total_xp: data.totalXp,
          current_level: data.currentLevel,
          total_verses_mastered: data.totalVersesMastered,
          perfect_recitations: data.perfectRecitations,
          current_streak: data.currentStreak,
          longest_streak: data.longestStreak,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      await fetchLeaderboard();
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  };

  return {
    leaderboard,
    userRank,
    loading,
    updateLeaderboardEntry,
    refresh: fetchLeaderboard,
  };
};
