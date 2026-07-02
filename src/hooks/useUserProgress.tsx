import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface UserProgress {
  totalHours: number;
  currentStreak: number;
  lastSessionDate: string | null;
}

interface SurahProgress {
  surahNumber: number;
  status: 'not_started' | 'in_progress' | 'mastered';
  masteredVerses: number;
  totalVerses: number;
}

interface Correction {
  id: string;
  surahNumber: number;
  verseNumber: number;
  word: string;
  ruleType: string;
  ruleDescription: string;
  correctionExample: string | null;
  severity: string | null;
  isResolved: boolean;
  createdAt: string;
}

interface Profile {
  fullName: string | null;
  sessionType: 'male' | 'female' | null;
  selectedQiraat: string;
}

export const useUserProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [surahProgress, setSurahProgress] = useState<SurahProgress[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[useUserProgress] Profile fetch error:', profileError);
      }

      if (profileData) {
        setProfile({
          fullName: profileData.full_name,
          sessionType: profileData.session_type as 'male' | 'female' | null,
          selectedQiraat: profileData.selected_qiraat || 'hafs_asim',
        });
      }

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('[useUserProgress] Progress fetch error:', progressError);
      }

      if (progressData) {
        setProgress({
          totalHours: Number(progressData.total_hours) || 0,
          currentStreak: progressData.current_streak || 0,
          lastSessionDate: progressData.last_session_date,
        });
      }

      // Fetch surah progress
      const { data: surahData, error: surahError } = await supabase
        .from('surah_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('surah_number', { ascending: true });

      if (surahError) {
        console.error('[useUserProgress] Surah progress fetch error:', surahError);
      }

      if (surahData) {
        setSurahProgress(
          surahData.map((s) => ({
            surahNumber: s.surah_number,
            status: s.status as 'not_started' | 'in_progress' | 'mastered',
            masteredVerses: s.mastered_verses || 0,
            totalVerses: s.total_verses,
          }))
        );
      }

      // Fetch corrections
      const { data: correctionsData, error: correctionsError } = await supabase
        .from('corrections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (correctionsError) {
        console.error('[useUserProgress] Corrections fetch error:', correctionsError);
      }

      if (correctionsData) {
        setCorrections(
          correctionsData.map((c) => ({
            id: c.id,
            surahNumber: c.surah_number,
            verseNumber: c.verse_number,
            word: c.word,
            ruleType: c.rule_type,
            ruleDescription: c.rule_description,
            correctionExample: (c as any).correction_example ?? null,
            severity: (c as any).severity ?? null,
            isResolved: c.is_resolved || false,
            createdAt: c.created_at,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.sessionType !== undefined) updateData.session_type = updates.sessionType;
      if (updates.selectedQiraat !== undefined) updateData.selected_qiraat = updates.selectedQiraat as any;
      if (updates.fullName !== undefined) updateData.full_name = updates.fullName;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Profil mis à jour",
        description: "Vos préférences ont été enregistrées.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    }
  };

  const addCorrection = async (correction: Omit<Correction, 'id' | 'isResolved' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('corrections')
        .insert({
          user_id: user.id,
          surah_number: correction.surahNumber,
          verse_number: correction.verseNumber,
          word: correction.word,
          rule_type: correction.ruleType,
          rule_description: correction.ruleDescription,
          correction_example: correction.correctionExample ?? null,
          severity: correction.severity ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCorrections((prev) => [
          {
            id: data.id,
            surahNumber: data.surah_number,
            verseNumber: data.verse_number,
            word: data.word,
            ruleType: data.rule_type,
            ruleDescription: data.rule_description,
            correctionExample: (data as any).correction_example ?? null,
            severity: (data as any).severity ?? null,
            isResolved: false,
            createdAt: data.created_at,
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error('Error adding correction:', error);
    }
  };

  const resolveCorrection = async (correctionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('corrections')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', correctionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setCorrections((prev) => prev.filter((c) => c.id !== correctionId));
      toast({
        title: "Correction résolue",
        description: "Bravo pour ta persévérance !",
      });
    } catch (error) {
      console.error('Error resolving correction:', error);
    }
  };

  return {
    loading,
    progress,
    surahProgress,
    corrections,
    profile,
    updateProfile,
    addCorrection,
    resolveCorrection,
    refetch: fetchUserData,
  };
};
