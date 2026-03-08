import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: inserted, error: insertError } = await supabase
          .from('user_credits')
          .insert({ user_id: user.id, credits: 5 })
          .select('credits')
          .single();

        if (insertError) {
          const { data: retryData } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', user.id)
            .single();
          setCredits(retryData?.credits ?? 0);
        } else {
          setCredits(inserted.credits);
          setIsFirstLogin(true);
          toast.success('🎉 5 crédits offerts pour démarrer !');
        }
      } else {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const deductCredit = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('deduct_credit', {
        p_user_id: user.id,
      });

      if (error) throw error;

      if (typeof data === 'number') {
        setCredits(data);
        return data >= 0;
      }
      return false;
    } catch (error) {
      console.error('Error deducting credit:', error);
      return false;
    }
  }, [user]);

  const hasCredits = credits !== null && credits > 0;
  const isLowCredits = credits !== null && credits > 0 && credits <= 2;

  return {
    credits,
    loading,
    hasCredits,
    isLowCredits,
    isFirstLogin,
    deductCredit,
    refetch: fetchCredits,
  };
};
