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
        // The signup trigger creates the credits row server-side. If it's not
        // there yet (race), retry once after a short delay; never insert from the client.
        await new Promise((r) => setTimeout(r, 500));
        const { data: retryData } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', user.id)
          .maybeSingle();
        if (retryData) {
          setCredits(Number(retryData.credits));
          if (Number(retryData.credits) === 5) setIsFirstLogin(true);
        } else {
          setCredits(0);
        }
      } else {
        setCredits(Number(data.credits));
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

  const deductCredit = useCallback(async (amount = 1): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('deduct_credit', {
        p_user_id: user.id,
        p_amount: amount,
      });

      if (error) throw error;

      if (typeof data === 'number' || typeof data === 'string') {
        const balance = Number(data);
        if (balance < 0) return false;
        setCredits(balance);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deducting credit:', error);
      return false;
    }
  }, [user]);

  const hasCredits = credits !== null && credits > 0;
  const isLowCredits = credits !== null && credits > 0 && credits <= 2;
  const hasCreditsFor = useCallback(
    (amount: number) => credits !== null && credits >= amount,
    [credits],
  );

  return {
    credits,
    loading,
    hasCredits,
    hasCreditsFor,
    isLowCredits,
    isFirstLogin,
    deductCredit,
    refetch: fetchCredits,
  };
};
