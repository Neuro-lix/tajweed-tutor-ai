import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Paddle Billing v2 checkout (carte bancaire).
 *
 * Le token client Paddle est lu depuis `VITE_PADDLE_CLIENT_TOKEN`
 * (token public côté navigateur, commence par `live_...`). Sans lui,
 * les boutons carte restent désactivés.
 * Les crédits sont attribués côté serveur par la fonction `paddle-webhook`
 * à partir du `user_id` transmis dans `customData`.
 */
export const PADDLE_PRICE_IDS: Record<string, string> = {
  starter: 'pri_01kzm74zem2gd72bsd3an0h1vw', // 50 crédits — 1,99 €
  standard: 'pri_01kzm7exmw1w0apnysd76kgszh', // 150 crédits — 4,99 €
  premium: 'pri_01kzm7m6rwbdfks53gns8sjq4e', // 400 crédits — 9,99 €
};

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string; pwCustomer?: { id?: string; email?: string } }) => void;
      Checkout: {
        open: (opts: {
          items: { priceId: string; quantity: number }[];
          successUrl?: string;
          customer?: { email?: string };
          customData?: Record<string, string>;
        }) => void;
      };
    };
  }
}

export const usePaddleCheckout = () => {
  const { user } = useAuth();
  const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
  const [ready, setReady] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('paddle_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) setCustomerId(data?.paddle_customer_id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!clientToken) return;
    const init = () => {
      if (!window.Paddle) return;
      window.Paddle.Initialize({
        token: clientToken,
        ...(customerId
          ? { pwCustomer: { id: customerId } }
          : user?.email
            ? { pwCustomer: { email: user.email } }
            : {}),
      });
      setReady(true);
    };
    const existing = document.getElementById('paddle-js');
    if (existing) {
      init();
      return;
    }
    const script = document.createElement('script');
    script.id = 'paddle-js';
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [clientToken, customerId, user?.email]);

  const openCheckout = useCallback(
    (packId: string) => {
      const priceId = PADDLE_PRICE_IDS[packId];
      if (!priceId || !ready || !window.Paddle) return false;
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        successUrl: `${window.location.origin}/shop/success?pack=${packId}`,
        ...(user?.email ? { customer: { email: user.email } } : {}),
        customData: user ? { user_id: user.id } : undefined,
      });
      return true;
    },
    [ready, user],
  );

  return { ready, configured: Boolean(clientToken), openCheckout };
};
