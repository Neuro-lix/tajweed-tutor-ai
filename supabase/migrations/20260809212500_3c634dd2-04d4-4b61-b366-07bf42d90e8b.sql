ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT;
CREATE INDEX IF NOT EXISTS profiles_paddle_customer_id_idx ON public.profiles (paddle_customer_id);