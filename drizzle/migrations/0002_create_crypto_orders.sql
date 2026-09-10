CREATE TABLE public.crypto_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  total_credits integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

GRANT SELECT ON public.crypto_orders TO authenticated;
GRANT ALL ON public.crypto_orders TO service_role;

ALTER TABLE public.crypto_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crypto orders"
ON public.crypto_orders FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_crypto_orders_user ON public.crypto_orders(user_id, created_at DESC);