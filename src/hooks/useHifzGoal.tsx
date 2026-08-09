import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type HifzTargetType = 'surah' | 'verses_per_week';

export interface HifzGoal {
  id: string;
  targetType: HifzTargetType;
  targetValue: number;
  targetSurah: number | null;
  targetDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface HifzGoalInput {
  targetType: HifzTargetType;
  targetValue: number;
  targetSurah?: number | null;
  targetDate?: string | null;
}

export const useHifzGoal = () => {
  const { user } = useAuth();
  const [goal, setGoal] = useState<HifzGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchGoal = useCallback(async () => {
    if (!user) {
      setGoal(null);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('hifz_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setGoal(
        data
          ? {
              id: data.id,
              targetType: data.target_type as HifzTargetType,
              targetValue: Number(data.target_value),
              targetSurah: data.target_surah,
              targetDate: data.target_date,
              isActive: data.is_active,
              createdAt: data.created_at,
            }
          : null,
      );
    } catch (err) {
      console.error('[hifz] fetch goal failed', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  /** Create a new active goal, deactivating any previous one. */
  const saveGoal = async (input: HifzGoalInput) => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from('hifz_goals')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { error } = await supabase.from('hifz_goals').insert({
        user_id: user.id,
        target_type: input.targetType,
        target_value: input.targetValue,
        target_surah: input.targetSurah ?? null,
        target_date: input.targetDate ?? null,
        is_active: true,
      });
      if (error) throw error;
      toast.success('Objectif de mémorisation enregistré');
      await fetchGoal();
    } catch (err) {
      console.error('[hifz] save goal failed', err);
      toast.error("Impossible d'enregistrer l'objectif");
    } finally {
      setSaving(false);
    }
  };

  const clearGoal = async () => {
    if (!user || !goal) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('hifz_goals')
        .update({ is_active: false })
        .eq('id', goal.id);
      if (error) throw error;
      setGoal(null);
    } catch (err) {
      console.error('[hifz] clear goal failed', err);
    } finally {
      setSaving(false);
    }
  };

  return { goal, loading, saving, saveGoal, clearGoal, refetch: fetchGoal };
};
