import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  earnedAt: Date;
}

export interface UserLevel {
  currentLevel: number;
  experiencePoints: number;
  totalSessions: number;
  totalVersesMastered: number;
  perfectRecitations: number;
}

// Badge definitions
export const BADGES = {
  first_recitation: {
    name: 'Première Récitation',
    description: 'Tu as fait ta première récitation !',
    icon: '🎤',
    xp: 10,
  },
  first_perfect: {
    name: 'Perfection',
    description: 'Première récitation parfaite sans erreur',
    icon: '⭐',
    xp: 50,
  },
  streak_7: {
    name: 'Régularité',
    description: '7 jours consécutifs de pratique',
    icon: '🔥',
    xp: 100,
  },
  streak_30: {
    name: 'Dévotion',
    description: '30 jours consécutifs de pratique',
    icon: '💎',
    xp: 500,
  },
  surah_mastered: {
    name: 'Sourate Maîtrisée',
    description: 'Tu as maîtrisé une sourate complète',
    icon: '📖',
    xp: 200,
  },
  ten_surahs: {
    name: 'Hafiz Débutant',
    description: '10 sourates maîtrisées',
    icon: '🌙',
    xp: 1000,
  },
  hundred_verses: {
    name: 'Centurion',
    description: '100 versets maîtrisés',
    icon: '💯',
    xp: 300,
  },
  review_master: {
    name: 'Réviseur Assidu',
    description: '50 révisions espacées complétées',
    icon: '🔄',
    xp: 250,
  },
};

// Level thresholds
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000,
  17000, 23000, 30000, 40000, 55000, 75000, 100000
];

export const useGamification = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel>({
    currentLevel: 1,
    experiencePoints: 0,
    totalSessions: 0,
    totalVersesMastered: 0,
    perfectRecitations: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculateLevel = (xp: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  };

  const getXpForNextLevel = (level: number): number => {
    if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    return LEVEL_THRESHOLDS[level];
  };

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch achievements
      const { data: achievementsData, error: achError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (achError) throw achError;

      setAchievements((achievementsData || []).map(a => ({
        id: a.id,
        type: a.achievement_type,
        name: a.achievement_name,
        description: a.achievement_description || '',
        earnedAt: new Date(a.earned_at),
      })));

      // Fetch user level
      const { data: levelData, error: levelError } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (levelError && levelError.code !== 'PGRST116') throw levelError;

      if (levelData) {
        setUserLevel({
          currentLevel: levelData.current_level,
          experiencePoints: levelData.experience_points,
          totalSessions: levelData.total_sessions,
          totalVersesMastered: levelData.total_verses_mastered,
          perfectRecitations: levelData.perfect_recitations,
        });
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addXp = async (amount: number) => {
    if (!user) return;

    const newXp = userLevel.experiencePoints + amount;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > userLevel.currentLevel;

    try {
      const { error } = await supabase
        .from('user_levels')
        .upsert({
          user_id: user.id,
          current_level: newLevel,
          experience_points: newXp,
          total_sessions: userLevel.totalSessions,
          total_verses_mastered: userLevel.totalVersesMastered,
          perfect_recitations: userLevel.perfectRecitations,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setUserLevel(prev => ({
        ...prev,
        experiencePoints: newXp,
        currentLevel: newLevel,
      }));

      if (leveledUp) {
        toast.success(`🎉 Niveau ${newLevel} atteint !`, {
          description: 'Continue comme ça !',
        });
      }
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  };

  const awardAchievement = async (type: keyof typeof BADGES) => {
    if (!user) return;
    if (achievements.some(a => a.type === type)) return; // Already earned

    const badge = BADGES[type];

    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_type: type,
          achievement_name: badge.name,
          achievement_description: badge.description,
        });

      if (error) throw error;

      toast.success(`${badge.icon} Badge débloqué: ${badge.name}`, {
        description: badge.description,
      });

      await addXp(badge.xp);
      await fetchData();
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  };

  const recordSession = async (isPerfect: boolean) => {
    if (!user) return;

    const newSessions = userLevel.totalSessions + 1;
    const newPerfect = isPerfect ? userLevel.perfectRecitations + 1 : userLevel.perfectRecitations;

    try {
      await supabase
        .from('user_levels')
        .upsert({
          user_id: user.id,
          current_level: userLevel.currentLevel,
          experience_points: userLevel.experiencePoints,
          total_sessions: newSessions,
          total_verses_mastered: userLevel.totalVersesMastered,
          perfect_recitations: newPerfect,
        }, { onConflict: 'user_id' });

      setUserLevel(prev => ({
        ...prev,
        totalSessions: newSessions,
        perfectRecitations: newPerfect,
      }));

      // Check for achievements
      if (newSessions === 1) {
        await awardAchievement('first_recitation');
      }
      if (isPerfect && newPerfect === 1) {
        await awardAchievement('first_perfect');
      }

      // Add base XP for session
      await addXp(isPerfect ? 25 : 10);
    } catch (error) {
      console.error('Error recording session:', error);
    }
  };

  const recordVerseMastered = async () => {
    if (!user) return;

    const newCount = userLevel.totalVersesMastered + 1;

    try {
      await supabase
        .from('user_levels')
        .upsert({
          user_id: user.id,
          current_level: userLevel.currentLevel,
          experience_points: userLevel.experiencePoints,
          total_sessions: userLevel.totalSessions,
          total_verses_mastered: newCount,
          perfect_recitations: userLevel.perfectRecitations,
        }, { onConflict: 'user_id' });

      setUserLevel(prev => ({
        ...prev,
        totalVersesMastered: newCount,
      }));

      if (newCount === 100) {
        await awardAchievement('hundred_verses');
      }

      await addXp(5);
    } catch (error) {
      console.error('Error recording verse mastery:', error);
    }
  };

  return {
    achievements,
    userLevel,
    loading,
    addXp,
    awardAchievement,
    recordSession,
    recordVerseMastered,
    getXpForNextLevel,
    calculateLevel,
    refresh: fetchData,
  };
};
