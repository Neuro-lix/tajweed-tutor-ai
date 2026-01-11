import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  streakStartDate: string | null;
}

interface UserStreakRow {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
  streak_start_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useStreaks = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    streakStartDate: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchStreakData = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_streaks' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const row = data as unknown as UserStreakRow;
        setStreakData({
          currentStreak: row.current_streak,
          longestStreak: row.longest_streak,
          lastPracticeDate: row.last_practice_date,
          streakStartDate: row.streak_start_date,
        });
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  const recordPractice = async (): Promise<{ 
    newStreak: number; 
    isNewDay: boolean;
    streakBroken: boolean;
  }> => {
    if (!user) return { newStreak: 0, isNewDay: false, streakBroken: false };

    const today = new Date().toISOString().split('T')[0];
    const lastPractice = streakData.lastPracticeDate;
    
    let newStreak = streakData.currentStreak;
    let longestStreak = streakData.longestStreak;
    let streakStartDate = streakData.streakStartDate;
    let isNewDay = false;
    let streakBroken = false;

    if (!lastPractice) {
      // First ever practice
      newStreak = 1;
      streakStartDate = today;
      isNewDay = true;
    } else if (lastPractice === today) {
      // Already practiced today
      isNewDay = false;
    } else {
      const lastDate = new Date(lastPractice);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak = streakData.currentStreak + 1;
        isNewDay = true;
      } else {
        // Streak broken
        newStreak = 1;
        streakStartDate = today;
        streakBroken = true;
        isNewDay = true;
      }
    }

    // Update longest streak if needed
    if (newStreak > longestStreak) {
      longestStreak = newStreak;
    }

    try {
      const { error } = await supabase
        .from('user_streaks' as any)
        .upsert({
          user_id: user.id,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_practice_date: today,
          streak_start_date: streakStartDate,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setStreakData({
        currentStreak: newStreak,
        longestStreak,
        lastPracticeDate: today,
        streakStartDate,
      });

      // Show streak notifications
      if (isNewDay && newStreak > 1) {
        toast.success(`🔥 Série de ${newStreak} jours !`, {
          description: 'Continue comme ça !',
        });
      }

      if (streakBroken && streakData.currentStreak > 1) {
        toast.info('📅 Nouvelle série commencée', {
          description: 'Ta série précédente a été interrompue, mais tu repars fort !',
        });
      }

      // Milestone celebrations
      if (newStreak === 7) {
        toast.success('🎉 7 jours consécutifs !', {
          description: 'Tu as débloqué le badge "Régularité" !',
        });
      } else if (newStreak === 30) {
        toast.success('💎 30 jours consécutifs !', {
          description: 'Tu as débloqué le badge "Dévotion" !',
        });
      }

      return { newStreak, isNewDay, streakBroken };
    } catch (error) {
      console.error('Error recording practice:', error);
      return { newStreak: streakData.currentStreak, isNewDay: false, streakBroken: false };
    }
  };

  const checkStreakAtRisk = (): boolean => {
    if (!streakData.lastPracticeDate || streakData.currentStreak === 0) return false;
    
    const today = new Date();
    const lastPractice = new Date(streakData.lastPracticeDate);
    const diffTime = today.getTime() - lastPractice.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    
    // Streak at risk if last practice was more than 20 hours ago
    return diffHours > 20 && diffHours < 48;
  };

  return {
    streakData,
    loading,
    recordPractice,
    checkStreakAtRisk,
    refresh: fetchStreakData,
  };
};
