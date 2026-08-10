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

  // La déduction de crédits est effectuée exclusivement côté serveur
  // (edge functions avec service_role). Le client se contente de rafraîchir
  // le solde, ou de l'appliquer localement si le serveur l'a renvoyé.
  const applyRemainingCredits = useCallback((balance: number | null | undefined) => {
    const num = Number(balance);
    if (balance !== null && balance !== undefined && Number.isFinite(num) && num >= 0) {
      setCredits(num);
      return true;
    }
    return false;
  }, []);

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
    applyRemainingCredits,
    refetch: fetchCredits,
  };
};
