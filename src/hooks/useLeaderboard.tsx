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
  display_name: string | null;
  total_xp: number;
  current_level: number;
  total_verses_mastered: number;
  perfect_recitations: number;
  current_streak: number;
  longest_streak: number;
  is_current_user?: boolean | null;
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
        .from('leaderboard_public' as never)
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(100);

      if (error) throw error;

      const entries: LeaderboardEntry[] = ((data || []) as unknown as LeaderboardRow[]).map((entry, index) => ({
        id: entry.id,
        displayName: entry.display_name || getAnonymousName(entry.id),
        totalXp: entry.total_xp,
        currentLevel: entry.current_level,
        totalVersesMastered: entry.total_verses_mastered,
        perfectRecitations: entry.perfect_recitations,
        currentStreak: entry.current_streak,
        longestStreak: entry.longest_streak,
        rankPosition: index + 1,
        isCurrentUser: !!entry.is_current_user,
      }));

      setLeaderboard(entries);
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
      // Use profile name if available, fallback to anonymous
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const displayName = profileData?.full_name
        ? `${profileData.full_name.split(' ')[0]} ${profileData.full_name.split(' ')[1]?.[0] || ''}.`.trim()
        : getAnonymousName(user.id);

      const { error } = await supabase
        .from('leaderboard')
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
